from io import StringIO

import pytest
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.utils import timezone

from assessments.models import (
    Assessment,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentTemplate,
    Framework,
)


@pytest.fixture
def template_backed_assessment(make_user, make_org):
    user = make_user(email="backfill-owner@example.com")
    org = make_org(name="Backfill Org", slug="backfill-org")
    framework = Framework.objects.create(name="Backfill Framework", version="1.0")
    template = AssessmentTemplate.objects.create(
        name="Backfill Template",
        slug="backfill-template",
        framework=framework,
        organization=org,
        owner_org=org,
        status=AssessmentTemplate.Status.PUBLISHED,
        version="1.0",
    )
    template_question = AssessmentQuestion.objects.create(
        template=template,
        organization=org,
        text="Does the supplier have a documented policy?",
        category="Governance",
        hierarchy=[{"level": "section", "code": "A", "label": "Governance"}],
        order=1,
        scoring_criteria={"type": "yes_no"},
        external_question_id="BF-1",
    )
    assessment = Assessment.objects.create(
        organization=org,
        template=template,
        framework=framework,
        template_version=template.version,
        start_date=timezone.now(),
        due_date=timezone.now() + timezone.timedelta(days=30),
        created_by=user,
    )
    return assessment, template_question, org, user


@pytest.mark.django_db
class TestBackfillAssessmentQuestionnairesCommand:
    def test_backfills_existing_template_assessment_snapshots_and_responses(
        self,
        template_backed_assessment,
    ):
        assessment, template_question, org, user = template_backed_assessment
        assert assessment.assessment_questions.count() == 0
        assert assessment.responses.count() == 0

        stdout = StringIO()
        call_command("backfill_assessment_questionnaires", stdout=stdout)

        snapshot = AssessmentQuestion.objects.get(assessment=assessment)
        assert snapshot.template is None
        assert snapshot.source_template_question == template_question
        assert snapshot.organization == org
        assert snapshot.text == template_question.text
        assert snapshot.hierarchy == template_question.hierarchy
        assert AssessmentResponse.objects.filter(
            assessment=assessment,
            question=snapshot,
            organization=org,
            created_by=user,
        ).exists()
        assert "scanned=1" in stdout.getvalue()
        assert "questions_created=1" in stdout.getvalue()
        assert "responses_created=1" in stdout.getvalue()
        assert "still_empty=0" in stdout.getvalue()

    def test_backfill_is_idempotent(self, template_backed_assessment):
        assessment, _, _, _ = template_backed_assessment

        call_command("backfill_assessment_questionnaires")
        call_command("backfill_assessment_questionnaires")

        assert assessment.assessment_questions.count() == 1
        snapshot = assessment.assessment_questions.get()
        assert (
            AssessmentResponse.objects.filter(
                assessment=assessment,
                question=snapshot,
            ).count()
            == 1
        )

    def test_backfills_framework_only_assessment_from_framework_categories(
        self,
        make_user,
        make_org,
    ):
        user = make_user(email="framework-only-owner@example.com")
        org = make_org(name="Framework Only Org", slug="framework-only-org")
        framework = Framework.objects.create(
            name="Energy Certification Standard",
            version="2023.1",
            categories={
                "principle_1": "Corporate governance, transparency and ethics",
                "principle_2": "Human rights and community development",
            },
            scoring_methodology={"type": "weighted", "scale": "0-100"},
        )
        assessment = Assessment.objects.create(
            organization=org,
            framework=framework,
            start_date=timezone.now(),
            due_date=timezone.now() + timezone.timedelta(days=30),
            created_by=user,
        )

        call_command("backfill_assessment_questionnaires")

        assessment.refresh_from_db()
        assert assessment.template is not None
        assert assessment.template.framework == framework
        assert assessment.template.assessment_questions.count() == 2
        assert assessment.assessment_questions.count() == 2
        assert (
            AssessmentResponse.objects.filter(
                assessment=assessment,
                question__isnull=False,
            ).count()
            == 2
        )

    def test_dry_run_does_not_write(self, template_backed_assessment):
        assessment, _, _, _ = template_backed_assessment

        stdout = StringIO()
        call_command("backfill_assessment_questionnaires", "--dry-run", stdout=stdout)

        assert assessment.assessment_questions.count() == 0
        assert assessment.responses.count() == 0
        assert "DRY RUN" in stdout.getvalue()
        assert "questions_created=1" in stdout.getvalue()


@pytest.mark.django_db
class TestAssessmentResponseUniqueness:
    def test_one_response_per_assessment_question_is_enforced(
        self,
        template_backed_assessment,
    ):
        assessment, _, org, user = template_backed_assessment
        call_command("backfill_assessment_questionnaires")
        snapshot = assessment.assessment_questions.get()

        assert (
            AssessmentResponse.objects.filter(
                assessment=assessment,
                question=snapshot,
            ).count()
            == 1
        )

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                AssessmentResponse.objects.create(
                    assessment=assessment,
                    organization=org,
                    question=snapshot,
                    created_by=user,
                    answer_text="Duplicate answer",
                    operator_answer="Duplicate answer",
                )

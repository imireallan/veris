"""Tests for assessment template API visibility."""

import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from assessments.models import (
    Assessment,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentTemplate,
    Framework,
)


@pytest.mark.django_db
class TestAssessmentTemplatePublicEndpoint:
    def authenticate_with_org(self, client, user, org):
        refresh = RefreshToken.for_user(user)
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

    def test_public_endpoint_includes_active_org_owned_published_templates(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Imported frameworks create private org-owned templates; they must be selectable."""
        user = make_user(email="template-user@example.com")
        org = make_org(name="Template Org", slug="template-org")
        other_org = make_org(name="Other Template Org", slug="other-template-org")
        make_membership(user=user, organization=org)
        framework = Framework.objects.create(name="Bettercoal", version="2.0")

        public_template = AssessmentTemplate.objects.create(
            name="Global Published Template",
            slug="global-published-template",
            framework=framework,
            is_public=True,
            status=AssessmentTemplate.Status.PUBLISHED,
        )
        org_template = AssessmentTemplate.objects.create(
            name="Org Imported Bettercoal Template",
            slug="org-imported-bettercoal-template",
            framework=framework,
            is_public=False,
            organization=org,
            owner_org=org,
            status=AssessmentTemplate.Status.PUBLISHED,
        )
        AssessmentTemplate.objects.create(
            name="Org Draft Template",
            slug="org-draft-template",
            framework=framework,
            is_public=False,
            organization=org,
            owner_org=org,
            status=AssessmentTemplate.Status.DRAFT,
        )
        other_template = AssessmentTemplate.objects.create(
            name="Other Org Published Template",
            slug="other-org-published-template",
            framework=framework,
            is_public=False,
            organization=other_org,
            owner_org=other_org,
            status=AssessmentTemplate.Status.PUBLISHED,
        )

        self.authenticate_with_org(api_factory, user, org)
        response = api_factory.get("/api/templates/public/")

        assert response.status_code == status.HTTP_200_OK
        ids = {item["id"] for item in response.json()}
        assert str(public_template.id) in ids
        assert str(org_template.id) in ids
        assert str(other_template.id) not in ids
        assert len(ids) == 2

    def test_instantiate_snapshots_questions_and_responses_use_snapshots(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Assessments freeze copied questions; later template edits do not alter them."""
        user = make_user(email="snapshot-admin@example.com")
        org = make_org(name="Snapshot Org", slug="snapshot-org")
        make_membership(user=user, organization=org, fallback_role="ADMIN")
        framework = Framework.objects.create(name="EO100", version="1.0")
        template = AssessmentTemplate.objects.create(
            name="EO100 v1",
            slug="eo100-v1-snapshot-test",
            framework=framework,
            is_public=False,
            organization=org,
            owner_org=org,
            status=AssessmentTemplate.Status.PUBLISHED,
            version="1.0",
        )
        template_question = AssessmentQuestion.objects.create(
            template=template,
            organization=org,
            text="Does the site have a health and safety policy?",
            category="Health and Safety",
            order=1,
            scoring_criteria={"type": "yes_no"},
            external_question_id="100.1.1.1",
            performance_target_level=1,
        )

        self.authenticate_with_org(api_factory, user, org)
        response = api_factory.post(
            f"/api/templates/{template.id}/instantiate/",
            {
                "organization_id": str(org.id),
                "start_date": "2026-04-01T00:00:00Z",
                "due_date": "2026-05-01T23:59:59Z",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assessment = Assessment.objects.get(id=response.json()["assessment_id"])
        snapshot_question = AssessmentQuestion.objects.get(assessment=assessment)
        assert snapshot_question.template is None
        assert snapshot_question.source_template_question == template_question
        assert (
            snapshot_question.text == "Does the site have a health and safety policy?"
        )

        template_question.text = "Does the site have a documented and board-approved health and safety policy?"
        template_question.save(update_fields=["text"])
        snapshot_question.refresh_from_db()

        assert (
            snapshot_question.text == "Does the site have a health and safety policy?"
        )
        assert AssessmentResponse.objects.filter(
            assessment=assessment,
            question=snapshot_question,
            organization=org,
        ).exists()

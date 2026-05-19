from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q

from assessments.models import Assessment
from assessments.services.questionnaires import (
    ensure_assessment_questionnaire_snapshots,
)


class Command(BaseCommand):
    help = (
        "Backfill frozen questionnaire snapshots and blank responses for "
        "existing template-backed or framework-backed assessments."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be created without writing changes.",
        )

    def handle(self, *args, **options):
        dry_run = bool(options["dry_run"])
        assessments = Assessment.objects.filter(
            Q(template__isnull=False) | Q(framework__isnull=False)
        ).select_related(
            "template",
            "framework",
            "created_by",
        )

        scanned = assessments.count()
        updated = 0
        questions_created = 0
        responses_created = 0
        still_empty = 0

        for assessment in assessments.iterator():
            before_question_count = assessment.assessment_questions.count()
            before_response_count = assessment.responses.filter(
                question__isnull=False,
            ).count()

            if dry_run:
                template = assessment.template
                if not template and assessment.framework_id:
                    template = assessment.framework.templates.filter(
                        status="PUBLISHED",
                    ).first()
                template_question_count = (
                    template.assessment_questions.count() if template else 0
                )
                expected_new_questions = (
                    template_question_count if before_question_count == 0 else 0
                )
                questions_created += expected_new_questions
                responses_created += max(
                    template_question_count - before_response_count,
                    0,
                )
                if template_question_count == 0:
                    still_empty += 1
                if (
                    expected_new_questions
                    or template_question_count > before_response_count
                ):
                    updated += 1
                continue

            with transaction.atomic():
                ensure_assessment_questionnaire_snapshots(
                    assessment,
                    created_by=assessment.created_by,
                )

            after_question_count = assessment.assessment_questions.count()
            after_response_count = assessment.responses.filter(
                question__isnull=False,
            ).count()
            created_questions_for_assessment = max(
                after_question_count - before_question_count,
                0,
            )
            created_responses_for_assessment = max(
                after_response_count - before_response_count,
                0,
            )

            questions_created += created_questions_for_assessment
            responses_created += created_responses_for_assessment
            if created_questions_for_assessment or created_responses_for_assessment:
                updated += 1
            if after_question_count == 0:
                still_empty += 1

        prefix = "DRY RUN: " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}scanned={scanned} updated={updated} "
                f"questions_created={questions_created} "
                f"responses_created={responses_created} still_empty={still_empty}"
            )
        )

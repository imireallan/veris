from django.db import migrations, models
from django.db.models import Count, Q


def dedupe_assessment_question_responses(apps, schema_editor):
    AssessmentResponse = apps.get_model("assessments", "AssessmentResponse")

    duplicate_groups = (
        AssessmentResponse.objects.filter(question__isnull=False)
        .values("assessment_id", "question_id")
        .annotate(total=Count("id"))
        .filter(total__gt=1)
    )

    for group in duplicate_groups:
        responses = list(
            AssessmentResponse.objects.filter(
                assessment_id=group["assessment_id"],
                question_id=group["question_id"],
            ).order_by("created_at", "id")
        )
        if len(responses) <= 1:
            continue

        def response_score(response):
            answer = (response.operator_answer or response.answer_text or "").strip()
            evidence_files = response.evidence_files or []
            return (
                1 if answer else 0,
                1 if evidence_files else 0,
                1 if response.ai_validated else 0,
            )

        keep = max(responses, key=response_score)
        delete_ids = [response.id for response in responses if response.id != keep.id]
        AssessmentResponse.objects.filter(id__in=delete_ids).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0022_fix_assessmentquestion_performance_target_nullable"),
    ]

    operations = [
        migrations.RunPython(
            dedupe_assessment_question_responses,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="assessmentresponse",
            constraint=models.UniqueConstraint(
                fields=("assessment", "question"),
                condition=Q(question__isnull=False),
                name="uniq_assessment_response_per_question",
            ),
        ),
    ]

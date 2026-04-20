import django.db.models.deletion
from django.db import migrations, models


def backfill_organization_fields(apps, schema_editor):
    AssessmentTemplate = apps.get_model("assessments", "AssessmentTemplate")
    AssessmentQuestion = apps.get_model("assessments", "AssessmentQuestion")
    AssessmentResponse = apps.get_model("assessments", "AssessmentResponse")
    UploadedImage = apps.get_model("assessments", "UploadedImage")
    OrganizationMembership = apps.get_model("organizations", "OrganizationMembership")

    for template in AssessmentTemplate.objects.all().iterator():
        if not template.organization_id and template.owner_org_id:
            template.organization_id = template.owner_org_id
            template.save(update_fields=["organization"])

    for question in (
        AssessmentQuestion.objects.select_related("template").all().iterator()
    ):
        if not question.organization_id and question.template_id:
            question.organization_id = (
                question.template.organization_id or question.template.owner_org_id
            )
            question.save(update_fields=["organization"])

    for response in (
        AssessmentResponse.objects.select_related("assessment").all().iterator()
    ):
        if not response.organization_id and response.assessment_id:
            response.organization_id = response.assessment.organization_id
            response.save(update_fields=["organization"])

    for image in UploadedImage.objects.select_related("uploaded_by").all().iterator():
        if image.organization_id or not image.uploaded_by_id:
            continue
        membership = (
            OrganizationMembership.objects.filter(user_id=image.uploaded_by_id)
            .order_by("-is_default", "joined_at")
            .first()
        )
        if membership:
            image.organization_id = membership.organization_id
            image.save(update_fields=["organization"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0007_organizationsettings_organizationterminology_and_more"),
        ("assessments", "0011_sync_unique_together_state"),
    ]

    operations = [
        migrations.AddField(
            model_name="assessmenttemplate",
            name="organization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="assessment_templates",
                to="organizations.organization",
            ),
        ),
        migrations.AddField(
            model_name="assessmentquestion",
            name="organization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="assessment_questions",
                to="organizations.organization",
            ),
        ),
        migrations.AddField(
            model_name="assessmentresponse",
            name="organization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="assessment_responses",
                to="organizations.organization",
            ),
        ),
        migrations.AddField(
            model_name="uploadedimage",
            name="organization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="uploaded_images",
                to="organizations.organization",
            ),
        ),
        migrations.RunPython(backfill_organization_fields, noop_reverse),
    ]

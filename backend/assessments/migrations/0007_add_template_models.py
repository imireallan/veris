# Generated migration for Assessment Template Management (P0)
# Run: python manage.py makemigrations assessments --name add_template_models

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assessments", "0006_add_assessmentquestion_framework_mappings"),
        ("organizations", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        # Step 1: Add new fields to AssessmentTemplate
        migrations.AddField(
            model_name="assessmenttemplate",
            name="slug",
            field=models.SlugField(max_length=200, unique=True, null=True),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="version",
            field=models.CharField(max_length=50, default="1.0.0"),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="version_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="is_public",
            field=models.BooleanField(
                default=False,
                help_text="If True, visible to all organizations. If False, only owner_org can use.",
            ),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="owner_org",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="owned_templates",
                to="organizations.organization",
                help_text="If set, template is scoped to this organization (client-specific).",
            ),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="status",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("DRAFT", "Draft"),
                    ("PUBLISHED", "Published"),
                    ("ARCHIVED", "Archived"),
                ],
                default="DRAFT",
            ),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="published_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="published_by",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="published_templates",
                to="users.user",
            ),
        ),
        migrations.AddField(
            model_name="assessmenttemplate",
            name="created_by",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_templates",
                to="users.user",
            ),
        ),
        # Step 2: Remove old fields
        migrations.RemoveField(
            model_name="assessmenttemplate",
            name="organization",
        ),
        migrations.RemoveField(
            model_name="assessmenttemplate",
            name="questions",
        ),
        migrations.RemoveField(
            model_name="assessmenttemplate",
            name="is_system",
        ),
        # Step 3: Update Meta options - clear unique_together since organization field is removed
        # Use SeparateDatabaseAndState because unique_together change would try to touch DB
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterModelOptions(
                    name="assessmenttemplate",
                    options={
                        "ordering": ["-created_at"],
                        "unique_together": set(),  # Cleared - was ("organization", "name")
                    },
                ),
            ],
            database_operations=[],  # No DB changes - constraint already gone when organization field removed
        ),
        # Step 4: Add indexes
        migrations.AddIndex(
            model_name="assessmenttemplate",
            index=models.Index(
                fields=["is_public", "status"], name="assessments_is_pub_status_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="assessmenttemplate",
            index=models.Index(
                fields=["owner_org", "status"], name="assessments_owner_org_status_idx"
            ),
        ),
        # Step 5: Add template_version to Assessment (template FK already exists from initial)
        # Skip template FK - it already exists
        migrations.AddField(
            model_name="assessment",
            name="template_version",
            field=models.CharField(
                max_length=50,
                blank=True,
                default="",
                help_text="Snapshot of template version at instantiation time.",
            ),
        ),
    ]

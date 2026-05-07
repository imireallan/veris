from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0019_workflowstep_workflowtemplate_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE workflow_templates
            ADD COLUMN IF NOT EXISTS role_mapping jsonb NOT NULL DEFAULT '{}'::jsonb;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

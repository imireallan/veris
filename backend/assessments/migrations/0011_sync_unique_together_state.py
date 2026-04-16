# Final migration to sync Django's state with reality.
# The database constraint was already dropped. This just updates Django's model state.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("assessments", "0010_noop_unique_together"),
    ]

    operations = [
        # SeparateDatabaseAndState: Update Django's state without touching DB
        migrations.SeparateDatabaseAndState(
            state_operations=[
                # Tell Django the model has no unique_together
                # This prevents it from generating AlterUniqueTogether operations
                migrations.AlterModelOptions(
                    name="assessmenttemplate",
                    options={
                        "ordering": ["-created_at"],
                        "db_table": "assessment_templates",
                    },
                ),
            ],
            database_operations=[],  # DB already correct - no changes needed
        ),
    ]

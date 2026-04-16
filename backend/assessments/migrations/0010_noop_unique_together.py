# Manually created migration to sync Django's state with the database.
# The actual constraint was dropped in 0009, but Django still thinks it exists.
# This migration updates Django's internal state without touching the DB.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("assessments", "0009_alter_assessmenttemplate_unique_together"),
    ]

    operations = [
        # SeparateDatabaseAndState lets us update Django's model state
        # without running database operations that would fail.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                # This tells Django: "The model now has no unique_together"
                migrations.AlterModelOptions(
                    name="assessmenttemplate",
                    options={
                        "ordering": ["-created_at"],
                    },
                ),
            ],
            database_operations=[],  # No DB operations - already done in 0009
        ),
    ]

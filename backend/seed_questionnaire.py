import os

import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from assessments.models import (
    Assessment,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentTemplate,
)
from organizations.models import Organization


def seed_data():
    print("Seeding sustainability data...")

    # Organization
    org, _ = Organization.objects.get_or_create(
        name="EcoCorp Global", slug="ecocorp-global"
    )

    # Template
    template, _ = AssessmentTemplate.objects.get_or_create(
        name="Sustainability Baseline 2026",
        organization=org,
        description="Generic sustainability baseline assessment",
    )

    # Questions
    questions_data = [
        {
            "text": "Do you have a formal sustainability policy?",
            "category": "Governance",
            "scoring_criteria": {"Yes": 10, "No": 0},
        },
        {
            "text": "How do you measure carbon emissions?",
            "category": "Environmental",
            "scoring_criteria": {"Detailed": 10, "Basic": 5, "None": 0},
        },
        {
            "text": "Do you report on labor practices?",
            "category": "Social",
            "scoring_criteria": {"Public": 10, "Internal": 5, "None": 0},
        },
    ]

    created_questions = []
    for q_data in questions_data:
        q, _ = AssessmentQuestion.objects.get_or_create(
            template=template,
            text=q_data["text"],
            category=q_data["category"],
            scoring_criteria=q_data["scoring_criteria"],
        )
        created_questions.append(q)

    # Assessment
    # Using the ID the user mentioned: d22d9835-9421-4f79-b00d-ed879a7aa5ac
    assessment_id = "d22d9835-9421-4f79-b00d-ed879a7aa5ac"
    import datetime

    assessment, _ = Assessment.objects.get_or_create(
        id=assessment_id,
        defaults={
            "template": template,
            "organization": org,
            "status": "IN_PROGRESS",
            "start_date": datetime.datetime.now(),
            "due_date": datetime.datetime.now() + datetime.timedelta(days=30),
        },
    )

    # Create a response for the first question to test AI suggestions
    if created_questions:
        q = created_questions[0]
        AssessmentResponse.objects.get_or_create(
            assessment=assessment,
            question=q,
            defaults={
                "answer_text": "We are currently drafting the policy.",
                "ai_score_suggestion": 5.0,
                "ai_feedback": "The answer indicates a policy is in progress but not yet finalized. Suggested score: 5/10.",
            },
        )

    print(f"Seeding complete. Assessment ID: {assessment_id}")
    print(f"Organization ID: {org.id}")


if __name__ == "__main__":
    seed_data()

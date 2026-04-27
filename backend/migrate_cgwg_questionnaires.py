"""
Migrate CGWG questionnaires from legacy cgwg-backend to Veris.

Usage:
    python manage.py shell < backend/migrate_cgwg_questionnaires.py

Prerequisites:
    1. Export data from cgwg-backend:
        - Questionnaire + Section + Question + ChoiceSet + Choice
        - Response + Answer + Evidence

    2. Place JSON exports in backend/cgwg_exports/
"""

import json
from datetime import timedelta
from pathlib import Path

from django.utils import timezone


def migrate_cgwg_questionnaires():
    """Main migration function."""

    from assessments.models import (
        AssessmentQuestion,
        AssessmentTemplate,
        Framework,
        SAQResponse,
        SAQToken,
    )

    export_dir = Path(__file__).parent / "cgwg_exports"

    if not export_dir.exists():
        print(f"❌ Export directory not found: {export_dir}")
        print("Please export data from cgwg-backend first.")
        return

    # Load exports
    print("Loading CGWG exports...")
    questionnaires_data = load_json(export_dir / "questionnaires.json")
    questions_data = load_json(export_dir / "questions.json")
    responses_data = load_json(export_dir / "responses.json")
    answers_data = load_json(export_dir / "answers.json")

    # Step 1: Create Framework
    print("\n✓ Creating CGWG Framework...")
    framework, created = Framework.objects.get_or_create(
        slug="cgwg-saq",
        defaults={
            "name": "CGWG Supplier Assessment Questionnaire",
            "version": "2024",
            "description": "Coloured Gemstone Working Group - Supplier Self-Assessment",
            "categories": {"Social": {}, "Environmental": {}, "Governance": {}},
        },
    )
    print(f"  Framework: {framework.name}")

    # Step 2: Migrate Questionnaires → Templates
    print("\n✓ Migrating Questionnaires to Templates...")
    template_map = {}  # old_id → new_template

    for q_data in questionnaires_data:
        template = AssessmentTemplate.objects.create(
            name=q_data["name"],
            slug=f"cgwg-{q_data['key']}",
            description=q_data.get("description", ""),
            framework=framework,
            version="1.0.0",
            is_public=False,
            owner_org=None,  # Global template
            status=AssessmentTemplate.Status.PUBLISHED,
        )
        template_map[q_data["id"]] = template
        print(f"  {q_data['name']} → {template.slug}")

    # Step 3: Migrate Questions → AssessmentQuestions
    print("\n✓ Migrating Questions...")
    question_map = {}  # old_id → new_question

    for q_data in questions_data:
        old_questionnaire_id = q_data["questionnaire"]
        if old_questionnaire_id not in template_map:
            print(f"  ⚠️  Skipping question {q_data['id']} - questionnaire not found")
            continue

        template = template_map[old_questionnaire_id]

        # Map question type
        question_type = q_data.get("question_type", "text")
        scoring_criteria = {
            "type": question_type,
            "required": q_data.get("is_required", True),
            "evidence_required": q_data.get("is_evidence_required", False),
        }

        # Map choice set if exists
        if q_data.get("choice_set"):
            scoring_criteria["choices"] = load_choice_set(q_data["choice_set"])

        question = AssessmentQuestion.objects.create(
            template=template,
            text=q_data["text"],
            order=q_data.get("sequence_number", 0),
            category=q_data.get("category", "General"),
            scoring_criteria=scoring_criteria,
            is_required=q_data.get("is_required", True),
            framework_mappings=[],
        )
        question_map[q_data["id"]] = question

    print(f"  Migrated {len(question_map)} questions")

    # Step 4: Migrate Responses → SAQTokens
    print("\n✓ Migrating Responses to SAQTokens...")
    token_map = {}  # old_id → new_token

    for r_data in responses_data:
        old_questionnaire_id = r_data["questionnaire"]
        if old_questionnaire_id not in template_map:
            print(f"  ⚠️  Skipping response {r_data['id']} - questionnaire not found")
            continue

        template = template_map[old_questionnaire_id]

        # Extract supplier info from answers
        company_name = extract_answer_value(r_data.get("answers", []), "company_name")
        contact_person = extract_answer_value(
            r_data.get("answers", []), "name_of_person"
        )

        # Calculate expiry (30 days from created_at or now)
        created_at = parse_datetime(r_data.get("created_at"))
        expires_at = (
            created_at + timedelta(days=30)
            if created_at
            else timezone.now() + timedelta(days=30)
        )

        token = SAQToken.objects.create(
            template=template,
            supplier_name=contact_person or "Unknown",
            supplier_email="migrated@example.com",  # Need to extract from user
            site_name="Migrated Site",
            company_name=company_name or "",
            contact_person=contact_person or "",
            status=(
                SAQToken.Status.SUBMITTED
                if r_data.get("is_submitted")
                else SAQToken.Status.PENDING
            ),
            expires_at=expires_at,
            submitted_at=parse_datetime(r_data.get("submitted_at")),
            legacy_response_id=r_data["id"],
        )
        token_map[r_data["id"]] = token

    print(f"  Migrated {len(token_map)} tokens")

    # Step 5: Migrate Answers → SAQResponses
    print("\n✓ Migrating Answers to SAQResponses...")

    for a_data in answers_data:
        old_response_id = a_data["response"]
        old_question_id = a_data["question"]

        if old_response_id not in token_map:
            continue
        if old_question_id not in question_map:
            continue

        token = token_map[old_response_id]
        question = question_map[old_question_id]

        # Map answer based on question type
        answer_choice = ""
        answer_text = a_data.get("value", "")

        # Handle select_one / Yes/No
        if question.scoring_criteria.get("type") == "select_one":
            answer_choice = answer_text
            answer_text = ""

        SAQResponse.objects.create(
            token=token,
            question=question,
            answer_choice=answer_choice,
            answer_text=answer_text,
            comments=a_data.get("comments", ""),
            legacy_answer_id=a_data["id"],
        )

    print(f"  Migrated {len(answers_data)} answers")

    # Summary
    print("\n✅ Migration complete!")
    print("  Frameworks: 1")
    print(f"  Templates: {len(template_map)}")
    print(f"  Questions: {len(question_map)}")
    print(f"  SAQ Tokens: {len(token_map)}")
    print(f"  SAQ Responses: {SAQResponse.objects.count()}")


def load_json(path: Path):
    """Load JSON file."""
    if not path.exists():
        print(f"⚠️  File not found: {path}")
        return []

    with open(path, "r") as f:
        return json.load(f)


def load_choice_set(choice_set_id):
    """Load choice set data."""
    # TODO: Implement based on export structure
    return []


def extract_answer_value(answers: list, label: str):
    """Extract answer value by label."""
    for answer in answers:
        if answer.get("question_label") == label:
            return answer.get("value", "")
    return ""


def parse_datetime(dt_str):
    """Parse datetime string."""
    if not dt_str:
        return None
    try:
        return timezone.datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None


if __name__ == "__main__":
    migrate_cgwg_questionnaires()

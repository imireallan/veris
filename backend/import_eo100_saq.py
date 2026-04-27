"""
Import EO100 SAQ questions from legacy TDi backend.

Usage:
    python manage.py shell < backend/import_eo100_saq.py

Prerequisites:
    1. Export QuestionDefinition from eo100_api:
        python manage.py shell -c "
        from eo100.models import QuestionDefinition
        import json
        data = list(QuestionDefinition.objects.values())
        with open('eo100_questions.json', 'w') as f:
            json.dump(data, f)
        "

    2. Place eo100_questions.json in backend/eo100_exports/
"""

import json
from pathlib import Path

from django.utils import timezone


def import_eo100_saq():
    """Main import function."""

    from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework

    export_dir = Path(__file__).parent / "eo100_exports"

    if not export_dir.exists():
        print(f"❌ Export directory not found: {export_dir}")
        print("Please export QuestionDefinition from eo100_api first.")
        return

    # EO100 supplements
    supplements = {
        100: ("DEFAULT", "SAQ_Default.json"),
        101: ("PROCESSING", "SAQ_Processing.json"),
        102: ("PRODUCTION", "SAQ_Production.json"),
        103: ("TRANSMISSION_STORAGE", "SAQ_Transmission_and_Storage.json"),
    }

    # Step 1: Create EO100 Framework
    print("\n✓ Creating EO100 Framework...")
    framework, created = Framework.objects.get_or_create(
        slug="eo100-standard",
        defaults={
            "name": "EO100 Standard",
            "version": "2024",
            "description": "Energy Operations 100 - Sustainable Oil & Gas Standard",
            "categories": {
                "Principle 1": "Ethics & Compliance",
                "Principle 2": "Transparency & Accountability",
                "Principle 3": "Community Engagement",
                "Principle 4": "Indigenous Peoples' Rights",
                "Principle 5": "Labor Rights",
                "Principle 6": "Health & Safety",
                "Principle 7": "Environment",
                "Principle 8": "Climate Change",
                "Principle 9": "Biodiversity",
                "Principle 10": "Decommissioning",
            },
            "scoring_methodology": {
                "PT1": 33,
                "PT2": 66,
                "PT3": 100,
                "type": "performance_target",
            },
            "metadata": {
                "supplements": [100, 101, 102, 103],
                "principles": 10,
                "performance_targets": 3,
            },
        },
    )
    print(f"  Framework: {framework.name}")

    # Step 2: Import each supplement
    for supplement_id, (supplement_type, filename) in supplements.items():
        print(f"\n{'='*60}")
        print(f"Importing {supplement_type} ({supplement_id})...")
        print(f"{'='*60}")

        filepath = export_dir / filename
        if not filepath.exists():
            print(f"  ⚠️  Skipping {filename} - file not found")
            continue

        questions_data = load_json(filepath)

        # Create template for this supplement
        template = AssessmentTemplate.objects.create(
            name=f"EO100 SAQ - {supplement_type.title().replace('_', ' ')}",
            slug=f"eo100-{supplement_type.lower()}",
            description=f"EO100 Supplier Assessment Questionnaire - {supplement_type} supplement",
            framework=framework,
            supplement_type=getattr(AssessmentTemplate.SupplementType, supplement_type),
            version="1.0.0",
            is_public=True,
            owner_org=None,
            status=AssessmentTemplate.Status.DRAFT,
        )
        print(f"  ✓ Template: {template.name}")

        # Parse and create questions
        question_count = 0
        for q_id, q_data in questions_data.items():
            # Parse EO100 question ID format: supplement.principle.objective.PT
            # Example: "100.1.1.1"
            parts = parse_eo100_question_id(q_id, supplement_id)
            if not parts:
                continue

            principle_num, objective_num, pt_level = parts

            # Map performance target to score
            pt_scores = {1: 33, 2: 66, 3: 100}
            scoring_criteria = {
                "type": "select_one",
                "choices": ["Yes", "No", "N/A"],
                "PT1": 33,
                "PT2": 66,
                "PT3": 100,
                "current_pt": pt_level,
                "max_score": pt_scores.get(pt_level, 33),
            }

            AssessmentQuestion.objects.create(
                template=template,
                text=q_data.get("text", ""),
                order=objective_num,  # Use objective as order within principle
                category=f"Principle {principle_num}",
                scoring_criteria=scoring_criteria,
                is_required=True,
                performance_target_level=pt_level,
                external_question_id=q_id,
                framework_mappings=[],
            )
            question_count += 1

        print(f"  ✓ Created {question_count} questions")

        # Publish template
        template.status = AssessmentTemplate.Status.PUBLISHED
        template.published_at = timezone.now()
        template.save()
        print("  ✓ Template published")

    # Summary
    print(f"\n{'='*60}")
    print("✅ EO100 import complete!")
    print(f"{'='*60}")
    print(f"  Framework: {framework.name}")
    print(
        f"  Templates: {AssessmentTemplate.objects.filter(framework=framework).count()}"
    )
    print(
        f"  Total Questions: {AssessmentQuestion.objects.filter(template__framework=framework).count()}"
    )
    print("\n  Supplements:")
    for supplement_type, _ in supplements.values():
        count = AssessmentTemplate.objects.filter(
            framework=framework,
            supplement_type=getattr(
                AssessmentTemplate.SupplementType, supplement_type, None
            ),
        ).count()
        print(f"    - {supplement_type}: {count} template(s)")


def load_json(path: Path):
    """Load JSON file."""
    if not path.exists():
        print(f"⚠️  File not found: {path}")
        return {}

    with open(path, "r") as f:
        return json.load(f)


def parse_eo100_question_id(question_id: str, supplement_id: int):
    """
    Parse EO100 question ID format.

    Examples:
        "100.1.1.1" → (1, 1, 1)  # supplement.principle.objective.PT
        "1.1.1" → (1, 1, 1)      # principle.objective.PT (supplement from context)

    Returns: (principle_num, objective_num, pt_level) or None
    """
    try:
        parts = question_id.split(".")

        if len(parts) == 4:
            # Full format: supplement.principle.objective.PT
            # Skip supplement (already known from file)
            principle_num = int(parts[1])
            objective_num = int(parts[2])
            pt_level = int(parts[3])
        elif len(parts) == 3:
            # Short format: principle.objective.PT
            principle_num = int(parts[0])
            objective_num = int(parts[1])
            pt_level = int(parts[2])
        else:
            print(f"  ⚠️  Invalid question ID format: {question_id}")
            return None

        return (principle_num, objective_num, pt_level)

    except (ValueError, IndexError) as e:
        print(f"  ⚠️  Error parsing {question_id}: {e}")
        return None


if __name__ == "__main__":
    import_eo100_saq()

"""
Seed EO100 SAQ questions from legacy TDi backend JSON files.

Usage:
    python manage.py shell < backend/seed_eo100_saq.py

Prerequisites:
    Copy EO100 JSON files from ~/projects/TDi/backend/data/ to backend/eo100_exports/
    
    mkdir -p backend/eo100_exports
    cp ~/projects/TDi/backend/data/SAQ_Default.json backend/eo100_exports/
    cp ~/projects/TDi/backend/data/SAQ_Processing.json backend/eo100_exports/
    cp ~/projects/TDi/backend/data/SAQ_Production.json backend/eo100_exports/  # if exists
    cp ~/projects/TDi/backend/data/SAQ_Transmission_and_Storage.json backend/eo100_exports/

This creates:
- EO100 Framework
- 4 Templates (one per supplement)
- All questions with performance targets and external IDs
"""

import json
from pathlib import Path
from django.utils import timezone
from assessments.models import Framework, AssessmentTemplate, AssessmentQuestion


def seed_eo100_saq():
    print("Seeding EO100 SAQ questions...")

    export_dir = Path(__file__).parent / "eo100_exports"

    if not export_dir.exists():
        print(f"\n❌ Export directory not found: {export_dir}")
        print("\nSetup instructions:")
        print("  mkdir -p backend/eo100_exports")
        print("  cp ~/projects/TDi/backend/data/SAQ_*.json backend/eo100_exports/")
        return

    # EO100 supplements
    supplements = {
        100: ("DEFAULT", "SAQ_Default.json"),
        101: ("PROCESSING", "SAQ_Processing.json"),
        103: ("TRANSMISSION_STORAGE", "SAQ_Transmission_and_Storage.json"),
        # 102: ("PRODUCTION", "SAQ_Production.json"),  # May not exist
    }

    # Create EO100 Framework
    print("\n✓ Creating EO100 Framework...")
    framework, created = Framework.objects.get_or_create(
        slug="eo100-standard",
        defaults={
            "name": "EO100 Standard",
            "version": "2024",
            "description": "Energy Operations 100 - Sustainable Oil & Gas Certification Standard",
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
                "type": "performance_target",
                "PT1": 33,
                "PT2": 66,
                "PT3": 100,
            },
            "metadata": {
                "supplements": [100, 101, 102, 103],
                "principles": 10,
                "performance_targets": 3,
            },
        },
    )
    print(f"  Framework: {framework.name}")

    total_questions = 0

    # Import each supplement
    for supplement_id, (supplement_type, filename) in supplements.items():
        print(f"\n{'='*60}")
        print(f"Importing {supplement_type} ({supplement_id})...")
        print(f"{'='*60}")

        filepath = export_dir / filename
        if not filepath.exists():
            print(f"  ⚠️  Skipping {filename} - file not found")
            continue

        # Load questions
        with open(filepath, "r") as f:
            questions_data = json.load(f)

        # Create template for this supplement
        template, created = AssessmentTemplate.objects.get_or_create(
            slug=f"eo100-{supplement_type.lower()}",
            defaults={
                "name": f"EO100 SAQ - {supplement_type.title().replace('_', ' ')}",
                "description": f"EO100 Supplier Assessment Questionnaire - {supplement_type} supplement",
                "framework": framework,
                "supplement_type": getattr(
                    AssessmentTemplate.SupplementType, supplement_type
                ),
                "version": "1.0.0",
                "is_public": True,
                "owner_org": None,
                "status": AssessmentTemplate.Status.DRAFT,
            },
        )

        # Delete existing if re-seeding
        if not created:
            template.assessment_questions.all().delete()
            print(f"  Cleared existing questions for re-seed")

        print(f"  ✓ Template: {template.name}")

        # Parse and create questions
        question_count = 0
        for q_id, q_data in questions_data.items():
            # Parse EO100 question ID format: supplement.principle.objective.PT
            parts = q_id.split(".")
            if len(parts) == 4:
                principle_num = int(parts[1])
                objective_num = int(parts[2])
                pt_level = int(parts[3])
            elif len(parts) == 3:
                principle_num = int(parts[0])
                objective_num = int(parts[1])
                pt_level = int(parts[2])
            else:
                print(f"  ⚠️  Skipping invalid ID: {q_id}")
                continue

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

            question = AssessmentQuestion.objects.create(
                template=template,
                text=q_data.get("text", ""),
                order=objective_num,
                category=f"Principle {principle_num}",
                scoring_criteria=scoring_criteria,
                is_required=True,
                performance_target_level=pt_level,
                external_question_id=q_id,
                framework_mappings=[],
            )
            question_count += 1

        total_questions += question_count
        print(f"  ✓ Created {question_count} questions")

        # Publish template
        template.status = AssessmentTemplate.Status.PUBLISHED
        template.published_at = timezone.now()
        template.save()
        print(f"  ✓ Template published")

    # Summary
    print(f"\n{'='*60}")
    print("✅ EO100 seeding complete!")
    print(f"{'='*60}")
    print(f"  Framework: {framework.name}")
    print(f"  Templates: {AssessmentTemplate.objects.filter(framework=framework).count()}")
    print(f"  Total Questions: {total_questions}")
    print(f"\n  Supplements:")
    for supplement_type, _ in supplements.values():
        count = AssessmentTemplate.objects.filter(
            framework=framework,
            supplement_type=getattr(AssessmentTemplate.SupplementType, supplement_type),
        ).count()
        print(f"    - {supplement_type}: {count} template(s)")

    print(f"\n  Test instantiation:")
    template = AssessmentTemplate.objects.filter(framework=framework).first()
    if template:
        print(f"    POST /api/templates/{template.id}/instantiate/")


if __name__ == "__main__":
    seed_eo100_saq()

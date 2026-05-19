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

from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework
from assessments.services.hierarchy import build_eo100_hierarchy


def iter_eo100_questions(questions_data):
    """Yield normalized EO100 question records from nested or flat JSON exports."""
    for first_key, first_value in questions_data.items():
        # Legacy files are nested: supplement → principle → objective → question.
        if isinstance(first_value, dict) and "text" not in first_value:
            supplement_id = first_key
            for principle_id, objectives in first_value.items():
                for objective_id, questions in objectives.items():
                    for question_id, question in questions.items():
                        pt_level = int(question.get("pt") or question_id)
                        external_id = f"{supplement_id}.{principle_id}.{objective_id}.{question_id}"
                        yield {
                            "external_id": external_id,
                            "principle_num": int(principle_id),
                            "objective_num": int(objective_id),
                            "pt_level": pt_level,
                            "text": question.get("text", ""),
                            "description": question.get("description", ""),
                        }
            continue

        # Some exported/transformed files may already be flat by external ID.
        q_id = first_key
        q_data = first_value
        parts = q_id.split(".")
        if len(parts) == 4:
            principle_num = int(parts[1])
            objective_num = int(parts[2])
            pt_level = int(q_data.get("pt") or parts[3])
        elif len(parts) == 3:
            principle_num = int(parts[0])
            objective_num = int(parts[1])
            pt_level = int(q_data.get("pt") or parts[2])
        else:
            print(f"  ⚠️  Skipping invalid ID: {q_id}")
            continue

        yield {
            "external_id": q_id,
            "principle_num": principle_num,
            "objective_num": objective_num,
            "pt_level": pt_level,
            "text": q_data.get("text", ""),
            "description": q_data.get("description", ""),
        }


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
            print("  Cleared existing questions for re-seed")

        print(f"  ✓ Template: {template.name}")

        # Parse and create questions
        question_count = 0
        for question in iter_eo100_questions(questions_data):
            principle_num = question["principle_num"]
            objective_num = question["objective_num"]
            pt_level = question["pt_level"]
            external_id = question["external_id"]

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
                "documentary_evidence": question.get("description", ""),
            }

            AssessmentQuestion.objects.create(
                template=template,
                text=question.get("text", ""),
                order=question_count + 1,
                category=f"Principle {principle_num} / Objective {objective_num}",
                hierarchy=build_eo100_hierarchy(
                    principle_number=principle_num,
                    objective_number=objective_num,
                    performance_target_level=pt_level,
                ),
                scoring_criteria=scoring_criteria,
                is_required=True,
                performance_target_level=pt_level,
                external_question_id=external_id,
                framework_mappings=[],
            )
            question_count += 1

        total_questions += question_count
        print(f"  ✓ Created {question_count} questions")

        # Publish template
        template.status = AssessmentTemplate.Status.PUBLISHED
        template.published_at = timezone.now()
        template.save()
        print("  ✓ Template published")

    # Summary
    print(f"\n{'='*60}")
    print("✅ EO100 seeding complete!")
    print(f"{'='*60}")
    print(f"  Framework: {framework.name}")
    print(
        f"  Templates: {AssessmentTemplate.objects.filter(framework=framework).count()}"
    )
    print(f"  Total Questions: {total_questions}")
    print("\n  Supplements:")
    for supplement_type, _ in supplements.values():
        count = AssessmentTemplate.objects.filter(
            framework=framework,
            supplement_type=getattr(AssessmentTemplate.SupplementType, supplement_type),
        ).count()
        print(f"    - {supplement_type}: {count} template(s)")

    print("\n  Test instantiation:")
    template = AssessmentTemplate.objects.filter(framework=framework).first()
    if template:
        print(f"    POST /api/templates/{template.id}/instantiate/")


if __name__ == "__main__":
    seed_eo100_saq()

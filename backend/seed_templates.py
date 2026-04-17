"""
Seed script for creating sample assessment templates.

Run: python manage.py shell < backend/seed_templates.py
"""

from django.utils import timezone

from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework
from users.models import User


def seed_templates():
    print("Seeding assessment templates...")

    # Get SUPERADMIN user
    superadmin = User.objects.filter(role="SUPERADMIN").first()
    if not superadmin:
        print("❌ No SUPERADMIN user found. Create one first.")
        return

    # Get Bettercoal framework
    framework = Framework.objects.filter(name__icontains="bettercoal").first()
    if not framework:
        print("⚠️  Bettercoal framework not found. Creating...")
        framework = Framework.objects.create(
            name="Bettercoal",
            version="2024",
            description="Bettercoal Assessment Standard",
        )

    # Create Bettercoal 2024 Template
    print("✓ Creating Bettercoal 2024 Assessment template...")
    template = AssessmentTemplate.objects.create(
        name="Bettercoal 2024 Assessment",
        slug="bettercoal-2024",
        description="Standard Bettercoal assessment for mining sites. Covers all 12 principles and 144 provisions.",
        framework=framework,
        version="1.0.0",
        is_public=True,
        owner_org=None,  # Global template
        status=AssessmentTemplate.Status.DRAFT,
        created_by=superadmin,
    )

    # Add sample questions
    questions_data = [
        {
            "text": "Does the site have an environmental policy that is approved by senior management?",
            "category": "Environmental",
            "is_required": True,
            "framework_mappings": [
                {
                    "framework_id": str(framework.id),
                    "framework_name": "Bettercoal",
                    "provision_code": "P3.4",
                    "provision_name": "Environmental Management",
                }
            ],
        },
        {
            "text": "Is there a documented water management plan in place?",
            "category": "Environmental",
            "is_required": True,
            "framework_mappings": [],
        },
        {
            "text": "Does the site conduct regular biodiversity assessments?",
            "category": "Environmental",
            "is_required": True,
            "framework_mappings": [],
        },
        {
            "text": "Are workers provided with appropriate personal protective equipment (PPE)?",
            "category": "Social",
            "is_required": True,
            "framework_mappings": [],
        },
        {
            "text": "Is there a grievance mechanism available for workers and communities?",
            "category": "Social",
            "is_required": True,
            "framework_mappings": [],
        },
    ]

    for i, q_data in enumerate(questions_data):
        AssessmentQuestion.objects.create(
            template=template,
            text=q_data["text"],
            order=i + 1,
            category=q_data["category"],
            is_required=q_data["is_required"],
            framework_mappings=q_data["framework_mappings"],
        )

    print(f"✓ Added {len(questions_data)} questions to template")

    # Publish the template
    template.status = AssessmentTemplate.Status.PUBLISHED
    template.published_at = timezone.now()
    template.published_by = superadmin
    template.save()

    print(f"✓ Template published: {template.name} (v{template.version})")
    print(f"✓ Template ID: {template.id}")
    print(f"✓ Slug: {template.slug}")
    print(f"✓ Questions: {template.assessment_questions.count()}")

    # Create CGWG template
    print("\n✓ Creating CGWG 2024 Assessment template...")
    cgwg_framework = Framework.objects.filter(name__icontains="cgwg").first()
    if not cgwg_framework:
        cgwg_framework = Framework.objects.create(
            name="CGWG",
            version="2024",
            description="Coloured Gemstone Working Group Assessment",
        )

    cgwg_template = AssessmentTemplate.objects.create(
        name="CGWG 2024 Assessment",
        slug="cgwg-2024",
        description="CGWG Self-Assessment Questionnaire (SAQ) for gemstone suppliers.",
        framework=cgwg_framework,
        version="1.0.0",
        is_public=True,
        owner_org=None,
        status=AssessmentTemplate.Status.DRAFT,
        created_by=superadmin,
    )

    # Add CGWG questions
    cgwg_questions = [
        {
            "text": "Does your company have a policy on responsible sourcing of gemstones?",
            "category": "Governance",
            "is_required": True,
            "framework_mappings": [],
        },
        {
            "text": "Do you conduct due diligence on your supply chain?",
            "category": "Governance",
            "is_required": True,
            "framework_mappings": [],
        },
        {
            "text": "Are workers paid at least the minimum wage?",
            "category": "Social",
            "is_required": True,
            "framework_mappings": [],
        },
    ]

    for i, q_data in enumerate(cgwg_questions):
        AssessmentQuestion.objects.create(
            template=cgwg_template,
            text=q_data["text"],
            order=i + 1,
            category=q_data["category"],
            is_required=q_data["is_required"],
            framework_mappings=q_data["framework_mappings"],
        )

    cgwg_template.status = AssessmentTemplate.Status.PUBLISHED
    cgwg_template.published_at = timezone.now()
    cgwg_template.published_by = superadmin
    cgwg_template.save()

    print(f"✓ CGWG template published: {cgwg_template.name}")
    print(f"✓ Questions: {cgwg_template.assessment_questions.count()}")

    print("\n✅ Seed complete!")
    print("\nAvailable templates:")
    print(f"  1. {template.name} ({template.assessment_questions.count()} questions)")
    print(
        f"  2. {cgwg_template.name} ({cgwg_template.assessment_questions.count()} questions)"
    )
    print("\nTest instantiation:")
    print(f"  POST /api/templates/{template.id}/instantiate/")


if __name__ == "__main__":
    seed_templates()

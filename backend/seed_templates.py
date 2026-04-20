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

    # Get primary assurance framework
    framework = Framework.objects.filter(name__icontains="primary assurance").first()
    if not framework:
        print("⚠️  Primary assurance framework not found. Creating...")
        framework = Framework.objects.create(
            name="Primary Assurance Standard",
            version="2024",
            description="Primary assurance assessment standard",
        )

    # Create primary assurance 2024 template
    print("✓ Creating Primary Assurance 2024 Assessment template...")
    template = AssessmentTemplate.objects.create(
        name="Primary Assurance 2024 Assessment",
        slug="primary-assurance-2024",
        description="Standard mining assurance assessment for operational sites. Covers core principles and requirements.",
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
                    "framework_name": "Primary Assurance Standard",
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

    # Create supplier questionnaire template
    print("\n✓ Creating Supplier Questionnaire 2024 Assessment template...")
    supplier_questionnaire_framework = Framework.objects.filter(
        name__icontains="supplier questionnaire"
    ).first()
    if not supplier_questionnaire_framework:
        supplier_questionnaire_framework = Framework.objects.create(
            name="Supplier Questionnaire",
            version="2024",
            description="Coloured Gemstone Working Group Assessment",
        )

    supplier_questionnaire_template = AssessmentTemplate.objects.create(
        name="Supplier Questionnaire 2024 Assessment",
        slug="supplier-questionnaire-2024",
        description="Supplier self-assessment questionnaire for distributed supplier programs.",
        framework=supplier_questionnaire_framework,
        version="1.0.0",
        is_public=True,
        owner_org=None,
        status=AssessmentTemplate.Status.DRAFT,
        created_by=superadmin,
    )

    # Add supplier questionnaire questions
    supplier_questionnaire_questions = [
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

    for i, q_data in enumerate(supplier_questionnaire_questions):
        AssessmentQuestion.objects.create(
            template=supplier_questionnaire_template,
            text=q_data["text"],
            order=i + 1,
            category=q_data["category"],
            is_required=q_data["is_required"],
            framework_mappings=q_data["framework_mappings"],
        )

    supplier_questionnaire_template.status = AssessmentTemplate.Status.PUBLISHED
    supplier_questionnaire_template.published_at = timezone.now()
    supplier_questionnaire_template.published_by = superadmin
    supplier_questionnaire_template.save()

    print(
        f"✓ Supplier questionnaire template published: {supplier_questionnaire_template.name}"
    )
    print(
        f"✓ Questions: {supplier_questionnaire_template.assessment_questions.count()}"
    )

    print("\n✅ Seed complete!")
    print("\nAvailable templates:")
    print(f"  1. {template.name} ({template.assessment_questions.count()} questions)")
    print(
        f"  2. {supplier_questionnaire_template.name} ({supplier_questionnaire_template.assessment_questions.count()} questions)"
    )
    print("\nTest instantiation:")
    print(f"  POST /api/templates/{template.id}/instantiate/")


if __name__ == "__main__":
    seed_templates()

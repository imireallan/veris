"""
Seed CGWG SAQ questions into Veris.

Usage:
    python manage.py shell < backend/seed_cgwg_saq.py

This creates:
- CGWG Framework
- CGWG SAQ Template
- Sample questions from each category (Social, Environmental, Governance)
"""

from django.utils import timezone

from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework


def seed_cgwg_saq():
    print("Seeding CGWG SAQ questions...")

    # Create CGWG Framework
    print("\n✓ Creating CGWG Framework...")
    framework, created = Framework.objects.get_or_create(
        slug="cgwg-saq",
        defaults={
            "name": "CGWG Supplier Assessment Questionnaire",
            "version": "2024",
            "description": "Coloured Gemstone Working Group - Supplier Self-Assessment Questionnaire",
            "categories": {
                "Social": {
                    "description": "Labor rights, human rights, community relations",
                },
                "Environmental": {
                    "description": "Environmental management, biodiversity, pollution",
                },
                "Governance": {
                    "description": "Business ethics, anti-corruption, transparency",
                },
            },
            "scoring_methodology": {
                "type": "yes_no_na",
                "choices": ["YES", "NO", "NA"],
                "scoring": {"YES": 1, "NO": 0, "NA": None},
            },
        },
    )
    print(f"  Framework: {framework.name}")

    # Create CGWG SAQ Template
    print("\n✓ Creating CGWG SAQ Template...")
    template, created = AssessmentTemplate.objects.get_or_create(
        slug="cgwg-saq-2024",
        defaults={
            "name": "CGWG Supplier Assessment Questionnaire 2024",
            "description": "Self-assessment questionnaire for colored gemstone suppliers. Covers social, environmental, and governance requirements.",
            "framework": framework,
            "version": "1.0.0",
            "is_public": True,
            "owner_org": None,  # Global template
            "status": AssessmentTemplate.Status.DRAFT,
        },
    )
    print(f"  Template: {template.name}")

    # Delete existing questions if re-seeding
    if not created:
        template.assessment_questions.all().delete()
        print("  Cleared existing questions for re-seed")

    # CGWG SAQ Questions (based on actual CGWG questionnaire structure)
    questions_data = [
        # Governance
        {
            "text": "Does your company have a written policy on responsible sourcing of colored gemstones?",
            "category": "Governance",
            "order": 1,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Policy should cover commitment to ethical practices throughout the supply chain",
            "documentary_evidence": "Responsible sourcing policy, Code of conduct",
        },
        {
            "text": "Do you conduct due diligence on your supply chain to identify and address risks?",
            "category": "Governance",
            "order": 2,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Due diligence should follow OECD Guidance or equivalent framework",
            "documentary_evidence": "Due diligence procedure, Risk assessment records",
        },
        {
            "text": "Does your company have an anti-corruption and anti-bribery policy?",
            "category": "Governance",
            "order": 3,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": False,
            },
            "help_text": "Policy should prohibit bribery and corruption in all business dealings",
            "documentary_evidence": "Anti-corruption policy, Employee training records",
        },
        {
            "text": "Do you maintain records of all gemstone transactions including origin information?",
            "category": "Governance",
            "order": 4,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Records should enable traceability back to mine of origin",
            "documentary_evidence": "Transaction records, Origin declarations, Invoices",
        },
        # Social
        {
            "text": "Does your company prohibit child labor in accordance with ILO conventions?",
            "category": "Social",
            "order": 5,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": False,
            },
            "help_text": "Minimum age should comply with ILO Convention 138 (usually 15 years)",
            "documentary_evidence": "HR policy, Age verification procedures",
        },
        {
            "text": "Does your company prohibit forced labor and human trafficking?",
            "category": "Social",
            "order": 6,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": False,
            },
            "help_text": "Employment should be voluntary with freedom to terminate",
            "documentary_evidence": "HR policy, Employment contracts",
        },
        {
            "text": "Do you provide a safe and healthy working environment for employees?",
            "category": "Social",
            "order": 7,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Should comply with local OHS regulations and ILO standards",
            "documentary_evidence": "OHS policy, Incident records, Safety training logs",
        },
        {
            "text": "Does your company respect workers' right to freedom of association?",
            "category": "Social",
            "order": 8,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": False,
            },
            "help_text": "Workers should be free to join unions or form worker representatives",
            "documentary_evidence": "HR policy, Union agreements (if applicable)",
        },
        {
            "text": "Do you pay workers at least the legal minimum wage?",
            "category": "Social",
            "order": 9,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Wages should meet or exceed legal minimum and industry standards",
            "documentary_evidence": "Payroll records, Employment contracts",
        },
        # Environmental
        {
            "text": "Does your company have an environmental policy?",
            "category": "Environmental",
            "order": 10,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Policy should commit to environmental protection and compliance",
            "documentary_evidence": "Environmental policy, Management system documentation",
        },
        {
            "text": "Do you comply with all applicable environmental laws and regulations?",
            "category": "Environmental",
            "order": 11,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Includes permits, emissions limits, waste management requirements",
            "documentary_evidence": "Environmental permits, Compliance audit reports",
        },
        {
            "text": "Do you have procedures to manage waste and prevent pollution?",
            "category": "Environmental",
            "order": 12,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Should cover waste reduction, recycling, and proper disposal",
            "documentary_evidence": "Waste management procedure, Disposal records",
        },
        {
            "text": "Does your company take measures to protect biodiversity in areas of operation?",
            "category": "Environmental",
            "order": 13,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Especially important for mining operations in sensitive ecosystems",
            "documentary_evidence": "Biodiversity assessment, Conservation plans",
        },
        {
            "text": "Do you monitor and manage water usage and quality?",
            "category": "Environmental",
            "order": 14,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": True,
            },
            "help_text": "Should include water consumption tracking and discharge quality monitoring",
            "documentary_evidence": "Water monitoring records, Discharge test results",
        },
        {
            "text": "Does your company have measures to reduce greenhouse gas emissions?",
            "category": "Environmental",
            "order": 15,
            "scoring_criteria": {
                "type": "select_one",
                "choices": ["YES", "NO", "NA"],
                "evidence_required": False,
            },
            "help_text": "Could include energy efficiency, renewable energy, or carbon offset programs",
            "documentary_evidence": "Energy consumption records, Emissions inventory",
        },
    ]

    # Create questions
    print(f"\n✓ Creating {len(questions_data)} questions...")
    for q_data in questions_data:
        AssessmentQuestion.objects.create(
            template=template,
            text=q_data["text"],
            order=q_data["order"],
            category=q_data["category"],
            scoring_criteria=q_data["scoring_criteria"],
            is_required=True,
            performance_target_level=1,  # Default for CGWG
            framework_mappings=[],
        )
        print(f"  [{q_data['category']}] Q{q_data['order']}: {q_data['text'][:60]}...")

    # Publish template
    template.status = AssessmentTemplate.Status.PUBLISHED
    template.published_at = timezone.now()
    template.save()

    print("\n✅ CGWG SAQ seeding complete!")
    print(f"  Framework: {framework.name}")
    print(f"  Template: {template.name} ({template.slug})")
    print(f"  Questions: {template.assessment_questions.count()}")
    print("\n  Test instantiation:")
    print(f"    POST /api/templates/{template.id}/instantiate/")


if __name__ == "__main__":
    seed_cgwg_saq()

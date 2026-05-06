"""
Quick seed command for testing CGWG and EO100 frameworks.

Usage:
    docker compose exec backend python manage.py seed_frameworks
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework


class Command(BaseCommand):
    help = "Seed CGWG and EO100 frameworks with sample questions for testing"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding frameworks...\n")

        # CGWG
        self.seed_cgwg()

        # EO100
        self.seed_eo100()

        self.stdout.write(self.style.SUCCESS("\n✅ Seeding complete!"))

    def seed_cgwg(self):
        self.stdout.write("Creating CGWG Framework...")

        framework, _ = Framework.objects.get_or_create(
            slug="cgwg-saq",
            defaults={
                "name": "CGWG Supplier Assessment Questionnaire",
                "version": "2024",
                "description": "Coloured Gemstone Working Group - Supplier Self-Assessment",
                "categories": {"Social": {}, "Environmental": {}, "Governance": {}},
            },
        )

        template, _ = AssessmentTemplate.objects.get_or_create(
            slug="cgwg-saq-2024",
            defaults={
                "name": "CGWG SAQ 2024",
                "framework": framework,
                "version": "1.0.0",
                "is_public": True,
                "status": AssessmentTemplate.Status.DRAFT,
            },
        )

        # Clear existing
        template.assessment_questions.all().delete()

        questions = [
            {
                "text": "Does your company have a responsible sourcing policy?",
                "category": "Governance",
                "order": 1,
            },
            {
                "text": "Do you conduct supply chain due diligence?",
                "category": "Governance",
                "order": 2,
            },
            {"text": "Do you prohibit child labor?", "category": "Social", "order": 3},
            {"text": "Do you prohibit forced labor?", "category": "Social", "order": 4},
            {
                "text": "Do you have an environmental policy?",
                "category": "Environmental",
                "order": 5,
            },
            {
                "text": "Do you comply with all environmental regulations?",
                "category": "Environmental",
                "order": 6,
            },
        ]

        for q in questions:
            AssessmentQuestion.objects.create(
                template=template,
                text=q["text"],
                category=q["category"],
                order=q["order"],
                scoring_criteria={"type": "select_one", "choices": ["YES", "NO", "NA"]},
                is_required=True,
            )

        template.status = AssessmentTemplate.Status.PUBLISHED
        template.published_at = timezone.now()
        template.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"  ✓ CGWG: {template.assessment_questions.count()} questions"
            )
        )

    def seed_eo100(self):
        self.stdout.write("Creating EO100 Framework...")

        framework, _ = Framework.objects.get_or_create(
            slug="eo100-standard",
            defaults={
                "name": "EO100 Standard",
                "version": "2024",
                "description": "Energy Operations 100 - Sustainable Oil & Gas Certification",
                "metadata": {"supplements": [100, 101, 103], "principles": 10},
            },
        )

        # Create 3 supplements
        supplements = [
            ("DEFAULT", "EO100 SAQ - Default"),
            ("PROCESSING", "EO100 SAQ - Processing"),
            ("TRANSMISSION_STORAGE", "EO100 SAQ - Transmission & Storage"),
        ]

        total_questions = 0
        for supplement_type, name in supplements:
            template, _ = AssessmentTemplate.objects.get_or_create(
                slug=f"eo100-{supplement_type.lower()}",
                defaults={
                    "name": name,
                    "framework": framework,
                    "supplement_type": getattr(
                        AssessmentTemplate.SupplementType, supplement_type
                    ),
                    "version": "1.0.0",
                    "is_public": True,
                    "status": AssessmentTemplate.Status.DRAFT,
                },
            )

            # Clear existing
            template.assessment_questions.all().delete()

            # Create sample questions for each PT level
            questions = [
                {
                    "text": f"[PT1] Operator shall establish a policy ({supplement_type})",
                    "category": "Principle 1",
                    "order": 1,
                    "pt": 1,
                },
                {
                    "text": f"[PT2] Operator shall implement procedures ({supplement_type})",
                    "category": "Principle 1",
                    "order": 2,
                    "pt": 2,
                },
                {
                    "text": f"[PT3] Operator shall achieve best practice ({supplement_type})",
                    "category": "Principle 1",
                    "order": 3,
                    "pt": 3,
                },
                {
                    "text": f"[PT1] Operator shall monitor compliance ({supplement_type})",
                    "category": "Principle 7",
                    "order": 4,
                    "pt": 1,
                },
                {
                    "text": f"[PT2] Operator shall report emissions ({supplement_type})",
                    "category": "Principle 7",
                    "order": 5,
                    "pt": 2,
                },
            ]

            for q in questions:
                AssessmentQuestion.objects.create(
                    template=template,
                    text=q["text"],
                    category=q["category"],
                    order=q["order"],
                    scoring_criteria={
                        "type": "select_one",
                        "choices": ["Yes", "No", "N/A"],
                        "PT1": 33,
                        "PT2": 66,
                        "PT3": 100,
                    },
                    is_required=True,
                    performance_target_level=q["pt"],
                    external_question_id=f"100.1.{q['order']}.{q['pt']}",
                )

            template.status = AssessmentTemplate.Status.PUBLISHED
            template.published_at = timezone.now()
            template.save()

            total_questions += template.assessment_questions.count()

        self.stdout.write(
            self.style.SUCCESS(
                f"  ✓ EO100: {total_questions} questions across 3 supplements"
            )
        )

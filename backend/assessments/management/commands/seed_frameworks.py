"""
Seed Veris framework questionnaire templates.

This command intentionally uses the richer framework-specific seeders instead of
small placeholder question lists so EO100, CGWG, and imported Bettercoal templates
keep distinct question banks.
"""

from django.core.management.base import BaseCommand

from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework
from seed_cgwg_saq import seed_cgwg_saq
from seed_eo100_saq import seed_eo100_saq


class Command(BaseCommand):
    help = "Seed EO100 and CGWG framework templates with their framework-specific questions"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding framework-specific questionnaire templates...\n")

        seed_cgwg_saq()
        seed_eo100_saq()

        self._print_summary()
        self.stdout.write(
            self.style.SUCCESS("\n✅ Framework questionnaire seeding complete!")
        )

    def _print_summary(self):
        framework_names = [
            "EO100 Standard",
            "CGWG Supplier Assessment Questionnaire",
            "Bettercoal Code 2.0 Provision Summary & Rating System",
        ]
        self.stdout.write("\nQuestion bank summary:")
        for framework in Framework.objects.filter(name__in=framework_names).order_by(
            "name"
        ):
            template_count = AssessmentTemplate.objects.filter(
                framework=framework
            ).count()
            question_count = AssessmentQuestion.objects.filter(
                template__framework=framework,
                assessment__isnull=True,
            ).count()
            distinct_text_count = (
                AssessmentQuestion.objects.filter(
                    template__framework=framework,
                    assessment__isnull=True,
                )
                .values("text")
                .distinct()
                .count()
            )
            self.stdout.write(
                f"  - {framework.name}: {template_count} templates, "
                f"{question_count} questions, {distinct_text_count} unique question texts"
            )

"""Management command to seed the database with demo data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with demo organizations, frameworks, themes, and an admin user"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # Admin user
        if not User.objects.filter(email="admin@example.com").exists():
            User.objects.create_superuser(
                email="admin@example.com",
                name="Admin",
                password="admin",
            )
            self.stdout.write(self.style.SUCCESS("Created superuser admin@example.com / admin"))
        else:
            self.stdout.write(self.style.WARNING("Superuser already exists"))

        # Organizations and Themes
        from organizations.models import Organization
        from themes.models import Theme

        demo_orgs = [
            {
                "name": "Demo Energy Corp",
                "slug": "demo-energy",
                "status": Organization.Status.ACTIVE,
                "subscription_tier": "enterprise",
                "theme": {
                    "primary_color": "#2D5A7B",
                    "secondary_color": "#8FAABF",
                    "accent_color": "#E88D67",
                    "background_color": "#FAFAFA",
                    "text_color": "#1A1A1A",
                    "logo_url": "",
                    "favicon_url": "",
                    "font_family": "Inter, system-ui, sans-serif",
                },
            },
            {
                "name": "Demo Mining Ltd",
                "slug": "demo-mining",
                "status": Organization.Status.ACTIVE,
                "subscription_tier": "standard",
                "theme": {
                    "primary_color": "#1B4332",
                    "secondary_color": "#40916C",
                    "accent_color": "#D4A373",
                    "background_color": "#FEFAE0",
                    "text_color": "#2B2D42",
                    "logo_url": "",
                    "favicon_url": "",
                    "font_family": "Inter, system-ui, sans-serif",
                },
            },
            {
                "name": "Demo Automotive Inc",
                "slug": "demo-automotive",
                "status": Organization.Status.ACTIVE,
                "subscription_tier": "enterprise",
                "theme": {
                    "primary_color": "#3B82F6",
                    "secondary_color": "#60A5FA",
                    "accent_color": "#F59E0B",
                    "background_color": "#F1F5F9",
                    "text_color": "#0F172A",
                    "logo_url": "",
                    "favicon_url": "",
                    "font_family": "Inter, system-ui, sans-serif",
                },
            },
        ]

        for org_data in demo_orgs:
            theme_data = org_data.pop("theme")
            org, created = Organization.objects.get_or_create(
                slug=org_data["slug"],
                defaults=org_data,
            )
            status = "Created" if created else "Exists"
            self.stdout.write(f"  [{status}] Organization: {org.name}")

            Theme.objects.update_or_create(
                organization=org,
                defaults=theme_data,
            )

        # Frameworks
        from assessments.models import Framework

        frameworks = [
            {
                "name": "Energy Certification Standard",
                "version": "2023.1",
                "description": "Stakeholder-based certification for responsible energy development.",
                "categories": {
                    "principle_1": "Corporate governance, transparency and ethics",
                    "principle_2": "Human rights, social impact and community development",
                    "principle_3": "Indigenous Peoples rights",
                    "principle_4": "Fair labour and working conditions",
                    "principle_5": "Climate change, biodiversity and environment",
                },
                "scoring_methodology": {"type": "weighted", "scale": "0-100"},
                "reporting_period": "Annual",
            },
            {
                "name": "OECD Due Diligence",
                "version": "2023",
                "description": "OECD Due Diligence Guidance for Responsible Business Conduct.",
                "categories": {
                    "management_systems": "Strong management systems",
                    "risk_identification": "Risk identification and assessment",
                    "risk_mitigation": "Risk mitigation",
                    "monitoring": "Ongoing monitoring",
                    "reporting": "Public reporting",
                    "remediation": "Remediation processes",
                },
                "scoring_methodology": {"type": "binary_compliance", "scale": "pass/fail"},
                "reporting_period": "Annual",
            },
            {
                "name": "Responsible Business Alliance",
                "version": "2023.0",
                "description": "Supply chain sustainability standards for electronics and manufacturing.",
                "categories": {
                    "labour": "Labour standards and fair treatment",
                    "health_safety": "Health and workplace safety",
                    "environment": "Environmental management",
                    "ethics": "Business ethics and anti-corruption",
                    "management_system": "Management systems",
                },
                "scoring_methodology": {"type": "audit_score", "scale": "0-200"},
                "reporting_period": "Annual",
            },
        ]

        for fw_data in frameworks:
            fw, created = Framework.objects.get_or_create(
                name=fw_data["name"],
                defaults=fw_data,
            )
            status = "Created" if created else "Exists"
            self.stdout.write(f"  [{status}] Framework: {fw.name}")

        # ESG Focus Areas
        from assessments.models import ESGFocusArea

        focus_area_data = [
            {
                "org_slug": "demo-energy",
                "areas": [
                    {"name": "Ethics", "internal_label": "ethics", "description": "Business ethics and corporate governance"},
                    {"name": "Low Emissions", "internal_label": "low_emissions", "description": "GHG emissions and climate targets"},
                    {"name": "Retirement of Assets", "internal_label": "retirement_of_assets", "description": "Decommissioning and site restoration"},
                    {"name": "Rights", "internal_label": "rights", "description": "Indigenous Peoples rights and land access"},
                    {"name": "Community Relations", "internal_label": "community_relations", "description": "Social impact and community engagement"},
                    {"name": "Talent Attraction", "internal_label": "talent_attraction", "description": "Talent attraction, retention, and engagement"},
                ],
            },
            {
                "org_slug": "demo-mining",
                "areas": [
                    {"name": "Ethics", "internal_label": "ethics", "description": "Business ethics and corporate governance"},
                    {"name": "Low Emissions", "internal_label": "low_emissions", "description": "GHG emissions and climate targets"},
                    {"name": "Community Relations", "internal_label": "community_relations", "description": "Community engagement and social investment"},
                    {"name": "Supply Chain Diligence", "internal_label": "supply_chain", "description": "Supplier due diligence and traceability"},
                    {"name": "Environmental Management", "internal_label": "environment", "description": "Biodiversity, water, and land management"},
                    {"name": "Artisanal Mining", "internal_label": "asm", "description": "ASM engagement and formalisation"},
                ],
            },
            {
                "org_slug": "demo-automotive",
                "areas": [
                    {"name": "Ethics", "internal_label": "ethics", "description": "Business ethics and anti-corruption"},
                    {"name": "Carbon Reduction", "internal_label": "carbon", "description": "Scope 1, 2, 3 emissions tracking"},
                    {"name": "Supply Chain", "internal_label": "supply_chain", "description": "Supply chain due diligence and BoM risk"},
                    {"name": "Labour Standards", "internal_label": "labour", "description": "Worker rights and fair labour practices"},
                    {"name": "Circular Economy", "internal_label": "circular", "description": "Recycling, reuse, and end-of-life management"},
                    {"name": "Product Safety", "internal_label": "safety", "description": "Product quality and consumer safety"},
                ],
            },
        ]

        org_map = {o.slug: o for o in Organization.objects.all()}

        for group in focus_area_data:
            org = org_map.get(group["org_slug"])
            if not org:
                self.stdout.write(self.style.ERROR(f"Organization not found: {group['org_slug']}"))
                continue
            for fa in group["areas"]:
                _, created = ESGFocusArea.objects.get_or_create(
                    organization=org,
                    internal_label=fa["internal_label"],
                    defaults={"name": fa["name"], "description": fa["description"]},
                )
                status = "Created" if created else "Exists"
                self.stdout.write(f"  [{status}] {org.name} -> {fa['name']}")

        # Summary
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"Organizations: {Organization.objects.count()}")
        self.stdout.write(f"Frameworks:      {Framework.objects.count()}")
        self.stdout.write(f"Focus Areas:     {ESGFocusArea.objects.count()}")
        self.stdout.write(f"Users:           {User.objects.count()}")
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("Login: admin@example.com / admin"))

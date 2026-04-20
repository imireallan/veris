"""Management command to seed the database with demo data."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

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
            self.stdout.write(
                self.style.SUCCESS("Created superuser admin@example.com / admin")
            )
        else:
            self.stdout.write(self.style.WARNING("Superuser already exists"))

        # Organization Creation Config (singleton)
        from organizations.models import OrganizationCreationConfig

        config, created = OrganizationCreationConfig.objects.get_or_create(
            id=(
                OrganizationCreationConfig.objects.first().id
                if OrganizationCreationConfig.objects.exists()
                else None
            ),
            defaults={
                "require_contract_upload": False,
                "require_client_email": True,
                "require_framework_selection": True,
                "require_industry_sector": True,
                "auto_send_invitation": True,
                "invitation_expiry_days": 7,
                "allowed_creator_roles": ["SUPERADMIN"],
                "helper_title": "Create New Organization",
                "helper_description": "Set up a new client organization on Veris. They will receive an invitation to join the platform.",
                "prerequisite_warning": "Ensure you have client approval before creating their organization. This action cannot be undone.",
            },
        )
        if created:
            self.stdout.write(
                self.style.SUCCESS("Created organization creation config with defaults")
            )
        else:
            self.stdout.write(
                self.style.WARNING("Organization creation config already exists")
            )

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
                "scoring_methodology": {
                    "type": "binary_compliance",
                    "scale": "pass/fail",
                },
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
                    {
                        "name": "Ethics",
                        "internal_label": "ethics",
                        "description": "Business ethics and corporate governance",
                    },
                    {
                        "name": "Low Emissions",
                        "internal_label": "low_emissions",
                        "description": "GHG emissions and climate targets",
                    },
                    {
                        "name": "Retirement of Assets",
                        "internal_label": "retirement_of_assets",
                        "description": "Decommissioning and site restoration",
                    },
                    {
                        "name": "Rights",
                        "internal_label": "rights",
                        "description": "Indigenous Peoples rights and land access",
                    },
                    {
                        "name": "Community Relations",
                        "internal_label": "community_relations",
                        "description": "Social impact and community engagement",
                    },
                    {
                        "name": "Talent Attraction",
                        "internal_label": "talent_attraction",
                        "description": "Talent attraction, retention, and engagement",
                    },
                ],
            },
            {
                "org_slug": "demo-mining",
                "areas": [
                    {
                        "name": "Ethics",
                        "internal_label": "ethics",
                        "description": "Business ethics and corporate governance",
                    },
                    {
                        "name": "Low Emissions",
                        "internal_label": "low_emissions",
                        "description": "GHG emissions and climate targets",
                    },
                    {
                        "name": "Community Relations",
                        "internal_label": "community_relations",
                        "description": "Community engagement and social investment",
                    },
                    {
                        "name": "Supply Chain Diligence",
                        "internal_label": "supply_chain",
                        "description": "Supplier due diligence and traceability",
                    },
                    {
                        "name": "Environmental Management",
                        "internal_label": "environment",
                        "description": "Biodiversity, water, and land management",
                    },
                    {
                        "name": "Artisanal Mining",
                        "internal_label": "asm",
                        "description": "ASM engagement and formalisation",
                    },
                ],
            },
            {
                "org_slug": "demo-automotive",
                "areas": [
                    {
                        "name": "Ethics",
                        "internal_label": "ethics",
                        "description": "Business ethics and anti-corruption",
                    },
                    {
                        "name": "Carbon Reduction",
                        "internal_label": "carbon",
                        "description": "Scope 1, 2, 3 emissions tracking",
                    },
                    {
                        "name": "Supply Chain",
                        "internal_label": "supply_chain",
                        "description": "Supply chain due diligence and BoM risk",
                    },
                    {
                        "name": "Labour Standards",
                        "internal_label": "labour",
                        "description": "Worker rights and fair labour practices",
                    },
                    {
                        "name": "Circular Economy",
                        "internal_label": "circular",
                        "description": "Recycling, reuse, and end-of-life management",
                    },
                    {
                        "name": "Product Safety",
                        "internal_label": "safety",
                        "description": "Product quality and consumer safety",
                    },
                ],
            },
        ]

        org_map = {o.slug: o for o in Organization.objects.all()}

        for group in focus_area_data:
            org = org_map.get(group["org_slug"])
            if not org:
                self.stdout.write(
                    self.style.ERROR(f"Organization not found: {group['org_slug']}")
                )
                continue
            for fa in group["areas"]:
                _, created = ESGFocusArea.objects.get_or_create(
                    organization=org,
                    internal_label=fa["internal_label"],
                    defaults={"name": fa["name"], "description": fa["description"]},
                )
                status = "Created" if created else "Exists"
                self.stdout.write(f"  [{status}] {org.name} -> {fa['name']}")

        # ─────────────────────────────────────────────────────
        # Sites (multi-industry — coal, oil/gas, agriculture)
        # ─────────────────────────────────────────────────────
        from assessments.models import Site

        sites_data = [
            {
                "org_slug": "demo-mining",
                "site": {
                    "name": "Kgalagadi Colliery",
                    "type": Site.SiteType.MINE,
                    "country_code": "ZA",
                    "region": "Mpumalanga",
                    "coordinates": {"lat": -25.7479, "lng": 29.7620},
                    "operational_status": Site.OperationalStatus.ACTIVE,
                    "risk_profile": Site.RiskProfile.HIGH,
                    "employee_count": 1200,
                    "contractor_count": 450,
                    "operational_since": 2005,
                    "estimated_lifetime_years": 25,
                    "industry_data": {
                        "type_of_coal": "Bituminous / Thermal",
                        "type_of_mine": "Open Pit + Underground",
                        "certifications": ["ISO 14001", "NOSA"],
                        "is_coal_washing": True,
                        "fatalities_last_12m": 0,
                    },
                    "is_in_indigenous_territory": False,
                    "is_in_conflict_zone": False,
                    "description": "Primary thermal coal mine supplying regional power stations.",
                },
            },
            {
                "org_slug": "demo-mining",
                "site": {
                    "name": "Pilanesberg Processing Plant",
                    "type": Site.SiteType.FACILITY,
                    "country_code": "ZA",
                    "region": "North West",
                    "coordinates": {"lat": -25.2333, "lng": 27.1667},
                    "operational_status": Site.OperationalStatus.ACTIVE,
                    "risk_profile": Site.RiskProfile.MEDIUM,
                    "employee_count": 350,
                    "contractor_count": 120,
                    "operational_since": 2010,
                    "industry_data": {
                        "certifications": ["ISO 45001"],
                    },
                    "description": "Coal wash and processing facility.",
                },
            },
            {
                "org_slug": "demo-energy",
                "site": {
                    "name": "Niger Delta Block 7",
                    "type": Site.SiteType.OPERATION,
                    "country_code": "NG",
                    "region": "Niger Delta",
                    "coordinates": {"lat": 5.0, "lng": 6.2},
                    "operational_status": Site.OperationalStatus.ACTIVE,
                    "risk_profile": Site.RiskProfile.CRITICAL,
                    "employee_count": 800,
                    "contractor_count": 1500,
                    "operational_since": 1998,
                    "industry_data": {
                        "well_count": 42,
                        "production_rate_bpd": 15000,
                        "pipeline_length_km": 180,
                    },
                    "is_in_indigenous_territory": True,
                    "is_in_conflict_zone": True,
                    "description": "Major oil and gas extraction block with community tensions.",
                },
            },
        ]

        for site_info in sites_data:
            org = org_map.get(site_info["org_slug"])
            if not org:
                continue
            site, created = Site.objects.get_or_create(
                organization=org,
                name=site_info["site"]["name"],
                defaults=site_info["site"],
            )
            status = "Created" if created else "Exists"
            self.stdout.write(f"  [{status}] Site: {site.name}")

        # ─────────────────────────────────────────────────────
        # Assessment + Plan + Report + Finding + CIP Cycle demo
        # ─────────────────────────────────────────────────────
        from datetime import date, timedelta

        from assessments.models import (
            Assessment,
            AssessmentPlan,
            AssessmentReport,
            CIPCycle,
            Finding,
            Task,
        )

        mining_org = org_map.get("demo-mining")
        energy_org = org_map.get("demo-energy")
        site1 = (
            Site.objects.filter(organization=mining_org).first() if mining_org else None
        )
        site3 = (
            Site.objects.filter(organization=energy_org).first() if energy_org else None
        )
        framework_ecs = Framework.objects.filter(
            name="Energy Certification Standard"
        ).first()

        # Demo assessment with a full multi-step assurance flow
        demo_assessment = None
        if mining_org and mining_org.focus_areas.exists():
            focus_area = mining_org.focus_areas.first()
            demo_assessment, _ = Assessment.objects.get_or_create(
                organization=mining_org,
                focus_area=focus_area,
                framework=framework_ecs,
                defaults={
                    "site": site1,
                    "status": Assessment.Status.IN_PROGRESS,
                    "start_date": date.today() - timedelta(days=30),
                    "due_date": date.today() + timedelta(days=60),
                    "created_by": User.objects.filter(is_superuser=True).first(),
                    "overall_score": 62.5,
                    "risk_level": Assessment.RiskLevel.MEDIUM,
                    "ai_summary": "Assessment in progress. Key gaps identified in labour standards reporting.",
                },
            )
            self.stdout.write(f"  [Upsert] Assessment: {demo_assessment}")

        if demo_assessment:
            # Assessment Plan
            AssessmentPlan.objects.get_or_create(
                assessment=demo_assessment,
                defaults={
                    "organization": mining_org,
                    "site_assessment_start": date.today() - timedelta(days=10),
                    "site_assessment_end": date.today() + timedelta(days=5),
                    "draft_report_deadline": date.today() + timedelta(days=30),
                    "final_report_deadline": date.today() + timedelta(days=60),
                    "notes": "Follow OECD Due Diligence framework for site visit.",
                },
            )

            # Assessment Report
            AssessmentReport.objects.get_or_create(
                assessment=demo_assessment,
                defaults={
                    "organization": mining_org,
                    "title": "2025 ESG Assurance Report — Kgalagadi Colliery",
                    "status": AssessmentReport.ReportStatus.DRAFT,
                    "executive_summary": "This report presents findings from the ESG assurance assessment at Kgalagadi Colliery.",
                    "methodology": "Site visits, stakeholder interviews, document review, and worker surveys.",
                    "scope": "Labour standards, environmental management, community impact.",
                },
            )

            # Findings
            findings = [
                {
                    "topic": "Worker Safety — PPE Compliance",
                    "summary": "Multiple workers observed without required PPE in underground sections.",
                    "recommended_actions": "Implement mandatory PPE checks at entry points. Provide refresher training.",
                    "severity": Finding.Severity.HIGH,
                    "status": Finding.Status.OPEN,
                    "responsible_party": "Site Safety Manager",
                },
                {
                    "topic": "Community Grievance Mechanism",
                    "summary": "No formal grievance mechanism documented for surrounding communities.",
                    "recommended_actions": "Establish community liaison office and complaint tracking system.",
                    "severity": Finding.Severity.MEDIUM,
                    "status": Finding.Status.IN_PROGRESS,
                    "responsible_party": "Community Relations Lead",
                },
                {
                    "topic": "Environmental Monitoring Data Gap",
                    "summary": "Water quality monitoring data missing for Q3 2024.",
                    "recommended_actions": "Install automated monitoring stations and establish reporting cadence.",
                    "severity": Finding.Severity.MEDIUM,
                    "status": Finding.Status.OPEN,
                    "responsible_party": "Environmental Officer",
                },
            ]
            for f_data in findings:
                _, created = Finding.objects.get_or_create(
                    organization=mining_org,
                    assessment=demo_assessment,
                    topic=f_data["topic"],
                    defaults={**f_data, "site": site1, "provision": framework_ecs},
                )
                self.stdout.write(
                    f"  [{'Created' if created else 'Exists'}] Finding: {f_data['topic']}"
                )

            # CIP Cycles
            for label, months in [("12 Month Review", 12), ("24 Month Follow-up", 24)]:
                CIPCycle.objects.get_or_create(
                    organization=mining_org,
                    assessment=demo_assessment,
                    label=label,
                    defaults={
                        "deadline_period_months": months,
                        "start_date": date.today(),
                        "status": CIPCycle.CycleStatus.ACTIVE,
                    },
                )

            # Tasks (linked to findings)
            from assessments.models import Finding as FindingModel

            open_findings = FindingModel.objects.filter(
                assessment=demo_assessment, status=Finding.Status.OPEN
            )
            for finding in open_findings:
                Task.objects.get_or_create(
                    organization=mining_org,
                    assessment=demo_assessment,
                    title=f"Address: {finding.topic}",
                    defaults={
                        "description": finding.recommended_actions,
                        "priority": (
                            Task.Priority.HIGH
                            if finding.severity == Finding.Severity.HIGH
                            else Task.Priority.MEDIUM
                        ),
                        "status": Task.Status.PENDING,
                        "focus_area": demo_assessment.focus_area,
                    },
                )

        # Energy org assessment (oil/gas)
        if energy_org and energy_org.focus_areas.exists():
            oil_focus = energy_org.focus_areas.filter(name="Low Emissions").first()
            if oil_focus:
                energy_assessment, _ = Assessment.objects.get_or_create(
                    organization=energy_org,
                    focus_area=oil_focus,
                    framework=framework_ecs,
                    defaults={
                        "site": site3,
                        "status": Assessment.Status.DRAFT,
                        "start_date": date.today(),
                        "due_date": date.today() + timedelta(days=90),
                        "overall_score": 0.0,
                        "risk_level": Assessment.RiskLevel.HIGH,
                    },
                )
                self.stdout.write(f"  [Upsert] Assessment: {energy_assessment}")

                # Sites findings for oil/gas
                Finding.objects.get_or_create(
                    organization=energy_org,
                    assessment=energy_assessment,
                    topic="Indigenous Rights — Free, Prior, Informed Consent",
                    defaults={
                        "summary": "No evidence of FPIC consultation before block expansion.",
                        "recommended_actions": "Initiate FPIC process with affected communities.",
                        "severity": Finding.Severity.CRITICAL,
                        "status": Finding.Status.OPEN,
                        "responsible_party": "Legal & Community Affairs",
                        "site": site3,
                    },
                )

        # ─────────────────────────────────────────────────────
        # Summary
        # ─────────────────────────────────────────────────────

        # Assign admin user to the first organization if not already assigned
        from organizations.models import OrganizationMembership

        admin_user = User.objects.filter(email="admin@example.com").first()
        if admin_user:
            # Check if admin has any membership
            has_membership = OrganizationMembership.objects.filter(
                user=admin_user
            ).exists()
            if not has_membership:
                first_org = Organization.objects.first()
                if first_org:
                    OrganizationMembership.objects.create(
                        user=admin_user,
                        organization=first_org,
                        fallback_role="ADMIN",
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            "  [Updated] Assigned admin user to Demo Energy Corp"
                        )
                    )

        # Summary
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"Organizations: {Organization.objects.count()}")
        self.stdout.write(f"Frameworks:      {Framework.objects.count()}")
        self.stdout.write(f"Focus Areas:     {ESGFocusArea.objects.count()}")
        self.stdout.write(f"Users:           {User.objects.count()}")
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("Login: admin@example.com / admin"))

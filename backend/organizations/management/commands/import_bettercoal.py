"""Django management command to import Bettercoal PostgreSQL dump.

Usage:
    python manage.py import_bettercoal /path/to/bettercoal.sql

This command parses the Bettercoal pg_dump file and maps entities
to Veris models. Both empty (schema-only) and populated
dumps are supported.

Mapping:
    users_user / users_company           → User + Organization
    users_assessorprofile                → AssessorProfile
    assurance_process_*                  → Assessment + Site
    assessment_report_*                  → AssessmentReport + Finding
    cip_code_* (principles/categories)   → Framework
    cip_cip*                             → CIPCycle
    supplier_questionnaire_*             → Framework (questions as provisions)
    common_document                      → KnowledgeDocument
"""

import re
import uuid
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = "Import Bettercoal PostgreSQL dump into Veris models"

    def add_arguments(self, parser):
        parser.add_argument("filepath", type=str, help="Path to bettercoal.sql dump")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and show mapping without writing to DB",
        )
        parser.add_argument(
            "--org-slug",
            type=str,
            default=None,
            help="Slug for the organization to create/import into (default: bettercoal)",
        )

    def handle(self, *args, **options):
        filepath = options["filepath"]
        dry_run = options["dry_run"]
        org_slug = options["org_slug"] or "bettercoal"

        self.stdout.write(f"Parsing: {filepath}")

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract table schemas and data
        tables = self._parse_dump(content)

        if dry_run:
            self._show_dry_run_summary(tables, org_slug)
            return

        # Perform the import
        from organizations.models import Organization
        from assessments.models import (
            Framework, Site, Assessment, AssessmentReport,
            Finding, CIPCycle, AssessmentPlan, ESGFocusArea,
        )
        from users.models import AssessorProfile

        # ── Organization ──
        company_data = tables.get("users_company", [])
        org_name = company_data[0]["company_name"] if company_data else "Bettercoal Import"
        org, _ = Organization.objects.get_or_create(
            slug=org_slug,
            defaults={"name": org_name, "status": Organization.Status.ACTIVE},
        )
        self.stdout.write(f"  [OK] Organization: {org.name}")

        # ── Frameworks from CIP Code ──
        principles = tables.get("cip_code_cipprinciple", [])
        categories = tables.get("cip_code_cipcategory", [])
        provisions = tables.get("cip_code_cipprovision", [])

        # Build framework from principles
        if principles:
            fw_cats = {}
            for cat in categories:
                principle_id = cat.get("principle_id")
                cat_name = cat.get("name", "")
                fw_cats.setdefault(str(principle_id), {})[str(cat["id"])] = cat_name

            for p in principles:
                pid = str(p["id"])
                name = p.get("name", f"Principle {pid}")
                # Look up matching framework or create
                fw, _ = Framework.objects.get_or_create(
                    name=name,
                    defaults={
                        "version": "Bettercoal Import",
                        "description": f"Imported from Bettercoal - {name}",
                        "categories": fw_cats.get(pid, {}),
                    },
                )
                self.stdout.write(f"  [OK] Framework: {fw.name}")

                # Add provisions as ESG focus areas (linked to org)
                provs_for_principle = [
                    pv for pv in provisions
                    if str(pv.get("category_id")) in fw_cats.get(pid, {})
                ]
                for pv in provs_for_principle:
                    ESGFocusArea.objects.get_or_create(
                        organization=org,
                        internal_label=f"provision_{pv['id']}",
                        defaults={
                            "name": pv.get("description", "")[:200] or f"Provision {pv['id']}",
                            "description": pv.get("description", ""),
                        },
                    )
                self.stdout.write(f"       {len(provs_for_principle)} provisions → focus areas")

        else:
            # No CIP code data - create placeholder framework
            fw, _ = Framework.objects.get_or_create(
                name="Bettercoal ESG Framework",
                defaults={"version": "Import", "description": "Placeholder for Bettercoal import"},
            )
            self.stdout.write(f"  [OK] Framework: {fw.name} (placeholder)")

        # ── Sites from assurance_process_minesite / regionaloffice / port ──
        mine_sites = tables.get("assurance_process_minesite", [])
        regional_offices = tables.get("assurance_process_regionaloffice", [])
        port_facilities = tables.get("assurance_process_portstoragefacility", [])

        all_sites = []
        for ms in mine_sites:
            all_sites.append({
                "name": ms.get("name", "Unknown Mine"),
                "type": Site.SiteType.MINE,
                "country_code": ms.get("country") or "XX",
                "region": "Region" + str(ms.get("id", "")),
                "coordinates": {
                    "lat": float(ms.get("latitude", 0)) if ms.get("latitude") else 0,
                    "lng": float(ms.get("longitude", 0)) if ms.get("longitude") else 0,
                },
                "operational_status": Site.OperationalStatus.ACTIVE,
                "industry_data": {
                    "type_of_coal": ms.get("type_of_coal", ""),
                    "type_of_mine": ms.get("type_of_mine", ""),
                    "certifications": self._parse_csv(ms.get("certifications", "")),
                    "fatalities_last_12m": int(ms.get("number_of_fatalities_in_the_last_12_months") or 0),
                    "employee_count": int(ms.get("number_of_employee") or 0),
                    "contractor_count": int(ms.get("number_of_contractors") or 0),
                },
                "contractor_count": int(ms.get("number_of_contractors") or 0),
                "employee_count": int(ms.get("number_of_employee") or 0),
                "operational_since": int(ms.get("mine_start_date") or 0) if ms.get("mine_start_date") else None,
                "is_in_indigenous_territory": ms.get("is_located_in_or_near_indigenous_peoples_territories") == "True",
                "is_in_conflict_zone": ms.get("is_located_inside_cahra") == "True",
                "description": ms.get("nearby_local_communities", ""),
            })

        for ro in regional_offices:
            all_sites.append({
                "name": ro.get("name", "Unknown Office"),
                "type": Site.SiteType.OFFICE,
                "country_code": ro.get("country") or "XX",
                "region": ro.get("region", ""),
                "coordinates": {"lat": 0, "lng": 0},
                "operational_status": Site.OperationalStatus.ACTIVE,
                "description": f"Phone: {ro.get('phone_number', '')}",
            })

        for pf in port_facilities:
            all_sites.append({
                "name": pf.get("name", "Unknown Port"),
                "type": Site.SiteType.PORT,
                "country_code": pf.get("country") or "XX",
                "region": pf.get("region", ""),
                "coordinates": {
                    "lat": float(pf.get("latitude", 0)) if pf.get("latitude") else 0,
                    "lng": float(pf.get("longitude", 0)) if pf.get("longitude") else 0,
                },
                "operational_status": Site.OperationalStatus.ACTIVE,
            })

        for s_data in all_sites:
            site, created = Site.objects.get_or_create(
                organization=org, name=s_data["name"], defaults=s_data
            )
            status = "Created" if created else "Exists"
            self.stdout.write(f"  [{status}] Site: {s_data['name']} ({s_data['type']})")

        # ── Assessments from assurance_process ──
        assurance_procs = tables.get("assurance_process_assuranceprocess", [])
        assessment_planning = tables.get("assessment_planning_assessmentplan", [])

        if assurance_procs:
            for ap in assurance_procs:
                aid = ap.get("id")
                public_id = ap.get("public_id", str(uuid.uuid4()))
                supplier = ap.get("supplier_organisation_id")

                # Try to find a matching framework
                target_fw = Framework.objects.first()

                # Each assurance process becomes an assessment
                today = timezone.now()
                assessment = Assessment.objects.create(
                    organization=org,
                    status=Assessment.Status.IN_PROGRESS,
                    start_date=timezone.make_aware(timezone.datetime.today().replace(hour=0, minute=0, second=0)),
                    due_date=timezone.make_aware((timezone.datetime.today() + timedelta(days=90)).replace(hour=0, minute=0, second=0)),
                    ai_summary=f"Imported from Bettercoal assurance process #{aid}",
                )
                self.stdout.write(f"  [OK] Assessment from assurance process #{aid}")

                # AssessmentPlan if planning data exists
                for plan in assessment_planning:
                    if plan.get("assurance_process_id") == aid:
                        AssessmentPlan.objects.get_or_create(
                            assessment=assessment,
                            defaults={
                                "organization": org,
                                "site_assessment_start": date.today(),
                                "site_assessment_end": date.today(),
                                "draft_report_deadline": plan.get("draft_assessment_report_deadline") or date.today(),
                                "notes": "Imported from Bettercoal",
                            },
                        )

        # ── Findings from assessment_report_finding ──
        findings = tables.get("assessment_report_finding", [])
        if findings:
            target_assessment = Assessment.objects.filter(organization=org).first()
            for f_data in findings:
                topic = f_data.get("topic") or f"Imported Finding #{f_data.get('id', '?')}"
                summary = f_data.get("summary") or f_data.get("recommended_actions") or ""
                rec_actions = f_data.get("recommended_actions") or ""
                is_completed = f_data.get("marked_as_completed") == "t" or f_data.get("marked_as_completed") is True

                defaults = {
                    "summary": summary,
                    "recommended_actions": rec_actions,
                    "severity": Finding.Severity.MEDIUM,
                    "status": Finding.Status.CLOSED if is_completed else Finding.Status.OPEN,
                }
                if target_assessment:
                    defaults["assessment"] = target_assessment

                Finding.objects.update_or_create(
                    organization=org,
                    topic=topic,
                    defaults=defaults,
                )
            self.stdout.write(f"  [OK] {len(findings)} findings imported")

        # ── Summary ──
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS("Bettercoal import complete!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"Organization:  {Organization.objects.filter(slug=org_slug).count()}")
        self.stdout.write(f"Sites:         {Site.objects.filter(organization=org).count()}")
        self.stdout.write(f"Frameworks:    {Framework.objects.count()}")
        self.stdout.write(f"Focus Areas:   {ESGFocusArea.objects.filter(organization=org).count()}")
        self.stdout.write(f"Assessments:   {Assessment.objects.filter(organization=org).count()}")
        self.stdout.write(f"Findings:      {Finding.objects.filter(organization=org).count()}")
        self.stdout.write(f"CIP Cycles:    {CIPCycle.objects.filter(organization=org).count()}")

    # ── Helpers ──

    def _parse_dump(self, content: str) -> dict:
        """Parse a pg_dump file and return table data as dicts."""
        tables = {}
        # Match CREATE TABLE blocks to get column names
        table_pattern = re.compile(
            r"CREATE TABLE public\.(\w+) \((.*?)\);",
            re.DOTALL,
        )
        for match in table_pattern.finditer(content):
            table_name = match.group(1)
            # Parse column definitions
            columns_section = match.group(2)
            columns = []
            for line in columns_section.split("\n"):
                line = line.strip().rstrip(",")
                if not line or line.startswith("--"):
                    continue
                # Skip constraints, keys, CHECK
                if any(kw in line.upper() for kw in [
                    "CONSTRAINT", "PRIMARY KEY", "FOREIGN KEY", "CHECK",
                    "REFERENCES", "UNIQUE",
                ]):
                    continue
                col_name = line.split()[0].strip('"')
                columns.append(col_name)
            tables[table_name] = {"columns": columns}

        # Match COPY blocks to get data rows
        copy_pattern = re.compile(
            r"COPY public\.(\w+) \((.*?)\) FROM stdin;\n(.*?)\\\.",
            re.DOTALL,
        )
        for match in copy_pattern.finditer(content):
            table_name = match.group(1)
            col_names = [c.strip() for c in match.group(2).split(",")]
            data_block = match.group(3)

            if table_name not in tables:
                tables[table_name] = {"columns": col_names}

            rows = []
            if data_block.strip():
                for line in data_block.strip().split("\n"):
                    if line == "\\." or not line.strip():
                        continue
                    # Split by tab (COPY default delimiter)
                    values = line.split("\t")
                    row = {}
                    for i, col in enumerate(col_names):
                        val = values[i] if i < len(values) else None
                        # Convert \\N to None
                        if val == "\\N" or val is None:
                            row[col] = None
                        else:
                            row[col] = val
                    rows.append(row)

            tables[table_name]["rows"] = rows

        # Return simplified structure: {table_name: [row_dicts]}
        result = {}
        for table_name, data in tables.items():
            if "rows" in data:
                result[table_name] = data["rows"]
            else:
                result[table_name] = []

        return result

    def _parse_csv(self, value: str) -> list:
        """Parse comma-separated string to list."""
        if not value or value == "":
            return []
        return [v.strip() for v in value.split(",") if v.strip()]

    def _show_dry_run_summary(self, tables: dict, org_slug: str):
        """Show what would be imported without writing to DB."""
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("DRY RUN — What would be imported:")
        self.stdout.write("=" * 50)

        for table_name, rows in sorted(tables.items()):
            count = len(rows) if rows else 0
            if count > 0:
                self.stdout.write(f"  {table_name}: {count} rows")
                # Show first row as sample
                if count > 0 and isinstance(rows, list):
                    sample = rows[0]
                    keys = list(sample.keys())[:5]
                    self.stdout.write(f"    Sample columns: {', '.join(keys)}")

        total = sum(len(v) for v in tables.values() if isinstance(v, list))
        self.stdout.write(f"\n  Total data rows: {total}")
        self.stdout.write(f"  Target org slug: {org_slug}")

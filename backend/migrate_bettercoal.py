"""
Migrate Bettercoal data into Veris database.

Reads from bettercoal_temp database (where SQL dump was loaded)
and inserts into Veris tables with correct column names + UUIDs.
"""

import json
import os
import uuid

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django

django.setup()

from urllib.parse import urlparse

import psycopg2
import psycopg2.extras
from django.utils import timezone

_db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:db@db:5432/veris")
_parsed = urlparse(_db_url)
_PG = {
    "host": _parsed.hostname or "db",
    "port": _parsed.port or 5432,
    "user": _parsed.username or "postgres",
    "password": _parsed.password or "db",
}
VERIS_DB = _parsed.path.lstrip("/")
TEMP_DB = "bettercoal_temp"


def c(dbname):
    return psycopg2.connect(**{**_PG, "dbname": dbname})


def main():
    print("=" * 50)
    print("Bettercoal → Veris Migration")
    print("=" * 50)

    t = c(TEMP_DB)
    v = c(VERIS_DB)
    tc = t.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    vc = v.cursor()
    vc.execute("SET session_replication_role = 'replica';")
    total = 0

    # ── 1. Framework: Bettercoal Standard (+ 144 provisions as questions) ──
    print("\n1. Framework + Provisions → Questions...")
    fw_id = uuid.uuid4()
    vc.execute(
        """
        INSERT INTO frameworks (id, name, version, description, categories,
                                scoring_methodology, reporting_period, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING""",
        (
            fw_id,
            "Bettercoal Standard",
            "2023.1",
            "Bettercoal Sustainable Coal Mining Assurance Standard",
            "{}",
            "{}",
            "",
        ),
    )
    total += 1
    v.commit()

    # Get existing org for linking (seed already created some)
    vc.execute("SELECT id FROM organizations LIMIT 1")
    row = vc.fetchone()
    default_org = row[0] if row else None
    if not default_org:
        default_org = uuid.uuid4()
        vc.execute(
            """
            INSERT INTO organizations (id, name, slug, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())""",
            (default_org, "Bettercoal Mining Corp", "bettercoal-mining", "active"),
        )
        v.commit()
        print(f"  Created default org: Bettercoal Mining Corp")

    # Create a template for Bettercoal questions (skip if exists)
    vc.execute(
        "SELECT id FROM assessment_templates WHERE name = %s LIMIT 1",
        ("Bettercoal Standard Template",),
    )
    existing_tmpl = vc.fetchone()
    if existing_tmpl:
        tmpl_id = existing_tmpl[0]
        print(f"  Template already exists: {tmpl_id}")
    else:
        tmpl_id = uuid.uuid4()
        vc.execute(
            """
            INSERT INTO assessment_templates (id, organization_id, name, description,
                                              framework_id, questions, is_system,
                                              created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, true, NOW(), NOW())""",
            (
                tmpl_id,
                default_org,
                "Bettercoal Standard Template",
                "Auto-migrated from Bettercoal CIP provisions",
                fw_id,
                "[]",
            ),
        )
        total += 1
        v.commit()

    tc.execute(
        """
        SELECT cp.id, cp.description, ccp.name as principle, cpcc.name as category,
               cp.sequence_number
        FROM cip_code_cipprovision cp
        JOIN cip_code_cipcategory cpcc ON cp.category_id = cpcc.id
        JOIN cip_code_cipprinciple ccp ON cpcc.principle_id = ccp.id
        ORDER BY cpcc.principle_id, cpcc.sequence_number, cp.sequence_number
    """
    )
    provisions = tc.fetchall()
    for p in provisions:
        vc.execute(
            """
            INSERT INTO assessment_questions (id, template_id, text, "order",
                                category, scoring_criteria, is_required)
            VALUES (%s, %s, %s, %s, %s, %s, true)
            ON CONFLICT (id) DO NOTHING""",
            (
                uuid.uuid4(),
                tmpl_id,
                p["description"] or "",
                p["sequence_number"],
                f"{p['principle']} – {p['category']}".strip(),
                "{}",
            ),
        )
        total += 1
    v.commit()
    print(f"  Created framework + {len(provisions)} provision questions")

    # ── 2. Users ──
    print("\n2. Users...")
    user_map = {}
    vc.execute("SELECT email FROM users")
    existing_emails = {r[0] for r in vc.fetchall()}

    tc.execute(
        """SELECT id, email, name, password, role, is_superuser,
                         is_staff, is_active, date_joined, company_id
                  FROM users_user WHERE is_active = true"""
    )
    for u in tc.fetchall():
        if u["email"] in existing_emails:
            vc.execute("SELECT id FROM users WHERE email = %s", (u["email"],))
            r = vc.fetchone()
            if r:
                user_map[u["id"]] = r[0]
            print(f"  SKIP exists: {u['email']}")
            continue

        uid = uuid.uuid4()
        user_map[u["id"]] = uid
        role = "admin" if u["is_superuser"] else "viewer"
        db_role = (u.get("role") or "").lower()
        if db_role in ("secretariat", "admin manager", "admin"):
            role = "admin"
        elif db_role in ("assessor", "team assessor"):
            role = "manager"

        vc.execute(
            """
            INSERT INTO users (id, email, name, password, role, is_active,
                               is_staff, is_superuser, organization_id,
                               status, timezone, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING""",
            (
                uid,
                u["email"],
                u["name"] or "",
                u["password"],
                role,
                u["is_active"],
                u["is_staff"],
                u["is_superuser"],
                default_org,
                "active",
                "UTC",
            ),
        )
        total += 1
        print(f"  {u['name']} <{u['email']}> → {role}")
    v.commit()

    # Helper: insert into sites with all NOT NULL columns
    def insert_site(
        sid,
        name,
        site_type,
        country,
        region,
        description,
        op_status,
        risk,
        emp_count,
        ctr_count,
        op_since,
        lifetime,
        expansion,
        industry,
        certs,
        other_certs,
        conflict,
        indigenous,
        org_id,
    ):
        vc.execute(
            """
            INSERT INTO sites (
                id, name, type, country_code, region, coordinates,
                operational_status, certifications, description,
                employee_count, contractor_count,
                operational_since, estimated_lifetime_years,
                expansion_plan, industry_data,
                is_in_conflict_zone, is_in_indigenous_territory,
                other_certifications, risk_profile,
                organization_id, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, NOW(), NOW()
            ) ON CONFLICT (id) DO NOTHING
        """,
            (
                sid,
                name,
                site_type,
                country or "",
                region,
                "{}",
                op_status,
                json.dumps(certs) if certs else "[]",
                description,
                emp_count,
                ctr_count,
                op_since,
                lifetime,
                expansion,
                json.dumps(industry) if industry else "{}",
                conflict,
                indigenous,
                other_certs or "",
                risk,
                org_id,
            ),
        )

    # ── 3. Sites ──
    print("\n3. Sites...")
    site_map = {}

    # Mines
    tc.execute(
        """SELECT id, name, country, type_of_coal, type_of_mine,
                         latitude, longitude, certifications,
                         estimated_years_mine_lifetime, mine_start_date,
                         has_expansion_plan_within_5_years,
                         number_of_male_employees, number_of_female_employees,
                         number_of_contractors,
                         number_of_fatalities_in_the_last_12_months,
                         number_of_severe_injuries_in_the_last_12_months,
                         other_certifications, is_located_inside_cahra,
                         is_located_in_or_near_indigenous_peoples_territories
                  FROM assurance_process_minesite"""
    )
    for s in tc.fetchall():
        sid = uuid.uuid4()
        site_map[("mine", s["id"])] = sid
        desc = f"{s.get('type_of_mine','')} – {s.get('type_of_coal','')}"
        certs_raw = s.get("certifications", "")
        certs = certs_raw.split(",") if certs_raw else []
        emp = (s.get("number_of_male_employees") or 0) + (
            s.get("number_of_female_employees") or 0
        )
        ctr = s.get("number_of_contractors") or 0
        fatal = s.get("number_of_fatalities_in_the_last_12_months") or 0
        injuries = s.get("number_of_severe_injuries_in_the_last_12_months") or 0
        risk = "CRITICAL" if fatal > 0 else "HIGH" if injuries > 2 else "MEDIUM"
        lat = float(s["latitude"]) if s.get("latitude") else None
        coords = json.dumps({"lat": lat, "lng": float(s["longitude"])}) if lat else "{}"

        insert_site(
            sid,
            s["name"],
            "MINE",
            s.get("country"),
            "",
            desc.strip(),
            "ACTIVE",
            risk,
            emp,
            ctr,
            s.get("mine_start_date"),
            s.get("estimated_years_mine_lifetime"),
            s.get("has_expansion_plan_within_5_years", ""),
            {"fatalities": fatal, "injuries": injuries},
            certs,
            s.get("other_certifications", ""),
            bool(s.get("is_located_inside_cahra")),
            bool(s.get("is_located_in_or_near_indigenous_peoples_territories")),
            default_org,
        )
        total += 1
        print(f"  Mine: {s['name']} ({s.get('country','')})")
    v.commit()

    # Ports
    tc.execute(
        """SELECT id, name, country, number_of_male_employees,
                         number_of_female_employees, number_of_contractors,
                         relation_to_mine_sites, is_located_inside_cahra,
                         is_located_in_or_near_indigenous_peoples_territories
                  FROM assurance_process_portstoragefacility"""
    )
    for s in tc.fetchall():
        sid = uuid.uuid4()
        site_map[("port", s["id"])] = sid
        emp = (s.get("number_of_male_employees") or 0) + (
            s.get("number_of_female_employees") or 0
        )
        ctr = s.get("number_of_contractors") or 0
        insert_site(
            sid,
            s["name"],
            "PORT",
            s.get("country"),
            s.get("relation_to_mine_sites", "")[:200],
            s.get("relation_to_mine_sites", ""),
            "ACTIVE",
            "MEDIUM",
            emp,
            ctr,
            None,
            None,
            "",
            "{}",
            [],
            "",
            bool(s.get("is_located_inside_cahra")),
            bool(s.get("is_located_in_or_near_indigenous_peoples_territories")),
            default_org,
        )
        total += 1
        print(f"  Port: {s['name']}")
    v.commit()

    # Transport
    tc.execute(
        """SELECT id, name, country, type_of_transportation,
                         relation_to_mine_sites
                  FROM assurance_process_transportationinfrastructure"""
    )
    for s in tc.fetchall():
        sid = uuid.uuid4()
        site_map[("transport", s["id"])] = sid
        desc = f"{s.get('type_of_transportation','')} – {s.get('relation_to_mine_sites','')}"
        insert_site(
            sid,
            s["name"],
            "TRANSPORT",
            s.get("country"),
            s.get("relation_to_mine_sites", "")[:200],
            desc.strip() if desc.strip() else "Transport infrastructure",
            "ACTIVE",
            "MEDIUM",
            0,
            0,
            None,
            None,
            "",
            "{}",
            [],
            "",
            False,
            False,
            default_org,
        )
        total += 1
        print(f"  Transport: {s['name']}")
    v.commit()

    # ── 4. Assessments ──
    print("\n4. Assessments...")
    proc_map = {}

    tc.execute(
        """
        SELECT id, lead_assessor_id, created, bettercoal_claim
        FROM assurance_process_assuranceprocess
    """
    )
    for p in tc.fetchall():
        aid = uuid.uuid4()
        proc_map[p["id"]] = aid
        assigned = user_map.get(p.get("lead_assessor_id"))
        creator = assigned

        # First site in this process
        first_site = None
        tc.execute(
            "SELECT id FROM assurance_process_minesite WHERE assurance_process_id = %s LIMIT 1",
            (p["id"],),
        )
        mm = tc.fetchone()
        if mm:
            first_site = site_map.get(("mine", mm["id"]))
        if not first_site:
            tc.execute(
                "SELECT id FROM assurance_process_portstoragefacility WHERE assurance_process_id = %s LIMIT 1",
                (p["id"],),
            )
            pp = tc.fetchone()
            if pp:
                first_site = site_map.get(("port", pp["id"]))

        summary = f"BetterCoal assessment. Claim: {p.get('bettercoal_claim', '')}"
        vc.execute(
            """
            INSERT INTO assessments (id, status, start_date, due_date,
                                     overall_score, risk_level, ai_summary,
                                     created_by_id, assigned_to_id, site_id,
                                     organization_id, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
            ON CONFLICT (id) DO NOTHING""",
            (
                aid,
                "COMPLETED",
                p.get("created"),
                (
                    p["created"] + timezone.timedelta(days=365)
                    if p.get("created")
                    else None
                ),
                75.0,
                "MEDIUM",
                summary,
                creator,
                assigned,
                first_site,
                default_org,
            ),
        )
        total += 1
        print(f"  Assessment {p['id']} → {aid}")
    v.commit()

    # ── 5. Reports + Findings ──
    print("\n5. Assessment Reports + Findings...")
    tc.execute(
        "SELECT id, assurance_process_id FROM assessment_report_assessmentreport"
    )
    for report in tc.fetchall():
        assessment_id = proc_map.get(report["assurance_process_id"])
        if not assessment_id:
            continue

        rid = uuid.uuid4()
        sections = {}
        # Exec summary, methodology, scope, conclusion, disclaimer all have "text" column
        simple_sections = [
            ("executivesummary", "assessment_report_executivesummary"),
            ("methodology", "assessment_report_assessmentmethodology"),
            ("scope", "assessment_report_assessmentpurposeandscope"),
            ("conclusion", "assessment_report_conclusionandnextsteps"),
            ("disclaimer", "assessment_report_disclaimer"),
        ]
        for sect, tbl in simple_sections:
            tc.execute(
                f"SELECT text FROM {tbl} WHERE assessment_report_id = %s LIMIT 1",
                (report["id"],),
            )
            row = tc.fetchone()
            if row and row.get("text"):
                sections[sect] = row["text"]

        # Country context has different columns: general, regulation, occupation_health_and_safety
        tc.execute(
            """SELECT general, regulation, occupation_health_and_safety
                      FROM assessment_report_countrycontext
                      WHERE assessment_report_id = %s LIMIT 1""",
            (report["id"],),
        )
        cc = tc.fetchone()
        if cc:
            parts = [
                c
                for c in [
                    cc.get("general"),
                    cc.get("regulation"),
                    cc.get("occupation_health_and_safety"),
                ]
                if c
            ]
            if parts:
                sections["countrycontext"] = "\n\n".join(parts)

        # stakeholdermeetingssummaries is a relational table, just get the meeting names if possible
        # For now, leave as empty list since the table has no text column
        stakeholders = []

        tc.execute(
            """SELECT text FROM assessment_report_assessmentlimitations
                      WHERE assessment_report_id = %s""",
            (report["id"],),
        )
        limitations = [r["text"] for r in tc.fetchall() if r.get("text")]

        vc.execute(
            """
            INSERT INTO assessment_reports (id, title, status, executive_summary,
                methodology, scope, country_context, conclusion,
                meeting_participants, stakeholder_meetings, limitations,
                disclaimer, assessment_start_date, assessment_end_date,
                report_published_date, assessment_id, organization_id,
                created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
            ON CONFLICT (id) DO NOTHING""",
            (
                rid,
                f"Assessment Report {report['id']}",
                "COMPLETED",
                sections.get("executivesummary", ""),
                sections.get("methodology", ""),
                sections.get("scope", ""),
                sections.get("countrycontext", ""),
                sections.get("conclusionandnextsteps", ""),
                "[]",
                stakeholders,
                limitations,
                sections.get("disclaimer", ""),
                None,
                None,
                None,
                assessment_id,
                default_org,
            ),
        )
        total += 1
        print(f"  Report {report['id']} → {rid}")

        # Findings
        tc.execute(
            """SELECT id, topic, summary, recommended_actions,
                             marked_as_completed, provision_id
                      FROM assessment_report_finding
                      WHERE assessment_report_id = %s""",
            (report["id"],),
        )
        for f in tc.fetchall():
            fid = uuid.uuid4()
            status = "RESOLVED" if f.get("marked_as_completed") else "OPEN"
            vc.execute(
                """
                INSERT INTO findings (id, topic, summary, recommended_actions,
                    severity, status, responsible_party, supplier_response, assessor_comments,
                    marked_as_completed, assessment_id, organization_id, report_id, site_id,
                    provision_id, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                ON CONFLICT (id) DO NOTHING""",
                (
                    fid,
                    f.get("topic") or "Finding",
                    f.get("summary") or "",
                    f.get("recommended_actions") or "",
                    "MEDIUM",
                    status,
                    "",
                    "",
                    "",
                    f.get("marked_as_completed", False),
                    assessment_id,
                    default_org,
                    rid,
                    None,
                    None,
                ),
            )
            total += 1
    v.commit()

    # ── 6. Documents ──
    print("\n6. Documents...")
    tc.execute(
        """SELECT id, file, original_file_name, document_type,
                         uploaded_by_id FROM common_document"""
    )
    docs = tc.fetchall()
    for doc in docs:
        did = uuid.uuid4()
        uploader = user_map.get(doc.get("uploaded_by_id"))
        title = (doc.get("original_file_name") or doc.get("file", "Document")).split(
            "/"
        )[-1]
        ftype = doc.get("document_type", "")[:20]

        vc.execute(
            """
            INSERT INTO knowledge_documents (id, title, description, file_url,
               file_type, file_size, category, embeddings_indexed, chunk_count,
               vector_ids, framework_tags, created_by_id, organization_id,
               created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
            ON CONFLICT (id) DO NOTHING""",
            (
                did,
                title,
                "",
                doc.get("file", "") or "",
                ftype,
                0,
                "",
                False,
                0,
                "[]",
                "[]",
                uploader,
                default_org,
            ),
        )
        total += 1
    print(f"  Migrated {len(docs)} documents")
    v.commit()

    # Done
    vc.execute("SET session_replication_role = 'origin';")
    v.commit()
    t.close()
    v.close()

    print(f"\n{'='*50}")
    print(f"Migration complete! {total} records migrated")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()

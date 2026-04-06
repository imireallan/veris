# Testing the Database from the Frontend UI

## Quick Login

```
Email:    admin@example.com
Password: admin
```

## Step-by-Step Testing Guide

### 1. Log In
- Open http://localhost:5173
- Enter credentials above
- Click "Sign In" — you land on the Dashboard

### 2. Open the Data Browser
- Click **Data** in the left sidebar (or go to http://localhost:5173/data)
- The Data Browser loads all records from the database in one view

### 3. What You'll See

The Data Browser has 7 tabs:

| Tab | What It Shows | Seed Data | Bettercoal Import |
|-----|--------------|-----------|-------------------|
| **Findings** | Assessment findings with severity, status, recommendations | 4 findings (PPE, Grievance, Water Quality, FPIC) | 3 findings from their assessment reports |
| **Sites** | Physical locations with industry-specific data | 3 sites (coal mine, processing plant, oil rig) | 3 mine sites with coal fields |
| **Reports** | Structured assessment reports | 1 mining report with methodology/scope | None (dump had empty report sections) |
| **CIP Cycles** | Continuous improvement monitoring cycles | 2 cycles (12-month, 24-month) | None |
| **Assess. Plans** | Site visit scheduling and deadlines | 1 plan with site visit dates | 2 plans from assessment_planning |
| **Frameworks** | ESG/sustainability frameworks | 3 frameworks + their focus areas | 12 Bettercoal/CIP Code principles |
| **Organizations** | Multi-tenant org list | 3 (Energy, Mining, Automotive) | 1 (Bettercoal Import) |

### 4. Test Each Model

**Findings Tab** — Verify:
- Severities: LOW/MEDIUM/HIGH/CRITICAL
- Status: OPEN/IN_PROGRESS/CLOSED/RESOLVED/WAIVED
- Summary text and recommended actions display
- Responsible party is tracked
- Bettercoal findings show as "New Finding" with HTML content (their data has rich text)

**Sites Tab** — Verify:
- Site types: MINE, FACILITY, OPERATION
- Risk profiles: HIGH, MEDIUM, CRITICAL
- Country codes: ZA (South Africa), NG (Nigeria)
- Industry-specific data (industry_data JSON) for coal types, certifications
- Employee and contractor counts
- Indigenous territory and conflict zone flags

**Reports Tab** — Verify:
- Report title: "2025 ESG Assurance Report — Kgalagadi Colliery"
- Executive summary and methodology fields populate
- Status shows DRAFT

**CIP Cycles Tab** — Verify:
- Labels: "12 Month Review", "24 Month Follow-up"
- Monitoring period in months (12, 24)
- Status: ACTIVE

**Assessment Plans Tab** — Verify:
- Site visit start/end dates
- Draft and final report deadlines
- Notes field shows assessment scope

**Frameworks Tab** — Verify:
- 3 seed frameworks (Energy Certification, OECD, RBA)
- 12 Bettercoal frameworks (Business Integrity, Human Rights, etc.)
- Each has version and description
- Some have categories object with key-value pairs

### 5. Test CRUD via Django Admin

Go to http://localhost:8000/admin to modify data:
1. Log in with admin@example.com / admin
2. Navigate to "Findings" → click one → edit severity/status → save
3. Refresh /data to see the change
4. Create a new Finding, Site, or CIP Cycle manually
5. Verify it appears in the Data Browser

### 6. Test via API Directly

```bash
# All resources (authenticated via cookie)
curl -b "access_token=<YOUR_TOKEN>" http://localhost:8000/api/findings/
curl -b "access_token=<YOUR_TOKEN>" http://localhost:8000/api/sites/
curl -b "access_token=<YOUR_TOKEN>" http://localhost:8000/api/reports/
curl -b "access_token=<YOUR_TOKEN>" http://localhost:8000/api/cip-cycles/
curl -b "access_token=<YOUR_TOKEN>" http://localhost:8000/api/plans/

# Create a finding
curl -X POST http://localhost:8000/api/findings/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "topic": "Test Finding from API",
    "summary": "Finding created via REST API",
    "severity": "HIGH",
    "status": "OPEN",
    "organization": "YOUR_ORG_ID"
  }'
```

### 7. Reimport Bettercoal Data (if you want a fresh test)

```bash
# Clean and reimport
make down-clean
make setup                 # run migrations + seed
docker compose run --rm backend python manage.py import_bettercoal bettercoal.sql
make up
```

## What Each Tab Validates

| Tab | Proves This Works |
|-----|-------------------|
| Findings | New Finding model + Bettercoal data mapping |
| Sites | Extended Site model with industry_data JSON |
| Reports | AssessmentReport model (multi-section) |
| CIP Cycles | CIPCycle model (monitoring cycles) |
| Plans | AssessmentPlan model (scheduling) |
| Frameworks | Bettercoal 12 CIP principles imported |
| Organizations | Multi-tenant across industries |

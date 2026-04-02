# ESG Framework Data Models

## Based On: Real-World Analysis

This document captures the actual data structures from the Major Energy Operator ESG Certification Standard sustainability page, Consultancy Digital Platform, and the Coal Industry Program assessment codebase. These form the foundation for our product's data models.

---

## The Real ESG Focus Areas (From Major Energy Operator)

The Operator's ESG materiality assessment identified **6 focus areas** that define their entire program:

| # | Focus Area | Internal Label | What It Covers |
|---|-----------|---------------|----------------|
| 1 | Ethics | `ethics` | Business ethics, corporate governance |
| 2 | Low Emissions | `low_emissions` | GHG emissions, climate targets |
| 3 | Retirement of Assets | `retirement_of_assets` | Decommissioning, reclamation, site restoration |
| 4 | Rights | `rights` | Indigenous Peoples' rights, land access |
| 5 | Community Relations | `community_relations` | Social impact, engagement, shared value |
| 6 | Talent Attraction | `talent_attraction` | Recruitment, retention, engagement |

## The ESG Certification Standard 5 Principles (From Certification Body)

The certification standard they're assessed against:

| Principle | Content | Maps To ARC Focus Areas |
|-----------|---------|----------------------|
| 1 | Corporate governance, transparency and ethics | Ethics |
| 2 | Human rights, social impact and community development | Rights, Community Relations |
| 3 | Indigenous Peoples' rights | Rights |
| 4 | Fair labour and working conditions | Talent Attraction |
| 5 | Climate change, biodiversity and environment | Low Emissions, Retirement of Assets |

**Key insight**: Companies map their internal ESG focus areas to certification principles. Our product needs to support this mapping — users don't just answer questions, they show how their programs connect to multiple frameworks simultaneously.

---

## The Multi-Framework Reporting Problem

ARC tracks ratings from **4 separate agencies** at once:

| Agency | Score/Status | What They Measure |
|--------|-------------|------------------|
| MSCI | ESG Rating: AAA | Environmental, Social, Governance performance |
| Sustainalytics | Score: 48.2 | ESG risk (lower = better risk management) |
| ISS | Environment: 8, Social: 7, Governance: 1 | Separate ESG pillar scores |
| Certification Body | ESG Certification Standard Certified | Site-level certification status |

**This means:** Every data point collected (emissions, community engagement, governance policies) feeds into multiple reporting frameworks simultaneously. Each framework has:
- Different scoring methodologies
- Different reporting periods
- Different data requirements
- Different update frequencies

Our product's killer feature: **Collect once, report everywhere.** The AI maps single data entries to all applicable frameworks automatically.

---

## Consultancy Digital Platform Tools (From [REDACTED])

The 5 separate tools they currently offer, which our product unifies:

| Tool | Purpose | Data Model Implications |
|------|---------|------------------------|
| Supply Chain & Due Diligence (TEDD) | Supplier risk assessment | Supplier entities, risk scoring, evidence |
| Country Risk Tool | Regional risk assessment | Country entities, risk factors (political, regulatory) |
| Commodity Risk Tool | Material-specific risk | Commodity entities, supply chain mapping |
| Standards & Regulations (ICAT) | ESG standards tracking | Standards library, compliance mapping |
| Search360 News Monitor | Risk monitoring | News feeds, entity monitoring, alerts |

---

## Coal Industry Program Assessment Workflow (From Codebase)

The actual workflow from the Coal Industry Program codebase in `~/Projects/Our Consultancy Client/coal-program/`:

```
Organization → User (with role) → Process → Questionnaire → Assessment → Finding → CIP

Specific entities found in code:
├── User (role: SECRETARIAT, MEMBER, SUPPLIER, ASSESSOR)
├── Organization (member company or supplier)
├── AssuranceProcess (main assessment entity)
├── SupplierQuestionnaire (SAQ)
│   ├── SQAnswer (individual answer)
│   └── SQCategoryResponse (grouped answers by category)
├── MineSite (specific location being assessed)
├── ExtendedOperationsInformation (detailed site info)
├── BaseOperationsInformation (basic site info)
├── AssessmentReport (output)
├── ContinuousImprovementProcess (CIP)
│   └── CIPFinding (identified issue)
├── ActionDeadline (tracking)
└── Notifications (reminders)
```

---

## Our Unified Data Model

### ESG Focus Area (The core organizing unit)

```python
class ESGFocusArea:
    id: UUID
    organization_id: UUID
    name: str              # "Ethics", "Low Emissions", etc.
    internal_label: str    # "ethics", "low_emissions"
    description: str
    owner: UUID            # User responsible
    frameworks: JSONB      # Which frameworks this maps to
    
    # Framework mappings
    esg-standard_principle_ids: JSONB[]    # [1, 5] etc.
    msci_category_ids: JSONB[]      # MSCI pillar mappings
    issu_category_ids: JSONB[]      # ISS pillar mappings
    sustainalytics_category_ids: JSONB[]
    
    # Tracking
    current_score: Float
    trend: Enum          # UP, DOWN, STABLE, INSUFFICIENT_DATA
    last_assessed: Timestamp
    
    # AI enrichment
    ai_last_review: Timestamp
    ai_risk_level: Enum  # LOW, MEDIUM, HIGH
    ai_gaps: JSONB       # AI-identified gaps
    ai_recommendations: JSONB
```

### Framework Registry (Maps all external frameworks)

```python
class Framework:
    id: UUID
    name: str                    # "ESG Certification Standard", "MSCI", "Sustainalytics"
    version: str                 # "2023.1"
    description: str
    scoring_methodology: JSONB   # How they score
    reporting_period: str        # "Annual", "Quarterly"
    categories: JSONB[]          # Their category structure
    last_synced: Timestamp       # When we last checked for updates
```

### Assessment Response (The core data collection unit)

```python
class AssessmentResponse:
    id: UUID
    organization_id: UUID
    focus_area_id: UUID          # Which ESG area
    framework_id: UUID           # Which framework
    question_id: UUID
    answer_text: str
    answer_score: Float
    evidence_files: JSONB[]
    ai_confidence: Float
    ai_validated: Boolean        # Has AI checked consistency
    frameworks_mapped: JSONB[]   # Auto-mapped to other frameworks
```

### Rating Tracker (Tracks external agency scores)

```python
class ExternalRating:
    id: UUID
    organization_id: UUID
    agency: Enum                 # MSCI, SUSTAINALYTICS, ISS
    score: Float
    score_date: Date
    category_scores: JSONB       # {"Environment": 8, "Social": 7, "Governance": 1}
    methodology_version: str
    trend_vs_previous: Float
    ai_analysis: str             # AI analysis of what changed
```

---

## AI Data Pipeline For ESG

```
Data Collection Question ──► User Response ──► AI Validation
                                        │
                                        ▼
                              Multi-Framework Mapping
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              ESG Certification Standard Mapping       MSCI Mapping        ISS Mapping
                    │                   │                   │
                    ▼                   ▼                   ▼
              ESG Certification Standard Report        MSCI Report         ISS Report
```

### AI Mapping Rules Engine

The AI automatically answers:
1. **Cross-framework mapping**: "This GHG data point feeds into ESG Certification Standard Principle 5, MSCI Environment pillar, and ISS Environment score"
2. **Missing data detection**: "ESG Certification Standard Principle 3 requires Indigenous engagement records — none found for Q3"
3. **Data quality alerts**: "ISS governance score is 1/10 — critical gap in disclosure"
4. **Trend analysis**: "Your ethics score improved 15% but talent attraction declined 8%"

---

## Implications For Our Product Roadmap

### Phase 1 (Foundation) Must Support
1. Organization → ESGFocusArea hierarchy (not just generic "assessments")
2. Framework Registry with ESG Certification Standard 5 principles pre-loaded
3. Multi-framework mapping UI on data entry
4. Theme engine for white-label branding

### Phase 2 (AI Core) Must Support
1. AI-guided data collection for each focus area
2. Cross-framework mapping AI ("You entered GHG data — maps to ESG Certification Standard P5, MSCI Env")
3. Knowledge base with ESG Certification Standard standard, MSCI methodology docs
4. AI chat for "what do I need for X framework?"

### Phase 3 (Assessment Engine) Must Support
1. Automated multi-framework report generation
2. AI gap analysis across all frameworks simultaneously
3. Rating tracker dashboard with trend analysis
4. External score correlation with internal performance

### Phase 4+ (Enterprise)
1. Custom framework creation (for non-ESG Certification Standard standards)
2. Advanced supply chain ESG mapping
3. Regulatory change detection and impact assessment
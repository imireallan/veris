# Veris Multi-Product Architecture - Implementation Summary

**Date:** April 27, 2026
**Status:** 5 branches created, ready for sequential merge

## Overview
Transformed Veris from a single-framework assessment tool into a **multi-product SaaS platform** supporting Bettercoal, EO100, and CGWG with unified architecture.

---

## Branch Summary

### 1. ✅ `feature/framework-import-ui` (PR #45)
**Status:** Merged foundation for multi-framework support

**What it does:**
- Import external frameworks (Bettercoal, EO100, CGWG) via JSON
- Framework model with versioning, categories, scoring methodology
- Cross-framework question mappings (JSONField)
- UI: Framework import wizard, list view, detail view

**Key Models:**
```python
Framework: name, slug, version, categories, scoring_methodology
AssessmentQuestion: framework_mappings = [{"framework_id": "...", "provision_code": "..."}]
```

**Files:**
- `backend/assessments/models.py` (Framework, AssessmentQuestion)
- `backend/assessments/services/framework_import.py`
- `frontend/app/routes/organizations.$orgId.frameworks.*`

---

### 2. ✅ `feature/cgwg-saq-mvp` (PR #46)
**Status:** Ready to merge

**What it does:**
- No-login web form for CGWG SAQ (token-based access)
- 30-day token expiry (NEW - legacy had no expiry)
- Replaces `cgwg-backend.questionnaires` module
- Migration script from legacy CGWG backend

**Key Models:**
```python
SAQToken: key (6-char), expires_at, supplier_name, site_name
SAQResponse: answer_choice, answer_text, evidence_files, comments
```

**Legacy Compatibility:**
- 6-char token keys (matches legacy format)
- `legacy_response_id` / `legacy_answer_id` fields for migration
- Supports all CGWG question types (text, select_one, integer, date, files)

**Files:**
- `backend/assessments/models.py` (SAQToken, SAQResponse)
- `backend/migrate_cgwg_questionnaires.py`
- `CGWG_SAQ_PLAN.md`

---

### 3. ✅ `feature/eo100-support` (PR #47)
**Status:** Ready to merge

**What it does:**
- EO100 standard support with 4 industry supplements
- Performance target-based scoring (PT1=33, PT2=66, PT3=100)
- Replaces `eo100_api.eo100` module
- Import script for EO100 SAQ JSON files

**Key Models:**
```python
AssessmentTemplate: supplement_type (DEFAULT/PROCESSING/PRODUCTION/TRANSMISSION_STORAGE)
AssessmentQuestion: performance_target_level (1/2/3), external_question_id
Framework: metadata (supplements, principles count)
```

**EO100 Structure:**
- 10 Principles (Ethics, Transparency, Community, Indigenous, Labor, H&S, Environment, Climate, Biodiversity, Decommissioning)
- 4 Supplements (industry variants)
- 3 Performance Targets per question

**Files:**
- `backend/assessments/models.py` (supplement_type, performance_target_level)
- `backend/import_eo100_saq.py`
- `EO100_SUPPORT_PLAN.md`

---

### 4. ✅ `feature/multi-party-review` (PR #48)
**Status:** Ready to merge

**What it does:**
- EO100-style workflow: Operator → Platform → Assessor
- Role-based visibility (assessor private notes)
- Stage assignments and due dates
- Auto-calculated final scores

**Key Models:**
```python
Assessment: review_stage, assigned_platform_reviewer, assigned_assessor
AssessmentResponse:
    - operator_answer/score (self-assessment)
    - platform_review_score/notes (EO/Veris feedback)
    - assessor_score/notes/private_notes (third-party audit)
    - final_score (auto-calculated)
```

**Visibility Matrix:**
| Field | Operator | Platform | Assessor |
|-------|----------|----------|----------|
| assessor_private_notes | ❌ | ❌ | ✅ |

**Files:**
- `backend/assessments/models.py` (review_stage, multi-party fields)
- `MULTI_PARTY_REVIEW_PLAN.md`

---

### 5. 🔄 `feature/cross-framework-mapping` (TODO)
**Status:** Branch exists (old work), needs reset + new implementation

**What it will do:**
- AI-powered cross-framework evidence mapping
- "Upload once, satisfy multiple frameworks"
- Coverage analytics and gap analysis

**Planned Models:**
```python
FrameworkMapping: source_question → target_question (with confidence score)
EvidenceMapping: evidence_file → [mapped_questions]
CrossFrameworkMappingService: AI-powered mapping suggestions
```

**Files:**
- `CROSS_FRAMEWORK_MAPPING_PLAN.md` (created)
- `backend/assessments/models.py` (FrameworkMapping, EvidenceMapping - TODO)
- `backend/assessments/services/cross_framework_mapping.py` (TODO)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Veris Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Bettercoal │  │    EO100    │  │    CGWG     │        │
│  │  Framework  │  │  Framework  │  │  Framework  │        │
│  │  (12 Princ) │  │  (10 Princ) │  │  (SAQ)      │        │
│  │  144 Prov   │  │  4 Supp     │  │  (No-login) │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │   AssessmentTemplate  │                      │
│              │   - supplement_type   │                      │
│              │   - framework FK      │                      │
│              └───────────┬───────────┘                      │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │  AssessmentQuestion   │                      │
│              │  - framework_mappings │                      │
│              │  - performance_target │                      │
│              │  - external_question_id                     │
│              └───────────┬───────────┘                      │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │  AssessmentResponse   │                      │
│              │  - multi-party review │                      │
│              │  - AI validation      │                      │
│              │  - evidence_files     │                      │
│              └───────────────────────┘                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Cross-Framework Mapping (AI-Powered)                       │
│  - Single evidence → Multiple frameworks                    │
│  - Coverage analytics                                       │
│  - Gap analysis                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Phase 1: Import Legacy Data (Week 1)
```bash
# Bettercoal
python manage.py shell < backend/migrate_bettercoal.py

# EO100
python manage.py shell < backend/import_eo100_saq.py

# CGWG
python manage.py shell < backend/migrate_cgwg_questionnaires.py
```

### Phase 2: Deploy to Staging (Week 2)
- Deploy Veris to staging EC2
- Run migrations
- Test with real data
- Verify token expiry (CGWG)
- Test multi-party workflow (EO100)

### Phase 3: Cutover (Week 3)
- DNS switch: cgwg.tdi.com → veris.tdi.com
- Monitor for 48 hours
- Deprecate legacy backends (read-only mode)

### Phase 4: Sunset (Week 4-6)
- Export legacy data for archive
- Shut down cgwg-backend, eo100_api
- Keep bettercoal as reference (not in use)

---

## Next Steps

### Immediate (This Week)
1. **Merge PR #45** (framework-import-ui) - Already merged ✅
2. **Review PR #46** (cgwg-saq-mvp)
3. **Review PR #47** (eo100-support)
4. **Review PR #48** (multi-party-review)
5. **Reset `feature/cross-framework-mapping`** branch with new AI mapping service

### Short-Term (Next 2 Weeks)
- Build CGWG SAQ public form UI (no-login)
- Build EO100 supplement selector in template creation
- Build multi-party review workflow UI
- Test migrations with production data dumps

### Medium-Term (Next Month)
- Implement AI cross-framework mapping service
- Build coverage dashboard
- Email notifications for workflow transitions
- Performance optimization (Pinecone indexing)

---

## Key Decisions Made

### 1. Unified Data Model
**Decision:** Single `AssessmentQuestion` model with framework-specific fields (not separate models per framework)

**Rationale:**
- Easier cross-framework mapping
- Shared UI components
- Simpler migrations

**Trade-off:** Some fields are framework-specific (e.g., `supplement_type` only for EO100)

### 2. Token Format for CGWG
**Decision:** Keep 6-char keys (legacy compatible) instead of UUIDs

**Rationale:**
- Existing CGWG links use 6-char keys
- Easier migration (no link updates needed)
- User familiarity

**Trade-off:** Smaller keyspace (36^6 = 2.1B vs UUID 2^128)

### 3. Performance Target Scoring
**Decision:** Hardcode PT scores (33/66/100) in model, not config

**Rationale:**
- EO100 standard is fixed (won't change)
- Simpler queries (no JSON lookups)
- Better for analytics

**Trade-off:** Less flexible if EO100 changes scoring

### 4. Multi-Party Visibility
**Decision:** Database-level fields (not application-level filtering)

**Rationale:**
- Clear visibility rules (assessor_private_notes)
- Easier to enforce (can't accidentally leak)
- Better for audit trails

**Trade-off:** More fields to maintain

---

## Success Metrics

### Technical
- [ ] All 3 frameworks imported successfully
- [ ] Migration scripts run without errors
- [ ] Cross-framework queries < 100ms
- [ ] Token expiry enforced (CGWG)

### Product
- [ ] CGWG SAQ completion rate > 80%
- [ ] Multi-party workflow reduces review time by 50%
- [ ] Cross-framework mapping reduces evidence uploads by 60%

### Business
- [ ] Single platform replaces 4 TDi tools
- [ ] Consultancies can white-label for clients
- [ ] Premium tier: AI cross-framework mapping

---

## Contact
**Allan Imire** - allanimire@gmail.com
**GitHub:** @imireallan
**Repo:** github.com/imireallan/veris

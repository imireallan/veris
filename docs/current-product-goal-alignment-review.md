# Veris Current Product Goal Alignment Review

Date: 2026-04-17
Status: Reviewed against onboarding docs + current repo docs + current codebase

## Scope reviewed

This review synthesized:

1. Onboarding docs in `~/projects/veris_onboarding_docs/`
   - PROJECT_ALIGNMENT_REVIEW.md
   - ROADMAP.md
   - USE_CASE_GAP_ANALYSIS.md
   - deep_dive/veris_strategic_value_analysis.md
   - deep_dive/current_state.md
   - plus the rest of the onboarding doc set for context

2. Veris project docs in `~/projects/Veris/`
   - strategic/product docs: `README.md`, `docs/PRD.md`, `docs/ROADMAP.md`, `docs/GTM_STRATEGY.md`, `docs/ARCHITECTURE.md`, `veris-master-roadmap.md`, `docs/generic-use-cases.md`, `docs/COMPETITIVE_LANDSCAPE.md`, `docs/SERVICE_CATALOG_STRATEGY.md`, `docs/TDI_SERVICE_CATALOG.md`, `docs/ai-architecture-decision.md`
   - implementation/status docs: template management docs, RBAC docs, cross-framework mapping docs, AI validation docs, local/dev/api/system docs, and recent frontend hardening docs

3. Current codebase evidence in `~/projects/Veris/`
   - backend models, views, services, routes, tests
   - frontend routes, components, server helpers, tests

## Executive summary

Short answer: **the current implementation matches the platform foundation goals well, but does not yet fully match the flagship product goals.**

Best summary:
- **Aligned / implemented well**
  - multi-tenant organization model
  - invitation/onboarding flow
  - org switching and accessible-org context
  - org-scoped and cross-org assessment access
  - white-label theming/branding foundation
  - core assessment / template / membership infrastructure
- **Partially aligned**
  - AI pipeline
  - cross-framework mapping
  - reporting
  - template ecosystem consistency
- **Not yet aligned with the documented flagship demo/product promise**
  - framework-agnostic AI knowledge chat as a polished product feature
  - true “answer once, map to many” execution across downstream workflows/reports
  - AI-generated reports and end-to-end intelligent engine behavior

Bottom line:
- Veris is no longer a flat single-org CRUD app. The product foundation now matches the B2B multi-tenant consultancy platform direction.
- But the implementation still falls short of the documented promise that Veris is already an AI-first platform replacing fragmented consultancy tools.

## Synthesized product goals

Across onboarding docs and repo docs, the stable product goals are:

1. **Generic white-label B2B SaaS**
   - Veris sells to consultancies, not directly to one end client.
   - TDi is the first customer, but the architecture must work for competitors too.

2. **Multi-tenant consultancy hierarchy**
   - Veris → consultancy tenant → client organization → sites/facilities.

3. **AI-first operating model**
   - transform from “digital form/manual workflow” into:
   - input → processing pipeline → storage → retrieval → AI → structured output → UI.

4. **Three recurring demo moments / value props**
   - AI knowledge base + chat with citations
   - white-label switching
   - multi-framework mapping / answer once, map to many

5. **Operational efficiency engine for consultancies**
   - assessments
   - evidence and validation
   - reports
   - continuous improvement / task tracking
   - reusable framework + sector support

## Alignment matrix

| Goal | Expected by docs | Current implementation | Alignment |
|------|------------------|------------------------|-----------|
| Generic white-label consultancy platform | Multi-tenant, consultancy-first, not TDi-hardcoded | OrganizationMembership + accessible orgs + theming support this | ✅ Strong |
| Multi-org user identity | Users operate across many orgs with org-scoped roles | Implemented in backend and frontend | ✅ Strong |
| Invitation-based onboarding | Consultancy/client admin onboarding via invitation | Implemented with resend/revoke/token flows | ✅ Strong |
| Org switching + selected org context | Browser + SSR-safe selected org behavior | Implemented with localStorage + cookie + server helper | ✅ Strong |
| Assessments across orgs | Users see/filter assessments across allowed orgs | Implemented aggregate route + tests | ✅ Strong |
| White-labeling | Per-org themes, branding, logo, CSS | Implemented foundation | ✅ Strong |
| AI knowledge base + chat | Upload any standards docs, ask questions with citations | Document ingestion/indexing exists; chat experience is still placeholder/incomplete | ⚠️ Partial |
| Evidence validation pipeline | Evidence upload → AI analysis → validation fields + citations | Significant backend pieces exist | ⚠️ Partial |
| Cross-framework mapping | Question-level and response-level answer-once-map-many workflows | CRUD-level mappings and UI exist; downstream engine incomplete | ⚠️ Partial |
| AI-generated reports | Automated executive summaries + PDF/report flow | Report model/export exist; full AI report workflow not clearly complete | ⚠️ Partial |
| Continuous improvement engine | Live tasks, nudges, progress tracking | Core task/CIP models exist, but full “intelligent engine” maturity not evident | ⚠️ Partial |
| Product docs truthfulness | Docs should reflect actual current feature maturity | Several docs still oversell AI/demo readiness | ❌ Weak |

## Where implementation matches product goals well

### 1. Multi-tenancy and access model
This is the strongest area of alignment.

Evidence:
- `OrganizationMembership` model exists
- users can belong to multiple orgs
- `/api/organizations/accessible/` exists
- `/api/auth/me` is lightweight again
- org switching uses server-safe selected-org resolution
- tests exist for multi-tenant isolation and aggregate assessments

Why this matters:
- This directly matches the foundational strategic goal from the onboarding docs:
  - consultancy serves many clients
  - access is organization-scoped
  - no more flat user→org identity model

Verdict:
- **Strongly aligned**

### 2. Invitation-based onboarding
This also aligns strongly with the goals.

Evidence:
- invitation model and token flow exist
- resend/revoke flows exist
- public invitation acceptance route exists
- onboarding via invitation acceptance creates membership

Why this matters:
- This closes a major P0 gap repeatedly called out in onboarding docs.

Verdict:
- **Strongly aligned**

### 3. White-labeling foundation
Evidence:
- org theme model exists
- theme API exists
- frontend ThemeProvider applies org-specific theme variables, favicon, custom CSS
- settings/theme route exists

Why this matters:
- White-labeling is a core commercial requirement for consultancy deployment.

Verdict:
- **Strongly aligned at foundation level**

### 4. Cross-org assessment access and filtering
Evidence:
- aggregate assessments backend route exists
- frontend assessments page supports org filter over accessible orgs
- tests exist for flat/aggregate access behavior

Why this matters:
- This matches the real consultancy operating model better than the older single-org assumption.

Verdict:
- **Strongly aligned**

## Where implementation only partially matches goals

### 1. AI knowledge base + chat
What docs expect:
- framework-agnostic RAG
- upload any standards docs
- ask natural-language questions with citations
- this is one of the top 3 demo moments

What code supports:
- knowledge documents model exists
- extraction/indexing/embedding pipeline exists
- knowledge library UI exists

What is missing / weak:
- frontend chat route is still effectively placeholder
- no clear polished end-user conversational workflow matching the promise in README/PRD/ROADMAP

Verdict:
- **Partially aligned**
- backend groundwork exists, flagship user-facing product promise is not yet fully delivered

### 2. Cross-framework mapping
What docs expect:
- answer once, map to many
- map evidence/answers across Bettercoal, OECD, RBA, etc.
- downstream value in reports, dashboards, and workflow reduction

What exists:
- question-level mappings in model
- mapping APIs exist
- mapping badge/modal UI exists

What is still missing or weak:
- looks more like mapping metadata CRUD than a mature cross-framework execution engine
- downstream reporting/automation behavior from those mappings is not clearly complete
- template subsystem has had integration inconsistencies and drift

Verdict:
- **Partially aligned**

### 3. Reports
What docs expect:
- automated report generation
- executive summaries
- major ROI feature for consultancies

What exists:
- report model exists
- PDF generation/export exists
- assessment detail route can download reports

What is unclear / likely incomplete:
- report authoring/generation lifecycle is not clearly surfaced as a robust end-user workflow
- docs suggest more sophistication than code evidence clearly proves

Verdict:
- **Partially aligned**

### 4. Template and questionnaire product layer
What docs expect:
- reusable assessment/template engine
- framework/question structures that support generic consultancy use
- template-driven assessments

What exists:
- large amount of template work is implemented
- template list/new/detail areas exist
- assessments.new has template-related fields now

What was risky:
- docs around templates have drifted and were inconsistent about completion status
- some areas looked partially integrated until recent fixes

Verdict:
- **Mostly aligned structurally, but maturity is uneven**

## Where implementation does NOT yet match the documented product promise

### 1. “AI-first platform” as a user-facing truth
The docs repeatedly frame Veris as already becoming an intelligent engine.

Reality:
- AI ingestion/validation backend work exists
- but the end-user AI experience is not yet consistently productized across:
  - chat
  - assessments
  - reports
  - cross-framework reasoning

Verdict:
- **Docs are ahead of implementation**

### 2. Full replacement of fragmented consultancy tools
Docs imply Veris is the unified replacement for multiple disconnected tools.

Reality:
- Veris has a strong foundation for that direction
- but the deepest differentiators still look incomplete:
  - AI chat/RAG experience
  - rich report generation workflow
  - cross-framework downstream automation
  - integrated monitoring/insight layer

Verdict:
- **Directionally aligned, not yet functionally complete**

## Documentation drift / conflicts found

### 1. Strategic docs vs. implementation reality
Strategic docs say or imply:
- AI knowledge chat is a core demo-ready capability
- AI-generated reporting is central
- framework-agnostic intelligent workflows are part of the product proposition

Implementation/status docs and code suggest:
- several of these are still partial or pending

### 2. Roadmap drift
Different roadmap docs prioritize different sequencing:
- some are demo-first with AI very early
- others are more foundation-first and AI later

### 3. Local/dev docs drift
Port and environment expectations have not always matched across docs.

## Final verdict

### Does the current implementation match the product goals?

**Answer: partially.**

More precise answer:

#### Yes, it matches the foundational product goals
- generic consultancy platform
- multi-tenancy
- invitation onboarding
- org switching
- org-scoped access
- white-labeling
- cross-org assessment visibility

#### Partially, it matches the differentiating product goals
- AI pipeline groundwork
- cross-framework mapping groundwork
- reporting groundwork
- template-driven assessment system

#### No, it does not yet fully match the flagship product promise
- Veris is not yet fully delivering the “AI-first intelligent engine” experience described in the strongest strategic docs
- the three marquee demo moments are not all equally production-ready/mature in the current implementation

## Recommended interpretation for product management

Treat current Veris as:
- **a strong P0/P1 platform foundation with major product-direction alignment**, not yet as the fully realized AI-first consultancy operating system described in the top-line strategy docs.

## Recommended next priorities

1. **Make AI chat genuinely demo-ready**
   - close the gap between ingestion/indexing and actual end-user RAG experience

2. **Turn cross-framework mapping from metadata to workflow value**
   - prove “answer once, map to many” in downstream UI/reporting

3. **Strengthen report generation into a visible product workflow**
   - not just model/export support, but clear end-user generation and review flow

4. **Normalize docs around actual maturity**
   - distinguish:
     - implemented foundation
     - partial implementation
     - demo-ready
     - roadmap-only

## Follow-up documents

- Gap-closing implementation plan:
  - `docs/plans/2026-04-17-product-goal-gap-closure-plan.md`
- Product gap matrix:
  - `docs/product-gap-matrix.md`

## Suggested alignment labels for current state

- Multi-tenancy: **Implemented**
- Invitations/onboarding: **Implemented**
- Org switching: **Implemented**
- Assessments across orgs: **Implemented**
- White-label themes: **Implemented (foundation)**
- Knowledge base ingestion/indexing: **Implemented**
- AI chat: **Partial**
- AI validation: **Partial**
- Cross-framework mapping: **Partial**
- Reports: **Partial**
- “AI-first intelligent engine” claim: **Not yet fully true in product UX**

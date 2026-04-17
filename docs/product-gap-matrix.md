# Veris Product Gap Matrix

Date: 2026-04-17
Source of truth for strategic review: `docs/current-product-goal-alignment-review.md`

## Priority legend
- P0 = directly blocks one of the top product/demo truths
- P1 = materially improves consultancy product value after P0
- P2 = important, but not the next best move

## Gap matrix

| Priority | Product Goal | Current State | Gap | Why It Matters | Suggested Files / Areas |
|----------|--------------|---------------|-----|----------------|--------------------------|
| P0 | AI Knowledge Base + Chat | Knowledge ingestion/indexing exists; chat UX is not yet a real cited product workflow | Build org-scoped end-to-end chat retrieval + cited response UX | This is one of the top 3 documented demo moments and the clearest AI differentiator | `frontend/app/routes/knowledge/chat.tsx`, `frontend/app/routes/knowledge/index.tsx`, `backend/knowledge/services.py`, `backend/knowledge/views/__init__.py`, `ai_engine/`, `docs/ai-architecture-decision.md` |
| P0 | Answer Once, Map to Many | Framework mapping CRUD/UI exists, but mostly at metadata level | Turn mappings into visible downstream product value in questionnaire/summary/report workflows | Docs promise reduced duplicate data entry across frameworks; current implementation only partially proves that | `frontend/app/routes/assessments.$id.questionnaire.tsx`, `frontend/app/routes/templates.$id.tsx`, `frontend/app/components/FrameworkMappingBadge.tsx`, backend mapping endpoints |
| P0 | Consultancy-grade report workflow | Report model/export support exists | Add clear generation lifecycle and richer report content (summary/findings/mapped context) | Reporting is a core consultancy ROI feature in docs and value analysis | `backend/reports/services.py`, report views, `frontend/app/routes/assessments_detail.tsx`, report download routes |
| P0 | Documentation truthfulness | Strategic docs previously blurred roadmap vs implemented state | Keep maturity labels and alignment review current as features change | Prevents over-selling and mis-prioritization | `README.md`, `docs/PRD.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/current-product-goal-alignment-review.md` |
| P1 | White-label consultancy demo quality | Theme foundation exists | Add richer demo-ready tenant configs/assets and ensure tenant switching feels polished end-to-end | White-labeling is already structurally aligned; polish will improve sales readiness | theme settings routes, tenant seed data, demo assets/configs |
| P1 | Evidence validation as visible value | Backend validation pipeline exists | Surface validation state/citations more clearly in user workflow and reports | Helps prove AI is useful inside assessment workflow, not just in backend | assessment response UI, report views, validation docs/tests |
| P1 | Template ecosystem maturity | Template system exists and typecheck is clean | Normalize remaining template/report/template-route integration inconsistencies and add confidence tests | Templates are central to reusable consultancy delivery | template routes, backend template endpoints, tests, API docs |
| P2 | Continuous improvement intelligence | Task/CIP foundation exists | Add AI nudges/reminders/progression features beyond static task tracking | Valuable, but after chat/mapping/reporting are proven | tasks/CIP models, UI workflows, reminder logic |
| P2 | Generic multi-sector packaging | Architecture is generic; demo assets are still narrow | Expand sector/framework seed/demo packs for broader consultancy sales motion | Improves commercial breadth, but after top product truths are real | seed data, framework configs, docs/service-catalog-related assets |

## Goal-by-goal status summary

| Goal | Status |
|------|--------|
| Generic consultancy platform | Implemented strongly |
| Multi-tenant identity/access | Implemented strongly |
| Invitation onboarding | Implemented strongly |
| Org switching | Implemented strongly |
| Assessments across orgs | Implemented strongly |
| White-label theming | Implemented strongly at foundation level |
| AI knowledge chat | Partial |
| Cross-framework mapping | Partial |
| Report generation | Partial |
| Intelligent continuous improvement engine | Partial |
| Full AI-first product promise | Not yet fully matched in UX |

## Recommended execution order

1. AI chat productization
2. Cross-framework downstream workflow value
3. Report generation workflow/value
4. Documentation refresh after each closed gap
5. White-label/demo polish
6. AI validation surfacing
7. Continuous improvement intelligence

## What should not distract the roadmap right now

These are useful, but should not outrank the core product truths:
- cosmetic admin-only flows that do not support demo value
- speculative multi-sector expansion before top demo moments are real
- deep platform abstractions before user-visible AI/reporting/mapping value exists
- roadmap language that implies completeness where implementation is still partial

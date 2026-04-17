# Veris Product Goal Gap-Closure Plan

> For Hermes: Use this plan to close the highest-value gaps between current implementation and the documented Veris product goals.

Goal: Bring Veris from a strong multi-tenant platform foundation to a demo-ready AI-first consultancy product that actually supports the top documented demo moments.

Architecture: Keep the current Django-first MVP architecture for core business logic and evidence workflows, while tightening the product layer around selected-org context, AI retrieval/chat, cross-framework execution, and report generation. Do not broaden scope into speculative platform work until the top 3 product moments are real end-to-end experiences.

Tech Stack: Django REST, React Router v7, TypeScript, PostgreSQL, existing knowledge/evidence pipeline, current theming and multi-tenant access model.

---

## Priority framework

Work only on items that directly improve one of these product truths:

1. AI Knowledge Base + Chat
2. White-label / consultancy-ready tenant experience
3. Answer once, map to many
4. Report generation that a consultancy can actually demo and use

Everything else is secondary.

---

## Current alignment snapshot

Already strong:
- OrganizationMembership multi-tenancy
- invitation onboarding
- org switching
- org-scoped + aggregate assessment access
- white-label theming foundation

Still partial:
- AI chat UX
- cross-framework execution value
- reporting workflow
- documentation truthfulness / maturity labeling

---

## Phase A: Make the docs truthful first

### Task A1: Add maturity labels to top-level docs
Objective: Stop strategic docs from reading like all flagship features are already production-ready.

Files:
- Modify: `README.md`
- Modify: `docs/PRD.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/ARCHITECTURE.md`
- Reference: `docs/current-product-goal-alignment-review.md`

Steps:
1. Add a short “Current Maturity Snapshot” section near the top of each doc.
2. Use only these labels:
   - Implemented
   - Partial
   - Roadmap
3. Keep the strategic vision, but separate it clearly from current implementation reality.
4. Link each top-level doc to `docs/current-product-goal-alignment-review.md` for the detailed review.

Verification:
- Run `search_files("Current Maturity Snapshot", path="~/projects/Veris", file_glob="*.md")`
- Confirm all four files include the section.

---

## Phase B: Turn AI ingestion into a real product feature

### Task B1: Audit the current knowledge chat path
Objective: Confirm the exact backend/frontend gaps between ingestion and end-user chat.

Files:
- Inspect: `frontend/app/routes/knowledge/chat.tsx`
- Inspect: `frontend/app/routes/knowledge/index.tsx`
- Inspect: `backend/knowledge/services.py`
- Inspect: `backend/knowledge/views/__init__.py`
- Inspect: `ai_engine/`
- Inspect: `docs/ai-architecture-decision.md`

Steps:
1. Document which parts of chat are placeholders.
2. Document whether retrieval exists in Django, FastAPI, or neither.
3. Define the minimum viable end-to-end chat contract:
   - input: user question + org scope
   - retrieval: org-filtered chunks/documents
   - output: answer + citations + confidence/metadata

Verification:
- Produce a short implementation note in `docs/ai-chat-gap-note.md`.

### Task B2: Implement the minimum viable org-scoped chat API
Objective: Make “AI knowledge base + chat” a real demo feature.

Files:
- Modify: backend or ai_engine files discovered in B1
- Modify: `frontend/app/routes/knowledge/chat.tsx`
- Test: create targeted backend/frontend tests

Requirements:
- Must be org-scoped
- Must return citations
- Must work on currently uploaded documents
- Do not overbuild conversation memory in v1

Verification:
- Ask a question against seeded/uploaded docs and receive a cited response in UI.

---

## Phase C: Turn cross-framework mapping into workflow value

### Task C1: Define the downstream mapping surface
Objective: Move from mapping metadata to visible user value.

Files:
- Inspect: `frontend/app/components/FrameworkMappingBadge.tsx`
- Inspect: `frontend/app/components/FrameworkMappingModal.tsx`
- Inspect: `frontend/app/routes/assessments.$id.questionnaire.tsx`
- Inspect: `frontend/app/routes/templates.$id.tsx`
- Inspect: backend mapping endpoints in assessments views
- Reference: `docs/cross-framework-mapping.md`

Steps:
1. Decide where mapping value is shown first:
   - questionnaire answer context
   - assessment summary
   - report output
2. Implement one clear downstream experience:
   - “This answer also satisfies X, Y, Z” on saved responses
   - and/or section-level report grouping by mapped framework
3. Keep this focused on proving “answer once, map to many.”

Verification:
- Use a mapped question/response and confirm the mapping changes downstream UI/report output.

### Task C2: Add response-level mapping visibility
Objective: Ensure mapping is not only template/question admin metadata.

Files:
- Modify relevant assessment detail/questionnaire/report files
- Add tests where practical

Verification:
- A non-admin user can see how a response maps to multiple frameworks.

---

## Phase D: Make reports an actual consultancy workflow

### Task D1: Clarify report lifecycle
Objective: Define whether reports are generated manually, on demand, or automatically.

Files:
- Inspect: `backend/reports/services.py`
- Inspect: report models/views
- Inspect: `frontend/app/routes/assessments_detail.tsx`
- Reference: docs mentioning report generation

Steps:
1. Decide the v1 report lifecycle:
   - Generate report button on assessment detail
   - store/update AssessmentReport
   - expose PDF download
2. Ensure the user path is explicit in UI.

Verification:
- The assessment detail page has an obvious report generation/download workflow.

### Task D2: Add report content that proves value
Objective: The report should show consultant-grade synthesis, not just export raw data.

Requirements:
- executive summary
- key findings
- mapped framework context if available
- evidence/citation references where possible

Verification:
- Generate a report from a seeded/demo assessment and review PDF output for those sections.

---

## Phase E: Stabilize the selected-org product experience

### Task E1: Remove remaining route-level drift around selected org
Objective: Ensure selected org behavior is consistent across pages, SSR, and filters.

Files:
- Inspect and normalize org-sensitive routes using current server helper pattern
- Reference: `frontend/app/.server/organizations.ts`
- Reference: org switching docs and current hardening docs

Verification:
- Switching org updates dashboard, assessments, organizations, and member-related pages consistently without relying on local-only state.

---

## Phase F: Final product alignment pass

### Task F1: Update docs after feature work
Objective: Keep docs aligned with reality after each major feature closes.

Files:
- Modify: `docs/current-product-goal-alignment-review.md`
- Modify: `docs/product-gap-matrix.md`
- Modify top-level docs if status changes materially

Verification:
- No doc should describe a feature as implemented if it is still partial.

---

## Recommended execution order

1. Docs truthfulness patch
2. AI chat gap audit
3. Minimum viable org-scoped AI chat
4. Cross-framework downstream visibility
5. Report lifecycle + report value improvements
6. Selected-org UX normalization
7. Final alignment review refresh

---

## Success criteria

This plan is successful when:
- AI chat is real, org-scoped, and cited
- cross-framework mapping creates visible downstream value
- reports are generated through a clear product workflow
- top-level docs separate strategy from actual maturity
- the alignment review can honestly say the top 3 demo moments are implemented or nearly implemented

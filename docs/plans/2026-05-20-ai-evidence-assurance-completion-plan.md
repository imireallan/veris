# AI Evidence Assurance Completion Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Finish the questionnaire AI evidence-assurance workflow from per-question "Check evidence" foundation to an MVP-ready, auditable reviewer workflow.

**Architecture:** Keep AI as a reviewer aid, not a compliance approval engine. The flow is: questionnaire answer + attached evidence -> evidence processing/indexing -> scoped retrieval -> framework-aware structured adjudication -> stored audit run -> reviewer decision -> findings/CIP/report handoff. Keep latest fields on `AssessmentResponse` for fast UI display, but treat `EvidenceCheckRun` and reviewer decisions as the audit trail.

**Tech Stack:** Django/DRF backend, React Router v7 frontend, Pinecone/knowledge pipeline, typed Python result objects/Pydantic-style schema validation, shadcn UI components.

---

## Current Baseline

Already implemented:
- Questionnaire UI action says `Check evidence`.
- New evidence statuses exist on `AssessmentResponse`.
- Legacy statuses are mapped/retained.
- Retrieval priority exists in `backend/assessments/services/validation.py`:
  1. response-attached document IDs
  2. assessment-scoped evidence
  3. organization library fallback
- Missing Pinecone index degrades to no matches.
- Evidence upload creates a `KnowledgeDocument` and returns `knowledge_document_id` + `processing_status`.
- Stale evidence checks reset when answer/evidence changes.
- `EvidenceCheckRun` exists for audit records.
- Per-question check uses `useFetcher`, scoped loading/error state, and toast.
- Validation endpoint returns JSON errors instead of HTML 500s.

Main remaining MVP gaps:
1. Uploaded questionnaire evidence is not auto-processed/indexed.
2. UI does not reliably prevent/label checks when evidence is unindexed/failed.
3. Structured details are not fully surfaced in UI: supported claims, gaps, citations, recommended action.
4. No human reviewer decision layer.
5. Product language still says `AI validated` in dashboards/docs/API-facing labels.
6. Evidence check does not receive full framework/question/site/reviewer context.
7. No assessment-level run/check summary.

---

## MVP Completion Definition

Call this feature MVP-complete when:

- A supplier/operator can upload evidence for a questionnaire answer and see whether it is `queued`, `processing`, `processed`, or `failed`.
- `Check evidence` is disabled or clearly explained while attached evidence is not indexed.
- Running `Check evidence` stores an `EvidenceCheckRun` with framework/question context and a structured result.
- The question card shows summary, confidence, gaps, citations with quote/page/file, and recommended action.
- A reviewer can accept, reject, override, or request follow-up on an AI evidence check.
- Assessment detail has `Run evidence check for answered questions` and summary counts.
- User-facing copy says `evidence checked`, `supported`, or `review needed`, not `AI validated`.
- Tests cover upload/index status, check blocking, structured result display data, reviewer decision, and assessment-level bulk run.

---

# Phase 1 — Evidence upload must become searchable

## Task 1.1: Add explicit processing status constants

**Objective:** Stop relying on loose strings like `uploaded` and make evidence state predictable.

**Files:**
- Modify: `backend/assessments/views/upload_evidence.py`
- Modify: `backend/assessments/services/validation.py`
- Test: `backend/tests/assessments/test_upload_evidence.py` or existing evidence upload test file

**Implementation:**
- Use statuses:
  - `queued`
  - `processing`
  - `processed`
  - `failed`
- Treat `uploaded` as legacy alias for `queued` in validation.
- Evidence metadata shape should stay backward compatible:

```json
{
  "url": "...",
  "file_name": "...",
  "file_size": 12345,
  "content_type": "application/pdf",
  "knowledge_document_id": "uuid",
  "processing_status": "queued|processing|processed|failed",
  "error": null
}
```

**Verification:**
- Upload evidence through the questionnaire upload endpoint.
- Response includes `knowledge_document_id` and `processing_status: queued` or `processed`.

---

## Task 1.2: Add assessment/question/response metadata to indexed chunks

**Objective:** Make assessment-scoped and response-scoped retrieval reliable.

**Files:**
- Modify: `backend/knowledge/services.py`
- Modify: `backend/assessments/views/upload_evidence.py`
- Test: `backend/tests/knowledge/test_services.py` or new focused test

**Implementation:**
- Extend `process_document(...)` / `embed_and_store(...)` to accept metadata:
  - `organization_id`
  - `assessment_id`
  - `response_id`
  - `question_id`
  - `source_type: assessment_evidence|knowledge_library`
- Include these fields in Pinecone vector metadata.
- Do not break existing knowledge-library processing calls; default unknown metadata to `None`/omit.

**Acceptance criteria:**
- Response evidence chunks contain `document_id`, `organization_id`, `assessment_id`, `response_id`, and `question_id` when uploaded from questionnaire.
- Existing knowledge-library document processing still works.

---

## Task 1.3: Auto-process questionnaire evidence synchronously for MVP

**Objective:** After upload, make evidence searchable without requiring a manual `/documents/{id}/process/` call.

**Files:**
- Modify: `backend/assessments/views/upload_evidence.py`
- Reuse: `backend/knowledge/services.py::process_document`
- Test: `backend/tests/assessments/test_upload_evidence.py`

**Implementation:**
- MVP approach: process synchronously after `KnowledgeDocument` creation.
- If processing succeeds:
  - set `KnowledgeDocument.embeddings_indexed = True`
  - set `chunk_count`
  - set `vector_ids`
  - return `processing_status: processed`
- If processing fails:
  - keep upload successful
  - return `processing_status: failed`
  - include readable `error`
  - keep `KnowledgeDocument.description` with processing failure context if useful

**Why sync for MVP:** Celery/queue is cleaner but currently unnecessary. The immediate product pain is uploaded evidence not being searchable. Introduce async only once uploads become slow enough to hurt UX.

**Future upgrade:** Wrap this behind `process_questionnaire_evidence(document, metadata)` so it can move to a worker without changing the endpoint contract.

---

## Task 1.4: Update stale-check reset to preserve processing metadata

**Objective:** Reset AI evidence result when evidence changes without losing processing information.

**Files:**
- Modify: `backend/assessments/serializers/__init__.py`
- Modify: `frontend/app/routes/assessments.$id.questionnaire.tsx`
- Test: existing serializer/view tests

**Implementation:**
- On answer/evidence mutation, reset:
  - `validation_status = not_checked`
  - `confidence_score = None`
  - `citations = []`
  - `ai_feedback = ""`
  - `ai_validated = False`
- Do not mutate `evidence_files[*].processing_status` unless a new upload result explicitly changes it.

---

# Phase 2 — Make Check Evidence context-aware and structured

## Task 2.1: Pass full response context into validation service

**Objective:** Give the AI check enough context to reason against the framework question, not just answer similarity.

**Files:**
- Modify: `backend/assessments/views/mixins.py`
- Modify: `backend/assessments/services/validation.py`
- Test: `backend/tests/assessments/test_flat_views.py`

**Implementation:**
- Replace service call shape from mostly text-only to response-context aware.
- Add a context dataclass or dict with:
  - `response_id`
  - `assessment_id`
  - `organization_id`
  - `site_id`, `site_type`, `site_name`
  - `framework_id`, `framework_name`
  - `question_id`
  - `question_text`
  - `question_description`
  - `hierarchy`
  - `scoring_criteria`
  - `answer_text`
  - `operator_answer`
  - `reviewer_notes` if available
  - `evidence_files`

**Acceptance criteria:**
- `EvidenceCheckRun.result_json` includes a `context` or `input_context` snapshot with framework/question identifiers and hierarchy.
- Existing tests for `/api/responses/{id}/validate/` still pass.

---

## Task 2.2: Add typed structured result schema

**Objective:** Make `result_json` validated and stable enough for UI/reporting.

**Files:**
- Modify: `backend/assessments/services/validation.py`
- Test: `backend/tests/assessments/test_validation_service.py`

**Schema:**

```python
class EvidenceCitation(TypedDict):
    document_id: str
    file_name: str
    page: int | None
    chunk_id: str
    quote: str
    source_scope: str

class SupportedClaim(TypedDict):
    claim: str
    evidence: list[str]

class EvidenceCheckStructuredResult(TypedDict):
    status: str
    confidence: float
    summary: str
    supported_claims: list[SupportedClaim]
    gaps: list[str]
    citations: list[EvidenceCitation]
    recommended_action: str
```

**Implementation:**
- Keep deterministic fallback for now.
- Validate final output before saving.
- If a future LLM result is malformed, fall back to deterministic result and record a warning in `result_json["warnings"]`.

---

## Task 2.3: Add LLM adjudication behind a feature flag

**Objective:** Move beyond pure vector similarity while keeping local/dev stable.

**Files:**
- Modify: `backend/assessments/services/validation.py`
- Possibly create: `backend/assessments/services/evidence_adjudication.py`
- Modify: settings/env docs if needed
- Test: mocked unit tests only

**Implementation:**
- Add setting: `EVIDENCE_CHECK_LLM_ENABLED=false` by default.
- Add setting/provider values:
  - `EVIDENCE_CHECK_LLM_PROVIDER`
  - `EVIDENCE_CHECK_LLM_MODEL`
- When enabled, call LLM with:
  - question/framework context
  - answer
  - retrieved chunks
  - required JSON schema
- Validate output against schema.
- If provider fails, return deterministic fallback plus warning; do not fail the whole evidence check unless there is no deterministic fallback.

**Important:** Do not couple business logic to LangChain/OpenAI directly in views. Keep provider code inside an AI/evidence service module.

---

# Phase 3 — Frontend must show the actual reviewer value

## Task 3.1: Add evidence processing state to question cards

**Objective:** Users should understand whether evidence can be checked yet.

**Files:**
- Modify: `frontend/app/routes/assessments.$id.questionnaire.tsx`

**UI rules:**
- If no saved response: button disabled with `Save answer first`.
- If answer is empty: disabled with `Provide an answer first`.
- If attached evidence has `queued`/`processing`/legacy `uploaded`: disabled or warning label `Evidence still processing`.
- If attached evidence has `failed`: allow org/assessment fallback check but show warning `Attached evidence failed to process; check may use other indexed evidence`.
- If no attached evidence: allow check only if product accepts assessment/org fallback; label result source clearly.

**Acceptance criteria:**
- No more silent `needs_evidence` when evidence is just unprocessed.
- User sees exact reason the button is unavailable.

---

## Task 3.2: Render structured evidence result details

**Objective:** Show why the answer is supported/unsupported, not just a badge.

**Files:**
- Modify: `frontend/app/routes/assessments.$id.questionnaire.tsx`
- Optional create component: `frontend/app/components/assessment/EvidenceCheckResult.tsx`

**UI sections:**
- Status badge
- Confidence
- Summary
- Supported claims
- Gaps
- Citations:
  - file name
  - page if present
  - quote
  - source scope: attached evidence / assessment evidence / org library
- Recommended action

**Product copy:**
- Use `Evidence check`, `Supported`, `Partially supported`, `Needs evidence`, `Contradictory`.
- Avoid `AI validated` and avoid implying final approval.

---

## Task 3.3: Replace remaining user-facing validation language

**Objective:** Clean up product language without breaking API compatibility.

**Files to inspect/update:**
- `frontend/app/routes/assessments.$id.questionnaire.tsx`
- `frontend/app/routes/assessments_detail.tsx`
- Dashboard routes/components that show `AI validated`
- Docs only if they are end-user docs

**Rules:**
- Keep backend field names like `validation_status` and endpoint `/validate/` for now to avoid churn.
- Replace visible labels:
  - `AI validated` -> `Evidence supported` or `Evidence checked`
  - `Validated` -> `Supported`
  - `Validation` -> `Evidence check`
- If dashboard KPI currently counts `ai_validated`, label it as `Evidence-supported responses`.

---

# Phase 4 — Human reviewer decision layer

## Task 4.1: Add reviewer decision model

**Objective:** Separate AI evidence signal from human assurance decision.

**Files:**
- Modify: `backend/assessments/models.py`
- Create migration
- Modify/admin: `backend/assessments/admin.py`
- Test: new backend model/API tests

**Model proposal:**

```python
class EvidenceReviewDecision(models.Model):
    DECISION_CHOICES = [
        ("pending_review", "Pending Review"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("override", "Override"),
        ("needs_follow_up", "Needs Follow-up"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey("assessments.AssessmentResponse", on_delete=models.CASCADE, related_name="evidence_review_decisions")
    evidence_check_run = models.ForeignKey("assessments.EvidenceCheckRun", on_delete=models.SET_NULL, null=True, blank=True, related_name="review_decisions")
    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE)
    assessment = models.ForeignKey("assessments.Assessment", on_delete=models.CASCADE)
    decision = models.CharField(max_length=30, choices=DECISION_CHOICES, default="pending_review")
    reviewer = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Important:** Tenant-scope all endpoints by organization/assessment. Platform admins can act globally per Veris rules; client users cannot review outside their org.

---

## Task 4.2: Add reviewer decision API actions

**Objective:** Allow UI to accept/override/request follow-up from a question card.

**Files:**
- Modify: `backend/assessments/views/mixins.py` or create response review viewset
- Modify: `backend/assessments/serializers/__init__.py`
- Test: `backend/tests/assessments/test_flat_views.py`

**Endpoint options:**
- Short-term: `POST /api/responses/{id}/evidence-review-decision/`
- Body:

```json
{
  "decision": "accepted|rejected|override|needs_follow_up",
  "notes": "...",
  "evidence_check_run_id": "optional uuid"
}
```

**Side effects:**
- If `override`, set response `validation_status = reviewer_override`.
- Do not set `ai_validated` as the source of truth for human approval.
- Return latest response summary + decision.

---

## Task 4.3: Add reviewer decision controls in UI

**Objective:** Let reviewers complete the human decision loop directly where they read evidence output.

**Files:**
- Modify: `frontend/app/routes/assessments.$id.questionnaire.tsx`
- Optional component: `EvidenceReviewDecisionControls.tsx`

**UI actions:**
- Accept AI check
- Reject AI check
- Override with notes
- Request more evidence

**Rules:**
- Supplier/operator users should not see reviewer controls.
- Review decision should show reviewer name/date/notes after saved.
- `Request more evidence` should be visible as a status and later can create a Task.

---

# Phase 5 — Assessment-level evidence check

## Task 5.1: Add backend bulk evidence-check endpoint

**Objective:** Run checks for all answered questions in one assessment.

**Files:**
- Modify: `backend/assessments/views/__init__.py` or assessment viewset file
- Possibly create: `backend/assessments/services/evidence_checks.py`
- Test: backend assessment view tests

**Endpoint:**

`POST /api/assessments/{assessment_id}/run-evidence-checks/`

**Behavior:**
- Tenant-scoped by organization.
- Select responses where answer/operator_answer is non-empty.
- Skip responses with evidence currently processing unless `force=true`.
- Run per-response validation service.
- Create `EvidenceCheckRun` for each checked response.
- Return summary counts:

```json
{
  "checked": 12,
  "skipped": 3,
  "counts": {
    "supported": 5,
    "partially_supported": 3,
    "needs_evidence": 2,
    "evidence_processing": 2,
    "unsupported": 0,
    "contradictory": 0
  },
  "skipped_reasons": [
    {"response_id": "...", "reason": "evidence_processing"}
  ]
}
```

**MVP note:** Keep synchronous first. If this becomes slow, convert to background job/worker later.

---

## Task 5.2: Add assessment-level UI summary/action

**Objective:** Put evidence assurance at assessment workflow level, not just per-question.

**Files:**
- Modify: `frontend/app/routes/assessments.$id.questionnaire.tsx`
- Possibly modify: `frontend/app/routes/assessments_detail.tsx`

**UI:**
- Button: `Run evidence check for answered questions`
- Summary cards:
  - Answered
  - Supported
  - Partially supported
  - Needs evidence
  - Processing
  - Review decisions pending
- After bulk run, update local question statuses or reload route data.

---

# Phase 6 — Findings/CIP/report handoff

## Task 6.1: Add create finding from evidence gap

**Objective:** Turn unsupported/partial evidence checks into actionable assessment findings.

**Files:**
- Backend findings views/serializers/models as applicable
- Frontend: `frontend/app/routes/assessments_detail.tsx` or questionnaire route

**Behavior:**
- From a gap/recommended action, reviewer can click `Create finding`.
- Pre-fill:
  - assessment
  - question
  - response
  - evidence check run
  - title from gap
  - description from summary + gap + citation context
  - severity default based on status:
    - contradictory -> high
    - unsupported -> medium/high
    - partially_supported -> medium

**MVP rule:** Create finding only. Do not auto-create CIP until finding is accepted/confirmed.

---

## Task 6.2: Add draft CIP action from accepted finding

**Objective:** Connect evidence assurance to corrective action without over-automating.

**Behavior:**
- On finding detail/list, add `Draft CIP action`.
- Pre-fill action from evidence gap + recommended action.
- Human reviewer edits before saving.

---

# Phase 7 — Tests and verification

## Backend test commands

Run targeted tests first:

```bash
docker compose exec -T backend python -m pytest backend/tests/assessments/test_validation_service.py -q
docker compose exec -T backend python -m pytest backend/tests/assessments/test_flat_views.py -q
docker compose exec -T backend python -m pytest backend/tests/knowledge/test_services.py -q
```

Then broader checks:

```bash
docker compose exec -T backend python manage.py check
docker compose exec -T backend python -m black --check .
docker compose exec -T backend python -m isort --check-only .
docker compose exec -T backend python -m flake8
```

## Frontend test commands

```bash
docker compose exec -T frontend npm run typecheck
```

If Playwright coverage exists for questionnaire:

```bash
docker compose exec -T frontend npm run test:e2e -- --grep "questionnaire"
```

## Manual QA path

1. Start app with Docker.
2. Create/open a template-backed assessment with questionnaire questions.
3. Save an answer.
4. Upload a PDF/TXT evidence file.
5. Confirm evidence metadata shows processed/failed state.
6. Run `Check evidence`.
7. Confirm question card shows:
   - status
   - confidence
   - summary
   - gaps
   - citations
   - recommended action
8. Save reviewer decision.
9. Run assessment-level evidence check.
10. Confirm summary counts update.
11. Create finding from a gap.

---

# Recommended Implementation Order

Ship in this order:

1. Phase 1: evidence upload/indexing searchable.
2. Phase 3.1: UI blocks/labels unprocessed evidence.
3. Phase 2.1 + 2.2: framework context + typed structured output.
4. Phase 3.2 + 3.3: show full result + clean language.
5. Phase 4: reviewer decision layer.
6. Phase 5: assessment-level bulk run.
7. Phase 6: findings/CIP handoff.
8. Phase 2.3: LLM adjudication flag once deterministic workflow is stable.

Do not start with LLM adjudication. It will make demos look smarter, but the bigger product failure is evidence lifecycle + reviewer workflow. Fix the pipeline first.

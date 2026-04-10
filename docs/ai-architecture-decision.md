# AI Architecture Decision Record

## Decision: Embed Evidence Pipeline in Django (Temporary)

**Date**: April 10, 2026  
**Status**: Active (Technical Debt Planned)  
**Driver**: Speed to MVP  

---

## Context

Veris has two backend services:
- `backend/` (Django + DRF): CRUD, auth, business logic, API
- `ai_engine/` (FastAPI): AI orchestration, RAG, heavy processing

The Evidence Pipeline requires:
- PDF text extraction
- Document chunking
- Embedding generation (OpenAI)
- Vector storage (Pinecone)

---

## Decision

**Implement the pipeline in Django (`knowledge/services.py`) for MVP.**

### Why

1. **Speed**: No inter-service communication overhead
2. **Simplicity**: Single codebase to debug during development
3. **Validation**: Prove the product before optimizing architecture

### Trade-offs

| Pros | Cons |
|------|------|
| Faster development | Blocking API calls (slow for large PDFs) |
| Easier debugging | Django not optimized for CPU-heavy tasks |
| No network latency | Can't scale AI independently |
| Single deployment | Tightly coupled AI + CRUD |

---

## Refactor Plan (When to Migrate to ai_engine)

### Triggers (any one):
- [ ] 10+ documents uploaded per day
- [ ] Users complain about slow upload responses (>5s)
- [ ] Need async processing with progress tracking
- [ ] Adding RAG retrieval queries (separate concern)

### Migration Steps

1. **Move services**:
   ```
   backend/knowledge/services.py → ai_engine/services/evidence_pipeline.py
   ```

2. **Add job queue**:
   - Django creates `KnowledgeDocument` with `status=pending`
   - Django POSTs to `ai_engine/jobs/evidence/` (async)
   - ai_engine processes and callbacks to Django webhook

3. **Update API flow**:
   ```
   POST /api/knowledge/documents/  → 202 Accepted + job_id
   GET  /api/knowledge/documents/:id/status  →  polling
   ```

4. **Add webhook endpoint** in Django:
   ```python
   POST /api/ai-webhooks/evidence-complete/
   # Receives: { document_id, vector_ids, chunk_count, success, error }
   ```

---

## Current Implementation

```
User Upload → Django API → process_document() → Pinecone
                ↓
         Update DB (embeddings_indexed, vector_ids)
                ↓
         Return 200 OK (blocking)
```

**Location**: `backend/knowledge/services.py`  
**Entry point**: `POST /api/knowledge/documents/:id/process/`

---

## Future Architecture (Target)

```
User Upload → Django API → Redis Queue → ai_engine (Worker) → Pinecone
                ↓                                              ↓
         202 Accepted + job_id                         Callback Webhook
                ↓                                              ↓
         Poll status endpoint                          Update Django DB
```

---

## Notes

- Pinecone index name: `sustainability-ai` (configured in `.env`)
- Embedding models supported:
  - **OpenAI** (`text-embedding-3-small`): Paid, fast, reliable, 1536 dimensions
  - **HuggingFace** (`sentence-transformers/all-MiniLM-L6-v2`): Free, rate-limited, 384 dimensions
- Switch via `EMBEDDING_MODEL_PROVIDER` in `.env` (`openai` or `huggingface`)
- Chunk size: 1000 chars with 200 char overlap
- Max file size: 25MB (enforced at upload)

---

## Related Files

- `backend/knowledge/models.py` — KnowledgeDocument model
- `backend/knowledge/services.py` — Pipeline implementation
- `backend/knowledge/views/__init__.py` — API endpoints (process, reprocess)
- `ai_engine/` — Reserved for future AI service migration

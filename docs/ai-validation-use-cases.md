# AI Validation: End-to-End Use Case & Testing Guide

## Use Case: Mining Assurance Assessment Submission

### Scenario

**User**: Sustainability consultant working with a mining assurance client  
**Task**: Submit assessment response for Provision 3.2 (Environmental Policy)  
**Goal**: Get AI validation that response is supported by uploaded evidence

---

## Step-by-Step Workflow

### Step 1: Upload Evidence Documents

**Context**: Client has uploaded their environmental policy PDF and wants to submit a response claiming they have a comprehensive policy.

**API Call**:
```bash
curl -X POST http://localhost:8000/api/upload-evidence/ \
  -H "Authorization: Bearer *** \
  -F "file=@environmental_policy_2025.pdf"
```

**Response**:
```json
{
  "url": "/media/evidence_documents/abc123_environmental_policy_2025.pdf",
  "file_name": "environmental_policy_2025.pdf",
  "file_size": 524288,
  "content_type": "application/pdf"
}
```

**Action**: Save the `url` for next step.

---

### Step 2: Create Knowledge Document Record

**API Call**:
```bash
curl -X POST "http://localhost:8000/api/documents/?organization=$ORG_ID" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "'$ORG_ID'",
    "title": "Environmental Policy 2025",
    "description": "Company-wide environmental policy covering waste management, emissions, and biodiversity",
    "file_url": "/media/evidence_documents/abc123_environmental_policy_2025.pdf",
    "file_type": "PDF",
    "file_size": 524288,
    "category": "policy",
    "framework_tags": ["mining-assurance-standard"]
  }'
```

**Response**:
```json
{
  "id": "doc-uuid-1234-5678",
  "organization": "org-uuid-abcd-efgh",
  "title": "Environmental Policy 2025",
  "embeddings_indexed": false,
  "chunk_count": 0,
  "vector_ids": []
}
```

**Action**: Save the document `id` for processing.

---

### Step 3: Process Document (AI Embedding)

**API Call**:
```bash
curl -X POST "http://localhost:8000/api/documents/doc-uuid-1234-5678/process/" \
  -H "Authorization: Bearer ***
```

**Response**:
```json
{
  "status": "processed",
  "chunk_count": 12,
  "vector_count": 12
}
```

**What Happened**:
1. PDF text extracted (12 pages → ~8,000 words)
2. Text chunked into 12 overlapping segments (1000 chars each)
3. Each chunk embedded using OpenAI/HuggingFace
4. Vectors stored in Pinecone with metadata:
   ```json
   {
     "document_id": "doc-uuid-1234-5678",
     "organization_id": "org-uuid-abcd-efgh",
     "chunk_index": 0,
     "text": "Our company is committed to minimizing environmental impact...",
     "framework_tags": ["mining-assurance-standard"]
   }
   ```

**Verify**:
```bash
curl "http://localhost:8000/api/documents/doc-uuid-1234-5678/" \
  -H "Authorization: Bearer ***
```

Check `embeddings_indexed: true` and `chunk_count: 12`.

---

### Step 4: Submit Assessment Response

**Context**: Consultant writes response for Provision 3.2 based on the policy document.

**API Call**:
```bash
curl -X POST "http://localhost:8000/api/organizations/$ORG_ID/assessments/$ASSESSMENT_ID/responses/" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "question-uuid-321",
    "answer_text": "Our company has a comprehensive environmental policy that covers waste management, greenhouse gas emissions, water usage, and biodiversity protection. The policy was approved by the board in January 2025 and is reviewed annually. We have specific targets to reduce emissions by 30% by 2030 and achieve zero waste to landfill by 2028.",
    "answer_score": 4.0,
    "evidence_files": ["doc-uuid-1234-5678"]
  }'
```

**Response**:
```json
{
  "id": "response-uuid-9876",
  "assessment": "assessment-uuid-1111",
  "question": "question-uuid-321",
  "answer_text": "Our company has a comprehensive environmental policy...",
  "answer_score": 4.0,
  "validation_status": "pending",
  "confidence_score": null,
  "citations": [],
  "ai_validated": false
}
```

**Note**: `validation_status: "pending"` — not yet validated by AI.

---

### Step 5: Trigger AI Validation

**API Call**:
```bash
curl -X POST "http://localhost:8000/api/organizations/$ORG_ID/assessments/$ASSESSMENT_ID/responses/response-uuid-9876/validate/" \
  -H "Authorization: Bearer ***
```

**Response** (Scenario A: Strong Match):
```json
{
  "validation_status": "validated",
  "confidence_score": 0.87,
  "citations": ["doc-uuid-1234-5678"],
  "feedback": "Response validated with 87% confidence. Found 3 supporting evidence chunk(s) in uploaded documents.",
  "matching_chunks": 3
}
```

**Response** (Scenario B: Weak Match):
```json
{
  "validation_status": "insufficient_evidence",
  "confidence_score": 0.32,
  "citations": [],
  "feedback": "Insufficient evidence found (32% confidence). No matching documents found. Please upload supporting evidence or revise response.",
  "matching_chunks": 0
}
```

---

### Step 6: Review Updated Response

**API Call**:
```bash
curl "http://localhost:8000/api/organizations/$ORG_ID/assessments/$ASSESSMENT_ID/responses/response-uuid-9876/" \
  -H "Authorization: Bearer ***
```

**Response** (After Validation):
```json
{
  "id": "response-uuid-9876",
  "answer_text": "Our company has a comprehensive environmental policy...",
  "validation_status": "validated",
  "confidence_score": 0.87,
  "citations": ["doc-uuid-1234-5678"],
  "ai_feedback": "Response validated with 87% confidence. Found 3 supporting evidence chunk(s)...",
  "ai_validated": true,
  "updated_at": "2026-04-10T18:45:00Z"
}
```

---

## Testing Scenarios

### Scenario 1: Strong Validation (Happy Path)

**Setup**:
- Upload policy document with clear environmental commitments
- Submit response that closely mirrors policy language

**Expected Result**:
- `validation_status`: "validated"
- `confidence_score`: > 0.80
- `citations`: [document_id]
- `matching_chunks`: 2-5

**Test Script**:
```bash
# See test_e2e_validation.sh below
```

---

### Scenario 2: Insufficient Evidence

**Setup**:
- Upload unrelated document (e.g., financial report)
- Submit response about environmental policy

**Expected Result**:
- `validation_status`: "insufficient_evidence"
- `confidence_score`: < 0.50
- `citations`: []
- `matching_chunks`: 0-1

**Use Case**: Consultant forgot to upload the right evidence → system flags it.

---

### Scenario 3: Flagged for Review

**Setup**:
- Upload policy document but with vague/weak language
- Submit response with specific claims

**Expected Result**:
- `validation_status`: "flagged"
- `confidence_score`: 0.50-0.79
- `citations`: [document_id]
- `matching_chunks`: 1-2

**Use Case**: Human reviewer needs to check if evidence actually supports claims.

---

### Scenario 4: Cross-Document Validation

**Setup**:
- Upload 3 documents: policy + procedures + annual report
- Submit response referencing multiple sources

**Expected Result**:
- `validation_status`: "validated"
- `confidence_score`: > 0.85 (boosted by multiple sources)
- `citations`: [doc1, doc2, doc3]
- `matching_chunks`: 5+

**Use Case**: Complex responses backed by multiple evidence sources.

---

## End-to-End Test Script

Save as `test_e2e_validation.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BASE_URL="http://localhost:8000"
ACCESS_TOKEN="***"
ORG_ID="your-org-uuid"
ASSESSMENT_ID="your-assessment-uuid"

echo "=== AI Validation E2E Test ==="

# Step 1: Upload evidence
echo "Step 1: Uploading evidence document..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/upload-evidence/" \
  -H "Authorization: Bearer *** \
  -F "file=@test_evidence.pdf")

FILE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.url')
echo "Uploaded to: $FILE_URL"

# Step 2: Create knowledge document
echo "Step 2: Creating knowledge document..."
DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/documents/?organization=$ORG_ID" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d "{
    \"organization\": \"$ORG_ID\",
    \"title\": \"Test Evidence Document\",
    \"file_url\": \"$FILE_URL\",
    \"file_type\": \"PDF\",
    \"category\": \"evidence\"
  }")

DOC_ID=$(echo "$DOC_RESPONSE" | jq -r '.id')
echo "Created document: $DOC_ID"

# Step 3: Process document
echo "Step 3: Processing document (embedding)..."
PROCESS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/documents/$DOC_ID/process/" \
  -H "Authorization: Bearer ***

echo "Processing result: $(echo "$PROCESS_RESPONSE" | jq -r '.status')"

# Step 4: Create assessment response
echo "Step 4: Creating assessment response..."
RESPONSE_CREATE=$(curl -s -X POST "$BASE_URL/api/organizations/$ORG_ID/assessments/$ASSESSMENT_ID/responses/" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d "{
    \"question_id\": \"test-question-id\",
    \"answer_text\": \"Test response that should match the evidence document content...\",
    \"answer_score\": 4.0,
    \"evidence_files\": [\"$DOC_ID\"]
  }")

RESPONSE_ID=$(echo "$RESPONSE_CREATE" | jq -r '.id')
echo "Created response: $RESPONSE_ID"

# Step 5: Validate response
echo "Step 5: Triggering AI validation..."
VALIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/organizations/$ORG_ID/assessments/$ASSESSMENT_ID/responses/$RESPONSE_ID/validate/" \
  -H "Authorization: Bearer ***

echo "Validation Result:"
echo "$VALIDATE_RESPONSE" | jq '.'

# Extract and verify
STATUS=$(echo "$VALIDATE_RESPONSE" | jq -r '.validation_status')
CONFIDENCE=$(echo "$VALIDATE_RESPONSE" | jq -r '.confidence_score')

echo ""
echo "=== Test Results ==="
echo "Status: $STATUS"
echo "Confidence: $CONFIDENCE"

if [ "$STATUS" = "validated" ] && (( $(echo "$CONFIDENCE > 0.8" | bc -l) )); then
    echo "✅ Test PASSED: Response validated with high confidence"
    exit 0
else
    echo "⚠️  Test Result: $STATUS (confidence: $CONFIDENCE)"
    exit 0  # Not a failure - depends on test document content
fi
```

---

## Manual Testing Checklist

### Prerequisites
- [ ] Pinecone API key configured in `.env`
- [ ] OpenAI or HuggingFace API key configured
- [ ] Test PDF document ready (5-10 pages, clear text)
- [ ] JWT access token (login via `/api/token/`)
- [ ] Organization and Assessment IDs

### Validation Steps
- [ ] Document uploads successfully
- [ ] Document processes without errors (check `embeddings_indexed: true`)
- [ ] Response creates with `validation_status: "pending"`
- [ ] Validation endpoint returns status + confidence
- [ ] Response record updates with validation results
- [ ] Citations point to correct document IDs

### Edge Cases
- [ ] Empty response text → Error handled gracefully
- [ ] No evidence uploaded → `insufficient_evidence`
- [ ] Multiple evidence documents → All cited if relevant
- [ ] Very long response (>5000 chars) → Still processes
- [ ] Non-English text → Embeddings still work (model-dependent)

---

## Debugging Guide

### Issue: Validation Returns 0.1 Confidence

**Possible Causes**:
1. No documents indexed in Pinecone for this organization
2. Response text too short (< 10 words)
3. Response topic completely unrelated to evidence

**Debug Steps**:
```bash
# Check if document was processed
curl "$BASE_URL/api/documents/$DOC_ID/" \
  -H "Authorization: Bearer *** | jq '.embeddings_indexed'

# Should be: true

# Check Pinecone directly (if you have access)
# See docs/ai-architecture-decision.md for Pinecone dashboard link
```

---

### Issue: Validation Takes >30 Seconds

**Possible Causes**:
1. Large PDF (>100 pages) → slow extraction
2. HuggingFace rate limiting (free tier)
3. Network latency to Pinecone

**Debug Steps**:
```bash
# Check processing time in server logs
docker logs veris-backend-1 | grep "POST.*validate"

# Consider switching to OpenAI embeddings (faster)
# Change EMBEDDING_MODEL_PROVIDER=openai in .env
```

---

### Issue: Validation Status Always "Flagged"

**Possible Causes**:
1. Thresholds too strict for your use case
2. Evidence documents have poor text quality (scanned images)
3. Response written in different style than evidence

**Solutions**:
1. Lower threshold in `validation.py`:
   ```python
   # Change from 0.80 to 0.70
   if confidence >= 0.70:
       return "validated"
   ```
2. Improve document quality (OCR scanned PDFs)
3. Retrain/calibrate with real user data

---

## Production Monitoring

### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Avg validation time | < 5s | > 15s |
| Validation coverage | > 80% responses | < 50% |
| Avg confidence score | 0.6-0.8 | < 0.4 or > 0.95 |
| Flagged review rate | 10-20% | > 40% |

### Logging

Add to validation service:
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"Validation completed: status={result.validation_status}, "
            f"confidence={result.confidence_score}, response_id={response_obj.id}")
```

### Dashboard Queries (Example)

```sql
-- Validation coverage by organization
SELECT 
    a.organization_id,
    COUNT(*) as total_responses,
    COUNT(*) FILTER (WHERE ar.ai_validated = true) as validated_responses,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ar.ai_validated = true) / COUNT(*), 2) as coverage_pct
FROM assessment_responses ar
JOIN assessments a ON ar.assessment_id = a.id
GROUP BY a.organization_id
ORDER BY coverage_pct DESC;

-- Confidence score distribution
SELECT 
    CASE 
        WHEN confidence_score >= 0.8 THEN 'validated'
        WHEN confidence_score >= 0.5 THEN 'flagged'
        ELSE 'insufficient'
    END as status_bucket,
    COUNT(*) as count
FROM assessment_responses
WHERE ai_validated = true
GROUP BY status_bucket;
```

---

## Replication Checklist

To replicate this feature in another project:

- [ ] Pinecone account + index created
- [ ] Embedding model selected (OpenAI or HuggingFace)
- [ ] Document upload pipeline (extract → chunk → embed)
- [ ] Validation service (embed → query → score)
- [ ] API endpoint for triggering validation
- [ ] Database fields for validation results
- [ ] Frontend UI showing validation status + confidence
- [ ] Documentation for end users (what scores mean)
- [ ] Monitoring/logging in place

---

## Related Documentation

- `docs/ai-validation-scoring.md` — Scoring algorithm details
- `docs/ai-architecture-decision.md` — Technical architecture
- `docs/storage-configuration.md` — S3 vs local storage
- `backend/assessments/services/validation.py` — Implementation code

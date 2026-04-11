# AI Validation Scoring System

## Overview

The validation scoring system evaluates assessment responses against uploaded evidence documents using **semantic similarity** from vector embeddings.

---

## Purpose

### Why This Exists

1. **Automated Evidence Verification**: Check if response claims are supported by uploaded documents
2. **Risk Flagging**: Identify responses that may need human review
3. **Confidence Tracking**: Quantify how well-supported each response is
4. **Audit Trail**: Create citable links between responses and evidence

### Business Value

| Stakeholder | Benefit |
|-------------|---------|
| **Consultants** | Quickly spot weak responses that need more evidence |
| **Clients** | Confidence that submissions are evidence-backed |
| **Auditors** | Traceable citations from response → source documents |
| **Veris Platform** | Differentiated AI validation feature vs. competitors |

---

## Scoring Algorithm

### Step 1: Embed Response Text

```python
embedding = embed_text(response_text)  # 1536-dim vector (OpenAI) or 384-dim (HF)
```

### Step 2: Query Similar Evidence

```python
matches = query_similar_evidence(
    embedding=embedding,
    organization_id=org_id,
    top_k=5,           # Return top 5 matching chunks
    threshold=0.5,     # Minimum cosine similarity
)
```

### Step 3: Calculate Confidence Score

**Formula:**
```python
if no_matches:
    confidence = 0.1
else:
    avg_similarity = mean(match.score for match in matches)
    count_boost = min(match_count * 0.1, 0.3)  # Cap at 0.3
    confidence = min(avg_similarity * (0.7 + count_boost), 0.95)
```

**Example Calculations:**

| Scenario | Matches | Avg Similarity | Count Boost | Final Confidence |
|----------|---------|----------------|-------------|------------------|
| No evidence | 0 | - | - | **0.10** |
| Single weak match | 1 | 0.60 | 0.10 | 0.60 × 0.80 = **0.48** |
| Single strong match | 1 | 0.90 | 0.10 | 0.90 × 0.80 = **0.72** |
| 2 strong matches | 2 | 0.85 | 0.20 | 0.85 × 0.90 = **0.77** |
| 3+ strong matches | 3+ | 0.90 | 0.30 (capped) | 0.90 × 1.00 = **0.90** (capped at 0.95) |

### Step 4: Determine Status

| Confidence | Status | Action |
|------------|--------|--------|
| ≥ 0.80 | `validated` | ✅ Green - Response is well-supported |
| 0.50 - 0.79 | `flagged` | ⚠️ Yellow - Needs human review |
| < 0.50 | `insufficient_evidence` | ❌ Red - Add more evidence or revise |

---

## Design Rationale

### Where Did This Come From?

This scoring system is a **pragmatic heuristic** designed for sustainability assessment workflows. It combines:

1. **Cosine Similarity** (standard in RAG systems)
   - Measures semantic similarity between response and evidence
   - Range: 0.0 (completely different) to 1.0 (identical meaning)
   - Industry standard from vector DB literature (Pinecone, Weaviate, etc.)

2. **Corroboration Bonus** (original design)
   - Multiple matching chunks = higher confidence
   - Inspired by legal evidence standards (multiple sources = stronger case)
   - Capped at 0.3 to prevent gaming the system

3. **Threshold Tuning** (empirical)
   - 0.80 for "validated": High bar for automated approval
   - 0.50 for "flagged": Middle ground for human review
   - Based on typical cosine similarity distributions for sentence transformers

### Not From Academic Sources

⚠️ **Important**: This is **not** a peer-reviewed scoring system. It's a practical implementation designed for:

- Fast MVP deployment
- Interpretable results (consultants can understand "87% confidence")
- Actionable outputs (validated/flagged/insufficient)

### Future Improvements

For production use, consider:

1. **Calibration Study**: Collect human-labeled data and tune thresholds
2. **Precision/Recall Analysis**: Measure false positive/negative rates
3. **A/B Testing**: Test different thresholds with real users
4. **Fine-Tuned Model**: Train embeddings on sustainability domain text
5. **LLM Grading**: Use LLM to evaluate match quality (not just similarity)

---

## Implementation

**Location**: `backend/assessments/services/validation.py`

### Key Functions

```python
def calculate_confidence(matches: List[dict]) -> float:
    """
    Calculate confidence score based on match quality.
    
    - No matches: 0.1 (very low confidence)
    - 1 match: avg_score × 0.8 (base confidence)
    - 2+ matches: avg_score × (0.8 + 0.1 per additional match, max 0.3 boost)
    - Capped at 0.95 (never claim 100% certainty)
    """

def determine_status(confidence: float, matches: List[dict]) -> str:
    """
    Map confidence to human-readable status.
    
    - ≥0.80: "validated" (automated approval)
    - ≥0.50: "flagged" (needs review)
    - <0.50: "insufficient_evidence" (reject/revise)
    """
```

---

## Usage Example

### API Request

```bash
POST /api/organizations/:org_id/assessments/:id/responses/:response_id/validate/
Authorization: Bearer <token>
```

### API Response

```json
{
  "validation_status": "validated",
  "confidence_score": 0.847,
  "citations": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ],
  "feedback": "Response validated with 85% confidence. Found 3 supporting evidence chunk(s) in uploaded documents.",
  "matching_chunks": 3
}
```

### Database Update

The response record is updated with:

```python
response.validation_status = "validated"
response.confidence_score = 0.847
response.citations = ["doc-uuid-1", "doc-uuid-2"]
response.ai_feedback = "Response validated with 85% confidence..."
response.ai_validated = True
```

---

## Limitations

### Known Issues

1. **Semantic Similarity ≠ Factual Accuracy**
   - A response can be similar to evidence but still misinterpret it
   - Solution: Add LLM-based fact-checking layer

2. **Document Quality Dependency**
   - Garbage in = garbage out
   - Poor quality evidence → low confidence scores

3. **No Context Understanding**
   - Doesn't understand negation, sarcasm, or complex logic
   - Example: "We do NOT dump waste" vs "We dump waste"

4. **Threshold Arbitrariness**
   - 0.80/0.50 thresholds are heuristic, not scientifically validated
   - May need adjustment based on real-world performance

### Mitigation Strategies

| Limitation | Mitigation |
|------------|------------|
| Semantic ≠ Factual | Add "Report Issue" button for human correction |
| Document Quality | Add document quality scoring (OCR quality, completeness) |
| Context Blindness | Use LLM for final validation pass (not just embeddings) |
| Arbitrary Thresholds | Log all scores + collect user feedback for calibration |

---

## Comparison to Industry Standards

| System | Scoring Approach | Thresholds |
|--------|------------------|------------|
| **Veris (this system)** | Cosine similarity + count boost | 0.80/0.50 |
| **Google RAG Evaluation** | BLEU/ROUGE + human eval | Varies |
| **Pinecone Best Practices** | Cosine similarity only | 0.70-0.85 typical |
| **Legal eDiscovery** | Keyword + semantic hybrid | 0.60+ for review |
| **Academic Plagiarism** | Text overlap + citation check | 0.80+ for flagging |

---

## Testing

### Unit Tests (TODO)

```python
def test_confidence_calculation():
    # No matches
    assert calculate_confidence([]) == 0.1
    
    # Single match at 0.9 similarity
    matches = [{"score": 0.9}]
    assert calculate_confidence(matches) == 0.72  # 0.9 * 0.8
    
    # Three matches at 0.9 similarity
    matches = [{"score": 0.9}, {"score": 0.9}, {"score": 0.9}]
    assert calculate_confidence(matches) == 0.9  # 0.9 * 1.0
```

### Integration Tests (TODO)

1. Upload PDF with known content
2. Submit response that matches PDF
3. Verify confidence score > 0.8
4. Submit response unrelated to PDF
5. Verify confidence score < 0.5

---

## References

### Technical Background

- **Cosine Similarity**: https://en.wikipedia.org/wiki/Cosine_similarity
- **RAG Evaluation**: https://github.com/ragas-io/ragas
- **Pinecone Documentation**: https://docs.pinecone.io/guides/data/understanding-hybrid-search

### Related Patterns

- **Retrieval-Augmented Generation (RAG)**: Lewis et al. (2020)
- **Semantic Search**: https://www.sbert.net/
- **Vector Search Best Practices**: https://www.pinecone.io/learn/

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-10 | Use cosine similarity | Industry standard, well-understood |
| 2026-04-10 | Add count boost | Multiple sources = stronger evidence |
| 2026-04-10 | Cap at 0.95 | Never claim 100% certainty (avoids overconfidence) |
| 2026-04-10 | 0.80 threshold for validated | High bar for automated approval |
| 2026-04-10 | 0.50 threshold for flagged | Middle ground for human review |

---

## Future Work

1. **Calibration Dataset**: Collect 100+ human-labeled responses
2. **ROC Curve Analysis**: Find optimal thresholds for precision/recall tradeoff
3. **Domain-Specific Embeddings**: Fine-tune on sustainability/ESG text
4. **LLM Re-Ranking**: Use LLM to re-rank top matches by relevance
5. **Explainability**: Show users WHY a score was given (highlight matching text)

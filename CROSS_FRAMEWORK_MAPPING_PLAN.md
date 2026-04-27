# Cross-Framework Mapping Implementation Plan

## Overview
Enable AI-powered cross-framework evidence mapping to show how a single piece of evidence satisfies multiple framework requirements.

**Example:** A single "Environmental Policy" document can map to:
- Bettercoal P3.4 (Environmental Management)
- EO100 P7.1.1 (Environmental Policy)
- CGWG SAQ E.1 (Environmental Commitment)

## Current State

### Already Implemented (feature/framework-import-ui)
```python
class AssessmentQuestion(models.Model):
    framework_mappings = models.JSONField(default=list, blank=True)
    # Structure: [
    #   {"framework_id": "uuid", "provision_code": "P1.2.3", "provision_name": "..."},
    #   ...
    # ]
```

### Enhancement Needed
- AI-powered mapping suggestions
- Evidence-level mapping (not just question-level)
- Visualization of cross-framework coverage

## Data Model Enhancements

### 1. FrameworkMapping Model (New)
```python
class FrameworkMapping(models.Model):
    """Explicit mapping between provisions of different frameworks."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Source provision
    source_framework = models.ForeignKey(
        "assessments.Framework",
        on_delete=models.CASCADE,
        related_name="outgoing_mappings"
    )
    source_provision_code = models.CharField(max_length=50)
    source_question = models.ForeignKey(
        "assessments.AssessmentQuestion",
        on_delete=models.CASCADE,
        related_name="outgoing_mappings"
    )
    
    # Target provision
    target_framework = models.ForeignKey(
        "assessments.Framework",
        on_delete=models.CASCADE,
        related_name="incoming_mappings"
    )
    target_provision_code = models.CharField(max_length=50)
    target_question = models.ForeignKey(
        "assessments.AssessmentQuestion",
        on_delete=models.CASCADE,
        related_name="incoming_mappings"
    )
    
    # Mapping metadata
    confidence_score = models.FloatField(default=0.0)
    mapping_type = models.CharField(
        max_length=30,
        choices=[
            ("EXACT", "Exact Match"),
            ("PARTIAL", "Partial Overlap"),
            ("RELATED", "Related Concept"),
        ]
    )
    
    # AI-generated explanation
    ai_explanation = models.TextField(blank=True, default="")
    
    # Human validation
    validated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ["source_question", "target_question"]
```

### 2. EvidenceMapping Model (New)
```python
class EvidenceMapping(models.Model):
    """Maps a specific evidence file to multiple framework provisions."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Evidence file
    response = models.ForeignKey(
        "assessments.AssessmentResponse",
        on_delete=models.CASCADE,
        related_name="evidence_mappings"
    )
    evidence_file_key = models.CharField(max_length=500)  # S3 key
    
    # Mapped provisions (can be multiple)
    mapped_questions = models.JSONField(default=list)
    # [{"question_id": "uuid", "framework_name": "...", "provision_code": "..."}, ...]
    
    # AI analysis
    ai_relevance_scores = models.JSONField(default=dict)
    # {"question_id": 0.95, ...}
    
    created_at = models.DateTimeField(auto_now_add=True)
```

## AI Service

### Cross-Framework Mapping Service
```python
class CrossFrameworkMappingService:
    """
    AI-powered service to suggest cross-framework mappings.
    """
    
    def suggest_mappings(self, question: AssessmentQuestion) -> List[FrameworkMapping]:
        """
        Given a question, find similar provisions in other frameworks.
        
        Uses:
        - Semantic similarity (embeddings)
        - Keyword matching
        - Existing mapping patterns
        """
        # 1. Get question embedding
        question_embedding = self.embed(question.text)
        
        # 2. Search all questions from other frameworks
        candidates = self.semantic_search(
            question_embedding,
            filters={"framework_id__ne": question.template.framework_id}
        )
        
        # 3. Score and rank
        mappings = []
        for candidate in candidates[:20]:
            similarity = self.cosine_similarity(question_embedding, candidate.embedding)
            if similarity > 0.7:  # Threshold
                mappings.append(FrameworkMapping(
                    source_question=question,
                    target_question=candidate,
                    confidence_score=similarity,
                    mapping_type=self.classify_mapping_type(similarity),
                    ai_explanation=self.generate_explanation(question, candidate)
                ))
        
        return mappings
    
    def map_evidence_to_frameworks(
        self,
        evidence_text: str,
        framework_ids: List[UUID]
    ) -> List[Dict]:
        """
        Given evidence text, suggest which framework provisions it satisfies.
        
        Returns:
        [
            {
                "framework_name": "Bettercoal",
                "provision_code": "P3.4",
                "question_id": "uuid",
                "relevance_score": 0.92,
                "explanation": "This policy document addresses..."
            },
            ...
        ]
        """
```

## API Endpoints

### Question Mappings
```
GET    /api/questions/{id}/mappings/
POST   /api/questions/{id}/mappings/suggest/  # AI suggestions
POST   /api/questions/{id}/mappings/          # Create manual mapping
DELETE /api/questions/{id}/mappings/{mapping_id}/
```

### Evidence Mappings
```
POST   /api/responses/{id}/evidence/map/  # AI-analyze uploaded evidence
GET    /api/evidence/{id}/mappings/
```

### Cross-Framework Dashboard
```
GET /api/frameworks/{id}/coverage/
# Returns:
{
    "framework": {...},
    "total_provisions": 144,
    "mapped_provisions": 89,
    "coverage_percentage": 61.8,
    "mappings_to": [
        {"framework": "EO100", "count": 45},
        {"framework": "CGWG", "count": 23},
    ],
    "mappings_from": [...]
}
```

## Frontend Features

### 1. Question Editor - Mapping Panel
- Show existing mappings (badges with framework name + provision code)
- "Suggest Mappings" button (triggers AI)
- Manual mapping selector (search questions from other frameworks)
- Confidence score indicator

### 2. Evidence Upload - Auto-Mapping
- After upload, show "Analyzing evidence..."
- Display suggested framework mappings
- User confirms/rejects suggestions
- Store validated mappings

### 3. Cross-Framework Dashboard
- Matrix view: Frameworks × Frameworks (heatmap of mapping counts)
- Coverage report: % of provisions mapped
- Gap analysis: Unmapped provisions
- Export: CSV/PDF of mappings

### 4. Assessment View - Unified Evidence
- Show: "This evidence satisfies:"
  - ✓ Bettercoal P3.4
  - ✓ EO100 P7.1.1
  - ✓ CGWG SAQ E.1
- Reduce duplicate uploads

## Implementation Steps

### Step 1: Backend Models (2 hours)
- [ ] FrameworkMapping model
- [ ] EvidenceMapping model
- [ ] Migrations
- [ ] Signals for auto-creating mappings on question save

### Step 2: AI Service (4 hours)
- [ ] CrossFrameworkMappingService class
- [ ] Embedding generation (use existing Pinecone setup)
- [ ] Semantic search integration
- [ ] Explanation generation (LLM prompt)
- [ ] Confidence scoring

### Step 3: API Endpoints (3 hours)
- [ ] Question mapping CRUD
- [ ] AI suggestion endpoint
- [ ] Evidence mapping endpoint
- [ ] Coverage analytics endpoint

### Step 4: Frontend UI (6 hours)
- [ ] Question editor mapping panel
- [ ] Evidence auto-mapping modal
- [ ] Cross-framework dashboard
- [ ] Coverage visualization (charts)

### Step 5: Testing (3 hours)
- [ ] Test mapping accuracy (Bettercoal ↔ EO100)
- [ ] Test evidence mapping
- [ ] Performance test (large framework imports)
- [ ] E2E: Upload evidence → AI maps → Confirm → View in dashboard

## Example Mapping Data

### Bettercoal → EO100
```json
{
    "source": {
        "framework": "Bettercoal Code 2.0",
        "provision": "P3.4",
        "text": "Environmental Management System"
    },
    "target": {
        "framework": "EO100 Standard",
        "provision": "100.7.1.1",
        "text": "Operator shall establish an environmental policy"
    },
    "confidence": 0.89,
    "type": "PARTIAL",
    "ai_explanation": "Both provisions address environmental management systems, though EO100 is more specific about policy documentation."
}
```

### CGWG → Bettercoal
```json
{
    "source": {
        "framework": "CGWG SAQ",
        "provision": "E.1",
        "text": "Environmental policy commitment"
    },
    "target": {
        "framework": "Bettercoal Code 2.0",
        "provision": "P3.1",
        "text": "Commitment to sustainable development"
    },
    "confidence": 0.94,
    "type": "EXACT",
    "ai_explanation": "Both provisions require formal environmental/sustainability policy commitments from senior management."
}
```

## Benefits

### For Users
- **Upload once, satisfy multiple**: Single evidence file for multiple frameworks
- **Gap visibility**: See which provisions lack evidence
- **Efficiency**: 60-80% reduction in duplicate evidence collection

### For Consultancies (TDi)
- **Cross-sell opportunities**: "You're compliant with Bettercoal P3, you're 80% there for EO100 P7"
- **Unified reporting**: Single dashboard for all frameworks
- **AI differentiation**: Automated mapping vs manual consulting

### For Veris Platform
- **Lock-in effect**: Mappings are platform-specific IP
- **Data moat**: More users → better AI mappings → better product
- **Premium feature**: Advanced mapping analytics as paid tier

## Future Enhancements

### Phase 2: Industry Benchmarks
- "Companies in mining sector typically map P3.4 to these 5 EO100 provisions"
- Aggregate anonymized mapping patterns

### Phase 3: Compliance Scoring
- "Your Bettercoal compliance score: 87%"
- "Equivalent EO100 score: 82% (based on mappings)"

### Phase 4: Regulatory Alerts
- "Bettercoal P3.4 updated - affects 23 mapped EO100 provisions"
- Auto-flag for review

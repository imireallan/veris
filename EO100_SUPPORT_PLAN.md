# EO100 Support Implementation Plan

## Overview
Add EO100 (Energy Operations 100) standard support to Veris with industry supplements and performance targets.

**Source:** `~/projects/TDi/backend/eo100_api/`

## EO100 Structure

### 4 Supplements (Industry Variants)
- **DEFAULT (100)**: Baseline standard
- **PROCESSING (101)**: Gas processing facilities
- **PRODUCTION (102)**: Oil/gas production sites
- **TRANSMISSION_STORAGE (103)**: Pipelines, storage facilities

### 10 Principles
1. Ethics & Compliance
2. Transparency & Accountability
3. Community Engagement
4. Indigenous Peoples' Rights
5. Labor Rights
6. Health & Safety
7. Environment
8. Climate Change
9. Biodiversity
10. Decommissioning

### 3 Performance Targets (PT)
- **PT1**: Minimum compliance (33 points)
- **PT2**: Good practice (66 points)
- **PT3**: Best practice (100 points)

### Question Format
- **ID**: `100.1.1.1` (supplement.principle.objective.PT)
- **Text**: "Operator shall establish..."
- **Performance Target**: 1, 2, or 3
- **Description**: Evidence examples

## Data Model Changes

### 1. AssessmentTemplate.supplement_type
```python
class AssessmentTemplate(models.Model):
    supplement_type = models.CharField(
        max_length=50,
        choices=[
            ("DEFAULT", "Default"),
            ("PROCESSING", "Processing"),
            ("PRODUCTION", "Production"),
            ("TRANSMISSION_STORAGE", "Transmission & Storage"),
        ],
        null=True,
        blank=True,
        help_text="EO100 supplement type (null for non-EO100 frameworks)"
    )
```

### 2. AssessmentQuestion.performance_target_level
```python
class AssessmentQuestion(models.Model):
    performance_target_level = models.IntegerField(
        default=1,
        choices=[
            (1, "PT1 - Minimum Compliance"),
            (2, "PT2 - Good Practice"),
            (3, "PT3 - Best Practice"),
        ],
        help_text="EO100 performance target level"
    )
    
    # Update scoring_criteria to support PT-based scoring
    scoring_criteria = models.JSONField(default=dict)
    # Example: {"PT1": 33, "PT2": 66, "PT3": 100, "type": "select_one"}
```

### 3. AssessmentQuestion.external_question_id
```python
class AssessmentQuestion(models.Model):
    external_question_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="EO100 format: supplement.principle.objective.PT (e.g., '100.1.1.1')"
    )
```

### 4. Framework.enhanced_metadata
```python
class Framework(models.Model):
    # Add EO100-specific metadata
    metadata = models.JSONField(default=dict, blank=True)
    # Example: {"supplements": [100, 101, 102, 103], "principles": 10, "version": "2024"}
```

## API Enhancements

### Import EO100 SAQ JSON
```python
POST /api/frameworks/import-eo100/
{
    "supplement": "DEFAULT",  # or PROCESSING, PRODUCTION, TRANSMISSION_STORAGE
    "file": <SAQ_Default.json>
}
```

### Filter Questions by PT Level
```python
GET /api/templates/{id}/questions/?pt_level=2
# Returns only PT2 questions
```

## Frontend Changes

### Template Creation
- Add supplement type selector (for EO100 frameworks)
- Show performance target level on questions

### Question Editor
- Display external_question_id (e.g., "100.1.1.1")
- PT level selector (PT1/PT2/PT3)
- Scoring auto-calculation based on PT

### Assessment Dashboard
- Show supplement badge on templates
- Filter by PT level
- Progress by PT level (% PT1, % PT2, % PT3)

## Implementation Steps

### Step 1: Backend Models (2 hours)
- [ ] Add supplement_type to AssessmentTemplate
- [ ] Add performance_target_level to AssessmentQuestion
- [ ] Add external_question_id to AssessmentQuestion
- [ ] Add metadata JSONField to Framework
- [ ] Create migrations

### Step 2: EO100 Import Service (3 hours)
- [ ] Parse SAQ_Default.json, SAQ_Processing.json, etc.
- [ ] Create import_eo100_saq management command
- [ ] Map: supplement → Framework, questions → AssessmentQuestion
- [ ] Set external_question_id format
- [ ] Test with all 4 supplements

### Step 3: API Endpoints (2 hours)
- [ ] POST /api/frameworks/import-eo100/
- [ ] GET /api/templates/?supplement_type=PROCESSING
- [ ] GET /api/questions/?pt_level=2
- [ ] Update serializers with new fields

### Step 4: Frontend UI (4 hours)
- [ ] Template form: supplement type selector
- [ ] Question editor: PT level, external ID display
- [ ] Dashboard: supplement badges, PT filters
- [ ] Import wizard: EO100 JSON upload

### Step 5: Testing (2 hours)
- [ ] Import all 4 EO100 supplements
- [ ] Verify question counts match legacy
- [ ] Test PT filtering
- [ ] E2E: Create EO100 template → Answer questions → Submit

## File Structure
```
backend/
  assessments/
    models.py (add fields)
    services/
      eo100_import.py (new)
    management/commands/
      import_eo100_saq.py (new)
    migrations/
      0018_eo100_support.py

frontend/
  app/
    routes/
      organizations.$orgId.frameworks.import.tsx (add EO100 option)
      organizations.$orgId.templates.$templateId.tsx (show PT levels)
```

## Migration from EO100 Backend

### Export from ~/projects/TDi/backend/
```bash
# Export QuestionDefinition data
python manage.py shell -c "
from eo100.models import QuestionDefinition
import json
data = list(QuestionDefinition.objects.values())
with open('eo100_questions.json', 'w') as f:
    json.dump(data, f)
"
```

### Import to Veris
```bash
python manage.py shell < backend/import_eo100_saq.py
```

## Scoring Logic

### Legacy EO100
- PT1 = 33 points
- PT2 = 66 points
- PT3 = 100 points
- Score = sum of achieved PT levels

### Veris Implementation
```python
def calculate_score(responses):
    total = 0
    for response in responses:
        pt_level = response.question.performance_target_level
        if pt_level == 1:
            total += 33
        elif pt_level == 2:
            total += 66
        elif pt_level == 3:
            total += 100
    return total
```

## Cross-Framework Mapping

EO100 questions can map to other frameworks:
```python
AssessmentQuestion.framework_mappings = [
    {
        "framework_id": "...",
        "framework_name": "Bettercoal",
        "provision_code": "P1.2",
        "provision_name": "Business Integrity"
    },
    {
        "framework_id": "...",
        "framework_name": "CGWG SAQ",
        "provision_code": "G.1.1",
        "provision_name": "Anti-Corruption"
    }
]
```

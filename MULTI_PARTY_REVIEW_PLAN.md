# Multi-Party Review Workflow Implementation Plan

## Overview
Implement EO100-style multi-party assessment review workflow with distinct roles and visibility controls.

**Inspired by:** eo100_api.eo100.models.QuestionResponse

## Roles

### 1. Operator (Supplier/Client)
- Completes self-assessment
- Uploads evidence
- Submits for review
- **Sees:** All their answers, platform feedback, assessor final score
- **Does NOT see:** Assessor private notes

### 2. Platform Reviewer (EO/Veris/Consultancy)
- Reviews operator submissions
- Provides feedback and score suggestions
- Validates evidence with AI assistance
- **Sees:** Operator answers, AI validation results
- **Does NOT see:** Assessor private notes

### 3. Assessor (Third-Party Auditor)
- Independent review
- Final scoring authority
- Private notes (not visible to operator/platform)
- **Sees:** Everything + private notes field
- **Does NOT see:** Nothing (full access)

## Data Model Changes

### AssessmentResponse Enhancement
```python
class AssessmentResponse(models.Model):
    # === Operator Fields ===
    operator_answer = models.TextField()
    operator_score = models.FloatField(null=True, blank=True)
    operator_submitted = models.BooleanField(default=False)
    operator_submitted_at = models.DateTimeField(null=True, blank=True)
    
    # === Platform Review Fields ===
    platform_review_score = models.FloatField(null=True, blank=True)
    platform_review_notes = models.TextField(blank=True, default="")
    platform_reviewed = models.BooleanField(default=False)
    platform_reviewed_at = models.DateTimeField(null=True, blank=True)
    platform_reviewer = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="platform_reviews"
    )
    
    # === Assessor Fields ===
    assessor_score = models.FloatField(null=True, blank=True)
    assessor_notes = models.TextField(blank=True, default="")
    assessor_private_notes = models.TextField(blank=True, default="")
    assessor_reviewed = models.BooleanField(default=False)
    assessor_reviewed_at = models.DateTimeField(null=True, blank=True)
    assessor = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessor_reviews"
    )
    
    # === Final Score ===
    final_score = models.FloatField(null=True, blank=True)
    # Auto-calculated: assessor_score if set, else platform_score, else operator_score
```

### Assessment Enhancement
```python
class Assessment(models.Model):
    # Workflow status
    review_stage = models.CharField(
        max_length=30,
        choices=[
            ("OPERATOR", "Operator Self-Assessment"),
            ("PLATFORM", "Platform Review"),
            ("ASSESSOR", "Assessor Review"),
            ("COMPLETED", "Completed"),
        ],
        default="OPERATOR"
    )
    
    # Due dates per stage
    operator_due_date = models.DateTimeField(null=True, blank=True)
    platform_due_date = models.DateTimeField(null=True, blank=True)
    assessor_due_date = models.DateTimeField(null=True, blank=True)
    
    # Assignment
    assigned_platform_reviewer = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_platform_reviews"
    )
    assigned_assessor = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_assessments"
    )
```

## API Endpoints

### Operator Endpoints (JWT: OPERATOR role)
```
GET    /api/assessments/{id}/my-responses/
POST   /api/assessments/{id}/responses/{question_id}/
PUT    /api/assessments/{id}/responses/{question_id}/
POST   /api/assessments/{id}/submit/  # Submit for platform review
```

### Platform Reviewer Endpoints (JWT: PLATFORM_ADMIN role)
```
GET    /api/assessments/{id}/pending-review/
GET    /api/assessments/{id}/responses/  # No private notes
PUT    /api/assessments/{id}/responses/{id}/review/
POST   /api/assessments/{id}/send-to-assessor/
```

### Assessor Endpoints (JWT: ASSESSOR role)
```
GET    /api/assessments/{id}/responses/  # Full access including private notes
PUT    /api/assessments/{id}/responses/{id}/review/
POST   /api/assessments/{id}/finalize/
```

## Workflow States

```
┌─────────────────┐
│   OPERATOR      │
│  Self-Assess    │
└────────┬────────┘
         │ Submit
         ▼
┌─────────────────┐
│   PLATFORM      │
│    Review       │
└────────┬────────┘
         │ Approve → Send to Assessor
         ▼
┌─────────────────┐
│   ASSESSOR      │
│   Final Review  │
└────────┬────────┘
         │ Finalize
         ▼
┌─────────────────┐
│   COMPLETED     │
│  (Read-only)    │
└─────────────────┘
```

## Visibility Matrix

| Field | Operator | Platform | Assessor |
|-------|----------|----------|----------|
| operator_answer | ✅ | ✅ | ✅ |
| operator_score | ✅ | ✅ | ✅ |
| platform_review_score | ✅ | ✅ | ✅ |
| platform_review_notes | ✅ | ✅ | ✅ |
| assessor_score | ✅ | ✅ | ✅ |
| assessor_notes | ✅ | ✅ | ✅ |
| assessor_private_notes | ❌ | ❌ | ✅ |
| AI validation | ✅ | ✅ | ✅ |

## Implementation Steps

### Step 1: Backend Models (3 hours)
- [ ] Add review fields to AssessmentResponse
- [ ] Add workflow fields to Assessment
- [ ] Create migrations
- [ ] Add final_score auto-calculation signal

### Step 2: Backend API (4 hours)
- [ ] Operator endpoints (answer, submit)
- [ ] Platform reviewer endpoints (review, approve)
- [ ] Assessor endpoints (full review, finalize)
- [ ] Visibility filtering middleware
- [ ] Email notifications on stage transitions

### Step 3: Frontend - Operator View (3 hours)
- [ ] Assessment questionnaire form
- [ ] Submit button (transitions to platform review)
- [ ] View platform feedback
- [ ] View final results

### Step 4: Frontend - Platform Review (3 hours)
- [ ] Pending reviews dashboard
- [ ] Review interface (side-by-side: answer + evidence + AI)
- [ ] Score input + notes
- [ ] Send to assessor action

### Step 5: Frontend - Assessor View (3 hours)
- [ ] Assigned assessments list
- [ ] Full review interface (with private notes)
- [ ] Final score input
- [ ] Finalize assessment action

### Step 6: Testing (2 hours)
- [ ] E2E: Operator submits → Platform reviews → Assessor finalizes
- [ ] Visibility tests (private notes hidden from operator/platform)
- [ ] Email notification tests
- [ ] Permission tests (role-based access)

## Email Notifications

### Operator Submits
**To:** Platform reviewer
**Subject:** Assessment Ready for Review - {Assessment Name}

### Platform Approves
**To:** Assessor
**Subject:** Assessment Ready for Final Review - {Assessment Name}

### Assessor Finalizes
**To:** Operator, Platform reviewer
**Subject:** Assessment Completed - {Assessment Name}

## RBAC Requirements

### Roles
- **OPERATOR**: Can only edit own assessments in OPERATOR stage
- **PLATFORM_ADMIN**: Can review, cannot see private notes
- **ASSESSOR**: Full access including private notes
- **SUPERADMIN**: Full access to everything

### Permissions
```python
# Example permission check
def can_view_private_notes(user, response):
    return user.role == "ASSESSOR" or user.is_superuser

def can_edit_response(user, response):
    if response.assessment.review_stage == "OPERATOR":
        return user == response.assessment.created_by
    return False

def can_submit_for_review(user, assessment):
    return user == assessment.created_by and assessment.review_stage == "OPERATOR"
```

## Scoring Logic

```python
def calculate_final_score(response):
    """
    Priority: Assessor score > Platform score > Operator score
    """
    if response.assessor_score is not None:
        return response.assessor_score
    elif response.platform_review_score is not None:
        return response.platform_review_score
    elif response.operator_score is not None:
        return response.operator_score
    return None
```

## Migration from EO100 Backend

Map legacy fields:
- `QuestionResponse.score` → `operator_score`
- `QuestionResponse.eo_score` → `platform_review_score`
- `QuestionResponse.eo_notes` → `platform_review_notes`
- `QuestionResponse.assessor_score` → `assessor_score`
- `QuestionResponse.assessor_notes` → `assessor_notes`
- `QuestionResponse.assessor_private_notes` → `assessor_private_notes`

# CGWG SAQ MVP Implementation Plan

## Overview
Build a no-login web form for CGWG Supplier Assessment Questionnaire (SAQ) with 30-day token-based access.

**Replaces:** `cgwg-backend.questionnaires` module

## Requirements
- **No authentication**: Public web form accessible via unique token URL
- **30-day expiry**: Tokens expire after 30 days (NEW - not in legacy)
- **SAQ format**: Multiple question types (Yes/No/N/A, text, integer, date, select, files)
- **Single submission**: One submission per token
- **Email notification**: Notify CGWG admins on submission
- **Legacy compatibility**: 6-char token keys (e.g., `abc123`) to match existing CGWG links

## Data Model Changes

### 1. SAQToken Model (New)
```python
class SAQToken(models.Model):
    id = UUIDField(primary_key=True)
    token = CharField(unique=True)  # URL-safe random string
    template = ForeignKey(AssessmentTemplate)  # CGWG SAQ template
    supplier_name = CharField()
    supplier_email = EmailField()
    site_name = CharField()  # Mine/site name
    
    status = CharField(choices=[PENDING, IN_PROGRESS, SUBMITTED, EXPIRED])
    expires_at = DateTimeField()
    submitted_at = DateTimeField(null=True)
    
    created_at = DateTimeField(auto_now_add=True)
```

### 2. SAQResponse Model (New)
```python
class SAQResponse(models.Model):
    id = UUIDField(primary_key=True)
    token = ForeignKey(SAQToken)
    question = ForeignKey(AssessmentQuestion)
    
    answer_choice = CharField(choices=[YES, NO, NA])  # Yes/No/N/A
    answer_text = TextField(blank=True)  # Optional explanation
    evidence_files = JSONField(default=list)  # S3 file keys
    
    submitted_at = DateTimeField(auto_now_add=True)
```

## API Endpoints

### Public (No Auth)
- `POST /api/saq/start/` - Create SAQ session (admin-only, generates token)
- `GET /api/saq/{token}/` - Get SAQ questions (token auth)
- `POST /api/saq/{token}/submit/` - Submit answers (token auth)
- `GET /api/saq/{token}/status/` - Check submission status

### Admin (JWT Auth)
- `GET /api/saq/submissions/` - List all SAQ submissions
- `GET /api/saq/submissions/{id}/` - View submission details
- `POST /api/saq/{token}/resend/` - Resend token email

## Frontend Routes

### Public (No Login)
- `/saq/{token}` - SAQ form (multi-step wizard)
- `/saq/{token}/complete` - Submission confirmation
- `/saq/expired` - Token expired message

### Admin (Authenticated)
- `/organizations/:orgId/saq` - SAQ management dashboard
- `/organizations/:orgId/saq/new` - Create new SAQ token
- `/organizations/:orgId/saq/:tokenId` - View submission

## Implementation Steps

### Step 0: Migration from CGWG Backend (4 hours)
- [ ] Export existing CGWG questionnaires to JSON
- [ ] Create `import_cgwg_questionnaires` management command
- [ ] Map legacy models:
  - `Questionnaire` → `AssessmentTemplate` + `Framework`
  - `Response` → `SAQToken`
  - `Question` → `AssessmentQuestion`
  - `Answer` → `SAQResponse`
  - `Evidence` → S3 files with `SAQResponse.evidence_files`
- [ ] Test migration on staging with production dump
- [ ] Document migration rollback procedure

### Step 1: Backend Models (2 hours)
- [ ] Create SAQToken model
- [ ] Create SAQResponse model
- [ ] Add migrations
- [ ] Add admin registration

### Step 2: Backend API (3 hours)
- [ ] Token generation service
- [ ] Token authentication middleware
- [ ] SAQ start endpoint (admin)
- [ ] SAQ questions endpoint (public)
- [ ] SAQ submit endpoint (public)
- [ ] Email notification service

### Step 3: Frontend Public Form (4 hours)
- [ ] SAQ form layout (multi-step)
- [ ] Yes/No/N/A radio buttons
- [ ] Optional text area
- [ ] File upload component
- [ ] Progress indicator
- [ ] Submit confirmation
- [ ] Expired token page

### Step 4: Frontend Admin Dashboard (3 hours)
- [ ] SAQ list view (table with status)
- [ ] Create SAQ modal/form
- [ ] SAQ detail view (read submission)
- [ ] Resend token action
- [ ] Export to CSV/PDF

### Step 5: Testing & Deployment (2 hours)
- [ ] Unit tests for token expiry
- [ ] E2E test: create token → fill form → submit
- [ ] Deploy to staging
- [ ] Test email delivery

## File Structure
```
backend/
  assessments/
    models.py (add SAQToken, SAQResponse)
    serializers/
      __init__.py (add SAQTokenSerializer, SAQResponseSerializer)
    views/
      saq.py (new file - public SAQ endpoints)
    services/
      saq_token.py (new file - token generation, validation)
    migrations/
      0017_saqtoken_saqresponse.py

frontend/
  app/
    routes/
      saq.$token.tsx (public form)
      saq.$token.complete.tsx (confirmation)
      saq.expired.tsx (expired message)
      organizations.$orgId.saq.tsx (admin list)
      organizations.$orgId.saq.new.tsx (create)
      organizations.$orgId.saq.$tokenId.tsx (detail)
```

## Security Considerations
- Token must be URL-safe (use base64url or hex)
- Rate limiting on submit endpoint
- File upload validation (type, size limits)
- CORS for public endpoints
- HTTPS required for token URLs

## Email Template
Subject: CGWG Supplier Assessment Questionnaire - Action Required

Body:
Dear [Supplier Name],

You have been invited to complete the CGWG Supplier Assessment Questionnaire.

Access your questionnaire: https://veris.platform/saq/[TOKEN]

This link will expire on [EXPIRY_DATE] (30 days from issue).

The questionnaire takes approximately 30-45 minutes to complete.

Questions? Contact CGWG at [EMAIL]

---
Coloured Gemstone Working Group

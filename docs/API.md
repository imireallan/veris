# Veris - API Reference

## Overview

The API consists of two services:

1. **Django Core API**: Handles CRUD operations for organizations, users, assessments, and knowledge management
2. **FastAPI AI Service**: Handles AI operations including chat, RAG pipeline, and report generation

### Service Ports (Local Development)

- Django API: `http://localhost:8001`
- FastAPI AI Service: `http://localhost:8000`

---

## Authentication

All API calls require authentication via Bearer token:

```
Authorization: Bearer <user_token>
```

Multi-tenant context is handled via:
- JWT contains `organization_id` and `role`
- All queries are automatically scoped to user's organization

---

## Django Core API Endpoints

### Health Check
```
GET /health/
Response: { "status": "healthy" }
```

### Organizations
```
GET /api/organizations/              # List accessible organizations
GET /api/organizations/{id}/         # Organization details
PUT /api/organizations/{id}/         # Update organization settings
```

### Themes
```
GET /api/themes/                     # List themes
GET /api/themes/{org_id}/            # Get organization theme
POST /api/themes/                    # Create/update theme
PUT /api/themes/{id}/                # Update theme settings
```

### Users
```
GET /api/users/                      # List users in organization
GET /api/users/{id}/                 # User details
PUT /api/users/{id}/                 # Update user
DELETE /api/users/{id}/              # Deactivate user
```

### Assessments
```
GET /api/assessments/                # List assessments
POST /api/assessments/               # Create assessment
GET /api/assessments/{id}/           # Get assessment details
PUT /api/assessments/{id}/           # Update assessment
POST /api/assessments/{id}/submit/   # Submit for review
POST /api/assessments/{id}/complete/ # Complete assessment
```

### Question Templates
```
GET /api/templates/                  # List templates
GET /api/templates/{id}/             # Template details with questions
POST /api/templates/                 # Create template
PUT /api/templates/{id}/             # Update template
```

### Responses
```
GET /api/assessments/{id}/responses/ # Get all responses
POST /api/responses/                 # Submit response
PUT /api/responses/{id}/             # Update response
```

### Knowledge Documents
```
GET /api/documents/                  # List documents
POST /api/documents/upload/          # Upload document
GET /api/documents/{id}/             # Document details
DELETE /api/documents/{id}/          # Remove document
POST /api/documents/{id}/embed/      # Trigger embedding process
```

### Tasks
```
GET /api/tasks/                      # List tasks (filtered by user role)
POST /api/tasks/                     # Create task
PUT /api/tasks/{id}/                 # Update task status
```

---

## FastAPI AI Service Endpoints

### Health
```
GET /health
Response: { "status": "healthy" }
```

### Chat
```
POST /chat
Request Body:
{
  "query": "What are the key requirements for Principle 3?",
  "organization_id": "uuid",
  "context": {
    "assessment_id": "uuid",        # Optional, for context-aware responses
    "conversation_history": [...]    # Previous messages
  }
}

Response:
{
  "answer": "Based on the knowledge base...",
  "sources": [
    {
      "document_id": "uuid",
      "document_title": "ESG Certification Standard Standard v2023",
      "relevance_score": 0.89,
      "page_content": "..."
    }
  ],
  "confidence": 0.92
}
```

### Report Generation
```
POST /reports/generate
Request Body:
{
  "assessment_id": "uuid",
  "report_type": "executive_summary|full_report|gap_analysis",
  "target_audience": "executives|operational|regulatory"
}

Response:
{
  "task_id": "uuid",
  "status": "processing",
  "estimated_completion_seconds": 45
}
```

```
GET /reports/{task_id}/status
Response:
{
  "task_id": "uuid",
  "status": "completed",
  "report_url": "https://s3...",
  "sections": ["Executive Summary", "Compliance Status", "Recommendations"]
}
```

### Embedding Pipeline
```
POST /embed/document
Request Body:
{
  "document_id": "uuid",
  "chunk_size": 500,              # Optional
  "overlap": 50                   # Optional
}

Response:
{
  "status": "started",
  "document_id": "uuid",
  "estimated_chunks": 45
}
```

### Gap Analysis
```
POST /analysis/gap
Request Body:
{
  "assessment_id": "uuid",
  "benchmark": "industry_standard|internal_target"
}

Response:
{
  "gaps": [
    {
      "category": "Environmental Water Usage",
      "severity": "HIGH",
      "description": "Water management plan not documented",
      "recommendation": "Develop comprehensive water usage documentation",
      "related_questions": ["q123", "q124"]
    }
  ],
  "overall_compliance_percentage": 73.5
}
```

---

## Thieming API Contract

### Theme Object
```json
{
  "colors": {
    "primary": "#2D5A7B",
    "secondary": "#8FAABF",
    "accent": "#E88D67",
    "background": "#FAFAFA",
    "text": "#1A1A1A"
  },
  "typography": {
    "font_family": "Inter, system-ui",
    "heading_weight": 600,
    "body_weight": 400
  },
  "components": {
    "button_radius": 8,
    "card_shadow": "0 4px 6px rgba(0,0,0,0.1)"
  },
  "branding": {
    "logo_url": "https://...",
    "favicon_url": "https://..."
  }
}
```

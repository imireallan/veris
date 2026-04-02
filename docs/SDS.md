# SustainabilityAI - System Design Specification

## Data Models (PostgreSQL)

### 1. Organization Model (Tenant)
Primary model for white-label customization and data isolation.

- id: UUID (Primary Key)
- name: String
- slug: String (Unique, URL-friendly identifier)
- status: Enum — ACTIVE, SUSPENDED, TRIAL
- subscription_tier: Enum — FREE, STANDARD, ENTERPRISE
- custom_domain: String (Optional, for white-label)
- created_at: Timestamp
- updated_at: Timestamp

### 2. Theme Model
Stores all customization settings per organization.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- primary_color: String (HEX)
- secondary_color: String (HEX)
- accent_color: String (HEX)
- background_color: String (HEX)
- text_color: String (HEX)
- logo_url: String
- favicon_url: String
- font_family: String
- button_radius: Float
- custom_css: Text (Optional, for advanced customization)
- created_at: Timestamp
- updated_at: Timestamp

### 3. User Model
Handles authentication with organization context.

- id: UUID (Primary Key)
- email: String (Unique)
- name: String
- organization_id: UUID (Foreign Key)
- role: Enum — ADMIN, COORDINATOR, OPERATOR, EXECUTIVE, ASSESSOR, CONSULTANT
- status: Enum — ACTIVE, PENDING, DEACTIVATED
- timezone: String
- created_at: Timestamp
- updated_at: Timestamp

### 4. Knowledge Document Model
Stores uploaded sustainability documents for the RAG pipeline.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- title: String
- description: Text
- file_url: String
- file_type: String (PDF, DOCX, TXT, etc.)
- file_size: Integer
- category: String (Standard, Policy, Procedure, Guideline, etc.)
- embeddings_indexed: Boolean
- chunk_count: Integer
- vector_ids: JSONB (List of Pinecone vector IDs)
- created_by: UUID (Foreign Key → User)
- created_at: Timestamp
- updated_at: Timestamp

### 5. Assessment Model
Core entity for sustainability assessments.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- site_id: UUID (Foreign Key, Optional)
- template_id: UUID (Foreign Key)
- status: Enum — DRAFT, IN_PROGRESS, UNDER_REVIEW, COMPLETED, ARCHIVED
- framework: Enum — EO100, BETTERCOAL, ESG, CUSTOM
- start_date: Timestamp
- due_date: Timestamp
- completed_at: Timestamp
- overall_score: Float (0-100)
- risk_level: Enum — LOW, MEDIUM, HIGH, CRITICAL
- ai_summary: Text (AI-generated assessment summary)
- created_by: UUID (Foreign Key → User)
- assigned_to: UUID (Foreign Key → User, Optional)
- created_at: Timestamp
- updated_at: Timestamp

### 6. Questionnaire Template Model
Flexible question templates for different frameworks.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- name: String
- framework: String
- version: String
- description: Text
- total_questions: Integer
- scoring_method: Enum — BINARY, LIKERT, WEIGHTED
- is_public: Boolean
- created_at: Timestamp
- updated_at: Timestamp

### 7. Question Model
Individual questions within templates.

- id: UUID (Primary Key)
- template_id: UUID (Foreign Key)
- section: String
- question_text: Text
- question_type: Enum — TEXT, MULTIPLE_CHOICE, RATING, FILE_UPLOAD, NUMERIC
- required: Boolean
- weight: Float (For weighted scoring)
- ai_guidance_text: Text (Tips/context for AI to provide)
- evidence_required: Boolean
- created_at: Timestamp
- updated_at: Timestamp

### 8. Response Model
User responses to assessment questions.

- id: UUID (Primary Key)
- assessment_id: UUID (Foreign Key)
- question_id: UUID (Foreign Key)
- answer_text: Text
- answer_score: Float
- evidence_files: JSONB (Array of file URLs)
- ai_score_suggestion: Float (AI's suggested score based on answer)
- ai_feedback: Text (AI's feedback on the response)
- created_by: UUID (Foreign Key → User)
- created_at: Timestamp
- updated_at: Timestamp

### 9. AI Insight Model
Separates detailed AI reasoning for performance.

- id: UUID (Primary Key)
- assessment_id: UUID (Foreign Key)
- response_id: UUID (Foreign Key, Optional)
- insight_type: Enum — GAP_ANALYSIS, RECOMMENDATION, RISK_FLAG, SUMMARY
- insight_text: Text
- confidence_score: Float (0-1)
- source_documents: JSONB (Array of vector IDs used for RAG)
- created_at: Timestamp

### 10. Task Model
Continuous improvement tracking.

- id: UUID (Primary Key)
- assessment_id: UUID (Foreign Key)
- title: String
- description: Text
- priority: Enum — LOW, MEDIUM, HIGH, URGENCY
- status: Enum — PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- assigned_to: UUID (Foreign Key → User)
- due_date: Timestamp (Optional)
- completed_at: Timestamp (Optional)
- created_at: Timestamp
- updated_at: Timestamp

---

## Architecture Components

### Service Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Remix/React)                      │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ auth/    │ │ routes/  │ │ routes/  │ │ routes/knowledge/  │ │
│  │ login    │ │ dashboard│ │ assessments│ │ chat.tsx           │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ routes/  │ │ routes/  │ │ models/  │ │ components/        │ │
│  │ settings │ │ reports  │ │ api      │ │ ThemeProvider      │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Django + FastAPI)                    │
│                                                                 │
│  Django Core (CRUD, Auth, Multi-tenant)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │orgs/     │ │users/    │ │ assess-  │ │ knowledge/         │ │
│  │models    │ │models    │ │ ments/   │ │ models             │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
│                                                                 │
│  FastAPI AI Service                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │chat/     │ │rag/      │ │report/   │ │vector/             │ │
│  │chat.py   │ │pipeline  │ │generate  │ │embed               │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure                                │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │Postgres  │ │Pinecone  │ │S3/B2     │ │Redis (Cache)       │ │
│  │Database  │ │Vector DB │ │Storage   │ │Session/Queue       │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Contract (React Router v7)

### Loader Pattern
- All data fetching happens in route loaders
- AI service calls pre-fetch analysis before component render
- Theme settings loaded at root level for global application
- Knowledge base context pre-loaded for chat interface

### Action Pattern
- Form submissions handled via actions
- Assessment state mutations (complete, submit, review)
- File uploads with progress tracking
- User profile and settings updates

### Route Structure
```
├── root.tsx                    # Layout, theme provider, auth
├── routes/
│   ├── index.tsx               # Dashboard (role-based)
│   ├── login.tsx
│   ├── logout.tsx
│   ├── settings/
│   │   ├── profile.tsx
│   │   └── theme.tsx           # Theme customization
│   ├── assessments/
│   │   ├── index.tsx           # Assessment list
│   │   ├── $id.tsx             # Single assessment
│   │   └── $id/
│   │       └── questionnaire.tsx
│   ├── knowledge/
│   │   ├── index.tsx           # Document library
│   │   ├── upload.tsx
│   │   └── chat.tsx            # AI chat interface
│   ├── reports/
│   │   ├── index.tsx           # Report dashboard
│   │   └── generate.tsx        # AI report generation
│   ├── tasks/
│   │   └── index.tsx           # Task management
│   └── admin/
│       ├── users.tsx
│       ├── templates.tsx
│       └── organization.tsx    # Tenant settings
```

---

## AI Pipeline Architecture

```
Document Upload ──► Chunk ──► Embed ──► Pinecone
                                          │
User Query ──► Embed Query ──► Retrieve ──┘
                     │
                     ▼
               Context Window
                     │
                     ▼
               LLM Generate
                     │
                     ▼
            Structured Response
```

### Key Design Principles
1. **AI as Module, Not Monolith**: Separated from business logic
2. **Provider Agnostic**: Easy swap between OpenAI/Groq/etc.
3. **Structured Outputs**: Always return typed JSON schemas
4. **Traceability**: All AI responses cite source documents
5. **Fallback**: Graceful degradation when AI is unavailable

# Veris - System Design Specification

### Data Models (PostgreSQL)

See `docs/ESG_FRAMEWORK_MODELS.md` for the complete model definitions based on real-world ESG data. This section gives a high-level view:

### Core Entity Hierarchy

```
Organization (Tenant)
├── Theme Configuration
├── Users (with roles)
├── ESG Focus Areas (6 per org: Ethics, Emissions, Assets, Rights, Community, Talent)
│   ├── Framework Mappings (ESG Certification Standard, MSCI, ISS, Sustainalytics)
│   ├── Assessment Responses
│   └── AI Insights & Recommendations
├── Assessments
│   ├── Questionnaire Responses
│   ├── Evidence Files
│   ├── Tasks/Actions
│   └── Generated Reports
├── Knowledge Documents (RAG pipeline)
├── Sites/Locations
└── External Ratings (MSCI, ISS, Sustainalytics scores tracked over time)
```

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

### 4. ESG Focus Area Model
The organizing unit for company's ESG program. Modeled on Major Energy Operator' 6 areas.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- name: String (Ethics, Low Emissions, Retirement of Assets, Rights, Community Relations, Talent Attraction)
- internal_label: String (ethics, low_emissions, retirement_of_assets, rights, community_relations, talent_attraction)
- owner_id: UUID (Foreign Key → User)
- description: Text
- current_score: Float
- trend: Enum — UP, DOWN, STABLE, INSUFFICIENT_DATA
- last_assessed: Timestamp
- ai_risk_level: Enum — LOW, MEDIUM, HIGH
- framework_mappings: JSONB (Maps to ESG Certification Standard, MSCI, ISS, Sustainalytics categories)
- ai_gaps: JSONB (AI-identified gaps)
- ai_recommendations: JSONB
- created_at: Timestamp
- updated_at: Timestamp

### 5. Framework Registry Model
Tracks external ESG frameworks and their structure.

- id: UUID (Primary Key)
- name: String (ESG Certification Standard, MSCI, Sustainalytics, ISS, BETTERCOAL)
- version: String
- description: Text
- categories: JSONB (Their category/pillar structure)
- scoring_methodology: JSONB (How they calculate scores)
- reporting_period: String
- last_synced: Timestamp

### 6. External Rating Model
Tracks scores from external rating agencies over time.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- agency: Enum (MSCI, SUSTAINALYTICS, ISS, EQUIABLE_ORIGIN)
- score: Float
- score_date: Date
- category_scores: JSONB ({Environment: 8, Social: 7, Governance: 1})
- rating_grade: String (AAA, AA, A, etc.)
- trend_vs_previous: Float
- ai_analysis: Text
- created_at: Timestamp

### 7. Knowledge Document Model
Stores uploaded sustainability documents for the RAG pipeline.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- title: String
- description: Text
- file_url: String
- file_type: String (PDF, DOCX, TXT, etc.)
- file_size: Integer
- category: String (Standard, Policy, Procedure, Guideline, Report, Rating)
- embeddings_indexed: Boolean
- chunk_count: Integer
- vector_ids: JSONB (List of Pinecone vector IDs)
- framework_tags: JSONB[] (Which frameworks this document relates to)
- created_by: UUID (Foreign Key → User)
- created_at: Timestamp
- updated_at: Timestamp

### 8. Assessment Model
Core entity for sustainability assessments.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- site_id: UUID (Foreign Key, Optional)
- template_id: UUID (Foreign Key)
- focus_area_id: UUID (Foreign Key, Optional — can span multiple areas)
- status: Enum — DRAFT, IN_PROGRESS, UNDER_REVIEW, COMPLETED, ARCHIVED
- framework_id: UUID (Foreign Key)
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

### 9. Assessment Response Model
Answers to assessment questions with AI enrichment.

- id: UUID (Primary Key)
- assessment_id: UUID (Foreign Key)
- focus_area_id: UUID (Foreign Key)
- question_id: UUID (Foreign Key)
- answer_text: Text
- answer_score: Float
- evidence_files: JSONB (Array of file URLs)
- ai_score_suggestion: Float (AI's suggested score based on answer)
- ai_feedback: Text (AI's feedback on the response)
- ai_validated: Boolean (AI cross-checked for consistency)
- frameworks_mapped_to: JSONB[] (Auto-mapped to other frameworks)
- created_by: UUID (Foreign Key → User)
- created_at: Timestamp
- updated_at: Timestamp

### 10. AI Insight Model
Separates detailed AI reasoning for performance.

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- assessment_id: UUID (Foreign Key)
- response_id: UUID (Foreign Key, Optional)
- focus_area_id: UUID (Foreign Key)
- insight_type: Enum — GAP_ANALYSIS, RECOMMENDATION, RISK_FLAG, CROSS_FRAMEWAY, SUMMARY
- insight_text: Text
- confidence_score: Float (0-1)
- source_documents: JSONB (Array of vector IDs used for RAG)
- action_required: Boolean
- created_at: Timestamp
- updated_at: Timestamp

### 11. Task Model (Continuous Improvement)
Tracks improvement actions from assessments.

- id: UUID (Primary Key)
- assessment_id: UUID (Foreign Key)
- organization_id: UUID (Foreign Key)
- focus_area_id: UUID (Foreign Key)
- title: String
- description: Text
- priority: Enum — LOW, MEDIUM, HIGH, CRITICAL
- status: Enum — PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- assigned_to: UUID (Foreign Key → User)
- due_date: Timestamp (Optional)
- completed_at: Timestamp (Optional)
- ai_nudged: Boolean (AI has sent reminders)
- created_at: Timestamp
- updated_at: Timestamp

### 12. Site Model
Physical locations being assessed (operations sites, offices, mine sites, etc.)

- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key)
- name: String
- type: Enum — OPERATION, MINE, OFFICE, FACILITY
- country_code: String
- region: String
- coordinates: JSONB (lat, long)
- operational_status: Enum — ACTIVE, DECOMMISSIONED, PLANNED
- certifications: JSONB[] (ESG Certification Standard certified, ISO 14001, etc.)
- description: Text
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

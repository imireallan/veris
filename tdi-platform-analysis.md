# TDi Platform Ecosystem

## Company Context

TDi builds **certification and assurance platforms** for sustainability standards across extractive industries. Multiple clients/standards share similar domain patterns — questionnaires, assessments, findings, continuous improvement plans, and reports.

---

# 1. Bettercoal

**Path:** `/Users/allanimire/projects/TDi/bettercoal`

## Overview
A Django monolith for managing environmental/social compliance assessments in the **coal mining industry**. Multi-stakeholder workflow: mining companies ("suppliers/producers") get assessed by independent assessors, with oversight from member companies and a secretariat.

## Tech Stack
| Layer | Tech |
|---|---|
| Backend | Django 3.x (Python 3.9) |
| Frontend | Jinja2 templates + CSS/Sass + Vanilla JS |
| Database | PostgreSQL |
| Server | Gunicorn, Docker Compose (dev), Helm/K8s (prod) |
| Other | CKEditor, django-two-factor-auth, SOPS, django-actstream |

## Core Entities

| Entity | Purpose |
|---|---|
| AssuranceProcess | Central workflow instance linking everything together |
| SupplierOrganisation | Mining company being assessed |
| MineSite | Individual mine location with detailed ops/environmental data |
| AssessmentReport | Site-assessment report with findings per provision |
| CIP (Continuous Improvement Plan) | Tracks findings and remediation over time |
| CIPCode | Versioned framework: Principles > Categories > Provisions |
| SupplierQuestionnaire | Virtual model linking categories to mine sites |

## User Roles
1. **Secretariat** — Platform admin/superuser
2. **Supplier** — Mining company staff (Coordinator + Team Members)
3. **Assessor** — Lead + Team assessors who conduct assessments
4. **Member** — Bettercoal member companies, view-only access to assigned processes

## Main Workflow (4 Phases)

### Phase 1: Producer Commitment
- Secretariat invites supplier
- Supplier signs Letter of Commitment (LOC) + Commitment Agreement (CA)

### Phase 2: Desktop Review
- Supplier submits operations info (mine sites, certs, safety stats, environmental data)
- Secretariat assigns lead assessor
- Lead assessor defines site assessment scope
- Supplier completes questionnaire (Yes/No/N/A per provision)
- Lead assessor uploads assessment plan

### Phase 3: Site-Assessment
- Assessors draft Site-Assessment Report (rate each provision: Meets / Substantially Meets / Partially Meets / Misses)
- Supplier reviews and comments
- Assessors incorporate feedback
- Secretariat approves draft
- Lead assessor finalizes report

### Phase 4: Continuous Improvement Plan (CIP)
- Assessors set deadlines for findings
- Supplier assigns responsible parties
- CIP finalized → creates monitoring cycles (1/3/6/9/12/15/18 months)
- Each cycle: evidence upload → review → submit → deadline reminders

## Key Architectural Patterns

### ActionGraph (Custom Workflow Engine)
Frozen dataclass-based state machine:
- **Action** — Individual step with prerequisite chains, role-based ACL (access/edit/submit), email config
- **ActionGroup** — Groups actions into phases
- **ActionGraph** — Top-level container, copied per-request with user role + completed actions

### ActionableModel
Abstract base giving any model action tracking (django-actstream) and deadline management.

### Document Management
GenericForeignKey-based — files attach to any model (provisions, findings, reports, signed docs).

### Deadline & Reminder System
- ActionDeadline tied to ActionGraph actions via identifier
- Auto-creates ActionDeadlineReminder based on days_ahead config
- Cron job sends emails for reminders due today
- Reminders auto-invalidated when action completes

## Django Apps
| App | Purpose |
|---|---|
| assurance_process/ | Core process, invitations, ops info, action graph |
| supplier_questionnaire/ | Questionnaire submission and responses |
| assessment_planning/ | Assessment plan document upload |
| assessment_report/ | Site assessment drafting, review, findings |
| cip/ | Continuous Improvement Plan with monitoring cycles |
| cip_code/ | Versioned CIP provisions/principles framework |
| users/ | Custom user model with profile types |
| common/ | Shared models (Document, ActionableModel) |
| deadlines/ | ActionDeadline + ActionDeadlineReminder + cron |
| notifications/ | Email notifications and in-app alerts |
| dashboard/ | Dashboard views |

## Known Issues (from issues.md)
- Can't open new process if supplier has no coordinator
- Using existing supplier fails: "Supplier not invited. Fix the errors on the form"
- Monitoring tab (`cip/{id}/monitoring`) returns 403
- Name doesn't wrap on assurance process listing (pushes status bar out of frame)
- Status bar pop-ups push out of frame
- "Is the mine site in Indigenous territories?" question is repeated

---

# 2. EO100 Frontend

**Path:** `/Users/allanimire/projects/TDi/frontend`

## Overview
Certification management platform for the **EO100 Standard for Responsible Energy Development** (by Equitable Origin). Manages the full certification lifecycle for energy industry "Certifiable Units" (CUs).

## Tech Stack
| Layer | Tech |
|---|---|
| Framework | Remix 1.18.1 (classic file-based routing, pre-v2) |
| Language | TypeScript 4.8.4 |
| UI | React 18.2, TailwindCSS 3.2 (fully custom palette) |
| Components | @headlessui/react, @heroicons/react, @material-tailwind/react |
| State | Remix loaders/actions (no global state lib), react-query (minimal) |
| Forms | Custom form utilities |
| Tables | @tanstack/react-table 8.x + legacy react-table 7.x |
| Testing | Jest 29 + Testing Library |
| Linting | ESLint + Prettier + husky |

## Project Structure
```
frontend/
  app/
    api.server.ts          # Server-side fetch wrapper with error handling
    api.ts                 # Client-side API calls (uses window.ENV)
    actions.ts             # Shared action handlers (signup, upload)
    root.tsx               # Root layout, loader, auth, global HTML shell
    session.server.ts      # Cookie session management, auth helpers
    constants/             # Objectives, principles, doc types
    models/                # Server-side API model layer
      types.ts             # Shared TS interfaces (User, UserRole, Token)
    routes/                # 60+ file-based Remix route files
    components/            # ~75 reusable UI component directories
    customHooks/           # Custom React hooks
    types/index.ts         # Type definitions (CertificationProcess, SAQ, etc.)
    utils/                 # Utility functions, form helpers, data transforms
```

## Core Features
- **Login** — Email/password, password reset, logout
- **Certification Process Dashboard** — Lists all CUs, search, role-based "Add new"
- **Certification Process Detail** (`/certification-process/:slug`) — 6-stage workflow:
  1. Due Diligence (document upload, DD check approval)
  2. Self-Assessment (SAQ by principle/objective/question, scoring, comments, submission)
  3. Assessment (body selection, assessor assignment, agenda, report drafting, review, final submission)
  4. Peer Review (reviewer selection, report generation, verification)
  5. CIP (performance targets with CRUD)
  6. Certification (assessment report, summary, certification documents)
- **Team Management** — CU Team, Assessment Body team
- **Documents** — Central document management
- **Signup Flows** — Tokenized invites for Team, Operator, Assessor, Assessment Body, Peer Reviewer
- **Profile/Account** — Switch role, notifications, personal info, org info

## Backend Connection
- **Two-tier API**: Server-side `fetchData()` with Knox tokens → Django REST API. Client-side uses `window.ENV.SITE_URL`.
- **Backend API patterns**:
  - `auth/login/`, `auth/logout/` — Authentication
  - `user/`, `user/:id`, `user/roles/change/:roleId/` — User management
  - `user/signup/:inviteToken/` — Token-based signup
  - `eo100/certification-processes/` — List processes
  - `eo100/certification-process/:id/saq/` — SAQ questionnaire
  - `eo100/certification-process/:id/assessment-team/` — Assessor team
  - `core/file-upload/` — Generic file upload

## State Management
- **No global state library**. Relies on Remix core primitives:
  - Loaders for server-side data fetching per route
  - Actions for server-side form submissions
  - Outlet Context for passing data down route hierarchies
  - Cookie sessions for auth tokens and flash messages (7-day expiry)

## Styling
- TailwindCSS with completely custom design system (no default palette)
- Custom color scales (orange, blue, gray, red, yellow, green) with 0/25/50/75/100 naming
- Custom font (Inter, Palatino), custom spacing, custom font sizes
- class-variance-authority + clsx + tailwind-merge for composable classes

## Known Issues & TODOs
- API inconsistency: `certification-processes/` vs `certification-process/` (singular vs plural)
- `inviteCULead` duplicates `inviteUser` with swallowed errors
- Multiple `ENV.SITE_URL` and `process.env.SITE_URL` usage mixed
- Both react-table 7.x AND @tanstack/react-table 8.x installed
- Remix v1 with `v2_dev` future flag only — not fully migrated to v2
- Several "TODO: after api is complete" comments in components

---

# 3. EO100 Backend

**Path:** `/Users/allanimire/projects/TDi/backend`

## Overview
Django REST API powering the EO100 certification platform. API-only (no HTML templates), versioned serializer system, Helm/K8s deployment.

## Tech Stack
| Layer | Tech |
|---|---|
| Python | 3.11, Django 4.1.4, DRF 3.14.0 |
| Auth | django-rest-knox (token-based, BasicAuth for login) |
| Database | PostgreSQL via psycopg2 |
| PDF | WeasyPrint |
| Excel | openpyxl (SAQ spreadsheet upload/parse) |
| Storage | Local FS or AWS S3 (django-storages + boto3) |
| Static | whitenoise |
| Monitoring | sentry-sdk (opt-in) |
| Package mgmt | pipenv |
| Secrets | SOPS |
| CI/CD | GitLab CI |

## Project Structure
```
backend/
  config/
    settings/              # Split settings (django, cors, storage, sentry, etc.)
    containers.py          # Dependency injection container
    serializer_map.py      # Versioned serializer registry (40+ endpoints)
    urls.py                # Root URL routing
  eo100_api/
    core/                  # Shared utilities (BaseModel, versioning, file services)
    eo100/                 # Core business domain
      models.py            # CertificationProcess, QuestionResponse, AssessmentReport, etc.
      views.py             # ~60 views for SAQ, assessment, certification
      services/            # Permission checks, notifications, cert_process
      repositories/        # Cert process repo, QA repo, SAQ repo, PDF generator
      view_serializers/    # Per-endpoint serializers
    user/                  # User management
      models.py            # User (ArrayField roles), Company, UserInvite, PasswordReset, Notification
      views.py             # Signup, login, password reset, role change, notifications
      services/            # User CRUD, signup, invite resolution
      repositories/        # User repo, notification repo
    auth/                  # Knox login/logout
    health_check/          # Health check endpoint
    services/              # Shared services (emailer, id generation, slugify, serializers)
  docs/                    # Developer documentation
  charts/eo100-api/        # Helm charts for K8s
```

## Core Models

### User System
- **Company** — type, name, HQ address, timezone, main contact. Uniqueness on (type, name).
- **User** — email (unique), roles (ArrayField of RoleId), active_role, validated, position, phone, company (FK), image, cv, area_of_expertise, assessment_body (FK), assigned_principles (ArrayField), invited_by (UUID)
- **UserInvite** — expire_days, token
- **PasswordReset** — reset_time_utc, expire_minutes, token
- **Notification** — subject, message, sender (FK User), recipient (FK User), seen

### EO100 Domain
- **CertifiableUnit** — name, type (ArrayField of int)
- **CertificationProcess** — FK to CertifiableUnit, operator, assessment_body, peer_reviewer, dd_document, agenda, assessment_report. ManyToMany for cu_team, assessment_team, continuous_improvement_plan. Boolean flags for due_diligence_check, saq_complete_status, peer_review_complete.
- **QuestionDefinition** — supplement, principle, objective, text, performance_target, description. Text PK with format "S.P.O.Q"
- **QuestionResponse** — definition (FK), process (FK), score, answer, documents (M2M), submitted, eo_notes, eo_score, eo_reviewed, assessor_notes, assessor_score, assessor_reviewed, assessor_private_notes
- **QuestionComment** — question (FK), user (FK), text
- **AssessmentReport** — Complex multi-section: logo, title, summary, stakeholders, doc review, interview, investigations text fields. ManyToMany for assessors, appendix sections.
- **CipTarget** — principle, ref, findings, recommended_action, timeframe, responsibility, internal_due_date, verification_method, status, assessor_review, eo_approval
- **AssessmentAgenda** — approved, document (FK), start_date, end_date
- **UploadedFile** — file (FileField), name

## API Endpoints

### User Endpoints (`/api/user/`)
- `PUT /` — Invite a user (requires permission)
- `GET/PUT signup/<token>/` — Token-based signup flow
- `PUT password-reset-request/` — Request password reset
- `POST password-reset/<token>/` — Complete password reset
- `GET/PUT/DELETE <user_id>/` — Specific user CRUD
- `PUT roles/change/<role_id>/` — Switch active role
- `PUT reinvite/<user_id>/` — Re-expire and resend invite
- `GET/PUT notifications/` — User notifications
- `GET all/` — List all users (permission-gated)
- `GET asm-body/<name>/` — Users in assessment body

### EO100 Endpoints (`/api/eo100/`)
- `PUT certifiable-unit/` — Create certifiable unit + process
- `GET/PUT/POST/DELETE certification-process/<id>/` — Process CRUD, team management
- `GET certification-processes/` — List processes (role-filtered)
- `POST/DELETE certification-process/<id>/assessment-team/` — Assessor team management
- `PUT due-diligence-check/<id>/` — Approve/reject DD
- `POST/DELETE dd-doc/<id>/` — Due diligence document upload
- `GET/PUT saq/` — SAQ retrieval
- `GET/PUT saq-question/` — Individual SAQ question
- `POST saq-question-comment/` — Comment on SAQ response
- `POST certification-process/<id>/submit-saq/` — Submit SAQ for EO review
- PDF download endpoints for assessment report, summary report, certificate

### Auth Endpoints (`/api/auth/`)
- `POST login/` — BasicAuth → Knox token
- `POST logout/` — Delete token

### Core Endpoints (`/api/core/`)
- `POST file-upload/` — File upload
- `GET <file_id>/` — File download (returns NOT_IMPLEMENTED — not completed)

## Authentication & Authorization
- **Auth**: Knox token via BasicAuth login
- **Roles**: EO_SECRETARIAT, OPERATOR, CERTIFIABLE_UNIT, CERTIFIABLE_UNIT_LEAD, ASSESSOR, ASSESSOR_LEAD, ASSESSMENT_BODY, PEER_REVIEWER
- **Multi-role**: ArrayField + active_role switching
- **Permissions**: Role-based permission checks in service layer (check_add_member_permission, check_assessor_permission, check_is_admin_or_eo, etc.)
- **Signup**: Token-based invites. 7-day token expiry. Each role has distinct signup URL.

## Serialization Pattern
Custom versioned serializer lookup system (`config/serializer_map.py` + `services/serializers/lookup.py`). Serializers keyed by view name + HTTP method + semantic version. Dependency injection container (`config/containers.py`) wires everything together. Responses include a `Version` header.

## Testing
- pytest + pytest-django + pytest-env
- factory-boy for test data
- `@pytest.mark.isolated` (no DB) and `@pytest.mark.integrated` (requires PostgreSQL)
- Tests for: health check, emailer, user services, SAQ, notification repo, user repo, ID hashing/slugify

## Deployment
- GitLab CI: code checks → Docker build/push → QA deploy → Prod deploy
- Helm charts with values-production.yaml, values-qa.yaml, values.yaml
- SOPS-encrypted secrets (secrets.qa.yaml, secrets.production.yaml)
- K8s: Deployment, service, ingress, network policies, secrets, DB migration job, annual notification cron job

## Known Issues
- `FileView.get()` returns HTTPStatus.NOT_IMPLEMENTED — download not implemented
- `ALLOWED_HOSTS = ["*"]` — relies on proxy/ingress for host validation
- serializer_map.py is 388 lines and manually maps every endpoint/HTTP method/version — error-prone
- Image/CV fields have comments: `# change to S3`
- Missing view_serializers for some endpoints
- Legacy data migration script exists (data/legacy.sh)

---

# 4. Veris

**Path:** `/Users/allanimire/projects/Veris`

## Overview
AI-first, multi-industry certification and assessment platform. Built to be generic enough to serve TDi clients across different sectors (coal mining, energy, agriculture, etc.). **Currently in early development.**

## Tech Stack
| Layer | Tech |
|---|---|
| Backend | Django 5.1 + DRF 3.15 |
| Frontend | React Router v7 (Remix-style) + TypeScript |
| AI Engine | FastAPI (skeleton) |
| Database | PostgreSQL 16 |
| Styling | TailwindCSS 3.x, custom UI components (no Radix/CVA deps) |
| Deploy | Docker Compose (4 services: frontend, backend, ai_engine, db) |

## Project Structure
```
Veris/
  docker-compose.yml          # 4 services: frontend, backend, ai_engine, db
  backend/
    config/settings/          # Split settings (base, development, production, testing)
    config/urls.py            # DRF DefaultRouter
    organizations/            # Multi-tenant orgs
    users/                    # Custom auth (JWT, email as USERNAME_FIELD)
    themes/                   # White-label theming (1-1 with Organization)
    assessments/              # CORE domain (12 models)
    knowledge/                # RAG pipeline support
    settings/                 # Django HTML admin views (NOT part of SPA)
  frontend/
    app/routes/               # React Router v7 routes
    app/components/           # 25+ UI components (custom, zero Radix deps)
    app/.server/              # SSR utilities: api.ts, sessions.ts, config.ts
  ai_engine/                  # FastAPI scaffold (4 hardcoded endpoints)
  docs/                       # PRD, Roadmap, Architecture, API, GTM
```

## Models

### Core (assessments/)
| Model | Purpose |
|---|---|
| Framework | External ESG framework definitions (categories, scoring JSON) |
| ESGFocusArea | Organizing unit for ESG programs, with AI fields (risk_level, gaps, recommendations) |
| ExternalRating | Scores from rating agencies (MSCI, Sustainalytics, ISS, Equitable Origin) |
| Assessment | Core entity, FK to org, site, template, focus_area, framework |
| AssessmentTemplate | Reusable templates with questions (JSON) |
| AssessmentQuestion | Text, order, category, scoring_criteria (JSON) |
| AssessmentResponse | Answers with AI enrichment (ai_score_suggestion, ai_feedback, ai_validated) |
| AIInsight | Detailed AI reasoning (type, confidence, source_documents) |
| Task | Improvement actions, FK to assessment/org/focus_area |
| Site | Multi-industry (12 types: MINE, OPERATION, WELL, FACILITY, etc.) with JSON industry_data |
| AssessmentReport | Bettercoal-compatible report sections |
| Finding | Bettercoal-compatible findings |
| CIPCycle | Continuous Improvement Plan cycles |
| AssessmentPlan | Site assessment plan with dates |

### Multi-tenant & Auth
| Model | Purpose |
|---|---|
| Organization | Multi-tenant entity with status tiers (FREE/STANDARD/ENTERPRISE) |
| User | Custom user with email USERNAME_FIELD, role enum, org FK, status |
| AssessorProfile | Bettercoal-compatible assessor profile |
| Theme | White-label theming (colors, logo, fonts, custom CSS) |
| KnowledgeDocument | RAG pipeline documents with embedding tracking |

## Authentication
- JWT via `djangorestframework-simplejwt` (7-day access, 14-day refresh, rotation enabled)
- Frontend: JWT in HttpOnly cookie via React Router server actions
- Custom `login_view` (email + password → JWT)
- Cookie-based session (7-day max-age, SameSite=Lax)

## What Veris Does Well (Better than EO100/Bettercoal)
- **AI-first architecture** — AIInsight model, knowledge documents for RAG
- **Multi-industry flexibility** — 12 SiteTypes + JSON industry_data
- **White-label theming** — Per-org theming with live preview
- **Modern frontend** — React Router v7 SSR vs Bettercoal's Jinja2
- **Clean API-first design** — Separated API from frontend
- **Comprehensive seed data** — Rich demo across 3 industries

## Current State
- Backend models and serializers mostly complete
- Frontend has routes for dashboard, assessment list, detail page, data browser
- AI engine is 100% skeleton (4 hardcoded endpoints)
- Has a working `seed.py` command that populates demo data across 3 orgs

---

# 5. Cross-Project Patterns & Comparisons

## Shared Domain Concepts

| Concept | Bettercoal | EO100 | Veris |
|---|---|---|---|
| Central Process | AssuranceProcess | CertificationProcess | Assessment |
| Entity (site/unit) | MineSite | CertifiableUnit | Site |
| Questionnaire | SupplierQuestionnaire | SAQ (S.P.O.Q) | AssessmentQuestion + AssessmentResponse |
| Assessment Report | AssessmentReport | AssessmentReport | AssessmentReport |
| Findings | Finding | Finding | Finding |
| Improvement Plan | CIP + CIPMonitoringCycle | CipTarget | CIPCycle |
| Assessment Plan | AssessmentPlan | AssessmentAgenda | AssessmentPlan |
| External Standards | CIPCode (Principles > Categories > Provisions) | QuestionDefinition (supplement.principle.objective.question) | Framework (JSON categories) |
| User Roles | 4 roles | 8 roles, multi-role ArrayField | 6 roles, single role |
| Peer Review | No | Yes | No (but modeled) |
| AI | None | None | Planned (AIInsight model exists) |
| Theming | No | No | Yes (Theme model) |
| Multi-industry | Coal only | Energy only | 12 SiteTypes + JSON |

## Shared Workflow Pattern
```
Entity Creation → Questionnaire → Assessment → Report → Findings → CIP → Monitoring
```

## Shared Infrastructure Patterns
| Pattern | Status |
|---|---|
| Django backend | Universal |
| PostgreSQL | Universal |
| Docker Compose (dev) | Universal |
| Helm + K8s (prod) | Universal |
| SOPS for secrets | Universal |
| GitLab CI | Universal (EO100 + Bettercoal) |
| Token auth | Knox (EO100), sessions (Bettercoal), JWT (Veris) |

## Code Duplication Assessment

The domain models, workflow logic, auth, notifications, deadlines, and document management are **duplicated across all three projects**. Each project independently implements:
- Custom user model with roles
- Questionnaire/hierarchical question system
- Assessment report with sections
- Findings with status tracking
- Continuous improvement plan cycles
- Document management
- Notification system

**Estimated duplication**: 60-70% of the backend business logic is conceptually identical across projects.

---

# 6. Veris Gap Analysis: What's Needed to Replace Bettercoal/EO100

## Critical Blockers (P0 — Must Fix)

### 1. API Routing is Broken
ViewSets reference `org_pk` and `assessment_pk` URL kwargs that don't exist in any URL pattern. `/api/sites/`, `/api/focus-areas/`, `/api/tasks/`, `/api/responses/` all crash with KeyError.

### 2. No Authorization Enforcement
Only `IsAuthenticated` gate exists. No org-scoping middleware, no role-based ACL, no ownership checks. Any logged-in user sees all orgs' data. `User.has_perm()` always returns True.

### 3. AI Engine is 100% Skeleton
4 hardcoded endpoints returning static strings. No LangChain, no embeddings, no RAG, no prompts, no vector store initialization.

### 4. No Assessment Questionnaire UI
Models exist but zero UI to answer questions. Assessment detail page only shows findings. Users can't fill out a questionnaire.

### 5. No File Upload Mechanism
`KnowledgeDocument.file_url` is just a string. No upload endpoint. `AssessmentResponse.evidence_files` is a JSON list with no population mechanism.

### 6. AssessmentQuestionViewSet Not Registered
Viewset exists but never added to the router. Can't create/manipulate questions via API.

## Significant Gaps (P1-P2)

| Feature | Bettercoal Has | EO100 Has | Veris Needs |
|---|---|---|---|
| User invitation/signup flow | Token-based invites | Token-based per-role invites | Multi-role invite system with tokenized signup |
| Role-based permissions | Fine-grained ACL per step | Permission checks in service layer | Role middleware + per-model/org permissions |
| Multi-role user support | No | ArrayField + role switching | Need ArrayField + active_role |
| Questionnaire submission | Yes (Yes/No/N/A) | Yes (scored 0/0.5/1) | Answer UI + scoring + submission |
| Report drafting workflow | Draft/review/finalize cycle | Complex with PDF generation | Collaborative drafting + review cycle |
| Peer review | No | Yes (separate role + report) | Optional, but needed for EO100 clients |
| PDF generation | No | WeasyPrint (3 doc types) | Need automated PDF export |
| Commenting system | Per-finding, per-provision | Per-question comments | Threaded comments on responses/findings |
| Workflow state machine | ActionGraph (excellent) | Implicit boolean flags | Need generic config-driven state machine |
| Deadline + reminders | ActionDeadline + cron | No | Need deadline tracking + email reminders |
| Notifications | django-actstream + email | In-app notifications model | In-app + email notifications |
| Assessment Body orgs | No | AssessmentBody company model | Need org-level assessor management |
| External rating dashboard | No | Agency score integration | Model exists, no ViewSet/UI |
| Multi-framework mapping | No | Supplement mapping stated but not done | Need cross-framework question mapping |
| Audit trail | django-actstream | Basic timestamps | Need created_by/updated_by + change log |
| Settings management (SPA) | Django admin | N/A | Django HTML templates, not part of React SPA |
| Data import/export | No | SAQ Excel upload (openpyxl) | Need CSV/Excel import |
| Dashboard analytics | Basic | None | Placeholder component — need real metrics |

## Architecture Decisions Needed

### A. Workflow Engine
Bettercoal's ActionGraph is the most mature — frozen dataclasses, prerequisite chains, role-based ACL per step, email config. Should be extracted as a generic `WorkflowEngine` library with config-driven graphs, decoupled from Bettercoal domain.

### B. Role System
EO100's ArrayField + active_role switching is better for a generic platform. A user can be Assessor for one org, Coordinator for another. Veris currently has single role — needs upgrade.

### C. AI Engine Priority
Minimum viable AI for TDi clients:
1. **Document analysis** — Score evidence docs against provisions
2. **Response suggestions** — AI suggests answers based on uploaded documents
3. **Risk flagging** — AI reviews completed assessments and flags gaps
4. **Report drafting** — AI generates first-draft assessment reports
5. **Cross-framework mapping** — Map one set of responses to multiple frameworks
6. **Chat with knowledge base** — RAG over standards, regulations, past reports

### D. What Stays Hardcoded vs Generic
| Hardcoded (Universal) | Generic/Configurable |
|---|---|
| Assessment, Finding, CIPCycle, AssessmentReport, Site | Questionnaire structure, workflow steps, scoring methodology, notification templates, roles, themes |

## Priority Roadmap

| Phase | Priority | What | Dependencies |
|---|---|---|---|
| **P0** | Blocker | Fix API routing (broken ViewSet kwargs) | — |
| **P0** | Blocker | Implement org-scoping at API level | P0 routing fix |
| **P0** | Blocker | Add role-based authorization | P0 routing fix |
| **P1** | Critical | Build assessment questionnaire UI + submission | P0 auth + routing |
| **P1** | Critical | Add file upload for evidence documents | P0 auth + routing |
| **P1** | Critical | Register missing ViewSets (questions, etc.) | P0 routing fix |
| **P2** | High | Tokenized multi-role user invite/signup system | P0 auth |
| **P2** | High | Connect AI engine to actual LangChain/RAG | Backend models ready |
| **P3** | Medium | Workflow engine (extract ActionGraph generically) | P1 core features |
| **P3** | Medium | Deadline tracking + email reminders/cron | P2 invitations |
| **P3** | Medium | In-app + email notifications | P2 invitations |
| **P4** | Medium | PDF report generation (WeasyPrint) | P1 questionnaire |
| **P4** | Medium | Commenting system on responses/findings | P1 submission |
| **P5** | Nice-to-have | Multi-framework cross-mapping | P1 questionnaire |
| **P5** | Nice-to-have | Settings SPA (migrate Django HTML to React) | Frontend components |
| **P5** | Nice-to-have | Dashboard analytics with real metrics | P4 reporting |
| **P5** | Nice-to-have | Data import/export (CSV/Excel) | P1 file upload |
| **P6** | Nice-to-have | Peer review workflow | P1 core features |
| **P6** | Nice-to-have | Assessment Body org management | P2 invitations |
| **P6** | Nice-to-have | External rating dashboard | P1 core features |

---

# 7. Strategic Recommendations

## The Product Engine Vision

Veris should become a **reusable certification platform engine** that TDi configures per client rather than rebuilding from scratch. The architecture should be:

```
Config Layer (per-client YAML)
  ├── Workflow definition (ActionGraph-style)
  ├── Role definitions & permissions
  ├── Framework/schema definitions
  ├── Theme configuration
  └── Notification templates

Engine Core (Veris)
  ├── Multi-tenant orchestration
  ├── Assessment/questionnaire lifecycle
  ├── Finding & CIP tracking
  ├── Document management
  ├── AI pipeline (embeddings, RAG, scoring)
  └── Reporting & export

Client Frontend (React Router v7, branded per theme)
```

## Immediate Next Steps

1. **Fix the platform** (P0 items) — Veris can't replace anything until routing, auth, and org-scoping work
2. **Build the questionnaire** — This is the core user-facing feature
3. **Build the AI engine** — This is the differentiator
4. **Extract shared patterns** — Once Veris works, build the "TDi Platform Engine" library that can be reused for new clients
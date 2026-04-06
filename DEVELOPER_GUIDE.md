# Veris — Developer Guide

> AI-powered, multi-tenant sustainability assessment platform.
> Replaces 5+ legacy tools (Tedd, ICAT, Country Risk, Commodity Risk, Search360) with one white-label SaaS.

---

## 1. What This App Does

Consultancies run ESG/sustainability assessments for clients across frameworks like GRI, TCFD, CDP, MSCI. Each client needs:

| Problem | How We Solve It |
|---------|----------------|
| Manual data collection across spreadsheets | **AI-powered assessment engine** — dynamic questionnaires, auto-scoring, gap analysis |
| Siloed institutional knowledge | **Knowledge base + RAG chatbot** — upload docs, ask questions, get sourced answers |
| One brand per client means N installs | **White-label engine** — themes, colors, logos per organization |
| No follow-up on assessment findings | **Task tracking + AI nudges** — turn gaps into action items with reminders |
| Hard to see risk across frameworks | **Multi-framework mapping** — enter data once, map to ESG Certification Standard + MSCI + ISS simultaneously |

### Demo Moments (30-second value prop)

1. Upload an ESG document → ask AI questions about it → get sourced answers
2. Switch org → entire UI rebrands (colors, fonts, logo)
3. Complete one assessment → see it map to multiple frameworks automatically

---

## 2. Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend      │     │    AI Engine    │
│  React Router v7│────▶│   FastAPI/Django │◄───▶│   FastAPI +     │
│  (Vite dev srv) │     │   (Django 5.1)   │     │   LangChain     │
│  port :5173     │     │   port :8000     │     │   port :8001    │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │              ┌────────▼────────┐               │
         │              │  PostgreSQL 16  │               │
         │              │  port :5432     │               │
         │              └─────────────────┘               │
         │                                                │
         │              Pinecone (vector DB)              │
         │              (external, keyed)                 │
```

### Stack Decisions

| Component | Choice | Why |
|-----------|--------|-----|
| Frontend | React Router v7 (Remix merged) | Server-side loaders/actions, SSR, single framework |
| Backend | Django 5.1 + DRF + SimpleJWT | Mature ORM, multi-tenant patterns, built-in admin |
| AI Engine | FastAPI + LangChain + Groq | Async, OpenAI-compatible, low-latency inference |
| Database | PostgreSQL 16 | ACID, JSONB for flexible framework schemas |
| Vector DB | Pinecone | Managed, low-latency semantic search for RAG |
| Styling | Tailwind v4 + CSS custom properties | Runtime theme switching via CSS variables |
| Package mgmt | uv (Python), npm (Node) | Fastest in both ecosystems |

### Design Patterns

**Input → Pipeline → Storage → Retrieval → AI → Output → UI**

- AI orchestration is isolated from business logic (ai_engine service)
- No tight coupling to specific AI providers — Groq/OpenAI swap via env var
- Django handles CRUD, auth, multi-tenant boundaries
- FastAPI handles async AI pipelines (document ingestion, RAG, scoring)

---

## 3. Project Structure

```
Veris/
├── docker-compose.yml          # Local dev orchestration
├── Makefile                    # Common commands (make help)
├── backend/                    # Django + DRF
│   ├── config/settings/        # base.py, development.py, production.py
│   ├── organizations/          # Multi-tenant org model
│   ├── users/                  # Custom user + auth API (/api/auth/*)
│   ├── themes/                 # White-label branding per org
│   ├── assessments/            # Frameworks, assessments, tasks, sites
│   ├── knowledge/              # Document management (RAG source)
│   ├── manage.py               # Django CLI
│   └── Dockerfile
├── frontend/                   # React Router v7
│   ├── app/
│   │   ├── .server/            # Server-only code (not shipped to browser)
│   │   │   ├── api.ts          # Centralized API client (get, post, ai.*)
│   │   │   ├── config.ts       # VITE_API_URL, VITE_AI_API_URL
│   │   │   ├── sessions.ts     # Auth: login, requireUser, JWT handling
│   │   │   └── themes.ts       # Theme fetch + defaults
│   │   ├── providers/          # ThemeProvider (runtime CSS var injection)
│   │   ├── routes/             # Route files = pages
│   │   │   ├── login.tsx       # Login form
│   │   │   ├── index.tsx       # Dashboard (auth required)
│   │   │   ├── assessments/    # Assessment list
│   │   │   ├── knowledge/      # Knowledge base + AI chat
│   │   │   └── settings/theme.tsx
│   │   ├── components/         # Sidebar, Dashboard, etc.
│   │   ├── helpers/            # Utils (cn, formatDate)
│   │   ├── root.tsx            # App shell, Layout, ErrorBoundary
│   │   └── app.css             # Tailwind v4 @theme + custom props
│   └── Dockerfile
├── ai_engine/                  # FastAPI + LangChain
│   ├── main.py                 # FastAPI app entry
│   └── Dockerfile
└── docs/                       # PRD, SDS, API, ROADMAP
```

### API Routing

| Path | Service | Purpose |
|------|---------|---------|
| `/api/auth/login` | Django | Email/password → JWT tokens |
| `/api/auth/me` | Django | Authenticated user profile |
| `/api/organizations/` | Django | CRUD orgs |
| `/api/users/` | Django | CRUD users |
| `/api/themes/{orgId}` | Django | Get/update org theme |
| `/api/focus-areas/` | Django | ESG focus areas |
| `/api/frameworks/` | Django | Sustainability frameworks |
| `/api/assessments/` | Django | Assessment CRUD |
| `/api/tasks/` | Django | Task management |
| `/api/sites/` | Django | Physical locations |
| `/api/documents/` | Django | Knowledge documents |
| `/api/health/` | Django | Health check |
| (ai_engine) | FastAPI | RAG, AI chat, scoring (future) |

---

## 4. Quick Start

### Prerequisites

- Docker + Docker Compose
- `.env` file with: `PINECONE_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`
- Python 3.11+ (for local seed command), uv installed

### First Run

```bash
# 1. Start clean
make down-clean

# 2. Initialize database
make setup              # db → migrations → seed demo data

# 3. Start all services
make up
```

### Services

| URL | What |
|-----|------|
| http://localhost:5173 | Frontend (React Router v7) |
| http://localhost:8000/admin | Django admin |
| http://localhost:8000/api/health/ | Health check |
| http://localhost:8001 | AI Engine (FastAPI) |
| http://localhost:5432 | PostgreSQL |

### Default Credentials

```
Email:    admin@example.com
Password: admin
```

### Common Commands

```bash
make setup             # Init DB + seed
make up                # Start all (dev)
make down              # Stop all
make down-clean        # Stop + destroy volumes (fresh start)
make backend-migrate   # Run migrations
make backend-seed      # Seed demo data
make backend-test      # Run pytest
make logs              # Tail all logs
make logs-backend      # Tail backend only
```

---

## 5. End-to-End Testing Flow

### Step 1: Login

1. Go to http://localhost:5173 (redirects to /login if no session)
2. Enter `admin@example.com` / `admin`
3. Click Sign In
4. You should land on the Dashboard

**What happens:**
- Frontend POSTs to `/api/auth/login` (Django)
- Django validates email/password, returns JWT `access_token`
- Frontend sets HTTP-only cookie, redirects to `/`
- Loader calls `/api/auth/me` to get user profile

### Step 2: Dashboard

After login you see:
- Your org name (Demo Energy Corp)
- Assessment status summary
- Risk scores per focus area
- Recent tasks and deadlines

The seed creates 3 orgs. The logged-in user is tied to **Demo Energy Corp**.

### Step 3: Assessments

Click **Assessments** in the sidebar → see:
- 4 demo assessments (GHG Protocol, TCFD, CDP, GRI)
- Status: complete / in-progress / not-started / draft
- Progress bars, last-updated dates

This is currently mock data wired through the loader. Replace with real API calls to `/api/assessments/`.

### Step 4: Knowledge + AI Chat

Click **Knowledge** → see document list.
Click **AI Chat** → chat interface (future: connects to ai_engine RAG endpoint).

### Step 5: Theme Customization

Click **Settings → Theme** → change:
- Primary color (try `#059669`)
- Accent color
- Font family
- Logo URL

Save → the entire UI rebrands instantly. This uses CSS custom properties injected by `ThemeProvider`, with runtime overrides from the API.

### Step 6: Django Admin

Go to http://localhost:8000/admin → log in with `admin@example.com` / `admin`.

Everything is registered:
- Organizations, Users, Themes (by brand)
- Frameworks, ESG Focus Areas (by org)
- Assessments, Templates, Questions, Responses
- Tasks, Sites, AI Insights
- Knowledge Documents

---

## 5b. Multi-Industry Support

The platform works across any industry. The key design decisions:

### Site Types
`Site.SiteType` is an enum with 12 options covering coal, oil/gas, agriculture, manufacturing, retail:
- MINE, OPERATION, WELL, FACILITY, REFINERY
- PORT, OFFICE, TRANSPORT
- FARM, FACTORY, WAREHOUSE, RETAIL

### Industry-Specific Data
Industry-specific fields live in `Site.industry_data` (JSONField). This avoids adding new columns per industry:
- Coal: `type_of_coal`, `type_of_mine`, `fatalities_last_12m`, `is_coal_washing`
- Oil/Gas: `well_count`, `production_rate_bpd`, `pipeline_length_km`
- Agriculture: `crop_type`, `hectares`, `irrigation_method`
- Manufacturing: `production_lines`, `capacity_units`, `waste_management_type`

### Assessors
`AssessorProfile` replaces Bettercoal's assessor model. Key fields:
- `role`: LEAD, SENIOR, JUNIOR, EXPERT
- `specializations`: JSON list of industries (COAL, OIL_GAS, AGRICULTURE, etc.)
- `can_be_lead_assessor`: bool
- Cross-industry: an assessor can work on multiple industry types

### Bettercoal Frameworks
Their 12 CIP Code principles (Business Integrity, Human Rights, Labour Rights, H&S, etc.)  
map to our `Framework` model. Their provisions map to `ESGFocusArea`. This means:
- Any industry can have any framework loaded
- Frameworks are org-level (each tenant has its own set)
- Provisions are focus areas within a framework

### Import Existing Data
```bash
docker compose run --rm backend python manage.py import_bettercoal bettercoal.sql --dry-run
docker compose run --rm backend python manage.py import_bettercoal bettercoal.sql
```

The importer maps:
- `users_company` → Organization
- `assurance_process_*` → Assessment + AssessmentPlan
- `assurance_process_minesite` → Site (MINE type)
- `cip_code_*` → Framework + ESGFocusArea
- `assessment_report_finding` → Finding
- `users_assessorprofile` → AssessorProfile

## 6. Development Workflow

### Adding a New API Endpoint

1. Create the view in the relevant Django app (e.g., `app/views.py`)
2. Register URL in `app/urls.py` → include in `config/urls.py`
3. Add a typed method in `frontend/app/.server/api.ts` if it's a new pattern
4. Call it from a route loader/action

Example (new `/api/reports/` endpoint):

```python
# backend/reports/urls.py
urlpatterns = [
    path("reports/", reports_list, name="reports-list"),
]

# frontend/app/.server/api.ts  — already covered by api.get<T>()
# frontend/app/routes/reports.tsx
const reports = await api.get<Report[]>("/api/reports", token);
```

### Adding a New Page

1. Create `frontend/app/routes/your-page.tsx`
2. Export `loader` (server data, calls `requireUser`)
3. Export `action` (form submissions, calls `api.post`)
4. Add nav link in `routes/index.tsx`

### Changing Theme Defaults

- CSS: `app/app.css` → `@theme` block (Tailwind v4)
- JS: `~/.server/themes.ts` → `getDefaultTheme()`
- Provider: `ThemeProvider.tsx` → `DEFAULT_THEME`
- All three must use the same space-separated RGB format: `"250 250 250"`

### Adding Test Data

Run `make backend-seed` to populate:
- 1 superuser (admin@example.com)
- 3 organizations with themes
- 3 frameworks (Energy Cert, OECD, RBA)
- 18 ESG focus areas (6 per org)

---

## 7. Key Technical Decisions

### Why Docker Compose Over Local Dev?

- PostgreSQL must run
- Django and FastAPI need Python 3.11
- Volume mounts enable hot-reload for both
- Matches CI/production environment

### Why `UV_PROJECT_ENVIRONMENT=/opt/venv`?

- Volume mounts (`./backend:/app`) replace `/app` at runtime
- Without a venv outside the mount, `uv sync`-installed packages vanish on container start
- `/opt/venv` survives the mount, and `PATH` points to it for binaries like `uvicorn`

### Why `rgb()` wrapper in ThemeProvider?

- Tailwind v4 `@theme` supports bare space-separated RGB values in CSS
- But JavaScript `element.style.setProperty('--color-...', '250 250 250')` is invalid CSS
- Browser rejects bare numbers, falls back to transparent (dark screen)
- Solution: `rgb(${value})` in JS, bare values in CSS — both resolve to the same color

### Why `import.meta.env.VITE_*` Instead of `process.env`?

- Vite only exposes `VITE_`-prefixed env vars to the client
- `process.env` works on server (Node) but is undefined in browser builds
- Using `VITE_` consistently avoids undefined at runtime
- Docker Compose passes them as `VITE_API_URL=...` for the frontend container

### Why No `Black` in Production Dependencies?

- Code formatters/linters are dev-only tools
- Including them bloats production images
- Moved to `[dependency-groups].dev` in `pyproject.toml`
- CI runs with `--group dev`; prod builds use `--no-dev`

---

## 9. Common Pitfalls

| Area | Status | Notes |
|------|--------|-------|
| Assessments list | Mock data | Wire to `/api/assessments/` |
| AI Chat | UI only | No ai_engine integration yet |
| Document upload | UI only | No RAG pipeline |
| AI scoring/nudges | Not built | Requires LangChain pipeline |
| Multi-org switching | Not in UI | Backend supports it |
| PDF report generation | Not built | Phase 4 |

---

## 9. Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Dark screen on page load | ThemeProvider sets bare RGB values | Check `rgb()` wrapper |
| `uvicorn: not found` | venv wiped by volume mount | Check `UV_PROJECT_ENVIRONMENT` |
| `ModuleNotFoundError: django` | Same volume mount issue | Same fix |
| `IntegrityError: null value in column "id"` | UUIDField missing `default=uuid.uuid4` | Add default, run migration |
| `admin.E019: filter_horizontal refers to groups` | BaseUserAdmin assumes default User model | Set `filter_horizontal = ()` |
| CORS errors on login | Missing origin in `CORS_ALLOWED_ORIGINS` | Add `http://localhost:5173` |
| Login returns 401 | Wrong token field name | Check `access_token` vs `access` |

---

## 10. CI/CD (Planned)

```
PR → GitHub Actions:
  ├── Frontend: npm ci → tsc --noEmit → vitest → Playwright e2e
  └── Backend:  uv sync → flake8 → mypy → pytest
```

Not yet wired. See `docs/OPS.md` for deployment details.

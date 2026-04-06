# VERIS — Product Brand & Identity Document

> AI-powered ESG assurance and sustainability intelligence platform.

---

## 1. Product Name

### VERIS

**Origin**: Latin *veritas* (truth)
**Pronunciation**: VEH-riss (2 syllables)
**Tagline**: "ESG intelligence, verified."
**Alternate taglines**:
- "Assess. Assure. Improve."
- "Sustainability intelligence, automated."
- "The ESG platform that adapts to every client."

### Why This Name

- **Trust-forward** — ESG is fundamentally about verification and transparency
- **Industry-agnostic** — no "eco" or "green" bias; works for mining, oil/gas, agriculture, manufacturing, retail
- **Consultancy-safe** — sounds like infrastructure, not competition; white-label ready
- **B2B enterprise feel** — serious, technical, modern
- **Ecosystem-ready** — Veris Insights, Veris Reports, Veris Audit, Veris Chat

---

## 2. Brand Identity

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Deep Navy | `#0B1D35` | Primary brand, headers, backgrounds |
| Emerald | `#059669` | Accent, CTAs, success states |
| Cool Gray | `#64748B` | Secondary text, borders |
| Light Gray | `#F1F5F9` | Page backgrounds, card backgrounds |
| White | `#FFFFFF` | Cards, inputs |
| Warning Orange | `#F59E0B` | Warnings, medium severity |
| Alert Red | `#EF4444` | Errors, critical severity |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| Headings | Inter / Söhne | 600 / 700 |
| Body | Inter | 400 / 500 |
| Code / Monospace | JetBrains Mono | 400 |
| Numbers | Inter Tabular | 500 |

### Logo Concept

- **Primary**: Geometric "V" mark with subtle upward-angle (progress/improvement)
- **Secondary**: Full wordmark "VERIS" with the "V" as the primary mark
- **Icon**: Standalone "V" for favicon, app icon
- **Style**: Flat, minimal, no gradients — technical and clean
- **Negative space**: The gap between the two arms of the "V" can suggest an arrow or checkmark

---

## 3. Product Positioning

### What It Is

An AI-powered, multi-tenant ESG assurance platform that helps organizations assess, verify, and improve their sustainability practices across any framework and any industry.

### Who It's For

| Role | Need |
|------|------|
| **Sustainability Consultancies** | White-label platform to serve multiple clients with custom branding |
| **ESG Coordinators** | Manage assessments, track compliance, generate reports |
| **Operations Teams** | Complete questionnaires, upload evidence, track corrective actions |
| **External Assessors** | Conduct site visits, log findings, monitor improvement cycles |
| **Management / Executives** | Dashboards, risk scores, multi-site performance comparison |

### Industries Supported

Out of the box, the platform works across any sustainability assurance context:

- Coal & Mining
- Oil & Gas
- Agriculture & Forestry
- Manufacturing & Industrial
- Retail & Apparel
- Energy & Utilities
- Supply Chain & Logistics

### The Problem It Solves

1. **Manual assessments** — replacing spreadsheets, email chains, and paper checklists
2. **Scattered knowledge** — documents stored everywhere, no AI search or context
3. **No follow-through** — assessment findings sit in PDFs, improvement stalls
4. **Brand rigidity** — each client needs its own look, each costs millions to build
5. **Framework overload** — same data entered into 5+ different reporting systems

### The Solution

| Problem | Veris Solution |
|---------|---------------|
| Manual assessments | AI-guided questionnaires with auto-scoring and gap analysis |
| Siloed knowledge | Document upload + RAG chatbot with sourced answers |
| No follow-through | CIP cycles, task tracking, automated reminders |
| One brand per client | White-label engine — themes, colors, logos per organization |
| Multiple frameworks | Multi-framework mapping — enter once, report everywhere |

---

## 4. Architecture at a Glance

```
Input → Processing Pipeline → Storage → Retrieval → AI → Structured Output → UI

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend      │     │    AI Engine    │
│  React Router v7│────▶│   Django + DRF   │◄───▶│   FastAPI +     │
│  (Vite dev srv) │     │   (Django 5.1)   │     │   LangChain     │
│  port :5173     │     │   port :8000     │     │   port :8001    │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │              ┌────────▼────────┐               │
         │              │  PostgreSQL 16  │               │
         │              │  port :5432     │               │
         │              └─────────────────┘               │
         │                                                │
         │              Vector DB (for RAG)               │
         │              (external, keyed)                 │
```

### Stack

| Component | Technology |
|-----------|------------|
| Frontend | React Router v7, Tailwind v4, Vite |
| Backend | Django 5.1, Django REST Framework, SimpleJWT |
| AI Engine | FastAPI, LangChain, Groq / OpenAI |
| Database | PostgreSQL 16 |
| Vector DB | Pinecone (or compatible) |
| Deployment | Docker Compose (dev), AWS EC2 (prod) |
| Package Management | uv (Python), npm (Node) |

---

## 5. Core Data Model

### Multi-Tenant Layer

- **Organizations** — top-level tenants with status, subscription tier, custom domain
- **Users** — email-authenticated, role-based (Admin, Coordinator, Assessor, Consultant, Operator, Executive)

### Assessment Engine

- **Frameworks** — ESG/sustainability frameworks (any industry), with categories and scoring methodology
- **ESG Focus Areas** — organizing units within an org, mapped to frameworks
- **Assessments** — core entity, status-driven (Draft → In Progress → Under Review → Completed → Archived)
- **Assessment Templates** — reusable questionnaire structures
- **Assessment Responses** — answers with AI scoring, feedback, validation

### Bettercoal-Style Assurance Flow

- **Findings** — assessment observations with severity (LOW → CRITICAL), status tracking, responsible party
- **Assessment Reports** — multi-section structured reports (executive summary, methodology, scope, conclusion)
- **CIP Cycles** — continuous improvement plan monitoring cycles (12-month, 24-month reviews)
- **Assessment Plans** — site visit scheduling, deadlines, meeting dates

### Infrastructure & Sites

- **Sites** — physical locations (12 types: mine, well, facility, refinery, port, office, transport, farm, factory, warehouse, retail)
  - Flexible `industry_data` JSONField for per-industry customization
  - Risk profiling, compliance flags, indigenous territory and conflict zone detection

### Knowledge

- **Documents** — uploaded sustainability documents for RAG pipeline, with embedding status, chunking, vector indexing

### People

- **Assessors** — external/internal evaluators with role (Lead, Senior, Junior, Expert), industry specializations, credentials

---

## 6. User Flows

### Flow 1: Assessment Lifecycle

```
Create Assessment → Assign Site/Framework → Site Visit → Log Findings → 
Generate Report → Create CIP Cycles → Track Tasks → Monitor Cycles → 
Follow-up Assessments
```

### Flow 2: Knowledge-Driven AI

```
Upload Document → Embed & Index → Chat with AI → 
Get Sourced Answer → Reference in Assessment → 
Generate Insight → Recommend Actions
```

### Flow 3: Multi-Client (Consultancy)

```
Add Client Org → Apply White-Label Theme → Configure Frameworks → 
Invite Users → Conduct Assessment → Generate Branded Report
```

### Flow 4: Continuous Improvement

```
Assessment Closed → Findings → Create CIP Cycle → 
Assign Tasks → Monitor Deadlines → AI Nudges → 
Review Cycle → Next Assessment
```

---

## 7. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Email/password → JWT |
| `/api/auth/me` | GET | Authenticated user profile |
| `/api/organizations/` | CRUD | Tenant management |
| `/api/users/` | CRUD | User management |
| `/api/themes/` | CRUD | White-label branding |
| `/api/frameworks/` | CRUD | ESG frameworks |
| `/api/focus-areas/` | CRUD | Focus areas per org |
| `/api/assessments/` | CRUD | Assessment lifecycle |
| `/api/sites/` | CRUD | Physical locations |
| `/api/tasks/` | CRUD | Action items |
| `/api/responses/` | CRUD | Questionnaire responses |
| `/api/documents/` | CRUD | Knowledge documents |
| `/api/findings/` | CRUD | Assessment findings |
| `/api/reports/` | CRUD | Assessment reports |
| `/api/cip-cycles/` | CRUD | Improvement monitoring cycles |
| `/api/plans/` | CRUD | Assessment planning |

---

## 8. Screenshots Structure (Frontend Routes)

| Route | Purpose |
|-------|---------|
| `/login` | Authentication |
| `/` (Dashboard) | Overview, risk scores, task summary |
| `/assessments` | Assessment tracking and status |
| `/knowledge` | Document management |
| `/knowledge/chat` | AI chatbot with sourced answers |
| `/settings/theme` | White-label customization |
| `/data` | Data Browser (all records, dev/test) |

---

## 9. Demo Moments (30-Second Value Proof)

1. **AI answers from uploaded documents** — upload an ESG standard, ask a question, get sourced answer
2. **One-click rebrand** — switch organization, entire UI transforms (colors, fonts, name)
3. **One assessment → multi-framework reporting** — enter data once, see mapping to multiple frameworks
4. **Findings → tasks → CIP cycle** — close assessment, findings auto-generate improvement tasks with deadlines
5. **Multi-site risk view** — dashboard shows risk profile across all sites and organizations

---

## 10. Design System

### Components

| Component | Description |
|-----------|-------------|
| `Sidebar` | Nav links, user info, org switcher |
| `Dashboard` | Summary cards, risk scores, recent activity |
| `AssessmentCard` | Status, progress, framework, site |
| `FindingRow` | Severity badge, status, topic, actions |
| `SiteCard` | Name, type, country, risk, employee count |
| `ThemeForm` | Color pickers, font selector, logo upload |
| `DataBrowser` | Tabbed tables for all entity types |

### Severity & Status Badges

| Severity | Color | Class |
|----------|-------|-------|
| CRITICAL | `#EF4444` | red-500 |
| HIGH | `#F97316` | orange-500 |
| MEDIUM | `#F59E0B` | amber-500 |
| LOW | `#22C55E` | green-500 |

---

## 11. Go-To-Market Notes

### Pricing Model (Suggested)

| Tier | Price | Features |
|------|-------|----------|
| Starter | $499/mo | 1 org, 5 users, 1 framework, basic assessments |
| Professional | $1,499/mo | 5 orgs, 25 users, unlimited frameworks, reports, CIP |
| Enterprise | Custom | Unlimited orgs, SSO, custom domain, AI features, dedicated support |

### Competitive Advantages

1. **White-label native** — built from day one for consultancy resale
2. **Industry-agnostic** — not locked into one framework or sector
3. **AI-native** — not bolted on, core to questionnaires, scoring, reports
4. **Assurance flow** — findings → CIP → tasks → nudges (complete lifecycle)
5. **Multi-framework** — one data source, multiple reporting outputs

---

## 12. Domain Strategy

Recommended domain options (check availability):

| Domain | Priority | Notes |
|--------|----------|-------|
| veris.ai | High | AI positioning, strong for tech company |
| getveris.com | Medium | "Get" prefix is standard for SaaS |
| veris.io | Medium | Developer-friendly, modern |
| useveris.com | Medium | Action-oriented |
| veris.esg | Low | Category-specific, clear but narrow |

---

## 13. Voice & Tone

| Context | Tone | Example |
|---------|------|---------|
| Dashboard | Confident, data-driven | "3 assessments in progress. 2 findings require attention." |
| Error States | Direct, no blame | "Unable to save finding. Check connection and retry." |
| AI Responses | Professional, sourced | "Based on the uploaded GRI Standards document..." |
| Marketing | Results-focused | "Cut assessment time by 60%. Close the loop on every finding." |
| Technical Docs | Precise, structured | "AssessmentReport has a OneToOne relationship with Assessment" |

**Avoid**: "greenwashing," over-promising, competitor naming, fluffy adjectives
**Embrace**: verification, intelligence, assurance, measurable outcomes


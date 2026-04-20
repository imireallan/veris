# Veris - Product Roadmap (Generic White-Label Platform)

## Overview

We're building a **generic, white-label AI sustainability platform** for consultancies that manage multiple client organizations and frameworks.

**Key insight**: Consultancies don't need the full feature set initially — they need to be impressed by AI capabilities they can't build internally while seeing familiar functionality they already serve clients with.

**Build priority**: Demo-first, generic foundation. Build the highest-leverage consultancy workflow first, but keep everything configurable for any customer.

**AI Status**: Framework-agnostic RAG — works for any uploaded standards document.

---

## Current Maturity Snapshot

Important: this roadmap is strategic and demo-oriented. It is not a claim that all items below are already implemented.

Current state at a glance:
- Implemented foundation: multi-tenancy, invitations, org switching, assessment aggregation, white-label theme engine foundation
- Partial: AI ingestion/validation groundwork, mapping CRUD/UI, report export/model support
- Still to make demo-real: AI chat, downstream answer-once-map-many value, consultancy-grade reporting workflow

Detailed review:
- `docs/current-product-goal-alignment-review.md`

## Phase 1: Core Platform (Weeks 1-3)

### Focus: "Generic platform with a strong consultancy demo"

### Deliverables
- [ ] **Monorepo setup**: FastAPI AI + React Router v7 + Django Core
- [x] **Multi-tenant architecture**: Organizations, users, roles (generic) — foundation implemented
- [x] **Auth system**: JWT with role-based access — foundation implemented
- [x] **White-label theme engine**: CSS variables with UI builder — foundation implemented
- [ ] **3 sample tenant configs**: consultancy, mining assurance client, supplier questionnaire client
- [x] **Basic dashboard**: Role-based views with org switcher — implemented
- [ ] **Generic demo site**: Configurable branding for consultancy pitches

### Why This Matters
- Shows consultancies what their white-labeled platform can become
- Multi-tenant architecture proves scalability for ANY consultancy
- Theme engine = white-label capability for any consultancy
- 3 demo configs = immediate conversation with multiple client archetypes

---

## Phase 2: AI Knowledge Base (Weeks 4-6)

### Focus: "Framework-agnostic AI that works for any standards"

### Deliverables
- [x] **Document upload pipeline**: PDF, DOCX extraction (any framework) — core ingestion exists
- [x] **Vector embedding pipeline**: Chunking, OpenAI embeddings, Pinecone — groundwork exists
- [x] **Knowledge base UI**: Document browser, search, categories — basic UI exists
- [ ] **AI Chat assistant**: Context-aware responses with source citations
- [ ] **Pre-loaded knowledge**: example industry standards, guidance documents, and client policies
- [ ] **RAG pipeline working end-to-end** (framework-agnostic)

### Why This Matters
- Replaces fragmented knowledge, risk, and assessment tools (plus competitor equivalents)
- AI chatbot = something NO consultancy can build in-house
- Works for ANY uploaded standards document (competitive advantage)

---

## Phase 3: Assessment Engine + Multi-Framework (Weeks 7-9)

### Focus: "One data entry, multiple framework reports"

### Deliverables
- [x] **Questionnaire templates**: ESG Certification Standard, Coal Industry Program, basic ESG — template foundation exists
- [x] **Assessment workflow**: CRUD, status tracking, progress — core workflow exists
- [x] **Multi-framework mapping UI**: Data entered once, mapped to multiple standards — CRUD/UI foundation exists
- [ ] **AI-guided questionnaire navigation**: Tips, context, suggestions
- [ ] **Scoring engine**: Framework-specific scoring methods
- [x] **Evidence management**: File upload, categorization, link to responses — foundation exists
- [ ] **Cross-framework gap analysis**: "You're missing X for ESG Certification Standard Principle 5"

### Why This Matters
- Replaces Customer's TEDD (due diligence tool) + assessment workflows
- Multi-framework mapping = huge value prop (ARC reports to 4+ agencies simultaneously)
- AI guidance = impossible for Our Consultancy Client to build without ML expertise

---

## Phase 4: AI Reports + Demo Package (Weeks 10-12)

### Focus: "Everything Our Consultancy Client needs to sell this to their clients"

### Deliverables
- [ ] **AI report generation**: Assessment data → executive summary, findings
- [x] **Multi-format export**: PDF, Excel, branded per-tenant — partial/export foundation exists
- [ ] **Dashboard analytics**: Scores, trends, completion rates, AI insights
- [x] **Continuous improvement tracking**: Tasks, deadlines, reminders with AI nudging — task/CIP foundation exists, AI nudging partial
- [ ] **Full Major Energy Operator demo**: Complete with branding, knowledge base, assessment
- [ ] **Demo script + video walkthrough** for Our Consultancy Client pitch

---

## Phase 5: Our Consultancy Client Deployment + Iteration (Weeks 13+)

### Focus: "Get Our Consultancy Client to pay and deploy"

### Deliverables
- [ ] **Our Consultancy Client-specific features**: Based on their feedback
- [ ] **Production deployment pipeline**: CI/CD, staging
- [ ] **Client onboarding flow**: How Our Consultancy Client adds their clients
- [ ] **Billing/license management**
- [ ] **Performance optimization**
- [ ] **Additional framework support**: ISO, GRI, CDP, etc.

---

## Demo-First Priority

What Our Consultancy Client needs to see to buy:

```
Priority 1: AI Chat with Knowledge Base
- Upload ESG Certification Standard Standard PDF
- Ask: "What does Principle 3 require for Indigenous consultation?"
- AI gives structured answer with PDF citations
- This takes 2000 words to explain manually → done in 2 seconds

Priority 2: White-Label Switching
- Show Major Energy Operator branding
- Click switch → Now shows Coal Industry Program branding
- Everything adapts (colors, logo, fonts)
- This is their core value prop: one platform, many clients

Priority 3: Multi-Framework Data Entry
- Enter one piece of data: "GHG emissions: 2.3 MtCO2e"
- System shows: "Maps to ESG Certification Standard P5, MSCI Environment pillar, ISS Environment score"
- This replaces their manual cross-referencing work

That's the demo. Build everything else around supporting these 3 moments.
```

---

## Resource Requirements

### What You Need from Me (AI Agent):
- Architecture design
- Code scaffolding (Django models, FastAPI services, React components)
- CI/CD setup
- Testing patterns

### What You Need to Provide:
- AI API keys (OpenAI, Pinecone)
- Access to existing Our Consultancy Client/Coal Industry Program code as reference
- Relationship access to Our Consultancy Client (who to talk to)
- Domain knowledge of their specific workflows and pain points

### Infrastructure:
- Same as ApplyFlow AI: EC2 for dev, ECR for images, EKS for production later
- Start local for dev: Docker Compose
- Pinecone: Vector DB for knowledge base
- GitHub repo for version control

---

## Success Criteria for Phase 1

1. Can log in as Major Energy Operator admin with The Operator's colors/logo
2. Can log in as Our Consultancy Client admin with Customer's colors/logo
3. Can switch between tenants without sharing data
4. Dashboard loads with real ESG metrics structure
5. Code is clean enough to show to someone technical (CTO review)

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Takes too long to build core | Focus on demo flow only — skip edge cases |
| AI responses are poor | Pre-load knowledge base with exact documents you know Our Consultancy Client expects |
| White-label doesn't look right | Base theme on actual ARC/Our Consultancy Client brand guidelines you've seen |
| Our Consultancy Client already building AI internally | Position as "faster and cheaper than hiring AI team" |
| Scope creep | Stick to 3 demo moments — everything else is Phase 2+ |
| Legal/IP concerns | Build clean architecture from scratch, reference only patterns (not code) |

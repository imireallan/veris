# Veris - Product Roadmap (Our Consultancy Client-First Strategy)

## Overview

We're building a white-label AI sustainability platform to sell to Target Consultancy as a reseller. Our Consultancy Client will re-brand and deploy the platform for their own clients (ESG Certification Standard/ARC, Coal Industry Program, mining companies, etc.).

**Key insight**: Our Consultancy Client doesn't need the full feature set — they need to be impressed by AI capabilities they can't build internally while seeing familiar functionality they already serve clients with.

**Build priority**: Demo-first. We build what impresses Our Consultancy Client first, not what's technically optimal.

---

## Phase 1: Core Platform (Weeks 1-3)

### Focus: "Our Consultancy Client can see their future platform"

### Deliverables
- [ ] **Monorepo setup**: FastAPI AI + React Router v7 + Django Core
- [ ] **Multi-tenant architecture**: Organizations, users, roles
- [ ] **Auth system**: JWT with role-based access
- [ ] **White-label theme engine**: CSS variables with UI builder
- [ ] **3 sample tenant configs**: Our Consultancy Client, Major Energy Operator, Coal Industry Program (demo ready)
- [ ] **Basic dashboard**: Role-based views
- [ ] **Our Consultancy Client-branded demo site ready to show**

### Why This Matters
- Shows Our Consultancy Client their platform's future
- Multi-tenant architecture proves scalability
- Theme engine = white-label capability for their clients
- 3 demo configs = immediate conversation with their actual clients

---

## Phase 2: AI Knowledge Base (Weeks 4-6)

### Focus: "This replaces 3 of your tools at once"

### Deliverables
- [ ] **Document upload pipeline**: PDF, DOCX extraction
- [ ] **Vector embedding pipeline**: Chunking, OpenAI embeddings, Pinecone
- [ ] **Knowledge base UI**: Document browser, search, categories
- [ ] **AI Chat assistant**: Context-aware responses with source citations
- [ ] **Pre-loaded knowledge**: ESG Certification Standard Standard, MSCI methodology
- [ ] **RAG pipeline working end-to-end**

### Why This Matters
- Replaces Customer's ICAT (standards tool) + Search360 (news monitor) + tedd (due diligence tool search)
- AI chatbot = something Our Consultancy Client can't build in-house
- Pre-loaded knowledge = immediate value demonstration

---

## Phase 3: Assessment Engine + Multi-Framework (Weeks 7-9)

### Focus: "One data entry, multiple framework reports"

### Deliverables
- [ ] **Questionnaire templates**: ESG Certification Standard, Coal Industry Program, basic ESG
- [ ] **Assessment workflow**: CRUD, status tracking, progress
- [ ] **Multi-framework mapping UI**: Data entered once, mapped to multiple standards
- [ ] **AI-guided questionnaire navigation**: Tips, context, suggestions
- [ ] **Scoring engine**: Framework-specific scoring methods
- [ ] **Evidence management**: File upload, categorization, link to responses
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
- [ ] **Multi-format export**: PDF, Excel, branded per-tenant
- [ ] **Dashboard analytics**: Scores, trends, completion rates, AI insights
- [ ] **Continuous improvement tracking**: Tasks, deadlines, reminders with AI nudging
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

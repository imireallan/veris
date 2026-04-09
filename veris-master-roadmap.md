# Veris: AI-First Sustainability Platform Project Management Document

## 1. Vision & Goal
Transform the fragmented certification and assurance workflows from legacy products (Bettercoal, EO100, CGWG) into a single, generic, AI-first sustainability engine. Veris will move from a "digital form" approach to an "intelligent assistant" approach, where AI handles evidence validation, gap analysis, and report drafting, while humans provide oversight and final approval.

## 2. Core Functional Pillars (The Unified Engine)
To support Bettercoal, EO100, and CGWG, Veris must implement these generalized modules:

### A. Flexible Framework Engine
- **Legacy Requirement:**- Bettercoal (Principles > Categories > Provisions)
- EO100 (S.P.O.Q: Supplement > Principle > Objective > Question)
- **Veris Implementation:** A JSON-driven `Framework` model that allows defining arbitrary hierarchies and scoring logic without code changes.

### B. Multi-Industry Site Modeling
- **Legacy Requirement:**- MineSites (Coal) / CertifiableUnits (Energy)
- **Veris Implementation:** A generic `Site` model with `SiteType` enum and a JSON `industry_data` field for sector-specific attributes.

### C. The AI-First Assessment Pipeline
- **Input:** Questionnaire responses + Uploaded Documents (`KnowledgeDocument`).
- **Processing:** 
    - **RAG Pipeline:** Embed documents $\rightarrow$ Retrieve relevant context for a specific question.
    - **AI Validation:** Compare answer against evidence $\rightarrow$ Suggest score $\rightarrow$ Highlight gaps.
- **Output:** `AIInsight` (Reasoning, Confidence, Source Citations) $\rightarrow$ `AssessmentResponse`.

### D. Standardized Assurance Workflow
- **Phases:** Entity Creation $\rightarrow$ Self-Assessment $\rightarrow$ External Assessment $\rightarrow$ Reporting $\rightarrow$ Findings $\rightarrow$ CIP $\rightarrow$ Monitoring.
- **Logic:** Re-implement the `ActionGraph` concept from Bettercoal but as a flexible state machine tied to the `Assessment` entity.

## 3. Gap Analysis & Critical Path (P0/P1)

### P0: Infrastructure & Security (The Foundation)
- [ ] **Fix API Routing:** Resolve `KeyError` in ViewSets by correcting URL kwargs (`org_pk`, `assessment_pk`).
- [ ] **Organization-Scoped Security:** Implement multi-tenant middleware so users only see data belonging to their `Organization`.
- [ ] **Role-Based Access Control (RBAC):** Implement a robust permission system (Admin, Operator, Assessor, Client) using Django's `BasePermission`.
- [ ] **File Upload System:** Build the bridge between `KnowledgeDocument` and actual S3/Local storage.

### P1: The AI Engine (The "AI-First" Value)
- [ ] **FastAPI Integration:** Move beyond the skeleton. Integrate LangChain/OpenAI.
- [ ] **Vector Database:** Setup Pinecone or pgvector for `KnowledgeDocument` embeddings.
- [ ] **AI scoring logic:** Implement a pipeline: `Response` $\rightarrow$ `RAG` $\rightarrow$ `LLM` $\rightarrow$ `Suggested Score/Feedback`.

### P2: Frontend Completion (The User Experience)
- [ ] **Questionnaire UI:** Build the dynamic form builder to handle complex Framework hierarchies.
- [ ] **AI Insight Dashboard:** UI for users to see AI-suggested scores and evidence citations side-by-side.
- [ ] **CIP Tracking:** Implementation of the monitoring cycles and evidence upload for findings.

## 4. Phased Roadmap

### Phase 1: Stability & Security (Short Term)
- Goal: A working, secure multi-tenant app where users can manage sites and basic profiles.
- Key Milestone: "Org-A cannot see Org-B's data."

### Phase 2: The "Digital Form" MVP (Mid Term)
- Goal: Complete the end-to-end flow (Questionnaire $\rightarrow$ Report $\rightarrow$ Findings) without AI.
- Key Milestone: "A user can complete a full Bettercoal-style assessment."

### Phase 3: AI-Augmentation (The Pivot)
- Goal: Activate the AI Engine to automate the boring parts of assessment.
- Key Milestone: "AI suggests a score and cites a document as evidence."

### Phase 4: Generic Scale (Long Term)
- Goal: Support any sustainability standard by simply uploading a new `Framework` JSON.
- Key Milestone: "Onboard a new industry (e.g., Agriculture) in 1 hour without writing code."

## 5. Technical Architecture Summary
- **Frontend:** React Router v7 (SSR) $\rightarrow$ Optimized for speed and SEO.
- **Backend:** Django 5.1 (REST) $\rightarrow$ Heavy lifting, Auth, and Data Modeling.
- **AI Engine:** FastAPI $\rightarrow$ Asynchronous, high-performance LLM orchestration.
- **Data:** PostgreSQL (Relational) + Vector Store (Semantic Search).

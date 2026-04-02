# SustainabilityAI - Architecture Diagrams

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                            USERS                                     │
│                                                                      │
│   Coordinator    Operator     Executive    Assessor    Consultant     │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER / INGRESS                       │
│                                                                      │
│                    Route based on path and host                      │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Remix/React)                      │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ Dashboard  │ │Assessment  │ │ Knowledge  │ │ Theme Provider   │  │
│  │            │ │ Builder    │ │ & Chat     │ │ (CSS Variables)  │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘  │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ User Mgmt  │ │ Reports    │ │ Tasks      │ │ Settings/Admin   │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│     DJANGO CORE API      │    │      FASTAPI AI SERVICE      │
│                          │    │                              │
│ ┌──────────────────────┐ │    │ ┌──────────────────────────┐ │
│ │ Organizations        │ │    │ │ Chat API                 │ │
│ │ Themes/Branding      │ │    │ │ RAG Pipeline             │ │
│ │ Users & Auth         │ │    │ │ Report Generator         │ │
│ │ Assessments          │ │    │ │ Gap Analysis             │ │
│ │ Question Templates   │ │    │ │ Document Embedding       │ │
│ │ Responses            │ │    │ │ AI Scoring Engine        │ │
│ │ Knowledge Documents  │ │    │ │ Conversation Memory      │ │
│ │ Tasks                │ │    │ │ Provider Abstraction     │ │
│ └──────────────────────┘ │    │ └──────────────────────────┘ │
└──────────────────────────┘    └──────────────────────────────┘
            │                                │
            └────────────────┬───────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                                │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │PostgreSQL│  │ Pinecone │  │   S3/B2  │  │      Redis         │  │
│  │Database  │  │ Vector   │  │  Files   │  │   Cache/Queue      │  │
│  │          │  │   DB     │  │  & Media │  │                    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. AI Processing Pipeline

```
                    DOCUMENT INGESTION
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 1. DOCUMENT UPLOAD                        │
    │    - PDF, DOCX, TXT, HTML                 │
    │    - File type detection                   │
    │    - Size validation                       │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 2. TEXT EXTRACTION                        │
    │    - PyPDF2 / pdfplumber (PDF)            │
    │    - python-docx (DOCX)                   │
    │    - BeautifulSoup (HTML)                 │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 3. CHUNKING                               │
    │    - Configurable chunk_size (500-1000)   │
    │    - Overlap: 10-20%                      │
    │    - Preserve structure/headers           │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 4. EMBEDDING                              │
    │    - text-embedding-3-small/large         │
    │    - Batch processing for large docs      │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 5. VECTOR STORAGE                         │
    │    - Upsert to Pinecone                   │
    │    - Metadata: org_id, doc_id, page, etc  │
    └───────────────────────────────────────────┘


                    QUERY PROCESSING (RAG)
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 1. USER QUERY                             │
    │    - Natural language question            │
    │    - Includes: org_id, context            │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 2. QUERY EMBEDDING                        │
    │    - Same embedding model as docs         │
    │    - Filter by org_id for isolation       │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 3. VECTOR SEARCH                          │
    │    - Pinecone similarity search           │
    │    - top_k: 5-10 chunks                   │
    │    - Score threshold: 0.7                 │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 4. CONTEXT ASSEMBLY                       │
    │    - Combine top chunks                   │
    │    - Add system prompt                    │
    │    - Include conversation history         │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 5. LLM GENERATION                         │
    │    - OpenAI/Groq/Claude                   │
    │    - Structured output mode               │
    │    - Temperature: 0.1-0.3                 │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 6. RESPONSE PROCESSING                    │
    │    - Validate JSON schema                 │
    │    - Extract sources                      │
    │    - Calculate confidence                 │
    └─────────────────────┬─────────────────────┘
                          │
    ┌─────────────────────▼─────────────────────┐
    │ 7. RESPONSE DELIVERY                      │
    │    - Streaming to frontend                │
    │    - Source citations                     │
    │    - Confidence scores                    │
    └───────────────────────────────────────────┘
```

## 3. Multi-Tenant Theming Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORGANIZATION A                           │
│                                                                 │
│  Theme Config:                                                  │
│    primary_color: #2D5A7B                                       │
│    font_family: Inter                                           │
│    logo_url: /org-a/logo.png                                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DJANGO THEME SERVICE                         │
│                                                                 │
│  GET /api/themes/{org_id} ──► Returns theme config              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND ROOT LOADER                         │
│                                                                 │
│  Loads theme config into global state                           │
│  Applies CSS custom properties to :root                         │
│  ThemeProvider makes values available app-wide                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CSS CUSTOM PROPERTIES                        │
│                                                                 │
│  :root {                                                        │
│    --color-primary: #2D5A7B;                                    │
│    --color-secondary: #8FAABF;                                  │
│    --font-family: Inter, system-ui;                             │
│  }                                                              │
│                                                                 │
│  Tailwind extends:                                              │
│    colors: { primary: "var(--color-primary)" }                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENTS                             │
│                                                                 │
│  All components use theme values via:                           │
│  - Tailwind classes: bg-primary, text-secondary                 │
│  - useTheme() hook: theme.primary_color                         │
│  - ThemeProvider context                                        │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Assessment Workflow State Machine

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         │
                    [Start Working]
                         │
                         ▼
                    ┌──────────┐
          ┌────────┤IN_PROGRESS├────────┐
          │        └────┬─────┘        │
  [Submit              │         [Request Changes]
   for Review]         │               │
          │            ▼               │
          │     ┌──────────┐           │
          │     │UNDER_REVIEW├──────────┘
          │     └────┬─────┘
          │          │
          │    [Approved]
          │          │
          ▼          ▼
     ┌──────────┐
     │COMPLETED │
     └────┬─────┘
          │
     [Archive]
          │
          ▼
     ┌──────────┐
     │ARCHIVED  │
     └──────────┘


AI ENRICHMENT AT EACH STATE:
──────────────────────────────
DRAFT: AI suggests relevant template based on org profile
IN_PROGRESS: AI provides contextual guidance for each question
UNDER_REVIEW: AI generates preliminary findings and risk flags
COMPLETED: AI creates executive summary and improvement roadmap
ARCHIVED: AI tracks historical trends and year-over-year changes
```

## 5. Deployment Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Developer│     │  GitHub  │     │  GitHub  │     │   AWS    │
│  Push     │────►│  PR      │────►│  Actions │────►│   EKS    │
│           │     │  Review  │     │  CI/CD   │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │       STAGES        │
                              │                     │
                              │ 1. Lint & Format    │
                              │ 2. Unit Tests       │
                              │ 3. Integration Tests│
                              │ 4. Build Images     │
                              │ 5. Security Scan    │
                              │ 6. Push to ECR      │
                              │ 7. Deploy to EKS    │
                              │ 8. Health Check     │
                              │ 9. Smoke Tests      │
                              └─────────────────────┘
```

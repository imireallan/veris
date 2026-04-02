# SustainabilityAI

AI-powered sustainability assessment and intelligence platform with white-label customization, knowledge base, and AI chatbot capabilities.

## Overview

A multi-tenant SaaS platform that helps organizations navigate sustainability compliance, generate reports, and implement continuous improvement workflows through AI-guided assistance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend                                    │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────────────┐ │
│  │   Auth  │  │Dashboard│  │Assess-  │  │   Knowledge Base   │ │
│  │         │  │         │  │ ments   │  │   & AI Chat        │ │
│  └─────────┘  └─────────┘  └─────────┘  └────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Theme Engine (Design tokens, CSS vars)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Services                            │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────────────┐ │
│  │  Users  │  │  Orgs & │  │  Asses- │  │  Knowledge/Docs    │ │
│  │& Roles  │  │ Tenants │  │  sments │  │  Storage & Index   │ │
│  └─────────┘  └─────────┘  └─────────┘  └────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AI Service Layer                            │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │  │
│  │  │ ChatBot  │  │  Report  │  │  RAG Pipeline        │   │  │
│  │  │ Engine   │  │Generator │  │  (Semantic Search)   │   │  │
│  │  └──────────┘  └──────────┘  └──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: React Router v7 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.11) for AI services, Django for core CRUD
- **AI/ML**: LangChain + OpenAI/Groq + Pinecone (vector DB)
- **Database**: PostgreSQL
- **Deployment**: Docker Compose (local), AWS EKS (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + CloudWatch

## Documentation

- [PRD](./docs/PRD.md) - Product Requirements Document
- [SDS](./docs/SDS.md) - System Design Specification
- [API](./docs/API.md) - API Reference
- [OPS](./docs/OPS.md) - Operations Guide
- [LOCAL_DEV](./docs/LOCAL_DEV.md) - Local Development Setup
- [TDD](./docs/TDD.md) - Test-Driven Development Guide
- [ARCHITECTURE](./docs/ARCHITECTURE.md) - Architectural Diagrams and Details

## Getting Started

```bash
# Clone and setup
git clone <repo-url>
cd SustainabilityAI
docker compose up --build
```

## SDLC Phases

1. **Phase 1: Foundation** - Setup infrastructure, theming engine, basic auth
2. **Phase 2: AI Core** - AI service layer, knowledge base, RAG pipeline
3. **Phase 3: Assessment Engine** - Workflows, scoring, report generation
4. **Phase 4: Enterprise** - Multi-tenant, integrations, scaling

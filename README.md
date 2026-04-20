# Veris

**Generic, white-label AI sustainability platform for consultancies.**

**Primary Target**: Sustainability consultancies  
**Also Suitable For**: Any ESG/sustainability consultancy

## What This Is

A generic, multi-tenant SaaS platform that sustainability consultancies can white-label and deploy for their clients across multiple industries and frameworks.

## Value Chain

```
You (builder) → Veris Platform → Consultancy → Client Organizations
                                         ├─ Mining assurance programs
                                         ├─ Energy transition programs
                                         ├─ Supplier questionnaires
                                         └─ Multi-sector compliance workflows
```

## Quick Stats

- **Target customer**: Sustainability consultancies managing multiple client organizations
- **Replaces**: 5+ separate digital tools (TEDD, ICAT, Country Risk, Commodity Risk, Search360)
- **Key differentiator**: AI capabilities consultancies can't build in-house
- **Deployment model**: White-label per consultancy, configurable per client
- **Competitive moat**: Implementation speed, AI capabilities, domain expertise — not exclusivity

## Key Design Principle: Generic, Rebrandable, Multi-Tenant

| Aspect | Generic Platform (Correct) | Hardcoded Vertical Product (Wrong) |
|--------|---------------------------|----------------------|
| Branding | White-label engine, any consultancy can rebrand | Hardcoded client/partner branding |
| Frameworks | Configurable JSON frameworks | Hardcoded single-program framework |
| Roles | Generic: ADMIN, COORDINATOR, ASSESSOR | Hardcoded organization-specific role names |
| Workflows | Configurable state machines | Hardcoded single-client approval flow |
| Sectors | 11 sector templates | Only mining/energy |

## Three Demo Moments (Universal Value)

1. **AI Knowledge Base + Chat** — Upload any standards PDF → chatbot answers with citations
2. **White-Label Switching** — One click switches branding between tenants
3. **Multi-Framework Mapping** — Enter data once → maps to multiple frameworks simultaneously

## Current Maturity Snapshot

Current implementation status:
- Implemented: multi-tenancy, invitations, org switching, org-scoped/aggregate assessments, white-label theming foundation
- Partial: AI knowledge pipeline, cross-framework mapping, reporting workflows
- Not yet fully true in product UX: the full "AI-first intelligent engine" promise described in strategic docs

Detailed review:
- `docs/current-product-goal-alignment-review.md`

## Docs

- [PRD](./docs/PRD.md) - Product Requirements
- [Roadmap](./docs/ROADMAP.md) - Our Consultancy Client-first Phase plan (demo-focused)
- [GTM](./docs/GTM_STRATEGY.md) - Go-to-market approach
- [SDS](./docs/SDS.md) - System Design + Data Models
- [ESG Models](./docs/ESG_FRAMEWORK_MODELS.md) - Real-world ESG data structures
- [Architecture](./docs/ARCHITECTURE.md) - Diagrams and flow
- [API](./docs/API.md) - API Reference
- [OPS](./docs/OPS.md) - Deployment & Operations
- [LOCAL_DEV](./docs/LOCAL_DEV.md) - Local Setup
- [TDD](./docs/TDD.md) - Testing Guide
- [Competitive Landscape](./docs/COMPETITIVE_LANDSCAPE.md) - ARC/Our Consultancy Client/Coal Industry Program analysis

## Demo-First Priority

Three moments to impress Our Consultancy Client:
1. AI Chat answers questions from uploaded ESG Certification Standard docs
2. One click switches from ARC branding to Coal Industry Program
3. One data entry maps to ESG Certification Standard + MSCI + ISS simultaneously

## SDLC

Phase 1 (Weeks 1-3): Core platform + white-label engine
Phase 2 (Weeks 4-6): AI knowledge base + RAG pipeline
Phase 3 (Weeks 7-9): Assessment engine + multi-framework mapping
Phase 4 (Weeks 10-12): AI reports + Demo package
Phase 5 (Weeks 13+): Our Consultancy Client deployment + iteration

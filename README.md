# Veris

**Generic, white-label AI sustainability platform for consultancies.**

**Primary Target**: TDi Sustainability  
**Also Suitable For**: Any ESG/sustainability consultancy

## What This Is

A generic, multi-tenant SaaS platform that any sustainability consultancy can white-label and deploy for their clients. TDi Sustainability is the primary target customer, but the platform is designed so competitors can use it with minimal customization.

## Value Chain

```
You (freelancer) → Veris Platform → Consultancy (TDi or competitor) → Their Clients
                                                          ├─ Bettercoal (coal mining standard)
                                                          ├─ EO100 (energy certification)
                                                          ├─ CGWG (gemstones supply chain)
                                                          └─ 11 industry sectors
```

## Quick Stats

- **Target customer**: TDi Sustainability (primary), any ESG consultancy (generic)
- **Replaces**: 5+ separate digital tools (TEDD, ICAT, Country Risk, Commodity Risk, Search360)
- **Key differentiator**: AI capabilities consultancies can't build in-house
- **Deployment model**: White-label per consultancy, configurable per client
- **Competitive moat**: Implementation speed, AI capabilities, domain expertise — not exclusivity

## Key Design Principle: TDi-First, Not TDi-Specific

| Aspect | Generic Platform (Correct) | TDi-Specific (Wrong) |
|--------|---------------------------|----------------------|
| Branding | White-label engine, any consultancy can rebrand | Hardcoded TDi logos/colors |
| Frameworks | Configurable JSON frameworks | Hardcoded Bettercoal only |
| Roles | Generic: ADMIN, COORDINATOR, ASSESSOR | TDi-specific role names |
| Workflows | Configurable state machines | Hardcoded TDi approval flow |
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

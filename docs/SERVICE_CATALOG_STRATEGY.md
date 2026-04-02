# Product Strategy Update Based on TDi Service Catalog

## New Understanding

TDi is not just a digital platform company — they're a **full-service sustainability consultancy** operating across 11 sectors with 4 service pillars. The digital platform is just ONE component of their service offering.

## Revised Value Proposition

**Before**: "We replace TDi's 5 digital tools"
**Now**: "We provide the digital backbone for TDi's ENTIRE consultancy"

## Expanded Service Mapping

### Service Pillar 1: Risk Management (Currently Manual)
- Community engagement documentation → AI-assisted engagement tracking
- Supplier engagement → AI-guided assessment workflows
- ASM engagement → AI-supported small-scale mining workflows
- FPIC processes → AI-guided Indigenous peoples' rights workflows
- Audit preparation → AI audit preparation from assessment data
- Second/third party audits → AI audit support + evidence organization
- Reporting → AI-generated reports from all sources

**Our platform's role**: Replaces manual Excel/Word workflows with structured, auditable processes. AI reduces consultant time by 60%.

### Service Pillar 2: Risk Identification (Currently Partially Digital)
- Supply chain risk mapping → AI multi-source intelligence mapping
- Due diligence → AI-guided assessment + evidence tracking
- Regulation mapping → RAG-powered standards search (replaces ICAT)
- Human rights strategies → AI human rights workflows + recommendations

**Our platform's role**: Combines search360 + ICAT + country risk + commodity risk into one intelligent interface.

### Service Pillar 3: Strategy (Currently Manual)
- Strategy development → AI insights dashboards + trend analysis
- Training → AI training content generation + progress tracking
- Management systems → Multi-tenant platform replaces manual systems
- Communications → AI-assisted report/deliverable generation

**Our platform's role**: Becomes the management system TDi recommends to clients. Replaces manual strategy tools.

### Service Pillar 4: Impact & Leadership (Currently Manual)
- Industry leadership → AI industry benchmarking + insights
- Standard setting → AI-assisted framework development
- Secretariat services → Multi-tenant platform (supports Bettercoal model)
- Insights and reports → AI-generated research + analysis
- Impact investing → AI impact measurement + tracking
- Corporate impact → AI strategy development + progress tracking

**Our platform's role**: Becomes the secretariat platform for industry bodies (like Bettercoal). Generates insights TDi sells to clients.

## 11-Sector Architecture

### Sector-Specific Configuration Engine

The platform must support sector-specific:
1. **Risk frameworks**: Automotive uses RBA, Mining uses TSM, Energy uses EO100
2. **Assessment templates**: Different due diligence requirements per sector
3. **Reporting standards**: Different disclosure frameworks per sector
4. **Stakeholder types**: Different engagement requirements per sector

### Sector Template System

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECTOR CONFIGURATION                         │
│                                                                 │
│  Mining:                                                        │
│    Frameworks: TSM, OECD, FPIC, IFC Performance Standards       │
│    Risk Areas: ASM, environmental, community, human rights      │
│    Assessments: Site assessments, supply chain mapping          │
│    Reports: Conflict minerals, community impact                 │
│                                                                 │
│  Automotive:                                                    │
│    Frameworks: RBA, ISO 14001, EU Battery Regulation            │
│    Risk Areas: BoM, human rights, environmental                 │
│    Assessments: Supplier audits, BoM analysis                   │
│    Reports: Supply chain due diligence                          │
│                                                                 │
│  Energy:                                                        │
│    Frameworks: EO100, GRESB, CDP                                │
│    Risk Areas: GHG, community, environmental                    │
│    Assessments: Site-level ESG assessments                      │
│    Reports: EO100 certification, ESG disclosure                 │
└─────────────────────────────────────────────────────────────────┘
```

## Revised Phase 1 Scope

**Critical for TDi demo**: Must show multi-sector capability

1. Core multi-tenant platform (orgs, users, roles)
2. White-label engine (branding + SECTOR CONFIGURATION)
3. Knowledge base + AI chat (with sector-specific standards)
4. Assessment engine with sector templates
5. Report generation

**Demo Script**:
- Show TDi admin interface
- Configure mining client: Set up OECD/FPIC framework
- Configure energy client: Set up EO100 framework
- Show AI chat answers mining compliance question correctly
- Show AI chat answers energy compliance question correctly
- Generate mining due diligence report
- Generate energy ESG report

## Key Design Implications

1. **Framework Registry MUST support multiple frameworks per sector**
2. **Assessment templates MUST be sector-specific**
3. **Knowledge base MUST handle sector-specific standards**
4. **Reports MUST adapt to sector requirements**
5. **AI prompts MUST understand sector context**

## Updated Business Model

TDi pays us for the platform, then uses it to:
1. **Replace their 5 digital tools** (direct replacement)
2. **Scale their consulting services** (efficiency multiplier)
3. **Add AI capabilities they don't have** (capability extension)
4. **Secretariat services** (multi-tenant platform for industry bodies)

The platform becomes their core infrastructure — replacing multiple tools AND enabling new service offerings.
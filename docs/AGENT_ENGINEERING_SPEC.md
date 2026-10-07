## Problem Statement
As a new agent-engineering learner, I want to build agents into Veris that demo to TDi clients and scale to industry ESG agents, so I can learn the craft with a real product.

## Solution
ReAct agent (LangChain + FastAPI) at `ai_engine/chat`, generic `agent/` module for industry extraction, demo framework mapping for TDi.

## User Stories
1. As a TDi consultancy, I want AI framework mapping, so I can show cross-standard assessment.
2. As a client org, I want RAG chat with citations, so evidence is verifiable.
3. As a developer, I want a generic agent module, so ESG agents work beyond Veris.
4. As an assessor, I want autonomous questionnaire progression, so workflow moves.
5. As a report reviewer, I want AI synthesis, so outputs are consistent.

## Implementation Decisions
- Agent framework: LangChain (industry standard), paired with FastAPI (`ai_engine`).
- Entry seam: `ai_engine/chat` (single highest seam).
- Module: generic `agent/` provider-agnostic package extracted from Veris.
- Path: Veris-specific first (demo-ready) → industry ESG agent module.
- Vocabulary: GLOSSARY.md records ReAct, RAG, TDi, agent layer terms.

## Testing Decisions
Test external behavior at `/chat` endpoint; no implementation-detail testing. Prior art: `tests/` in backend/ai_engine.

## Out of Scope
Multi-agent orchestration, production deployment automation, non-LangChain frameworks.

## Further Notes
Grilling session produced `docs/GLOSSARY.md`. PRD authored after `grill-with-docs` paper trail. Ready for `to-tickets` → `implement`.

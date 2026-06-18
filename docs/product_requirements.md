# Product Requirements — Concept Writing Assistant (MVP)

## Goal
Turn a simple product idea into stronger, screener-ready concept-writing outputs
(Insight, Benefit, RTB, Tagline + optional Claim/Name) for consumer-goods, beauty
and hair innovation teams. It is a **structured concept-writing tool**, not a chatbot.

## Users
Marketing and innovation teams writing and pre-screening product concepts.

## In scope (MVP)
- Guided structured input form (required + optional fields)
- Search-field (strategic lens) selector with tooltips
- Tonality / route selector
- Generation modes: auto-generate 3 routes, one chosen route, one chosen tonality
- JSON-first LLM generation with robust parsing + fallback
- Retrieval layer that grounds generation in local example files
- Hybrid scoring: deterministic rule-check engine + LLM rubric scores
- Route cards, score badges, diagnostics, weak-spot highlighting
- Side-by-side comparison of up to 3 routes
- Rewrite controls (tone, length, strengthen RTB, improve coherence, etc.)
- Copy to clipboard, export to Markdown / Word-ready text
- Local version history (browser localStorage)

## Out of scope (designed-for-later, see README)
RAG/embeddings, admin tagging screen, team feedback loop, screener-result learning,
PPTX export, multilingual UI, auth, SharePoint/DAM, MCP connectors.

## Documented product decisions (resolved ambiguities)
1. **Delivery format.** Built as a runnable Next.js 14 (App Router) repo. shadcn/ui
   is referenced conceptually but the UI primitives are vendored locally in
   `components/ui` so the project runs after a single `npm install` with no extra CLI step.
2. **Scoring is hybrid.** A deterministic rule-check engine (`lib/ruleCheck.ts`) runs
   on every route regardless of the LLM, producing flags and a structural score. The LLM
   returns rubric scores; the two are merged so the tool never depends solely on a model's
   self-assessment. `overall_readiness` is computed as a weighted blend.
3. **Knowledge is data-driven.** Rules, search fields, golden concepts, tonality and the
   rubric are read from `data/` and `docs/` at request time and retrieved by relevance —
   never hard-coded into the prompt string.
4. **Storage.** Version history uses localStorage for the MVP (zero-infra). SQLite is
   noted as the next step in the README.
5. **Language.** Output language is a user input passed to the model; the UI chrome is
   English for the MVP.
6. **Model.** Defaults to a Claude Sonnet model via `ANTHROPIC_MODEL`; swappable in `.env`.

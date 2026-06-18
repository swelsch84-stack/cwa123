# Concept Writing Assistant

An internal web app that turns a simple product idea into stronger, **screener-ready
concepts** — Consumer Insight, Benefit, Reason-To-Believe (RTB) and Tagline — for
consumer-goods, beauty and hair innovation teams.

It is deliberately **not a generic chatbot**. It is a structured concept-writing workflow:
guided inputs → strategic lens + tonality → grounded generation → rule-based quality
checks → comparison and rewrite.

---

## What it does

- **Guided brief**: structured inputs (idea, category, target, problem, language) plus
  optional context (technology, format, must-have/avoid words, benchmark, length…).
- **Strategic lenses ("search fields")**: Multifunctional Hybrids, Multisensory Wellbeing,
  Advanced Health, Inside-out Beauty, Next Level Personalization — each shapes wording,
  angle, benefit emphasis, RTB logic and tagline style.
- **Routes & tonality**: auto-generate 3 distinct routes, or one chosen route/tonality
  (Tech-led, Sensory-led, Caring-led, Premium-led, Clinical-led, Convenience-led, Emotional-led).
- **Grounded generation**: retrieves the most relevant golden concepts, search-field and
  tonality definitions from local files and uses them as **style guidance** (not to copy).
- **Hybrid quality scoring**: a deterministic rule-check engine runs on every route,
  combined with the model's rubric scores. Ten criteria, weighted into an overall
  *screener-readiness* score.
- **Diagnostics**: strengths, weaknesses/risks, rule-check flags (with weak-spot
  highlighting on the actual text), a suggested next rewrite, and a "why this may work in
  a screener" note.
- **Comparison view**: up to 3 routes side by side.
- **Rewrite controls**: more emotional / premium / tech-led, shorter, more
  consumer-friendly, strengthen RTB, improve coherence, screener-ready.
- **Export & history**: copy to clipboard, download Markdown or a Word-openable `.doc`,
  and save versions locally.

## Who it is for

Marketing and innovation teams writing and pre-screening product concepts.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · `@anthropic-ai/sdk`.
UI primitives are written in the spirit of **shadcn/ui** and vendored locally in
`components/ui/primitives.tsx`, so the project runs after a single `npm install` with no
extra CLI step.

---

## Required environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable             | Required | Description                                            |
|----------------------|----------|--------------------------------------------------------|
| `ANTHROPIC_API_KEY`  | yes      | Your Anthropic API key (server-side only).             |
| `ANTHROPIC_MODEL`    | no       | Model id; defaults to a Claude Sonnet model. Override to trade cost vs. quality. |

The key is only ever read in server routes (`app/api/*`); it is never exposed to the browser.

---

## Run locally

```bash
npm install
cp .env.example .env.local      # then add your ANTHROPIC_API_KEY
npm run dev                     # http://localhost:3000
```

Build for production: `npm run build && npm start`.

> If you see a model error, set `ANTHROPIC_MODEL` in `.env.local` to a model your account
> can access.

---

## Where to put concept examples

All curated knowledge lives in `data/` (the writing rules in `docs/concept_writing_rules.md`)
and is **statically imported** so it gets bundled into the build — this is what lets it
deploy on serverless platforms like Vercel, where reading these files with `fs` at runtime
would fail because they aren't traced into the function bundle. Updating content needs **no
code change**, with one extra step for the rules file (below).

| File                          | Purpose                                             |
|-------------------------------|-----------------------------------------------------|
| `docs/concept_writing_rules.md` | The rules injected into every prompt (source of truth). |
| `data/rules.ts`               | Auto-generated from the `.md` above so the rules bundle with the build. |
| `data/search_fields.json`     | Strategic lenses (name, description, angle, keywords, RTB logic, tagline style). |
| `data/golden_concepts.json`   | Best historical concepts used for grounding.        |
| `data/tonality_examples.json` | Route/tonality definitions and example phrasing.    |
| `data/scoring_rubric.json`    | Scoring criteria, weights and band thresholds.      |

To change the writing **rules**, edit `docs/concept_writing_rules.md`, then regenerate the
bundled copy:

```bash
node -e "const fs=require('fs');const md=fs.readFileSync('docs/concept_writing_rules.md','utf8');fs.writeFileSync('data/rules.ts','// AUTO-GENERATED from docs/concept_writing_rules.md\\nexport const CONCEPT_WRITING_RULES = '+JSON.stringify(md)+';\\n')"
```

To add a golden concept, append an object to `data/golden_concepts.json`. Tag it with
`category`, `search_field`, `tonality`, `technology` and `benefit_type` so the retrieval
layer can find it.

---

## How rule checking works

Scoring is **hybrid** — the tool never relies solely on the model grading itself.

1. **Deterministic engine** (`lib/ruleCheck.ts`) runs on every route. It encodes the rules
   from `docs/concept_writing_rules.md` as code: Insight tension/voice, "benefit answers
   insight", "RTB supports benefit / introduces no new idea", tagline length & specificity,
   buzzword overload, and the single golden thread across all three elements. It emits
   flags (good/warn/bad, targeted at a specific element) and a structural score.
2. **LLM rubric scores** come back as JSON for the ten criteria in `data/scoring_rubric.json`.
3. **Merge** (`lib/llm.ts → normalizeRoute`): coherence and believability are tempered by
   the deterministic structural score (60/40 and 70/30). `overall_readiness` is then
   recomputed as a weighted blend of the criteria — it is never taken from the model.

Flags drive the weak-spot highlighting on each concept element in the UI.

---

## How to adapt search fields

Edit `data/search_fields.json`. Each entry supports:

```json
{
  "name": "Multisensory Wellbeing",
  "description": "shown as a tooltip / selector label",
  "keywords": ["used by retrieval scoring"],
  "angle": "the strategic angle the model should take",
  "benefit_emphasis": "what the benefit should foreground",
  "rtb_logic": "how the RTB should be argued",
  "tagline_style": "the desired tagline flavour"
}
```

The selector UI, retrieval scoring and the generation prompt all read from this file —
add, remove or rewrite fields freely.

---

## How to change prompt templates

All prompt construction is in `lib/prompts.ts`:

- `buildSystemPrompt()` — the core writer persona + rules (rules come from the docs file).
- `buildGenerationPrompt(input)` — the retrieval-aware constructor (assembles context,
  examples, constraints and the JSON schema).
- `buildRewritePrompt(route, action, language)` — one template covering all rewrite actions.
- `RESPONSE_SCHEMA` — the JSON contract the model must return.

Robust parsing/fallback for malformed JSON lives in `lib/llm.ts → extractJSON`.

---

## Architecture

```
app/
  page.tsx                 server component → loads selectable meta → <Studio/>
  layout.tsx               fonts + globals
  api/generate/route.ts    retrieval → prompt → LLM → parse → rule-check → merge
  api/rewrite/route.ts     single-route rewrite + re-score
components/
  Studio.tsx               client orchestrator (panels, tabs, export, history)
  InputForm.tsx            guided inputs, search-field + tonality selectors
  RouteCard.tsx            concept output, weak-spot highlighting, rewrite, copy
  ComparisonView.tsx       side-by-side of up to 3 routes
  DiagnosticsPanel.tsx     flags, strengths/weaknesses, next rewrite
  RewriteControls.tsx      rewrite action buttons
  ScoreBadge.tsx           score ring + bars + band helper
  VersionHistory.tsx       saved versions
  ui/primitives.tsx        vendored shadcn-style primitives
lib/
  knowledge.ts             static-imports bundled data + rules (server-only)
  retrieval.ts             relevance-scored example selection
  prompts.ts               system / generation / rewrite prompt builders
  ruleCheck.ts             deterministic structural checks
  llm.ts                   Anthropic client, JSON extraction, score merge
  export.ts                markdown / Word export helpers
  storage.ts               localStorage version history
  types.ts                 shared types
data/, docs/               curated knowledge (see above)
```

---

## Known limitations

- **Generation requires an API key and network**; there is no offline mock mode.
- **Retrieval is keyword/field-overlap**, not semantic — good enough for a small library,
  not for thousands of concepts.
- **History is browser-local** (localStorage) and not shared across users or devices.
- **Word export** is an HTML `.doc` (opens cleanly in Word); it is not a true `.docx`.
- **Deterministic rule checks are heuristic** (English-tuned shared-word logic); they
  complement, not replace, human judgement, and are weaker for non-English output.
- The default model id may need adjusting for your account.

---

## Suggested future enhancements

- RAG / embedding search over a large historical-concept library (swap `lib/retrieval.ts`).
- Admin screen to upload, tag and curate best concepts.
- Team feedback loop + screener-result learning to tune scoring weights.
- True `.docx` / PowerPoint export.
- Full multilingual UI (output language is already supported).
- Company authentication and SharePoint / DAM integration.
- MCP connectors.
- SQLite (or a hosted DB) for shared, persistent project/version history.

---

## Design decisions

See `docs/product_requirements.md` for the resolved ambiguities and rationale.

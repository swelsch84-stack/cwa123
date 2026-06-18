import "server-only";
import type {
  ConceptInput,
  ConceptRoute,
  RewriteAction,
} from "./types";
import { getKnowledge } from "./knowledge";
import { retrieveExamples, type RetrievalResult } from "./retrieval";

// All prompt construction lives here. Prompts are assembled from the curated knowledge
// files at request time — examples are passed as STYLE GUIDANCE, never to be copied.

const ROUTE_LABELS = [
  "Tech-led",
  "Sensory-led",
  "Caring-led",
  "Premium-led",
  "Clinical-led",
  "Convenience-led",
  "Emotional-led",
];

export const RESPONSE_SCHEMA = `Return ONLY valid JSON, no markdown, no prose, of the shape:
{
  "routes": [
    {
      "route_name": "string (e.g. one of: ${ROUTE_LABELS.join(", ")}, or a fitting label)",
      "route_rationale": "1-2 sentences on why this route fits the idea and search field",
      "insight": "consumer-voice insight, ideally I want/I do ... because ... but ...",
      "benefit": "MIN 2 sentences. Sell the single main benefit that answers the insight: first sentence states the functional payoff, second makes it vivid and desirable (the emotional reward / what life feels like). Concrete and consumer-voiced, never a one-line label.",
      "rtb": "MIN 2 sentences. First sentence names the concrete mechanism (technology, ingredient, process, or proof). Second sentence explains WHY that mechanism makes the benefit believable. Introduce no new idea.",
      "tagline": "short, memorable, <= 6 words ideally",
      "claim": "optional headline claim or empty string",
      "concept_name": "optional product/concept name or empty string",
      "rule_check": {
        "consumer_language": 0-100,
        "emotional_relevance": 0-100,
        "clarity": 0-100,
        "coherence": 0-100,
        "distinctiveness": 0-100,
        "believability": 0-100,
        "strategic_fit": 0-100,
        "single_mindedness": 0-100,
        "tagline_fit": 0-100,
        "overall_readiness": 0-100
      },
      "diagnostics": {
        "strengths": ["..."],
        "weaknesses": ["..."],
        "recommended_rewrite": "one concrete next rewrite to try",
        "why_screener": "why this may perform in a consumer concept screener"
      }
    }
  ]
}`;

export function buildSystemPrompt(): string {
  const k = getKnowledge();
  return `You are a senior concept writer for a consumer-goods / beauty / hair innovation team.
You write structured product concepts: Consumer Insight, Benefit, Reason To Believe (RTB) and Tagline.

Follow these concept-writing rules exactly:
"""
${k.rules}
"""

Non-negotiable principles:
- Write in real consumer language, never a spec sheet or marketing deck.
- The Benefit MUST answer the Insight. The RTB MUST support the Benefit and introduce NO new idea.
- DEPTH: Benefit and RTB must each be at least two full sentences. The Benefit should genuinely sell — give the consumer the functional payoff AND the emotional reward, enough to picture it. The RTB must name a concrete mechanism and then justify why it makes the benefit credible. Insight stays one to two sentences; tagline stays short; rationale and diagnostics stay brief.
- Keep one golden thread across Insight -> Benefit -> RTB. One single-minded message.
- Avoid buzzwords and generic claims ("better", "improved").
- Use the provided examples as STYLE GUIDANCE ONLY. Never copy their wording, products or phrasing.
- Be concise. A reader should grasp the concept in seconds.

You always respond with strict JSON matching the requested schema. No commentary.`;
}

function renderExamples(r: RetrievalResult): string {
  if (r.examples.length === 0) return "(no close examples found)";
  return r.examples
    .map(
      (e, i) =>
        `Example ${i + 1} [${e.search_field} / ${e.tonality}]
  Insight: ${e.insight}
  Benefit: ${e.benefit}
  RTB: ${e.rtb}
  Tagline: ${e.tagline}`
    )
    .join("\n\n");
}

function renderSearchField(r: RetrievalResult): string {
  if (!r.searchField) return "No specific search field selected — pick the most fitting angle.";
  const s = r.searchField;
  return `Search field: ${s.name}
  Description: ${s.description}
  Angle to take: ${s.angle}
  Benefit emphasis: ${s.benefit_emphasis}
  RTB logic: ${s.rtb_logic}
  Tagline style: ${s.tagline_style}`;
}

function renderTonality(r: RetrievalResult): string {
  if (!r.tonality) return "";
  const t = r.tonality;
  return `Tonality: ${t.name} — ${t.description}. Style: ${t.style.join(", ")}. e.g. "${t.example_phrase}".`;
}

export function buildGenerationPrompt(input: ConceptInput): {
  prompt: string;
  retrieval: RetrievalResult;
} {
  const retrieval = retrieveExamples(input);

  const routeInstruction =
    input.mode === "auto_routes"
      ? `Generate EXACTLY 3 DISTINCT routes that explore different angles (e.g. ${ROUTE_LABELS.slice(0, 5).join(", ")}). Each must be a genuinely different strategic take, not a reword.`
      : input.mode === "single_route"
      ? `Generate EXACTLY 1 route in the "${input.tonality || "most fitting"}" direction.`
      : `Generate EXACTLY 1 route with a "${input.tonality || "fitting"}" tonality.`;

  const constraints = [
    input.mustHaveWords ? `Must-have words: ${input.mustHaveWords}.` : "",
    input.wordsToAvoid ? `Words to avoid: ${input.wordsToAvoid}.` : "",
    input.conceptLength ? `Desired length: ${input.conceptLength}.` : "",
    input.brandContext ? `Brand / portfolio context: ${input.brandContext}.` : "",
    input.marketContext ? `Market / region context: ${input.marketContext}.` : "",
    input.benchmark ? `Inspiration benchmark (do not copy): ${input.benchmark}.` : "",
    input.format ? `Format / texture / application: ${input.format}.` : "",
    input.technology ? `Key technology / proof point: ${input.technology}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `THE PRODUCT IDEA
"""
${input.idea}
"""

CONTEXT
- Category / subcategory: ${input.category}
- Target consumer: ${input.targetConsumer}
- Main problem solved: ${input.mainProblem}
- Output language: ${input.outputLanguage}

STRATEGIC LENS
${renderSearchField(retrieval)}
${renderTonality(retrieval)}

ADDITIONAL CONSTRAINTS
${constraints || "(none)"}

STYLE-GUIDANCE EXAMPLES (do NOT copy wording)
${renderExamples(retrieval)}

TASK
${routeInstruction}
Write every concept in ${input.outputLanguage}.

${RESPONSE_SCHEMA}`;

  return { prompt, retrieval };
}

const REWRITE_INSTRUCTIONS: Record<RewriteAction, string> = {
  more_emotional: "Make it more emotional: lead with feeling, identity and human tension.",
  more_premium: "Make it more premium: elevated, refined, aspirational wording.",
  more_tech: "Make it more tech-led: foreground the technology and credible mechanism.",
  shorter: "Make it shorter and sharper without losing the core idea.",
  more_consumer_friendly: "Make it more consumer-friendly: simpler, warmer, no jargon.",
  strengthen_rtb: "Strengthen the RTB so it more credibly proves the benefit, without adding a new idea.",
  improve_coherence: "Improve coherence so one golden thread clearly runs through Insight, Benefit and RTB.",
  improve_screener_readiness:
    "Optimise for a consumer concept screener: single-minded, relevant, distinctive and easy to grasp.",
};

export function buildRewritePrompt(
  route: ConceptRoute,
  action: RewriteAction,
  outputLanguage: string
): { system: string; prompt: string } {
  const system = buildSystemPrompt();
  const prompt = `Here is an existing concept route as JSON:
${JSON.stringify(
    {
      route_name: route.route_name,
      insight: route.insight,
      benefit: route.benefit,
      rtb: route.rtb,
      tagline: route.tagline,
      claim: route.claim ?? "",
      concept_name: route.concept_name ?? "",
    },
    null,
    2
  )}

REWRITE GOAL: ${REWRITE_INSTRUCTIONS[action]}
Keep the same underlying idea. Write in ${outputLanguage}.
Return ONLY one route object (not an array) with the same JSON shape, including rule_check and diagnostics:
${RESPONSE_SCHEMA.replace('"routes": [', '').replace(/\]\s*}$/, "}")}`;

  return { system, prompt };
}

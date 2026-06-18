import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ConceptRoute,
  RuleScores,
  ScoringRubric,
} from "./types";
import { runRuleCheck } from "./ruleCheck";
import { getKnowledge } from "./knowledge";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
  }
  return new Anthropic({ apiKey });
}

export async function callModel(
  system: string,
  prompt: string,
  maxTokens = 2000
): Promise<string> {
  const client = getClient();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

// ---- Robust JSON extraction ----
// Models occasionally wrap JSON in fences or add stray prose. Recover gracefully.
export function extractJSON<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();

  // Strip code fences.
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  // Try direct parse first.
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through */
  }

  // Find the outermost JSON object/array by bracket matching.
  const start = text.search(/[[{]/);
  if (start === -1) return null;
  const open = text[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const ZERO_SCORES: RuleScores = {
  consumer_language: 0,
  emotional_relevance: 0,
  clarity: 0,
  coherence: 0,
  distinctiveness: 0,
  believability: 0,
  strategic_fit: 0,
  single_mindedness: 0,
  tagline_fit: 0,
  overall_readiness: 0,
};

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function computeOverall(scores: RuleScores, rubric: ScoringRubric): number {
  let total = 0;
  let weight = 0;
  for (const c of rubric.criteria) {
    if (c.key === "overall_readiness" || c.weight <= 0) continue;
    total += scores[c.key as keyof RuleScores] * c.weight;
    weight += c.weight;
  }
  return weight > 0 ? Math.round(total / weight) : 0;
}

let routeCounter = 0;
function nextId(): string {
  routeCounter += 1;
  return `route_${Date.now().toString(36)}_${routeCounter}`;
}

// Normalises a raw LLM route object into a fully-formed ConceptRoute:
// runs the deterministic rule-check, merges scores, recomputes overall_readiness.
export function normalizeRoute(raw: any): ConceptRoute {
  const rubric = getKnowledge().rubric;

  const insight = String(raw?.insight ?? "").trim();
  const benefit = String(raw?.benefit ?? "").trim();
  const rtb = String(raw?.rtb ?? "").trim();
  const tagline = String(raw?.tagline ?? "").trim();

  const { flags, structuralScore } = runRuleCheck({ insight, benefit, rtb, tagline });

  // Merge: take the model's rubric scores but temper coherence/believability with the
  // deterministic structural score so the tool is never purely self-graded.
  const llm = raw?.rule_check ?? {};
  const merged: RuleScores = { ...ZERO_SCORES };
  for (const c of rubric.criteria) {
    const key = c.key as keyof RuleScores;
    merged[key] = clampScore(llm[key]);
  }
  merged.coherence = Math.round(merged.coherence * 0.6 + structuralScore * 0.4);
  merged.believability = Math.round(
    merged.believability * 0.7 + structuralScore * 0.3
  );
  merged.overall_readiness = computeOverall(merged, rubric);

  const diag = raw?.diagnostics ?? {};

  return {
    id: nextId(),
    route_name: String(raw?.route_name ?? "Concept Route").trim(),
    route_rationale: String(raw?.route_rationale ?? "").trim(),
    insight,
    benefit,
    rtb,
    tagline,
    claim: raw?.claim ? String(raw.claim).trim() : undefined,
    concept_name: raw?.concept_name ? String(raw.concept_name).trim() : undefined,
    rule_check: merged,
    flags,
    diagnostics: {
      strengths: Array.isArray(diag.strengths) ? diag.strengths.map(String) : [],
      weaknesses: Array.isArray(diag.weaknesses) ? diag.weaknesses.map(String) : [],
      recommended_rewrite: String(diag.recommended_rewrite ?? "").trim(),
      why_screener: diag.why_screener ? String(diag.why_screener).trim() : undefined,
    },
  };
}

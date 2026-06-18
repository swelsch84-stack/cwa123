// Shared domain types for the Concept Writing Assistant.

export type GenerationMode = "auto_routes" | "single_route" | "single_tonality";

export interface ConceptInput {
  // Required
  idea: string;
  category: string;
  targetConsumer: string;
  mainProblem: string;
  outputLanguage: string;
  // Optional
  searchField?: string;
  tonality?: string;
  technology?: string;
  format?: string;
  brandContext?: string;
  mustHaveWords?: string;
  wordsToAvoid?: string;
  conceptLength?: "short" | "medium" | "long";
  marketContext?: string;
  benchmark?: string;
  // Generation control
  mode: GenerationMode;
}

export interface RuleScores {
  consumer_language: number;
  emotional_relevance: number;
  clarity: number;
  coherence: number;
  distinctiveness: number;
  believability: number;
  strategic_fit: number;
  single_mindedness: number;
  tagline_fit: number;
  overall_readiness: number;
}

export type FlagSeverity = "good" | "warn" | "bad";

export interface RuleFlag {
  severity: FlagSeverity;
  message: string;
  /** Which concept element the flag relates to, for highlighting. */
  target?: "insight" | "benefit" | "rtb" | "tagline" | "overall";
}

export interface Diagnostics {
  strengths: string[];
  weaknesses: string[];
  recommended_rewrite: string;
  why_screener?: string;
}

export interface ConceptRoute {
  id: string;
  route_name: string;
  route_rationale: string;
  insight: string;
  benefit: string;
  rtb: string;
  tagline: string;
  claim?: string;
  concept_name?: string;
  rule_check: RuleScores;
  /** Deterministic structural flags from the rule-check engine. */
  flags: RuleFlag[];
  diagnostics: Diagnostics;
}

export interface GenerateResponse {
  routes: ConceptRoute[];
  /** Echoes which examples were retrieved, for transparency in the UI. */
  groundedOn: { title: string; search_field: string }[];
}

export type RewriteAction =
  | "more_emotional"
  | "more_premium"
  | "more_tech"
  | "shorter"
  | "more_consumer_friendly"
  | "strengthen_rtb"
  | "improve_coherence"
  | "improve_screener_readiness";

// ---- Knowledge file shapes ----

export interface SearchFieldDef {
  name: string;
  description: string;
  keywords: string[];
  angle: string;
  benefit_emphasis: string;
  rtb_logic: string;
  tagline_style: string;
}

export interface TonalityDef {
  name: string;
  description: string;
  style: string[];
  example_phrase: string;
}

export interface GoldenConcept {
  title: string;
  category: string;
  search_field: string;
  tonality: string;
  technology: string;
  benefit_type: string;
  insight: string;
  benefit: string;
  rtb: string;
  tagline: string;
}

export interface RubricCriterion {
  // Stored as a string because this comes from JSON; it is narrowed to
  // keyof RuleScores at the point of use in lib/llm.ts.
  key: string;
  label: string;
  weight: number;
  guidance: string;
}

export interface ScoringRubric {
  scale: string;
  bands: Record<string, { min: number; label: string }>;
  criteria: RubricCriterion[];
}

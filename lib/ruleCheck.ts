import type { ConceptRoute, RuleFlag } from "./types";

// Deterministic, explainable checks that run on EVERY route regardless of the model's
// self-assessment. These encode the rules in docs/concept_writing_rules.md as code so
// the tool always has an objective structural opinion.

const BUZZWORDS = [
  "synergy",
  "revolutionary",
  "game-changing",
  "cutting-edge",
  "next-generation",
  "world-class",
  "best-in-class",
  "innovative solution",
  "leverage",
  "paradigm",
  "disruptive",
  "unparalleled",
];

const GENERIC_BENEFIT_WORDS = ["better", "improved", "great", "amazing", "optimal"];

function words(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function sentenceCount(s: string): number {
  return (s || "")
    .split(/[.!?]+/)
    .map((x) => x.trim())
    .filter((x) => x.split(/\s+/).filter(Boolean).length >= 3).length;
}

function contentWords(s: string): Set<string> {
  const stop = new Set([
    "with",
    "that",
    "your",
    "from",
    "this",
    "have",
    "more",
    "into",
    "they",
    "them",
    "want",
    "because",
    "while",
    "when",
    "without",
    "their",
    "about",
  ]);
  return new Set(words(s).filter((w) => !stop.has(w)));
}

function shareWords(a: string, b: string): number {
  const sa = contentWords(a);
  const sb = contentWords(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared;
}

export interface StructureCheck {
  flags: RuleFlag[];
  /** 0-100 deterministic structural score, used to temper the LLM coherence score. */
  structuralScore: number;
}

export function runRuleCheck(
  r: Pick<ConceptRoute, "insight" | "benefit" | "rtb" | "tagline">
): StructureCheck {
  const flags: RuleFlag[] = [];
  let score = 60; // neutral baseline

  // --- Insight: Truth/Need/Friction structure ---
  const insightLc = (r.insight || "").toLowerCase();
  const hasTension = /\bbut\b|\bhowever\b|\byet\b|\balthough\b/.test(insightLc);
  const hasFirstPerson = /\bi \b|\bi'|\bmy \b|\bme\b/.test(insightLc);
  if (hasTension && hasFirstPerson) {
    flags.push({
      severity: "good",
      message: "Insight uses a clear consumer voice with a real tension (I want… but…).",
      target: "insight",
    });
    score += 10;
  } else if (!hasTension) {
    flags.push({
      severity: "warn",
      message: "Insight has no visible tension — add a 'but…' friction to sharpen it.",
      target: "insight",
    });
    score -= 8;
  }
  if (!hasFirstPerson) {
    flags.push({
      severity: "warn",
      message: "Insight is not in first-person consumer language.",
      target: "insight",
    });
    score -= 5;
  }

  // Technical-sounding insight?
  const techHits = words(r.insight).filter((w) =>
    /technolog|molecul|formula|active|clinical|peptide|polymer|micro/.test(w)
  );
  if (techHits.length > 0) {
    flags.push({
      severity: "warn",
      message: "Insight sounds too technical — consumers don't think in mechanisms.",
      target: "insight",
    });
    score -= 6;
  }

  // --- Benefit answers the insight? (shared vocabulary) ---
  if (shareWords(r.insight, r.benefit) >= 1) {
    flags.push({
      severity: "good",
      message: "Benefit picks up the language of the insight — it resolves the tension.",
      target: "benefit",
    });
    score += 8;
  } else {
    flags.push({
      severity: "bad",
      message: "Benefit does not clearly resolve the consumer tension in the insight.",
      target: "benefit",
    });
    score -= 12;
  }

  // Generic benefit?
  if (GENERIC_BENEFIT_WORDS.some((w) => (r.benefit || "").toLowerCase().includes(w))) {
    flags.push({
      severity: "warn",
      message: "Benefit leans on generic words ('better', 'improved') — make the outcome specific.",
      target: "benefit",
    });
    score -= 5;
  }

  // Benefit depth — must sell across at least two sentences
  if (sentenceCount(r.benefit) < 2) {
    flags.push({
      severity: "warn",
      message: "Benefit is a one-liner — develop it across two sentences: the functional payoff, then the emotional reward.",
      target: "benefit",
    });
    score -= 8;
  }

  // --- RTB supports the benefit, doesn't introduce a new idea ---
  const rtbBenefitShared = shareWords(r.rtb, r.benefit);
  if (rtbBenefitShared >= 1) {
    flags.push({
      severity: "good",
      message: "RTB connects back to the benefit it is meant to support.",
      target: "rtb",
    });
    score += 8;
  } else {
    flags.push({
      severity: "bad",
      message: "RTB introduces an idea that was not set up in the benefit.",
      target: "rtb",
    });
    score -= 12;
  }

  // RTB depth — mechanism plus the reason it makes the benefit credible
  if (sentenceCount(r.rtb) < 2) {
    flags.push({
      severity: "warn",
      message: "RTB is too thin — give two sentences: name the concrete mechanism, then explain why it makes the benefit believable.",
      target: "rtb",
    });
    score -= 8;
  }

  const tagWords = (r.tagline || "").trim().split(/\s+/).filter(Boolean);
  if (tagWords.length > 8) {
    flags.push({
      severity: "warn",
      message: "Tagline is long — taglines land harder under ~6 words.",
      target: "tagline",
    });
    score -= 4;
  }
  if (shareWords(r.tagline, r.benefit + " " + r.insight) >= 1) {
    flags.push({
      severity: "good",
      message: "Tagline echoes the core idea of the concept.",
      target: "tagline",
    });
    score += 4;
  } else if (tagWords.length > 0) {
    flags.push({
      severity: "warn",
      message: "Tagline is catchy but not clearly specific to this concept.",
      target: "tagline",
    });
    score -= 4;
  }

  // --- Buzzword overload (overall) ---
  const allText = [r.insight, r.benefit, r.rtb, r.tagline].join(" ").toLowerCase();
  const buzzHits = BUZZWORDS.filter((b) => allText.includes(b));
  if (buzzHits.length > 0) {
    flags.push({
      severity: "warn",
      message: `Buzzword overload detected: ${buzzHits.slice(0, 3).join(", ")}.`,
      target: "overall",
    });
    score -= buzzHits.length * 3;
  }

  // --- Single golden-thread element across all three ---
  const triShared =
    shareWords(r.insight, r.benefit) > 0 && shareWords(r.benefit, r.rtb) > 0;
  if (triShared) {
    flags.push({
      severity: "good",
      message: "A single idea runs through Insight → Benefit → RTB. Coherent concept.",
      target: "overall",
    });
    score += 8;
  } else {
    flags.push({
      severity: "warn",
      message: "Needs a stronger golden thread linking all three elements.",
      target: "overall",
    });
  }

  return {
    flags,
    structuralScore: Math.max(0, Math.min(100, Math.round(score))),
  };
}

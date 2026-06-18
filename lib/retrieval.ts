import "server-only";
import { getKnowledge } from "./knowledge";
import type {
  ConceptInput,
  GoldenConcept,
  SearchFieldDef,
  TonalityDef,
} from "./types";

// Lightweight keyword/field overlap retrieval. Deliberately simple and explainable
// for the MVP; the README describes how to swap this for embedding search later.

function tokenize(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

export interface RetrievalResult {
  examples: GoldenConcept[];
  searchField?: SearchFieldDef;
  tonality?: TonalityDef;
}

export function retrieveExamples(
  input: ConceptInput,
  limit = 3
): RetrievalResult {
  const k = getKnowledge();

  const queryTokens = tokenize(
    [
      input.idea,
      input.category,
      input.mainProblem,
      input.technology,
      input.targetConsumer,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const searchField = k.searchFields.find((s) => s.name === input.searchField);
  const tonality = k.tonalities.find((t) => t.name === input.tonality);

  const scored = k.goldenConcepts
    .map((c) => {
      let score = 0;
      // Strong signal: same strategic lens.
      if (input.searchField && c.search_field === input.searchField) score += 5;
      // Same category family.
      if (
        input.category &&
        c.category.toLowerCase().includes(input.category.toLowerCase().split(" ")[0])
      )
        score += 3;
      // Same tonality.
      if (input.tonality && c.tonality === input.tonality) score += 2;
      // Tech mention match.
      if (
        input.technology &&
        c.technology.toLowerCase().includes(input.technology.toLowerCase())
      )
        score += 2;
      // Search-field keyword overlap with the example text.
      if (searchField) {
        const exampleTokens = tokenize(
          [c.insight, c.benefit, c.rtb, c.tagline].join(" ")
        );
        for (const kw of searchField.keywords)
          if (exampleTokens.has(kw)) score += 1;
      }
      // Free-text overlap with the idea.
      const exampleTokens = tokenize(
        [c.title, c.insight, c.benefit, c.rtb].join(" ")
      );
      score += overlap(queryTokens, exampleTokens) * 0.5;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);

  // Always return *something* for grounding, even on a weak match.
  const examples = scored.slice(0, limit).map((s) => s.c);

  return { examples, searchField, tonality };
}

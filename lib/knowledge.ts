import "server-only";
import type {
  GoldenConcept,
  ScoringRubric,
  SearchFieldDef,
  TonalityDef,
} from "./types";
import searchFieldsData from "../data/search_fields.json";
import tonalitiesData from "../data/tonality_examples.json";
import goldenConceptsData from "../data/golden_concepts.json";
import scoringRubricData from "../data/scoring_rubric.json";
import { CONCEPT_WRITING_RULES } from "../data/rules";

// Curated internal knowledge the model is grounded on. It lives in /data (+ the
// generated /data/rules.ts) and is imported statically so it is bundled into the
// serverless function at build time. (Reading these with fs at runtime is fragile
// on Vercel/Next because the files are not traced into the function bundle.)
//
// Non-engineers can still edit the JSON in /data; to change the writing rules,
// edit docs/concept_writing_rules.md and regenerate data/rules.ts.

const knowledge: {
  searchFields: SearchFieldDef[];
  tonalities: TonalityDef[];
  goldenConcepts: GoldenConcept[];
  rubric: ScoringRubric;
  rules: string;
} = {
  searchFields: searchFieldsData as SearchFieldDef[],
  tonalities: tonalitiesData as TonalityDef[],
  goldenConcepts: goldenConceptsData as GoldenConcept[],
  rubric: scoringRubricData as ScoringRubric,
  rules: CONCEPT_WRITING_RULES,
};

export function getKnowledge() {
  return knowledge;
}

// Exposed for the client (UI selectors / tooltips) via a server component.
export function getSelectableMeta() {
  const k = getKnowledge();
  return {
    searchFields: k.searchFields.map(({ name, description, angle }) => ({
      name,
      description,
      angle,
    })),
    tonalities: k.tonalities.map(({ name, description, example_phrase }) => ({
      name,
      description,
      example_phrase,
    })),
  };
}

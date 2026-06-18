import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, buildGenerationPrompt } from "@/lib/prompts";
import { callModel, extractJSON, normalizeRoute } from "@/lib/llm";
import type { ConceptInput, GenerateResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validate(input: Partial<ConceptInput>): string | null {
  if (!input.idea || input.idea.trim().length < 8)
    return "Please describe the product idea (at least a sentence).";
  if (!input.category) return "Category is required.";
  if (!input.targetConsumer) return "Target consumer is required.";
  if (!input.mainProblem) return "Main problem solved is required.";
  if (!input.outputLanguage) return "Output language is required.";
  return null;
}

export async function POST(req: NextRequest) {
  let input: ConceptInput;
  try {
    input = (await req.json()) as ConceptInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const err = validate(input);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  try {
    const system = buildSystemPrompt();
    const { prompt, retrieval } = buildGenerationPrompt(input);

    const raw = await callModel(system, prompt, 2600);
    const parsed = extractJSON<{ routes?: unknown[] }>(raw);

    if (!parsed || !Array.isArray(parsed.routes) || parsed.routes.length === 0) {
      return NextResponse.json(
        {
          error:
            "The model did not return parseable concept JSON. Try again or simplify the idea.",
          rawPreview: raw.slice(0, 400),
        },
        { status: 502 }
      );
    }

    const routes = parsed.routes.map((r) => normalizeRoute(r));

    const response: GenerateResponse = {
      routes,
      groundedOn: retrieval.examples.map((e) => ({
        title: e.title,
        search_field: e.search_field,
      })),
    };
    return NextResponse.json(response);
  } catch (e: any) {
    const message = e?.message || "Generation failed.";
    const status = /ANTHROPIC_API_KEY/.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

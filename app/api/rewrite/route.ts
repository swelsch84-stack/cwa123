import { NextRequest, NextResponse } from "next/server";
import { buildRewritePrompt } from "@/lib/prompts";
import { callModel, extractJSON, normalizeRoute } from "@/lib/llm";
import type { ConceptRoute, RewriteAction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  route: ConceptRoute;
  action: RewriteAction;
  outputLanguage?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.route || !body?.action)
    return NextResponse.json({ error: "route and action are required." }, { status: 422 });

  try {
    const { system, prompt } = buildRewritePrompt(
      body.route,
      body.action,
      body.outputLanguage || "English"
    );
    const raw = await callModel(system, prompt, 1800);
    const parsed = extractJSON<any>(raw);

    // Accept either a bare route object or { routes: [route] }.
    const routeObj = parsed?.routes?.[0] ?? parsed;
    if (!routeObj || typeof routeObj !== "object") {
      return NextResponse.json(
        { error: "The model did not return a parseable route.", rawPreview: raw.slice(0, 400) },
        { status: 502 }
      );
    }

    const route = normalizeRoute(routeObj);
    // Preserve the original id so the UI can replace in place.
    route.id = body.route.id;
    return NextResponse.json({ route });
  } catch (e: any) {
    const message = e?.message || "Rewrite failed.";
    const status = /ANTHROPIC_API_KEY/.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

"use client";
import { useState } from "react";
import { Copy, Check, ChevronDown, Loader2 } from "lucide-react";
import type { ConceptRoute, RewriteAction } from "@/lib/types";
import { Card, Badge, Button } from "./ui/primitives";
import { ScoreRing, ScoreBar } from "./ScoreBadge";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { RewriteControls } from "./RewriteControls";
import { routeToMarkdown } from "@/lib/export";
import { cn } from "@/lib/utils";

const SCORE_ROWS: { key: keyof ConceptRoute["rule_check"]; label: string }[] = [
  { key: "consumer_language", label: "Consumer language" },
  { key: "emotional_relevance", label: "Emotional relevance" },
  { key: "clarity", label: "Clarity" },
  { key: "coherence", label: "Coherence" },
  { key: "distinctiveness", label: "Distinctiveness" },
  { key: "believability", label: "Believability of RTB" },
  { key: "strategic_fit", label: "Strategic fit" },
  { key: "single_mindedness", label: "Single-mindedness" },
  { key: "tagline_fit", label: "Tagline fit" },
];

function worstSeverity(route: ConceptRoute, target: string): "good" | "warn" | "bad" | null {
  const relevant = route.flags.filter((f) => f.target === target);
  if (relevant.some((f) => f.severity === "bad")) return "bad";
  if (relevant.some((f) => f.severity === "warn")) return "warn";
  if (relevant.some((f) => f.severity === "good")) return "good";
  return null;
}

function Element({
  label,
  text,
  severity,
}: {
  label: string;
  text: string;
  severity: "good" | "warn" | "bad" | null;
}) {
  const ring =
    severity === "bad"
      ? "border-bad/40 bg-bad-soft/40"
      : severity === "warn"
      ? "border-warn/40 bg-warn-soft/40"
      : "border-line bg-paper";
  return (
    <div className={cn("rounded-xl border px-3.5 py-3 transition-colors", ring)}>
      <div className="label mb-1">{label}</div>
      <p className="text-[15px] leading-relaxed text-ink">{text || "—"}</p>
    </div>
  );
}

export function RouteCard({
  route,
  onRewrite,
  busy,
}: {
  route: ConceptRoute;
  onRewrite: (action: RewriteAction) => void;
  busy: boolean;
}) {
  const [showDiag, setShowDiag] = useState(true);
  const [showScores, setShowScores] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(routeToMarkdown(route));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const overall = route.rule_check.overall_readiness;

  return (
    <Card className="animate-fade-up overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone="accent">{route.route_name}</Badge>
            {route.concept_name && (
              <span className="truncate font-display text-lg text-ink">
                {route.concept_name}
              </span>
            )}
          </div>
          {route.route_rationale && (
            <p className="mt-1.5 text-sm text-ink-soft">{route.route_rationale}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <ScoreRing score={overall} />
          <span className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">
            Screener-ready
          </span>
        </div>
      </div>

      {/* Concept elements with weak-spot highlighting */}
      <div className="grid gap-2.5 p-5 sm:grid-cols-2">
        <Element label="Consumer Insight" text={route.insight} severity={worstSeverity(route, "insight")} />
        <Element label="Benefit" text={route.benefit} severity={worstSeverity(route, "benefit")} />
        <Element label="Reason To Believe" text={route.rtb} severity={worstSeverity(route, "rtb")} />
        <Element label="Tagline" text={route.tagline} severity={worstSeverity(route, "tagline")} />
        {route.claim && (
          <div className="sm:col-span-2">
            <Element label="Claim" text={route.claim} severity={null} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 px-5 pb-3">
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5 text-good" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {busy && (
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rewriting…
          </span>
        )}
      </div>

      {/* Rewrite controls */}
      <div className="border-t border-line bg-paper/60 px-5 py-4">
        <div className="label mb-2">Rewrite</div>
        <RewriteControls onRewrite={onRewrite} busy={busy} />
      </div>

      {/* Scores (collapsible) */}
      <button
        onClick={() => setShowScores((s) => !s)}
        className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-sm font-medium text-ink-soft hover:bg-line/30"
      >
        <span>Quality scores</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", showScores && "rotate-180")} />
      </button>
      {showScores && (
        <div className="space-y-2 px-5 pb-5">
          {SCORE_ROWS.map((r) => (
            <ScoreBar key={r.key} label={r.label} score={route.rule_check[r.key]} />
          ))}
        </div>
      )}

      {/* Diagnostics (collapsible) */}
      <button
        onClick={() => setShowDiag((s) => !s)}
        className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-sm font-medium text-ink-soft hover:bg-line/30"
      >
        <span>Diagnostics &amp; rule checks</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", showDiag && "rotate-180")} />
      </button>
      {showDiag && (
        <div className="px-5 pb-6">
          <DiagnosticsPanel route={route} />
        </div>
      )}
    </Card>
  );
}

"use client";
import { Check, AlertTriangle, X, Sparkles, Target } from "lucide-react";
import type { ConceptRoute, RuleFlag } from "@/lib/types";
import { Badge } from "./ui/primitives";

function FlagRow({ flag }: { flag: RuleFlag }) {
  const Icon = flag.severity === "good" ? Check : flag.severity === "warn" ? AlertTriangle : X;
  const tone =
    flag.severity === "good" ? "text-good" : flag.severity === "warn" ? "text-warn" : "text-bad";
  return (
    <li className="flex items-start gap-2 text-sm text-ink-soft">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
      <span>{flag.message}</span>
    </li>
  );
}

export function DiagnosticsPanel({ route }: { route: ConceptRoute }) {
  const { diagnostics, flags } = route;
  return (
    <div className="space-y-5">
      <div>
        <h4 className="label mb-2 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" /> Rule checks
        </h4>
        <ul className="space-y-1.5">
          {flags.map((f, i) => (
            <FlagRow key={i} flag={f} />
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="label mb-2 text-good">Strengths</h4>
          <ul className="space-y-1 text-sm text-ink-soft">
            {diagnostics.strengths.length ? (
              diagnostics.strengths.map((s, i) => <li key={i}>• {s}</li>)
            ) : (
              <li className="text-ink-faint">—</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="label mb-2 text-bad">Weaknesses / risks</h4>
          <ul className="space-y-1 text-sm text-ink-soft">
            {diagnostics.weaknesses.length ? (
              diagnostics.weaknesses.map((s, i) => <li key={i}>• {s}</li>)
            ) : (
              <li className="text-ink-faint">—</li>
            )}
          </ul>
        </div>
      </div>

      {diagnostics.recommended_rewrite && (
        <div className="rounded-xl border border-accent-soft bg-accent-soft/30 p-3">
          <h4 className="label mb-1 flex items-center gap-1.5 text-accent-ink">
            <Sparkles className="h-3.5 w-3.5" /> Suggested next rewrite
          </h4>
          <p className="text-sm text-ink-soft">{diagnostics.recommended_rewrite}</p>
        </div>
      )}

      {diagnostics.why_screener && (
        <div>
          <h4 className="label mb-1">Why this may work in a screener</h4>
          <p className="text-sm text-ink-soft">{diagnostics.why_screener}</p>
        </div>
      )}
    </div>
  );
}

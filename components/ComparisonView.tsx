"use client";
import type { ConceptRoute } from "@/lib/types";
import { Badge } from "./ui/primitives";
import { band } from "./ScoreBadge";
import { cn } from "@/lib/utils";

const ROWS: { key: keyof ConceptRoute; label: string }[] = [
  { key: "insight", label: "Insight" },
  { key: "benefit", label: "Benefit" },
  { key: "rtb", label: "RTB" },
  { key: "tagline", label: "Tagline" },
];

const SCORE_KEYS: { key: keyof ConceptRoute["rule_check"]; label: string }[] = [
  { key: "coherence", label: "Coherence" },
  { key: "distinctiveness", label: "Distinctiveness" },
  { key: "single_mindedness", label: "Single-minded" },
  { key: "overall_readiness", label: "Screener-ready" },
];

export function ComparisonView({ routes }: { routes: ConceptRoute[] }) {
  const cols = routes.slice(0, 3);
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[640px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="w-32 p-2" />
            {cols.map((r) => (
              <th key={r.id} className="p-2 text-left align-bottom">
                <Badge tone="accent">{r.route_name}</Badge>
                {r.concept_name && (
                  <div className="mt-1 font-display text-base text-ink">{r.concept_name}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key}>
              <td className="border-t border-line p-2 align-top label">{row.label}</td>
              {cols.map((r) => (
                <td key={r.id} className="border-t border-line p-2 align-top text-sm text-ink-soft">
                  {String(r[row.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {SCORE_KEYS.map((s) => (
            <tr key={s.key}>
              <td className="border-t border-line p-2 align-top label">{s.label}</td>
              {cols.map((r) => {
                const v = r.rule_check[s.key];
                const b = band(v);
                return (
                  <td key={r.id} className="border-t border-line p-2 align-top">
                    <span
                      className={cn(
                        "inline-flex h-7 w-10 items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
                        b === "good" && "bg-good-soft text-good",
                        b === "warn" && "bg-warn-soft text-warn",
                        b === "bad" && "bg-bad-soft text-bad"
                      )}
                    >
                      {v}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

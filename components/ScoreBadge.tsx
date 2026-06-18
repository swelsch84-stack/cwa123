"use client";
import { cn } from "@/lib/utils";

export type Band = "good" | "warn" | "bad";

export function band(score: number): Band {
  if (score >= 70) return "good";
  if (score >= 45) return "warn";
  return "bad";
}

const BAND_TEXT: Record<Band, string> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
};
const BAND_BG: Record<Band, string> = {
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
};

export function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const b = band(score);
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 text-xs text-ink-soft">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn("h-full rounded-full transition-all duration-500", BAND_BG[b])}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("w-8 shrink-0 text-right text-xs font-semibold tabular-nums", BAND_TEXT[b])}>
        {score}
      </span>
    </div>
  );
}

export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const b = band(score);
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const colorVar =
    b === "good" ? "var(--good)" : b === "warn" ? "var(--warn)" : "var(--bad)";
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colorVar}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-700"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-display text-lg font-semibold",
          BAND_TEXT[b]
        )}
      >
        {score}
      </span>
    </div>
  );
}

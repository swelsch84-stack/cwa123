"use client";
import {
  Heart,
  Gem,
  Cpu,
  Scissors,
  Smile,
  ShieldCheck,
  Link2,
  Gauge,
} from "lucide-react";
import type { RewriteAction } from "@/lib/types";
import { Button } from "./ui/primitives";

const ACTIONS: { action: RewriteAction; label: string; icon: any }[] = [
  { action: "more_emotional", label: "More emotional", icon: Heart },
  { action: "more_premium", label: "More premium", icon: Gem },
  { action: "more_tech", label: "More tech-led", icon: Cpu },
  { action: "shorter", label: "Make shorter", icon: Scissors },
  { action: "more_consumer_friendly", label: "More consumer-friendly", icon: Smile },
  { action: "strengthen_rtb", label: "Strengthen RTB", icon: ShieldCheck },
  { action: "improve_coherence", label: "Improve coherence", icon: Link2 },
  { action: "improve_screener_readiness", label: "Screener-ready", icon: Gauge },
];

export function RewriteControls({
  onRewrite,
  busy,
}: {
  onRewrite: (action: RewriteAction) => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ action, label, icon: Icon }) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onRewrite(action)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}

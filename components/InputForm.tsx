"use client";
import { useState } from "react";
import { Sparkles, Loader2, Info, ChevronDown } from "lucide-react";
import type { ConceptInput, GenerationMode } from "@/lib/types";
import { Button, Input, Textarea, Select, Label, Tooltip } from "./ui/primitives";
import { cn } from "@/lib/utils";

export interface MetaItem {
  name: string;
  description: string;
  angle?: string;
  example_phrase?: string;
}

const LANGUAGES = ["English", "German", "French", "Spanish", "Italian", "Portuguese", "Mandarin"];
const LENGTHS: { value: ConceptInput["conceptLength"]; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export function InputForm({
  searchFields,
  tonalities,
  onGenerate,
  loading,
}: {
  searchFields: MetaItem[];
  tonalities: MetaItem[];
  onGenerate: (input: ConceptInput) => void;
  loading: boolean;
}) {
  const [mode, setMode] = useState<GenerationMode>("auto_routes");
  const [showOptional, setShowOptional] = useState(false);
  const [form, setForm] = useState<Partial<ConceptInput>>({
    outputLanguage: "English",
  });

  const set = (k: keyof ConceptInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const requiredOk =
    (form.idea?.trim().length ?? 0) >= 8 &&
    form.category &&
    form.targetConsumer &&
    form.mainProblem &&
    form.outputLanguage;

  const submit = () => {
    if (!requiredOk) return;
    onGenerate({ ...(form as ConceptInput), mode });
  };

  return (
    <div className="space-y-5">
      {/* Generation mode */}
      <div>
        <Label className="mb-2">Generation mode</Label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-paper p-1">
          {(
            [
              ["auto_routes", "3 routes"],
              ["single_route", "1 route"],
              ["single_tonality", "1 tonality"],
            ] as [GenerationMode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs font-medium transition",
                mode === m ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:bg-line/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Required */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="idea">Product idea *</Label>
          <Textarea
            id="idea"
            rows={3}
            placeholder="e.g. A leave-in treatment that repairs heat damage while you sleep"
            value={form.idea ?? ""}
            onChange={(e) => set("idea", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              placeholder="Hair Care"
              value={form.category ?? ""}
              onChange={(e) => set("category", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lang">Output language *</Label>
            <Select
              id="lang"
              value={form.outputLanguage}
              onChange={(e) => set("outputLanguage", e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="target">Target consumer *</Label>
          <Input
            id="target"
            placeholder="Women 25–40 with color-treated, heat-styled hair"
            value={form.targetConsumer ?? ""}
            onChange={(e) => set("targetConsumer", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="problem">Main problem solved *</Label>
          <Input
            id="problem"
            placeholder="Cumulative heat & color damage they can't undo"
            value={form.mainProblem ?? ""}
            onChange={(e) => set("mainProblem", e.target.value)}
          />
        </div>
      </div>

      {/* Search field selector */}
      <div>
        <Label className="mb-2 flex items-center gap-1.5">
          Search field (strategic lens)
          <Tooltip content="The strategic direction shapes wording, angle, benefit emphasis, RTB logic and tagline style.">
            <Info className="h-3.5 w-3.5 text-ink-faint" />
          </Tooltip>
        </Label>
        <div className="grid grid-cols-1 gap-1.5">
          {searchFields.map((s) => (
            <button
              key={s.name}
              onClick={() => set("searchField", form.searchField === s.name ? undefined : s.name)}
              className={cn(
                "group rounded-xl border px-3 py-2 text-left transition",
                form.searchField === s.name
                  ? "border-accent bg-accent-soft/40"
                  : "border-line bg-paper hover:border-line-strong"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{s.name}</span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-ink-faint">{s.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tonality selector */}
      <div>
        <Label className="mb-2">
          {mode === "single_route" ? "Route *" : "Tonality"}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {tonalities.map((t) => (
            <Tooltip key={t.name} content={`${t.description} e.g. "${t.example_phrase}"`}>
              <button
                onClick={() => set("tonality", form.tonality === t.name ? undefined : t.name)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  form.tonality === t.name
                    ? "border-ink bg-ink text-paper"
                    : "border-line-strong bg-paper text-ink-soft hover:border-ink/40"
                )}
              >
                {t.name}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Optional fields */}
      <button
        onClick={() => setShowOptional((s) => !s)}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-line-strong px-3 py-2 text-sm text-ink-soft hover:bg-line/30"
      >
        <span>Optional context &amp; constraints</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", showOptional && "rotate-180")} />
      </button>
      {showOptional && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-paper/60 p-1">
          <Field label="Key technology / proof point" v={form.technology} onChange={(v) => set("technology", v)} placeholder="bond-building tech" />
          <Field label="Format / texture" v={form.format} onChange={(v) => set("format", v)} placeholder="overnight serum" />
          <Field label="Brand / portfolio context" v={form.brandContext} onChange={(v) => set("brandContext", v)} />
          <Field label="Market / region" v={form.marketContext} onChange={(v) => set("marketContext", v)} placeholder="EU mass" />
          <Field label="Must-have words" v={form.mustHaveWords} onChange={(v) => set("mustHaveWords", v)} />
          <Field label="Words to avoid" v={form.wordsToAvoid} onChange={(v) => set("wordsToAvoid", v)} />
          <div className="col-span-2">
            <Field label="Benchmark / inspiration concept" v={form.benchmark} onChange={(v) => set("benchmark", v)} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1">Desired concept length</Label>
            <div className="flex gap-1.5">
              {LENGTHS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => set("conceptLength", form.conceptLength === l.value ? undefined : l.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-xs transition",
                    form.conceptLength === l.value
                      ? "border-ink bg-ink text-paper"
                      : "border-line-strong text-ink-soft hover:border-ink/40"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button className="w-full" onClick={submit} disabled={!requiredOk || loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Generating concepts…" : "Generate concepts"}
      </Button>
      {!requiredOk && (
        <p className="text-center text-xs text-ink-faint">Fill the required fields (*) to generate.</p>
      )}
    </div>
  );
}

function Field({
  label,
  v,
  onChange,
  placeholder,
}: {
  label: string;
  v?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1">{label}</Label>
      <Input value={v ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import {
  Columns3,
  LayoutList,
  History as HistoryIcon,
  Download,
  Save,
  FileText,
  AlertCircle,
} from "lucide-react";
import type {
  ConceptInput,
  ConceptRoute,
  GenerateResponse,
  RewriteAction,
} from "@/lib/types";
import { InputForm, type MetaItem } from "./InputForm";
import { RouteCard } from "./RouteCard";
import { ComparisonView } from "./ComparisonView";
import { VersionHistory } from "./VersionHistory";
import { Button, Badge } from "./ui/primitives";
import {
  routesToMarkdown,
  routesToWordHtml,
  downloadText,
} from "@/lib/export";
import {
  loadHistory,
  saveVersion,
  deleteVersion,
  type SavedVersion,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

type Tab = "routes" | "compare" | "history";

export function Studio({
  searchFields,
  tonalities,
}: {
  searchFields: MetaItem[];
  tonalities: MetaItem[];
}) {
  const [loading, setLoading] = useState(false);
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<ConceptRoute[]>([]);
  const [grounded, setGrounded] = useState<GenerateResponse["groundedOn"]>([]);
  const [lastInput, setLastInput] = useState<ConceptInput | null>(null);
  const [tab, setTab] = useState<Tab>("routes");
  const [history, setHistory] = useState<SavedVersion[]>([]);

  useEffect(() => setHistory(loadHistory()), []);

  const generate = async (input: ConceptInput) => {
    setLoading(true);
    setError(null);
    setRoutes([]);
    setLastInput(input);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed.");
      setRoutes((data as GenerateResponse).routes);
      setGrounded((data as GenerateResponse).groundedOn);
      setTab("routes");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const rewrite = async (route: ConceptRoute, action: RewriteAction) => {
    setRewritingId(route.id);
    setError(null);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          action,
          outputLanguage: lastInput?.outputLanguage || "English",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rewrite failed.");
      setRoutes((rs) => rs.map((r) => (r.id === route.id ? data.route : r)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRewritingId(null);
    }
  };

  const save = () => {
    if (!lastInput || routes.length === 0) return;
    setHistory(saveVersion(lastInput, routes));
  };

  const restore = (v: SavedVersion) => {
    setRoutes(v.routes);
    setLastInput(v.input);
    setTab("routes");
  };

  const hasResults = routes.length > 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-10">
      {/* Masthead */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line-strong pb-5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="label">Innovation Studio · Internal</span>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight text-ink">
            Concept Writing Assistant
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Turn a product idea into screener-ready concepts — insight, benefit, reason-to-believe
            and tagline — grounded in your rules, search fields and best historical concepts.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Left: inputs */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="panel p-5">
            <h2 className="mb-4 font-display text-xl text-ink">The brief</h2>
            <InputForm
              searchFields={searchFields}
              tonalities={tonalities}
              onGenerate={generate}
              loading={loading}
            />
          </div>
        </aside>

        {/* Right: outputs */}
        <section className="min-w-0">
          {/* Tabs + actions */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl border border-line bg-paper-raised p-1">
              <TabButton active={tab === "routes"} onClick={() => setTab("routes")} icon={LayoutList}>
                Routes
              </TabButton>
              <TabButton
                active={tab === "compare"}
                onClick={() => setTab("compare")}
                icon={Columns3}
                disabled={routes.length < 2}
              >
                Compare
              </TabButton>
              <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={HistoryIcon}>
                History
              </TabButton>
            </div>
            {hasResults && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={save}>
                  <Save className="h-3.5 w-3.5" /> Save version
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText("concepts.md", routesToMarkdown(routes))}
                >
                  <FileText className="h-3.5 w-3.5" /> .md
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadText("concepts.doc", routesToWordHtml(routes), "application/msword")
                  }
                >
                  <Download className="h-3.5 w-3.5" /> Word
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-bad/30 bg-bad-soft/50 px-4 py-3 text-sm text-bad">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grounding transparency */}
          {hasResults && grounded.length > 0 && tab === "routes" && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
              <span>Grounded on:</span>
              {grounded.map((g, i) => (
                <Badge key={i} tone="neutral">
                  {g.title} · {g.search_field}
                </Badge>
              ))}
            </div>
          )}

          {/* Empty / loading state */}
          {!hasResults && !loading && tab !== "history" && (
            <EmptyState />
          )}
          {loading && <LoadingState />}

          {/* Content */}
          {tab === "routes" && hasResults && (
            <div className="space-y-5">
              {routes.map((r) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  busy={rewritingId === r.id}
                  onRewrite={(action) => rewrite(r, action)}
                />
              ))}
            </div>
          )}

          {tab === "compare" && routes.length >= 2 && (
            <div className="panel p-5">
              <ComparisonView routes={routes} />
            </div>
          )}

          {tab === "history" && (
            <div className="panel p-5">
              <h3 className="mb-3 font-display text-lg text-ink">Saved versions</h3>
              <VersionHistory
                versions={history}
                onRestore={restore}
                onDelete={(id) => setHistory(deleteVersion(id))}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40",
        active ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:bg-line/40"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
        <span className="font-display text-2xl text-accent-ink">C</span>
      </div>
      <h3 className="font-display text-xl text-ink">Write a brief to begin</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        Describe the idea, pick a strategic search field and a tonality, then generate one or
        three concept routes. Each comes with rule checks and quality scores.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="panel h-56 animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

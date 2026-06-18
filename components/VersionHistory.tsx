"use client";
import { History, RotateCcw, Trash2 } from "lucide-react";
import type { SavedVersion } from "@/lib/storage";
import { Button } from "./ui/primitives";

export function VersionHistory({
  versions,
  onRestore,
  onDelete,
}: {
  versions: SavedVersion[];
  onRestore: (v: SavedVersion) => void;
  onDelete: (id: string) => void;
}) {
  if (versions.length === 0) {
    return (
      <p className="px-1 text-xs text-ink-faint">
        Saved versions appear here. They are stored locally in your browser.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{v.label}</div>
            <div className="text-[11px] text-ink-faint">
              {new Date(v.savedAt).toLocaleString()} · {v.routes.length} route
              {v.routes.length > 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={() => onRestore(v)} title="Restore">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(v.id)} title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

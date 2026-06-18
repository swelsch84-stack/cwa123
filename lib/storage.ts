"use client";
import type { ConceptInput, ConceptRoute } from "./types";

// MVP persistence: browser localStorage. The README documents the SQLite upgrade path.

const KEY = "cwa.history.v1";

export interface SavedVersion {
  id: string;
  savedAt: number;
  label: string;
  input: ConceptInput;
  routes: ConceptRoute[];
}

export function loadHistory(): SavedVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedVersion[]) : [];
  } catch {
    return [];
  }
}

export function saveVersion(input: ConceptInput, routes: ConceptRoute[]): SavedVersion[] {
  const history = loadHistory();
  const label =
    routes[0]?.concept_name ||
    routes[0]?.route_name ||
    input.idea.slice(0, 40) ||
    "Untitled concept";
  const version: SavedVersion = {
    id: `v_${Date.now().toString(36)}`,
    savedAt: Date.now(),
    label,
    input,
    routes,
  };
  const next = [version, ...history].slice(0, 30); // cap history
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / disabled — fail silently for MVP */
  }
  return next;
}

export function deleteVersion(id: string): SavedVersion[] {
  const next = loadHistory().filter((v) => v.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

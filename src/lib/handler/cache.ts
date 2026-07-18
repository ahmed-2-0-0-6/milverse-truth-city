// MILVERSE — Per-day / per-surface caching for Handler AI outputs.
// Rule: at most ONE AI generation per surface per profile per UTC+5 day.

import { dropDateKey } from "@/lib/daily/rotation";

export type HandlerSurface =
  | "reading"
  | "assignment-reaction"
  | "drop-line"
  | "leaderboard-nudge"
  | "psych-eval"
  | "send-off"
  | "loss-debrief";

const KEY = "milverse.handler.cache.v1";

interface CacheEntry {
  dateKey: string; // YYYY-MM-DD UTC+5
  hash: string; // input fingerprint — invalidates when inputs change
  text: string;
  source: "ai" | "fallback";
  ts: number;
}

type CacheShape = Partial<Record<HandlerSurface, CacheEntry>>;

// Day key comes from daily/rotation.ts so the Handler cache and the Daily
// Drop always roll over together.
export { dropDateKey };

function load(): CacheShape {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as CacheShape;
  } catch {
    return {};
  }
}

function save(c: CacheShape) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function readCache(surface: HandlerSurface, hash: string): CacheEntry | null {
  const c = load();
  const e = c[surface];
  if (!e) return null;
  if (e.dateKey !== dropDateKey()) return null;
  if (e.hash !== hash) return null;
  return e;
}

export function writeCache(
  surface: HandlerSurface,
  hash: string,
  text: string,
  source: "ai" | "fallback",
) {
  const c = load();
  c[surface] = { dateKey: dropDateKey(), hash, text, source, ts: Date.now() };
  save(c);
}

/** Simple string hash — stable, non-crypto. */
export function fingerprint(obj: unknown): string {
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

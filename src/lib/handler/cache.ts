// MILVERSE — Per-day / per-surface caching for Handler AI outputs.
// Rule: at most ONE AI generation per surface per profile per UTC+5 day.

import { dropDateKey } from "@/lib/daily/rotation";
import { readStore, writeStore } from "@/lib/storage";

export type HandlerSurface =
  | "reading"
  | "assignment-reaction"
  | "drop-line"
  | "leaderboard-nudge"
  | "psych-eval"
  | "send-off"
  | "loss-debrief";

// Owner: handler/cache (per-surface AI cache). SAFE-LIST member — reclaim()
// may delete this whole key. Bump the suffix on breaking shape change;
// readStore validators are the compatibility gate.
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

function isCacheShape(v: unknown): v is CacheShape {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function load(): CacheShape {
  if (typeof window === "undefined") return {};
  const read = readStore<CacheShape>(KEY, isCacheShape);
  if (read === "corrupt" || read === null) return {};
  return read;
}

function save(c: CacheShape): boolean {
  if (typeof window === "undefined") return false;
  return writeStore(KEY, c);
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

// MILVERSE — Per-day / per-surface caching for Handler AI outputs.
// Rule: at most ONE AI generation per surface per profile per UTC+5 day.

export type HandlerSurface =
  | "reading"
  | "assignment-reaction"
  | "drop-line"
  | "leaderboard-nudge"
  | "psych-eval";

const KEY = "milverse.handler.cache.v1";

interface CacheEntry {
  dateKey: string;     // YYYY-MM-DD UTC+5
  hash: string;        // input fingerprint — invalidates when inputs change
  text: string;
  source: "ai" | "fallback";
  ts: number;
}

type CacheShape = Partial<Record<HandlerSurface, CacheEntry>>;

/** UTC+5 day key — matches Daily Drop rollover. */
export function dropDateKey(now = new Date()): string {
  const shifted = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function load(): CacheShape {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as CacheShape; }
  catch { return {}; }
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

export function writeCache(surface: HandlerSurface, hash: string, text: string, source: "ai" | "fallback") {
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

// MILVERSE — TIME STOLEN.
// Derived, presentational metric for The Baiter frame.
//
// Rule: seconds a scammer spent on the line with the player. Every minute
// they burn on a baiter is a minute stolen from a real victim. Real-case
// runs get plain "CALL TIME" wording — you don't "steal time" from real
// people. Field is optional/additive on HistoryEntry; old entries render
// clean.

import type { HistoryEntry } from "./profile";

export interface HasTs { ts: number }

/**
 * caseSeconds: seconds between the first and last message with a valid ts.
 * Clamped to [0, 1800] (30 minutes) — a paused tab can otherwise produce
 * absurd deltas. Returns null when there are fewer than two timestamps.
 */
export function caseSeconds(messages: readonly HasTs[] | undefined): number | null {
  if (!messages || messages.length < 2) return null;
  const ts = messages.map((m) => m.ts).filter((t) => Number.isFinite(t));
  if (ts.length < 2) return null;
  const first = Math.min(...ts);
  const last = Math.max(...ts);
  const delta = Math.round((last - first) / 1000);
  return Math.max(0, Math.min(1800, delta));
}

/** m:ss — used everywhere per-case time is displayed. */
export function formatMS(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** {h}h {m}m — lifetime aggregate wording. Under an hour drops the "h". */
export function formatHM(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Sum of timeHeld across imposter-truth wins/losses in history.
 * Only imposter truth counts — real-case time isn't "stolen" from anyone.
 * Old entries without timeHeld are silently skipped.
 */
export function lifetimeStolenSeconds(history: readonly HistoryEntry[] | undefined): number {
  if (!history?.length) return 0;
  let total = 0;
  for (const h of history) {
    if (h.truth !== "IMPOSTER") continue;
    const t = h.timeHeld;
    if (typeof t === "number" && Number.isFinite(t)) total += t;
  }
  return total;
}

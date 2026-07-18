// MILVERSE — THE SPOOL. Presentation-side derivation of past receipts from
// the append-only dailyPlays log. Zero writes, zero network. Never fetches
// historical city splits — those aggregates weren't captured at the time.

import { loadProfile, type DailyPlayEntry } from "@/lib/mirror/profile";
import type { ReceiptData } from "@/components/daily/ReceiptCard";

/**
 * Reconstruct the streak-at-time for the given entry by walking the dateKey
 * chain backward through consecutive UTC+5 days present in `allPlays`.
 * Deterministic from the log alone.
 */
function streakAsOf(entry: DailyPlayEntry, allPlays: DailyPlayEntry[]): number {
  const byDate = new Map<string, DailyPlayEntry>();
  for (const p of allPlays) byDate.set(p.dateKey, p);
  let count = 0;
  let cursor = entry.dateKey;
  while (byDate.has(cursor)) {
    count += 1;
    // Previous UTC calendar day
    const prev = new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    cursor = prev;
  }
  return count;
}

/**
 * Reconstruct localSharpness at the time of `entry` — i.e. the same
 * formula the live receipt uses, restricted to plays up to and including
 * that day. localSharpness() derives purely from correct/total, so the
 * per-day reconstruction is deterministic from the log.
 */
function sharpnessAsOf(entry: DailyPlayEntry, allPlays: DailyPlayEntry[]): number | undefined {
  const upTo = allPlays.filter((p) => p.dateKey <= entry.dateKey);
  if (upTo.length < 3) return undefined; // matches live: <3 plays → no reading
  const pct = upTo.filter((p) => p.correct).length / upTo.length;
  return Math.max(20, Math.min(95, Math.round(20 + pct * 75)));
}

/** Reprint a receipt for a past day, using only data the profile already keeps. */
export function rebuildReceipt(
  entry: DailyPlayEntry,
  allPlays: DailyPlayEntry[],
): ReceiptData {
  const outcome: ReceiptData["outcome"] = entry.correct
    ? "correct"
    : entry.truth === "SCAM"
      ? "missed_scam"
      : "false_alarm";
  const siteUrl =
    typeof window !== "undefined" ? `${window.location.origin}/drop` : "milverse.app/drop";
  return {
    dropNumber:
      Math.floor(new Date(entry.dateKey + "T00:00:00Z").getTime() / 86400000) - 20000,
    dateKey: entry.dateKey,
    probesUsed: entry.probesUsed,
    correct: entry.correct,
    outcome,
    stake: entry.stake,
    delta: entry.delta,
    streak: streakAsOf(entry, allPlays),
    sharpness: sharpnessAsOf(entry, allPlays),
    siteUrl,
    // Historical splits aren't stored; never fetch retroactively.
  };
}

/** All dailyPlays, most-recent first. */
export function spoolEntries(): DailyPlayEntry[] {
  const p = loadProfile();
  return [...p.dailyPlays].sort((a, b) =>
    a.dateKey === b.dateKey ? b.ts - a.ts : a.dateKey < b.dateKey ? 1 : -1,
  );
}

export const SPOOL_LIST_CAP = 60;

export function outcomeWord(e: DailyPlayEntry): "CORRECT" | "MISSED SCAM" | "FALSE ALARM" {
  if (e.correct) return "CORRECT";
  return e.truth === "SCAM" ? "MISSED SCAM" : "FALSE ALARM";
}

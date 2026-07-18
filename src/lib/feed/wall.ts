// MILVERSE — Feed wall log. Additive write-behind record of Feed case results,
// keyed for The Case Wall (/wall). Feed itself stores nothing per-case locally,
// so this log exists purely to let /wall show feed cards. Never read by engines.

import { readStore, recoverStore, writeStore } from "@/lib/storage";

export interface FeedWallEntry {
  caseId: string;
  verdict: "TRUE" | "FALSE" | "MISLEADING";
  result: "correct" | "missed_scam" | "false_alarm" | "pyrrhic";
  ts: number;
}

// Owner: feed/wall (FeedWallEntry list). Bump the suffix on breaking shape
// change; readStore validators are the compatibility gate.
const KEY = "milverse.feedwall.v1";

function isFeedWallShape(v: unknown): v is FeedWallEntry[] {
  return Array.isArray(v);
}

export function loadFeedWall(): FeedWallEntry[] {
  if (typeof window === "undefined") return [];
  const read = readStore<FeedWallEntry[]>(KEY, isFeedWallShape);
  if (read === "corrupt") {
    const rec = recoverStore<FeedWallEntry[]>(KEY, isFeedWallShape);
    return rec ?? [];
  }
  return read ?? [];
}

/** Append one entry. Deduped by (caseId, ts) so a re-render can't double-fire. */
export function appendFeedWall(entry: FeedWallEntry) {
  if (typeof window === "undefined") return;
  const list = loadFeedWall();
  if (list.some((e) => e.caseId === entry.caseId && e.ts === entry.ts)) return;
  list.push(entry);
  writeStore(KEY, list);
}

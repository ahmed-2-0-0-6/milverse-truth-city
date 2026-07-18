// MILVERSE — Feed wall log. Additive write-behind record of Feed case results,
// keyed for The Case Wall (/wall). Feed itself stores nothing per-case locally,
// so this log exists purely to let /wall show feed cards. Never read by engines.

export interface FeedWallEntry {
  caseId: string;
  verdict: "TRUE" | "FALSE" | "MISLEADING";
  result: "correct" | "missed_scam" | "false_alarm" | "pyrrhic";
  ts: number;
}

const KEY = "milverse.feedwall.v1";

export function loadFeedWall(): FeedWallEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FeedWallEntry[]) : [];
  } catch {
    return [];
  }
}

/** Append one entry. Deduped by (caseId, ts) so a re-render can't double-fire. */
export function appendFeedWall(entry: FeedWallEntry) {
  if (typeof window === "undefined") return;
  const list = loadFeedWall();
  if (list.some((e) => e.caseId === entry.caseId && e.ts === entry.ts)) return;
  list.push(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
}

// MILVERSE — Daily Drop rotation.
// 21 curated Feed scenarios, indexed by day-number since epoch (UTC+5).
// Everyone on the same date sees the same case.

import { FEED_SCENARIOS, type FeedScenario, type FeedVerdict } from "@/lib/feed/scenarios";

/** Curated seed rotation. Excludes UNVERIFIED cases (daily uses 3 verdicts). */
export const DAILY_ROTATION_IDS: string[] = [
  "bank-rumor",
  "flood-photo",
  "unbelievable-true",
  "miracle-cure",
  "free-laptop",
  "kidnap-van",
  "doctor-clip",
  "recalled-medicine",
  "old-protest",
  "job-circular",
  "weird-but-true",
  "insta-brand-giveaway",
  "news-screenshot-riot",
  "viral-photo-flood",
  "video-cure-tiktok",
  "job-dubai-offer",
  "disaster-charity-scam",
  "ai-deepfake-pm",
  "ai-generated-photo",
  "insta-celeb-invest",
  "news-real-outlet-oldstory",
];

export type DailyVerdict = "LEGIT" | "SCAM" | "MISLEADING";

/** Map a Feed 4-verdict result to the Daily 3-verdict palette. */
export function toDailyVerdict(v: FeedVerdict): DailyVerdict {
  if (v === "TRUE") return "LEGIT";
  if (v === "FALSE") return "SCAM";
  return "MISLEADING"; // MISLEADING & UNVERIFIED collapse here
}

/** UTC+5 (Pakistan Time) rollover. Returns YYYY-MM-DD for "now" in that zone. */
export function dropDateKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** Seconds until the next UTC+5 midnight rollover. */
export function secondsToNextDrop(now: Date = new Date()): number {
  const shifted = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const next = new Date(shifted);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((next.getTime() - shifted.getTime()) / 1000));
}

/** Index into the rotation for a given date key (deterministic). */
export function rotationIndexForDate(dateKey: string): number {
  // Days since 1970-01-01 in the shifted zone; stable seed.
  const days = Math.floor(new Date(dateKey + "T00:00:00Z").getTime() / 86400000);
  return (
    ((days % DAILY_ROTATION_IDS.length) + DAILY_ROTATION_IDS.length) % DAILY_ROTATION_IDS.length
  );
}

/** Return the FeedScenario scheduled for a given date. */
export function caseForDate(dateKey: string): FeedScenario {
  const id = DAILY_ROTATION_IDS[rotationIndexForDate(dateKey)];
  const found = FEED_SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Daily rotation references missing scenario: ${id}`);
  return found;
}

/** Today's scenario. */
export function todaysDailyCase(): { scenario: FeedScenario; dateKey: string } {
  const dateKey = dropDateKey();
  return { scenario: caseForDate(dateKey), dateKey };
}

/** Yesterday's scenario (viewable but not playable). */
export function yesterdaysDailyCase(): { scenario: FeedScenario; dateKey: string } {
  const now = new Date();
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dateKey = dropDateKey(y);
  return { scenario: caseForDate(dateKey), dateKey };
}

/** Is today Friday (Designer Friday), UTC+5? 0=Sun … 5=Fri. */
export function isDesignerFriday(dateKey: string = dropDateKey()): boolean {
  return new Date(dateKey + "T00:00:00Z").getUTCDay() === 5;
}

// MILVERSE — Daily Drop profile helpers.
// Operates on the shared TrustProfile: trust balance, streak, and one-play-per-day.

import {
  loadProfile,
  saveProfile,
  type TrustProfile,
  type DailyPlayEntry,
} from "@/lib/mirror/profile";
import { dropDateKey } from "@/lib/daily/rotation";

const FLOOR_LOAN = 50; // "city fronts you 50" — never hard-lock a learner out
const MIN_STAKE = 10;
const MAX_STAKE = 100;

export function stakeBounds(trust: number): { min: number; max: number } {
  return {
    min: Math.min(MIN_STAKE, Math.max(1, trust)),
    max: Math.min(MAX_STAKE, Math.max(MIN_STAKE, trust)),
  };
}

export interface DailyStatus {
  playedToday: boolean;
  todayEntry: DailyPlayEntry | null;
  streak: number;
  trust: number;
}

export function readDailyStatus(): DailyStatus {
  const p = loadProfile();
  const today = dropDateKey();
  const entry = p.dailyPlays.find((d) => d.dateKey === today) ?? null;
  return { playedToday: !!entry, todayEntry: entry, streak: p.dailyStreak, trust: p.trust };
}

/** Compute streak after a play on `today`. */
function nextStreak(prev: TrustProfile, today: string): number {
  if (!prev.lastDailyDate) return 1;
  if (prev.lastDailyDate === today) return prev.dailyStreak; // shouldn't happen (one-per-day guard)
  const y = new Date(new Date(today + "T00:00:00Z").getTime() - 86400000)
    .toISOString()
    .slice(0, 10);
  return prev.lastDailyDate === y ? prev.dailyStreak + 1 : 1;
}

export interface DailyPayoutInput {
  caseId: string;
  verdict: "LEGIT" | "SCAM" | "MISLEADING";
  truth: "LEGIT" | "SCAM" | "MISLEADING";
  stake: number;
  probesUsed: number;
}

export interface DailyPayoutResult {
  correct: boolean;
  delta: number; // +win / -loss (city loan applied AFTER)
  outcome: "correct" | "missed_scam" | "false_alarm";
  newTrust: number;
  newStreak: number;
  fronted: boolean; // city fronted 50 after zero
  entry: DailyPlayEntry;
}

/** Attempt to record today's play. Returns null if already played today. */
export function commitDailyPlay(input: DailyPayoutInput): DailyPayoutResult | null {
  const p = loadProfile();
  const today = dropDateKey();
  if (p.dailyPlays.some((d) => d.dateKey === today)) return null;

  const clampedStake = Math.max(1, Math.min(input.stake, Math.max(1, p.trust)));
  const correct = input.verdict === input.truth;
  // Two-way loss framing (only when truth != MISLEADING; MISLEADING wrongs pick the nearer sting)
  let outcome: "correct" | "missed_scam" | "false_alarm";
  if (correct) outcome = "correct";
  else if (input.truth === "SCAM" && input.verdict === "LEGIT") outcome = "missed_scam";
  else if (input.truth === "LEGIT" && input.verdict === "SCAM") outcome = "false_alarm";
  else outcome = input.truth === "SCAM" ? "missed_scam" : "false_alarm";

  const delta = correct ? clampedStake : -clampedStake;
  let newTrust = p.trust + delta;
  let fronted = false;
  if (newTrust <= 0) {
    newTrust = FLOOR_LOAN;
    fronted = true;
  }

  const streak = nextStreak(p, today);

  const entry: DailyPlayEntry = {
    dateKey: today,
    caseId: input.caseId,
    verdict: input.verdict,
    truth: input.truth,
    correct,
    stake: clampedStake,
    delta,
    probesUsed: input.probesUsed,
    ts: Date.now(),
  };

  p.trust = newTrust;
  p.dailyStreak = streak;
  p.lastDailyDate = today;
  p.dailyPlays = [...p.dailyPlays, entry].slice(-90); // keep last ~90 days
  saveProfile(p);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("milverse:profile"));

  return { correct, delta, outcome, newTrust, newStreak: streak, fronted, entry };
}

/** Rough "sharper than X% of the city" for the share card — uses local streak+correct% only. */
export function localSharpness(): number {
  const p = loadProfile();
  const plays = p.dailyPlays;
  if (plays.length < 3) return 50;
  const pct = plays.filter((d) => d.correct).length / plays.length;
  // Map 0..1 → 20..95
  return Math.max(20, Math.min(95, Math.round(20 + pct * 75)));
}

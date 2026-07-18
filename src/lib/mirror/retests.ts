// MILVERSE — "The City Checks Back".
// Spaced retests of lost lessons. Pure logic + localStorage.
// No engine, scenario, or ground-truth mutations. Ever.

import { SCENARIOS, getScenario } from "@/lib/mirror/scenarios";
import type { TrustProfile } from "@/lib/mirror/profile";
import { unlockedMaxTier } from "@/lib/mirror/profile";
import type { TacticId } from "@/lib/manual/entries";
import { readStore, recoverStore, writeStore } from "@/lib/storage";

// Owner: mirror/retests (Retest queue). Bump the suffix on breaking shape
// change; readStore validators are the compatibility gate.
const KEY = "milverse.retests.v1";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const QUEUE_CAP = 3;


export type RetestStatus = "pending" | "closed";

export interface Retest {
  id: string;
  sourceCaseId: string;
  sourceCaseTitle: string;
  sourceTs: number;
  tactic: TacticId;
  retestCaseId: string;
  dueTs: number;
  attempts: number;
  status: RetestStatus;
}

export function loadRetests(): Retest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Retest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRetests(list: Retest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable */
  }
  window.dispatchEvent(new Event("milverse:retests"));
}

/** Latest history entry (by ts) per caseId. */
function latestByCase(profile: TrustProfile): Map<string, TrustProfile["history"][number]> {
  const m = new Map<string, TrustProfile["history"][number]>();
  const sorted = [...profile.history].sort((a, b) => a.ts - b.ts);
  for (const h of sorted) m.set(h.caseId, h);
  return m;
}

function tacticOf(caseId: string): TacticId | null {
  const s = getScenario(caseId);
  return s?.tactic ?? null;
}

/**
 * Called on a Mirror LOSS (missed_scam / false_alarm).
 * Picks a same-tactic, unplayed-or-unsolved candidate deterministically.
 * Enforces: max 1 pending per tactic, queue cap of 3 (oldest wins).
 */
export function scheduleRetest(
  sourceCaseId: string,
  profile: TrustProfile,
  nowTs: number = Date.now(),
): Retest | null {
  const source = getScenario(sourceCaseId);
  if (!source) return null;
  const tactic = source.tactic;
  const list = loadRetests();

  // Second-loss-on-same-tactic-while-one-pending → no pileup.
  const existingPending = list.find((r) => r.status === "pending" && r.tactic === tactic);
  if (existingPending) return existingPending;

  const maxTier = unlockedMaxTier(profile);
  const latest = latestByCase(profile);

  const candidates = SCENARIOS.filter((s) => {
    if (s.tactic !== tactic) return false;
    if (s.id === sourceCaseId) return false;
    if (s.tier > maxTier) return false;
    const last = latest.get(s.id);
    if (last && (last.result === "correct" || last.result === "lucky_guess")) return false;
    return true;
  }).sort((a, b) => {
    const da = Math.abs(a.tier - source.tier);
    const db = Math.abs(b.tier - source.tier);
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });

  // Truth is NOT filtered — same-tactic REAL cases are valid retests.
  const pick = candidates[0] ?? source;

  const retest: Retest = {
    id: `rt:${sourceCaseId}:${nowTs}`,
    sourceCaseId,
    sourceCaseTitle: source.title,
    sourceTs: nowTs,
    tactic,
    retestCaseId: pick.id,
    dueTs: nowTs + TWO_DAYS_MS,
    attempts: 0,
    status: "pending",
  };

  // Cap queue: keep only pending, drop oldest when we would exceed cap.
  const pending = list.filter((r) => r.status === "pending");
  const closed = list.filter((r) => r.status !== "pending");
  const nextPending = [...pending, retest].sort((a, b) => a.sourceTs - b.sourceTs);
  while (nextPending.length > QUEUE_CAP) nextPending.shift();

  const finalList = [...closed, ...nextPending];
  saveRetests(finalList);
  return retest;
}

/**
 * Pending retests that are due (dueTs <= now) AND whose retestCaseId has
 * not since been solved organically. Also closes any silently-solved
 * pending entries as a side effect (spec: "close silently").
 */
export function dueRetests(profile: TrustProfile, now: number = Date.now()): Retest[] {
  const list = loadRetests();
  const latest = latestByCase(profile);
  let mutated = false;
  const kept: Retest[] = [];
  for (const r of list) {
    if (r.status === "pending") {
      const last = latest.get(r.retestCaseId);
      if (last && (last.result === "correct" || last.result === "lucky_guess")) {
        kept.push({ ...r, status: "closed" });
        mutated = true;
        continue;
      }
    }
    kept.push(r);
  }
  if (mutated) saveRetests(kept);
  return kept.filter((r) => r.status === "pending" && r.dueTs <= now);
}

/** Any pending retest matching this caseId (due or not). */
export function pendingRetestForCase(caseId: string): Retest | null {
  return loadRetests().find((r) => r.status === "pending" && r.retestCaseId === caseId) ?? null;
}

export type RetestResolution =
  | { kind: "none" }
  | { kind: "closed_win"; retest: Retest }
  | { kind: "reschedule"; retest: Retest }
  | { kind: "closed_final"; retest: Retest };

/**
 * Called from the debrief after history is written.
 * `correct` / `lucky_guess` → close. Loss → attempts+1, reschedule or close-final at 2.
 * Returns the retest state captured BEFORE mutation, so the debrief can
 * still speak in the past tense about the source case.
 */
export function resolveRetest(
  caseId: string,
  result: "correct" | "lucky_guess" | "missed_scam" | "false_alarm",
  nowTs: number = Date.now(),
): RetestResolution {
  const list = loadRetests();
  const idx = list.findIndex((r) => r.status === "pending" && r.retestCaseId === caseId);
  if (idx === -1) return { kind: "none" };
  const original = list[idx];
  const isWin = result === "correct" || result === "lucky_guess";

  if (isWin) {
    list[idx] = { ...original, status: "closed" };
    saveRetests(list);
    return { kind: "closed_win", retest: original };
  }

  const attempts = original.attempts + 1;
  if (attempts >= 2) {
    list[idx] = { ...original, attempts, status: "closed" };
    saveRetests(list);
    return { kind: "closed_final", retest: { ...original, attempts } };
  }
  const rescheduled: Retest = { ...original, attempts, dueTs: nowTs + TWO_DAYS_MS };
  list[idx] = rescheduled;
  saveRetests(list);
  return { kind: "reschedule", retest: rescheduled };
}

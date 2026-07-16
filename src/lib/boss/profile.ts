// MILVERSE — Boss Protocol local profile: attempts, wins, badges, rematch state.

import type { BossId, ProtocolMove } from "./types";

const KEY = "milverse.boss.v1";

export interface BossAttempt {
  bossId: BossId;
  variantId: string;
  ts: number;
  outcome: "WIN" | "LOSS_TRANSACTED" | "LOSS_FALSE_ALARM" | "LOSS_PARANOIA";
  winningMove?: ProtocolMove;
}

export interface BossProfile {
  attempts: BossAttempt[];
  badges: string[];
  declassified: BossId[]; // Field Manual pages unlocked
  assignments: { bossId: BossId; assignedAt: number; completed: boolean }[];
}

const empty: BossProfile = { attempts: [], badges: [], declassified: [], assignments: [] };

export function loadBossProfile(): BossProfile {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as BossProfile) } : empty;
  } catch { return empty; }
}

export function saveBossProfile(p: BossProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("milverse:boss"));
}

export function recordBossAttempt(attempt: BossAttempt, badge?: string, declassify?: BossId) {
  const p = loadBossProfile();
  p.attempts.push(attempt);
  if (badge && !p.badges.includes(badge)) p.badges.push(badge);
  if (declassify && !p.declassified.includes(declassify)) p.declassified.push(declassify);
  if (attempt.outcome !== "WIN") {
    // assign remediation training; rematch unlocks after "completion" (marked when they complete
    // any tier case afterwards — for simplicity we auto-complete on next successful attempt).
    if (!p.assignments.some((a) => a.bossId === attempt.bossId && !a.completed)) {
      p.assignments.push({ bossId: attempt.bossId, assignedAt: Date.now(), completed: false });
    }
  } else {
    p.assignments = p.assignments.map((a) =>
      a.bossId === attempt.bossId ? { ...a, completed: true } : a,
    );
  }
  saveBossProfile(p);
}

export function attemptCount(bossId: BossId): number {
  return loadBossProfile().attempts.filter((a) => a.bossId === bossId).length;
}

export function hasPendingAssignment(bossId: BossId): boolean {
  return loadBossProfile().assignments.some((a) => a.bossId === bossId && !a.completed);
}

export function canRematch(bossId: BossId): boolean {
  const p = loadBossProfile();
  const attempts = p.attempts.filter((a) => a.bossId === bossId);
  if (attempts.length === 0) return true;
  // rematch requires completing the assignment (marked by any subsequent WIN across the wing).
  const lastLoss = [...attempts].reverse().find((a) => a.outcome !== "WIN");
  if (!lastLoss) return true; // already won
  const assignment = p.assignments.find((a) => a.bossId === bossId && !a.completed);
  return !assignment;
}

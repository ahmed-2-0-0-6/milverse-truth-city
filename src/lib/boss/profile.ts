// MILVERSE — Boss Protocol local profile: attempts, wins, badges, rematch state.

import type { BossId, ProtocolMove } from "./types";
import { readStore, recoverStore, writeStore } from "@/lib/storage";

// Owner: boss/profile (BossProfile). Bump the suffix on breaking shape
// change; readStore validators are the compatibility gate.
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

function isBossProfileShape(v: unknown): v is Partial<BossProfile> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.attempts !== undefined && !Array.isArray(o.attempts)) return false;
  if (o.badges !== undefined && !Array.isArray(o.badges)) return false;
  if (o.declassified !== undefined && !Array.isArray(o.declassified)) return false;
  if (o.assignments !== undefined && !Array.isArray(o.assignments)) return false;
  return true;
}

export function loadBossProfile(): BossProfile {
  if (typeof window === "undefined") return empty;
  const read = readStore<Partial<BossProfile>>(KEY, isBossProfileShape);
  if (read === "corrupt") {
    const rec = recoverStore<Partial<BossProfile>>(KEY, isBossProfileShape);
    if (rec) return { ...empty, ...rec };
    return empty;
  }
  if (read === null) return empty;
  return { ...empty, ...read };
}

export function saveBossProfile(p: BossProfile): boolean {
  if (typeof window === "undefined") return false;
  const ok = writeStore(KEY, p);
  window.dispatchEvent(new Event("milverse:boss"));
  return ok;
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

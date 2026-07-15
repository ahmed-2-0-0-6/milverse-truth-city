// MILVERSE — Trust Calibration profile + tier progression.
// Persisted in localStorage; no backend.

import type { TierId } from "./scenarios";

export interface HistoryEntry {
  caseId: string;
  tier: TierId;
  verdict: "REAL" | "FAKE";
  truth: "REAL" | "IMPOSTER";
  result: "correct" | "missed_scam" | "false_alarm" | "lucky_guess";
  points: number;
  usedVob?: boolean;
  ts: number;
}

export interface TrustProfile {
  playerId: string;
  casesPlayed: number;
  correctVerdicts: number;
  luckyGuesses: number;
  missedScams: number;
  falseAlarms: number;
  strongProbesTotal: number;
  weakProbesTotal: number;
  wastedPressureTotal: number;
  points: number;
  history: HistoryEntry[];
}

const KEY = "milverse.profile.v2";
const OLD_KEY = "milverse.profile.v1";

function newProfile(): TrustProfile {
  return {
    playerId: crypto.randomUUID(),
    casesPlayed: 0,
    correctVerdicts: 0,
    luckyGuesses: 0,
    missedScams: 0,
    falseAlarms: 0,
    strongProbesTotal: 0,
    weakProbesTotal: 0,
    wastedPressureTotal: 0,
    points: 0,
    history: [],
  };
}

export function loadProfile(): TrustProfile {
  if (typeof window === "undefined") return newProfile();
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) raw = localStorage.getItem(OLD_KEY);
    if (!raw) {
      const p = newProfile();
      localStorage.setItem(KEY, JSON.stringify(p));
      return p;
    }
    const parsed = JSON.parse(raw) as Partial<TrustProfile>;
    return { ...newProfile(), ...parsed, history: parsed.history ?? [] };
  } catch {
    return newProfile();
  }
}

export function saveProfile(p: TrustProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function calibrationLabel(p: TrustProfile): {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
} {
  const total = p.casesPlayed;
  if (total < 2) return { label: "Recruit", tone: "neutral" };
  const miss = p.missedScams / total;
  const fa = p.falseAlarms / total;
  if (miss < 0.2 && fa < 0.2) return { label: "Calibrated", tone: "good" };
  if (miss > 0.4 && fa < 0.2) return { label: "Too Trusting", tone: "warn" };
  if (fa > 0.4 && miss < 0.2) return { label: "Too Paranoid", tone: "warn" };
  return { label: "Miscalibrated", tone: "bad" };
}

/**
 * Highest tier the player has unlocked.
 * Tiers 1–2 are free. Need 2 "correct" (evidence-solid) wins at tier N to unlock N+1.
 */
export function unlockedMaxTier(p: TrustProfile): TierId {
  let unlocked: TierId = 2;
  for (const t of [2, 3, 4] as TierId[]) {
    const wins = p.history.filter((h) => h.tier === t && h.result === "correct").length;
    if (wins >= 2) unlocked = (t + 1) as TierId;
  }
  return unlocked;
}

export function tierWins(p: TrustProfile, tier: TierId): number {
  return p.history.filter((h) => h.tier === tier && h.result === "correct").length;
}

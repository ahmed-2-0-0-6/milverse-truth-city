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
  /** Studio publishes (private + community). Additive XP layer only. */
  publishedCount: number;
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
    publishedCount: 0,
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

/** Additive XP-layer helper — increments Studio publish counter and pings listeners. */
export function incrementPublishedCount(): number {
  const p = loadProfile();
  p.publishedCount = (p.publishedCount ?? 0) + 1;
  saveProfile(p);
  window.dispatchEvent(new Event("milverse:profile"));
  return p.publishedCount;
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

/** Literacy level from cases played + correct verdicts. Cosmetic only. */
export function operatorRank(p: TrustProfile): { rank: string; code: string; next: string | null; progress: number } {
  const c = p.correctVerdicts;
  const tiers: { code: string; rank: string; min: number }[] = [
    { code: "L1", rank: "Reader",        min: 0  },
    { code: "L2", rank: "Fact-checker",  min: 3  },
    { code: "L3", rank: "Analyst",       min: 8  },
    { code: "L4", rank: "Researcher",    min: 16 },
    { code: "L5", rank: "Editor",        min: 28 },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) if (c >= tiers[i].min) idx = i;
  const cur = tiers[idx];
  const nxt = tiers[idx + 1] ?? null;
  const progress = nxt ? Math.min(1, (c - cur.min) / (nxt.min - cur.min)) : 1;
  return { rank: cur.rank, code: cur.code, next: nxt ? nxt.rank : null, progress };
}

/** Short callsign derived from playerId — persistent, no PII. */
export function operatorCallsign(p: TrustProfile): string {
  const alpha = "ALPHA BRAVO CHARLIE DELTA ECHO FOXTROT GOLF HOTEL INDIA JULIET KILO LIMA MIKE NOVEMBER OSCAR PAPA QUEBEC ROMEO SIERRA TANGO UNIFORM VICTOR WHISKEY XRAY YANKEE ZULU".split(" ");
  // stable hash from playerId
  let h = 0;
  for (let i = 0; i < p.playerId.length; i++) h = (h * 31 + p.playerId.charCodeAt(i)) >>> 0;
  const word = alpha[h % alpha.length];
  const num = (h >> 8) % 900 + 100;
  return `${word}-${num}`;
}

// MILVERSE — Noir MIL rank ladder.
// Read-only helpers over the existing profile + manual state.
// Does NOT touch profile schema or scoring math.

import type { TrustProfile } from "@/lib/mirror/profile";

export type RankId =
  | "citizen"
  | "spotter"
  | "analyst"
  | "investigator"
  | "editor"
  | "city-designer";

export interface RankInfo {
  id: RankId;
  code: string;
  name: string;
  tagline: string;
  minXp: number;
}

export const RANKS: RankInfo[] = [
  { id: "citizen",       code: "R0", name: "CITIZEN",        tagline: "You just walked into the city.",           minXp: 0 },
  { id: "spotter",       code: "R1", name: "SPOTTER",        tagline: "You've started to notice the pattern.",     minXp: 60 },
  { id: "analyst",       code: "R2", name: "ANALYST",        tagline: "You name the tactic before you react.",     minXp: 180 },
  { id: "investigator",  code: "R3", name: "INVESTIGATOR",   tagline: "You verify before you believe.",            minXp: 380 },
  { id: "editor",        code: "R4", name: "EDITOR",         tagline: "You correct without breaking people.",      minXp: 640 },
  { id: "city-designer", code: "R5", name: "CITY DESIGNER",  tagline: "You design the future of MIL.",             minXp: 960 },
];

export function computeXp(profile: TrustProfile | null, manualUnlocks: number, publishedStudioCount = 0): number {
  if (!profile) return 0;
  const wins = profile.correctVerdicts * 25;
  const plays = profile.casesPlayed * 5;
  const cal = Math.max(0, profile.casesPlayed - profile.missedScams - profile.falseAlarms) * 8;
  const manual = manualUnlocks * 15;
  const studio = publishedStudioCount * 40;
  return wins + plays + cal + manual + studio;
}

export function rankFromXp(xp: number): { current: RankInfo; next: RankInfo | null; progress: number } {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].minXp) idx = i;
  const current = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  const progress = next ? Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp)) : 1;
  return { current, next, progress };
}

const RANK_KEY = "milverse.rank.v1";

/** Returns the new rank if the player just crossed a threshold since last check. */
export function checkRankUp(currentId: RankId): RankInfo | null {
  if (typeof window === "undefined") return null;
  const prev = localStorage.getItem(RANK_KEY);
  if (prev === currentId) return null;
  localStorage.setItem(RANK_KEY, currentId);
  if (!prev) return null; // don't fire on first ever load
  const prevIdx = RANKS.findIndex((r) => r.id === prev);
  const curIdx = RANKS.findIndex((r) => r.id === currentId);
  if (curIdx > prevIdx) return RANKS[curIdx];
  return null;
}

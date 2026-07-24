// MILVERSE — Your City · economy (Pass 1).
// Deterministic brick payouts. AI never touches this — the numbers come
// from the SAME verdict/result the engine already returned.

import { creditBricks, loadCity, nextAfford } from "./citySave";
import { hasPerk } from "./perks";

export type District = "mirror" | "feed" | "boss" | "first_phone";
export type Verdict =
  | "correct"
  | "missed_scam"
  | "false_alarm"
  | "pyrrhic"
  | "boss_win"
  | "boss_loss";

/** Bricks for one case — pure function, safe to call anywhere. */
export function bricksFor(
  district: District,
  verdict: Verdict,
  tier: number,
): number {
  const t = Math.max(1, Math.min(5, tier | 0));
  let base = 0;
  switch (verdict) {
    case "correct":
      base = 10 + 5 * t;
      break;
    case "pyrrhic":
      base = 5;
      break;
    case "missed_scam":
    case "false_alarm":
      base = 2; // you showed up; that's data
      break;
    case "boss_win":
      base = 30 + 10 * t;
      break;
    case "boss_loss":
      base = 5;
      break;
  }
  if (district === "first_phone" && verdict === "correct") base += 3;
  // School Lv5 perk — First Phone lessons pay double.
  if (district === "first_phone" && hasPerk("school_double_lessons")) base *= 2;
  // Outpost Lv3 perk — +5% on every case (rounded down).
  if (hasPerk("outpost_bonus")) base = Math.floor(base * 1.05);
  return base;
}

export interface AwardedBricks {
  delta: number;
  total: number;
  district: District;
  verdict: Verdict;
  nextBuilding?: { id: string; name: string; remaining: number };
}

/** Credit bricks + fire toast event. Returns payload for callers that want it. */
export function awardBricksForCase(
  district: District,
  verdict: Verdict,
  tier: number,
): AwardedBricks {
  const delta = bricksFor(district, verdict, tier);
  if (delta <= 0) return { delta: 0, total: loadCity().bricks, district, verdict };
  const save = creditBricks(delta);
  const next = nextAfford(save);
  const payload: AwardedBricks = {
    delta,
    total: save.bricks,
    district,
    verdict,
    nextBuilding: next
      ? { id: next.id, name: next.id.replace(/_/g, " "), remaining: next.remaining }
      : undefined,
  };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("milverse:bricks", { detail: payload }));
  }
  return payload;
}

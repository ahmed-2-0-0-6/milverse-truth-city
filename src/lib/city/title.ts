// MILVERSE — Your City · Mayor Title (Phase 3).
// Deterministic evolving title based on plots built + lifetime bricks.
// Pure derivation. Presentation only.

import type { CitySave } from "./citySave";
import { plotsBuilt } from "./citySave";

export interface CityTitle {
  rank: string;   // e.g. "CONSTABLE"
  seat: string;   // e.g. "Outpost desk"
  step: number;   // 0..5
}

const LADDER: Array<{ rank: string; seat: string; plots: number; bricks: number }> = [
  { rank: "CONSTABLE",     seat: "Outpost desk",           plots: 0, bricks: 0 },
  { rank: "INSPECTOR",     seat: "Library reading room",   plots: 2, bricks: 100 },
  { rank: "CHIEF",         seat: "Newsroom corner office", plots: 4, bricks: 400 },
  { rank: "COMMISSIONER",  seat: "Watchtower balcony",     plots: 6, bricks: 900 },
  { rank: "MAYOR",         seat: "City Hall",              plots: 7, bricks: 1600 },
  { rank: "GOVERNOR",      seat: "The Clean Room",         plots: 8, bricks: 3000 },
];

export function titleFor(save: CitySave): CityTitle {
  const built = plotsBuilt(save);
  const bricks = save.bricksLifetime | 0;
  let step = 0;
  for (let i = LADDER.length - 1; i >= 0; i--) {
    if (built >= LADDER[i].plots && bricks >= LADDER[i].bricks) {
      step = i;
      break;
    }
  }
  const cur = LADDER[step];
  return { rank: cur.rank, seat: cur.seat, step };
}

export function nextTitle(save: CitySave): { rank: string; plotsNeeded: number; bricksNeeded: number } | null {
  const built = plotsBuilt(save);
  const bricks = save.bricksLifetime | 0;
  for (let i = 0; i < LADDER.length; i++) {
    const r = LADDER[i];
    if (built < r.plots || bricks < r.bricks) {
      return {
        rank: r.rank,
        plotsNeeded: Math.max(0, r.plots - built),
        bricksNeeded: Math.max(0, r.bricks - bricks),
      };
    }
  }
  return null;
}

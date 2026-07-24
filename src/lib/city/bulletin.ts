// MILVERSE — Your City · Bulletin (Phase 3).
// Deterministic, in-world headlines derived from CitySave. No AI, no I/O.
// Same save state -> same headline order. Ticker draws these directly.

import type { CitySave } from "./citySave";
import { plotsBuilt } from "./citySave";
import { BUILDINGS_BY_ID } from "./buildings";
import { activePerks } from "./perks";

export interface Bulletin {
  id: string;
  kicker: string; // short tag, e.g. "CITY DESK"
  text: string;
}

const KICKERS = {
  desk: "CITY DESK",
  wire: "WIRE",
  hall: "CITY HALL",
  press: "PRESSROOM",
  street: "STREET",
} as const;

/** Derive a stable, opinionated list of ticker lines from the current save. */
export function bulletinsFor(save: CitySave): Bulletin[] {
  const out: Bulletin[] = [];
  const built = plotsBuilt(save);
  const lifetime = save.bricksLifetime | 0;
  const perks = activePerks(save);

  // First-visit welcome.
  if (built <= 1 && lifetime === 0) {
    out.push({
      id: "welcome",
      kicker: KICKERS.hall,
      text: "One outpost. One lamp. The rest of the map is yours to build.",
    });
  }

  // Population / literacy proxies (mirror the HUD numbers).
  const pop = built * 1200 + lifetime * 3;
  out.push({
    id: "pop",
    kicker: KICKERS.desk,
    text: `Population count clears ${pop.toLocaleString()} tonight.`,
  });

  // Per-building color, only for the ones that exist.
  for (const [id, entry] of Object.entries(save.buildings)) {
    const lvl = entry?.level ?? 0;
    if (lvl <= 0) continue;
    const def = BUILDINGS_BY_ID[id as keyof typeof BUILDINGS_BY_ID];
    if (!def) continue;
    if (lvl >= def.maxLevel) {
      out.push({
        id: `max-${id}`,
        kicker: KICKERS.wire,
        text: `${def.name} runs at full capacity. Perk holds: ${def.perkAtMax}`,
      });
    } else if (lvl >= 2) {
      out.push({
        id: `up-${id}`,
        kicker: KICKERS.street,
        text: `${def.name} expands to Level ${lvl}. ${def.tagline}`,
      });
    }
  }

  // Active perk callouts.
  for (const p of perks) {
    out.push({
      id: `perk-${p.id}`,
      kicker: KICKERS.hall,
      text: `Perk active: ${p.title} — ${p.blurb}`,
    });
  }

  // Bricks milestone.
  if (lifetime >= 500) {
    out.push({
      id: "milestone-500",
      kicker: KICKERS.press,
      text: `Treasury logs ${lifetime.toLocaleString()} bricks moved through the city.`,
    });
  }

  // Always end with a maxim so the ticker never feels empty.
  out.push({
    id: "maxim",
    kicker: KICKERS.desk,
    text: "Verify. Don't guess. Calibrate. Don't panic.",
  });

  return out;
}

// MILVERSE — Your City · perks (Pass 1).
// Presentation/UX affordances only. NEVER change what "correct" means.
// Pure reads from citySave — safe to call from any surface, any render.

import { loadCity, levelOf } from "./citySave";
import type { BuildingId } from "./buildings";

export type PerkId =
  | "outpost_bonus" // Outpost Lv3 → +5% BRICKS
  | "library_manual_autoopen" // Library Lv5 → auto-open relevant Manual entries
  | "school_double_lessons" // School Lv5 → First Phone lessons pay 2×
  | "signal_hint" // Signal Tower Lv5 → one hint per case
  | "archive_cold_reads" // Archive Lv5 → Cold Read replays
  | "clean_room_tier5" // Clean Room Lv3 → Tier-5 Boss cases
  | "watchtower_suspected_line"; // Watchtower Lv3 → global most-suspected line

const REQUIREMENTS: Record<PerkId, { id: BuildingId; level: number }> = {
  outpost_bonus: { id: "outpost", level: 3 },
  library_manual_autoopen: { id: "library", level: 5 },
  school_double_lessons: { id: "school", level: 5 },
  signal_hint: { id: "signal_tower", level: 5 },
  archive_cold_reads: { id: "archive", level: 5 },
  clean_room_tier5: { id: "clean_room", level: 3 },
  watchtower_suspected_line: { id: "watchtower", level: 3 },
};

/** True iff the required building is at the required level. */
export function hasPerk(id: PerkId): boolean {
  const req = REQUIREMENTS[id];
  if (!req) return false;
  const save = loadCity();
  return levelOf(save, req.id) >= req.level;
}

const PERK_COPY: Record<PerkId, { title: string; blurb: string }> = {
  outpost_bonus:              { title: "Outpost Bonus",   blurb: "+5% BRICKS on every case." },
  library_manual_autoopen:    { title: "Auto-Manual",     blurb: "Field Manual opens on relevant cases." },
  school_double_lessons:      { title: "Double Lessons",  blurb: "First Phone lessons pay 2× BRICKS." },
  signal_hint:                { title: "One Hint",        blurb: "One VERIFY hint per case." },
  archive_cold_reads:         { title: "Cold Reads",      blurb: "Replay solved cases on the drill clock." },
  clean_room_tier5:           { title: "Tier-5 Access",   blurb: "Unlocks Tier-5 Boss cases." },
  watchtower_suspected_line:  { title: "Most-Suspected",  blurb: "Global suspected-line on every case." },
};

/** Return the perks that are currently unlocked, given the current save. */
export function activePerks(save?: import("./citySave").CitySave): Array<{ id: PerkId; title: string; blurb: string }> {
  const s = save ?? loadCity();
  const out: Array<{ id: PerkId; title: string; blurb: string }> = [];
  (Object.keys(REQUIREMENTS) as PerkId[]).forEach((id) => {
    const req = REQUIREMENTS[id];
    if (levelOf(s, req.id) >= req.level) {
      out.push({ id, ...PERK_COPY[id] });
    }
  });
  return out;
}

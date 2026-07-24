// MILVERSE — Your City · building registry (Pass 1).
// Data-only. No React, no side effects. Numbers here are opinions, not law —
// tunable during pilot without touching engine or scenario ground truth.

export type BuildingId =
  | "outpost"
  | "library"
  | "school"
  | "newsroom"
  | "signal_tower"
  | "archive"
  | "clean_room"
  | "watchtower";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  tagline: string; // one-line what it stands for
  flavor: string; // debrief blurb at Lv1
  wired: boolean; // Pass 1 only wires outpost/library/school
  unlockCost: number; // bricks to raise Lv1 (=first upgrade cost)
  upgradeCosts: number[]; // cost[i] = bricks to go from level i → i+1
  maxLevel: number; // === upgradeCosts.length
  perkAtMax: string; // human summary; live perk logic in perks.ts
  district: "core" | "learn" | "press" | "signals" | "records" | "elite";
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: "outpost",
    name: "The Outpost",
    tagline: "Where you clock in.",
    flavor: "One desk, one lamp. You start every shift here.",
    wired: true,
    unlockCost: 0,
    upgradeCosts: [0, 40, 100], // Lv1 free (given), Lv2 40, Lv3 100
    maxLevel: 3,
    perkAtMax: "+5% BRICKS on every case.",
    district: "core",
  },
  {
    id: "library",
    name: "The Library",
    tagline: "Every trick, catalogued.",
    flavor: "The Field Manual moved in. The reading room has a leak.",
    wired: true,
    unlockCost: 50,
    upgradeCosts: [50, 120, 240, 420, 700],
    maxLevel: 5,
    perkAtMax: "Field Manual entries auto-open on relevant cases.",
    district: "learn",
  },
  {
    id: "school",
    name: "The School",
    tagline: "The kids get here first.",
    flavor: "First Phone graduates walk out with a licence and a spine.",
    wired: true,
    unlockCost: 120,
    upgradeCosts: [120, 240, 420, 700, 1080],
    maxLevel: 5,
    perkAtMax: "First Phone lessons pay double BRICKS.",
    district: "learn",
  },
  // ── Pass 2 stubs (visible on the map as COMING SOON plots) ─────────
  {
    id: "newsroom",
    name: "The Newsroom",
    tagline: "The Paper runs the presses.",
    flavor: "Coming soon. Right now it's a locked door and a hum.",
    wired: false,
    unlockCost: 250,
    upgradeCosts: [250, 500, 900, 1400, 2100],
    maxLevel: 5,
    perkAtMax: "The Paper lets you draft rebuttals.",
    district: "press",
  },
  {
    id: "signal_tower",
    name: "The Signal Tower",
    tagline: "One hint. One shot.",
    flavor: "Coming soon.",
    wired: false,
    unlockCost: 500,
    upgradeCosts: [500, 900, 1600, 2600, 4000],
    maxLevel: 5,
    perkAtMax: "One VERIFY hint per case.",
    district: "signals",
  },
  {
    id: "archive",
    name: "The Archive",
    tagline: "The city's memory.",
    flavor: "Coming soon.",
    wired: false,
    unlockCost: 1000,
    upgradeCosts: [1000, 1800, 3000, 4500, 6500],
    maxLevel: 5,
    perkAtMax: "Replay any solved case as a Cold Read.",
    district: "records",
  },
  {
    id: "clean_room",
    name: "The Clean Room",
    tagline: "Where deepfakes go to die.",
    flavor: "Coming soon.",
    wired: false,
    unlockCost: 2500,
    upgradeCosts: [2500, 4500, 7500],
    maxLevel: 3,
    perkAtMax: "Unlocks Tier-5 Boss cases.",
    district: "elite",
  },
  {
    id: "watchtower",
    name: "The Watchtower",
    tagline: "See what the city sees.",
    flavor: "Coming soon.",
    wired: false,
    unlockCost: 5000,
    upgradeCosts: [5000, 9000, 15000],
    maxLevel: 3,
    perkAtMax: "Most Suspected Line on every case.",
    district: "signals",
  },
];

export const BUILDINGS_BY_ID: Record<BuildingId, BuildingDef> = BUILDINGS.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<BuildingId, BuildingDef>,
);

/** Cost of next upgrade, or null if already at max. Level 0 = not yet built. */
export function nextCost(id: BuildingId, currentLevel: number): number | null {
  const def = BUILDINGS_BY_ID[id];
  if (!def) return null;
  if (currentLevel >= def.maxLevel) return null;
  return def.upgradeCosts[currentLevel] ?? null;
}

export function isMaxed(id: BuildingId, currentLevel: number): boolean {
  const def = BUILDINGS_BY_ID[id];
  return !!def && currentLevel >= def.maxLevel;
}

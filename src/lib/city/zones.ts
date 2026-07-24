// MILVERSE — Your City · zoning + rank gates (presentation layer).
// Pure derivation. No side effects, no storage writes, no engine coupling.
// The city opens up as your rank climbs: whole districts stay dark, and
// individual plots stay chained, until the badge says otherwise.

import type { BuildingId } from "./buildings";

/** Mirrors the ladder in title.ts (step 0..5). */
export const RANK_NAMES = [
  "CONSTABLE",
  "INSPECTOR",
  "CHIEF",
  "COMMISSIONER",
  "MAYOR",
  "GOVERNOR",
] as const;

export function rankName(step: number): string {
  return RANK_NAMES[Math.max(0, Math.min(RANK_NAMES.length - 1, step))];
}

export interface Zone {
  id: string;
  name: string;
  blurb: string;
  step: number; // rank step required to open the district
  cells: Array<[number, number]>;
}

/** 5×5 grid, three concentric districts opening outward. */
export const ZONES: Zone[] = [
  {
    id: "central",
    name: "CENTRAL WARD",
    blurb: "The desk, the reading room, the school run.",
    step: 0,
    cells: cellsWhere((gx, gy) => gy <= 2),
  },
  {
    id: "works",
    name: "THE WORKS",
    blurb: "Print shops and back lots. Opens at CHIEF.",
    step: 2,
    cells: cellsWhere((_gx, gy) => gy === 3),
  },
  {
    id: "rim",
    name: "OUTER RIM",
    blurb: "Towers, vaults, clean rooms. Opens at COMMISSIONER.",
    step: 3,
    cells: cellsWhere((_gx, gy) => gy === 4),
  },
];

function cellsWhere(pred: (gx: number, gy: number) => boolean): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let gy = 0; gy < 5; gy++)
    for (let gx = 0; gx < 5; gx++) if (pred(gx, gy)) out.push([gx, gy]);
  return out;
}

const CELL_ZONE = new Map<string, Zone>();
for (const z of ZONES) for (const [gx, gy] of z.cells) CELL_ZONE.set(`${gx}-${gy}`, z);

export function zoneOfCell(gx: number, gy: number): Zone {
  return CELL_ZONE.get(`${gx}-${gy}`) ?? ZONES[0];
}

export function cellLocked(gx: number, gy: number, step: number): boolean {
  return zoneOfCell(gx, gy).step > step;
}

/** Rank step at which each plot's permit is issued. */
export const BUILDING_RANK: Record<BuildingId, number> = {
  outpost: 0,
  library: 0,
  school: 0,
  signal_tower: 1,
  archive: 1,
  newsroom: 2,
  watchtower: 3,
  clean_room: 4,
};

export interface LockInfo {
  locked: boolean;
  needStep: number;
  needRank: string;
  zone: Zone;
  /** "zone" when the whole district is dark, "permit" when only the plot is. */
  kind: "zone" | "permit" | "open";
}

export function buildingLock(
  id: BuildingId,
  cell: [number, number],
  step: number,
): LockInfo {
  const zone = zoneOfCell(cell[0], cell[1]);
  const permit = BUILDING_RANK[id] ?? 0;
  const needStep = Math.max(zone.step, permit);
  const locked = needStep > step;
  return {
    locked,
    needStep,
    needRank: rankName(needStep),
    zone,
    kind: !locked ? "open" : zone.step > step ? "zone" : "permit",
  };
}

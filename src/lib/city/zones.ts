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

/** The board. 9×9 — a city with outskirts, not a courtyard. */
export const GRID = 9;
export const CENTER = 4;

/** Chebyshev ring from the plaza: 0 at the fountain, 4 at the city limits. */
export function ringOf(gx: number, gy: number): number {
  return Math.max(Math.abs(gx - CENTER), Math.abs(gy - CENTER));
}

/** Five districts, opening outward ring by ring as the badge gets heavier. */
export const ZONES: Zone[] = [
  {
    id: "central",
    name: "CENTRAL WARD",
    blurb: "The desk, the reading room, the school run.",
    step: 0,
    cells: cellsWhere((gx, gy) => ringOf(gx, gy) <= 1),
  },
  {
    id: "works",
    name: "THE WORKS",
    blurb: "Print shops and back lots. Opens at INSPECTOR.",
    step: 1,
    cells: cellsWhere((gx, gy) => ringOf(gx, gy) === 2),
  },
  {
    id: "rim",
    name: "OUTER RIM",
    blurb: "Ring road, towers, night traffic. Opens at CHIEF.",
    step: 2,
    cells: cellsWhere((gx, gy) => ringOf(gx, gy) === 3),
  },
  {
    id: "docks",
    name: "WEST DOCKS",
    blurb: "Containers, sodium lamps, bad receipts. Opens at COMMISSIONER.",
    step: 3,
    cells: cellsWhere((gx, gy) => ringOf(gx, gy) === 4 && gx < CENTER),
  },
  {
    id: "heights",
    name: "EAST HEIGHTS",
    blurb: "Glass, vaults, clean rooms. Opens at MAYOR.",
    step: 4,
    cells: cellsWhere((gx, gy) => ringOf(gx, gy) === 4 && gx >= CENTER),
  },
];

function cellsWhere(pred: (gx: number, gy: number) => boolean): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let gy = 0; gy < GRID; gy++)
    for (let gx = 0; gx < GRID; gx++) if (pred(gx, gy)) out.push([gx, gy]);
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

/** Where each plot sits on the 9×9 board. Single source of truth. */
export const PLOT_CELL: Record<BuildingId, [number, number]> = {
  outpost: [4, 3],
  library: [3, 5],
  school: [5, 5],
  signal_tower: [2, 2],
  archive: [6, 2],
  newsroom: [1, 5],
  watchtower: [7, 1],
  clean_room: [8, 8],
};

export function buildingLock(id: BuildingId, step: number): LockInfo {
  const cell = PLOT_CELL[id] ?? [CENTER, CENTER];

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

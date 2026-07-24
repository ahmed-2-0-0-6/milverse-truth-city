// MILVERSE — Your City · payroll (the city works while you're gone).
// Deterministic. No AI, no server. Buildings produce bricks per hour;
// the ledger fills up to a cap and waits for you to come collect it.

import { BUILDINGS_BY_ID, type BuildingId } from "./buildings";
import { levelOf, type CitySave } from "./citySave";

/** Bricks per hour, per level, by district. Tunable during pilot. */
const RATE: Record<string, number> = {
  core: 2,
  learn: 3,
  press: 4,
  signals: 5,
  records: 6,
  elite: 8,
};

/** Hours of production the ledger can hold before it stops filling. */
export const CAP_HOURS = 8;

/** Total bricks per hour the city currently produces. */
export function yieldPerHour(save: CitySave): number {
  let sum = 0;
  for (const def of Object.values(BUILDINGS_BY_ID)) {
    const lv = levelOf(save, def.id as BuildingId);
    if (lv <= 0) continue;
    sum += (RATE[def.district] ?? 2) * lv;
  }
  return sum;
}

/** Max bricks the ledger can hold. */
export function capacity(save: CitySave): number {
  return Math.floor(yieldPerHour(save) * CAP_HOURS);
}

export interface Ledger {
  accrued: number; // whole bricks waiting
  perHour: number;
  cap: number;
  full: boolean;
  /** 0..1 — how full the ledger is. */
  fill: number;
  /** ms until the next whole brick lands (null when idle or full). */
  msToNext: number | null;
}

/** What's sitting in the ledger right now. */
export function readLedger(save: CitySave, now = Date.now()): Ledger {
  const perHour = yieldPerHour(save);
  const cap = Math.floor(perHour * CAP_HOURS);
  const since = Math.max(0, now - (save.lastCollect ?? save.lastVisit ?? now));
  const raw = (perHour * since) / 3_600_000;
  const accrued = Math.max(0, Math.min(cap, Math.floor(raw)));
  const full = cap > 0 && accrued >= cap;
  return {
    accrued,
    perHour,
    cap,
    full,
    fill: cap > 0 ? accrued / cap : 0,
    msToNext:
      perHour <= 0 || full
        ? null
        : Math.max(0, Math.ceil((Math.floor(raw) + 1 - raw) * (3_600_000 / perHour))),
  };
}

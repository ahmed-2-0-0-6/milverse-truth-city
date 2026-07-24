// MILVERSE — Your City · save state (Pass 1).
// localStorage-first, guarded via storage.ts. Never throws.
// Emits `milverse:city` after any mutation so UI stays in sync.

import { readStore, writeStore } from "@/lib/storage";
import type { BuildingId } from "./buildings";
import { BUILDINGS_BY_ID, nextCost, isMaxed } from "./buildings";

const KEY = "milverse.city.v1";

export interface CitySave {
  v: 1;
  bricks: number; // current spendable
  bricksLifetime: number; // for prestige / rank hooks
  buildings: Partial<Record<BuildingId, { level: number }>>;
  lastVisit: number;
  /** When the payroll ledger was last emptied. Optional on old saves. */
  lastCollect?: number;

}

function defaultSave(): CitySave {
  return {
    v: 1,
    bricks: 0,
    bricksLifetime: 0,
    buildings: {
      // Outpost is a gift — Lv1 on first visit so the map isn't empty.
      outpost: { level: 1 },
    },
    lastVisit: Date.now(),
  };
}

function isValid(v: unknown): v is CitySave {
  if (!v || typeof v !== "object") return false;
  const c = v as CitySave;
  return (
    c.v === 1 &&
    typeof c.bricks === "number" &&
    typeof c.bricksLifetime === "number" &&
    !!c.buildings &&
    typeof c.buildings === "object"
  );
}

export function loadCity(): CitySave {
  const raw = readStore<CitySave>(KEY, isValid);
  if (raw && raw !== "corrupt") return raw;
  // Corrupt or missing — hand back a fresh save. Never crash the UI.
  const fresh = defaultSave();
  writeStore(KEY, fresh);
  return fresh;
}

function persist(s: CitySave) {
  s.lastVisit = Date.now();
  writeStore(KEY, s);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("milverse:city", { detail: s }));
  }
}

/** Level 0 = not built, else 1..maxLevel. */
export function levelOf(save: CitySave, id: BuildingId): number {
  return save.buildings[id]?.level ?? 0;
}

/** Add bricks. Returns updated save. */
export function creditBricks(amount: number): CitySave {
  if (!Number.isFinite(amount) || amount <= 0) return loadCity();
  const s = loadCity();
  s.bricks += Math.floor(amount);
  s.bricksLifetime += Math.floor(amount);
  persist(s);
  return s;
}

export type UpgradeOutcome =
  | { ok: true; level: number; spent: number }
  | { ok: false; reason: "maxed" | "insufficient" | "unknown" };

/** Build or upgrade one level. Deducts bricks. Idempotent-safe. */
export function upgradeBuilding(id: BuildingId): UpgradeOutcome {
  const def = BUILDINGS_BY_ID[id];
  if (!def) return { ok: false, reason: "unknown" };
  const s = loadCity();
  const cur = levelOf(s, id);
  if (isMaxed(id, cur)) return { ok: false, reason: "maxed" };
  const cost = nextCost(id, cur);
  if (cost === null) return { ok: false, reason: "maxed" };
  if (s.bricks < cost) return { ok: false, reason: "insufficient" };
  s.bricks -= cost;
  s.buildings[id] = { level: cur + 1 };
  persist(s);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("milverse:city:built", { detail: { id, level: cur + 1 } }),
    );
  }
  return { ok: true, level: cur + 1, spent: cost };
}

/** Empty the payroll ledger into your bricks. Returns what was collected. */
export function collectPayroll(amount: number): { collected: number; save: CitySave } {
  const s = loadCity();
  const take = Math.max(0, Math.floor(amount));
  s.lastCollect = Date.now();
  if (take > 0) {
    s.bricks += take;
    s.bricksLifetime += take;
  }
  persist(s);
  if (typeof window !== "undefined" && take > 0) {
    window.dispatchEvent(
      new CustomEvent("milverse:city:payroll", { detail: { collected: take } }),
    );
  }
  return { collected: take, save: s };
}

/** Count of built plots (level ≥ 1). */

export function plotsBuilt(save: CitySave): number {
  return Object.values(save.buildings).filter((b) => (b?.level ?? 0) > 0).length;
}

/** DEV-only reset. Wired to Profile page later. */
export function resetCity(): void {
  writeStore(KEY, defaultSave());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("milverse:city"));
  }
}

/** Convenience for UI — the "next thing you could afford" hint. */
export function nextAfford(save: CitySave): {
  id: BuildingId;
  cost: number;
  remaining: number;
} | null {
  let best: { id: BuildingId; cost: number; remaining: number } | null = null;
  for (const def of Object.values(BUILDINGS_BY_ID)) {
    const cur = levelOf(save, def.id);
    const cost = nextCost(def.id, cur);
    if (cost === null) continue;
    const remaining = Math.max(0, cost - save.bricks);
    if (!best || remaining < best.remaining) {
      best = { id: def.id, cost, remaining };
    }
  }
  return best;
}

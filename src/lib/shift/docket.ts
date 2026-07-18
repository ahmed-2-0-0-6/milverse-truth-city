// MILVERSE — THE SHIFT: docket composer.
// Pure and deterministic. Given (dateKey + unlocked tier), returns 5 slots
// (3 Mirror + 2 Feed, interleaved M-F-M-F-M) with a truth-mix guarantee.
// Same inputs → same docket. Composer sees truth to enforce the mix; the
// PLAYER never gets it (chrome keys off shift state, never truth).

import { SCENARIOS, type Scenario } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS, type FeedScenario } from "@/lib/feed/scenarios";
import type { TrustProfile } from "@/lib/mirror/profile";
import { unlockedMaxTier } from "@/lib/mirror/profile";

export interface SlotRef {
  kind: "mirror" | "feed";
  id: string;
  tier: number;
}

export interface Docket {
  caseRefs: SlotRef[]; // exactly 5, ordered
  seed: string; // short hash label
  maxTier: number;
}

// FNV-1a 32-bit, deterministic across browsers.
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function shortHash(input: string): string {
  return hash32(input).toString(16).slice(-6).toUpperCase().padStart(6, "0");
}

function mirrorTruth(s: Scenario): "REAL" | "IMPOSTER" {
  return s.truth;
}

function feedTruthClass(s: FeedScenario): string {
  return s.verdict;
}

/**
 * Deterministic pick from `pool` at (dateKey, slot). Walks forward through
 * the pool from the seeded index until `accept(candidate)` returns true; if
 * nothing accepts, returns the seeded pick unchanged. Pool must be non-empty.
 */
function pickWithGuard<T>(
  pool: T[],
  dateKey: string,
  slot: number,
  accept: (candidate: T) => boolean,
): T {
  if (pool.length === 0) throw new Error("[shift] empty pool");
  const start = hash32(`${dateKey}:${slot}`) % pool.length;
  for (let step = 0; step < pool.length; step++) {
    const cand = pool[(start + step) % pool.length];
    if (accept(cand)) return cand;
  }
  return pool[start];
}

export function buildDocket(dateKey: string, profile: TrustProfile): Docket {
  const maxTier = unlockedMaxTier(profile);
  const mirrorPool = SCENARIOS.filter((s) => s.tier <= maxTier);
  const feedPool = FEED_SCENARIOS.filter((s) => s.tier <= maxTier);
  // Fallbacks: brand-new player might have T1-only pools; both should have
  // enough entries at T1 in the shipping content, but guard anyway.
  const mirrorSafe = mirrorPool.length > 0 ? mirrorPool : SCENARIOS.filter((s) => s.tier === 1);
  const feedSafe = feedPool.length > 0 ? feedPool : FEED_SCENARIOS.filter((s) => s.tier === 1);

  const mirrorPicked: Scenario[] = [];
  for (let i = 0; i < 3; i++) {
    const s = pickWithGuard(mirrorSafe, dateKey, i * 2, (c) => {
      if (mirrorPicked.some((p) => p.id === c.id)) return false;
      // Guard on the third slot: refuse if it would make all three share a truth.
      if (i === 2 && mirrorPicked.length === 2) {
        const truths = new Set(mirrorPicked.map(mirrorTruth));
        if (truths.size === 1 && mirrorTruth(c) === [...truths][0]) return false;
      }
      return true;
    });
    mirrorPicked.push(s);
  }

  const feedPicked: FeedScenario[] = [];
  for (let i = 0; i < 2; i++) {
    const f = pickWithGuard(feedSafe, dateKey, i * 2 + 1, (c) => {
      if (feedPicked.some((p) => p.id === c.id)) return false;
      if (i === 1 && feedPicked.length === 1) {
        // Prefer a different verdict class for the second feed slot.
        if (feedTruthClass(feedPicked[0]) === feedTruthClass(c)) return false;
      }
      return true;
    });
    feedPicked.push(f);
  }

  // Interleave M-F-M-F-M.
  const caseRefs: SlotRef[] = [
    { kind: "mirror", id: mirrorPicked[0].id, tier: mirrorPicked[0].tier },
    { kind: "feed", id: feedPicked[0].id, tier: feedPicked[0].tier },
    { kind: "mirror", id: mirrorPicked[1].id, tier: mirrorPicked[1].tier },
    { kind: "feed", id: feedPicked[1].id, tier: feedPicked[1].tier },
    { kind: "mirror", id: mirrorPicked[2].id, tier: mirrorPicked[2].tier },
  ];

  return {
    caseRefs,
    seed: shortHash(`${dateKey}:${maxTier}`),
    maxTier,
  };
}

/** Convert a SlotRef into the caseId string that will appear in HistoryEntry.caseId. */
export function historyKey(ref: SlotRef): string {
  return ref.kind === "mirror" ? ref.id : `feed:${ref.id}`;
}

/** UTC+5 (Asia/Karachi) YYYY-MM-DD. Matches Daily Drop dateKey semantics. */
export function shiftDateKey(now: Date = new Date()): string {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const pk = new Date(utcMs + 5 * 60 * 60_000);
  const y = pk.getUTCFullYear();
  const m = String(pk.getUTCMonth() + 1).padStart(2, "0");
  const d = String(pk.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Title lookup for the punch-out card. Returns "" for unknown ids. */
export function slotTitle(ref: SlotRef): string {
  if (ref.kind === "mirror") return SCENARIOS.find((s) => s.id === ref.id)?.title ?? "";
  return FEED_SCENARIOS.find((s) => s.id === ref.id)?.title ?? "";
}

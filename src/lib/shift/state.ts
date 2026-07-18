// MILVERSE — THE SHIFT: ledger + scoring.
// Storage-only. No engine diffs; the shift wraps existing case flows and
// mirrors their outcomes into its own ledger. Pure scoring functions are
// exported for tests.

import { readStore, writeStore } from "@/lib/storage";
import { buildDocket, historyKey, shiftDateKey, type Docket, type SlotRef } from "./docket";
import { loadProfile, type TrustProfile, type HistoryEntry } from "@/lib/mirror/profile";

export type SlotOutcome =
  | { kind: "clean"; points: number; combo: number; speedBonus: number }
  | { kind: "lucky"; points: number }
  | { kind: "loss" };

export interface SlotResult {
  slot: number; // 0..4
  ref: SlotRef;
  historyKey: string;
  result: HistoryEntry["result"]; // "correct" | "missed_scam" | "false_alarm" | "lucky_guess"
  outcome: SlotOutcome;
  pointsDelta: number;
  livesAfter: number;
  comboAfter: number;
  elapsedMs: number;
  ts: number;
}

export interface ActiveShift {
  dateKey: string;
  seed: string;
  maxTier: number;
  caseRefs: SlotRef[];
  slot: number; // next slot to play (0..5)
  lives: number; // 0..3
  combo: number; // 1..4
  score: number;
  bestCombo: number;
  results: SlotResult[];
  startedAt: number;
}

export interface FinishedShift {
  dateKey: string;
  seed: string;
  maxTier: number;
  score: number;
  livesLeft: number;
  bestCombo: number;
  results: SlotResult[];
  bust: boolean;
  endedAt: number;
}

export interface ShiftLedger {
  active: ActiveShift | null;
  best: Record<string, number>; // seed → high score
  history: FinishedShift[]; // most recent last, capped at 20
  playedDates: string[]; // dateKeys of finished shifts (one shift per day)
}

// Owner: shift ledger. Bump suffix on breaking shape change.
const KEY = "milverse.shift.v1";
const MAX_COMBO = 4;
const CLEAN_BASE = 100;
const LUCKY_POINTS = 40;
const SPEED_BONUS = 25;
const SPEED_THRESHOLD_MS = 3 * 60_000;
const START_LIVES = 3;

function isLedgerShape(v: unknown): v is Partial<ShiftLedger> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.history !== undefined && !Array.isArray(o.history)) return false;
  if (o.playedDates !== undefined && !Array.isArray(o.playedDates)) return false;
  return true;
}

function emptyLedger(): ShiftLedger {
  return { active: null, best: {}, history: [], playedDates: [] };
}

export function loadLedger(): ShiftLedger {
  const read = readStore<Partial<ShiftLedger>>(KEY, isLedgerShape);
  if (!read || read === "corrupt") return emptyLedger();
  return {
    active: (read.active as ActiveShift | null | undefined) ?? null,
    best: (read.best as Record<string, number> | undefined) ?? {},
    history: (read.history as FinishedShift[] | undefined) ?? [],
    playedDates: (read.playedDates as string[] | undefined) ?? [],
  };
}

function saveLedger(l: ShiftLedger): void {
  writeStore(KEY, l);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("milverse:shift"));
  }
}

/* ── Public helpers ─────────────────────────────────────────────────── */

/** Expire yesterday's abandoned shift silently. Returns true if we cleared one. */
export function reapExpired(now: Date = new Date()): boolean {
  const l = loadLedger();
  if (!l.active) return false;
  if (l.active.dateKey !== shiftDateKey(now)) {
    l.active = null;
    saveLedger(l);
    return true;
  }
  return false;
}

/** Did the player finish a shift today? */
export function playedToday(now: Date = new Date()): boolean {
  const key = shiftDateKey(now);
  return loadLedger().playedDates.includes(key);
}

export function getActiveShift(now: Date = new Date()): ActiveShift | null {
  reapExpired(now);
  return loadLedger().active;
}

/** Clock in a fresh shift. Returns the active shift, or null if one is
 * already in flight / already finished today. */
export function clockIn(now: Date = new Date(), profile: TrustProfile = loadProfile()): ActiveShift | null {
  reapExpired(now);
  const l = loadLedger();
  const dateKey = shiftDateKey(now);
  if (l.playedDates.includes(dateKey)) return null;
  if (l.active) return l.active;
  const docket = buildDocket(dateKey, profile);
  const active: ActiveShift = {
    dateKey,
    seed: docket.seed,
    maxTier: docket.maxTier,
    caseRefs: docket.caseRefs,
    slot: 0,
    lives: START_LIVES,
    combo: 1,
    score: 0,
    bestCombo: 1,
    results: [],
    startedAt: now.getTime(),
  };
  l.active = active;
  saveLedger(l);
  return active;
}

/** Returns the currently-open slot ref (the one the player should be
 * playing), or null. */
export function currentSlot(now: Date = new Date()): { ref: SlotRef; index: number } | null {
  const active = getActiveShift(now);
  if (!active) return null;
  if (active.slot >= active.caseRefs.length) return null;
  return { ref: active.caseRefs[active.slot], index: active.slot };
}

/** Is `caseId` (raw mirror id OR "feed:<id>") the current slot? */
export function isSlotFor(caseHistoryKey: string, now: Date = new Date()): boolean {
  const s = currentSlot(now);
  if (!s) return false;
  return historyKey(s.ref) === caseHistoryKey;
}

/* ── Scoring (pure) ─────────────────────────────────────────────────── */

export function scoreSlot(
  result: HistoryEntry["result"],
  comboBefore: number,
  elapsedMs: number,
): { outcome: SlotOutcome; pointsDelta: number; comboAfter: number; livesDelta: number } {
  if (result === "correct") {
    const combo = Math.max(1, Math.min(MAX_COMBO, comboBefore));
    const base = CLEAN_BASE * combo;
    const speed = elapsedMs > 0 && elapsedMs < SPEED_THRESHOLD_MS ? SPEED_BONUS : 0;
    return {
      outcome: { kind: "clean", points: base, combo, speedBonus: speed },
      pointsDelta: base + speed,
      comboAfter: Math.min(MAX_COMBO, combo + 1),
      livesDelta: 0,
    };
  }
  if (result === "lucky_guess") {
    return {
      outcome: { kind: "lucky", points: LUCKY_POINTS },
      pointsDelta: LUCKY_POINTS,
      comboAfter: 1,
      livesDelta: 0,
    };
  }
  // missed_scam OR false_alarm → life lost, combo reset, zero points.
  return {
    outcome: { kind: "loss" },
    pointsDelta: 0,
    comboAfter: 1,
    livesDelta: -1,
  };
}

/**
 * Record the outcome of the current slot. Idempotent per (dateKey, slot):
 * calling twice with the same live slot returns the already-recorded row
 * so a hot reload doesn't double-score. Returns { recorded, ended, bust }.
 */
export function recordSlot(
  ref: SlotRef,
  result: HistoryEntry["result"],
  slotStartedAt: number,
  now: Date = new Date(),
): { recorded: SlotResult; ended: boolean; bust: boolean } | null {
  const l = loadLedger();
  const a = l.active;
  if (!a) return null;
  if (a.dateKey !== shiftDateKey(now)) return null;
  // Idempotency: if this slot index already has a result, return it.
  const already = a.results.find((r) => r.slot === a.slot);
  if (already) {
    return { recorded: already, ended: a.slot >= a.caseRefs.length || a.lives <= 0, bust: a.lives <= 0 };
  }
  // Guard against mismatched caseId — do nothing if the current slot is
  // not what the caller ran.
  const currentRef = a.caseRefs[a.slot];
  if (!currentRef || currentRef.kind !== ref.kind || currentRef.id !== ref.id) return null;

  const elapsedMs = Math.max(0, now.getTime() - slotStartedAt);
  const { outcome, pointsDelta, comboAfter, livesDelta } = scoreSlot(result, a.combo, elapsedMs);

  a.score += pointsDelta;
  a.lives = Math.max(0, a.lives + livesDelta);
  a.combo = comboAfter;
  a.bestCombo = Math.max(a.bestCombo, outcome.kind === "clean" ? outcome.combo : 1);

  const recorded: SlotResult = {
    slot: a.slot,
    ref: currentRef,
    historyKey: historyKey(currentRef),
    result,
    outcome,
    pointsDelta,
    livesAfter: a.lives,
    comboAfter,
    elapsedMs,
    ts: now.getTime(),
  };
  a.results.push(recorded);
  a.slot += 1;

  const bust = a.lives <= 0;
  const ended = bust || a.slot >= a.caseRefs.length;

  if (ended) {
    const finished: FinishedShift = {
      dateKey: a.dateKey,
      seed: a.seed,
      maxTier: a.maxTier,
      score: a.score,
      livesLeft: a.lives,
      bestCombo: a.bestCombo,
      results: a.results.slice(),
      bust,
      endedAt: now.getTime(),
    };
    l.history.push(finished);
    if (l.history.length > 20) l.history.splice(0, l.history.length - 20);
    l.best[a.seed] = Math.max(l.best[a.seed] ?? 0, a.score);
    if (!l.playedDates.includes(a.dateKey)) l.playedDates.push(a.dateKey);
    if (l.playedDates.length > 60) l.playedDates.splice(0, l.playedDates.length - 60);
    l.active = null;
  }

  saveLedger(l);
  return { recorded, ended, bust };
}

/** Read the most recent finished shift (for the punch-out route). */
export function lastFinishedShift(): FinishedShift | null {
  const h = loadLedger().history;
  return h.length ? h[h.length - 1] : null;
}

export function bestForSeed(seed: string): number {
  return loadLedger().best[seed] ?? 0;
}

/* ── Per-slot timer (sessionStorage) ────────────────────────────────── */
// Speed pinch: timed from slot entry (dossier / brief mount) to verdict lock.

const SLOT_START_PREFIX = "milverse.shift.slot.";

function slotStartKey(dateKey: string, slot: number): string {
  return `${SLOT_START_PREFIX}${dateKey}.${slot}`;
}

export function markSlotEntered(dateKey: string, slot: number, now: Date = new Date()): number {
  if (typeof window === "undefined") return now.getTime();
  const key = slotStartKey(dateKey, slot);
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return Number(existing) || now.getTime();
    sessionStorage.setItem(key, String(now.getTime()));
    return now.getTime();
  } catch {
    return now.getTime();
  }
}

export function readSlotEnteredAt(dateKey: string, slot: number, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(slotStartKey(dateKey, slot));
    return raw ? Number(raw) || fallback : fallback;
  } catch {
    return fallback;
  }
}

/** Test-only in dev — abandon the active shift without recording it. */
export function abandonActiveShift(): void {
  const l = loadLedger();
  if (!l.active) return;
  l.active = null;
  saveLedger(l);
}

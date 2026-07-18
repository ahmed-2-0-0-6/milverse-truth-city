// MILVERSE — THE MASK · local ledgers.
//
// Two local logs, both device-scoped, both drills (no cloud writes):
//   1. milverse.mask.plays.v1  — receiver's blind plays (FIFO 50)
//   2. milverse.mask.stamps.v1 — sender's ledger stamps (per shareCode)
//   3. milverse.mask.burned.v1 — locally-reported (burned) share codes
//
// This whole system is intentionally offline: masks compete in WhatsApp,
// not on the city board. The designer-board RPC only reads daily_plays
// and community-lane rows, so no leakage possible from mask lanes.

import { readStore, writeStore } from "@/lib/storage";
import type { TokenVerdict } from "./tokens";

/* ── PLAYS ────────────────────────────────────────────────────────── */

export interface MaskPlay {
  caseId: string;
  shareCode: string;
  verdict: "REAL" | "FAKE" | "EXPIRED";
  correct: boolean;
  seconds: number;
  ts: number;
}

const PLAYS_KEY = "milverse.mask.plays.v1";
const PLAYS_CAP = 50;

function isPlaysShape(v: unknown): v is MaskPlay[] {
  return Array.isArray(v);
}

export function loadMaskPlays(): MaskPlay[] {
  if (typeof window === "undefined") return [];
  const r = readStore<MaskPlay[]>(PLAYS_KEY, isPlaysShape);
  return r === null || r === "corrupt" ? [] : r;
}

export function saveMaskPlay(p: MaskPlay): void {
  const cur = loadMaskPlays();
  const next = [...cur, p];
  while (next.length > PLAYS_CAP) next.shift();
  writeStore(PLAYS_KEY, next);
}

/* ── LEDGER STAMPS (designer side) ────────────────────────────────── */

export interface MaskStamp {
  shareCode: string;
  verdict: TokenVerdict;
  seconds: number;
  ts: number;
}

const STAMPS_KEY = "milverse.mask.stamps.v1";

function isStampsShape(v: unknown): v is MaskStamp[] {
  return Array.isArray(v);
}

export function loadMaskStamps(): MaskStamp[] {
  if (typeof window === "undefined") return [];
  const r = readStore<MaskStamp[]>(STAMPS_KEY, isStampsShape);
  return r === null || r === "corrupt" ? [] : r;
}

export function saveMaskStamp(s: MaskStamp): void {
  const cur = loadMaskStamps().filter((x) => x.shareCode !== s.shareCode);
  cur.push(s);
  writeStore(STAMPS_KEY, cur);
}

export function stampsByCode(): Map<string, MaskStamp> {
  const m = new Map<string, MaskStamp>();
  for (const s of loadMaskStamps()) m.set(s.shareCode, s);
  return m;
}

/* ── BURNED CODES ─────────────────────────────────────────────────── */

const BURNED_KEY = "milverse.mask.burned.v1";

function isBurnedShape(v: unknown): v is string[] {
  return Array.isArray(v);
}

export function loadBurned(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const r = readStore<string[]>(BURNED_KEY, isBurnedShape);
  const arr = r === null || r === "corrupt" ? [] : r;
  return new Set(arr.map((s) => s.toUpperCase()));
}

export function burnMask(shareCode: string): void {
  const cur = loadBurned();
  cur.add(shareCode.toUpperCase());
  writeStore(BURNED_KEY, Array.from(cur));
}

export function isBurned(shareCode: string): boolean {
  return loadBurned().has(shareCode.toUpperCase());
}

/* ── MASK MODE ARM (session key, mirror route consumes it) ───────── */

const MASK_ARM_KEY = "milverse.mask.arm";
const MASK_CODE_KEY = "milverse.mask.armCode";

export function armMask(caseId: string, shareCode: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MASK_ARM_KEY, caseId);
    sessionStorage.setItem(MASK_CODE_KEY, shareCode.toUpperCase());
  } catch {
    /* noop */
  }
}

export function consumeMaskArm(): { caseId: string; shareCode: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(MASK_ARM_KEY);
    const code = sessionStorage.getItem(MASK_CODE_KEY);
    if (!id) return null;
    sessionStorage.removeItem(MASK_ARM_KEY);
    sessionStorage.removeItem(MASK_CODE_KEY);
    return { caseId: id, shareCode: (code ?? "").toUpperCase() };
  } catch {
    return null;
  }
}

export const MASK_START_KEY = "milverse.mask.startTs";

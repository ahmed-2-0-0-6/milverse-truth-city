// MILVERSE — Cold Reads. Mastery replays of previously-solved cases.
//
// THE DRILL LAW: a cold read never writes to profile / points / xp /
// streaks / history / pilot. Its only trace is the log below. Storage
// module used for FIFO cap + quarantine discipline (matches the rest of
// the pilot's cold-storage regime).
//
// Eligibility: a case is eligible only when its LATEST profile.history
// entry is "correct" (solved-shelf rule). Junior cases and /visit skins
// never surface Cold Read affordances (those routes never render Mirror
// case cards).

import { readStore, writeStore } from "@/lib/storage";
import type { TrustProfile } from "./profile";

export interface ColdReadEntry {
  caseId: string;
  ts: number;
  cleared: boolean;
  /** Elapsed drill seconds (drill cap is 240). */
  seconds: number;
}

const KEY = "milverse.coldreads.v1";
const CAP = 50;
const ARM_KEY = "milverse.coldread.arm";

function isEntriesShape(v: unknown): v is ColdReadEntry[] {
  return Array.isArray(v);
}

export function loadColdReads(): ColdReadEntry[] {
  if (typeof window === "undefined") return [];
  const read = readStore<ColdReadEntry[]>(KEY, isEntriesShape);
  if (read === null || read === "corrupt") return [];
  return read;
}

export function saveColdRead(entry: ColdReadEntry): void {
  const cur = loadColdReads();
  const next = [...cur, entry];
  // FIFO cap.
  while (next.length > CAP) next.shift();
  writeStore(KEY, next);
}

/** Fastest cleared run for a case, in seconds — or null if none. */
export function bestClearedSeconds(caseId: string): number | null {
  const all = loadColdReads().filter((e) => e.caseId === caseId && e.cleared);
  if (all.length === 0) return null;
  return all.reduce((m, e) => Math.min(m, e.seconds), Infinity);
}

/** Latest history entry for a case, or undefined. */
function latestFor(profile: TrustProfile, caseId: string) {
  const sorted = [...profile.history].filter((h) => h.caseId === caseId).sort((a, b) => a.ts - b.ts);
  return sorted[sorted.length - 1];
}

/** Solved-shelf rule: latest history entry for this case is "correct". */
export function isColdEligible(profile: TrustProfile, caseId: string): boolean {
  const last = latestFor(profile, caseId);
  return last?.result === "correct";
}

/* ── Arm / consume ─────────────────────────────────────────────────── */

export function armColdRead(caseId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ARM_KEY, caseId);
  } catch {
    /* noop */
  }
}

/** Read-and-clear the arm key. Returns the armed caseId if any. */
export function consumeColdArm(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(ARM_KEY);
    if (v) sessionStorage.removeItem(ARM_KEY);
    return v;
  } catch {
    return null;
  }
}

export function formatDrillTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

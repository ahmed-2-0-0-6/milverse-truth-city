// MILVERSE — The Standoff. Pass-the-phone couch duel.
//
// THE JUDGMENT LAW (spine, mirrored from the arena spec):
//   • The READER is judged like the city judges everyone:
//       missed scam = loss, false alarm = loss.
//   • The WARDEN is judged on FAIRNESS + RESULT:
//       fair pick + reader wrong  → warden wins the round
//       fair pick + reader right  → reader wins, warden holds half
//       unfair pick, any result   → warden LOSES; reader gets 0.5 if correct
//
// THE DRILL LAW: standoff never writes profile/xp/points/history/pilot/tape.
// The mirror route reuses its cold-mode chrome to run the READ, and its debrief
// slot renders <StandoffHandoff/> which navigates back here — the write-heavy
// <Debrief/> component is never mounted, so all the site-effects that live
// inside its useEffect (savedRef) are dead code paths under standoff.
//
// Sole trace: milverse.standoff.v1 (see StandoffLog).

import { readStore, writeStore } from "@/lib/storage";
import type { Scenario, Fact } from "@/lib/mirror/scenarios";

/* ── Fairness ─────────────────────────────────────────────────────────
 * Inline structural check — same shape as editorsDesk.deskReview's
 * tell-exists (imposter needs ≥2 knowledge gaps) and paranoia-check
 * (real needs ≥2 answerable facts). We do not import deskReview because
 * Studio Scenarios carry a Fact[] shape, not a DeskDraft — the underlying
 * heuristic is identical. Reported: INLINE (not deskReview reuse).
 * ──────────────────────────────────────────────────────────────────── */
function factHasBody(f: Fact): boolean {
  const anyText = (f.truth ?? "").trim() + (f.keywords ?? []).join("").trim();
  return anyText.length >= 3;
}

export function isFairPick(s: Scenario): boolean {
  const filled = s.facts.filter(factHasBody);
  if (s.truth === "IMPOSTER") {
    // gaps = facts the imposter can't answer.
    const gaps = filled.filter((f) => !f.isKnownToImposter).length;
    return gaps >= 2;
  }
  // REAL: answerable facts (person has a truth string to give).
  const answerable = filled.filter((f) => (f.truth ?? "").trim().length >= 3).length;
  return answerable >= 2;
}

/* ── Scoring ──────────────────────────────────────────────────────── */

export type Seat = "warden" | "reader";
export type ReaderResult = "correct" | "wrong";
export interface RoundScore { reader: number; warden: number }
export interface RoundCard {
  kind: "fair_reader" | "fair_warden" | "unfair";
  headline: string;
  body: string;
  score: RoundScore;
}

export function scoreRound(input: { fair: boolean; reader: ReaderResult }): RoundCard {
  if (!input.fair) {
    return {
      kind: "unfair",
      headline: "WARDEN LOSES THE ROUND ON AN UNFAIR PICK.",
      body: "An unbeatable file proves nothing and teaches less.",
      score: { warden: 0, reader: input.reader === "correct" ? 0.5 : 0 },
    };
  }
  if (input.reader === "correct") {
    return {
      kind: "fair_reader",
      headline: "READER TAKES THE ROUND.",
      body: "Warden held a fair line — half credit for craft.",
      score: { reader: 1.0, warden: 0.5 },
    };
  }
  return {
    kind: "fair_warden",
    headline: "WARDEN TAKES THE ROUND.",
    body: "The file was beatable. The reader will remember where.",
    score: { warden: 1.0, reader: 0 },
  };
}

export const TWO_WAY_LINE =
  "Missed scams and false alarms cost the same on this couch. Both of you are being graded on the same ledger.";

/* ── Session arming (mirror route hand-off) ───────────────────────── */

const ARM_KEY = "milverse.standoff.arm";
const PENDING_KEY = "milverse.standoff.pending";

export function armStandoff(caseId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ARM_KEY, caseId);
    sessionStorage.setItem(PENDING_KEY, caseId);
  } catch { /* noop */ }
}

export function consumeStandoffArm(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(ARM_KEY);
    if (v) sessionStorage.removeItem(ARM_KEY);
    return v;
  } catch { return null; }
}

export function pendingStandoffCase(): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(PENDING_KEY); } catch { return null; }
}

export function clearPendingStandoff(): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* noop */ }
}

/* ── Log storage (FIFO 20) ────────────────────────────────────────── */

export interface StandoffRoundLog {
  caseId: string;
  fair: boolean;
  reader: ReaderResult;
  seat: { warden: number; reader: number };
  ts: number;
}
export interface StandoffLog { rounds: StandoffRoundLog[] }

const LOG_KEY = "milverse.standoff.v1";
const CAP = 20;

function isLogShape(v: unknown): v is StandoffLog {
  return !!v && typeof v === "object" && Array.isArray((v as StandoffLog).rounds);
}

export function loadStandoffLog(): StandoffLog {
  if (typeof window === "undefined") return { rounds: [] };
  const r = readStore<StandoffLog>(LOG_KEY, isLogShape);
  if (r === null || r === "corrupt") return { rounds: [] };
  return r;
}

export function appendStandoffRounds(rounds: StandoffRoundLog[]): void {
  const cur = loadStandoffLog();
  const next = [...cur.rounds, ...rounds];
  while (next.length > CAP) next.shift();
  writeStore(LOG_KEY, { rounds: next });
}

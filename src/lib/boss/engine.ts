// MILVERSE — Boss Protocol engine.
// Deterministic. No AI. AI only voices SURFACE text; verdict resolves from config.

import type { BossConfig, BossVariant, BossVerdict, ProtocolMove, ProtocolMoveDef } from "./types";

export interface BossState {
  bossId: string;
  variantId: string;
  phaseIdx: number;
  turnCount: number;
  factChecksUsed: string[];    // ids
  movesPlayed: ProtocolMove[]; // in order
  pendingFollowup?: ProtocolMove;
  ended: boolean;
  outcome?: BossOutcome;
}

export type BossOutcome =
  | { kind: "WIN"; badge: string; wasCorrectVerdict: true; usedMoves: ProtocolMove[] }
  | { kind: "LOSS_TRANSACTED"; wasCorrectVerdict: false; reason: "You transacted on an unverified channel." }
  | { kind: "LOSS_FALSE_ALARM"; wasCorrectVerdict: false; reason: "This was a REAL request. Blank refusal cost you. Protocol still wins — HOLD and verify." }
  | { kind: "LOSS_PARANOIA"; wasCorrectVerdict: false; reason: "You tried to fact-check your way out. Every check confirmed the story. That was the trap." };

export function initBoss(boss: BossConfig, variant: BossVariant): BossState {
  return {
    bossId: boss.id,
    variantId: variant.id,
    phaseIdx: 0,
    turnCount: 0,
    factChecksUsed: [],
    movesPlayed: [],
    ended: false,
  };
}

/** Advance pressure phase — each fact-check or filler turn ticks. */
export function tickPressure(state: BossState, boss: BossConfig): BossState {
  const next = { ...state, turnCount: state.turnCount + 1 };
  const phase = boss.phases[state.phaseIdx];
  if (!phase) return next;
  // approximate: escalate after N turns spent in current phase
  const turnsInPhase = state.turnCount % Math.max(1, phase.turnsBeforeEscalate);
  if (turnsInPhase === 0 && state.turnCount > 0 && state.phaseIdx < boss.phases.length - 1) {
    next.phaseIdx = state.phaseIdx + 1;
  }
  return next;
}

/** Player runs a fact-check. Returns the surface result + escalated state. */
export function runFactCheck(
  state: BossState,
  boss: BossConfig,
  variant: BossVariant,
  factId: string,
): { state: BossState; text: string; supportsCoverStory: boolean; provenanceChain?: string[] } {
  const fc = variant.factChecks.find((f) => f.id === factId);
  const next = tickPressure({ ...state, factChecksUsed: [...state.factChecksUsed, factId] }, boss);
  if (!fc) return { state: next, text: "No result.", supportsCoverStory: false };
  return {
    state: next,
    text: fc.result,
    supportsCoverStory: fc.supportsCoverStory,
    provenanceChain: fc.provenanceChain,
  };
}

/** Player plays a protocol move. Returns the move def + updated state. */
export function playMove(
  state: BossState,
  boss: BossConfig,
  variant: BossVariant,
  moveId: ProtocolMove,
): { state: BossState; move: ProtocolMoveDef | null } {
  const move = variant.moves.find((m) => m.id === moveId) ?? null;
  const next = tickPressure({ ...state, movesPlayed: [...state.movesPlayed, moveId] }, boss);
  if (move?.requiresFollowup) next.pendingFollowup = move.requiresFollowup;
  return { state: next, move };
}

/** Player commits to a final verdict. This resolves the case. */
export function resolveVerdict(
  state: BossState,
  boss: BossConfig,
  variant: BossVariant,
  verdict: BossVerdict,
): BossOutcome {
  // COMPLY: transacted. Loss if scam, win only if REAL variant AND at least one protocol move played first.
  if (verdict === "COMPLY_NOW") {
    if (variant.truth === "REAL" && state.movesPlayed.length > 0) {
      return { kind: "WIN", badge: boss.badge.label, wasCorrectVerdict: true, usedMoves: state.movesPlayed };
    }
    return { kind: "LOSS_TRANSACTED", wasCorrectVerdict: false, reason: "You transacted on an unverified channel." };
  }

  // REFUSE_REPORT: blank refuse without protocol. Loss on REAL variant (false alarm).
  if (verdict === "REFUSE_REPORT") {
    if (variant.truth === "REAL") {
      return { kind: "LOSS_FALSE_ALARM", wasCorrectVerdict: false, reason: "This was a REAL request. Blank refusal cost you. Protocol still wins — HOLD and verify." };
    }
    // On SCAM: refuse-and-report is safe but not full win — the doctrine wants HOLD.
    // We treat as PARANOIA loss if the player fact-checked without playing any winning move.
    const playedWin = state.movesPlayed.some((mv) => variant.moves.find((m) => m.id === mv)?.outcome === "WIN");
    if (!playedWin && state.factChecksUsed.length >= 2) {
      return { kind: "LOSS_PARANOIA", wasCorrectVerdict: false, reason: "You tried to fact-check your way out. Every check confirmed the story. That was the trap." };
    }
    return { kind: "WIN", badge: boss.badge.label, wasCorrectVerdict: true, usedMoves: state.movesPlayed };
  }

  // HOLD_UNVERIFIED: the doctrine answer. Wins if the player also played at least one WIN-outcome move for this variant.
  if (verdict === "HOLD_UNVERIFIED") {
    const winMoves = state.movesPlayed.filter((mv) => variant.moves.find((m) => m.id === mv)?.outcome === "WIN");
    if (winMoves.length > 0) {
      return { kind: "WIN", badge: boss.badge.label, wasCorrectVerdict: true, usedMoves: state.movesPlayed };
    }
    // HOLD alone against a SCAM = safe, count as win.
    if (variant.truth === "SCAM") {
      return { kind: "WIN", badge: boss.badge.label, wasCorrectVerdict: true, usedMoves: state.movesPlayed };
    }
    // HOLD alone against REAL variant = false alarm — you never verified.
    return { kind: "LOSS_FALSE_ALARM", wasCorrectVerdict: false, reason: "This was a REAL request. HOLD is right — but you never followed through with verification." };
  }

  return { kind: "LOSS_TRANSACTED", wasCorrectVerdict: false, reason: "Unrecognised verdict." };
}

/** Which line the boss says NOW based on the current phase. */
export function currentPressureLine(state: BossState, boss: BossConfig): { phase: string; line: string } {
  const phase = boss.phases[Math.min(state.phaseIdx, boss.phases.length - 1)];
  const line = phase.scriptedLines[state.turnCount % phase.scriptedLines.length];
  return { phase: phase.label, line };
}

/** Pick a variant deterministically or by count of previous attempts. */
export function pickVariant(boss: BossConfig, previousAttempts: number): BossVariant {
  if (boss.variants.length === 0) return {} as BossVariant;
  return boss.variants[previousAttempts % boss.variants.length];
}

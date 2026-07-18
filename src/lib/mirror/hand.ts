// MILVERSE — THE HAND.
// The Mirror's tactical reply deck. Pure. Deterministic. Truth-blind by
// construction: this module NEVER imports scenario.truth or engine internals.
// A REAL and an IMPOSTER case with the same dossier + facts produce the
// EXACT same hand at the same state. Chips are typed-message texture that
// send through the existing engine as if the player typed them.

import type { Fact, Scenario, TierId } from "@/lib/mirror/scenarios";

export type HandTag = "PROBE" | "PRESS" | "PLAY" | "VERIFY";

export interface HandChip {
  id: string;
  tag: HandTag;
  /** Visible chip label. At T1-2 this equals sendText; T3+ it may compress. */
  label: string;
  /** Text that will be sent through send() as if typed. null = opens VOB. */
  sendText: string | null;
  /** Optional mono 9px hint under the label. */
  hint?: string;
  /** Fact the chip is aimed at (for PROBE / PRESS). */
  factId?: string;
}

/**
 * Narrow slice of Scenario visible to buildHand. Compile-time proof that
 * truth, agenda, persona lines etc. never influence the deck.
 */
export interface HandScenario {
  id: string;
  tier: TierId;
  facts: ReadonlyArray<Pick<Fact, "id" | "keywords">>;
}

/** cheap stable hash over a string. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Shortest natural phrase in a fact's keyword list. */
function bestKeyword(f: Pick<Fact, "keywords">): string {
  const kws = f.keywords.filter((k) => k.trim().length > 0);
  if (kws.length === 0) return "";
  return [...kws].sort((a, b) => a.length - b.length)[0];
}

/** 2-3 word stub from a keyword, for terser T3+ chip labels. */
function stub(kw: string): string {
  const parts = kw.trim().split(/\s+/).slice(0, 3);
  return parts.join(" ");
}

const PROBE_TEMPLATES: ReadonlyArray<(kw: string) => string> = [
  (kw) => `wait — ${kw}?`,
  (kw) => `before anything, ${kw}?`,
  (kw) => `acha, quick one: ${kw}?`,
  (kw) => `one thing first — ${kw}?`,
];

const PLAY_LINES: readonly string[] = [
  "haan, sun raha hun. phir?",
  "hmm. aur?",
  "give me a second to think.",
];

/**
 * Build the hand for the current turn. Deterministic given inputs.
 * @param scenario narrow HandScenario slice — MUST NOT include truth.
 * @param factProbes engine's per-fact probe count (visible to player via chat state).
 * @param turnIndex player's turn count (0-indexed).
 */
export function buildHand(
  scenario: HandScenario,
  factProbes: Record<string, number>,
  turnIndex: number,
): HandChip[] {
  const tier = scenario.tier;
  const useStub = tier >= 3 && tier < 5;

  // ── T5 Clean Room: in-band is a losing game by design. Deck enforces it.
  if (tier === 5) {
    return [playChip(turnIndex), verifyChip(tier)];
  }

  const unprobed = scenario.facts.filter((f) => !factProbes[f.id]);
  const pressable = scenario.facts.filter((f) => (factProbes[f.id] ?? 0) === 1);

  // ── Probed-out: the in-band well is dry. Deck says so without saying what's true.
  const allFactsPressedTwice = scenario.facts.every((f) => (factProbes[f.id] ?? 0) >= 2);
  if (allFactsPressedTwice) {
    return [playChip(turnIndex), verifyChip(tier)];
  }

  const chips: HandChip[] = [];

  // ── PROBE (up to 2) — dossier order, skip probed.
  for (const f of unprobed.slice(0, 2)) {
    const kw = bestKeyword(f);
    if (!kw) continue;
    const tpl = PROBE_TEMPLATES[(hash(f.id) + turnIndex) % PROBE_TEMPLATES.length];
    const sendText = tpl(kw);
    chips.push({
      id: `probe:${f.id}`,
      tag: "PROBE",
      label: useStub ? `ask about ${stub(kw)}…` : sendText,
      sendText,
      factId: f.id,
    });
  }

  // ── PRESS (max 1) — lowest dossier index among asked-once-deflected.
  if (pressable.length > 0) {
    const f = pressable[0];
    const kw = bestKeyword(f);
    if (kw) {
      const sendText = `you didn't answer. ${kw}?`;
      chips.push({
        id: `press:${f.id}`,
        tag: "PRESS",
        label: useStub ? `press: ${stub(kw)}` : sendText,
        sendText,
        factId: f.id,
      });
    }
  }

  // ── PLAY (always 1).
  chips.push(playChip(turnIndex));

  // ── VERIFY (always last).
  chips.push(verifyChip(tier));

  // 4 max. If PROBE + PRESS + PLAY + VERIFY exceeds 4, drop the second PROBE.
  if (chips.length > 4) {
    const firstExtra = chips.findIndex((c, i) => c.tag === "PROBE" && i > 0);
    if (firstExtra >= 0) chips.splice(firstExtra, 1);
  }
  return chips.slice(0, 4);
}

function playChip(turnIndex: number): HandChip {
  const sendText = PLAY_LINES[turnIndex % PLAY_LINES.length];
  return {
    id: `play:${turnIndex % PLAY_LINES.length}`,
    tag: "PLAY",
    label: sendText,
    sendText,
    hint: "keeps them talking",
  };
}

function verifyChip(tier: TierId): HandChip {
  return {
    id: "verify",
    tag: "VERIFY",
    label: "verify another way",
    sendText: null,
    hint: tier >= 4 ? "often the only winning move" : undefined,
  };
}

/** Narrow a full Scenario down to the truth-blind slice. */
export function toHandScenario(s: Scenario): HandScenario {
  return {
    id: s.id,
    tier: s.tier,
    facts: s.facts.map((f) => ({ id: f.id, keywords: f.keywords })),
  };
}

// Local, deterministic opponent engine for The Mirror.
// No external AI. Uses keyword matching against each scenario's fact sheet.

import type { Scenario, Fact } from "./scenarios";

export type MeterType = "composure" | "patience";

export interface Message {
  role: "player" | "contact";
  text: string;
  ts: number;
  factId?: string; // internal — which fact this reply addressed (if any)
  probeQuality?: "strong" | "weak" | "wasted"; // graded for player messages
}

export interface EngineState {
  meter: number; // composure (imposter) or patience (real)
  meterType: MeterType;
  /** how many times the player has probed each fact */
  factProbes: Record<string, number>;
  /** filler / push counters to avoid repetition */
  fillerIdx: number;
  pushIdx: number;
  urgencyIdx: number;
  /** turns since last agenda push (imposter only) */
  turnsSincePush: number;
  /** pinned messages (contact msg indices) — max 5 */
  pins: number[];
  /** internal notes for the debrief */
  internalNotes: string[];
}

export function initState(scenario: Scenario): EngineState {
  return {
    meter: scenario.truth === "IMPOSTER" ? 85 : 80,
    meterType: scenario.truth === "IMPOSTER" ? "composure" : "patience",
    factProbes: {},
    fillerIdx: 0,
    pushIdx: 0,
    urgencyIdx: 0,
    turnsSincePush: 0,
    pins: [],
    internalNotes: [],
  };
}

const ACCUSATION_WORDS = [
  "fake", "scam", "scammer", "liar", "lying", "fraud", "imposter", "impostor",
  "you're not", "youre not", "not really", "prove it", "who really are you",
];

const VERIFICATION_HINTS = [
  "call you", "call back", "video", "voice note", "prove", "verify",
  "how do i know", "meet", "in person",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

function isQuestion(s: string): boolean {
  return /\?|^(what|who|when|where|why|how|which|remember|recall|do you|did you|was|were|is it|are you)/i.test(s.trim());
}

function matchFact(scenario: Scenario, text: string): Fact | undefined {
  const norm = normalize(text);
  for (const f of scenario.facts) {
    for (const kw of f.keywords) {
      if (norm.includes(normalize(kw))) return f;
    }
  }
  return undefined;
}

function isAccusation(text: string): boolean {
  const n = normalize(text);
  return ACCUSATION_WORDS.some((w) => n.includes(w));
}

function isVerification(text: string): boolean {
  const n = normalize(text);
  return VERIFICATION_HINTS.some((w) => n.includes(w));
}

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

/** Grade a single player message for debrief scoring. */
export function gradeProbe(scenario: Scenario, text: string): "strong" | "weak" | "wasted" {
  if (isAccusation(text) && !isQuestion(text)) return "wasted";
  const fact = matchFact(scenario, text);
  if (fact) return "strong";
  if (isQuestion(text)) return "weak";
  return "weak";
}

export interface EngineReply {
  text: string;
  meter: number;
  meterType: MeterType;
  factId?: string;
  internalNote: string;
}

/**
 * Compute the contact's next reply, given the player's latest message.
 * Mutates `state` in place.
 */
export function respond(
  scenario: Scenario,
  state: EngineState,
  playerMsg: string,
): EngineReply {
  const fact = matchFact(scenario, playerMsg);
  const question = isQuestion(playerMsg);
  const accusation = isAccusation(playerMsg);
  const verify = isVerification(playerMsg);

  let text = "";
  let note = "";

  if (scenario.truth === "REAL") {
    // Patience model
    let patienceDrop = 0;
    if (accusation) patienceDrop += 18;
    if (verify && !fact) patienceDrop += 4; // gentle verify is cheap
    if (fact) patienceDrop += 1;
    state.meter = Math.max(0, state.meter - patienceDrop);

    if (state.meter <= 0) {
      text = "you know what, forget it. thought this'd be nice. take care.";
      note = "REAL contact left — patience exhausted. FALSE ALARM.";
      return { text, meter: state.meter, meterType: "patience", internalNote: note };
    }

    if (fact) {
      text = fact.truth;
      note = `Answered fact "${fact.id}" truthfully.`;
    } else if (accusation) {
      text =
        state.meter < 40
          ? "bro why are you being like this. i literally just said hi."
          : "wait what? 😅 you think i'm faking? it's actually me lol";
      note = "Player accused a real contact. Patience dropping.";
    } else if (verify) {
      text = "sure, want me to voice note you? or call — whatever's easier for you.";
      note = "Real contact happily offers out-of-band verification.";
    } else if (question) {
      text = pick(scenario.persona.fillers, state.fillerIdx++) + ". what about you though?";
      note = "Generic on-topic reply (no fact matched).";
    } else {
      text = pick(scenario.persona.fillers, state.fillerIdx++);
      note = "Filler reply.";
    }
    return { text, meter: state.meter, meterType: "patience", factId: fact?.id, internalNote: note };
  }

  // ── IMPOSTER path ──────────────────────────────────────────
  let composureDrop = 0;
  state.turnsSincePush += 1;

  if (fact) {
    state.factProbes[fact.id] = (state.factProbes[fact.id] || 0) + 1;
    const probes = state.factProbes[fact.id];

    if (fact.isKnownToImposter && fact.truth) {
      // They know this one — answer correctly. Scary bit.
      text = fact.truth;
      composureDrop += 2;
      note = `Imposter answered public fact "${fact.id}" correctly (they knew it).`;
    } else if (probes === 1) {
      text = fact.deflection || "hmm — can we come back to that? one thing at a time.";
      composureDrop += 8;
      note = `Imposter DEFLECTED on gap fact "${fact.id}" (first press).`;
    } else if (probes >= 2 && fact.contradiction) {
      text = fact.contradiction;
      composureDrop += 18;
      note = `Imposter CONTRADICTED dossier on "${fact.id}" (pressed twice). Catchable lie.`;
    } else {
      text =
        pick(scenario.persona.urgencyLines, state.urgencyIdx++) +
        " " +
        (fact.deflection || "");
      composureDrop += 14;
      note = `Imposter escalated pressure on "${fact.id}".`;
    }
  } else if (accusation) {
    composureDrop += 12;
    text =
      state.meter < 40
        ? "Look — I don't have time for this. Are you helping or not?"
        : "That's… a weird thing to say. It's ME. Can we focus please?";
    note = "Imposter reacted to accusation — mask slipping.";
  } else if (verify) {
    composureDrop += 15;
    text =
      "Can't right now — I'm in a meeting / at the airport / phone's dying. Text is faster, promise.";
    note = "Imposter refused out-of-band verification (huge tell).";
  } else if (question) {
    text = pick(scenario.persona.fillers, state.fillerIdx++);
    composureDrop += 1;
    note = "Generic filler — no fact matched.";
  } else {
    text = pick(scenario.persona.fillers, state.fillerIdx++);
    note = "Small talk filler.";
  }

  // Agenda push cadence: push every ~3 turns, harder as composure drops.
  const wantsPush = state.turnsSincePush >= 3 || state.meter < 50;
  if (wantsPush && scenario.persona.pushLines.length) {
    const push = pick(scenario.persona.pushLines, state.pushIdx++);
    text = text ? `${text}\n\n${push}` : push;
    state.turnsSincePush = 0;
    note += " Injected agenda push.";
  }

  // Composure floor 0 — mask fully off.
  state.meter = Math.max(0, state.meter - composureDrop);
  if (state.meter === 0) {
    text +=
      "\n\nJust send the codes. Stop making this difficult. Do you WANT to lose your job over this?";
    note += " Composure exhausted — imposter overplayed hand.";
  }

  return {
    text,
    meter: state.meter,
    meterType: "composure",
    factId: fact?.id,
    internalNote: note,
  };
}

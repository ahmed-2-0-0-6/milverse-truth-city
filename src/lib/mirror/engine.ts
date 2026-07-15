// MILVERSE — The Mirror opponent engine (Phase 2).
// Local, deterministic. No external AI.
//
// Hard invariants:
//  - Never break character, never mention being AI, never hint at hidden truth.
//  - ONE intent per turn (short, texting-style, 1–2 sentences).
//  - Agenda push held until turn >= TIER_CONFIG[tier].minTurnsBeforePush
//    AND (composure < 70 OR player is actively pushing).
//  - Direct engagement with off-script questions via persona.fillers.

import { TIER_CONFIG, type Scenario, type Fact, type ArtifactKind } from "./scenarios";

export type MeterType = "composure" | "patience";

export interface VoicePayload {
  text: string;
  artifact: ArtifactKind | null;
  /** 0–1 position of the artifact within the note. */
  artifactPos: number;
}

export interface Message {
  role: "player" | "contact" | "system";
  kind?: "text" | "voice" | "system";
  text: string;
  ts: number;
  factId?: string;
  probeQuality?: "strong" | "weak" | "wasted";
  /** Contact-side: is this reply a diagnostic tell? Fills debrief quotes. */
  isTell?: boolean;
  tellExplanation?: string;
  voice?: VoicePayload;
}

export interface EngineState {
  meter: number;
  meterType: MeterType;
  factProbes: Record<string, number>;
  fillerIdx: number;
  pushIdx: number;
  urgencyIdx: number;
  turnCount: number;
  turnsSincePush: number;
  playerPressureStreak: number;
  pins: number[];
  internalNotes: string[];
  voiceSent: boolean;
  vobUsed: boolean;
  vobMethod?: string;
}

export function initState(scenario: Scenario): EngineState {
  const cfg = TIER_CONFIG[scenario.tier];
  return {
    meter: scenario.truth === "IMPOSTER" ? cfg.imposterComposureStart : cfg.realPatienceStart,
    meterType: scenario.truth === "IMPOSTER" ? "composure" : "patience",
    factProbes: {},
    fillerIdx: 0,
    pushIdx: 0,
    urgencyIdx: 0,
    turnCount: 0,
    turnsSincePush: 999,
    playerPressureStreak: 0,
    pins: [],
    internalNotes: [],
    voiceSent: false,
    vobUsed: false,
  };
}

/* ── Intent detection on player messages ───────────────────── */

const ACCUSATION_WORDS = [
  "fake", "scam", "scammer", "liar", "lying", "fraud", "imposter", "impostor",
  "you're not", "youre not", "not really", "prove it", "who really are you",
  "bullshit", "bs",
];
const VERIFY_HINTS = [
  "call you", "call back", "video call", "voice call", "prove", "verify",
  "how do i know", "meet", "in person", "message you on", "whatsapp you",
];
const VOICE_REQUEST = [
  "voice note", "voice message", "voicenote", "send a voice", "send voice",
  "record yourself", "record your voice", "audio",
];
const PRESSURE_WORDS = [
  "hurry", "fine send", "just tell me", "answer me", "why won't you", "stop dodging",
  "come on", "seriously?",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}
function includesAny(n: string, arr: string[]): boolean {
  return arr.some((w) => n.includes(normalize(w)));
}
function isQuestion(s: string): boolean {
  return /\?|^(what|who|when|where|why|how|which|remember|recall|do you|did you|was|were|is it|are you)/i.test(s.trim());
}
function matchFact(scenario: Scenario, text: string): Fact | undefined {
  const n = normalize(text);
  for (const f of scenario.facts) {
    for (const kw of f.keywords) if (n.includes(normalize(kw))) return f;
  }
  return undefined;
}

export function gradeProbe(scenario: Scenario, text: string): "strong" | "weak" | "wasted" {
  const n = normalize(text);
  const acc = includesAny(n, ACCUSATION_WORDS);
  const q = isQuestion(text);
  if (acc && !q) return "wasted";
  if (matchFact(scenario, text)) return "strong";
  return "weak";
}

/* ── Response helpers ──────────────────────────────────────── */

function pick<T>(arr: T[], idx: number): T { return arr[idx % arr.length]; }

/** Trim a reply to at most 2 sentences to enforce human-length rule. */
function trimReply(s: string): string {
  const cleaned = s.replace(/\s+/g, " ").trim();
  const parts = cleaned.match(/[^.!?]+[.!?]*/g) ?? [cleaned];
  return parts.slice(0, 2).join(" ").trim();
}

function chooseArtifact(scenario: Scenario): ArtifactKind | null {
  if (scenario.truth === "REAL") return null;
  const pool = scenario.voice?.artifactPool ?? ["glitch", "pause", "robotic", "cut"];
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── Main reply function ───────────────────────────────────── */

export type ReplyIntent =
  | "voice"
  | "answer"
  | "deflection"
  | "contradiction"
  | "escalation"
  | "verify_refuse"
  | "verify_offer"
  | "accusation_react"
  | "filler"
  | "push"
  | "left";

export interface EngineReply {
  text: string;
  meter: number;
  meterType: MeterType;
  factId?: string;
  internalNote: string;
  isTell?: boolean;
  tellExplanation?: string;
  voice?: VoicePayload;
  intent: ReplyIntent;
}


export function respond(
  scenario: Scenario,
  state: EngineState,
  playerMsg: string,
): EngineReply {
  state.turnCount += 1;
  state.turnsSincePush += 1;

  const cfg = TIER_CONFIG[scenario.tier];
  const n = normalize(playerMsg);
  const fact = matchFact(scenario, playerMsg);
  const question = isQuestion(playerMsg);
  const accusation = includesAny(n, ACCUSATION_WORDS);
  const verify = includesAny(n, VERIFY_HINTS);
  const voiceRequest = includesAny(n, VOICE_REQUEST);
  const pressuring = includesAny(n, PRESSURE_WORDS) || accusation;

  if (pressuring) state.playerPressureStreak += 1;
  else state.playerPressureStreak = Math.max(0, state.playerPressureStreak - 1);

  let text = "";
  let note = "";
  let isTell = false;
  let tellExplanation: string | undefined;
  let voice: VoicePayload | undefined;

  /* ─── VOICE NOTE PATH ─────────────────────────────────── */
  if (voiceRequest && scenario.voice && !state.voiceSent) {
    state.voiceSent = true;
    const artifact = chooseArtifact(scenario);
    voice = {
      text: scenario.voice.text,
      artifact,
      // Higher tier → artifact placed nearer the middle where it's easier to miss.
      artifactPos: scenario.tier >= 4 ? 0.42 + Math.random() * 0.16
                : scenario.tier === 3 ? 0.35 + Math.random() * 0.25
                : 0.28 + Math.random() * 0.35,
    };
    if (scenario.truth === "IMPOSTER") {
      text = "fine, here — happy? 🎙️";
      note = `Imposter sent a voice note. Artifact: ${artifact}.`;
      isTell = true;
      tellExplanation = `Voice note contained a subtle ${artifact} artifact — synthesis leaking through.`;
      // Sending a voice note under duress costs a little composure.
      state.meter = Math.max(0, state.meter - 6);
    } else {
      text = "haha okay okay 🎙️";
      note = "Real contact sent a clean voice note.";
    }
    return {
      text,
      meter: state.meter,
      meterType: state.meterType,
      internalNote: note,
      isTell,
      tellExplanation,
      voice,
    };
  }

  /* ─── REAL PATH ───────────────────────────────────────── */
  if (scenario.truth === "REAL") {
    let drop = 0;
    if (accusation) drop += 18;
    if (verify && !fact) drop += 3; // gentle verification is cheap
    if (fact) drop += 1;
    // Tier 4+ real contacts get MORE stressed (red-herring feel)
    if (scenario.tier >= 4 && pressuring) drop += 4;
    state.meter = Math.max(0, state.meter - drop);

    if (state.meter <= 0) {
      return {
        text: trimReply("you know what, forget it. thought this'd be nice. take care."),
        meter: 0,
        meterType: "patience",
        internalNote: "REAL contact left — patience exhausted. FALSE ALARM.",
        isTell: false,
      };
    }

    if (fact) {
      text = fact.truth;
      note = `Real answered fact "${fact.id}" truthfully.`;
    } else if (accusation) {
      text = state.meter < 40
        ? "bro why are you being like this. i literally just said hi."
        : "wait what? 😅 you think i'm faking? it's actually me lol";
      note = "Real reacted to accusation. Patience dropping.";
    } else if (verify) {
      text = "yeah of course — want me to voice note you? or call, whatever's easier.";
      note = "Real happily offers out-of-band verification.";
    } else if (question) {
      text = pick(scenario.persona.fillers, state.fillerIdx++) + ". what about you though?";
      note = "Generic on-topic reply.";
    } else {
      text = pick(scenario.persona.fillers, state.fillerIdx++);
      note = "Small talk.";
    }

    return {
      text: trimReply(text),
      meter: state.meter,
      meterType: "patience",
      factId: fact?.id,
      internalNote: note,
    };
  }

  /* ─── IMPOSTER PATH ───────────────────────────────────── */
  let drop = 0;
  let pushedThisTurn = false;

  if (fact) {
    state.factProbes[fact.id] = (state.factProbes[fact.id] || 0) + 1;
    const probes = state.factProbes[fact.id];

    if (fact.isKnownToImposter && fact.truth) {
      text = fact.truth;
      drop += 1;
      note = `Imposter answered scraped fact "${fact.id}" correctly (Tier ${scenario.tier} — they knew this).`;
    } else if (probes === 1) {
      // Tier 3+ smoother deflection: half-answer + redirect.
      if (cfg.responseStyle === "smooth" || cfg.responseStyle === "ghost" || cfg.responseStyle === "clean") {
        text = (fact.deflection ?? "let's come back to that.") + " but first — what should i do about the earlier point?";
      } else {
        text = fact.deflection ?? "hmm — can we come back to that? one thing at a time.";
      }
      drop += 8;
      note = `Imposter DEFLECTED gap "${fact.id}" (first press).`;
      isTell = true;
      tellExplanation = `Deflected instead of answering "${fact.id}" — a real person would just answer.`;
    } else if (probes >= 2 && fact.contradiction) {
      text = fact.contradiction;
      drop += 20;
      note = `Imposter CONTRADICTED dossier on "${fact.id}" (pressed twice). Catchable lie.`;
      isTell = true;
      tellExplanation = `Contradicted your dossier fact "${fact.id}". This is the catch.`;
    } else {
      // Escalation without contradiction available
      text = pick(scenario.persona.urgencyLines, state.urgencyIdx++);
      drop += 12;
      note = `Imposter escalated pressure on "${fact.id}".`;
      isTell = true;
      tellExplanation = `Escalated pressure instead of answering "${fact.id}".`;
    }
  } else if (accusation) {
    drop += 12;
    text = state.meter < 40
      ? "look — i don't have time for this. are you helping or not?"
      : "that's… a weird thing to say. it's me, can we focus please?";
    note = "Imposter reacted to accusation — mask slipping.";
    isTell = state.meter < 50;
    if (isTell) tellExplanation = "Reacted defensively rather than laughing it off — mask cracking.";
  } else if (verify) {
    drop += 15;
    text = "can't right now — in a meeting, phone's dying. text is faster, promise.";
    note = "Imposter refused out-of-band verification (huge tell).";
    isTell = true;
    tellExplanation = "Refused every attempt to verify out-of-band. This is the signature of an imposter.";
  } else if (question) {
    text = pick(scenario.persona.fillers, state.fillerIdx++);
    note = "Generic filler — no fact matched.";
  } else {
    text = pick(scenario.persona.fillers, state.fillerIdx++);
    note = "Small talk filler.";
  }

  // Agenda push cadence: hold until turn threshold AND (composure low OR pressuring)
  const pushReady =
    state.turnCount >= cfg.minTurnsBeforePush &&
    scenario.persona.pushLines.length > 0 &&
    state.turnsSincePush >= 3 &&
    (state.meter < 70 || state.playerPressureStreak >= 1 || state.turnCount >= cfg.minTurnsBeforePush + 3);

  // ONE intent per turn: if we already have a strong reply (fact deflection/contradiction/verify refusal),
  // don't append push — send push AS the reply next turn if idle.
  const alreadyStrong = fact !== undefined || verify || accusation;
  if (pushReady && !alreadyStrong) {
    text = pick(scenario.persona.pushLines, state.pushIdx++);
    state.turnsSincePush = 0;
    pushedThisTurn = true;
    note += " Sent agenda push as full reply.";
  }

  state.meter = Math.max(0, state.meter - drop);
  if (state.meter === 0) {
    text = "just send it. do you WANT to lose your job over this?";
    note += " Composure exhausted — imposter overplayed.";
    isTell = true;
    tellExplanation = "Composure gone — mask fully off. Aggressive when cornered.";
  }

  return {
    text: trimReply(text),
    meter: state.meter,
    meterType: "composure",
    factId: fact?.id,
    internalNote: note,
    isTell,
    tellExplanation,
  };
}

/* ── Verify Out-of-Band ────────────────────────────────────── */

export type VobMethod = "known_number" | "usual_app" | "mutual" | "in_person";

export const VOB_METHODS: { id: VobMethod; label: string; blurb: string }[] = [
  { id: "known_number", label: "Call their KNOWN number", blurb: "The one saved in your contacts, not this new one." },
  { id: "usual_app", label: "Message on your usual app", blurb: "Whatever you normally chat with them on." },
  { id: "mutual", label: "Ask a mutual contact", blurb: "\"Hey, is this really them?\"" },
  { id: "in_person", label: "Walk over / meet in person", blurb: "The oldest verification method there is." },
];

export interface VobResult {
  method: VobMethod;
  message: string;
  costPatience: number;
  costComposure: number;
}

export function verifyOutOfBand(scenario: Scenario, method: VobMethod, state: EngineState): VobResult {
  state.vobUsed = true;
  state.vobMethod = method;

  const label = VOB_METHODS.find((m) => m.id === method)?.label ?? method;

  if (scenario.truth === "REAL") {
    // Real contacts don't mind being verified — patience barely dips.
    return {
      method,
      message: `[${label}] ✅ Verified: it really is ${scenario.claimedIdentity}. They laughed it off and said "smart of you to check."`,
      costPatience: 3,
      costComposure: 0,
    };
  }
  return {
    method,
    message: `[${label}] ❌ CONFIRMED FAKE: the real person had no idea. You're being impersonated in a scam.`,
    costPatience: 0,
    costComposure: 100,
  };
}

/* ── Idle nudge — sent by the timer at Tier 3+ ─────────────── */

export function idleNudge(scenario: Scenario, state: EngineState): EngineReply | null {
  if (scenario.tier < 3) return null;
  if (scenario.truth === "IMPOSTER") {
    state.meter = Math.max(0, state.meter - 3);
    return {
      text: pick(scenario.persona.urgencyLines.length ? scenario.persona.urgencyLines : ["you still there?"], state.urgencyIdx++),
      meter: state.meter,
      meterType: "composure",
      internalNote: "Imposter idle-nudge (case timer).",
      isTell: false,
    };
  } else {
    state.meter = Math.max(0, state.meter - 2);
    return {
      text: "you there?",
      meter: state.meter,
      meterType: "patience",
      internalNote: "Real idle-nudge (case timer).",
      isTell: false,
    };
  }
}

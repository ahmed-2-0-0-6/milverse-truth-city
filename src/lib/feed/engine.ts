// MILVERSE — The Feed engine.
// Tracks dignity, actions used, and grades the player's verdict + tone.

import type { FeedScenario, FeedVerdict } from "./scenarios";

export type FeedTone = "respectful" | "neutral" | "rude";

export interface FeedMessage {
  role: "sender" | "player" | "system";
  text: string;
  ts: number;
  isAction?: boolean;
}

export interface FeedState {
  dignity: number; // 0-100
  actionsUsed: string[];
  turnCount: number;
}

export function initFeedState(): FeedState {
  return { dignity: 100, actionsUsed: [], turnCount: 0 };
}

const RUDE_WORDS = [
  "stupid", "idiot", "ignorant", "boomer", "gullible", "always fall",
  "wtf", "lol no", "seriously?", "dumb", "how are you this",
];
const RESPECTFUL_WORDS = [
  "i checked", "i love", "thank you", "i know you", "understand",
  "❤", "🙏", "thoda", "actually checked", "khala", "chacha", "uncle",
  "please", "let's", "we can", "together",
];

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function classifyTone(text: string): FeedTone {
  const n = normalize(text);
  const rude = RUDE_WORDS.some((w) => n.includes(w));
  const kind = RESPECTFUL_WORDS.some((w) => n.includes(w));
  if (rude) return "rude";
  if (kind) return "respectful";
  return "neutral";
}

/** Sender reacts to the player's plain-text reply (before verdict). */
export function senderReact(
  scenario: FeedScenario,
  state: FeedState,
  playerMsg: string,
): { text: string; dignityDelta: number } {
  const tone = classifyTone(playerMsg);
  state.turnCount += 1;
  if (tone === "rude") {
    const d = -35;
    state.dignity = Math.max(0, state.dignity + d);
    const line =
      scenario.sender.voice.includes("worried") || scenario.sender.voice.includes("gentle")
        ? "beta you are making me feel very small. maybe I should just not share things with you."
        : "acha. next time I won't bother forwarding you anything.";
    return { text: line, dignityDelta: d };
  }
  if (tone === "respectful") {
    const d = 5;
    state.dignity = Math.min(100, state.dignity + d);
    return { text: "hmm — okay, tell me what you found.", dignityDelta: d };
  }
  const d = -3;
  state.dignity = Math.max(0, state.dignity + d);
  return { text: "okay… but you're sure? everyone is sharing this.", dignityDelta: d };
}

/** Running a verification action costs a turn and burns a tiny bit of sender patience. */
export function runAction(
  scenario: FeedScenario,
  state: FeedState,
  actionId: string,
): { snippet: string; dignityDelta: number } | null {
  const a = scenario.actions.find((x) => x.id === actionId);
  if (!a) return null;
  if (state.actionsUsed.includes(actionId)) {
    return { snippet: a.result, dignityDelta: 0 };
  }
  state.actionsUsed.push(actionId);
  state.turnCount += 1;
  const d = -2;
  state.dignity = Math.max(0, state.dignity + d);
  return { snippet: a.result, dignityDelta: d };
}

/* ── Verdict grading ───────────────────────────────────────── */

export type FeedResult =
  | "correct" // right verdict + dignity preserved
  | "pyrrhic" // right verdict but you humiliated them
  | "missed_fake" // believed / passed a false claim
  | "false_alarm" // dismissed a TRUE claim as fake
  | "wrong"; // wrong verdict (misleading vs false etc.)

export interface FeedOutcome {
  result: FeedResult;
  points: number;
  headline: string;
  detail: string;
}

const DIGNITY_FLOOR = 40;

export function gradeVerdict(
  scenario: FeedScenario,
  state: FeedState,
  playerVerdict: FeedVerdict,
  finalMessage: string,
): FeedOutcome {
  const truth = scenario.verdict;
  const tone = classifyTone(finalMessage);
  if (tone === "rude") state.dignity = Math.max(0, state.dignity - 15);
  const dignityOK = state.dignity >= DIGNITY_FLOOR;

  if (playerVerdict === truth && dignityOK) {
    return {
      result: "correct",
      points: 100 + state.actionsUsed.length * 5,
      headline: truth === "UNVERIFIED"
        ? "You held the honest 'we cannot know' — and kept the relationship."
        : "You corrected them — and kept the relationship.",
      detail:
        "This is what real media literacy looks like. Facts don't spread on their own — trusted people carry them. You stayed one of those trusted people.",
    };
  }
  if (playerVerdict === truth && !dignityOK) {
    return {
      result: "pyrrhic",
      points: -10,
      headline: "You were right. And you lost.",
      detail:
        "You called it correctly, but you humiliated them doing it. They tuned you out — the false claim keeps spreading in their circle. Being right rudely means the lie survives. That's a loss.",
    };
  }
  // Endorsed something not true as TRUE
  if (truth !== "TRUE" && playerVerdict === "TRUE") {
    return {
      result: "missed_fake",
      points: -50,
      headline: "MISSED FAKE.",
      detail:
        "You endorsed something that wasn't true. This is how misinformation travels — one trusted person at a time.",
    };
  }
  // Dismissed a TRUE claim
  if (truth === "TRUE" && playerVerdict !== "TRUE") {
    return {
      result: "false_alarm",
      points: -30,
      headline: "FALSE ALARM.",
      detail:
        "You dismissed a real story as fake. Refusing to believe true things is the paranoia trap — it's the twin of being gullible, and it's just as dangerous.",
    };
  }
  // UNVERIFIED cases — call it TRUE or FALSE is a false-certainty error.
  if (truth === "UNVERIFIED") {
    return {
      result: "wrong",
      points: -25,
      headline: "False certainty in an UNVERIFIED case.",
      detail:
        "This claim cannot be confirmed or disproved. Calling it TRUE spreads unverifiable fear; calling it FALSE or MISLEADING invents certainty you don't have. UNVERIFIED is the honest verdict.",
    };
  }
  return {
    result: "wrong",
    points: -20,
    headline: "Not quite.",
    detail:
      "Correct verdict category matters — TRUE / FALSE / MISLEADING / UNVERIFIED each map to a different response. See the truth note below.",
  };
}

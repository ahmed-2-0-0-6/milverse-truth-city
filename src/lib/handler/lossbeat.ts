// MILVERSE — LOSS BEAT: the Handler's post-loss reaction + pattern memory.
//
// Runs AFTER the verdict locks and the truth is revealed, so it may
// reference this case freely. The PATTERN line is the memory beat and only
// appears when the player has taken this same kind of loss recently.

import type { LeanReading } from "./profile";

export interface LossBeatInput {
  result: "missed_scam" | "false_alarm";
  /** Human label for the case's tactic (or generic — never the current case's truth). */
  tacticLabel: string | null;
  /** Same-result losses within the last 30 days from the player's history. */
  recentSameResult: number;
  lean: LeanReading;
}

export interface LossBeat {
  line: string;
  pattern: string | null;
}

const MISSED_POOLS = [
  "He never gave you time to think. That was the whole trick.",
  "You saw the tells. You just didn't stop. Next time, stop.",
  "The story was better than the channel. The channel was the truth.",
];

const ALARM_POOLS = [
  "It was real. The cost of calling wolf is that the real one walks past you.",
  "A clean message. You buried it. Somebody counted on you to answer.",
  "You flinched. Sometimes the boring read is the right one.",
];

function pick<T>(arr: readonly T[], seed: number): T {
  const i = ((seed % arr.length) + arr.length) % arr.length;
  return arr[i];
}

/** Deterministic — pass a stable seed (case id hash, or ts truncated). */
export function buildLossBeat(input: LossBeatInput, seed = 0): LossBeat {
  const line =
    input.result === "missed_scam"
      ? pick(MISSED_POOLS, seed)
      : pick(ALARM_POOLS, seed);

  let pattern: string | null = null;
  if (input.recentSameResult >= 3) {
    if (input.result === "missed_scam") {
      pattern = input.tacticLabel
        ? `Third missed scam this month. The file says ${input.tacticLabel} is your blind spot.`
        : `Third missed scam this month. The pattern's in your file — read it back.`;
    } else {
      pattern = `Third false alarm this month. You're flinching.`;
    }
  }
  return { line, pattern };
}

/** Simple stable seed from any string. */
export function lossBeatSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return h >>> 0;
}

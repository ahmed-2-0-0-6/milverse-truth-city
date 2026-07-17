// MILVERSE — Deterministic Handler voice.
// Every AI surface has a fallback line generated from these templates.
// Voice = tired-but-sharp desk officer. Specific. Observational. Never cheerleading.

import type { HandlerReading } from "./profile";
import { labelForTactic } from "./profile";

// No opener. Real officers don't preface. Kept for compatibility but unused.
const OPENERS = [""] as const;

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Full Reading narration — 3 short beats: read, strength, directive. */
export function fallbackReading(r: HandlerReading, seed = Date.now()): string {
  return `${leanLine(r)}\n\n${r.strength}\n\n${r.directive}`;
}

function leanLine(r: HandlerReading): string {
  const l = r.lean;
  switch (l.id) {
    case "rookie":
      return "File's thin. Play a few more before I write anything down.";
    case "soft-target":
      return `You trust fast. ${l.blurb}`;
    case "drifting-trusting":
      return `You lean in a shade early. ${l.blurb}`;
    case "calibrated":
      return `Reads are clean this week. ${l.blurb}`;
    case "jumpy":
      return `You're calling ghosts. ${l.blurb}`;
    case "fortress-mind":
      return `Wall's too high. ${l.blurb}`;
  }
}

/** Assignment reason — always deterministic; AI never rewrites this. */
export function assignmentReason(r: HandlerReading): string {
  if (r.weakness)
    return `${labelForTactic(r.weakness.tactic as never)} — ${r.weakness.wrong} of ${r.weakness.seen} wrong. Drill it.`;
  return r.assignment.reason;
}

/** Handler reaction after an assignment completes. */
export function fallbackAssignmentReaction(correct: boolean, seed = Date.now()): string {
  if (correct) {
    return pick(
      [
        "Clean rep. Write the tell down before you forget it.",
        "Good. Now do it again tomorrow when you're tired.",
        "That's the read. Next case, no victory lap.",
        "You caught the tell early. That's the whole job.",
      ],
      seed,
    );
  }
  return pick(
    [
      "Slower next time. Probe, then call.",
      "Tuition. Read the file again — the tell was in there.",
      "Missed it. Go back and find where you decided.",
      "Wrong call. Not fatal. Come back tomorrow.",
    ],
    seed,
  );
}

/** Daily Drop reveal line — reacts to streak + wager + correctness. */
export function fallbackDropLine(input: {
  correct: boolean;
  stake: number;
  streak: number;
  seed?: number;
}): string {
  const { correct, stake, streak, seed = Date.now() } = input;
  if (correct && stake >= 30 && streak >= 3) {
    return pick(
      [
        `Three big stakes in a row and you hit them all. That's either calibration or a hot streak. Tomorrow tells us which.`,
        `${streak} days straight. Not guessing anymore.`,
        `Day ${streak}. Big bet, clean call. Keep the head cold.`,
      ],
      seed,
    );
  }
  if (correct && stake < 15)
    return pick(
      [
        "Right call, small bet. Back the read next time.",
        "You knew. Next time, put weight on it.",
      ],
      seed,
    );
  if (correct)
    return pick(["Clean read. On to the next.", "Called it. Move.", "Right. Log it and move."], seed);
  if (!correct && stake >= 30)
    return pick(
      [
        `Big stake, wrong call. Sting? Good. That's how it sticks.`,
        `Cost you. Read the file. Don't stake that heavy again this week.`,
      ],
      seed,
    );
  return pick(
    [
      "Slipped. Reset. Tomorrow's already loading.",
      "Wrong. Not the end of anything. Come back.",
      "Missed. Small loss. Bigger lesson if you read it back.",
    ],
    seed,
  );
}

/** Small nudge referencing leaderboard standing. */
export function fallbackLeaderboardNudge(input: {
  percentile: number | null;
  seed?: number;
}): string {
  const { percentile, seed = Date.now() } = input;
  if (percentile == null) return "Board's still empty for you. File a few and we'll see where you stand.";
  if (percentile >= 80)
    return pick(
      [
        "Top of the watch. Don't get comfortable — that's when it slips.",
        "Rare air. One bad week and you're back in the pack.",
      ],
      seed,
    );
  if (percentile >= 50)
    return pick(
      ["Middle of the pack. Move.", "Median's not a place, it's a stop. Keep going."],
      seed,
    );
  return pick(
    ["Behind the curve. Two Drops this week, minimum.", "Bottom third. Fix it this week."],
    seed,
  );
}

/** Rookie intro banners — first three cases only. Zero AI, calm & specific. */
export const ROOKIE_INTROS: readonly string[] = [
  "First case. Read it twice before you call it. I'm watching.",
  "Second one. Whatever tugged at you last time — pull on it here.",
  "Third case. After this you file solo. I only speak when the file changes.",
];

// MILVERSE — Deterministic Handler voice.
// Every AI surface has a fallback line generated from these templates.
// Voice = terse noir officer, caring under the gruff. Never clinical.

import type { HandlerReading } from "./profile";
import { labelForTactic } from "./profile";

const OPENERS = ["Kid,", "Listen,", "Alright,", "Sit down.", "One thing."];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Full Reading narration — 3 short lines: read, strength, directive. */
export function fallbackReading(r: HandlerReading, seed = Date.now()): string {
  const opener = pick(OPENERS, seed);
  const lean = leanLine(r);
  const strength = r.strength;
  const directive = r.directive;
  return `${opener} ${lean}\n\n${strength}\n\nYour move: ${directive}`;
}

function leanLine(r: HandlerReading): string {
  const l = r.lean;
  switch (l.id) {
    case "rookie":            return "File's thin. Play a few more, then we'll talk properly.";
    case "soft-target":       return `You trust fast. ${l.blurb}`;
    case "drifting-trusting": return `You lean in a shade early. ${l.blurb}`;
    case "calibrated":        return `You're reading clean. ${l.blurb}`;
    case "jumpy":             return `You're seeing ghosts. ${l.blurb}`;
    case "fortress-mind":     return `Wall's too high. ${l.blurb}`;
  }
}

/** Assignment reason — always deterministic; AI never rewrites this. */
export function assignmentReason(r: HandlerReading): string {
  if (r.weakness) return `Because you burned on ${labelForTactic(r.weakness.tactic as never)} — ${r.weakness.wrong} of ${r.weakness.seen}.`;
  return r.assignment.reason;
}

/** Handler reaction after an assignment completes. */
export function fallbackAssignmentReaction(correct: boolean, seed = Date.now()): string {
  if (correct) {
    return pick([
      "Clean rep. That's the pattern — write it down in the manual.",
      "Good work. Now do it again tomorrow.",
      "That's the read I want to see. Next case.",
    ], seed);
  }
  return pick([
    "Slower next time. Probe, then call.",
    "Cost of tuition. Read the manual entry and try again tomorrow.",
    "Missed the tell. It was in the dossier — go back and find it.",
  ], seed);
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
    return pick([
      `Day ${streak}. Big stake, big hit. That's calibration, not luck.`,
      `${streak} days straight. You're not guessing anymore.`,
    ], seed);
  }
  if (correct && stake < 15) return "Cautious win. Next time, back the read.";
  if (correct)               return "Clean read. On to the next.";
  if (!correct && stake >= 30) return `Big stake, wrong call. Hurt yet? Good. Learn twice as fast.`;
  return "You slipped. Reset. Tomorrow's already loading.";
}

/** Small nudge referencing leaderboard standing. */
export function fallbackLeaderboardNudge(input: {
  percentile: number | null;  // 0..100, higher = better rank
  seed?: number;
}): string {
  const { percentile, seed = Date.now() } = input;
  if (percentile == null) return "Not enough plays on the board yet. Keep filing.";
  if (percentile >= 80) return pick([
    "Top of the watch. The Designer's chair is closer than you think.",
    "You're in rare air. Don't get comfortable.",
  ], seed);
  if (percentile >= 50) return "Middle of the pack. Move.";
  return "Behind the curve. Two Drops this week, minimum.";
}

/** Rookie intro banners — first three cases only. Zero AI, calm & specific. */
export const ROOKIE_INTROS: readonly string[] = [
  "First case. Read it twice before you call it. I'll be watching.",
  "Second one. Notice what tugged at you last time — pull on it here.",
  "Third case. From here on, you file solo. I'll only speak when the file changes.",
];

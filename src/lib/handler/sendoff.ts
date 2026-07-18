// MILVERSE — SEND-OFF: the Handler's one-line pre-case coach.
//
// ANTI-LEAK LAW — ABSOLUTE:
//   This function is CASE-BLIND BY CONSTRUCTION. Its signature does not
//   accept the scenario. It cannot see the current case's tactic, truth,
//   tier, or content. Every line here talks about the PLAYER'S HISTORY
//   (lean, streak, weakest tactic ALREADY IN THEIR FILE) — never the
//   pending case. If it doesn't know, it can't leak it.

import type { LeanReading } from "./profile";
import type { TacticStat } from "./profile";
import { labelForTactic } from "./profile";

export interface SendOffStats {
  weakest: TacticStat | null;
  dailyStreak: number;
  /** last few results, most-recent last — "correct" | "missed_scam" | "false_alarm" | "lucky_guess" */
  recentResults: string[];
  /** Conviction ledger flag: player is OVERSURE this week (gap >= +12). */
  oversure?: boolean;
}

const POOLS = {
  rookie: [
    "Read it twice. Type what you'd actually type. I'm watching.",
    "No script. Ask what you'd ask. The city teaches fast.",
    "File's thin. Play it slow, and I'll write more of it down.",
  ],
  "drifting-trusting": [
    "You've been saying yes too easily this week. Make them earn it.",
    "Your last three calls trusted fast. Slow hands today.",
    "You lean in a shade early. Sit back before you agree.",
  ],
  "soft-target": [
    "The file says you trust the loudest voice in the room. Don't.",
    "Scams have been walking past you. Slow the whole read down.",
    "You've been saying yes too easily this week. Make them earn it.",
  ],
  jumpy: [
    "You've been calling wolf. Remember — refusing everything is also losing.",
    "Three false alarms on your sheet. Paranoia pays the same bill as gullibility.",
    "You're flagging clean traffic. Prove REAL as hard as you prove FAKE.",
  ],
  "fortress-mind": [
    "Wall's too high on your file. Real people are getting turned away.",
    "You've been calling wolf. Remember — refusing everything is also losing.",
    "Nothing gets through your read lately. That has a cost. Ease it.",
  ],
  calibrated: [
    "Your sheet's clean lately. Keep the streak honest.",
    "Balanced week. Don't get comfortable.",
    "Reads are landing. Push into a tactic you haven't drilled.",
  ],
} as const;

// Optional pool: names a HISTORICAL weakness (the player's file, not this case).
const TACTIC_MEMORY_POOLS = [
  (t: string) => `The ${t} keeps beating you. It's in your file.`,
  (t: string) => `Your file remembers ${t}. It hasn't stopped costing you.`,
];

/** Deterministic pick from an array. */
function pick<T>(arr: readonly T[], seed: number): T {
  const i = ((seed % arr.length) + arr.length) % arr.length;
  return arr[i];
}

/**
 * CASE-BLIND send-off line.
 * @param reading player's lean reading (from computeLean)
 * @param stats   player-history stats (weakness, streak, recent results)
 * @param seed    deterministic seed — SHOULD combine dateKey + casesPlayed
 *                so back-to-back cases don't repeat, but same-day-same-count
 *                is stable across reloads.
 */
export function buildSendOff(
  reading: LeanReading,
  stats: SendOffStats,
  seed = 0,
): string {
  // Streak-honoring nudge for calibrated players on hot streaks.
  if (reading.id === "calibrated" && stats.dailyStreak >= 5) {
    return pick(
      [
        "Five days clean. Don't get comfortable.",
        "Streak's alive. Keep the head cold.",
      ],
      seed,
    );
  }

  // Rare memory line — only when a weakness is well-documented AND the seed
  // lands on the memory slot. Names PAST tactic history, never this case.
  if (
    stats.weakest &&
    stats.weakest.seen >= 3 &&
    stats.weakest.wrongRate >= 0.5 &&
    seed % 4 === 0
  ) {
    const label = labelForTactic(stats.weakest.tactic as never);
    return pick(TACTIC_MEMORY_POOLS, seed)(label);
  }

  const pool =
    reading.id === "rookie"
      ? POOLS.rookie
      : reading.id === "soft-target"
        ? POOLS["soft-target"]
        : reading.id === "drifting-trusting"
          ? POOLS["drifting-trusting"]
          : reading.id === "jumpy"
            ? POOLS.jumpy
            : reading.id === "fortress-mind"
              ? POOLS["fortress-mind"]
              : POOLS.calibrated;

  return pick(pool, seed);
}

/** Deterministic seed for the send-off. dateKey + casesPlayed. */
export function sendOffSeed(dateKey: string, casesPlayed: number): number {
  let h = 5381;
  for (let i = 0; i < dateKey.length; i++) h = ((h << 5) + h) ^ dateKey.charCodeAt(i);
  return (h + casesPlayed) >>> 0;
}

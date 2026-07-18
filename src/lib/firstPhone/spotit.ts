// MILVERSE — SPOT IT mini-game round builder.
// Pure data: no AI, no randomness. Rounds are constructed from JuniorCases
// in lessons the kid has already completed.

import { LESSONS, type JuniorCase, type JuniorTactic } from "./lessons";
import type { FirstPhoneState } from "./profile";

export const ALL_JUNIOR_TACTICS: JuniorTactic[] = [
  "giveaway-scam",
  "chain-forward",
  "out-of-context",
  "impersonation",
  "rumor",
  "ai-forgery",
  "unverifiable",
  "group-chat",
];

export const TACTIC_LABEL: Record<JuniorTactic, string> = {
  "giveaway-scam": "Free-stuff trick",
  "chain-forward": "Chain forward",
  "out-of-context": "Real photo, wrong caption",
  impersonation: "Pretending to be someone",
  rumor: "Rumor",
  "ai-forgery": "AI copy of a real voice or face",
  unverifiable: "Can't verify, wants you to act fast",
  "group-chat": "Group-chat pressure",
};

export interface SpotItRound {
  caseId: string;
  lessonN: number;
  sender: string;
  platform: string;
  artifact: string[];
  truth: JuniorCase["truth"];
  tactic: JuniorTactic;
  truthNote: string;
  /** truthy = the case is safe/benign. Currently always false in the curriculum. */
  truthy: boolean;
  /** Three tactic choices, deterministic order, includes the real one. */
  tacticChoices: JuniorTactic[];
}

/** Stable 32-bit string hash. */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pickDistractors(correct: JuniorTactic, seed: string): JuniorTactic[] {
  const pool = ALL_JUNIOR_TACTICS.filter((t) => t !== correct);
  // Score each by hash(seed + tactic), pick the two lowest.
  const scored = pool
    .map((t) => ({ t, k: hash(seed + t) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 2)
    .map((x) => x.t);
  // Insert the correct answer at a deterministic position (0..2).
  const pos = hash(seed) % 3;
  const out = [...scored];
  out.splice(pos, 0, correct);
  return out;
}

export function buildRounds(state: FirstPhoneState, now: Date = new Date()): SpotItRound[] {
  const completed = new Set(state.lessonsCompleted);
  const day = dateKey(now);
  const flat: SpotItRound[] = [];
  for (const lesson of LESSONS) {
    if (!completed.has(lesson.n)) continue;
    for (const c of lesson.cases) {
      const truthy = false; // curriculum has no benign cases today
      flat.push({
        caseId: c.id,
        lessonN: lesson.n,
        sender: c.sender,
        platform: c.platform,
        artifact: c.artifact,
        truth: c.truth,
        tactic: c.tactic,
        truthNote: c.truthNote,
        truthy,
        tacticChoices: pickDistractors(c.tactic, `${day}:${c.id}`),
      });
    }
  }
  flat.sort((a, b) => hash(day + a.caseId) - hash(day + b.caseId));
  return flat.slice(0, 8);
}

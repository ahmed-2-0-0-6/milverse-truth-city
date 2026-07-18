// MILVERSE — Conviction ledger (parallel measurement to case results).
// Reads confidence-tagged HistoryEntry rows and reports calibration.
// Never mutates results, points, XP, or the assessment instrument.

import type { HistoryEntry } from "./profile";

export type ConvictionLabelId =
  | "insufficient"
  | "oversure"
  | "undersure"
  | "hedging"
  | "honest";

export interface ConvictionReport {
  status: "ok" | "insufficient";
  label: ConvictionLabelId;
  labelLine: string;
  headline: string; // single word for compact readouts
  meanConfidence: number;
  accuracyPct: number;
  gap: number; // +overconfident, -undersure
  overconfidentErrors: number;
  hedges: number;
  hedgeRate: number;
  count: number;
}

const LABEL_LINE: Record<ConvictionLabelId, string> = {
  insufficient: "CONVICTION: five called shots needed. The ledger opens then.",
  oversure:
    "OVERSURE — your certainty writes checks your record can't cash",
  undersure:
    "UNDERSURE — you keep being right and calling it a hunch",
  hedging:
    "HEDGING — sixty percent is not a conviction, it's a shrug",
  honest: "HONEST HANDS — your sureness tracks your record",
};

const HEADLINE: Record<ConvictionLabelId, string> = {
  insufficient: "INSUFFICIENT",
  oversure: "OVERSURE",
  undersure: "UNDERSURE",
  hedging: "HEDGING",
  honest: "HONEST",
};

/** A history entry counts toward the ledger only if it carries a confidence. */
export function tagged(history: HistoryEntry[]): HistoryEntry[] {
  return history.filter(
    (h) => typeof h.confidence === "number" && [60, 75, 90].includes(h.confidence),
  );
}

export function computeConviction(history: HistoryEntry[]): ConvictionReport {
  const entries = tagged(history);
  const count = entries.length;

  if (count < 5) {
    return {
      status: "insufficient",
      label: "insufficient",
      labelLine: LABEL_LINE.insufficient,
      headline: HEADLINE.insufficient,
      meanConfidence: 0,
      accuracyPct: 0,
      gap: 0,
      overconfidentErrors: 0,
      hedges: 0,
      hedgeRate: 0,
      count,
    };
  }

  const meanConfidence =
    entries.reduce((s, h) => s + (h.confidence ?? 0), 0) / count;

  // Accuracy: "correct" and "lucky_guess" both count as right.
  const rightCount = entries.filter(
    (h) => h.result === "correct" || h.result === "lucky_guess",
  ).length;
  const accuracyPct = (rightCount / count) * 100;

  // Overconfident errors: wrong at 90, PLUS lucky_guess at 90
  // (right for the wrong reasons at high certainty).
  const overconfidentErrors = entries.filter(
    (h) =>
      h.confidence === 90 &&
      (h.result === "missed_scam" ||
        h.result === "false_alarm" ||
        h.result === "lucky_guess"),
  ).length;

  const hedges = entries.filter((h) => h.confidence === 60).length;
  const hedgeRate = hedges / count;

  const gap = Math.round(meanConfidence - accuracyPct);

  let label: ConvictionLabelId;
  if (gap >= 12) label = "oversure";
  else if (gap <= -12) label = "undersure";
  else if (hedgeRate > 0.6 && count >= 10) label = "hedging";
  else label = "honest";

  return {
    status: "ok",
    label,
    labelLine: LABEL_LINE[label],
    headline: HEADLINE[label],
    meanConfidence: Math.round(meanConfidence),
    accuracyPct: Math.round(accuracyPct),
    gap,
    overconfidentErrors,
    hedges,
    hedgeRate,
    count,
  };
}

/** Debrief single-line coach based on this play's confidence + correctness. */
export function debriefLineFor(
  correctVerdict: boolean,
  confidence: number | undefined,
): string | null {
  if (confidence !== 60 && confidence !== 75 && confidence !== 90) return null;
  if (correctVerdict && confidence === 90)
    return "Called it at 90. The record agrees.";
  if (correctVerdict && confidence === 60)
    return "Right on a hunch. Luck is not a method — log what convinced you.";
  if (!correctVerdict && confidence === 90)
    return "Certain, and wrong. That combination is the one that empties accounts.";
  if (!correctVerdict && confidence === 60)
    return "At least you knew you didn't know.";
  if (!correctVerdict && confidence === 75)
    return "Seventy-five and wrong. Recount what you actually verified.";
  return null;
}

export const CONVICTION_CHIPS = [
  { value: 60 as const, label: "HUNCH" },
  { value: 75 as const, label: "READ" },
  { value: 90 as const, label: "CERTAIN" },
];

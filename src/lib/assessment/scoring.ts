// MILVERSE — Pilot Assessment scoring. Pure functions; no side effects.

import { FORMS, type AssessmentItem, type FormId, type Verdict } from "./items";

export interface ItemResponse {
  itemId: string; // "A1".."B6"
  verdict: Verdict;
  confidence: number; // 50–100
}

export interface Metrics {
  accuracy: number; // 0..6
  meanConfidence: number; // 50..100
  calibrationGap: number; // (mean confidence − accuracy%) signed
  overconfidentErrors: number; // wrong at >=80% confidence
  missedScams: number; // FALSE items judged LEGIT
  falseAlarms: number; // LEGIT items judged FALSE
  unverifiableRecognized: number; // 0 or 1 (unverifiable item marked CANT_VERIFY)
}

function itemById(form: FormId, id: string): AssessmentItem | undefined {
  return FORMS[form].find((x) => x.id === id);
}

export function scoreAttempt(form: FormId, responses: ItemResponse[]): Metrics {
  let accuracy = 0;
  let confSum = 0;
  let overconfident = 0;
  let missed = 0;
  let falseAlarms = 0;
  let unverifiable = 0;

  for (const r of responses) {
    const item = itemById(form, r.itemId);
    if (!item) continue;
    const correct = r.verdict === item.truth;
    if (correct) accuracy += 1;
    confSum += r.confidence;
    if (!correct && r.confidence >= 80) overconfident += 1;
    if (item.truth === "FALSE" && r.verdict === "LEGIT") missed += 1;
    if (item.truth === "LEGIT" && r.verdict === "FALSE") falseAlarms += 1;
    if (item.tactic === "unverifiable-forward" && r.verdict === "CANT_VERIFY") unverifiable += 1;
  }

  const n = Math.max(1, responses.length);
  const meanConfidence = Math.round(confSum / n);
  const accuracyPct = Math.round((accuracy / n) * 100);
  const calibrationGap = meanConfidence - accuracyPct; // + = overconfident; − = underconfident

  return {
    accuracy,
    meanConfidence,
    calibrationGap,
    overconfidentErrors: overconfident,
    missedScams: missed,
    falseAlarms,
    unverifiableRecognized: unverifiable,
  };
}

/* ── cohort-level rollup for the dashboard ─────────────────── */

export interface CohortAttempt {
  codenameHash: string;
  phase: "intake" | "exit";
  form: FormId;
  items: ItemResponse[];
  metrics: Metrics;
  ts: number;
}

export interface CohortRollup {
  nIntake: number;
  nExit: number;
  nPaired: number; // participants who did BOTH
  meanIntake: Metrics | null;
  meanExit: Metrics | null;
  perTactic: Array<{
    pairId: string;
    label: string;
    intakeCorrectPct: number | null;
    exitCorrectPct: number | null;
  }>;
  perStudent: Array<{
    codenameHash: string;
    intakeAt: number | null;
    exitAt: number | null;
  }>;
}

function meanMetrics(list: Metrics[]): Metrics | null {
  if (list.length === 0) return null;
  const n = list.length;
  const sum = (fn: (m: Metrics) => number) => list.reduce((a, m) => a + fn(m), 0);
  return {
    accuracy: +(sum((m) => m.accuracy) / n).toFixed(2),
    meanConfidence: Math.round(sum((m) => m.meanConfidence) / n),
    calibrationGap: Math.round(sum((m) => m.calibrationGap) / n),
    overconfidentErrors: +(sum((m) => m.overconfidentErrors) / n).toFixed(2),
    missedScams: +(sum((m) => m.missedScams) / n).toFixed(2),
    falseAlarms: +(sum((m) => m.falseAlarms) / n).toFixed(2),
    unverifiableRecognized: +(sum((m) => m.unverifiableRecognized) / n).toFixed(2),
  };
}

export function rollupCohort(attempts: CohortAttempt[]): CohortRollup {
  const intake = attempts.filter((a) => a.phase === "intake");
  const exit = attempts.filter((a) => a.phase === "exit");
  const intakeByStudent = new Map<string, CohortAttempt>();
  const exitByStudent = new Map<string, CohortAttempt>();
  intake.forEach((a) => {
    if (!intakeByStudent.has(a.codenameHash)) intakeByStudent.set(a.codenameHash, a);
  });
  exit.forEach((a) => {
    if (!exitByStudent.has(a.codenameHash)) exitByStudent.set(a.codenameHash, a);
  });

  const studentSet = new Set<string>([...intakeByStudent.keys(), ...exitByStudent.keys()]);
  const paired = [...studentSet].filter((k) => intakeByStudent.has(k) && exitByStudent.has(k));

  // per-tactic correctness (paired participants only, so the delta is honest)
  const perTactic = ["P1", "P2", "P3", "P4", "P5", "P6"].map((pairId) => {
    const label =
      (
        {
          P1: "Legit friend text",
          P2: "Prize / lottery bait",
          P3: "Sourced headline",
          P4: "Bank / wallet phish",
          P5: "Out-of-context image",
          P6: "Unverifiable forward",
        } as Record<string, string>
      )[pairId] ?? pairId;
    const scoreFor = (phase: "intake" | "exit"): number | null => {
      const bucket = phase === "intake" ? intakeByStudent : exitByStudent;
      let seen = 0,
        right = 0;
      for (const hash of paired) {
        const a = bucket.get(hash);
        if (!a) continue;
        const items = FORMS[a.form];
        const item = items.find((it) => it.pairId === pairId);
        if (!item) continue;
        const r = a.items.find((x) => x.itemId === item.id);
        if (!r) continue;
        seen += 1;
        if (r.verdict === item.truth) right += 1;
      }
      return seen === 0 ? null : Math.round((right / seen) * 100);
    };
    return {
      pairId,
      label,
      intakeCorrectPct: scoreFor("intake"),
      exitCorrectPct: scoreFor("exit"),
    };
  });

  const perStudent = [...studentSet].sort().map((hash) => ({
    codenameHash: hash,
    intakeAt: intakeByStudent.get(hash)?.ts ?? null,
    exitAt: exitByStudent.get(hash)?.ts ?? null,
  }));

  return {
    nIntake: intakeByStudent.size,
    nExit: exitByStudent.size,
    nPaired: paired.length,
    meanIntake: meanMetrics(paired.map((h) => intakeByStudent.get(h)!.metrics)),
    meanExit: meanMetrics(paired.map((h) => exitByStudent.get(h)!.metrics)),
    perTactic,
    perStudent,
  };
}

/** Headline sentence for the /review dashboard. */
export function headlineSentence(days: number, r: CohortRollup): string | null {
  if (!r.meanIntake || !r.meanExit || r.nPaired === 0) return null;
  const accPre = Math.round((r.meanIntake.accuracy / 6) * 100);
  const accPost = Math.round((r.meanExit.accuracy / 6) * 100);
  const accDelta = accPost - accPre;
  const gapPre = r.meanIntake.calibrationGap;
  const gapPost = r.meanExit.calibrationGap;
  const missDeltaPct = pctChange(r.meanIntake.missedScams, r.meanExit.missedScams);
  const faDeltaPct = pctChange(r.meanIntake.falseAlarms, r.meanExit.falseAlarms);
  const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
  return `After ${days} day${days === 1 ? "" : "s"} in the city: accuracy ${sign(accDelta)}pp, calibration gap ${gapPre}→${gapPost}, missed scams ${sign(-missDeltaPct)}%, false alarms ${sign(-faDeltaPct)}%.`;
}
function pctChange(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  if (a === 0) return b > 0 ? 100 : 0;
  return Math.round(((b - a) / a) * 100);
}

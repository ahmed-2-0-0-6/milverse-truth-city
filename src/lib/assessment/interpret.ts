// MILVERSE — Pilot Assessment plain-language interpreter.
// Pure function. Consumes CohortRollup; returns paragraphs + cautions.
// No banned words. No exclamation marks. Educator register.

import type { CohortRollup, Metrics } from "./scoring";

export interface Interpretation {
  paragraphs: string[];
  cautions: string[];
}

const PP_MEANINGFUL = 5; // percentage-point delta
const GAP_MEANINGFUL = 4; // calibration gap points
const REL_MEANINGFUL = 0.2; // 20% relative change on miss / alarm means

function pctFromAccuracy(acc: number): number {
  return Math.round((acc / 6) * 100);
}

function relChange(pre: number, post: number): number {
  if (pre === 0 && post === 0) return 0;
  if (pre === 0) return post > 0 ? 1 : 0;
  return (post - pre) / pre;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function interpretCohort(
  r: CohortRollup,
  days: number,
): Interpretation | null {
  if (r.nPaired < 5) return null;
  if (!r.meanIntake || !r.meanExit) return null;

  const pre: Metrics = r.meanIntake;
  const post: Metrics = r.meanExit;

  const accPre = pctFromAccuracy(pre.accuracy);
  const accPost = pctFromAccuracy(post.accuracy);
  const accDelta = accPost - accPre;

  const gapPre = pre.calibrationGap;
  const gapPost = post.calibrationGap;
  const gapAbsDelta = Math.abs(gapPost) - Math.abs(gapPre); // negative = narrowed

  const missRel = relChange(pre.missedScams, post.missedScams);
  const alarmRel = relChange(pre.falseAlarms, post.falseAlarms);

  const paragraphs: string[] = [];
  const cautions: string[] = [];

  // 1. WHO
  paragraphs.push(
    `This reading covers ${r.nPaired} students who completed both the intake and exit measurements, ${days} day${days === 1 ? "" : "s"} apart. ${r.nIntake} started; ${r.nExit} finished.`,
  );

  // 2. ACCURACY
  if (accDelta >= PP_MEANINGFUL) {
    paragraphs.push(
      `Students ended the program correctly judging ${accPost}% of test items, up from ${accPre}%. On a six-item instrument that is a meaningful shift, not a rounding artifact.`,
    );
  } else if (accDelta <= -PP_MEANINGFUL) {
    paragraphs.push(
      `Accuracy declined from ${accPre}% to ${accPost}%. That deserves attention rather than explanation away; see the cautions at the end of this reading.`,
    );
  } else {
    paragraphs.push(
      `Accuracy held roughly steady (${accPre}% to ${accPost}%). On its own that says little — the more telling numbers are below.`,
    );
  }

  // 3. THE TWO FAILURE DIRECTIONS
  const missedDown = missRel <= -REL_MEANINGFUL;
  const missedUp = missRel >= REL_MEANINGFUL;
  const alarmsDown = alarmRel <= -REL_MEANINGFUL;
  const alarmsUp = alarmRel >= REL_MEANINGFUL;

  if (missedDown && alarmsDown) {
    paragraphs.push(
      `Both failure directions improved: students fell for fewer scams and raised fewer false alarms on real items. This is the pattern the program is built to produce — skepticism that sharpened without curdling into distrust.`,
    );
  } else if (missedDown && alarmsUp) {
    paragraphs.push(
      `Students fell for fewer scams, but false alarms on real items rose. They left more suspicious, not more discerning — the exit numbers show caution, not yet calibration.`,
    );
  } else if (missedUp) {
    paragraphs.push(
      `Missed scams did not improve. Whatever else moved, the primary risk behavior is not yet shifting.`,
    );
  } else {
    paragraphs.push(`Neither failure direction moved meaningfully.`);
  }

  // 4. CALIBRATION
  let calibrationLine: string;
  if (gapAbsDelta <= -GAP_MEANINGFUL) {
    calibrationLine = `The gap between how sure students felt and how right they were narrowed from ${gapPre} to ${gapPost} points. Shrinking that gap is the program's deepest goal: confidence that tracks reality.`;
  } else if (gapAbsDelta >= GAP_MEANINGFUL) {
    const direction =
      gapPost >= 0
        ? "more sure than right"
        : "less sure than their accuracy warrants";
    calibrationLine = `The confidence-accuracy gap widened (${gapPre} to ${gapPost}). Students grew ${direction}.`;
  } else {
    calibrationLine = `Confidence stayed about as well-matched to accuracy as it began (${gapPre} to ${gapPost}).`;
  }

  const ocRel = relChange(pre.overconfidentErrors, post.overconfidentErrors);
  if (ocRel <= -REL_MEANINGFUL && pre.overconfidentErrors > 0) {
    calibrationLine += ` Confident mistakes — wrong answers held with high certainty, the costliest kind — fell from ${fmtNum(pre.overconfidentErrors)} to ${fmtNum(post.overconfidentErrors)} per student.`;
  }
  paragraphs.push(calibrationLine);

  // 5. UNVERIFIABLE
  const uPre = Math.round(pre.unverifiableRecognized * 100);
  const uPost = Math.round(post.unverifiableRecognized * 100);
  const uDelta = uPost - uPre;
  if (uDelta >= PP_MEANINGFUL) {
    paragraphs.push(
      `More students correctly marked the unverifiable item as "can't verify" (${uPre}% to ${uPost}%). Resisting the pull to declare a verdict is the subtlest skill on the instrument.`,
    );
  } else {
    paragraphs.push(
      `Recognition of the unverifiable item moved from ${uPre}% to ${uPost}%.`,
    );
  }

  // 6. BY TACTIC
  const rowsWithBoth = r.perTactic.filter(
    (t) => t.intakeCorrectPct !== null && t.exitCorrectPct !== null,
  );
  if (rowsWithBoth.length > 0) {
    let best = rowsWithBoth[0];
    let bestDelta = -Infinity;
    for (const t of rowsWithBoth) {
      const d = (t.exitCorrectPct as number) - (t.intakeCorrectPct as number);
      if (d > bestDelta) {
        bestDelta = d;
        best = t;
      }
    }
    const declined = rowsWithBoth.find(
      (t) => (t.exitCorrectPct as number) - (t.intakeCorrectPct as number) <= -10,
    );
    let tacticLine = `The clearest gain came on ${best.label}: ${best.intakeCorrectPct}% to ${best.exitCorrectPct}% correct.`;
    if (declined) {
      tacticLine += ` ${declined.label} moved backward and belongs on the next teaching pass.`;
    }
    paragraphs.push(tacticLine);
  }

  // CAUTIONS
  if (r.nPaired < 12) {
    cautions.push(`Small group: treat direction as real, magnitude as rough.`);
  }
  if (r.nIntake > 0 && (r.nIntake - r.nExit) / r.nIntake > 0.25) {
    cautions.push(
      `A meaningful share of starters didn't finish; completers may not represent the class.`,
    );
  }
  if (days < 7) {
    cautions.push(
      `The measurements sit close together; retention beyond this window is not yet shown.`,
    );
  }
  if (accDelta <= -PP_MEANINGFUL || missedUp) {
    cautions.push(
      `Where numbers moved backward, check whether the exit ran under different conditions (time pressure, distraction) before reading it as learning loss.`,
    );
  }

  return { paragraphs, cautions };
}

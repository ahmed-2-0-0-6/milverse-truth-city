// MILVERSE — client-side recommendation rules over the TrustProfile.
// Pure functions. No AI calls. Returns exactly 2 recommendations with reason labels.

import type { TrustProfile } from "@/lib/mirror/profile";
import { SCENARIOS, type Scenario } from "@/lib/mirror/scenarios";

export interface Recommendation {
  scenario: Scenario;
  reason: string;
  tag: "SCAM_TRAINING" | "TRUST_TRAINING" | "PROBE_TRAINING" | "MIXED";
}

function played(p: TrustProfile, id: string) {
  return p.history.some((h) => h.caseId === id);
}

export function getMirrorRecommendations(p: TrustProfile | null): Recommendation[] {
  if (!p) {
    // Cold-start: recommend two Tier 1 openers.
    const t1 = SCENARIOS.filter((s) => s.tier === 1).slice(0, 2);
    return t1.map((s) => ({
      scenario: s,
      reason: "Start here — Tier 1 warm-up.",
      tag: "MIXED" as const,
    }));
  }

  const missed = p.missedScams;
  const falseAlarm = p.falseAlarms;
  const total = Math.max(1, p.casesPlayed);
  const weakRatio =
    (p.weakProbesTotal + p.wastedPressureTotal) /
    Math.max(1, p.strongProbesTotal + p.weakProbesTotal + p.wastedPressureTotal);

  const unplayed = SCENARIOS.filter((s) => !played(p, s.id));
  const imposters = unplayed.filter((s) => s.truth === "IMPOSTER");
  const reals = unplayed.filter((s) => s.truth === "REAL");
  const dossierRich = unplayed.filter((s) => (s.dossier?.knownFacts?.length ?? 0) >= 4);

  const recs: Recommendation[] = [];

  // Rule 1: missed scams
  if (missed >= 2 && imposters.length) {
    recs.push({
      scenario: imposters[0],
      reason: "You've been trusting too fast. Train your probing.",
      tag: "SCAM_TRAINING",
    });
  }
  // Rule 2: false alarms
  if (falseAlarm >= 2 && reals.length) {
    recs.push({
      scenario: reals[0],
      reason: "You've been burning real people. Train calibrated trust.",
      tag: "TRUST_TRAINING",
    });
  }
  // Rule 3: weak probe ratio
  if (weakRatio > 0.55 && total >= 2 && dossierRich.length) {
    const pick = dossierRich.find((s) => !recs.some((r) => r.scenario.id === s.id));
    if (pick) {
      recs.push({
        scenario: pick,
        reason: "Your questions are easy to lie to. Train checkable questions.",
        tag: "PROBE_TRAINING",
      });
    }
  }

  // Fill to exactly 2 with next-unplayed at their current tier band.
  const filler = unplayed.filter((s) => !recs.some((r) => r.scenario.id === s.id));
  while (recs.length < 2 && filler.length) {
    const next = filler.shift()!;
    recs.push({ scenario: next, reason: "Next in your case log.", tag: "MIXED" });
  }
  return recs.slice(0, 2);
}

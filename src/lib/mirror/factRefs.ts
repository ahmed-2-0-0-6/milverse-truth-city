// MILVERSE — Working Brief fact refs. Deterministic ref ids derived from
// the dossier arrays so "K2" in the brief is "K2" in the chat is "K2" in
// the debrief. Presentation only — no engine or scoring inputs.

import type { Scenario } from "./scenarios";

export interface FactRef {
  ref: string; // "K1", "P2", "GUT"
  kind: "known" | "public" | "gut";
  text: string;
  /** Long a11y label, e.g. "Known fact 2: parents were at Aunt Farah's for iftar." */
  ariaLabel: string;
}

export function factRefsFor(scenario: Scenario): FactRef[] {
  const out: FactRef[] = [];
  scenario.dossier.knownFacts.forEach((t, i) => {
    out.push({
      ref: `K${i + 1}`,
      kind: "known",
      text: t,
      ariaLabel: `Known fact ${i + 1}: ${t}`,
    });
  });
  scenario.dossier.publicFacts.forEach((t, i) => {
    out.push({
      ref: `P${i + 1}`,
      kind: "public",
      text: t,
      ariaLabel: `Public fact ${i + 1}: ${t}`,
    });
  });
  return out;
}

export const GUT_REF: FactRef = {
  ref: "GUT",
  kind: "gut",
  text: "gut feeling — no fact attached yet",
  ariaLabel: "Gut feeling — no fact attached yet",
};

export function findRef(refs: FactRef[], ref: string | undefined): FactRef {
  if (!ref) return GUT_REF;
  return refs.find((r) => r.ref === ref) ?? GUT_REF;
}

// MILVERSE — junior tactic ↔ Field Manual bridge.
// The junior curriculum uses friendlier tactic labels; the adult Field Manual
// uses the canonical MIL taxonomy. This map lets a completed junior lesson
// ALSO stamp the mapped manual entry (unlock it) and gives us a single
// display-name lookup for both the License card and the Family dashboard.
//
// Mapping was chosen by reading the actual manual entry copy in
// src/lib/manual/entries.ts — justification per line:

import type { JuniorTactic } from "./lessons";
import type { TacticId } from "@/lib/manual/entries";
import { getManualEntry } from "@/lib/manual/entries";

export const JUNIOR_TO_MANUAL: Record<JuniorTactic, TacticId | null> = {
  // Chain forwards are the classic mis/dis/mal delivery: same false claim
  // riding across sincere and coordinated senders alike.
  "chain-forward": "mis-dis-mal",
  // "Send us your password to claim a prize" is textbook phishing (T-06).
  "giveaway-scam": "phishing",
  // Real photo, wrong caption — the manual's T-03 exactly.
  "out-of-context": "out-of-context",
  // "New number, it's me" — the manual's T-01.
  impersonation: "impersonation",
  // Anger-first stories with no witness — mis/dis/mal in family circulation.
  rumor: "mis-dis-mal",
  // AI voice / face — the Forgery Engine, T-10.
  "ai-forgery": "forgery-engine",
  // Group-chat "forward or lose your account" — urgency-fear pressure.
  "group-chat": "urgency-fear",
  // Junior-only skill (HOLD / can't-verify + urgency). Kept junior; no
  // adult equivalent worth force-mapping. Named "Trusted-adult HOLD".
  unverifiable: null,
};

export interface TacticDisplay {
  juniorLabel: string;
  manualCode: string | null;
  manualName: string | null;
  combinedLabel: string; // used on License endorsements
}

const JUNIOR_LABEL: Record<JuniorTactic, string> = {
  "chain-forward": "Chain forwards",
  "giveaway-scam": "Prize / giveaway scams",
  "out-of-context": "Out-of-context photos",
  impersonation: "Impersonation",
  rumor: "Angry rumors",
  "ai-forgery": "AI-generated voices & images",
  "group-chat": "Group-chat pressure",
  unverifiable: "HOLD when you can't verify",
};

export function describeTactic(t: JuniorTactic): TacticDisplay {
  const juniorLabel = JUNIOR_LABEL[t];
  const manualId = JUNIOR_TO_MANUAL[t];
  const entry = manualId ? getManualEntry(manualId) : undefined;
  return {
    juniorLabel,
    manualCode: entry?.code ?? null,
    manualName: entry?.name ?? null,
    combinedLabel: entry
      ? `${juniorLabel} — see Field Manual: ${entry.name} (${entry.code})`
      : `${juniorLabel} — junior-only skill`,
  };
}

/** Display names for the Family dashboard tactic list. */
export function manualDisplayForTactics(tactics: JuniorTactic[]): string[] {
  const seen = new Map<string, string>();
  for (const t of tactics) {
    const d = describeTactic(t);
    const key = d.manualName ?? `junior:${d.juniorLabel}`;
    if (!seen.has(key)) {
      seen.set(key, d.manualName ? `${d.manualName} · ${d.manualCode}` : d.juniorLabel);
    }
  }
  return [...seen.values()];
}

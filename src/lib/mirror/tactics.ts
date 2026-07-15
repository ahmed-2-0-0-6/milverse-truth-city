// MILVERSE — Mirror scenario → Field Manual tactic mapping.
// Additive lookup so the Mirror engine and scenarios stay untouched.
// Every official Mirror case is mapped. Community/user-designed cases fall back to a sensible default.

import type { TacticId } from "@/lib/manual/entries";

export const MIRROR_TACTIC: Record<string, TacticId> = {
  "classmate-danish":    "impersonation",     // (REAL — pattern the player learns to trust; still the tactic being rehearsed)
  "boss-newnumber":      "impersonation",
  "survivor-bankfraud":  "phishing",
  "t3-fraud-dept":       "phishing",
  "t3-real-bank":        "phishing",           // (REAL — same pattern being rehearsed against a real bank)
  "t4-ghost-friend":     "impersonation",
  "pk-prize-sms":        "phishing",
  "pk-wrong-txn":        "urgency-fear",
  "pk-online-buyer":     "phishing",
  "pk-dream-job":        "phishing",
  "pk-stranded-cousin":  "impersonation",
  "t4-stressed-sister":  "impersonation",
  "t5-clean-room":       "forgery-engine",
  "t5-unlucky-boss":     "forgery-engine",
  "survivor-wa-admin":   "impersonation",
};

/** Fallback when a scenario has no explicit mapping (e.g. user-designed cases).
    Mirror cases are ALWAYS an identity question, so impersonation is the safe default. */
export function tacticForMirror(id: string): TacticId {
  return MIRROR_TACTIC[id] ?? "impersonation";
}

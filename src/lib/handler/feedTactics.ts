// Builds the caseId → tacticId map for the current Feed catalog.
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import type { TacticId } from "@/lib/manual/entries";

let cached: Map<string, TacticId> | null = null;

export function feedTacticMap(): Map<string, TacticId> {
  if (cached) return cached;
  const m = new Map<string, TacticId>();
  for (const s of FEED_SCENARIOS) {
    if (s.tacticId) m.set(s.id, s.tacticId as TacticId);
  }
  cached = m;
  return m;
}

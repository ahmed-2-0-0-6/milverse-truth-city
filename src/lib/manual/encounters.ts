// MILVERSE — Field Manual "Seen In The Wild".
// Pure, render-time derivation of the player's own encounters with a tactic.
// Read-only over existing stores. Nothing persisted, nothing new on the profile.

import type { TrustProfile } from "@/lib/mirror/profile";
import { SCENARIOS } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import type { TacticId } from "@/lib/manual/entries";

export type EncounterSource = "mirror" | "daily" | "feed";
export type EncounterOutcome =
  | "CORRECT"
  | "MISSED SCAM"
  | "FALSE ALARM"
  | "LUCKY GUESS";

export interface EncounterLink {
  route: "/mirror/$caseId" | "/feed/$caseId";
  params: { caseId: string };
}

export interface Encounter {
  source: EncounterSource;
  caseId: string;
  title: string;
  outcome: EncounterOutcome;
  /** Short date label (e.g. "12.03.26"). Falls back to dateKey for daily w/o ts. */
  dateLabel: string;
  ts: number;
  to?: EncounterLink;
}

export interface EncounterRecord {
  encounters: Encounter[]; // sorted, most recent first
  met: number;
  losses: number; // missed_scam + false_alarm + incorrect daily calls
}

function shortDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`;
}

/** Build a fast id→scenario lookup once per call. Cheap; scenarios are static. */
function mirrorIndex(): Map<string, { title: string; tactic: TacticId }> {
  const m = new Map<string, { title: string; tactic: TacticId }>();
  for (const s of SCENARIOS) m.set(s.id, { title: s.title, tactic: s.tactic });
  return m;
}
function feedIndex(): Map<string, { title: string; tactic?: TacticId }> {
  const m = new Map<string, { title: string; tactic?: TacticId }>();
  for (const s of FEED_SCENARIOS)
    m.set(s.id, { title: s.title, tactic: s.tacticId as TacticId | undefined });
  return m;
}

export function encountersFor(
  tacticId: TacticId,
  profile: TrustProfile | null | undefined,
): EncounterRecord {
  if (!profile) return { encounters: [], met: 0, losses: 0 };

  const mirror = mirrorIndex();
  const feed = feedIndex();
  const rows: Encounter[] = [];
  let losses = 0;

  // Mirror history → tactic via SCENARIOS lookup.
  for (const h of profile.history ?? []) {
    const s = mirror.get(h.caseId);
    if (!s || s.tactic !== tacticId) continue;
    const outcome: EncounterOutcome =
      h.result === "correct"
        ? "CORRECT"
        : h.result === "missed_scam"
          ? "MISSED SCAM"
          : h.result === "false_alarm"
            ? "FALSE ALARM"
            : "LUCKY GUESS";
    if (h.result === "missed_scam" || h.result === "false_alarm") losses++;
    rows.push({
      source: "mirror",
      caseId: h.caseId,
      title: s.title,
      outcome,
      dateLabel: shortDate(h.ts),
      ts: h.ts,
      to: { route: "/mirror/$caseId", params: { caseId: h.caseId } },
    });
  }

  // Daily plays → tactic via feed scenario map (daily caseIds are drawn from FEED_SCENARIOS).
  for (const d of profile.dailyPlays ?? []) {
    const s = feed.get(d.caseId);
    if (!s || s.tactic !== tacticId) continue;
    let outcome: EncounterOutcome;
    if (d.correct) outcome = "CORRECT";
    else if (d.truth === "LEGIT") outcome = "FALSE ALARM";
    else outcome = "MISSED SCAM";
    if (!d.correct) losses++;
    const ts = d.ts || Date.parse(d.dateKey) || 0;
    const link: EncounterLink | undefined = FEED_SCENARIOS.some((x) => x.id === d.caseId)
      ? { route: "/feed/$caseId", params: { caseId: d.caseId } }
      : undefined;
    rows.push({
      source: "daily",
      caseId: d.caseId,
      title: s.title || d.dateKey,
      outcome,
      dateLabel: d.dateKey || shortDate(ts),
      ts,
      to: link,
    });
  }

  // Feed play log: not persisted in this build — skip silently per spec.

  rows.sort((a, b) => b.ts - a.ts);
  return { encounters: rows, met: rows.length, losses };
}

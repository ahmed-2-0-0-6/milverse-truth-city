// MILVERSE — THE CITIZEN SUPPLEMENT.
// Once-a-week personal front page composed at read time from the local profile.
// Entirely deterministic. No cloud reads, no writes except the "lastSeen" week key.
// Separate from THE DAILY MIRAGE editions — never touches edition storage.

import type { TrustProfile } from "@/lib/mirror/profile";
import type { TacticId } from "@/lib/manual/entries";
import {
  computeReading,
  computeWeekly,
  labelForTactic,
  type WeeklyDelta,
} from "@/lib/handler/profile";
import { getScenario } from "@/lib/mirror/scenarios";
import { getFeedScenario } from "@/lib/feed/scenarios";
import {
  shiftedKarachi,
  supplementWeek,
  type SupplementWeek,
} from "./supplementMeta";

export {
  markSupplementSeen,
  readLastSeenWeek,
  supplementWeek,
} from "./supplementMeta";

// ────────────────────────────────────────────────────────────────
// Karachi (UTC+5) week anchor — matches dropDateKey idiom.
// ────────────────────────────────────────────────────────────────


// ────────────────────────────────────────────────────────────────
// Composition
// ────────────────────────────────────────────────────────────────

export interface SupplementColumn {
  head: string;
  body: string;
  link?: { to: string; label: string; params?: Record<string, string> };
}

export interface SupplementPage {
  thin: false;
  masthead: { title: string; line: string };
  headline: string;
  deck: string;
  columns: {
    record: SupplementColumn;
    sharpest: SupplementColumn;
    blindSpot: SupplementColumn;
  };
  pullStat: { label: string; value: number };
  columnist: {
    /** Same summary shape WeeklyEval sends, so the useHandlerLine cache line is identical. */
    summary: {
      lean: string;
      leanBlurb: string;
      strength: string;
      directive: string;
      weakestTactic: string | null;
      weakestWrong: number;
      weakestSeen: number;
      wager: string;
      dailyStreak: number;
      weeklyTrend: WeeklyDelta["leanTrend"];
    };
    fallback: string;
  } | null;
}

export interface SupplementThin {
  thin: true;
  masthead: { title: string; line: string };
  message: string;
}

export type Supplement = SupplementPage | SupplementThin;

function mastheadLine(week: SupplementWeek, rankTitle: string): {
  title: string;
  line: string;
} {
  return {
    title: "THE TRUTH CITY PAPER — CITIZEN SUPPLEMENT",
    line: `WEEK ${week.isoWeek} · PRINTED FOR ${rankTitle.toUpperCase()}`,
  };
}

interface TrailingStats {
  plays: number;
  correct: number;
  missed: number;
  alarms: number;
  distinctDays: number;
}

function trailingStats(profile: TrustProfile, week: SupplementWeek): TrailingStats {
  const daily = (profile.dailyPlays ?? []).filter((p) => p.dateKey >= week.weekKey);
  const hist = (profile.history ?? []).filter((h) => h.ts >= week.sundayStartUtcMs);

  let missed = 0;
  let alarms = 0;
  let correct = 0;
  for (const e of daily) {
    if (e.correct) correct++;
    else if (e.truth === "LEGIT" && e.verdict !== "LEGIT") alarms++;
    else if (e.truth !== "LEGIT" && e.verdict === "LEGIT") missed++;
  }
  for (const h of hist) {
    if (h.result === "correct") correct++;
    else if (h.result === "missed_scam") missed++;
    else if (h.result === "false_alarm") alarms++;
  }
  const daySet = new Set<string>();
  for (const p of daily) daySet.add(p.dateKey);
  for (const h of hist) {
    const s = shiftedKarachi(new Date(h.ts)).toISOString().slice(0, 10);
    daySet.add(s);
  }
  return {
    plays: daily.length + hist.length,
    correct,
    missed,
    alarms,
    distinctDays: daySet.size,
  };
}

/** The verdict-word we print in "SHARPEST CALL". */
function verdictWord(v: "REAL" | "FAKE"): string {
  return v === "REAL" ? "REAL" : "FAKE";
}

function buildSharpest(profile: TrustProfile, week: SupplementWeek): SupplementColumn {
  const trailing = (profile.history ?? []).filter(
    (h) => h.ts >= week.sundayStartUtcMs && h.result === "correct",
  );
  if (trailing.length === 0) {
    return {
      head: "SHARPEST CALL",
      body: "No standout. The week was survival.",
    };
  }
  const best = trailing.reduce((a, b) => (b.points > a.points ? b : a));
  const scenario = getScenario(best.caseId);
  const title = scenario?.title ?? "Unfiled case";
  return {
    head: "SHARPEST CALL",
    body: `${title} — called it ${verdictWord(best.verdict)} at Tier ${best.tier}.`,
  };
}

function buildBlindSpot(
  weakness: ReturnType<typeof computeReading>["weakness"],
): SupplementColumn {
  if (!weakness || weakness.tactic === "unknown") {
    return {
      head: "THE BLIND SPOT",
      body: "No repeat offender this week.",
    };
  }
  const t = weakness.tactic as TacticId;
  const label = labelForTactic(t);
  const cap = label.charAt(0).toUpperCase() + label.slice(1);
  return {
    head: "THE BLIND SPOT",
    body: `${cap} beat this citizen ${weakness.wrong} of ${weakness.seen} times. The Manual has a page on it.`,
    link: {
      to: "/manual/$entryId",
      label: "OPEN THE PAGE →",
      params: { entryId: String(t) },
    },
  };
}

function buildRecord(stats: TrailingStats): SupplementColumn {
  return {
    head: "THE RECORD",
    body: [
      `CASES PLAYED   ${stats.plays}`,
      `CORRECT        ${stats.correct}`,
      `MISSED SCAMS   ${stats.missed}`,
      `FALSE ALARMS   ${stats.alarms}`,
    ].join("\n"),
  };
}

function pickHeadline(
  weekly: WeeklyDelta | null,
  stats: TrailingStats,
): { headline: string; deck: string } {
  const trend = weekly?.leanTrend ?? "steady";
  const gullible = stats.missed > stats.alarms;
  if (trend === "toward-calibrated") {
    return {
      headline: "CITIZEN PULLS TOWARD CALIBRATED",
      deck: "Seven days of calls. The drift is in the right direction.",
    };
  }
  if (trend === "away-from-calibrated" && gullible) {
    return {
      headline: "SOFT TOUCH WEEK ON THE WATCH",
      deck: "The city's marks said yes too often. The file shows the pattern.",
    };
  }
  if (trend === "away-from-calibrated" && !gullible) {
    return {
      headline: "FALSE ALARMS RING ACROSS THE QUARTER",
      deck: "Real calls paid the price for nerves. Both columns lose.",
    };
  }
  if (trend === "steady" && stats.correct > 0) {
    return {
      headline: "A STEADY HAND HOLDS THE LINE",
      deck: "No drama. That's the compliment.",
    };
  }
  return {
    headline: "QUIET WEEK IN TRUST CITY",
    deck: "The desk was manned. The city noticed.",
  };
}

function pickPullStat(profile: TrustProfile, stats: TrailingStats): {
  label: string;
  value: number;
} {
  const candidates: Array<{ label: string; value: number }> = [
    { label: "DAYS ON WATCH", value: profile.dailyStreak ?? 0 },
    { label: "CLEAN CALLS", value: stats.correct },
    { label: "FILES TOUCHED", value: stats.plays },
  ];
  // Deterministic max: on ties, first candidate wins (streak > correct > plays).
  return candidates.reduce((a, b) => (b.value > a.value ? b : a));
}

export function buildSupplement(
  profile: TrustProfile,
  feedTacticById: Map<string, TacticId>,
  rankTitle: string,
  now: Date = new Date(),
): Supplement {
  const week = supplementWeek(now);
  const stats = trailingStats(profile, week);
  const masthead = mastheadLine(week, rankTitle);

  if (stats.plays < 3) {
    return {
      thin: true,
      masthead,
      message:
        "NOT ENOUGH INK. The presses need at least three calls to print a week. The city's still out there.",
    };
  }

  const weekly = computeWeekly(profile, feedTacticById);
  const reading = computeReading(profile, feedTacticById);
  const { headline, deck } = pickHeadline(weekly, stats);

  const columns = {
    record: buildRecord(stats),
    sharpest: buildSharpest(profile, week),
    blindSpot: buildBlindSpot(reading.weakness),
  };

  const pullStat = pickPullStat(profile, stats);

  // Columnist: only render when the shared WeeklyEval line would exist,
  // so /profile and /paper/supplement resolve to the same cached line.
  const columnist: SupplementPage["columnist"] = weekly
    ? {
        summary: {
          lean: reading.lean.label,
          leanBlurb: reading.lean.blurb,
          strength: reading.strength,
          directive: reading.directive,
          weakestTactic: reading.weakness ? String(reading.weakness.tactic) : null,
          weakestWrong: reading.weakness?.wrong ?? 0,
          weakestSeen: reading.weakness?.seen ?? 0,
          wager: reading.wager.label,
          dailyStreak: profile.dailyStreak ?? 0,
          weeklyTrend: weekly.leanTrend,
        },
        fallback: `Seven days on the watch. ${
          weekly.leanTrend === "toward-calibrated"
            ? "You're pulling toward calibrated."
            : weekly.leanTrend === "away-from-calibrated"
              ? "You've drifted this week."
              : "Steady hand."
        } ${weekly.nextGoal}`,
      }
    : null;

  return {
    thin: false,
    masthead,
    headline,
    deck,
    columns,
    pullStat,
    columnist,
  };
}


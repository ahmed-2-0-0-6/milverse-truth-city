// MILVERSE — THE HANDLER's read of your training profile.
// Pure, deterministic math on existing TrustProfile data. No AI here.
// The AI layer (handler.functions) only *narrates* what this file computes.

import type { TrustProfile, HistoryEntry, DailyPlayEntry } from "@/lib/mirror/profile";
import type { TacticId } from "@/lib/manual/entries";

// ── LEAN axis ────────────────────────────────────────────────────
// Gullible (missed scams dominate) ←→ Paranoid (false alarms dominate).
// Signed lean score = missed - falseAlarms, normalized against calls.
export type LeanId =
  | "soft-target"        // very gullible
  | "drifting-trusting"  // mildly gullible
  | "calibrated"         // balanced
  | "jumpy"              // mildly paranoid
  | "fortress-mind"      // very paranoid
  | "rookie";            // < 5 cases

export interface LeanReading {
  id: LeanId;
  code: string;    // e.g. "L-02"
  label: string;   // ALL-CAPS noir label
  blurb: string;   // one-line deterministic description
  score: number;   // -1..+1 (negative = gullible, positive = paranoid)
  totalCalls: number;
}

/** Cases used for lean math: only definitive Missed-Scam / False-Alarm calls count. */
function pressureCallsFromHistory(h: HistoryEntry[]) {
  const missed = h.filter((e) => e.result === "missed_scam").length;
  const alarms = h.filter((e) => e.result === "false_alarm").length;
  return { missed, alarms };
}

/** Also fold in Daily Drop mistakes so the signal grows outside Mirror. */
function pressureCallsFromDaily(d: DailyPlayEntry[]) {
  // A wrong LEGIT call on a SCAM/MISLEADING artifact = missed scam.
  // A wrong SCAM call on a LEGIT artifact = false alarm.
  let missed = 0, alarms = 0;
  for (const e of d) {
    if (e.correct) continue;
    if (e.truth === "LEGIT" && e.verdict !== "LEGIT") alarms++;
    else if (e.truth !== "LEGIT" && e.verdict === "LEGIT") missed++;
  }
  return { missed, alarms };
}

export function computeLean(profile: TrustProfile): LeanReading {
  const hist = profile.history ?? [];
  const daily = profile.dailyPlays ?? [];
  const a = pressureCallsFromHistory(hist);
  const b = pressureCallsFromDaily(daily);
  const missed = a.missed + b.missed;
  const alarms = a.alarms + b.alarms;
  const totalCalls = hist.length + daily.length;

  if (totalCalls < 5) {
    return {
      id: "rookie",
      code: "L-00",
      label: "ROOKIE",
      blurb: "File's thin. Play a few more, then we'll talk.",
      score: 0,
      totalCalls,
    };
  }

  // Signed, bounded. Missed pushes negative (gullible), alarms positive (paranoid).
  const denom = Math.max(3, missed + alarms);
  const raw = (alarms - missed) / denom; // −1..+1
  // Attenuate by evidence volume so tiny samples don't scream.
  const evidence = Math.min(1, (missed + alarms) / 6);
  const score = raw * evidence;

  const abs = Math.abs(score);
  let id: LeanId;
  if (abs < 0.15) id = "calibrated";
  else if (score < 0) id = abs > 0.5 ? "soft-target" : "drifting-trusting";
  else id = abs > 0.5 ? "fortress-mind" : "jumpy";

  const map: Record<Exclude<LeanId, "rookie">, { code: string; label: string; blurb: string }> = {
    "soft-target":       { code: "L-01", label: "SOFT TARGET",       blurb: `${missed} scams walked past you. They don't fool you — they rush you.` },
    "drifting-trusting": { code: "L-02", label: "DRIFTING TRUSTING", blurb: `You lean in a little too fast. Fixable.` },
    "calibrated":        { code: "L-03", label: "CALIBRATED",        blurb: `Balanced. Keep the head cold.` },
    "jumpy":             { code: "L-04", label: "JUMPY",             blurb: `${alarms} clean messages flagged. Real people paid the price.` },
    "fortress-mind":     { code: "L-05", label: "FORTRESS MIND",     blurb: `Nothing gets through — including things that should. That's a cost.` },
  };
  return { id, ...map[id], score, totalCalls };
}

// ── Per-tactic weakness map ──────────────────────────────────────
export interface TacticStat {
  tactic: TacticId | "unknown";
  seen: number;
  wrong: number;
  wrongRate: number;   // 0..1
}

/** Only Feed carries a first-class tacticId today; hook Mirror in via caseId later. */
export function computeTacticStats(profile: TrustProfile, feedTacticById: Map<string, TacticId>): TacticStat[] {
  const buckets = new Map<TacticId | "unknown", { seen: number; wrong: number }>();
  for (const e of profile.dailyPlays ?? []) {
    const t = feedTacticById.get(e.caseId) ?? "unknown";
    const b = buckets.get(t) ?? { seen: 0, wrong: 0 };
    b.seen++;
    if (!e.correct) b.wrong++;
    buckets.set(t, b);
  }
  // Mirror history: no tacticId today — folded in as "unknown" so we don't lie.
  for (const e of profile.history ?? []) {
    const b = buckets.get("unknown") ?? { seen: 0, wrong: 0 };
    b.seen++;
    if (e.result === "missed_scam" || e.result === "false_alarm") b.wrong++;
    buckets.set("unknown", b);
  }
  return Array.from(buckets.entries())
    .filter(([t]) => t !== "unknown")
    .map(([tactic, v]) => ({ tactic, seen: v.seen, wrong: v.wrong, wrongRate: v.wrong / Math.max(1, v.seen) }))
    .sort((a, b) => (b.wrongRate - a.wrongRate) || (b.wrong - a.wrong));
}

/** Which tactic to prescribe training on. `null` if evidence too thin. */
export function weakestTactic(stats: TacticStat[]): TacticStat | null {
  const candidate = stats.find((s) => s.seen >= 2 && s.wrong >= 1);
  return candidate ?? null;
}

// ── Wager behavior ───────────────────────────────────────────────
export type WagerRead = "overconfident" | "timid" | "measured" | "insufficient";
export interface WagerReading {
  id: WagerRead;
  label: string;
  blurb: string;
  avgStakeOnWrong: number;
  avgStakeOnRight: number;
  samples: number;
}

export function computeWagerRead(profile: TrustProfile): WagerReading {
  const plays = profile.dailyPlays ?? [];
  if (plays.length < 4) {
    return { id: "insufficient", label: "—", blurb: "Not enough Drops played to read the wager.", avgStakeOnWrong: 0, avgStakeOnRight: 0, samples: plays.length };
  }
  const right = plays.filter((p) => p.correct);
  const wrong = plays.filter((p) => !p.correct);
  const avg = (a: DailyPlayEntry[]) => (a.length ? a.reduce((s, p) => s + p.stake, 0) / a.length : 0);
  const rW = avg(wrong), rR = avg(right);
  if (wrong.length >= 2 && rW > rR * 1.4 && rW >= 20) {
    return { id: "overconfident", label: "OVERCONFIDENT", blurb: `Big stakes on wrong calls — average ${Math.round(rW)}.`, avgStakeOnWrong: rW, avgStakeOnRight: rR, samples: plays.length };
  }
  if (right.length >= 2 && rR < rW * 0.7 && rR <= 15) {
    return { id: "timid", label: "TIMID", blurb: `Tiny stakes on right calls — average ${Math.round(rR)}. Trust your read.`, avgStakeOnWrong: rW, avgStakeOnRight: rR, samples: plays.length };
  }
  return { id: "measured", label: "MEASURED", blurb: `Stakes track the read. Keep it.`, avgStakeOnWrong: rW, avgStakeOnRight: rR, samples: plays.length };
}

// ── Strongest skill (a small win to hand back) ───────────────────
export function strongestSkill(profile: TrustProfile, stats: TacticStat[]): string {
  const best = [...stats].reverse().find((s) => s.seen >= 2 && s.wrongRate <= 0.34);
  if (best) return `You're clean on ${labelForTactic(best.tactic as TacticId)}.`;
  const correct = profile.correctVerdicts;
  if (correct >= 5) return `You've closed ${correct} cases correctly. That's not luck anymore.`;
  return `Instinct's alive. Now we sharpen it.`;
}

export function labelForTactic(t: TacticId): string {
  const m: Record<TacticId, string> = {
    "impersonation":    "impersonation plays",
    "urgency-fear":     "urgency-and-fear rushes",
    "out-of-context":   "out-of-context photos",
    "engagement-bait":  "engagement bait",
    "imposter-outlet":  "fake news outlets",
    "phishing":         "phishing bait",
    "trust-farming":    "trust-farming warmups",
    "ai-generated":     "AI-generated fakes",
    "mis-dis-mal":      "mis/dis/mal information",
    "forgery-engine":   "forged documents",
  };
  return m[t] ?? String(t);
}

// ── Full reading bundle ──────────────────────────────────────────
export interface HandlerReading {
  lean: LeanReading;
  wager: WagerReading;
  weakness: TacticStat | null;
  strength: string;
  /** Deterministic directive derived from lean + weakness + wager. */
  directive: string;
  /** Deterministic assignment: recommended district + optional tacticId to drill. */
  assignment: {
    district: "mirror" | "feed" | "drop";
    tactic: TacticId | null;
    reason: string;
  };
}

export function computeReading(profile: TrustProfile, feedTacticById: Map<string, TacticId>): HandlerReading {
  const lean = computeLean(profile);
  const wager = computeWagerRead(profile);
  const stats = computeTacticStats(profile, feedTacticById);
  const weakness = weakestTactic(stats);
  const strength = strongestSkill(profile, stats);

  // Directive rules — paranoid → assignment that WINS by trusting; gullible → urgency drills;
  // overconfident → low-stake precision; timid → stake up on high-confidence reads.
  let directive: string;
  if (lean.id === "soft-target" || lean.id === "drifting-trusting") {
    directive = "Slow down before you agree. When the clock's loud, that IS the attack — probe first.";
  } else if (lean.id === "jumpy" || lean.id === "fortress-mind") {
    directive = "Not every stranger is a threat. Prove REAL as hard as you prove FAKE.";
  } else if (wager.id === "overconfident") {
    directive = "Ease off the stake until the read is airtight.";
  } else if (wager.id === "timid") {
    directive = "Stake matches your read. Bet the reads you'd bet with your own money.";
  } else {
    directive = "Hold the line. Push into a tactic you haven't drilled.";
  }

  // Assignment routing.
  let district: "mirror" | "feed" | "drop" = "drop";
  let tactic: TacticId | null = weakness ? (weakness.tactic as TacticId) : null;
  let reason = "Daily Drop — one clean rep, wager-aware.";
  if (lean.id === "jumpy" || lean.id === "fortress-mind") {
    district = "feed";
    reason = "Feed has REAL-verdict cases. Win by trusting the right ones.";
  } else if (lean.id === "soft-target" || lean.id === "drifting-trusting") {
    district = "feed";
    tactic = tactic ?? "urgency-fear";
    reason = "Feed drill on urgency/impersonation. Same play, different mask.";
  } else if (wager.id === "overconfident") {
    district = "drop";
    reason = "One low-stake Drop. Precision over volume.";
  }

  return { lean, wager, weakness, strength, directive, assignment: { district, tactic, reason } };
}

// ── Weekly delta — for the PSYCH EVAL screen ─────────────────────
export interface WeeklyDelta {
  daysPlayed: number;
  leanTrend: "steady" | "toward-calibrated" | "away-from-calibrated";
  tacticImprovement: { tactic: TacticId; before: number; after: number } | null;
  nextGoal: string;
}

export function computeWeekly(profile: TrustProfile, feedTacticById: Map<string, TacticId>): WeeklyDelta | null {
  const plays = profile.dailyPlays ?? [];
  const days = new Set(plays.map((p) => p.dateKey));
  if (days.size < 7) return null;

  const sorted = [...plays].sort((a, b) => a.ts - b.ts);
  const half = Math.floor(sorted.length / 2);
  const early = sorted.slice(0, half);
  const late = sorted.slice(half);
  const leanScore = (arr: DailyPlayEntry[]) => {
    let missed = 0, alarms = 0;
    for (const e of arr) if (!e.correct) {
      if (e.truth === "LEGIT" && e.verdict !== "LEGIT") alarms++;
      else if (e.truth !== "LEGIT" && e.verdict === "LEGIT") missed++;
    }
    const d = Math.max(3, missed + alarms);
    return (alarms - missed) / d;
  };
  const eScore = leanScore(early);
  const lScore = leanScore(late);
  const drift = Math.abs(lScore) - Math.abs(eScore);
  const leanTrend =
    Math.abs(drift) < 0.1 ? "steady" :
    drift < 0 ? "toward-calibrated" : "away-from-calibrated";

  // Best-improved tactic
  const improved: WeeklyDelta["tacticImprovement"] = (() => {
    const bucket = (arr: DailyPlayEntry[]) => {
      const m = new Map<TacticId, { seen: number; wrong: number }>();
      for (const p of arr) {
        const t = feedTacticById.get(p.caseId);
        if (!t) continue;
        const b = m.get(t) ?? { seen: 0, wrong: 0 };
        b.seen++;
        if (!p.correct) b.wrong++;
        m.set(t, b);
      }
      return m;
    };
    const e = bucket(early), l = bucket(late);
    let best: WeeklyDelta["tacticImprovement"] = null;
    let bestDelta = 0;
    for (const [t, lv] of l.entries()) {
      const ev = e.get(t);
      if (!ev || ev.seen < 2 || lv.seen < 2) continue;
      const before = ev.wrong / ev.seen;
      const after = lv.wrong / lv.seen;
      const d = before - after;
      if (d > bestDelta) { bestDelta = d; best = { tactic: t, before, after }; }
    }
    return best;
  })();

  const nextGoal =
    leanTrend === "toward-calibrated" ? "Hold the drift toward calibrated. One Drop a day."
    : leanTrend === "away-from-calibrated" ? "Reset. Do three Feed cases before the next Drop."
    : "Push into an unfamiliar tactic this week.";

  return { daysPlayed: days.size, leanTrend, tacticImprovement: improved, nextGoal };
}

// MILVERSE — Weekly PSYCH EVAL (noir file design, spoiler-free).
// Shows only once 7+ distinct days have been played.

import { useEffect, useMemo, useState } from "react";
import { loadProfile } from "@/lib/mirror/profile";
import { computeReading, computeWeekly, labelForTactic } from "@/lib/handler/profile";
import { feedTacticMap } from "@/lib/handler/feedTactics";
import { useHandlerLine } from "@/lib/handler/useHandlerLine";

export function WeeklyEval() {
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile> | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const map = feedTacticMap();
  const reading = useMemo(() => (profile ? computeReading(profile, map) : null), [profile, map]);
  const weekly = useMemo(() => (profile ? computeWeekly(profile, map) : null), [profile, map]);

  const fallback = weekly
    ? `Seven days on the watch. ${weekly.leanTrend === "toward-calibrated" ? "You're pulling toward calibrated." : weekly.leanTrend === "away-from-calibrated" ? "You've drifted this week." : "Steady hand."} ${weekly.nextGoal}`
    : "";

  const line = useHandlerLine({
    surface: "psych-eval",
    fallback,
    enabled: !!weekly,
    cacheKey: profile?.playerId,
    summary: {
      lean: reading?.lean.label ?? "",
      leanBlurb: reading?.lean.blurb ?? "",
      strength: reading?.strength ?? "",
      directive: reading?.directive ?? "",
      weakestTactic: reading?.weakness ? String(reading.weakness.tactic) : null,
      weakestWrong: reading?.weakness?.wrong ?? 0,
      weakestSeen: reading?.weakness?.seen ?? 0,
      wager: reading?.wager.label ?? "—",
      dailyStreak: profile?.dailyStreak ?? 0,
      weeklyTrend: weekly?.leanTrend ?? null,
    },
  });

  if (!weekly) return null;

  return (
    <section className="mt-6 rounded-2xl border-2 border-caution/50 bg-card p-5 sm:p-6 relative overflow-hidden">
      <div className="stencil text-[10px] tracking-[0.35em] text-caution">
        PSYCH EVAL · WEEK IN REVIEW
      </div>
      <div className="mt-2 text-sm text-foreground/95">{line.text}</div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <Stat label="DAYS ON WATCH" value={String(weekly.daysPlayed)} />
        <Stat label="LEAN TREND" value={weekly.leanTrend.replace(/-/g, " ").toUpperCase()} />
        <Stat
          label="TACTIC MASTERY"
          value={
            weekly.tacticImprovement
              ? `${labelForTactic(weekly.tacticImprovement.tactic).toUpperCase()} · ${Math.round((weekly.tacticImprovement.before - weekly.tacticImprovement.after) * 100)}%↑`
              : "—"
          }
        />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 px-3 py-2">
      <div className="stencil text-[9px] tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-[12px] text-foreground">{value}</div>
    </div>
  );
}

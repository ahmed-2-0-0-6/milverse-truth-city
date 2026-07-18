// MILVERSE — "The City Solved This" debrief block.
// Renders after the player's verdict is locked. Reads aggregate counts
// (n>=5 suppressed in SQL). Silent on failure or suppression.

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCityStats } from "@/lib/citystats.functions";

type PlayerResult = "correct" | "missed_scam" | "false_alarm";

type Stats = { total: number; fooledPct: number; falseAlarmPct: number };

export function CitySolved({
  caseId,
  playerResult,
}: {
  caseId: string;
  playerResult: PlayerResult;
}) {
  const fetchStats = useServerFn(getCityStats);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStats({ data: { caseId } })
      .then((r) => {
        if (alive && r) setStats(r);
      })
      .catch(() => {
        /* silent — block simply doesn't render */
      });
    return () => {
      alive = false;
    };
  }, [caseId, fetchStats]);

  if (!stats) return null;

  const { total, fooledPct, falseAlarmPct } = stats;
  const cleanPct = Math.max(0, 100 - fooledPct - falseAlarmPct);

  // Deterministic min-width so nonzero segments always show.
  const segW = (pct: number) => (pct <= 0 ? 0 : Math.max(2, pct));
  const cleanW = segW(cleanPct);
  const fooledW = segW(fooledPct);
  const falseW = segW(falseAlarmPct);

  const line2 =
    playerResult === "correct"
      ? fooledPct >= 40
        ? `${fooledPct}% of the city got fooled here. You didn't.`
        : "Most of the city cleared this one. So did you."
      : playerResult === "missed_scam"
        ? `${fooledPct}% of the city fell for this exact move. You're in crowded company. That's the point of training.`
        : `${falseAlarmPct}% of the city called this one wrong in the same direction. Paranoia has a bill too.`;

  const ariaLabel = `City record: ${total} closes. ${cleanPct}% clean, ${fooledPct}% fooled, ${falseAlarmPct}% false alarms.`;

  return (
    <section
      className="rounded-xl border border-border bg-card p-6"
      aria-live="polite"
      aria-label="City record loaded"
    >
      <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
        THE CITY'S RECORD
      </div>
      <p className="text-sm">
        This case has been closed <b className="font-mono">{total.toLocaleString()}</b> times.
      </p>

      <div
        role="img"
        aria-label={ariaLabel}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted flex"
      >
        {cleanW > 0 && (
          <div
            className="bar-fill h-full bg-primary"
            style={{ width: `${cleanW}%` }}
            aria-hidden
          />
        )}
        {fooledW > 0 && (
          <div
            className="bar-fill h-full bg-destructive"
            style={{ width: `${fooledW}%` }}
            aria-hidden
          />
        )}
        {falseW > 0 && (
          <div
            className="bar-fill h-full bg-caution"
            style={{ width: `${falseW}%` }}
            aria-hidden
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span>
          <span className="inline-block w-2 h-2 rounded-sm bg-primary mr-1.5 align-middle" />
          {cleanPct}% closed clean
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-sm bg-destructive mr-1.5 align-middle" />
          {fooledPct}% fooled
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-sm bg-caution mr-1.5 align-middle" />
          {falseAlarmPct}% false alarms
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed">{line2}</p>

      <p className="mt-3 text-[11px] text-muted-foreground italic">
        Anonymous counts. No names, no messages. Cases under 5 closes stay sealed.
      </p>
    </section>
  );
}

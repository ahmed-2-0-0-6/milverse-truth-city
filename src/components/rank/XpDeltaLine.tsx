// MILVERSE — Small "+N XP" line for debrief screens.
// Reads the last XP delta snapshot recorded by the commit flow.

import { useEffect, useState } from "react";
import { readXpDelta } from "@/lib/rank/xpSnapshot";
import { rankFromXp } from "@/lib/ranks";

export function XpDeltaLine({ className = "" }: { className?: string }) {
  const [snap, setSnap] = useState<ReturnType<typeof readXpDelta>>(null);

  useEffect(() => {
    setSnap(readXpDelta());
  }, []);

  if (!snap || snap.delta <= 0) return null;
  const rank = rankFromXp(snap.after);
  const pct = Math.round(rank.progress * 100);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded border border-border bg-card/60 px-2.5 py-1.5 ${className}`}
      aria-label={`Plus ${snap.delta} XP. ${pct} percent to ${rank.next?.name ?? "max rank"}.`}
    >
      <span className="stencil text-[10px] text-primary">+{snap.delta} XP</span>
      <span
        className="block h-[2px] w-8 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className={`block h-full ${rank.next ? "bg-primary" : "bg-caution"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="stencil text-[9px] text-muted-foreground">
        {rank.current.name}
      </span>
    </div>
  );
}

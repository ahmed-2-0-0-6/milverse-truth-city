// MILVERSE — Small Handler quote line, e.g. after a Daily Drop reveal.
// Cached, fallback-first.

import { useEffect, useMemo, useState } from "react";
import { loadProfile } from "@/lib/mirror/profile";
import { computeReading } from "@/lib/handler/profile";
import { feedTacticMap } from "@/lib/handler/feedTactics";
import { useHandlerLine } from "@/lib/handler/useHandlerLine";
import { fallbackDropLine } from "@/lib/handler/copy";

interface Props {
  /** Correctness of the play the line is reacting to. */
  correct: boolean;
  stake: number;
  streak: number;
  /** Extra key to force a fresh cache slot per play (e.g. dateKey). */
  cacheKey?: string;
}

export function HandlerDropLine({ correct, stake, streak, cacheKey }: Props) {
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile> | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const reading = useMemo(() => (profile ? computeReading(profile, feedTacticMap()) : null), [profile]);
  const fallback = fallbackDropLine({ correct, stake, streak, seed: (profile?.playerId?.length ?? 1) * 7 + stake });

  const line = useHandlerLine({
    surface: "drop-line",
    fallback,
    cacheKey: `${profile?.playerId ?? "anon"}:${cacheKey ?? ""}`,
    enabled: !!reading,
    summary: {
      lean: reading?.lean.label ?? "ROOKIE",
      leanBlurb: reading?.lean.blurb ?? "",
      strength: reading?.strength ?? "",
      directive: reading?.directive ?? "",
      weakestTactic: reading?.weakness ? String(reading.weakness.tactic) : null,
      weakestWrong: reading?.weakness?.wrong ?? 0,
      weakestSeen: reading?.weakness?.seen ?? 0,
      wager: reading?.wager.label ?? "—",
      dailyStreak: streak,
      lastPlayCorrect: correct,
      lastPlayStake: stake,
    },
  });

  return (
    <div className="mt-4 rounded-md border border-primary/40 bg-background/70 p-3">
      <div className="stencil text-[9px] tracking-widest text-primary">THE HANDLER</div>
      <div className="mt-1 text-sm text-foreground/95 italic">"{line.text}"</div>
    </div>
  );
}

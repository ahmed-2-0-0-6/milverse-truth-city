// MILVERSE — LOSS BEAT chip.
// Renders in the debrief on losses only. Handler names the pattern, not the
// player's worth. Silent on wins — that silence is characterization.

import { useEffect, useMemo, useState } from "react";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { computeLean } from "@/lib/handler/profile";
import { buildLossBeat, lossBeatSeed } from "@/lib/handler/lossbeat";
import { useHandlerLine } from "@/lib/handler/useHandlerLine";

export interface LossBeatProps {
  result: "missed_scam" | "false_alarm";
  tacticLabel: string | null;
  /** Stable seed source (caseId is fine). */
  seedKey: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function LossBeat({ result, tacticLabel, seedKey }: LossBeatProps) {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const derived = useMemo(() => {
    if (!profile) return null;
    const reading = computeLean(profile);
    const cutoff = Date.now() - 30 * DAY_MS;
    const recentSameResult = (profile.history ?? []).filter(
      (h) => h.result === result && (h.ts ?? 0) >= cutoff,
    ).length;
    const seed = lossBeatSeed(seedKey);
    const beat = buildLossBeat(
      { result, tacticLabel, recentSameResult, lean: reading },
      seed,
    );
    return { reading, beat };
  }, [profile, result, tacticLabel, seedKey]);

  const line = useHandlerLine({
    surface: "loss-debrief",
    fallback: derived?.beat.line ?? "",
    enabled: !!derived,
    cacheKey: `${profile?.playerId ?? ""}:${seedKey}`,
    summary: derived
      ? {
          lean: derived.reading.label,
          leanBlurb: derived.reading.blurb,
          strength: "",
          directive: derived.beat.line,
          weakestTactic: tacticLabel,
          weakestWrong: 0,
          weakestSeen: 0,
          wager: "—",
          dailyStreak: profile?.dailyStreak ?? 0,
        }
      : {
          lean: "",
          leanBlurb: "",
          strength: "",
          directive: "",
          weakestTactic: null,
          weakestWrong: 0,
          weakestSeen: 0,
          wager: "—",
          dailyStreak: 0,
        },
  });

  if (!derived || !line.text) return null;

  return (
    <div className="mt-4 rounded-md border border-primary/40 bg-background/70 px-3 py-3">
      <div className="stencil text-[9px] tracking-widest text-primary">— THE HANDLER</div>
      <div className="mt-1 text-[13px] text-foreground/95 italic">{`"${line.text}"`}</div>
      {derived.beat.pattern && (
        <div className="mt-2 border-t border-primary/20 pt-2 font-mono text-[11px] tracking-wide text-primary/90">
          {derived.beat.pattern}
        </div>
      )}
    </div>
  );
}

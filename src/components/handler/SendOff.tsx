// MILVERSE — SEND-OFF chip.
// Pre-case Handler line. CASE-BLIND by construction: this component takes
// no scenario prop. It reads the player profile, computes a pattern read,
// and renders the deterministic template first (with cached AI rephrase).

import { useEffect, useMemo, useState } from "react";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { computeLean, computeTacticStats, weakestTactic } from "@/lib/handler/profile";
import { feedTacticMap } from "@/lib/handler/feedTactics";
import { buildSendOff, sendOffSeed } from "@/lib/handler/sendoff";
import { useHandlerLine } from "@/lib/handler/useHandlerLine";
import { dropDateKey } from "@/lib/daily/rotation";
import { computeConviction } from "@/lib/mirror/conviction";

export function SendOff() {
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
    const stats = computeTacticStats(profile, feedTacticMap());
    const weakest = weakestTactic(stats);
    const recentResults = (profile.history ?? []).slice(-5).map((h) => h.result);
    const seed = sendOffSeed(dropDateKey(), profile.casesPlayed ?? 0);
    const fallback = buildSendOff(
      reading,
      { weakest, dailyStreak: profile.dailyStreak ?? 0, recentResults },
      seed,
    );
    return { reading, weakest, fallback };
  }, [profile]);

  const line = useHandlerLine({
    surface: "send-off",
    fallback: derived?.fallback ?? "",
    enabled: !!derived,
    cacheKey: profile?.playerId,
    summary: derived
      ? {
          lean: derived.reading.label,
          leanBlurb: derived.reading.blurb,
          strength: "",
          directive: derived.fallback,
          weakestTactic: derived.weakest ? String(derived.weakest.tactic) : null,
          weakestWrong: derived.weakest?.wrong ?? 0,
          weakestSeen: derived.weakest?.seen ?? 0,
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
    <div className="mt-4 rounded-md border border-primary/40 bg-background/70 px-3 py-2">
      <div className="stencil text-[9px] tracking-widest text-primary">— THE HANDLER</div>
      <div className="mt-0.5 text-[13px] text-foreground/95 italic min-h-[1.25rem]">
        {`"${line.text}"`}
      </div>
    </div>
  );
}

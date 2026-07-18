// MILVERSE — Seasonal chrome. Presentation-only surfaces around cases.
// See src/lib/city/season.ts for THE WEATHER LAW.

import { useEffect, useState } from "react";
import { seasonFor, type Season } from "@/lib/city/season";

/** Live-reactive hook. Re-reads seasonFor() on mount and window focus so a
 *  dev-override localStorage flip is picked up without a hard reload. */
export function useSeason(): Season | null {
  const [season, setSeason] = useState<Season | null>(() => seasonFor());
  useEffect(() => {
    const on = () => setSeason(seasonFor());
    window.addEventListener("focus", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return season;
}

/** Amber-left-border advisory card. Renders above tier sections on hubs. */
export function SeasonAdvisory({ season }: { season: Season | null }) {
  if (!season) return null;
  return (
    <section
      className="mt-6 mb-6 rounded-sm border border-amber-500/30 border-l-4 border-l-amber-400 bg-amber-500/5 p-4"
      aria-label={`${season.name} advisory`}
    >
      <div className="stencil text-[10px] tracking-[0.3em] text-amber-300">
        {season.name} · CITY ADVISORY
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{season.advisory}</p>
      <div className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
        FILES MATCHING THIS WEATHER ARE MARKED ⛆
      </div>
    </section>
  );
}

/** Small seasonal-circulation glyph. Renders as text with an aria-label so
 *  screen readers announce it. Visually identical for REAL and IMPOSTER cases. */
export function SeasonGlyph({ season }: { season: Season | null }) {
  if (!season) return null;
  return (
    <span
      className="inline-flex items-center rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-amber-300"
      aria-label={`in ${season.name} circulation`}
      title={`${season.name} · in circulation`}
    >
      ⛆
    </span>
  );
}

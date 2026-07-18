// MILVERSE — "RECOMMENDED FOR YOU" strip. Client-side, no AI.
// Seasonal re-sort: when a season is live, its tactic-matching cases sort
// first WITHIN the existing recommendation output — stable, presentation-only.
// The recommendation logic in @/lib/recommendations is UNTOUCHED.
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { getMirrorRecommendations, type Recommendation } from "@/lib/recommendations";
import { useSeason } from "@/components/season/SeasonAdvisory";
import { tacticForMirror } from "@/lib/mirror/tactics";
import { SeasonGlyph } from "@/components/season/SeasonAdvisory";

export function RecommendedStrip() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const season = useSeason();
  useEffect(() => {
    setRecs(getMirrorRecommendations(loadProfile()));
    const on = () => setRecs(getMirrorRecommendations(loadProfile()));
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  // Stable re-sort within the existing output. Season-matching cases float
  // to the front; original order preserved otherwise. Zero logic drift.
  const ordered = useMemo(() => {
    if (!season) return recs;
    const decorated = recs.map((r, i) => ({
      r,
      i,
      seasonal: season.tactics.includes(tacticForMirror(r.scenario.id)),
    }));
    decorated.sort((a, b) => {
      if (a.seasonal !== b.seasonal) return a.seasonal ? -1 : 1;
      return a.i - b.i;
    });
    return decorated.map((d) => d.r);
  }, [recs, season]);

  if (!ordered.length) return null;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2 stencil text-[10px] text-primary">
        <Sparkles className="h-3 w-3" /> RECOMMENDED FOR YOU
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ordered.map((r) => {
          const inSeason = !!season && season.tactics.includes(tacticForMirror(r.scenario.id));
          return (
            <Link
              key={r.scenario.id}
              to="/mirror/$caseId"
              params={{ caseId: r.scenario.id }}
              className="group rounded-sm border border-primary/30 bg-primary/5 p-4 hover:border-primary transition"
              aria-label={
                inSeason ? `${r.scenario.title}, in seasonal circulation` : r.scenario.title
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="stencil text-[9px] text-primary/80">{r.tag.replace("_", " ")}</div>
                {inSeason && <SeasonGlyph season={season} />}
              </div>
              <div className="mt-1.5 text-sm font-semibold group-hover:text-primary">
                {r.scenario.title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Tier {r.scenario.tier} · {r.scenario.teaser}
              </div>
              <div className="mt-3 border-t border-primary/20 pt-2 text-[11px] text-caution italic">
                {r.reason}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

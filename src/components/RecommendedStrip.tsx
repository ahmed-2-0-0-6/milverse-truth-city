// MILVERSE — "RECOMMENDED FOR YOU" strip. Client-side, no AI.
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { getMirrorRecommendations, type Recommendation } from "@/lib/recommendations";

export function RecommendedStrip() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  useEffect(() => {
    setRecs(getMirrorRecommendations(loadProfile()));
    const on = () => setRecs(getMirrorRecommendations(loadProfile()));
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  if (!recs.length) return null;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2 stencil text-[10px] text-primary">
        <Sparkles className="h-3 w-3" /> RECOMMENDED FOR YOU
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recs.map((r) => (
          <Link
            key={r.scenario.id}
            to="/mirror/$caseId"
            params={{ caseId: r.scenario.id }}
            className="group rounded-sm border border-primary/30 bg-primary/5 p-4 hover:border-primary transition"
          >
            <div className="stencil text-[9px] text-primary/80">{r.tag.replace("_", " ")}</div>
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
        ))}
      </div>
    </section>
  );
}

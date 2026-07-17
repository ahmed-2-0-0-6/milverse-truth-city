// MILVERSE — "one more case" hook for debrief screens.
// Deterministic next-unplayed pick, nearest tier first. Carries NO
// truth-correlated labels — a training tag on a specific case link
// would leak the verdict before the case opens.

import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { SCENARIOS } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";

interface NextCase {
  wing: "mirror" | "feed";
  id: string;
  title: string;
  tier: number;
  teaser: string;
}

function pickNext(wing: "mirror" | "feed", currentId: string): NextCase | null {
  const p = loadProfile();
  const playedIds = new Set(p.history.map((h) => h.caseId));

  if (wing === "mirror") {
    const cur = SCENARIOS.find((s) => s.id === currentId);
    const pool = SCENARIOS.filter((s) => s.id !== currentId && !playedIds.has(s.id)).sort(
      (a, b) =>
        Math.abs(a.tier - (cur?.tier ?? 1)) - Math.abs(b.tier - (cur?.tier ?? 1)) ||
        a.tier - b.tier,
    );
    const n = pool[0];
    return n ? { wing, id: n.id, title: n.title, tier: n.tier, teaser: n.teaser } : null;
  }

  const cur = FEED_SCENARIOS.find((s) => s.id === currentId);
  const pool = FEED_SCENARIOS.filter(
    (s) => s.id !== currentId && !playedIds.has(`feed:${s.id}`),
  ).sort(
    (a, b) =>
      Math.abs(a.tier - (cur?.tier ?? 1)) - Math.abs(b.tier - (cur?.tier ?? 1)) || a.tier - b.tier,
  );
  const n = pool[0];
  return n ? { wing, id: n.id, title: n.title, tier: n.tier, teaser: n.teaser } : null;
}

export function NextCaseCard({
  wing,
  currentId,
}: {
  wing: "mirror" | "feed";
  currentId: string;
}) {
  // Debrief renders client-side only (post-play state), so profile reads are safe.
  const next = useMemo(() => pickNext(wing, currentId), [wing, currentId]);
  if (!next) return null;

  const linkProps =
    next.wing === "mirror"
      ? ({ to: "/mirror/$caseId", params: { caseId: next.id } } as const)
      : ({ to: "/feed/$caseId", params: { caseId: next.id } } as const);

  return (
    <Link
      {...linkProps}
      className="group block rounded-xl border-2 border-primary/40 bg-primary/[0.06] p-5 hover:border-primary transition"
    >
      <div className="flex items-center justify-between">
        <div className="stencil text-[10px] tracking-[0.3em] text-primary">
          NEXT ON YOUR DESK · TIER {next.tier}
        </div>
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
      </div>
      <div
        className="mt-2 text-2xl font-black tracking-tight group-hover:text-primary"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        {next.title}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{next.teaser}</p>
      <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground">
        TAKE THE CASE
      </div>
    </Link>
  );
}

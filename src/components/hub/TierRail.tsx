// MILVERSE — Hub tier rail. Vertical wayfinding down the left of the shelf.
// Desktop-only (hidden under lg). Reads unlock state; scrolls to sections.

interface TierRailNode {
  tier: number;
  label: string; // "T1".."T5"
  unlocked: boolean;
  wins: number;
  required: number;
  targetId: string;
}

interface TierRailProps {
  nodes: TierRailNode[];
  frontierTier: number;
}

export function TierRail({ nodes, frontierTier }: TierRailProps) {
  const highestUnlocked = nodes.reduce((m, n) => (n.unlocked ? Math.max(m, n.tier) : m), 0);
  const total = nodes.length;
  // fill percentage of the spine
  const fillPct = total > 1 ? ((highestUnlocked - 1) / (total - 1)) * 100 : 0;

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Tier progress"
      className="hidden lg:flex sticky top-24 h-[420px] w-8 flex-col items-center pt-2 select-none"
    >
      {/* Spine */}
      <div className="relative flex-1 w-px">
        <div className="absolute inset-0 bg-border" aria-hidden="true" />
        <div
          className="absolute top-0 left-0 w-full bg-primary/70 transition-all"
          style={{ height: `${fillPct}%` }}
          aria-hidden="true"
        />
        {/* Nodes */}
        <div className="absolute inset-0 flex flex-col justify-between items-center">
          {nodes.map((n) => {
            const met = n.unlocked && n.wins >= n.required;
            const pulse = n.tier === frontierTier;
            const aria = `Tier ${n.tier}, ${n.unlocked ? "unlocked" : "locked"}, ${n.wins} of ${n.required} wins`;
            return (
              <button
                key={n.tier}
                type="button"
                onClick={() => jump(n.targetId)}
                aria-label={aria}
                className="group -mx-3 flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                <span
                  className={`relative flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                    n.unlocked
                      ? "border-primary bg-background"
                      : "border-border bg-background"
                  } ${pulse ? "rail-pulse" : ""}`}
                  aria-hidden="true"
                >
                  {met ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ) : !n.unlocked ? (
                    <span className="text-[7px] leading-none text-muted-foreground">✕</span>
                  ) : null}
                </span>
                <span className="mt-1 font-mono text-[9px] tracking-widest text-muted-foreground group-hover:text-foreground">
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

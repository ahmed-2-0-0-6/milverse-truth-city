// LAYER-4 — Live-feeling ticker. Pure CSS marquee, pauses on hover.
export function Marquee() {
  const items = [
    "CASE #47 · CLOSED",
    "312 VERIFICATIONS THIS WEEK",
    "NEW STORY IN THE LIBRARY",
    "MIRROR TIER 3 · SIGNAL LOCKED",
    "FEED · AMBER ALERT CLEARED",
    "ARCHIVE OPEN · 128 DOSSIERS",
    "PILOT COHORT 12 · CALIBRATING",
    "STUDIO · 6 CASES SUBMITTED",
  ];
  return (
    <div
      className="relative overflow-hidden border-y border-primary/30 bg-black/40 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="marquee-track flex whitespace-nowrap py-2">
        {[...items, ...items, ...items].map((t, i) => (
          <span
            key={i}
            className="stencil text-[10px] text-cyan-200/80 px-6 flex items-center gap-6"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80 shadow-[0_0_8px_rgba(245,185,66,0.9)]" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

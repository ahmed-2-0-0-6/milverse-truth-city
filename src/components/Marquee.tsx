// LAYER-4 — Live-feeling ticker. Pure CSS marquee, pauses on hover.
// Seasonal marquee lines are spliced in at the front when a season is live;
// off-season, the base list is byte-identical to pre-Season chrome.
// The Night Shift prepends its own two lines AFTER the season splice, so
// season-first + shift-second is the deterministic composition order.

import { useEffect, useState } from "react";
import { useSeason } from "@/components/season/SeasonAdvisory";
import { currentShift, isNightRegister } from "@/lib/city/shift";

const NIGHT_LINES = [
  "NIGHT SHIFT · THE CITY RUNS ON SKELETON CREW",
  "ADVISORY · LATE HOURS ARE THE SCRIPT'S FAVORITE HOURS",
] as const;

export function Marquee() {
  const season = useSeason();
  // Computed per-mount; the marquee is a landing surface which ticks the
  // parent already. Stale band on a long-open page is acceptable per spec.
  const [shift, setShift] = useState(() => currentShift());
  useEffect(() => {
    setShift(currentShift());
  }, []);

  const base = [
    "CASE #47 · CLOSED",
    "312 VERIFICATIONS THIS WEEK",
    "NEW STORY IN THE LIBRARY",
    "MIRROR TIER 3 · SIGNAL LOCKED",
    "FEED · AMBER ALERT CLEARED",
    "ARCHIVE OPEN · 128 DOSSIERS",
    "PILOT COHORT 12 · CALIBRATING",
    "STUDIO · 6 CASES SUBMITTED",
  ];
  const seasonPart = season ? season.marquee : [];
  const shiftPart = isNightRegister(shift.band) ? NIGHT_LINES : [];
  const items = [...seasonPart, ...shiftPart, ...base];

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

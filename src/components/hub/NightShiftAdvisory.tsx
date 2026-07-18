// MILVERSE — THE NIGHT SHIFT · hub teaching advisory (smallHours only).
//
// Rendered above the tier shelf on both Mirror and Feed hubs. Off-band this
// returns null, so hub geometry is identical during the day. The line is
// the ONE true sentence: scripts prefer tired judgment. It is not a
// gameplay warning and does not gate any case.

import { useEffect, useState } from "react";
import { currentShift } from "@/lib/city/shift";

export function NightShiftAdvisory() {
  const [band, setBand] = useState(() => currentShift().band);
  useEffect(() => {
    setBand(currentShift().band);
  }, []);
  if (band !== "smallHours") return null;
  return (
    <div
      role="note"
      aria-label="Night shift advisory"
      className="mt-4 border border-amber-400/30 bg-amber-500/[0.06] px-4 py-3"
    >
      <div className="font-mono text-[10px] tracking-widest text-amber-300/90 mb-1">
        THE NIGHT SHIFT · TEACHING NOTE
      </div>
      <p className="text-sm text-foreground/85 leading-snug">
        The scripts work these hours because tired judgment is cheap judgment.
        Read slower. Nothing on this shelf has to be answered right now.
      </p>
    </div>
  );
}

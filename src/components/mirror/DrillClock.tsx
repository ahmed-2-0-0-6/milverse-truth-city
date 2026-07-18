// MILVERSE — The Drill Clock. 4:00 countdown for Cold Read mode.
// Same start-timestamp discipline as ClockChip so re-renders never reset it.
// Presentation-only: identical rendering across truths. On expiry, fires
// onExpire exactly once; the parent locks the composer and forces CALL IT.

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { formatDrillTime } from "@/lib/mirror/coldreads";

export const DRILL_SECONDS = 240; // 4:00

interface Props {
  /** Called once when the drill hits 0:00. */
  onExpire: () => void;
  /** Called once when the drill crosses under 1:00 (for a polite announce). */
  onOneMinute?: () => void;
}

export function DrillClock({ onExpire, onOneMinute }: Props) {
  const startedAtRef = useRef<number>(0);
  const firedRef = useRef<boolean>(false);
  const oneMinFiredRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const onOneMinuteRef = useRef(onOneMinute);
  onOneMinuteRef.current = onOneMinute;

  const [remaining, setRemaining] = useState<number>(DRILL_SECONDS);
  const [announce, setAnnounce] = useState<string>("");

  useEffect(() => {
    startedAtRef.current = Date.now();
    const iv = window.setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = Math.max(0, DRILL_SECONDS - elapsed);
      setRemaining(left);
      if (left > 0 && left < 60 && !oneMinFiredRef.current) {
        oneMinFiredRef.current = true;
        setAnnounce("One minute left");
        try { onOneMinuteRef.current?.(); } catch { /* noop */ }
      }
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        try { onExpireRef.current(); } catch { /* noop */ }
      }
    }, 500);
    return () => window.clearInterval(iv);
  }, []);

  const tense = remaining > 0 && remaining < 60;

  return (
    <>
      <span
        aria-hidden="true"
        className={[
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] tracking-widest tabular-nums",
          tense
            ? "border-caution/60 bg-caution/10 text-caution cold-tense"
            : "border-white/30 bg-black/40 text-white/80",
        ].join(" ")}
        title="Drill clock"
      >
        <Timer className="h-3 w-3" />
        <span>DRILL</span>
        <span>·</span>
        <span>{formatDrillTime(remaining)}</span>
      </span>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </>
  );
}

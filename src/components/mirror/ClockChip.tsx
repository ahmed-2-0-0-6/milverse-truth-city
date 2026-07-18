import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import type { ClaimedClock } from "@/lib/mirror/clocks";
import { clockTense } from "@/lib/mirror/audio";

interface Props {
  clock: ClaimedClock;
  /** Fires exactly once when the countdown crosses 0. */
  onExpire: () => void;
}

function fmt(s: number): string {
  const clamped = Math.max(0, Math.floor(s));
  const m = Math.floor(clamped / 60);
  const sec = clamped % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * THE CLAIMED CLOCK — a live ticking chip driven by the CONTACT's stated
 * deadline. Pure theater: identical rendering for REAL and IMPOSTER cases,
 * never ends the chat, never commits a verdict. Countdown survives parent
 * re-renders because the start timestamp is captured once in a ref.
 */
export function ClockChip({ clock, onExpire }: Props) {
  const startedAtRef = useRef<number>(0);
  const firedRef = useRef<boolean>(false);
  const tenseFiredRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const [remaining, setRemaining] = useState<number>(clock.seconds);
  const [announceExpire, setAnnounceExpire] = useState<string>("");

  useEffect(() => {
    startedAtRef.current = Date.now();
    setRemaining(clock.seconds);
    firedRef.current = false;
    tenseFiredRef.current = clock.seconds < 60; // already tense on start = no cue
    const iv = window.setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = Math.max(0, clock.seconds - elapsed);
      setRemaining(left);
      if (left > 0 && left < 60 && !tenseFiredRef.current) {
        tenseFiredRef.current = true;
        clockTense();
      }
    const iv = window.setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = Math.max(0, clock.seconds - elapsed);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        setAnnounceExpire(clock.expiredLine);
        try {
          onExpireRef.current();
        } catch {
          /* upstream is defensive */
        }
      }
    }, 1000);
    return () => window.clearInterval(iv);
    // Reset only if the clock config itself changes (i.e. case swap).
  }, [clock.caseId, clock.seconds, clock.expiredLine]);

  const expired = remaining <= 0;
  const tense = !expired && remaining < 60;

  return (
    <>
      <span
        aria-hidden="true"
        className={[
          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-widest tabular-nums",
          "border-caution/50 bg-caution/10 text-caution",
          tense ? "clock-tense" : "",
          expired ? "opacity-50" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        title={clock.label}
      >
        <Timer className="h-3 w-3" />
        <span>{clock.label}</span>
        <span>·</span>
        <span>{fmt(remaining)}</span>
      </span>
      {/* Polite announcements — once on mount, once on expiry. */}
      <span className="sr-only" aria-live="polite">
        {announceExpire || `The contact claims a deadline: ${clock.label}.`}
      </span>
    </>
  );
}

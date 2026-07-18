// GAME-FEEL — StreakBeat. Fires once after a correct Daily Drop call when the
// streak advances. Flame grows with the streak; milestones (3/7/14/30) get a
// title card. LITE and prefers-reduced-motion skip straight to onDone.
// Presentation only — streak math lives in lib/daily/profile.ts.

import { useEffect, useMemo, useRef } from "react";
import { Flame } from "lucide-react";
import { useVisualMode } from "@/lib/visual-quality";
import { streakLick } from "@/lib/mirror/audio";

interface Props {
  streak: number;
  onDone: () => void;
}

const MILESTONES: Record<number, { title: string; sub: string }> = {
  3: { title: "THREE DAYS ON WATCH", sub: "The desk notices." },
  7: { title: "ONE WEEK ON WATCH", sub: "You're on the roster now." },
  14: { title: "TWO WEEKS ON WATCH", sub: "The city sleeps easier." },
  30: { title: "THIRTY DAYS ON WATCH", sub: "They name shifts after people like you." },
};

export function StreakBeat({ streak, onDone }: Props) {
  const { mode } = useVisualMode();
  const doneRef = useRef(false);
  const milestone = MILESTONES[streak];
  // Latest onDone without re-running the effect — /drop re-renders every
  // second (countdown), and a fresh closure each tick would reset the
  // auto-dismiss timer forever.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Ember particles — deterministic per streak count.
  const embers = useMemo(
    () =>
      Array.from({ length: Math.min(8 + streak * 2, 26) }, (_, i) => ({
        x: 38 + ((i * 137 + streak * 31) % 25),
        d: 1100 + ((i * 211) % 900),
        delay: (i * 67) % 500,
        s: 3 + ((i * 13) % 4),
      })),
    [streak],
  );

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (mode !== "cinematic" || reduce) {
      if (!doneRef.current) {
        doneRef.current = true;
        queueMicrotask(() => onDoneRef.current());
      }
      return;
    }
    const t = window.setTimeout(
      () => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current();
        }
      },
      milestone ? 2600 : 1900,
    );
    return () => clearTimeout(t);
  }, [mode, milestone]);

  if (mode !== "cinematic") return null;

  const flameSize = Math.min(56 + streak * 4, 120);

  return (
    <div
      className="fixed inset-0 z-[310] flex flex-col items-center justify-center select-none cursor-pointer"
      style={{
        background:
          "radial-gradient(circle at 50% 60%, rgba(30,12,2,0.92) 0%, rgba(0,0,0,0.97) 65%)",
      }}
      aria-live="polite"
      onClick={() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }}
    >
      {/* rising embers */}
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember absolute rounded-full pointer-events-none"
          aria-hidden
          style={{
            left: `${e.x}%`,
            bottom: "30%",
            width: `${e.s}px`,
            height: `${e.s}px`,
            background: i % 3 === 0 ? "rgba(245,185,66,0.9)" : "rgba(239,108,44,0.8)",
            animationDuration: `${e.d}ms`,
            animationDelay: `${e.delay}ms`,
          }}
        />
      ))}

      <div className="streak-flame-pop relative" aria-hidden>
        <Flame
          style={{
            width: flameSize,
            height: flameSize,
            color: "rgb(245,158,11)",
            filter:
              "drop-shadow(0 0 24px rgba(245,158,11,0.7)) drop-shadow(0 0 60px rgba(239,68,68,0.4))",
          }}
        />
      </div>

      <div
        className="mt-4 text-6xl sm:text-7xl font-black tabular-nums verdict-rise"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          color: "rgb(245,185,66)",
          textShadow: "0 0 34px rgba(245,158,11,0.6)",
        }}
      >
        {streak}
      </div>
      <div className="stencil text-[11px] tracking-[0.4em] text-white/70 mt-1">
        {milestone ? milestone.title : `DAY${streak === 1 ? "" : "S"} ON WATCH`}
      </div>
      {milestone && <div className="mt-2 text-sm text-white/50">{milestone.sub}</div>}
      <div className="absolute bottom-6 stencil text-[9px] text-white/30">TAP TO CONTINUE</div>
    </div>
  );
}

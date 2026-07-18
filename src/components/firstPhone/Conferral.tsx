import { useEffect, useRef, useState } from "react";

interface Props {
  onDone: () => void;
}

/**
 * THE CONFERRAL — the ~5s beat that stands between clearing lesson 10 and
 * the license card. Junior register: warm, plain, no exclamation marks.
 * Uses the VerdictMoment onDoneRef pattern so parent re-renders don't reset
 * the timeline. LITE/reduced-motion callers should skip mounting this
 * component entirely (no information lives only here).
 */
export function Conferral({ onDone }: Props) {
  const [line1, setLine1] = useState(false);
  const [line2, setLine2] = useState(false);
  const [stamp, setStamp] = useState(false);
  const [line3, setLine3] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current();
    };
    const t1 = window.setTimeout(() => setLine1(true), 900);
    const t2 = window.setTimeout(() => setLine2(true), 1700);
    const t3 = window.setTimeout(() => setStamp(true), 2600);
    const t4 = window.setTimeout(() => setLine3(true), 3400);
    const tSkip = window.setTimeout(() => setCanSkip(true), 300);
    const t5 = window.setTimeout(finish, 4600);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      [t1, t2, t3, t4, tSkip, t5].forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const skip = () => {
    if (!canSkip || doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  return (
    <div
      role="dialog"
      aria-label="License ceremony"
      onClick={skip}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
      style={{ background: "radial-gradient(circle at 50% 45%, #0b1220 0%, #050810 70%, #000 100%)" }}
    >
      <span className="sr-only" aria-live="polite">
        Ten lessons cleared. Your license is ready.
      </span>

      {/* City seal */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        <svg viewBox="0 0 240 240" width="240" height="240" aria-hidden>
          <circle
            cx="120"
            cy="120"
            r="108"
            fill="none"
            stroke="rgba(34,211,238,0.9)"
            strokeWidth="3"
            className="confer-ring"
            pathLength={1}
          />
          <circle
            cx="120"
            cy="120"
            r="94"
            fill="none"
            stroke="rgba(34,211,238,0.35)"
            strokeWidth="1.5"
          />
        </svg>
        {/* Stamp */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${
            stamp ? "opacity-100 confer-stamp" : "opacity-0"
          }`}
          aria-hidden
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-primary/70">CITY SEAL</div>
          <div className="mt-1 text-4xl font-black tracking-wide text-primary" style={{ fontFamily: "Impact, 'Bebas Neue', sans-serif" }}>
            CLEARED
          </div>
          <div className="mt-1 font-mono text-[10px] tracking-[0.3em] text-primary/70">DEPT. OF TRUST</div>
        </div>
      </div>

      {/* Lines */}
      <div className="mt-10 flex flex-col items-center gap-3 text-center px-6">
        <div
          className={`text-3xl md:text-4xl font-semibold text-white transition-opacity duration-500 ${
            line1 ? "opacity-100" : "opacity-0"
          }`}
        >
          Ten lessons.
        </div>
        <div
          className={`text-3xl md:text-4xl font-semibold text-white transition-opacity duration-500 ${
            line2 ? "opacity-100" : "opacity-0"
          }`}
        >
          A hundred good questions.
        </div>
        <div
          className={`mt-2 text-xl md:text-2xl text-white/80 transition-opacity duration-500 ${
            line3 ? "opacity-100" : "opacity-0"
          }`}
        >
          The phone's yours. The questions go with you.
        </div>
      </div>

      <div className="absolute bottom-6 right-6 font-mono text-[11px] tracking-[0.25em] text-white/50">
        tap to skip
      </div>
    </div>
  );
}

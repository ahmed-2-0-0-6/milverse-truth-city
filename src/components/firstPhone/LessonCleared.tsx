// GAME-FEEL — junior "lesson cleared" beat. Warm, zero fear, silent.
// Fires after a lesson completes, before the home screen. Soft confetti,
// big check, plain progress line. Reduced motion skips straight through.

import { useEffect, useMemo, useRef } from "react";
import { Check } from "lucide-react";
import { shouldReduceMotion } from "@/lib/access";

interface Props {
  lessonN: number;
  totalDone: number;
  totalLessons: number;
  onDone: () => void;
}

export function LessonCleared({ lessonN, totalDone, totalLessons, onDone }: Props) {
  const reduced = useMemo(() => shouldReduceMotion(), []);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Soft pastel confetti — deterministic per lesson, no randomness.
  const confetti = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: 8 + ((i * 61 + lessonN * 17) % 84),
        delay: (i * 90) % 600,
        d: 1400 + ((i * 173) % 800),
        hue: ["#7dd3fc", "#86efac", "#fde68a", "#f9a8d4"][i % 4],
        s: 6 + ((i * 5) % 5),
      })),
    [lessonN],
  );

  useEffect(() => {
    if (reduced) {
      if (!doneRef.current) {
        doneRef.current = true;
        queueMicrotask(() => onDoneRef.current());
      }
      return;
    }
    const t = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current();
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [reduced]);

  if (reduced) return null;

  const left = totalLessons - totalDone;

  return (
    <div
      className="fixed inset-0 z-[310] flex flex-col items-center justify-center select-none cursor-pointer bg-neutral-950/90 backdrop-blur-sm"
      aria-live="polite"
      onClick={() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }}
    >
      {confetti.map((c, i) => (
        <span
          key={i}
          className="confetti-fall absolute rounded-sm pointer-events-none"
          aria-hidden
          style={{
            left: `${c.x}%`,
            top: "-4%",
            width: `${c.s}px`,
            height: `${c.s + 3}px`,
            background: c.hue,
            animationDuration: `${c.d}ms`,
            animationDelay: `${c.delay}ms`,
          }}
        />
      ))}

      <div className="streak-flame-pop flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_50px_rgba(52,211,153,0.45)]">
        <Check className="h-10 w-10 text-white" strokeWidth={3} aria-hidden />
      </div>

      <div className="mt-5 text-2xl font-semibold text-white">Lesson {lessonN} cleared.</div>
      <div className="mt-1.5 text-sm text-white/70">
        {totalDone} of {totalLessons} done.{" "}
        {left === 0 ? "The phone's yours." : left === 1 ? "One more to the license." : `${left} more to the license.`}
      </div>

      {/* progress dots */}
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {Array.from({ length: totalLessons }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < totalDone ? "bg-emerald-400" : "bg-white/20"}`}
          />
        ))}
      </div>

      <div className="absolute bottom-6 text-[11px] text-white/40">Tap to continue</div>
    </div>
  );
}

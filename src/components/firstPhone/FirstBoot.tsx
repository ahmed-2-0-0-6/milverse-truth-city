// MILVERSE — FIRST BOOT
// The guided phone tour that runs once after handover on a kid's first
// visit to the home screen. Five coach marks, warm register, no fear.
// Step 4 is interactive (wallpaper picker). Skipping or finishing marks
// tourSeen. See src/lib/firstPhone/profile.ts.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { WALLPAPERS, getWallpaper } from "./wallpapers";
import { markTourSeen, setWallpaper, loadFirstPhone } from "@/lib/firstPhone/profile";
import { shouldReduceMotion } from "@/lib/access";

type TourAnchor = "path" | "lesson1" | "adult" | "wallpaper" | "name";

interface Step {
  n: number;
  target: TourAnchor;
  title: string;
  body: string;
  interactive?: "wallpaper";
  primary: string;
  isFinal?: boolean;
}

const STEPS: Step[] = [
  {
    n: 1,
    target: "path",
    title: "This is your path.",
    body: "Ten lessons. Each one is a real conversation. Finish all ten and the phone is yours for good.",
    primary: "NEXT",
  },
  {
    n: 2,
    target: "lesson1",
    title: "Lessons look like apps.",
    body: "Tap one to open it. The glowing one is where you are. Locked ones open as you go.",
    primary: "NEXT",
  },
  {
    n: 3,
    target: "adult",
    title: "Your best move, always.",
    body: "If anything ever feels weird or too fast, you can tell a trusted adult. In here, that's never the wrong answer. It wins cases.",
    primary: "NEXT",
  },
  {
    n: 4,
    target: "wallpaper",
    title: "Make it yours.",
    body: "Pick a wallpaper. You can change it any time.",
    interactive: "wallpaper",
    primary: "NEXT",
  },
  {
    n: 5,
    target: "lesson1",
    title: "That's the tour.",
    body: "Lesson one is short. The phone stays yours while you learn.",
    primary: "START LESSON 1 →",
    isFinal: true,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  /** The container the tour overlays (the ChatShell body). */
  container: HTMLElement | null;
  onOpenLesson: (n: number) => void;
  onClose: () => void;
}

export function FirstBoot({ container, onOpenLesson, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [wpIdx, setWpIdx] = useState<number>(() => loadFirstPhone().wallpaper);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = shouldReduceMotion();
  const current = STEPS[step];

  // Compute cutout rect relative to container.
  useLayoutEffect(() => {
    if (!container) return;
    function measure() {
      if (!container) return;
      const target = container.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
      const host = container.getBoundingClientRect();
      if (!target) {
        setRect(null);
        return;
      }
      const t = target.getBoundingClientRect();
      setRect({
        top: t.top - host.top - 6,
        left: t.left - host.left - 6,
        width: t.width + 12,
        height: t.height + 12,
      });
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [container, current.target, step]);

  // Focus card on step change.
  useEffect(() => {
    cardRef.current?.focus();
  }, [step]);

  // Keyboard: Escape skips/closes; Tab is trapped in the card.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
        return;
      }
      if (e.key === "Tab" && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function finish() {
    markTourSeen();
    onClose();
  }
  function startLessonOne() {
    markTourSeen();
    onOpenLesson(1);
  }
  function pickWallpaper(i: number) {
    setWpIdx(i);
    setWallpaper(i);
  }

  if (!container) return null;

  // Card placement: sit under the target if there's room, otherwise above.
  const CARD_H_EST = 260;
  const CARD_MARGIN = 12;
  const hostH = container.getBoundingClientRect().height;
  const canFitBelow = rect ? rect.top + rect.height + CARD_MARGIN + CARD_H_EST < hostH : true;
  const cardTop = rect
    ? canFitBelow
      ? rect.top + rect.height + CARD_MARGIN
      : Math.max(CARD_MARGIN, rect.top - CARD_H_EST - CARD_MARGIN)
    : hostH / 2 - CARD_H_EST / 2;

  return (
    <div
      className="absolute inset-0 z-40"
      onClick={(e) => {
        // Background tap advances (forgiving for kids). Card clicks stop bubbling.
        if (e.target === e.currentTarget) {
          if (current.isFinal) finish();
          else next();
        }
      }}
      aria-hidden={false}
    >
      {/* Dimming scrim */}
      {reduce ? (
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      ) : (
        <>
          {/* Four-sided dim around the rect cutout */}
          {rect && (
            <>
              <div
                className="absolute left-0 right-0 bg-black/70 pointer-events-none tour-move"
                style={{ top: 0, height: Math.max(0, rect.top) }}
              />
              <div
                className="absolute left-0 bg-black/70 pointer-events-none tour-move"
                style={{ top: rect.top, width: Math.max(0, rect.left), height: rect.height }}
              />
              <div
                className="absolute right-0 bg-black/70 pointer-events-none tour-move"
                style={{
                  top: rect.top,
                  left: rect.left + rect.width,
                  height: rect.height,
                }}
              />
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/70 pointer-events-none tour-move"
                style={{ top: rect.top + rect.height }}
              />
            </>
          )}
          {!rect && <div className="absolute inset-0 bg-black/60 pointer-events-none" />}
        </>
      )}

      {/* Solid outline highlight — always visible so target is legible in LITE/reduced-motion. */}
      {rect && (
        <div
          className="absolute pointer-events-none rounded-2xl tour-move"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Coach-mark card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-label={`Phone tour, step ${current.n} of 5`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-3 right-3 rounded-2xl bg-[#fdf9f2] text-neutral-900 shadow-2xl border border-black/10 p-4 focus:outline-none tour-move"
        style={{ top: cardTop, maxWidth: 380, margin: "0 auto" }}
      >
        <div className="font-mono text-[10px] tracking-[0.25em] text-neutral-500 mb-1">
          STEP {current.n} OF 5
        </div>
        <div className="text-base font-semibold leading-snug">{current.title}</div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">{current.body}</p>

        {current.interactive === "wallpaper" && (
          <div className="mt-3">
            <div className="font-mono text-[10px] tracking-[0.25em] text-neutral-500 mb-1.5">
              WALLPAPERS
            </div>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Pick a wallpaper">
              {WALLPAPERS.map((w) => {
                const selected = wpIdx === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={w.name}
                    onClick={() => pickWallpaper(w.id)}
                    className={`h-12 w-full rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                      selected
                        ? "border-neutral-900 scale-[1.03]"
                        : "border-transparent hover:border-neutral-400"
                    }`}
                    style={{ background: w.bg }}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 text-[11px] text-neutral-500">
              Selected: {getWallpaper(wpIdx).name}
            </div>
          </div>
        )}

        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.n}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2">
          {current.isFinal ? (
            <>
              <button
                type="button"
                onClick={startLessonOne}
                className="w-full min-h-[44px] rounded-xl bg-neutral-900 text-white font-semibold text-sm tracking-wide hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              >
                {current.primary}
              </button>
              <button
                type="button"
                onClick={finish}
                className="w-full min-h-[44px] rounded-xl text-sm text-neutral-600 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                I'll look around first
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={next}
                className="w-full min-h-[44px] rounded-xl bg-neutral-900 text-white font-semibold text-sm tracking-wide hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              >
                {current.primary}
              </button>
              <button
                type="button"
                onClick={finish}
                className="w-full min-h-[44px] rounded-xl text-xs text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                Skip the tour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

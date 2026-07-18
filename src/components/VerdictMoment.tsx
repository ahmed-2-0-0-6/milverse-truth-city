// LAYER-3-CROWN — The Verdict Moment. The single most important animation on
// the site: spotlight → stamp slam + camera shake → ink spread → paper dust →
// WebAudio thud → Trust Calibration reveal with distinct color grade per
// outcome (Correct Call / Missed Scam / False Alarm) → light-trail exit.
// NEVER remove. LITE and prefers-reduced-motion bypass the animation and
// invoke onDone() on next tick.

import { useEffect, useMemo, useRef, useState } from "react";
import { useVisualMode } from "@/lib/visual-quality";
import { stampSlam, stampSting } from "@/lib/mirror/audio";

export type CalibrationOutcome = "correct" | "missed_scam" | "false_alarm";

interface Props {
  caseTitle: string;
  caseId: string;
  stampLabel: string; // "TRUE" / "FAKE" / "MISLEADING" / etc.
  outcome: CalibrationOutcome;
  onDone: () => void;
  /**
   * "The Quiet File" — survivor cases end quiet. The stamp fades in over
   * 400ms (no scale/slam), screen-shake and audio cues are skipped.
   * Result text, outcome, and timing handoff are identical to standard.
   * Default: "standard" — every existing call site is byte-identical.
   */
  register?: "standard" | "quiet";
}

const GRADES: Record<
  CalibrationOutcome,
  {
    label: string;
    hint: string;
    rgb: string;
    hue: string;
    sting: number;
  }
> = {
  correct: {
    label: "CORRECT CALL",
    hint: "Verified, not guessed.",
    rgb: "34,211,238",
    hue: "hue-rotate(0deg)",
    sting: 720,
  },
  missed_scam: {
    label: "MISSED SCAM",
    hint: "A fake slipped through.",
    rgb: "239,68,68",
    hue: "hue-rotate(-14deg)",
    sting: 220,
  },
  false_alarm: {
    label: "FALSE ALARM",
    hint: "Real signal read as fake.",
    rgb: "245,185,66",
    hue: "hue-rotate(18deg)",
    sting: 360,
  },
};

// Verdict stinger palette — win = clean chime; loss = triangle w/ tremolo.
// Both live in @/lib/mirror/audio so mute + first-sound consent are honored.
const STING_KIND: Record<CalibrationOutcome, "win" | "loss"> = {
  correct: "win",
  missed_scam: "loss",
  false_alarm: "loss",
};

export function VerdictMoment({ caseTitle, caseId, stampLabel, outcome, onDone, register = "standard" }: Props) {
  const quiet = register === "quiet";
  const { mode } = useVisualMode();
  const grade = GRADES[outcome];
  const [stage, setStage] = useState<"enter" | "stamp" | "reveal" | "trail">("enter");
  const [canSkip, setCanSkip] = useState(false);
  const doneRef = useRef(false);
  // Keep the latest onDone without making it an effect dep — parents that
  // re-render every second (e.g. /drop's countdown) pass a fresh closure each
  // tick, and re-running the effect would reset the whole timeline forever.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Deterministic dust particles per case — no re-shuffle on rerender.
  const dust = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: (Math.sin(i * 12.9) * 43758.5) % 1,
        y: (Math.cos(i * 4.3) * 43758.5) % 1,
        d: 900 + ((i * 137) % 700),
        s: 3 + ((i * 7) % 6),
      })),
    [caseId],
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
    const t1 = window.setTimeout(() => {
      setStage("stamp");
      if (!quiet) stampSlam();
    }, 380);
    const t2 = window.setTimeout(() => {
      setStage("reveal");
      if (!quiet) stampSting(STING_KIND[outcome]);
    }, 680); // slam + 300ms per Sound of the City spec
    const tSkip = window.setTimeout(() => setCanSkip(true), 1500);
    const t3 = window.setTimeout(() => {
      setStage("trail");
    }, 2500);
    const t4 = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current();
      }
    }, 3200);
    return () => {
      [t1, t2, tSkip, t3, t4].forEach(clearTimeout);
    };
  }, [mode, outcome, quiet]);

  if (mode !== "cinematic") return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, rgba(10,14,22,0.92) 0%, rgba(0,0,0,0.98) 60%, #000 100%)",
      }}
      aria-live="polite"
      onClick={() => {
        if (canSkip && !doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }}
    >
      {/* Spotlight cone */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: `radial-gradient(38% 26% at 50% 50%, rgba(255,255,255,0.10), transparent 70%)`,
          mixBlendMode: "screen",
          filter: grade.hue,
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Case file */}
      <div
        className={`relative w-[min(88vw,520px)] rounded-sm border border-white/15 bg-[#0b0f16] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] ${!quiet && (stage === "stamp" || stage === "reveal" || stage === "trail") ? "verdict-shake" : ""}`}
        style={{ transform: "translateZ(0)" }}
      >
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
          <div className="stencil text-[10px] text-white/50">CASE FILE · {caseId}</div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300/80 hud-blink" />
        </div>
        <div className="p-6 min-h-[220px] relative overflow-hidden">
          <div
            className="text-white/85 text-lg leading-snug"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            {caseTitle}
          </div>
          <div className="mt-3 stencil text-[10px] text-white/40">DELIVERING VERDICT…</div>

          {/* Stamp */}
          {(stage === "stamp" || stage === "reveal" || stage === "trail") && (
            <>
              <div
                className="verdict-stamp absolute right-6 bottom-6 rotate-[-8deg] border-[3px] px-5 py-2 tracking-[0.14em] text-3xl font-black"
                style={{
                  color: `rgb(${grade.rgb})`,
                  borderColor: `rgb(${grade.rgb})`,
                  fontFamily: '"Bebas Neue", sans-serif',
                  textShadow: `0 0 18px rgba(${grade.rgb},0.55)`,
                  boxShadow: `inset 0 0 0 1px rgba(${grade.rgb},0.15), 0 12px 40px -8px rgba(${grade.rgb},0.35)`,
                }}
              >
                {stampLabel}
              </div>
              {/* Ink spread */}
              <div
                className="ink-spread absolute right-6 bottom-6 h-24 w-24 rounded-full pointer-events-none"
                aria-hidden
                style={{
                  background: `radial-gradient(circle, rgba(${grade.rgb},0.55), transparent 70%)`,
                }}
              />
            </>
          )}

          {/* Paper dust */}
          {(stage === "stamp" || stage === "reveal") &&
            dust.map((p, i) => (
              <span
                key={i}
                className="dust-mote absolute rounded-full pointer-events-none"
                aria-hidden
                style={{
                  right: `${8 + Math.abs(p.x) * 40}%`,
                  bottom: `${8 + Math.abs(p.y) * 30}%`,
                  width: `${p.s}px`,
                  height: `${p.s}px`,
                  background: "rgba(240,220,180,0.55)",
                  animationDuration: `${p.d}ms`,
                  animationDelay: `${i * 12}ms`,
                }}
              />
            ))}
        </div>
      </div>

      {/* Trust Calibration reveal */}
      {(stage === "reveal" || stage === "trail") && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[12%] w-[min(88vw,520px)] verdict-rise">
          <div
            className="stencil text-[10px] mb-2 text-center"
            style={{ color: `rgb(${grade.rgb})` }}
          >
            TRUST CALIBRATION
          </div>
          <div
            className="text-center text-4xl sm:text-5xl font-black tracking-tight"
            style={{
              color: `rgb(${grade.rgb})`,
              fontFamily: '"Bebas Neue", sans-serif',
              textShadow: `0 0 30px rgba(${grade.rgb},0.55)`,
            }}
          >
            {grade.label}
          </div>
          <div className="mt-2 text-center text-sm text-white/60">{grade.hint}</div>
        </div>
      )}

      {/* Light trail streak toward map (only in final stage) */}
      {stage === "trail" && (
        <div
          className="light-trail absolute h-[3px] top-1/2 left-0 right-0 pointer-events-none"
          aria-hidden
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${grade.rgb},0.9), transparent)`,
            filter: `drop-shadow(0 0 12px rgb(${grade.rgb}))`,
          }}
        />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canSkip && !doneRef.current) {
            doneRef.current = true;
            onDone();
          }
        }}
        disabled={!canSkip}
        className="absolute bottom-4 right-4 stencil text-[10px] text-white/40 hover:text-white/80 border border-white/15 px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {canSkip ? "SKIP →" : "READ THE VERDICT…"}
      </button>
    </div>
  );
}

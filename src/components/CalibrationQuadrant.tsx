// LAYER-1 — Calibration Quadrant. The single source of truth for showing
// where an operator sits on the trust map. Two axes:
//   X → false-alarm rate  (0 left · 1 right)  — reading real signal as fake
//   Y → missed-scam rate  (0 bottom · 1 top)  — letting a fake slip through
//
// Bottom-left = CALIBRATED. Top-left = TOO TRUSTING. Bottom-right = TOO PARANOID.
// Top-right = MISCALIBRATED.
//
// Used in: profile page (compact=false), mirror debrief + boss + feed (compact=true).
// Presentation-only. No mechanic changes. Pure SVG — LITE-safe, reduced-motion-safe,
// holds at 360px, respects text scaling.

import { calibrationLabel, type TrustProfile } from "@/lib/mirror/profile";

interface Props {
  profile: TrustProfile | null;
  compact?: boolean;
  /** Optional label override — e.g. "AFTER THIS CASE" on debriefs. */
  caption?: string;
}

const LABEL_TONE: Record<"good" | "warn" | "bad" | "neutral", string> = {
  good: "text-primary border-primary/40 bg-primary/10",
  warn: "text-caution border-caution/40 bg-caution/10",
  bad: "text-destructive border-destructive/40 bg-destructive/10",
  neutral: "text-muted-foreground border-border bg-muted/20",
};

const DOT_FILL: Record<"good" | "warn" | "bad" | "neutral", string> = {
  good: "hsl(var(--primary))",
  warn: "hsl(var(--caution, 45 95% 55%))",
  bad: "hsl(var(--destructive))",
  neutral: "hsl(var(--muted-foreground))",
};

export function CalibrationQuadrant({ profile, compact = false, caption }: Props) {
  const total = profile?.casesPlayed ?? 0;
  const missed = profile?.missedScams ?? 0;
  const falseAlarms = profile?.falseAlarms ?? 0;

  // Add tiny epsilon so a fresh recruit sits at the CALIBRATED origin, not floating in space.
  const missRate = total > 0 ? Math.min(1, missed / total) : 0;
  const faRate = total > 0 ? Math.min(1, falseAlarms / total) : 0;

  const cal = profile ? calibrationLabel(profile) : { label: "Recruit", tone: "neutral" as const };
  const tone = cal.tone;

  // Chart geometry. Values are viewbox units.
  const SIZE = 100;
  const PAD = 10;
  const usable = SIZE - PAD * 2;
  const cx = PAD + faRate * usable;
  const cy = PAD + missRate * usable;

  const size = compact ? "h-32 w-32" : "h-48 w-48 sm:h-56 sm:w-56";

  return (
    <div
      className={`rounded-md border ${LABEL_TONE[tone]} ${compact ? "p-3" : "p-4 sm:p-5"} flex ${compact ? "gap-3" : "gap-4 sm:gap-5"} items-center min-w-0`}
    >
      <div className={`${size} shrink-0 relative`}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-full w-full"
          aria-label={`Calibration position: ${cal.label}. ${(faRate * 100).toFixed(0)}% false alarms, ${(missRate * 100).toFixed(0)}% missed scams.`}
        >
          {/* Quadrant backdrop — the "sweet spot" (bottom-left) is faintly tinted. */}
          <rect
            x={PAD}
            y={PAD + usable / 2}
            width={usable / 2}
            height={usable / 2}
            fill="hsl(var(--primary) / 0.06)"
          />
          {/* Frame */}
          <rect
            x={PAD}
            y={PAD}
            width={usable}
            height={usable}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.6"
          />
          {/* Cross-hairs */}
          <line
            x1={PAD + usable / 2}
            y1={PAD}
            x2={PAD + usable / 2}
            y2={PAD + usable}
            stroke="hsl(var(--border))"
            strokeDasharray="1.5 1.5"
            strokeWidth="0.5"
          />
          <line
            x1={PAD}
            y1={PAD + usable / 2}
            x2={PAD + usable}
            y2={PAD + usable / 2}
            stroke="hsl(var(--border))"
            strokeDasharray="1.5 1.5"
            strokeWidth="0.5"
          />
          {/* Corner labels — small, only in expanded */}
          {!compact && (
            <g
              fontFamily="ui-monospace, Menlo, monospace"
              fontSize="4"
              fill="hsl(var(--muted-foreground))"
            >
              <text x={PAD + 1} y={PAD + 4}>
                TOO TRUSTING
              </text>
              <text x={PAD + usable - 1} y={PAD + 4} textAnchor="end">
                MISCALIBRATED
              </text>
              <text x={PAD + 1} y={PAD + usable - 1}>
                CALIBRATED
              </text>
              <text x={PAD + usable - 1} y={PAD + usable - 1} textAnchor="end">
                TOO PARANOID
              </text>
            </g>
          )}
          {/* Operator dot (or origin ghost for recruits) */}
          {total > 0 ? (
            <g>
              <circle cx={cx} cy={cy} r="4.5" fill={DOT_FILL[tone]} opacity="0.25" />
              <circle cx={cx} cy={cy} r="2" fill={DOT_FILL[tone]} />
            </g>
          ) : (
            <circle
              cx={PAD + usable * 0.15}
              cy={PAD + usable * 0.85}
              r="2"
              fill="hsl(var(--muted-foreground))"
              opacity="0.5"
            />
          )}
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="stencil text-[10px] tracking-[0.24em] opacity-80">
          {caption ?? "CALIBRATION"}
        </div>
        <div
          className={`${compact ? "text-xl" : "text-2xl sm:text-3xl"} font-black tracking-tight leading-tight mt-0.5`}
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          {cal.label.toUpperCase()}
        </div>
        {total > 0 ? (
          <>
            <div
              className={`mt-2 grid grid-cols-2 ${compact ? "gap-1.5" : "gap-2"} font-mono text-[10px] tracking-widest text-muted-foreground`}
            >
              <div>
                MISS ·{" "}
                <span className="text-foreground tabular-nums">{(missRate * 100).toFixed(0)}%</span>
              </div>
              <div>
                F-ALARM ·{" "}
                <span className="text-foreground tabular-nums">{(faRate * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="mt-1.5 font-mono text-[9px] tracking-widest text-primary/90 flex items-center gap-1.5">
              <span>BRIER CALIBRATION:</span>
              <span className="tabular-nums font-semibold">
                {(Math.max(0, 1 - (missRate * missRate + faRate * faRate) / 2) * 100).toFixed(1)}% ACCURACY
              </span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground italic">
            No cases yet. Your dot lands after your first verdict.
          </p>
        )}
        {!compact && total > 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {tone === "good" &&
              "You're catching the fakes and clearing the real people. Keep the discipline."}
            {tone === "warn" &&
              cal.label === "Too Trusting" &&
              "You're letting fakes through. Slow down. Verify out-of-band before you act."}
            {tone === "warn" &&
              cal.label === "Too Paranoid" &&
              "You're calling real people fake. Suspicion has a cost — hear them out first."}
            {tone === "bad" &&
              "Both errors, both directions. Fewer snap verdicts, more probes and callbacks."}
          </p>
        )}
      </div>
    </div>
  );
}

// MILVERSE — CITY IS AWAKE · ambient decorative life.
// Deterministic: variation is seeded by (minuteOfDay + index) arithmetic.
// Never mounts in LITE or reduced-motion — parent gates it.

import { useMemo } from "react";
import { WORLD_W, WORLD_H } from "@/lib/city/world-data";

/** Sparse deterministic window grid — capped at ~120 rects. */
const WINDOW_COUNT = 118;

function seededWindows(): { x: number; y: number; idx: number }[] {
  // Simple deterministic scatter across the world, avoiding the exact hubs.
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: { x: number; y: number; idx: number }[] = [];
  for (let i = 0; i < WINDOW_COUNT; i++) {
    const x = 40 + rnd() * (WORLD_W - 80);
    const y = 60 + rnd() * (WORLD_H - 120);
    out.push({ x, y, idx: i });
  }
  return out;
}

export interface AmbientLifeProps {
  /** Real local hour, 0-23. Recomputed by parent once per minute. */
  hour: number;
  /** Real minute of day (0-1439), for deterministic window flips. */
  minuteOfDay: number;
  /** Existing SVG path id to ride (e.g. "mirror-p"). */
  metroPathId: string;
  /** When false, animateMotion elements are not rendered. */
  animateMetro: boolean;
}

// Tints aligned to `cityShift` bands so the map, marquee, and copy switch
// on the same boundary. Do NOT re-thread these values against a different
// clock — the point of THE NIGHT SHIFT is one boundary for everything.
function tintFor(hour: number): { fill: string; opacity: number } | null {
  // day (06 ≤ h < 17) — transparent
  if (hour >= 6 && hour < 17) return null;
  // evening (17 ≤ h < 21) — sodium orange
  if (hour >= 17 && hour < 21) return { fill: "#f97316", opacity: 0.05 };
  // smallHours (01 ≤ h < 06) — deepest indigo
  if (hour >= 1 && hour < 6) return { fill: "#0f0d2e", opacity: 0.16 };
  // night (21 ≤ h < 24 or 00 ≤ h < 01) — indigo
  return { fill: "#1e1b4b", opacity: 0.12 };
}

// Amber horizon glow — only rendered during smallHours. Static, sits under
// the tint. Pointer-inert. Contributes ONE extra <rect>; no animation.
function horizonGlowVisible(hour: number): boolean {
  return hour >= 1 && hour < 6;
}

function litThresholdFor(hour: number): number {
  // Day → few windows lit; evening/night/smallHours → many.
  if (hour >= 6 && hour < 17) return 10;
  return 34;
}


export function AmbientLife({
  hour,
  minuteOfDay,
  metroPathId,
  animateMetro,
}: AmbientLifeProps) {
  const windows = useMemo(seededWindows, []);
  const tint = tintFor(hour);
  const litThreshold = litThresholdFor(hour);

  return (
    <g aria-hidden="true" data-layer="ambient-life" style={{ pointerEvents: "none" }}>
      {/* window lights — discrete per-minute flip */}
      <g>
        {windows.map((w) => {
          const lit = (minuteOfDay * 7 + w.idx * 13) % 97 < litThreshold;
          if (!lit) return null;
          return (
            <rect
              key={w.idx}
              x={w.x}
              y={w.y}
              width={2}
              height={3}
              fill="#f5d98f"
              opacity={0.35}
            />
          );
        })}
      </g>

      {/* metro streak — rides an existing path via animateMotion */}
      {animateMetro && (
        <g>
          <rect
            x={-13}
            y={-2}
            width={26}
            height={4}
            rx={2}
            fill="#7dd3fc"
            opacity={0.7}
            style={{ filter: "drop-shadow(0 0 6px #7dd3fc)" }}
          >
            {/* 14s ride + 6s idle gap via keyPoints/keyTimes.
                Total 20s cycle: 0..0.7 travels 0→1, 0.7..1 rests off-canvas. */}
            <animateMotion
              dur="20s"
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;1;1"
              keyTimes="0;0.7;1"
              calcMode="linear"
            >
              <mpath href={`#${metroPathId}`} />
            </animateMotion>
          </rect>
        </g>
      )}

      {/* amber horizon glow — smallHours only, sits under the tint. */}
      {horizonGlowVisible(hour) && (
        <rect
          x={0}
          y={0}
          width={WORLD_W}
          height={Math.round(WORLD_H * 0.22)}
          fill="url(#milverse-night-horizon)"
          style={{ pointerEvents: "none" }}
        />
      )}
      {/* Gradient defs are declared here so this file remains self-contained. */}
      <defs>
        <linearGradient id="milverse-night-horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5b942" stopOpacity="0.10" />
          <stop offset="55%" stopColor="#f5b942" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#f5b942" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* day/night tint — full-map overlay */}
      {tint && (
        <rect
          x={0}
          y={0}
          width={WORLD_W}
          height={WORLD_H}
          fill={tint.fill}
          opacity={tint.opacity}
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}


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

function tintFor(hour: number): { fill: string; opacity: number } | null {
  if (hour >= 5 && hour < 8) return { fill: "#f5b942", opacity: 0.04 };
  if (hour >= 8 && hour < 17) return null; // day — transparent
  if (hour >= 17 && hour < 20) return { fill: "#f97316", opacity: 0.05 };
  return { fill: "#1e1b4b", opacity: 0.12 };
}

function litThresholdFor(hour: number): number {
  // Night/dusk → 34, day/dawn → 10.
  if (hour >= 8 && hour < 17) return 10;
  if (hour >= 5 && hour < 8) return 10;
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

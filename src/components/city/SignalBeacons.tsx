// MILVERSE — CITY IS AWAKE · signal beacons.
// SVG-native, additive layer for CityWorld. Every beacon is a truthful
// signal (see @/lib/city/signals). Fully keyboard operable.

import { useEffect, useState } from "react";
import { readCitySignals, type CitySignal, type SignalDistrict } from "@/lib/city/signals";

/** Anchor coordinates on the world plane — reused district labels/hubs. */
export const BEACON_ANCHORS: Record<SignalDistrict, { x: number; y: number }> = {
  mirror: { x: 500, y: 170 },
  feed: { x: 2500, y: 170 },
  hall: { x: 1500, y: 890 },
  market: { x: 420, y: 1720 },
  arena: { x: 2580, y: 1720 },
};

const DISTRICT_COLOR: Record<SignalDistrict, string> = {
  mirror: "#22d3ee",
  feed: "#f5b942",
  hall: "#3b82f6",
  market: "#93c5fd",
  arena: "#f97316",
};

const DISTRICT_TITLE: Record<SignalDistrict, string> = {
  mirror: "Mirror district",
  feed: "Feed district",
  hall: "City Hall",
  market: "Market",
  arena: "Arena",
};

export interface SignalBeaconsProps {
  /** True when ambient/decorative motion is allowed (CINEMATIC + not reduced-motion). */
  ambient: boolean;
  /** Called on click / Enter / Space — parent handles fly-to + navigate. */
  onBeacon: (signal: CitySignal) => void;
}

export function SignalBeacons({ ambient, onBeacon }: SignalBeaconsProps) {
  const [signals, setSignals] = useState<CitySignal[]>(() => {
    if (typeof window === "undefined") return [];
    return readCitySignals(new Date());
  });

  useEffect(() => {
    const refresh = () => setSignals(readCitySignals(new Date()));
    refresh();
    const events = [
      "milverse:inbox",
      "milverse:profile",
      "milverse:boss",
      "milverse:firstphone",
      "milverse:pilot",
    ];
    events.forEach((e) => window.addEventListener(e, refresh));
    window.addEventListener("storage", refresh);
    return () => {
      events.forEach((e) => window.removeEventListener(e, refresh));
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (signals.length === 0) return null;

  return (
    <g data-layer="signal-beacons">
      {signals.map((s) => {
        const anchor = BEACON_ANCHORS[s.district];
        const color = DISTRICT_COLOR[s.district];
        const aria = `${DISTRICT_TITLE[s.district]}: ${s.label}. Open.`;
        return (
          <g
            key={`${s.district}:${s.to}`}
            transform={`translate(${anchor.x} ${anchor.y})`}
            role="button"
            tabIndex={0}
            aria-label={aria}
            className="beacon-node"
            style={{ cursor: "pointer", outline: "none" }}
            onClick={(e) => {
              e.stopPropagation();
              onBeacon(s);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onBeacon(s);
              }
            }}
          >
            {/* focus ring — visible against dark map */}
            <circle
              className="beacon-focus"
              r={34}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0}
            />
            {/* pulsing halo (ambient only) */}
            {ambient && (
              <circle
                className="beacon-pulse"
                r={26}
                fill={color}
                opacity={0.28}
                style={{ transformOrigin: "0 0" }}
              />
            )}
            {/* solid core dot */}
            <circle
              r={7}
              fill={color}
              stroke="#0b1224"
              strokeWidth={2}
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
            {/* count plate */}
            <g transform="translate(14 -12)">
              <rect
                x={0}
                y={0}
                width={26}
                height={20}
                rx={3}
                fill="#0b1224"
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={13}
                y={14}
                textAnchor="middle"
                fontSize={12}
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                fill={color}
              >
                {s.count}
              </text>
            </g>
            {/* label under beacon */}
            <g transform="translate(0 34)">
              <rect
                x={-64}
                y={-10}
                width={128}
                height={18}
                rx={2}
                fill="#0b1224"
                stroke={color}
                strokeOpacity={0.6}
                strokeWidth={1}
              />
              <text
                y={3}
                textAnchor="middle"
                fontSize={10}
                className="stencil"
                fill={color}
                style={{ letterSpacing: "0.08em" }}
              >
                {s.label.toUpperCase()}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}

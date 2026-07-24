// MILVERSE — Truth City sits on water. The bay runs off the two far edges of
// the board: a harbour with piers and freighters on the north-east, a strip
// resort on the north-west. Pure SVG, static geometry, motion only when the
// device can pay for it.

import React from "react";

const TW = 96;
const TH = 48;

type Props = { grid: number; reducedMotion: boolean; lowFx: boolean };

const iso = (gx: number, gy: number) => ({
  x: ((gx - gy) * TW) / 2,
  y: ((gx + gy) * TH) / 2,
});

export const OceanLayer = React.memo(function OceanLayer({
  grid,
  reducedMotion,
  lowFx,
}: Props) {
  const animate = !reducedMotion && !lowFx;
  const N = grid;

  // Shoreline corners: west vertex, north vertex, east vertex.
  const west = iso(0, N - 1);
  const east = iso(N - 1, 0);
  const L = { x: west.x - TW / 2, y: west.y + TH / 2 };
  const T = { x: 0, y: 0 };
  const R = { x: east.x + TW / 2, y: east.y + TH / 2 };

  // Out to sea.
  const OUT = 1400;
  const P4 = { x: R.x + OUT, y: R.y - OUT / 2 };
  const P5 = { x: T.x, y: T.y - OUT - 260 };
  const P6 = { x: L.x - OUT, y: L.y - OUT / 2 };
  const sea = `${L.x},${L.y} ${T.x},${T.y} ${R.x},${R.y} ${P4.x},${P4.y} ${P5.x},${P5.y} ${P6.x},${P6.y}`;

  // Wave combs parallel to each shore edge, stepping out to sea.
  const combs = (dir: 1 | -1) => {
    const rows: React.ReactNode[] = [];
    for (let i = 1; i <= 9; i++) {
      const off = i * 44;
      const ax = (dir === 1 ? R.x : L.x) + dir * off;
      const ay = (dir === 1 ? R.y : L.y) - off / 2;
      const bx = T.x + dir * off;
      const by = T.y - off / 2;
      rows.push(
        <line
          key={`${dir}-${i}`}
          x1={ax}
          y1={ay}
          x2={bx}
          y2={by}
          stroke="#5fd7e8"
          strokeWidth={0.9}
          strokeDasharray={`${10 + i * 3} ${26 + i * 4}`}
          opacity={0.22 - i * 0.016}
        >
          {animate && (
            <animate
              attributeName="stroke-dashoffset"
              values={`0;${dir * 90}`}
              dur={`${9 + i}s`}
              repeatCount="indefinite"
            />
          )}
        </line>,
      );
    }
    return rows;
  };

  /* ── the harbour: three piers off the north-east shore ── */
  const pier = (t: number, len: number, key: string) => {
    // t = 0..1 along the NE shore (T → R)
    const sx = T.x + (R.x - T.x) * t;
    const sy = T.y + (R.y - T.y) * t;
    const ux = TW / 2 / 53.66;
    const uy = -TH / 2 / 53.66;
    const ex = sx + ux * len;
    const ey = sy + uy * len;
    return (
      <g key={key}>
        <polygon
          points={`${sx},${sy + 5} ${ex},${ey + 5} ${ex},${ey + 11} ${sx},${sy + 11}`}
          fill="#120d18"
          opacity="0.6"
        />
        <polygon
          points={`${sx},${sy - 3} ${ex},${ey - 3} ${ex},${ey + 5} ${sx},${sy + 5}`}
          fill="#3a2d22"
          stroke="#54402e"
          strokeWidth="0.6"
        />
        {Array.from({ length: Math.floor(len / 18) }).map((_, i) => {
          const px = sx + ux * (10 + i * 18);
          const py = sy + uy * (10 + i * 18);
          return <line key={i} x1={px} y1={py - 3} x2={px} y2={py + 9} stroke="#241a12" strokeWidth="1.4" />;
        })}
        {/* pier lamp */}
        <line x1={ex} y1={ey - 3} x2={ex} y2={ey - 17} stroke="#4a4a55" strokeWidth="1" />
        <circle cx={ex} cy={ey - 18} r={1.8} fill="#fde68a">
          {animate && <animate attributeName="opacity" values="1;0.45;1" dur="4s" repeatCount="indefinite" />}
        </circle>
        <ellipse cx={ex} cy={ey + 2} rx={14} ry={5} fill="#fde68a" opacity="0.07" />
      </g>
    );
  };

  const ship = (x: number, y: number, s: number, hull: string, key: string, drift: number) => (
    <g key={key} transform={`translate(${x},${y}) scale(${s})`}>
      {animate && (
        <animateTransform
          attributeName="transform"
          type="translate"
          additive="sum"
          values={`0 0; 0 ${drift}; 0 0`}
          dur={`${6 + drift}s`}
          repeatCount="indefinite"
        />
      )}
      <ellipse cx={0} cy={7} rx={40} ry={7} fill="#000" opacity="0.35" />
      <polygon points="-40,0 34,0 26,10 -32,10" fill={hull} stroke="#0b0810" strokeWidth="0.8" />
      <rect x={-40} y={-3} width={74} height={3} fill="#6b6357" opacity="0.8" />
      <rect x={6} y={-16} width={18} height={13} fill="#2b3340" stroke="#3f4a5a" strokeWidth="0.6" />
      <rect x={9} y={-13} width={3} height={3} fill="#a0d8ff" opacity="0.7" />
      <rect x={14} y={-13} width={3} height={3} fill="#a0d8ff" opacity="0.5" />
      <rect x={26} y={-24} width={3} height={9} fill="#7a3b32" />
      {/* deck containers */}
      {[-34, -25, -16, -7].map((cx, i) => (
        <g key={i}>
          <rect x={cx} y={-9} width={8} height={6} fill={i % 2 ? "#3b5a63" : "#5a3b3b"} />
          <rect x={cx} y={-15} width={8} height={6} fill={i % 2 ? "#4a4f2e" : "#33465e"} />
        </g>
      ))}
      <circle cx={30} cy={-26} r={1.4} fill="#f87171">
        {animate && <animate attributeName="opacity" values="1;0.2;1" dur="2.2s" repeatCount="indefinite" />}
      </circle>
    </g>
  );

  /* ── the resort: strip hotel, pool, umbrellas on the north-west shore ── */
  const resortX = L.x + (T.x - L.x) * 0.42;
  const resortY = L.y + (T.y - L.y) * 0.42;

  return (
    <g aria-hidden="true" pointerEvents="none" shapeRendering="optimizeSpeed">
      <defs>
        <linearGradient id="milv-sea" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0d2b3a" />
          <stop offset="0.45" stopColor="#08202e" />
          <stop offset="1" stopColor="#050d18" />
        </linearGradient>
        <linearGradient id="milv-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3f2c" />
          <stop offset="1" stopColor="#2c2418" />
        </linearGradient>
      </defs>

      <polygon points={sea} fill="url(#milv-sea)" />
      {/* moon path off the water */}
      <polygon
        points={`${T.x - 26},${T.y} ${T.x + 26},${T.y} ${T.x + 150},${T.y - 700} ${T.x - 150},${T.y - 700}`}
        fill="#9fd8e8"
        opacity="0.05"
      />
      {combs(1)}
      {combs(-1)}

      {/* sand strip + foam along both shore edges */}
      <polyline
        points={`${L.x},${L.y} ${T.x},${T.y} ${R.x},${R.y}`}
        fill="none"
        stroke="url(#milv-sand)"
        strokeWidth="9"
        opacity="0.85"
      />
      <polyline
        points={`${L.x},${L.y} ${T.x},${T.y} ${R.x},${R.y}`}
        fill="none"
        stroke="#bfe9f2"
        strokeWidth="1.2"
        strokeDasharray="14 9"
        opacity="0.35"
      >
        {animate && (
          <animate attributeName="stroke-dashoffset" values="0;46" dur="7s" repeatCount="indefinite" />
        )}
      </polyline>

      {/* HARBOUR */}
      {pier(0.55, 150, "p1")}
      {pier(0.78, 108, "p2")}
      {pier(0.33, 92, "p3")}
      {ship(R.x - 40, R.y - 210, 1.15, "#4a2f2a", "s1", 4)}
      {ship(R.x - 250, R.y - 340, 0.9, "#25333f", "s2", 6)}
      {ship(T.x + 260, T.y - 430, 0.62, "#33324a", "s3", 5)}
      {/* dock cranes on the shore */}
      {[0.62, 0.72].map((t, i) => {
        const cx = T.x + (R.x - T.x) * t;
        const cy = T.y + (R.y - T.y) * t;
        return (
          <g key={`crane-${i}`} transform={`translate(${cx},${cy})`}>
            <line x1={-6} y1={0} x2={-6} y2={-42} stroke="#5a5f6b" strokeWidth="2" />
            <line x1={6} y1={2} x2={6} y2={-40} stroke="#4a4f5b" strokeWidth="2" />
            <line x1={-14} y1={-42} x2={34} y2={-50} stroke="#6b7280" strokeWidth="2.4" />
            <line x1={26} y1={-48} x2={26} y2={-26} stroke="#3a3f4b" strokeWidth="1" />
            <rect x={22} y={-26} width={8} height={5} fill="#7a5b2e" />
            <circle cx={34} cy={-50} r={1.4} fill="#f87171" opacity="0.9" />
          </g>
        );
      })}
      <text
        x={T.x + (R.x - T.x) * 0.55 + 60}
        y={T.y + (R.y - T.y) * 0.55 - 60}
        fill="#7dd3fc"
        opacity="0.55"
        fontSize="11"
        fontFamily='"Bebas Neue", sans-serif'
        letterSpacing="2px"
      >
        HARBOUR SIX · DOCKS
      </text>

      {/* RESORT */}
      <g transform={`translate(${resortX},${resortY})`}>
        <ellipse cx={-30} cy={-6} rx={78} ry={26} fill="#3b3323" opacity="0.75" />
        {/* pool */}
        <ellipse cx={-52} cy={-12} rx={20} ry={8} fill="#116e82" opacity="0.85" />
        <ellipse cx={-52} cy={-13} rx={14} ry={5} fill="#3fc7d8" opacity="0.35">
          {animate && <animate attributeName="opacity" values="0.35;0.18;0.35" dur="5s" repeatCount="indefinite" />}
        </ellipse>
        {/* hotel block */}
        <g transform="translate(-96,-16)">
          <polygon points="0,0 34,-17 34,-49 0,-32" fill="#2f2a34" />
          <polygon points="34,-17 62,-3 62,-35 34,-49" fill="#1e1a24" />
          <polygon points="0,-32 34,-49 62,-35 28,-18" fill="#453d4c" />
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={5 + c * 9}
                y={-27 - r * 7}
                width={5}
                height={4}
                fill="#fde68a"
                opacity={(r + c) % 3 === 0 ? 0.75 : 0.28}
              />
            )),
          )}
          <text x={6} y={-54} fill="#5eead4" opacity="0.7" fontSize="7" fontFamily='"Bebas Neue", sans-serif' letterSpacing="1.4px">
            BAY VIEW
          </text>
        </g>
        {/* umbrellas + loungers */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${-8 + i * 22},${2 + (i % 2) * 7})`}>
            <ellipse cx={0} cy={3} rx={7} ry={2} fill="#000" opacity="0.35" />
            <line x1={0} y1={2} x2={0} y2={-9} stroke="#6b5a3e" strokeWidth="0.9" />
            <path d="M-9,-9 A9,5 0 0 1 9,-9 Z" fill={i % 2 ? "#c2603f" : "#d9a441"} opacity="0.9" />
            <rect x={-8} y={1} width={7} height={2} rx={1} fill="#cbbfa6" opacity="0.8" />
          </g>
        ))}
        {/* palms */}
        {[-118, -66, 34].map((px, i) => (
          <g key={`palm-${i}`} transform={`translate(${px},${10 + (i % 2) * 6})`}>
            <ellipse cx={0} cy={2} rx={6} ry={1.6} fill="#000" opacity="0.35" />
            <path d="M0,2 Q2,-8 0,-20" stroke="#4a3722" strokeWidth="1.8" fill="none" />
            <path d="M0,-20 Q-11,-25 -16,-18" stroke="#1e5a3a" strokeWidth="1.6" fill="none" />
            <path d="M0,-20 Q11,-26 17,-19" stroke="#1e5a3a" strokeWidth="1.6" fill="none" />
            <path d="M0,-20 Q-7,-30 -2,-33" stroke="#256b45" strokeWidth="1.6" fill="none" />
            <path d="M0,-20 Q9,-30 4,-34" stroke="#256b45" strokeWidth="1.6" fill="none" />
          </g>
        ))}
        <text x={-30} y={26} fill="#fbbf24" opacity="0.5" fontSize="9" fontFamily='"Bebas Neue", sans-serif' letterSpacing="1.8px">
          SHORELINE STRIP
        </text>
      </g>
    </g>
  );
});

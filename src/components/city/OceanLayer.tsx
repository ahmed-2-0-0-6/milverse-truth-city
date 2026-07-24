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

      {/* ── OPEN WATER DETAIL ─────────────────────────────────
         Everything here is deterministic: same board, same bay,
         every load. Motion only when the fx budget allows. */}

      {/* horizon fog band + far shore */}
      <polygon
        points={`${P6.x},${T.y - 780} ${P4.x},${T.y - 780} ${P4.x},${T.y - 700} ${P6.x},${T.y - 700}`}
        fill="#122a3c"
        opacity="0.55"
      />
      <path
        d={`M${P6.x},${T.y - 706} L${T.x - 620},${T.y - 724} L${T.x - 470},${T.y - 706} L${T.x - 300},${T.y - 732} L${T.x - 120},${T.y - 704} L${T.x + 180},${T.y - 736} L${T.x + 420},${T.y - 702} L${P4.x},${T.y - 712} L${P4.x},${T.y - 690} L${P6.x},${T.y - 690} Z`}
        fill="#0b1b28"
        opacity="0.8"
      />
      {[-560, -240, 120, 460].map((hx, i) => (
        <circle key={`farlight-${i}`} cx={T.x + hx} cy={T.y - 712 - (i % 2) * 8} r={1.3} fill="#fcd34d" opacity="0.5">
          {animate && (
            <animate attributeName="opacity" values="0.5;0.15;0.5" dur={`${5 + i}s`} repeatCount="indefinite" />
          )}
        </circle>
      ))}
      <polygon
        points={`${P6.x},${T.y - 700} ${P4.x},${T.y - 700} ${P4.x},${T.y - 560} ${P6.x},${T.y - 560}`}
        fill="url(#horizon-haze)"
        opacity="0.25"
      />

      {/* rock breakwater + lighthouse guarding the harbour mouth */}
      <g transform={`translate(${R.x - 130},${R.y - 300})`}>
        <path d="M-120,26 L-60,6 L10,-6 L64,2 L74,14 L20,26 L-46,38 Z" fill="#1b1f28" stroke="#2b3240" strokeWidth="0.7" />
        {[-96, -70, -44, -16, 12, 40].map((rx, i) => (
          <polygon
            key={`rock-${i}`}
            points={`${rx},${20 - (i % 3) * 3} ${rx + 12},${12 - (i % 2) * 4} ${rx + 22},${22 - (i % 3) * 2} ${rx + 8},${28}`}
            fill={i % 2 ? "#242a34" : "#161b23"}
          />
        ))}
        <ellipse cx={48} cy={4} rx={16} ry={6} fill="#20262f" />
        <polygon points="40,2 56,2 53,-34 43,-34" fill="#e5e7eb" opacity="0.16" />
        <polygon points="43,-16 53,-16 52,-34 44,-34" fill="#b91c1c" opacity="0.35" />
        <rect x={42} y={-42} width={12} height={9} fill="#0f1720" stroke="#3a4453" strokeWidth="0.6" />
        <circle cx={48} cy={-37} r={2.4} fill="#fef3c7">
          {animate && <animate attributeName="opacity" values="1;0.25;1" dur="3.6s" repeatCount="indefinite" />}
        </circle>
        {animate && (
          <polygon points="48,-37 190,-84 190,-4" fill="#fef3c7" opacity="0.06">
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 48 -37; 360 48 -37"
              dur="14s"
              repeatCount="indefinite"
            />
          </polygon>
        )}
      </g>

      {/* channel buoys marking the approach lane */}
      {[
        [R.x - 210, R.y - 240, "#f87171"],
        [R.x - 330, R.y - 330, "#4ade80"],
        [R.x - 450, R.y - 420, "#f87171"],
        [T.x + 120, T.y - 300, "#4ade80"],
      ].map(([bx, by, col], i) => (
        <g key={`buoy-${i}`} transform={`translate(${bx},${by})`}>
          {animate && (
            <animateTransform
              attributeName="transform"
              type="translate"
              additive="sum"
              values="0 0; 0 3; 0 0"
              dur={`${4 + i}s`}
              repeatCount="indefinite"
            />
          )}
          <ellipse cx={0} cy={3} rx={7} ry={2.4} fill="#0b1a24" opacity="0.7" />
          <polygon points="-4,2 4,2 2,-8 -2,-8" fill={col as string} opacity="0.85" />
          <circle cx={0} cy={-10} r={1.5} fill={col as string}>
            {animate && (
              <animate attributeName="opacity" values="1;0.2;1" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
            )}
          </circle>
        </g>
      ))}

      {/* sailboats out on the bay */}
      {[
        [T.x - 300, T.y - 250, 1],
        [T.x - 520, T.y - 400, 0.8],
        [T.x + 380, T.y - 250, 0.7],
        [T.x - 90, T.y - 470, 0.6],
      ].map(([sx, sy, s], i) => (
        <g key={`sail-${i}`} transform={`translate(${sx},${sy}) scale(${s})`}>
          {animate && (
            <animateTransform
              attributeName="transform"
              type="translate"
              additive="sum"
              values={`0 0; ${8 + i * 4} -2; 0 0`}
              dur={`${22 + i * 6}s`}
              repeatCount="indefinite"
            />
          )}
          <ellipse cx={0} cy={4} rx={16} ry={4} fill="#000" opacity="0.3" />
          <path d="M-14,2 L14,2 L9,7 L-10,7 Z" fill="#20262f" stroke="#39404d" strokeWidth="0.5" />
          <line x1={-1} y1={2} x2={-1} y2={-26} stroke="#6b7280" strokeWidth="1" />
          <path d="M0,-26 L0,0 L14,0 Z" fill="#e2e8f0" opacity="0.7" />
          <path d="M-2,-24 L-2,-2 L-12,-2 Z" fill="#cbd5e1" opacity="0.45" />
        </g>
      ))}

      {/* fishing skiffs, close in, with nets and lamps */}
      {[
        [T.x - 170, T.y - 150],
        [L.x + 220, L.y - 190],
        [T.x + 90, T.y - 180],
      ].map(([fx, fy], i) => (
        <g key={`skiff-${i}`} transform={`translate(${fx},${fy}) scale(0.8)`}>
          {animate && (
            <animateTransform
              attributeName="transform"
              type="translate"
              additive="sum"
              values="0 0; 0 2.5; 0 0"
              dur={`${5 + i}s`}
              repeatCount="indefinite"
            />
          )}
          <ellipse cx={0} cy={5} rx={14} ry={3.5} fill="#000" opacity="0.35" />
          <path d="M-13,0 L13,0 L8,6 L-9,6 Z" fill="#3a2b1e" stroke="#54402e" strokeWidth="0.5" />
          <line x1={4} y1={0} x2={4} y2={-14} stroke="#5a4530" strokeWidth="0.9" />
          <circle cx={4} cy={-15} r={1.6} fill="#fde68a" opacity="0.9">
            {animate && <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />}
          </circle>
          <path d="M-12,-1 Q-18,4 -20,10" stroke="#4b5563" strokeWidth="0.6" fill="none" opacity="0.7" />
          <circle cx={-4} cy={-3} r={1.6} fill="#1f2937" />
        </g>
      ))}

      {/* ferry crossing the bay, dragging a wake */}
      <g>
        <g>
          {animate && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${L.x + 60} ${L.y - 320}; ${R.x - 60} ${R.y - 320}; ${L.x + 60} ${L.y - 320}`}
              dur="120s"
              repeatCount="indefinite"
            />
          )}
          <g transform={animate ? undefined : `translate(${T.x - 200},${T.y - 320})`}>
            <path d="M-90,0 Q-40,-6 0,0 Q-40,8 -90,0 Z" fill="#7dd3fc" opacity="0.12" />
            <ellipse cx={0} cy={4} rx={26} ry={5} fill="#000" opacity="0.3" />
            <path d="M-22,-2 L22,-2 L17,6 L-18,6 Z" fill="#2a3340" stroke="#3f4a5a" strokeWidth="0.6" />
            <rect x={-14} y={-11} width={28} height={9} fill="#38414f" />
            {[-11, -5, 1, 7].map((wx, i) => (
              <rect key={i} x={wx} y={-9} width={4} height={4} fill="#a0d8ff" opacity={i % 2 ? 0.45 : 0.75} />
            ))}
            <rect x={12} y={-18} width={3} height={7} fill="#7a3b32" />
          </g>
        </g>
      </g>

      {/* jet skis off the resort */}
      {[
        [L.x + 130, L.y - 120],
        [L.x + 190, L.y - 168],
      ].map(([jx, jy], i) => (
        <g key={`ski-${i}`} transform={`translate(${jx},${jy}) scale(0.55)`}>
          <path d={`M-2,2 Q-34,${6 + i * 3} -70,2`} stroke="#bfe9f2" strokeWidth="2" fill="none" opacity="0.2">
            {animate && (
              <animate attributeName="opacity" values="0.22;0.06;0.22" dur="3.4s" repeatCount="indefinite" />
            )}
          </path>
          <ellipse cx={0} cy={4} rx={9} ry={2.5} fill="#000" opacity="0.35" />
          <path d="M-9,0 L9,0 L6,5 L-7,5 Z" fill="#b45309" />
          <circle cx={1} cy={-5} r={3} fill="#1f2937" />
        </g>
      ))}

      {/* ripple rings + foam patches on open water */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = ((i * 97) % 100) / 100;
        const b = ((i * 53) % 100) / 100;
        const rx = T.x - 620 + a * 1240;
        const ry = T.y - 120 - b * 520;
        return (
          <g key={`rip-${i}`}>
            <ellipse cx={rx} cy={ry} rx={10 + a * 14} ry={3 + b * 3} fill="none" stroke="#7dd3fc" strokeWidth="0.5" opacity="0.14">
              {animate && (
                <animate attributeName="opacity" values="0.16;0.03;0.16" dur={`${6 + i}s`} repeatCount="indefinite" />
              )}
            </ellipse>
            <ellipse cx={rx + 8} cy={ry + 5} rx={5 + b * 6} ry={1.6} fill="#cfeef7" opacity="0.07" />
          </g>
        );
      })}

      {/* city lights bleeding into the water along the shore */}
      {[0.15, 0.3, 0.45, 0.62, 0.8].map((t, i) => {
        const sxp = T.x + (R.x - T.x) * t;
        const syp = T.y + (R.y - T.y) * t;
        const lxp = T.x + (L.x - T.x) * t;
        const lyp = T.y + (L.y - T.y) * t;
        return (
          <g key={`refl-${i}`}>
            <ellipse cx={sxp + 16} cy={syp - 14} rx={4} ry={22} fill="#fcd34d" opacity="0.07" transform={`rotate(-27 ${sxp + 16} ${syp - 14})`} />
            <ellipse cx={lxp - 16} cy={lyp - 14} rx={4} ry={22} fill="#67e8f9" opacity="0.06" transform={`rotate(27 ${lxp - 16} ${lyp - 14})`} />
          </g>
        );
      })}

      {/* gulls over the harbour */}
      {animate &&
        [
          [R.x - 180, R.y - 380, 1],
          [R.x - 260, R.y - 430, 0.8],
          [T.x + 40, T.y - 400, 0.7],
          [T.x - 220, T.y - 460, 0.6],
        ].map(([gx2, gy2, s], i) => (
          <g key={`gull-${i}`} transform={`translate(${gx2},${gy2}) scale(${s})`} opacity="0.5">
            <animateTransform
              attributeName="transform"
              type="translate"
              additive="sum"
              values={`0 0; ${30 + i * 12} ${-8 - i * 3}; 0 0`}
              dur={`${16 + i * 5}s`}
              repeatCount="indefinite"
            />
            <path d="M-7,0 Q-3,-4 0,0 Q3,-4 7,0" stroke="#e5e7eb" strokeWidth="1" fill="none">
              <animate attributeName="d" values="M-7,0 Q-3,-4 0,0 Q3,-4 7,0; M-7,0 Q-3,1 0,0 Q3,1 7,0; M-7,0 Q-3,-4 0,0 Q3,-4 7,0" dur="1.6s" repeatCount="indefinite" />
            </path>
          </g>
        ))}

      {/* ── OCEAN LIFE ────────────────────────────────────────
         The bay is alive: pods, schools, jellies, a turtle, and
         one whale that only surfaces when the fx budget allows. */}

      {/* dolphin pod arcing out of the water */}
      {[0, 1, 2].map((i) => {
        const px = T.x - 420 + i * 46;
        const py = T.y - 300 + (i % 2) * 14;
        return (
          <g key={`dolphin-${i}`} transform={`translate(${px},${py})`}>
            <ellipse cx={0} cy={8} rx={16} ry={3.5} fill="#000" opacity="0.25" />
            <g opacity={animate ? 1 : 0.85}>
              {animate && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0 8; 0 -10; 0 8; 0 8`}
                  keyTimes="0;0.25;0.5;1"
                  dur={`${7 + i}s`}
                  repeatCount="indefinite"
                />
              )}
              <path d="M-13,4 Q-6,-8 6,-6 Q13,-5 15,1 Q6,4 -2,6 Z" fill="#2b3a4a" stroke="#3f5468" strokeWidth="0.5" />
              <path d="M-2,-5 L2,-12 L6,-5 Z" fill="#22303e" />
              <path d="M-13,4 L-19,0 L-18,7 Z" fill="#22303e" />
              <circle cx={11} cy={-3} r={0.8} fill="#0b0f14" />
            </g>
            {/* splash ring */}
            <ellipse cx={0} cy={9} rx={9} ry={2.4} fill="none" stroke="#bfe9f2" strokeWidth="0.6" opacity="0.18">
              {animate && (
                <animate attributeName="rx" values="4;14;4" dur={`${7 + i}s`} repeatCount="indefinite" />
              )}
            </ellipse>
          </g>
        );
      })}

      {/* whale: back, blowhole spout, tail fluke */}
      <g transform={`translate(${T.x + 210},${T.y - 470})`} opacity="0.9">
        {animate && (
          <animateTransform
            attributeName="transform"
            type="translate"
            additive="sum"
            values="0 0; 26 6; 0 0"
            dur="46s"
            repeatCount="indefinite"
          />
        )}
        <ellipse cx={0} cy={10} rx={54} ry={9} fill="#000" opacity="0.28" />
        <path d="M-46,6 Q-10,-12 26,0 Q40,4 46,8 Q10,12 -34,11 Z" fill="#1d2b38" stroke="#33475a" strokeWidth="0.6" />
        <path d="M-2,-6 L4,-18 L12,-5 Z" fill="#16222d" />
        <path d="M46,8 Q60,-2 70,-10 Q62,10 74,14 Q56,16 46,10 Z" fill="#16222d" opacity="0.9" />
        <circle cx={20} cy={0} r={0.9} fill="#0a0f14" />
        {animate && (
          <g>
            <path d="M8,-8 Q6,-26 0,-38" stroke="#cfeef7" strokeWidth="1.6" fill="none" opacity="0.35">
              <animate attributeName="opacity" values="0;0.4;0" dur="9s" repeatCount="indefinite" />
            </path>
            <path d="M10,-8 Q14,-24 22,-34" stroke="#cfeef7" strokeWidth="1.4" fill="none" opacity="0.3">
              <animate attributeName="opacity" values="0;0.35;0" dur="9s" repeatCount="indefinite" />
            </path>
          </g>
        )}
      </g>

      {/* fish schools: dark shoals sliding under the surface */}
      {[
        [T.x - 200, T.y - 200, 1],
        [R.x - 380, R.y - 260, 0.8],
        [L.x + 300, L.y - 300, 0.9],
      ].map(([fx, fy, s], i) => (
        <g key={`school-${i}`} transform={`translate(${fx},${fy}) scale(${s})`} opacity="0.5">
          {animate && (
            <animateTransform
              attributeName="transform"
              type="translate"
              additive="sum"
              values={`0 0; ${18 + i * 8} ${6 - i * 4}; 0 0`}
              dur={`${20 + i * 7}s`}
              repeatCount="indefinite"
            />
          )}
          <ellipse cx={0} cy={0} rx={26} ry={8} fill="#0a2230" opacity="0.55" />
          {Array.from({ length: 11 }).map((_, k) => {
            const a = ((k * 37) % 100) / 100;
            const b = ((k * 61) % 100) / 100;
            return (
              <path
                key={k}
                d={`M${-22 + a * 44},${-6 + b * 12} l4,-1.4 l-4,-1.4 z`}
                fill="#67e8f9"
                opacity={0.25 + b * 0.3}
              >
                {animate && (
                  <animate attributeName="opacity" values={`${0.35 + b * 0.2};0.1;${0.35 + b * 0.2}`} dur={`${3 + k * 0.3}s`} repeatCount="indefinite" />
                )}
              </path>
            );
          })}
        </g>
      ))}

      {/* jellyfish bloom — slow cold glow near the breakwater */}
      {[0, 1, 2, 3, 4].map((i) => {
        const jx = R.x - 300 + ((i * 43) % 90) - 40;
        const jy = R.y - 190 - i * 26;
        return (
          <g key={`jelly-${i}`} transform={`translate(${jx},${jy})`} opacity="0.4">
            {animate && (
              <animateTransform
                attributeName="transform"
                type="translate"
                additive="sum"
                values="0 0; 0 -6; 0 0"
                dur={`${8 + i}s`}
                repeatCount="indefinite"
              />
            )}
            <path d="M-5,0 A5,4 0 0 1 5,0 Z" fill="#a78bfa" opacity="0.55" />
            <path d="M-3,0 Q-3,6 -4,9 M0,0 Q0,7 1,10 M3,0 Q3,6 4,8" stroke="#c4b5fd" strokeWidth="0.5" fill="none" opacity="0.5" />
            <circle cx={0} cy={-1} r={7} fill="#a78bfa" opacity="0.07" />
          </g>
        );
      })}

      {/* sea turtle paddling the shallows off the resort */}
      <g transform={`translate(${L.x + 260},${L.y - 130}) scale(0.9)`} opacity="0.8">
        {animate && (
          <animateTransform
            attributeName="transform"
            type="translate"
            additive="sum"
            values="0 0; 14 -6; 0 0"
            dur="34s"
            repeatCount="indefinite"
          />
        )}
        <ellipse cx={0} cy={4} rx={13} ry={4} fill="#000" opacity="0.25" />
        <ellipse cx={0} cy={0} rx={9} ry={6} fill="#1f4436" stroke="#2f6b52" strokeWidth="0.6" />
        <path d="M-3,-3 l3,-1 l3,1 l-1,3 l-4,0 z" fill="#2c5f49" opacity="0.8" />
        <ellipse cx={9} cy={-1} rx={3} ry={2} fill="#2c5f49" />
        <path d="M-6,-6 Q-13,-10 -15,-5 M-6,6 Q-13,10 -15,5 M5,-6 Q10,-11 13,-7" stroke="#2c5f49" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>

      {/* bioluminescent plankton smear along the surf line */}
      {animate && (
        <polyline
          points={`${L.x},${L.y} ${T.x},${T.y} ${R.x},${R.y}`}
          fill="none"
          stroke="#5eead4"
          strokeWidth="2.4"
          strokeDasharray="6 34"
          opacity="0.18"
        >
          <animate attributeName="stroke-dashoffset" values="0;-80" dur="11s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.07;0.2" dur="6s" repeatCount="indefinite" />
        </polyline>
      )}

      {/* lone shark fin cutting a line, far out */}
      {animate && (
        <g transform={`translate(${T.x - 560},${T.y - 380})`} opacity="0.55">
          <animateTransform
            attributeName="transform"
            type="translate"
            additive="sum"
            values="0 0; 120 34; 0 0"
            dur="58s"
            repeatCount="indefinite"
          />
          <path d="M-16,3 Q-6,3 0,3" stroke="#bfe9f2" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M0,3 L5,-8 L9,3 Z" fill="#243543" stroke="#3a5266" strokeWidth="0.5" />
        </g>
      )}


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

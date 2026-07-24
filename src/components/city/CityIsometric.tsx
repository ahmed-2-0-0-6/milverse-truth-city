// MILVERSE — Your City · isometric render (Pass 1 · SimCity pass).
// Pure SVG. 5×5 diamond grid, 8 plots + central plaza + road cross.
// Buildings grow with level: taller silhouettes, more window rows, roof
// detail unlocks at Lv3 (antennae, domes, spires, searchlights).
// Interaction: tap a tile → BuildingCard bottom sheet.
// Perf: rows memoized; ambient window flicker gated on reduced-motion.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CinematicLayer } from "@/components/city/CinematicLayer";

import {
  BUILDINGS_BY_ID,
  BUILDINGS,
  type BuildingDef,
  type BuildingId,
  isMaxed,
  nextCost,
} from "@/lib/city/buildings";
import {
  loadCity,
  levelOf,
  nextAfford,
  plotsBuilt,
  type CitySave,
} from "@/lib/city/citySave";
import { BuildingCard } from "@/components/city/BuildingCard";
import { PayrollTill } from "@/components/city/PayrollTill";
import { ThreatSiren } from "@/components/city/ThreatSiren";


import { useOnScreen } from "@/hooks/useOnScreen";

import { titleFor, nextTitle } from "@/lib/city/title";
import {
  PLOT_CELL,
  ZONES,
  GRID,
  CENTER,
  ringOf,
  cellLocked,
  buildingLock,
} from "@/lib/city/zones";

/* ── geometry ────────────────────────────────────────────── */
const TW = 96; // tile width
const TH = 48; // tile height (2:1 iso)
type Cell = [number, number];
const PLACEMENT: Record<BuildingId, Cell> = PLOT_CELL;
const iso = (gx: number, gy: number) => ({
  x: ((gx - gy) * TW) / 2,
  y: ((gx + gy) * TH) / 2,
});

/* ── map label system ────────────────────────────────────────
   One type scale and one ink set for every label drawn on the
   board. Signage reads the same whether it's a plot, a district
   plate or a tooltip. Don't hand-roll sizes below. */
const STENCIL = '"Bebas Neue", sans-serif';
const MONO = "ui-monospace, monospace";
/** Plate headings (plot names, district names, tooltip titles). */
const SIGN_TITLE = { fontFamily: STENCIL, letterSpacing: "1.1px" } as const;
/** Small print (costs, levels, rank gates). */
const SIGN_META = { fontFamily: MONO, letterSpacing: "0.2px" } as const;
const SIGN_SIZE = { title: 8, titleLg: 9, meta: 6, metaLg: 6.5 } as const;
/** Ink. Amber = live, rose = sealed, emerald = done, stone = idle. */
const INK = {
  live: "#fde68a",
  ready: "#fde047",
  sealed: "#fda4af",
  sealedMeta: "#e7b7c0",
  done: "#a7f3d0",
  doneMeta: "#6ee7b7",
  idle: "#d6d3d1",
  meta: "#a8a29e",
} as const;


/* ── palette per district ────────────────────────────────── */
const PALETTE: Record<
  BuildingDef["district"],
  { top: string; left: string; right: string; window: string; accent: string }
> = {
  core:     { top: "#3d332a", left: "#2b241d", right: "#1c1712", window: "#fcd34d", accent: "#f97316" },
  learn:    { top: "#2e4a5c", left: "#1f3446", right: "#152535", window: "#67e8f9", accent: "#22d3ee" },
  press:    { top: "#4a2622", left: "#341814", right: "#22100d", window: "#fda4af", accent: "#f43f5e" },
  signals:  { top: "#3a2e58", left: "#271e40", right: "#181128", window: "#c4b5fd", accent: "#a78bfa" },
  records:  { top: "#4d3a1f", left: "#362813", right: "#221909", window: "#fde68a", accent: "#eab308" },
  elite:    { top: "#264d4a", left: "#183633", right: "#0d221f", window: "#a7f3d0", accent: "#34d399" },
};

/* ── ground tile ─────────────────────────────────────────── */
type TileKind = "grass" | "road" | "plaza";
function classifyTile(gx: number, gy: number): TileKind {
  if (gx === CENTER && gy === CENTER) return "plaza";
  // Two avenues through the middle, plus a ring road around the Outer Rim.
  if (gx === CENTER || gy === CENTER) return "road";
  if (ringOf(gx, gy) === 3) return "road";
  return "grass";
}

// Deterministic pseudo-random per (gx,gy,seed) — stable across renders.
function hashCell(gx: number, gy: number, seed = 0) {
  let n = ((gx + 17) * 73856093) ^ ((gy + 31) * 19349663) ^ ((seed + 7) * 83492791);
  n = (n >>> 0) % 100000;
  return n / 100000;
}

// Cells that hold buildings (so we don't scatter props on them)
const BUILDING_CELLS = new Set(
  Object.values(PLOT_CELL).map(([a, b]) => `${a}-${b}`),
);


function GroundTileImpl({ gx, gy, reducedMotion, lowFx }: { gx: number; gy: number; reducedMotion: boolean; lowFx: boolean }) {
  const { x, y } = iso(gx, gy);
  const kind = classifyTile(gx, gy);
  const fill =
    kind === "road" ? "#151519" : kind === "plaza" ? "#2a2620" : "#0f0c14";
  const stroke = kind === "road" ? "#22222c" : "#1a1424";
  const pts = `0,0 ${TW / 2},${TH / 2} 0,${TH} ${-TW / 2},${TH / 2}`;
  const hasBuilding = BUILDING_CELLS.has(`${gx}-${gy}`);
  const rA = hashCell(gx, gy, 1);
  const rB = hashCell(gx, gy, 2);
  const rC = hashCell(gx, gy, 3);
  // Per-tile SMIL is the single biggest cost on 81 tiles. On weak hardware the
  // decoration stays, the motion goes.
  const animate = !reducedMotion && !lowFx;


  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="0.5" />

      {kind === "road" && (
        <polygon
          points={pts}
          fill="url(#road-sheen)"
          opacity="0.35"
          pointerEvents="none"
        />
      )}

      {kind === "grass" && hasBuilding && (
        <>
          <polygon
            points={`0,4 ${TW / 2 - 4},${TH / 2} 0,${TH - 4} ${-(TW / 2 - 4)},${TH / 2}`}
            fill="#2a2530"
            stroke="#3a3444"
            strokeWidth="0.4"
          />
          {animate && (
            <>
              <circle cx={-(TW / 2 - 8)} cy={TH / 2} r={1.1} fill="#fef3c7" opacity="0.9">
                <animate
                  attributeName="cx"
                  values={`${-(TW / 2 - 8)};${TW / 2 - 8};${-(TW / 2 - 8)}`}
                  dur={`${9 + rA * 4}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={TW / 2 - 8} cy={TH / 2 + 2} r={1.1} fill="#fda4af" opacity="0.85">
                <animate
                  attributeName="cx"
                  values={`${TW / 2 - 8};${-(TW / 2 - 8)};${TW / 2 - 8}`}
                  dur={`${10 + rB * 4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </>
      )}

      {kind === "grass" && !hasBuilding && (
        <>
          {[0, 1, 2, 3, 4].map((i) => {
            const rx = hashCell(gx, gy, 10 + i);
            const ry = hashCell(gx, gy, 20 + i);
            const px = -TW / 2 + 8 + rx * (TW - 16);
            const py = 6 + ry * (TH - 12);
            return (
              <circle key={i} cx={px} cy={py} r={0.6} fill="#2a2036" opacity="0.6" />
            );
          })}
          {rA < 0.4 && (
            <g transform={`translate(${(rB - 0.5) * 20}, ${(rC - 0.5) * 10 + TH / 2})`}>
              <ellipse cx={0} cy={2} rx={5} ry={1.5} fill="#000" opacity="0.5" />
              <rect x={-1} y={-8} width={2} height={8} fill="#3a2818" />
              <circle cx={0} cy={-10} r={6} fill="#1e3a24" />
              <circle cx={-2} cy={-11} r={3.5} fill="#274a2e" />
              <circle cx={2} cy={-9} r={3} fill="#183020" />
            </g>
          )}
          {rA >= 0.7 && rA < 0.85 && (
            <g transform={`translate(${(rB - 0.5) * 24}, ${TH / 2 + 4})`}>
              <ellipse cx={0} cy={1} rx={7} ry={1.2} fill="#000" opacity="0.4" />
              <rect x={-6} y={-3} width={12} height={1.5} fill="#5a4530" />
              <rect x={-6} y={-6} width={12} height={1} fill="#5a4530" />
              <rect x={-6} y={-3} width={1} height={3} fill="#3a2818" />
              <rect x={5} y={-3} width={1} height={3} fill="#3a2818" />
            </g>
          )}
        </>
      )}

      {kind === "road" && (
        <>
          <line
            x1={-TW / 4}
            y1={TH / 2}
            x2={TW / 4}
            y2={TH / 2}
            stroke="#3a3a48"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          {!(gx === CENTER && gy === CENTER) && rA < 0.55 && (
            <g transform={`translate(${gx === CENTER ? -TW / 2 + 5 : 0}, ${gy === CENTER ? TH / 2 : -2})`}>

              <line x1={0} y1={0} x2={0} y2={-14} stroke="#4a4a55" strokeWidth="1" />
              <line x1={0} y1={-14} x2={4} y2={-14} stroke="#4a4a55" strokeWidth="1" />
              <circle cx={4} cy={-13} r={1.6} fill="#fde68a" opacity="0.95">
                {animate && (
                  <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
                )}
              </circle>
              <ellipse cx={4} cy={2} rx={10} ry={4} fill="#fde68a" opacity="0.08" />
            </g>
          )}
          {rB < 0.3 && (
            <g transform={`translate(${(rC - 0.5) * 16}, ${TH / 2 + 2})`}>
              <ellipse cx={0} cy={3} rx={9} ry={1.5} fill="#000" opacity="0.55" />
              <rect x={-7} y={-2} width={14} height={4} rx={1} fill={rA < 0.5 ? "#3a1f22" : "#1f2a3a"} />
              <rect x={-5} y={-4} width={9} height={2.5} rx={1} fill={rA < 0.5 ? "#5a2f32" : "#2f3a4a"} />
              <rect x={-4} y={-3} width={3} height={1.5} fill="#a0d8ff" opacity="0.5" />
              <circle cx={-5} cy={2} r={1} fill="#111" />
              <circle cx={5} cy={2} r={1} fill="#111" />
            </g>
          )}
        </>
      )}

      {kind === "plaza" && (
        <>
          <circle cx={0} cy={TH / 2} r={12} fill="#1f1a12" stroke="#5a4a2a" strokeWidth="1" />
          <circle cx={0} cy={TH / 2} r={7} fill="#3a2e1a" stroke="#5a4a2a" strokeWidth="0.6" />
          <circle cx={0} cy={TH / 2} r={3.5} fill="#fcd34d" opacity="0.6" />
          <circle cx={0} cy={TH / 2 - 4} r={1.2} fill="#fde68a">
            {animate && (
              <>
                <animate attributeName="cy" values={`${TH / 2 - 4};${TH / 2 - 8};${TH / 2 - 4}`} dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.4s" repeatCount="indefinite" />
              </>
            )}
          </circle>
        </>
      )}
    </g>
  );
}
const GroundTile = React.memo(GroundTileImpl);

/* The whole ground plane — 81 tiles — only changes when the fx budget or the
   player's rank changes. Memoized so hover, flash, clock ticks and brick
   updates never touch a few hundred SVG nodes. */
const GroundLayer = React.memo(function GroundLayer({
  cells,
  reducedMotion,
  lowFx,
}: {
  cells: { gx: number; gy: number }[];
  reducedMotion: boolean;
  lowFx: boolean;
}) {
  return (
    <g shapeRendering="optimizeSpeed">
      {cells.map(({ gx, gy }) => (
        <GroundTile key={`t-${gx}-${gy}`} gx={gx} gy={gy} reducedMotion={reducedMotion} lowFx={lowFx} />
      ))}
    </g>
  );
});




/* ── building block ──────────────────────────────────────── */
const Building = React.memo(function Building({
  def,
  level,
  reducedMotion,
  affordable = false,
}: {
  def: BuildingDef;
  level: number;
  reducedMotion: boolean;
  affordable?: boolean;
}) {
  if (level === 0) return <EmptyLot crane={affordable} reducedMotion={reducedMotion} />;
  const palette = PALETTE[def.district];
  // Height per level: base 22 + 14 per additional level
  const height = 22 + level * 14;
  const halfW = TW / 2 - 6;
  const halfD = TH / 2 - 3;
  const top = -height;

  // Face polygons
  const leftFace = `0,${top} ${-halfW},${top + halfD} ${-halfW},${halfD} 0,0`;
  const rightFace = `0,${top} ${halfW},${top + halfD} ${halfW},${halfD} 0,0`;
  const roof = `0,${top} ${halfW},${top + halfD} 0,${top + 2 * halfD} ${-halfW},${top + halfD}`;

  // Windows: rows of two per face, starts halfway up
  const rows = Math.min(level, 4);
  const windows: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const wy = top + halfD + 6 + r * 12;
    if (wy > halfD - 6) break;
    for (let c = 0; c < 2; c++) {
      const off = -halfW + 8 + c * 14;
      // left face windows (mirrored)
      windows.push(
        <rect
          key={`l-${r}-${c}`}
          x={off}
          y={wy}
          width={5}
          height={6}
          fill={palette.window}
          opacity={0.75}
          className={reducedMotion ? undefined : "milv-window"}
          style={{ animationDelay: `${(r + c) * 0.35}s` }}
        />,
      );
      // right face windows
      windows.push(
        <rect
          key={`r-${r}-${c}`}
          x={halfW - 8 - c * 14 - 5}
          y={wy}
          width={5}
          height={6}
          fill={palette.window}
          opacity={0.6}
          className={reducedMotion ? undefined : "milv-window"}
          style={{ animationDelay: `${(r + c) * 0.5 + 0.1}s` }}
        />,
      );
    }
  }

  // Rooftop clutter unlocked by level: AC unit, water tank, satellite dish
  const clutter: React.ReactNode[] = [];
  if (level >= 2) {
    // AC unit on left of roof
    clutter.push(
      <g key="ac" transform={`translate(${-halfW / 2}, ${top + halfD - 2})`}>
        <rect x={-4} y={-3} width={8} height={4} fill="#2a2a30" stroke={palette.accent} strokeOpacity="0.3" strokeWidth="0.3" />
        <line x1={-3} y1={-2} x2={3} y2={-2} stroke="#4a4a55" strokeWidth="0.4" />
        <line x1={-3} y1={-1} x2={3} y2={-1} stroke="#4a4a55" strokeWidth="0.4" />
      </g>,
    );
  }
  if (level >= 3) {
    // Water tank on the right of roof
    clutter.push(
      <g key="tank" transform={`translate(${halfW / 2}, ${top + halfD - 4})`}>
        <rect x={-2} y={-2} width={4} height={2} fill="#3a2818" />
        <ellipse cx={0} cy={-2} rx={3} ry={1.2} fill="#5a4025" />
        <ellipse cx={0} cy={-6} rx={3} ry={1.2} fill="#8a5a35" />
        <rect x={-3} y={-6} width={6} height={4} fill="#7a4a30" />
      </g>,
    );
  }
  if (level >= 4) {
    // Satellite dish
    clutter.push(
      <g key="dish" transform={`translate(0, ${top + halfD - 1})`}>
        <line x1={0} y1={0} x2={0} y2={-5} stroke="#4a4a55" strokeWidth="0.6" />
        <ellipse cx={0} cy={-6} rx={4} ry={1.5} fill="#d6d3d1" opacity="0.85" />
        <line x1={0} y1={-6} x2={2} y2={-8} stroke="#4a4a55" strokeWidth="0.5" />
        <circle cx={2} cy={-8} r={0.6} fill={palette.accent} />
      </g>,
    );
  }

  return (
    <g>
      {/* ground shadow */}
      <ellipse cx={0} cy={halfD + 2} rx={halfW + 2} ry={halfD / 2} fill="#000" opacity="0.6" />
      {/* concrete plinth / foundation base — small slab under building */}
      <polygon
        points={`0,-3 ${halfW + 2},${-3 + halfD} 0,${-3 + 2 * halfD} ${-(halfW + 2)},${-3 + halfD}`}
        fill="#0f0d14"
        stroke="#2a2432"
        strokeWidth="0.4"
      />
      {/* body */}
      <polygon points={leftFace} fill={palette.left} />
      <polygon points={rightFace} fill={palette.right} />
      <polygon points={roof} fill={palette.top} stroke={palette.accent} strokeOpacity="0.4" strokeWidth="0.6" />
      {/* vertical seam highlight — pillar edge */}
      <line x1={0} y1={top} x2={0} y2={0} stroke={palette.accent} strokeOpacity="0.25" strokeWidth="0.5" />
      {windows}
      {/* Neon sign strip on right face at Lv3+ */}
      {level >= 3 && (
        <g>
          <rect
            x={2}
            y={top + halfD + 2}
            width={halfW - 6}
            height={5}
            fill="#000"
            opacity="0.6"
          />
          <rect
            x={2.5}
            y={top + halfD + 2.5}
            width={halfW - 7}
            height={4}
            fill={palette.accent}
            opacity="0.55"
            className={reducedMotion ? undefined : "milv-window"}
            filter="url(#glow-soft)"
          />
        </g>
      )}
      {clutter}
      <RoofDetail
        id={def.id}
        level={level}
        top={top}
        halfW={halfW}
        halfD={halfD}
        accent={palette.accent}
        reducedMotion={reducedMotion}
      />
    </g>
  );
});

const EmptyLot = React.memo(function EmptyLot({ crane = false, reducedMotion = false }: { crane?: boolean; reducedMotion?: boolean }) {
  const halfW = TW / 2 - 10;
  const halfD = TH / 2 - 4;
  return (
    <g>
      {/* dashed plot outline */}
      <polygon
        points={`0,${-6} ${halfW},${-6 + halfD} 0,${-6 + 2 * halfD} ${-halfW},${-6 + halfD}`}
        fill="none"
        stroke={crane ? "#fde047" : "#8a6a2a"}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity={crane ? 0.95 : 0.7}
      />
      {!crane && (
        <text x={0} y={halfD - 1} textAnchor="middle" fontSize="14" fill="#a97a2a" opacity="0.9" style={{ fontFamily: "monospace" }}>
          +
        </text>
      )}
      {/* CONSTRUCTION CRANE — anticipation cue when affordable */}
      {crane && (
        <g transform={`translate(${-halfW / 2}, ${halfD - 4})`}>
          {/* base */}
          <rect x={-2} y={-4} width={4} height={4} fill="#3a2818" />
          {/* mast */}
          <line x1={0} y1={-4} x2={0} y2={-26} stroke="#c9a84c" strokeWidth="1.2" />
          {/* jib (horizontal arm) */}
          <line x1={-8} y1={-26} x2={18} y2={-26} stroke="#c9a84c" strokeWidth="1" />
          {/* counter-jib rail */}
          <line x1={-8} y1={-24} x2={0} y2={-26} stroke="#c9a84c" strokeWidth="0.6" opacity="0.7" />
          <line x1={18} y1={-24} x2={0} y2={-26} stroke="#c9a84c" strokeWidth="0.6" opacity="0.7" />
          {/* hook + cable */}
          <line x1={14} y1={-26} x2={14} y2={-14} stroke="#c9a84c" strokeWidth="0.5" opacity="0.8">
            {!reducedMotion && (
              <animate attributeName="y2" values="-14;-8;-14" dur="3.5s" repeatCount="indefinite" />
            )}
          </line>
          <rect x={13} y={-16} width={2} height={2} fill="#fde047">
            {!reducedMotion && (
              <animate attributeName="y" values="-16;-10;-16" dur="3.5s" repeatCount="indefinite" />
            )}
          </rect>
          {/* warning beacon on mast top */}
          <circle cx={0} cy={-27} r={1} fill="#f43f5e">
            {!reducedMotion && (
              <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
            )}
          </circle>
          {/* small ground pallet with materials */}
          <rect x={-6} y={-1} width={10} height={2} fill="#3a2818" />
          <rect x={-5} y={-2} width={3} height={1} fill="#c9a84c" opacity="0.7" />
          <rect x={-1} y={-2} width={3} height={1} fill="#c9a84c" opacity="0.5" />
        </g>
      )}
    </g>
  );
});

/* ── STATS HUD helpers ───────────────────────────────────── */
function StatChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-sm border border-amber-400/20 bg-black/40 px-2 py-1.5 flex items-center justify-between gap-2 min-w-0">
      <span className="stencil tracking-widest text-amber-300/70 shrink-0">{label}</span>
      <span
        className="font-mono tabular-nums text-[13px] leading-none truncate transition-all duration-500"
        style={{ color: accent, textShadow: `0 0 8px ${accent}55` }}
      >
        {value}
      </span>
    </div>
  );
}

function StatBar({ label, value, accent, suffix = "" }: { label: string; value: number; accent: string; suffix?: string }) {
  return (
    <div className="rounded-sm border border-amber-400/20 bg-black/40 px-2 py-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="stencil tracking-widest text-amber-300/70">{label}</span>
        <span
          className="font-mono tabular-nums text-[11px] leading-none transition-all duration-500"
          style={{ color: accent, textShadow: `0 0 6px ${accent}55` }}
        >
          {value}{suffix}
        </span>
      </div>
      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: `linear-gradient(90deg, ${accent}55, ${accent})`,
            boxShadow: `0 0 6px ${accent}88`,
          }}
        />
      </div>
    </div>
  );
}


/* ── per-building roof details unlocked by level ─────────── */
const RoofDetail = React.memo(function RoofDetail({
  id,
  level,
  top,
  halfW,
  accent,
  reducedMotion,
}: {
  id: BuildingId;
  level: number;
  top: number;
  halfW: number;
  halfD: number;
  accent: string;
  reducedMotion: boolean;
}) {
  const beacon = (
    <circle
      cx={0}
      cy={top - 3}
      r={2.2}
      fill={accent}
      className={reducedMotion ? undefined : "milv-beacon"}
    />
  );
  switch (id) {
    case "outpost":
      // Small chimney + level ≥ 2 beacon
      return (
        <>
          <rect x={-4} y={top - 8} width={8} height={8} fill="#2a2018" />
          {level >= 2 && beacon}
        </>
      );
    case "library":
      // Triangular pediment always; columns hint at Lv3+
      return (
        <>
          <polygon
            points={`${-halfW + 2},${top} 0,${top - 10} ${halfW - 2},${top}`}
            fill="#1f3446"
            stroke={accent}
            strokeOpacity="0.5"
          />
          {level >= 3 &&
            [-10, 0, 10].map((cx) => (
              <rect key={cx} x={cx - 1.5} y={top + 4} width={3} height={14} fill={accent} opacity="0.4" />
            ))}
        </>
      );
    case "school":
      // Bell tower + cross at Lv3+
      return (
        <>
          <rect x={-5} y={top - 12} width={10} height={12} fill="#152535" />
          <rect x={-6} y={top - 14} width={12} height={2} fill={accent} opacity="0.6" />
          {level >= 3 && (
            <>
              <rect x={-0.75} y={top - 22} width={1.5} height={10} fill={accent} />
              <rect x={-3} y={top - 19} width={6} height={1.5} fill={accent} />
            </>
          )}
        </>
      );
    case "newsroom":
      // Chimney + smoke ribbon at Lv3+
      return (
        <>
          <rect x={halfW - 12} y={top - 10} width={5} height={10} fill="#22100d" />
          {level >= 3 && (
            <path
              d={`M${halfW - 9.5},${top - 10} q -3 -6 2 -12 q 5 -6 -2 -12`}
              stroke="#a19387"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
              className={reducedMotion ? undefined : "milv-smoke"}
            />
          )}
        </>
      );
    case "signal_tower": {
      // Tall antenna spike + pulsing tip
      const tipY = top - 24 - level * 4;
      return (
        <>
          <line x1={0} y1={top} x2={0} y2={tipY} stroke={accent} strokeWidth="1.5" />
          <line x1={-6} y1={top - 4} x2={6} y2={top - 4} stroke={accent} strokeWidth="0.8" opacity="0.7" />
          <line x1={-4} y1={top - 10} x2={4} y2={top - 10} stroke={accent} strokeWidth="0.8" opacity="0.7" />
          <circle
            cx={0}
            cy={tipY}
            r={2.5}
            fill={accent}
            className={reducedMotion ? undefined : "milv-beacon"}
          />
        </>
      );
    }
    case "archive":
      // Sloped warehouse roof, vents at Lv3+
      return (
        <>
          <polygon
            points={`${-halfW},${top} ${halfW},${top} ${halfW - 6},${top - 8} ${-halfW + 6},${top - 8}`}
            fill="#221909"
            stroke={accent}
            strokeOpacity="0.4"
          />
          {level >= 3 &&
            [-6, 0, 6].map((cx) => (
              <rect key={cx} x={cx - 1} y={top - 12} width={2} height={4} fill={accent} opacity="0.5" />
            ))}
        </>
      );
    case "clean_room":
      // White dome
      return (
        <>
          <ellipse cx={0} cy={top} rx={halfW - 4} ry={8} fill="#0d221f" stroke={accent} strokeOpacity="0.5" />
          <ellipse
            cx={0}
            cy={top - 3}
            rx={halfW - 8}
            ry={5}
            fill="#183633"
            stroke={accent}
            strokeOpacity="0.4"
          />
          {level >= 2 && <circle cx={0} cy={top - 6} r={1.8} fill={accent} className={reducedMotion ? undefined : "milv-beacon"} />}
        </>
      );
    case "watchtower": {
      // Spire + rotating searchlight cone at Lv2+
      const spireTip = top - 20 - level * 3;
      return (
        <>
          <polygon
            points={`${-6},${top} 6,${top} 0,${spireTip}`}
            fill="#181128"
            stroke={accent}
            strokeOpacity="0.6"
          />
          {level >= 2 && (
            <g className={reducedMotion ? undefined : "milv-searchlight"} style={{ transformOrigin: `0px ${spireTip}px` }}>
              <polygon
                points={`0,${spireTip} 30,${spireTip - 6} 30,${spireTip + 6}`}
                fill={accent}
                opacity="0.18"
              />
            </g>
          )}
          <circle cx={0} cy={spireTip} r={1.8} fill={accent} className={reducedMotion ? undefined : "milv-beacon"} />
        </>
      );
    }
  }
});

/* Perk unlock thresholds per building — module-level constant. */
const PERK_REQ: Record<BuildingId, number> = {
  outpost: 3, library: 5, school: 5, newsroom: 5,
  signal_tower: 5, archive: 5, clean_room: 3, watchtower: 3,
};

/* ── light model ─────────────────────────────────────────────
   Smooth tint interpolation across the day instead of hard hour
   buckets. Keyed on fractional hour, so dusk actually creeps in. */
type Rgba = [number, number, number, number];
const LIGHT_KEYS: { h: number; c: Rgba }[] = [
  { h: 0,    c: [15, 10, 30, 0.30] },
  { h: 5,    c: [22, 16, 44, 0.30] },
  { h: 6.5,  c: [214, 118, 58, 0.16] },
  { h: 9,    c: [168, 150, 150, 0.08] },
  { h: 13,   c: [120, 140, 180, 0.05] },
  { h: 17,   c: [206, 132, 74, 0.11] },
  { h: 18.5, c: [224, 88, 58, 0.18] },
  { h: 20.5, c: [40, 22, 60, 0.26] },
  { h: 24,   c: [15, 10, 30, 0.30] },
];
function lightTint(h: number): string {
  let a = LIGHT_KEYS[0], b = LIGHT_KEYS[LIGHT_KEYS.length - 1];
  for (let i = 0; i < LIGHT_KEYS.length - 1; i++) {
    if (h >= LIGHT_KEYS[i].h && h <= LIGHT_KEYS[i + 1].h) {
      a = LIGHT_KEYS[i];
      b = LIGHT_KEYS[i + 1];
      break;
    }
  }
  const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
  const v = (i: number) => a.c[i] + (b.c[i] - a.c[i]) * t;
  return `rgba(${Math.round(v(0))},${Math.round(v(1))},${Math.round(v(2))},${v(3).toFixed(3)})`;
}



/** Camera pad button — 36px hit area, thumb-safe. */
function CamBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-amber-400/40 bg-black/70 font-mono text-sm leading-none text-amber-200/90 transition-colors hover:bg-amber-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
    >
      {children}
    </button>
  );
}

/* Weak hardware detection — cheap, synchronous, run once. Phones with few
   cores or little RAM get the same city with a smaller motion budget. */
function detectLowFx() {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.visualQuality === "lite") return true;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  return cores <= 4 || mem <= 4 || window.innerWidth < 640;
}

/* ── main component ──────────────────────────────────────── */
export function CityIsometric() {
  const [lowFx, setLowFx] = useState(false);
  const [save, setSave] = useState<CitySave | null>(null);

  const [open, setOpen] = useState<BuildingId | null>(null);
  const [hoverId, setHoverId] = useState<BuildingId | null>(null);
  const [flashId, setFlashId] = useState<BuildingId | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [clock, setClock] = useState(() => new Date(0));
  // Immersive mode — the board goes fullscreen and the city fills the glass.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [immersed, setImmersed] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setImmersed(!!document.fullscreenElement && document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── CAMERA ── drag to pan, wheel/buttons to zoom, arrows to walk the city.
  // Imperative on purpose: panning writes the SVG viewBox directly inside a
  // rAF instead of re-rendering the whole city every pointermove.
  const camRef = useRef({ x: 0, y: 0, z: 1.7 });
  const dragRef = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomLabelRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef(0);

  const clampCam = (c: { x: number; y: number; z: number }) => {
    const z = Math.min(3, Math.max(0.6, c.z));
    const span = 1600 / z;
    return { z, x: Math.min(span, Math.max(-span, c.x)), y: Math.min(span, Math.max(-span, c.y)) };
  };

  const applyCam = useCallback(() => {
    rafRef.current = 0;
    const svg = svgRef.current;
    if (!svg) return;
    const c = camRef.current;
    const bw = TW * (GRID + 1);
    const bh = TH * (GRID + 3);
    const vw = bw / c.z;
    const vh = (bh + 60) / c.z;
    const cyy = -140 + (bh + 60) / 2 + c.y;
    svg.setAttribute("viewBox", `${c.x - vw / 2} ${cyy - vh / 2} ${vw} ${vh}`);
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round((c.z / 1.7) * 100)}%`;
  }, []);

  const scheduleCam = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(applyCam);
  }, [applyCam]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const setCamTo = useCallback(
    (next: { x: number; y: number; z: number }) => {
      camRef.current = clampCam(next);
      scheduleCam();
    },
    [scheduleCam],
  );

  const nudge = useCallback((dx: number, dy: number) => {
    const c = camRef.current;
    setCamTo({ ...c, x: c.x + dx / c.z, y: c.y + dy / c.z });
  }, [setCamTo]);
  const zoomBy = useCallback((f: number) => {
    const c = camRef.current;
    setCamTo({ ...c, z: c.z * f });
  }, [setCamTo]);
  const resetCam = useCallback(() => setCamTo({ x: 0, y: 0, z: 1.7 }), [setCamTo]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // No pointer capture yet — capturing here would retarget the click and
    // stop plots from opening. We only capture once a real drag starts.
    const c = camRef.current;
    dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: c.x, oy: c.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const c = camRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    // px → viewBox units, so the ground sticks to the finger.
    const scale = (TW * (GRID + 1) / c.z) / Math.max(1, rect.width);
    const dx = (e.clientX - d.sx) * scale;
    const dy = (e.clientY - d.sy) * scale;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) {
      d.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (d.moved) setCamTo({ ...c, x: d.ox - dx, y: d.oy - dy });
  };
  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setDragging(false);
    if (d.moved) {
      // Swallow the click that follows a pan so we don't open a plot card.
      const swallow = (ev: Event) => ev.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, true), 60);
    }
    if (d.moved) e.currentTarget.releasePointerCapture?.(d.id);
  };

  // Non-passive wheel zoom — React's onWheel is passive, so preventDefault needs this.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);


  const onBoardKeyDown = (e: React.KeyboardEvent) => {
    const step = 90;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    const m = map[e.key];
    if (m) { e.preventDefault(); nudge(m[0], m[1]); return; }
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.15); }
    if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(1 / 1.15); }
    if (e.key === "0") { e.preventDefault(); resetCam(); }
  };

  const toggleImmerse = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else setImmersed((v) => !v); // iOS Safari has no element fullscreen — fake it.
    } catch {
      setImmersed((v) => !v);
    }
  }, []);
  // Perf: everything ambient stops when the board is offscreen or the tab is hidden.
  const { ref: boardRef, active } = useOnScreen<HTMLElement>("300px");

  // SMIL keeps ticking even when the board scrolls away — stop the clock.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (active) svg.unpauseAnimations();
    else svg.pauseAnimations();
  }, [active, save]);

  useEffect(() => {
    setSave(loadCity());
    setLowFx(detectLowFx());
    if (typeof window !== "undefined" && window.matchMedia) {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }


    const refresh = () => setSave(loadCity());
    const onBuilt = (e: Event) => {
      refresh();
      const d = (e as CustomEvent<{ id: BuildingId }>).detail;
      if (d?.id) {
        setFlashId(d.id);
        window.setTimeout(() => setFlashId(null), 1400);
      }
    };
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ id: BuildingId }>).detail;
      if (d?.id) setOpen(d.id);
    };
    window.addEventListener("milverse:city", refresh);
    window.addEventListener("milverse:city:built", onBuilt);
    window.addEventListener("milverse:bricks", refresh);
    window.addEventListener("milverse:city:open", onOpen);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:city:built", onBuilt);
      window.removeEventListener("milverse:bricks", refresh);
      window.removeEventListener("milverse:city:open", onOpen);
    };
  }, []);


  // Clock only ticks while the board is actually being looked at.
  useEffect(() => {
    if (!active) return;
    setClock(new Date());
    const tick = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, [active]);

  const cells = useMemo(() => {
    const list: { gx: number; gy: number }[] = [];
    for (let gy = 0; gy < GRID; gy++)
      for (let gx = 0; gx < GRID; gx++) list.push({ gx, gy });
    // paint order: top-back to bottom-front (increasing gx+gy)
    list.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
    return list;
  }, []);

  const buildingCells = useMemo(() => {
    return (Object.entries(PLACEMENT) as [BuildingId, Cell][]).map(([id, cell]) => ({
      id,
      gx: cell[0],
      gy: cell[1],
      def: BUILDINGS_BY_ID[id],
    }));
  }, []);

  // Back-to-front paint order, computed once instead of a find() per tile.
  const orderedBuildings = useMemo(
    () => [...buildingCells].sort((a, b) => a.gx + a.gy - (b.gx + b.gy)),
    [buildingCells],
  );



  // Derived stats/affordability/perks — memoized on save so flashId re-renders stay cheap.
  const derived = useMemo(() => {
    if (!save) return null;
    const hint = nextAfford(save);
    const built = plotsBuilt(save);
    const step = titleFor(save).step;
    const nextRank = nextTitle(save);
    const target = hint?.cost ?? 1;
    const filled = hint ? Math.max(0, Math.min(1, (target - hint.remaining) / target)) : 1;

    const perkOnline = new Set<BuildingId>(
      (Object.keys(PERK_REQ) as BuildingId[]).filter((id) => levelOf(save, id) >= PERK_REQ[id]),
    );

    const totalLevels = BUILDINGS.reduce((s, b) => s + levelOf(save, b.id), 0);
    const population = Math.round(totalLevels * 128 + built * 42);
    const power = Math.min(100, totalLevels * 6 + built * 3);
    const safety = Math.min(100, levelOf(save, "outpost") * 20 + levelOf(save, "watchtower") * 12 + built * 4);
    const literacy = Math.min(100, levelOf(save, "library") * 18 + levelOf(save, "school") * 22 + levelOf(save, "archive") * 8);

    const affordableIds = new Set<BuildingId>();
    for (const b of BUILDINGS) {
      const lvl = levelOf(save, b.id);
      if (lvl === 0 && !buildingLock(b.id, step).locked) {
        const c = nextCost(b.id, 0);
        if (c !== null && save.bricks >= c) affordableIds.add(b.id);
      }
    }
    return { hint, built, filled, perkOnline, population, power, safety, literacy, affordableIds, step, nextRank };
  }, [save]);

  if (!save || !derived) return null;
  const { hint, built, filled, perkOnline, population, power, safety, literacy, affordableIds, step, nextRank } = derived;
  const sealedZones = ZONES.filter((z) => z.step > step);

  // Smooth day/night light model — fractional hour drives tint and the sun/moon arc.
  const hFrac = clock.getHours() + clock.getMinutes() / 60;
  
  const isDay = hFrac >= 6 && hFrac < 18.5;
  // 0 at rise, 1 at set — for both the sun and the moon.
  const arcT = isDay
    ? (hFrac - 6) / 12.5
    : ((hFrac < 6 ? hFrac + 24 : hFrac) - 18.5) / 11.5;
  const tint = lightTint(hFrac);


  const bounds = { w: TW * (GRID + 1), h: TH * (GRID + 3) };
  // Initial framing only — live pan/zoom mutates the attribute imperatively.
  const c0 = camRef.current;
  const vbW = bounds.w / c0.z;
  const vbH = (bounds.h + 60) / c0.z;
  const cy = -140 + (bounds.h + 60) / 2 + c0.y;
  const viewBox = `${c0.x - vbW / 2} ${cy - vbH / 2} ${vbW} ${vbH}`;



  return (
    <section
      ref={boardRef}
      aria-labelledby="city-iso-heading"
      className={`mx-auto max-w-6xl mt-8 px-4 sm:px-6${active ? "" : " milv-idle"}`}
    >
      {/* Header */}
      <div className="border-b border-amber-400/20 pb-3 mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="stencil text-[10px] text-amber-300/80 tracking-widest">
            YOUR CITY · PLOTS {built}/{BUILDINGS.length}
          </div>
          <h2
            id="city-iso-heading"
            className="mt-0.5 text-2xl sm:text-3xl font-black text-amber-100 leading-none"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            THE CITY
          </h2>
          <p className="mt-1 text-[11px] text-amber-200/60 italic">
            Tap a plot to build. Every case earns the bricks.
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="stencil rounded-sm border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] tracking-widest text-amber-200">
              {titleFor(save).rank}
            </span>
            {sealedZones.length > 0 ? (
              <span className="font-mono text-[10px] text-red-200/70">
                {sealedZones.length} district{sealedZones.length > 1 ? "s" : ""} sealed
                {nextRank
                  ? ` · ${nextRank.rank} needs ${nextRank.plotsNeeded} more plot${nextRank.plotsNeeded === 1 ? "" : "s"}`
                  : ""}
              </span>
            ) : (
              <span className="font-mono text-[10px] text-emerald-300/80">
                CITY FULLY ZONED
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <button
            type="button"
            onClick={toggleImmerse}
            className="mb-1 inline-flex min-h-[32px] items-center gap-1.5 rounded-sm border border-amber-400/40 bg-amber-400/5 px-2.5 py-1 stencil text-[9px] tracking-widest text-amber-200/90 transition-colors hover:bg-amber-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            aria-pressed={immersed}
          >
            {immersed ? "EXIT" : "IMMERSE"}
          </button>
          <div className="stencil text-[9px] text-amber-300/70 tracking-widest">BRICKS</div>
          <div className="font-mono text-2xl text-amber-200 tabular-nums leading-none">
            {save.bricks}
          </div>
          {hint && (
            <div
              className={`mt-0.5 font-mono text-[10px] ${
                hint.remaining === 0 ? "text-emerald-300" : "text-amber-200/60"
              }`}
            >
              {hint.remaining === 0 ? "READY TO BUILD" : `${hint.remaining} to next`}
            </div>
          )}
        </div>
      </div>

      {hint && (
        <div className="mb-2 h-1 w-full rounded-sm bg-amber-400/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              hint.remaining === 0
                ? "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                : "bg-amber-300 shadow-[0_0_6px_rgba(253,224,71,0.6)]"
            }`}
            style={{ width: `${filled * 100}%` }}
          />
        </div>
      )}

      {/* ── LIVE CITY STATS HUD ── */}
      <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
        <StatChip label="POPULATION" value={population.toLocaleString()} accent="#fde68a" />
        <StatBar   label="POWER"      value={power}    accent="#22d3ee" suffix="%" />
        <StatBar   label="SAFETY"     value={safety}   accent="#f97316" suffix="%" />
        <StatBar   label="LITERACY"   value={literacy} accent="#a7f3d0" suffix="%" />
      </div>

      {/* Isometric board */}
      <div
        ref={stageRef}
        className={`relative border border-amber-400/20 bg-gradient-to-b from-[#050307] via-[#0a0812] to-[#0e0916] overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] ${
          immersed
            ? "milv-immersed fixed inset-0 z-[90] rounded-none flex items-center justify-center"
            : "rounded-sm"
        }`}
      >
        {immersed && (
          <button
            type="button"
            onClick={toggleImmerse}
            className="absolute right-3 top-3 z-20 inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-sm border border-amber-400/40 bg-black/70 px-3 stencil text-[10px] tracking-widest text-amber-200 hover:bg-amber-400/20"
          >
            EXIT
          </button>
        )}
        {/* ── camera controls ── */}
        <div className="absolute left-3 bottom-3 z-20 flex items-end gap-2">
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            <span />
            <CamBtn label="Pan up" onClick={() => nudge(0, -90)}>↑</CamBtn>
            <span />
            <CamBtn label="Pan left" onClick={() => nudge(-90, 0)}>←</CamBtn>
            <CamBtn label="Center the city" onClick={resetCam}>⌖</CamBtn>
            <CamBtn label="Pan right" onClick={() => nudge(90, 0)}>→</CamBtn>
            <span />
            <CamBtn label="Pan down" onClick={() => nudge(0, 90)}>↓</CamBtn>
            <span />
          </div>
          <div className="flex flex-col gap-1">
            <CamBtn label="Zoom in" onClick={() => zoomBy(1.2)}>+</CamBtn>
            <CamBtn label="Zoom out" onClick={() => zoomBy(1 / 1.2)}>−</CamBtn>
          </div>
        </div>
        <ThreatSiren active={active} />
        <PayrollTill active={active} />

        <div className="absolute right-3 bottom-3 z-20 stencil text-[9px] tracking-widest text-amber-200/50 pointer-events-none">
          DRAG TO PAN · SCROLL TO ZOOM · <span ref={zoomLabelRef}>100%</span>
        </div>

        {/* subtle grid vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        {/* time-of-day tint */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: tint }}
        />
        <CinematicLayer
          active={active}
          immersed={immersed}
          reducedMotion={reducedMotion}
          lowFx={lowFx}
          title="TRUTH CITY"
          subtitle="SECTOR ONLINE"
        />


        <svg
          ref={svgRef}
          viewBox={viewBox}
          className={`block w-full h-auto touch-none select-none ${active ? "milv-establish" : ""} ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ maxHeight: immersed ? "100vh" : 520 }}
          role="img"
          aria-label="Your city — isometric view. Drag to pan, arrow keys to move, plus and minus to zoom."
          tabIndex={0}
          onKeyDown={onBoardKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <defs>
            <filter id="glow-soft">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* wet-asphalt highlight — pale sheen across each road tile */}
            <linearGradient id="road-sheen" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#a0d8ff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#a0d8ff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#a0d8ff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="fountain-water" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0" stopColor="#67e8f9" stopOpacity="0.55" />
              <stop offset="1" stopColor="#0d2a33" stopOpacity="0" />
            </radialGradient>
          </defs>


          {/* ── SKY BACKDROP: sun/moon by hour + skyline + drifting clouds ── */}
          <g aria-hidden="true">
            {/* SUN by day, MOON by night — both ride a real arc across the sky */}
            {(() => {
              const t = Math.max(0, Math.min(1, arcT));
              const cx = -bounds.w / 2 + 50 + t * (bounds.w - 100);
              const cy = -58 - Math.sin(Math.PI * t) * 78;
              const low = Math.sin(Math.PI * t); // 0 at horizon, 1 at zenith
              return isDay ? (
                <g>
                  <circle cx={cx} cy={cy} r={26} fill="#fde68a" opacity={0.10 + low * 0.10} />
                  <circle cx={cx} cy={cy} r={15} fill="#fef3c7" opacity="0.32" />
                  <circle cx={cx} cy={cy} r={9} fill={low < 0.35 ? "#fbbf24" : "#fde68a"} opacity="0.95" />
                </g>
              ) : (
                <g>
                  <circle cx={cx} cy={cy} r={20} fill="#cbd5f5" opacity={0.06 + low * 0.06} />
                  <circle cx={cx} cy={cy} r={12} fill="#f5e6c4" opacity="0.9" />
                  <circle cx={cx + 4} cy={cy - 4} r={12} fill="#0a0812" />
                </g>
              );
            })()}
            {/* stars — fade out around the edges of night */}
            {!isDay && (() => {
              const night = Math.min(1, Math.max(0, 1 - Math.abs(arcT - 0.5) * 1.6));
              return Array.from({ length: lowFx ? 8 : 18 }).map((_, i) => {
                const sx = -bounds.w / 2 + hashCell(i, 0, 5) * bounds.w;
                const sy = -130 + hashCell(0, i, 5) * 40;
                return (
                  <circle
                    key={i}
                    cx={sx}
                    cy={sy}
                    r={hashCell(i, i, 9) * 0.9 + 0.2}
                    fill="#fef3c7"
                    opacity={(0.3 + hashCell(i, 1, 9) * 0.6) * (0.35 + night * 0.65)}
                  >
                    {!reducedMotion && (
                      <animate
                        attributeName="opacity"
                        values={`${0.2 + hashCell(i, 2, 9) * 0.3};${0.7 + hashCell(i, 3, 9) * 0.3};${0.2 + hashCell(i, 2, 9) * 0.3}`}
                        dur={`${3 + hashCell(i, 4, 9) * 5}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                );
              });
            })()}

            {/* far skyline — hand-composed rectangles, low-contrast */}
...
            {/* horizon haze */}
            <rect x={-bounds.w / 2} y={-70} width={bounds.w} height={80} fill="url(#horizon-haze)" opacity="0.4" />
            {/* DRIFTING CLOUDS — two soft banks that cross the sky */}
            {!reducedMotion && (
              <g opacity={isDay ? 0.45 : 0.22}>
                <g>
                  <ellipse cx={0} cy={-90} rx={26} ry={5} fill="#d6c8e8" />
                  <ellipse cx={14} cy={-93} rx={16} ry={4} fill="#e6dcf0" />
                  <ellipse cx={-12} cy={-92} rx={14} ry={3.5} fill="#c8b8dc" />
                  <animateTransform attributeName="transform" type="translate" from={`${-bounds.w / 2 - 60} 0`} to={`${bounds.w / 2 + 60} 0`} dur="70s" repeatCount="indefinite" />
                </g>
                <g>
                  <ellipse cx={0} cy={-115} rx={20} ry={4} fill="#b8a8cc" />
                  <ellipse cx={-10} cy={-117} rx={12} ry={3} fill="#c8b8dc" />
                  <animateTransform attributeName="transform" type="translate" from={`${bounds.w / 2 + 40} 0`} to={`${-bounds.w / 2 - 40} 0`} dur="95s" repeatCount="indefinite" />
                </g>
              </g>
            )}
          </g>
          <defs>
            <linearGradient id="horizon-haze" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#3a2a4a" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* ground tiles */}
          <GroundLayer cells={cells} reducedMotion={reducedMotion} lowFx={lowFx} />


          {/* ── SEALED GROUND — districts you haven't earned yet ── */}
          <defs>
            <pattern id="milv-seal-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="6" height="6" fill="#05040a" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#f43f5e" strokeWidth="0.7" opacity="0.35" />
            </pattern>
          </defs>
          {cells
            .filter(({ gx, gy }) => cellLocked(gx, gy, step))
            .map(({ gx, gy }) => {
              const { x, y } = iso(gx, gy);
              const pts = `0,0 ${TW / 2},${TH / 2} 0,${TH} ${-TW / 2},${TH / 2}`;
              return (
                <g key={`seal-${gx}-${gy}`} transform={`translate(${x},${y})`} aria-hidden="true">
                  <polygon points={pts} fill="#04030a" opacity="0.9" />
                  <polygon points={pts} fill="url(#milv-seal-hatch)" opacity="0.55" />
                  <polygon points={pts} fill="none" stroke="#f43f5e" strokeWidth="0.4" opacity="0.28" />
                </g>
              );
            })}
          {/* district seal plates */}
          {ZONES.filter((z) => z.step > step).map((z) => {
            const mid = z.cells[Math.floor(z.cells.length / 2)];
            const { x, y } = iso(mid[0], mid[1]);
            return (
              <g key={`zseal-${z.id}`} transform={`translate(${x - 46},${y - 4})`} aria-hidden="true">
                <rect x={-52} y={-9} width={104} height={18} rx={2} fill="#0a0509" opacity="0.9" stroke="#f43f5e" strokeOpacity="0.4" strokeWidth="0.5" />
                <text x={0} y={-1} textAnchor="middle" fontSize={SIGN_SIZE.title} fill={INK.sealed} style={SIGN_TITLE}>
                  {z.name} · SEALED
                </text>
                <text x={0} y={6.5} textAnchor="middle" fontSize={SIGN_SIZE.meta} fill={INK.sealedMeta} opacity="0.8" style={SIGN_META}>
                  OPENS AT {["CONSTABLE","INSPECTOR","CHIEF","COMMISSIONER","MAYOR","GOVERNOR"][z.step]}
                </text>
              </g>
            );
          })}

          {/* ── PLAZA FOUNTAIN — the centre of town, with water that moves ── */}
          {(() => {
            const p = iso(CENTER, CENTER);
            const cy = p.y + TH / 2;
            return (
              <g aria-hidden="true" transform={`translate(${p.x},${cy})`}>
                {/* basin */}
                <ellipse cx={0} cy={0} rx={17} ry={8.5} fill="#1b1720" stroke="#4a4256" strokeWidth="0.7" />
                <ellipse cx={0} cy={-0.8} rx={13} ry={6.4} fill="#0d2a33" />
                <ellipse cx={0} cy={-0.8} rx={13} ry={6.4} fill="url(#fountain-water)" opacity="0.75" />
                {/* plinth + spout */}
                <rect x={-2} y={-11} width={4} height={10} rx={1} fill="#3a3444" />
                <ellipse cx={0} cy={-11.5} rx={4} ry={2} fill="#4a4256" />
                <circle cx={0} cy={-13} r={1.6} fill="#67e8f9" opacity="0.85" filter="url(#glow-soft)" />
                {!reducedMotion && (
                  <>
                    {/* jets */}
                    {[-1, 1].map((dir, i) => (
                      <circle key={i} cx={0} cy={-13} r={0.8} fill="#a5f3fc" opacity="0.9">
                        <animate attributeName="cy" values="-13;-19;-2" dur="1.9s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                        <animate attributeName="cx" values={`0;${dir * 4};${dir * 7}`} dur="1.9s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.95;0.7;0" dur="1.9s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                      </circle>
                    ))}
                    {/* ripples */}
                    {[0, 1].map((i) => (
                      <ellipse key={i} cx={0} cy={-0.8} rx={3} ry={1.5} fill="none" stroke="#67e8f9" strokeWidth="0.5" opacity="0.7">
                        <animate attributeName="rx" values="3;12.5" dur="3.2s" begin={`${i * 1.6}s`} repeatCount="indefinite" />
                        <animate attributeName="ry" values="1.5;6.2" dur="3.2s" begin={`${i * 1.6}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0" dur="3.2s" begin={`${i * 1.6}s`} repeatCount="indefinite" />
                      </ellipse>
                    ))}
                  </>
                )}
              </g>
            );
          })()}


          {/* ── MOVING TRAFFIC — two cars sliding along the two roads ── */}
          {!reducedMotion && !lowFx && (() => {
            // Horizontal avenue: gy=CENTER, gx sweeps the full board
            const startH = iso(0, CENTER);
            const endH = iso(GRID - 1, CENTER);
            // Vertical avenue: gx=CENTER, gy sweeps the full board
            const startV = iso(CENTER, 0);
            const endV = iso(CENTER, GRID - 1);

            return (
              <g aria-hidden="true">
                <g>
                  <ellipse cx={0} cy={TH / 2 + 3} rx={6} ry={1.2} fill="#000" opacity="0.5" />
                  <rect x={-5} y={-2} width={10} height={3.5} rx={1} fill="#3a1f22" />
                  <rect x={-4} y={-3.5} width={7} height={2} rx={0.6} fill="#5a2f32" />
                  <circle cx={4} cy={0} r={0.9} fill="#fef3c7" opacity="0.9" />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`${startH.x},${startH.y + TH / 2};${endH.x},${endH.y + TH / 2};${startH.x},${startH.y + TH / 2}`}
                    dur="14s"
                    repeatCount="indefinite"
                  />
                </g>
                <g>
                  <ellipse cx={0} cy={TH / 2 + 3} rx={6} ry={1.2} fill="#000" opacity="0.5" />
                  <rect x={-5} y={-2} width={10} height={3.5} rx={1} fill="#1f2a3a" />
                  <rect x={-4} y={-3.5} width={7} height={2} rx={0.6} fill="#2f3a4a" />
                  <circle cx={-4} cy={0} r={0.9} fill="#f43f5e" opacity="0.9" />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`${endV.x},${endV.y + TH / 2};${startV.x},${startV.y + TH / 2};${endV.x},${endV.y + TH / 2}`}
                    dur="17s"
                    repeatCount="indefinite"
                  />
                </g>
                {/* BUS — bigger, more windows, slower, opposite direction on horizontal road */}
                <g>
                  <ellipse cx={0} cy={TH / 2 + 3} rx={11} ry={1.4} fill="#000" opacity="0.55" />
                  <rect x={-10} y={-4} width={20} height={5} rx={1.2} fill="#c9a84c" />
                  <rect x={-10} y={-4} width={20} height={1.2} fill="#8a7030" />
                  {/* window row */}
                  {[-7, -3.5, 0, 3.5, 7].map((wx, i) => (
                    <rect key={i} x={wx - 1.2} y={-3} width={2.4} height={2} fill="#a0d8ff" opacity="0.75" />
                  ))}
                  {/* door split line */}
                  <line x1={-4} y1={-4} x2={-4} y2={1} stroke="#8a7030" strokeWidth="0.4" />
                  <circle cx={-8} cy={1.5} r={1.1} fill="#111" />
                  <circle cx={8} cy={1.5} r={1.1} fill="#111" />
                  {/* headlight */}
                  <circle cx={-10.5} cy={-1.5} r={0.8} fill="#fef3c7" opacity="0.95" />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`${endH.x},${endH.y + TH / 2};${startH.x},${startH.y + TH / 2};${endH.x},${endH.y + TH / 2}`}
                    dur="22s"
                    repeatCount="indefinite"
                  />
                </g>
              </g>
            );
          })()}


          {/* ── PEDESTRIANS — deterministic figures pacing the plaza ── */}
          {!reducedMotion && !lowFx && (() => {
            const plaza = iso(CENTER, CENTER);
            const walkers = [
              { r: 18, dur: 24, phase: 0,   color: "#fde68a" },
              { r: 14, dur: 19, phase: 90,  color: "#a7f3d0" },
              { r: 22, dur: 31, phase: 180, color: "#fda4af" },
              { r: 10, dur: 15, phase: 270, color: "#c4b5fd" },
            ];
            return (
              <g aria-hidden="true" transform={`translate(${plaza.x},${plaza.y + TH / 2})`}>
                {walkers.map((w, i) => (
                  <g key={i}>
                    <g>
                      {/* shadow + tiny figure */}
                      <ellipse cx={0} cy={2} rx={1.6} ry={0.6} fill="#000" opacity="0.55" />
                      <rect x={-0.7} y={-4} width={1.4} height={4} fill={w.color} opacity="0.9" />
                      <circle cx={0} cy={-5} r={0.9} fill="#f5e6c4" />
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`${w.phase} 0 0`}
                        to={`${w.phase + 360} 0 0`}
                        dur={`${w.dur}s`}
                        repeatCount="indefinite"
                        additive="sum"
                      />
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values={`${w.r},0`}
                        additive="sum"
                      />
                    </g>
                  </g>
                ))}
              </g>
            );
          })()}

          {/* ── MONSOON — subtle rain streaks in Jul/Aug only (LTE dev override via ?rain=1) ── */}
          {!reducedMotion && active && (() => {
            const m = new Date().getMonth();
            const forced = typeof window !== "undefined" && window.location.search.includes("rain=1");
            const monsoon = m === 6 || m === 7 || forced;
            if (!monsoon) return null;
            return (
              <g aria-hidden="true" opacity="0.55">
                {Array.from({ length: lowFx ? 10 : 24 }).map((_, i) => {
                  const x = -bounds.w / 2 + hashCell(i, 3, 11) * bounds.w;
                  const dur = 0.7 + hashCell(i, 5, 11) * 0.6;
                  const delay = hashCell(i, 7, 11) * 1.2;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={-140}
                      x2={x - 4}
                      y2={-100}
                      stroke="#a0d8ff"
                      strokeWidth="0.5"
                      opacity="0.75"
                    >
                      <animate
                        attributeName="y1"
                        values="-140;220"
                        dur={`${dur}s`}
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="y2"
                        values="-100;260"
                        dur={`${dur}s`}
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                      />
                    </line>
                  );
                })}
              </g>
            );
          })()}

          {/* buildings (already in back-to-front order because their cells are sorted with the tiles) */}
          {orderedBuildings
            .map((b) => {
              const bc = b;
              const lvl = levelOf(save, bc.id);
              const { x, y } = iso(bc.gx, bc.gy);
              const cost = nextCost(bc.id, lvl);
              const canAfford = cost !== null && save.bricks >= cost;
              const maxed = isMaxed(bc.id, lvl);
              const lock = buildingLock(bc.id, step);
              const flash = flashId === bc.id;
              return (
                <g
                  key={bc.id}
                  transform={`translate(${x},${y})`}
                  onClick={() => setOpen(bc.id)}
                  onMouseEnter={() => setHoverId(bc.id)}
                  onMouseLeave={() => setHoverId((h) => (h === bc.id ? null : h))}
                  onFocus={() => setHoverId(bc.id)}
                  onBlur={() => setHoverId((h) => (h === bc.id ? null : h))}
                  className="cursor-pointer milv-tile-hover"
                  role="button"
                  aria-label={
                    lock.locked
                      ? `${bc.def.name} — sealed, opens at ${lock.needRank}`
                      : `${bc.def.name} — Lv${lvl}${cost !== null ? `, next ${cost} bricks` : ", maxed"}`
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpen(bc.id);
                    }
                  }}
                >

                  {lock.locked ? (
                    <g aria-hidden="true">
                      {/* fenced-off lot with a padlock */}
                      <ellipse cx={0} cy={TH / 2} rx={26} ry={13} fill="#000" opacity="0.5" />
                      <polygon
                        points={`0,${-4} ${TW / 2 - 12},${TH / 2 - 6} 0,${TH - 8} ${-(TW / 2 - 12)},${TH / 2 - 6}`}
                        fill="#0b0810"
                        stroke="#f43f5e"
                        strokeOpacity="0.45"
                        strokeWidth="0.7"
                        strokeDasharray="3 2"
                      />
                      {[-18, -9, 0, 9, 18].map((fx) => (
                        <line key={fx} x1={fx} y1={TH / 2 - 10} x2={fx} y2={TH / 2 - 18} stroke="#5b4a52" strokeWidth="0.8" />
                      ))}
                      <g transform={`translate(0,${-14})`}>
                        <rect x={-5} y={-3} width={10} height={8} rx={1.5} fill="#2a1c22" stroke="#f43f5e" strokeOpacity="0.7" strokeWidth="0.7" />
                        <path d="M -2.6 -3 v -2.4 a 2.6 2.6 0 0 1 5.2 0 v 2.4" fill="none" stroke="#f43f5e" strokeOpacity="0.7" strokeWidth="0.9" />
                        <circle cx={0} cy={1} r={1} fill="#fda4af" />
                      </g>
                    </g>
                  ) : (
                    <Building def={bc.def} level={lvl} reducedMotion={reducedMotion} affordable={affordableIds.has(bc.id)} />
                  )}
                  {/* label plate */}
                  <g transform={`translate(0, ${TH / 2 + 6})`}>
                    <rect
                      x={-32}
                      y={-1}
                      width={64}
                      height={12}
                      rx={2}
                      fill="#000"
                      opacity={0.55}
                    />
                    <text
                      x={0}
                      y={8}
                      textAnchor="middle"
                      fontSize={SIGN_SIZE.title}
                      fill={lock.locked ? INK.sealed : maxed ? INK.done : canAfford ? INK.live : INK.idle}
                      style={SIGN_TITLE}
                    >
                      {lock.locked ? `SEALED · ${lock.needRank}` : bc.def.name.toUpperCase()}
                    </text>
                  </g>
                  {/* affordability marker */}
                  {canAfford && !maxed && !lock.locked && (
                    <circle
                      cx={0}
                      cy={-6 - (22 + lvl * 14)}
                      r={3}
                      fill={INK.ready}
                      className="milv-beacon"
                      filter="url(#glow-soft)"
                    />
                  )}
                  {/* level chip */}
                  <g transform={`translate(0, ${TH / 2 + 20})`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fontSize={SIGN_SIZE.meta}
                      fill={maxed ? INK.doneMeta : canAfford ? INK.live : INK.meta}
                      style={SIGN_META}
                    >
                      {maxed
                        ? "MAX LEVEL"
                        : lvl === 0
                          ? `${cost}◼`
                          : `LV ${lvl}/${bc.def.maxLevel} · ${cost}◼`}
                    </text>
                  </g>
                  {flash && (
                    <g aria-hidden="true">
                      <circle
                        cx={0}
                        cy={-8}
                        r={40}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="1.5"
                        className="milv-flash-ring"
                      />
                      <circle
                        cx={0}
                        cy={-8}
                        r={26}
                        fill="none"
                        stroke="#fde68a"
                        strokeWidth="0.8"
                        className="milv-flash-ring milv-flash-ring--late"
                      />
                      {/* sparks — deterministic fan, dust settling back onto the plot */}
                      {!reducedMotion &&
                        Array.from({ length: 10 }).map((_, i) => {
                          const a = (i / 10) * Math.PI * 2;
                          const d = 22 + hashCell(i, lvl, 13) * 16;
                          return (
                            <circle key={i} cx={0} cy={-10} r={1.2} fill={i % 2 ? "#fde68a" : "#6ee7b7"}>
                              <animate attributeName="cx" values={`0;${(Math.cos(a) * d).toFixed(1)}`} dur="0.9s" fill="freeze" />
                              <animate attributeName="cy" values={`-10;${(-10 + Math.sin(a) * d * 0.5).toFixed(1)}`} dur="0.9s" fill="freeze" />
                              <animate attributeName="opacity" values="1;0" dur="0.9s" fill="freeze" />
                            </circle>
                          );
                        })}
                    </g>
                  )}

                  {/* PERK ONLINE badge — glowing emerald star above building */}
                  {perkOnline.has(bc.id) && (
                    <g transform={`translate(${TW / 2 - 14}, ${-6 - (22 + lvl * 14) - 4})`}>
                      <circle cx={0} cy={0} r={6} fill="#022c22" stroke="#34d399" strokeWidth="0.8" filter="url(#glow-soft)" />
                      <text x={0} y={2.5} textAnchor="middle" fontSize={SIGN_SIZE.metaLg} fill={INK.doneMeta} style={{ ...SIGN_META, fontWeight: 700 }}>
                        ★
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* ── PLOT TOOLTIP — reads on hover and on keyboard focus ── */}
          {hoverId && (() => {
            const b = buildingCells.find((x) => x.id === hoverId);
            if (!b) return null;
            const lvl = levelOf(save, hoverId);
            const cost = nextCost(hoverId, lvl);
            const maxed = isMaxed(hoverId, lvl);
            const p = iso(b.gx, b.gy);
            const rows = [
              maxed ? "MAX LEVEL" : lvl === 0 ? `BREAK GROUND · ${cost}◼` : `LV ${lvl}/${b.def.maxLevel} · NEXT ${cost}◼`,
              perkOnline.has(hoverId) ? "PERK ONLINE" : `PERK AT LV ${PERK_REQ[hoverId]}`,
            ];
            const w = 116;
            const h = 40;
            const tx = Math.max(-bounds.w / 2 + 6, Math.min(bounds.w / 2 - w - 6, p.x - w / 2));
            const ty = p.y - 48 - lvl * 14;
            return (
              <g aria-hidden="true" pointerEvents="none" className="milv-tip" transform={`translate(${tx},${ty})`}>
                <rect x={0} y={0} width={w} height={h} rx={3} fill="#08060c" opacity="0.94" stroke="#f59e0b" strokeWidth="0.6" />
                <rect x={0} y={0} width={w} height={1.4} fill="#f59e0b" opacity="0.7" />
                <text x={7} y={14} fontSize={SIGN_SIZE.titleLg} fill={INK.live} style={SIGN_TITLE}>
                  {b.def.name.toUpperCase()}
                </text>
                {rows.map((r, i) => (
                  <text key={i} x={7} y={25 + i * 10} fontSize={SIGN_SIZE.metaLg} fill={i === 1 && perkOnline.has(hoverId) ? INK.doneMeta : INK.meta} style={SIGN_META}>
                    {r}
                  </text>
                ))}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ambient CSS — window flicker, beacon, smoke, searchlight, flash ring */}
      <style>{`
        @keyframes milv-window-flicker { 0%,100% { opacity: 0.75 } 50% { opacity: 0.35 } }
        .milv-window { animation: milv-window-flicker 3.5s ease-in-out infinite; }
        @keyframes milv-beacon-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
        .milv-beacon { animation: milv-beacon-pulse 1.6s ease-in-out infinite; }
        @keyframes milv-smoke-drift { 0% { opacity: 0.7 } 50% { opacity: 0.3 } 100% { opacity: 0.7 } }
        .milv-smoke { animation: milv-smoke-drift 5s ease-in-out infinite; }
        @keyframes milv-searchlight-sweep { 0% { transform: rotate(-25deg) } 50% { transform: rotate(25deg) } 100% { transform: rotate(-25deg) } }
        .milv-searchlight { animation: milv-searchlight-sweep 6s ease-in-out infinite; transform-box: fill-box; }
        @keyframes milv-flash-ring { 0% { opacity: 1; r: 10 } 100% { opacity: 0; r: 60 } }
        .milv-flash-ring { animation: milv-flash-ring 1.2s ease-out forwards; }
        .milv-flash-ring--late { animation-duration: 0.85s; animation-delay: 0.15s; }
        .milv-tile-hover { transition: filter 180ms ease; }
        .milv-tile-hover:hover, .milv-tile-hover:focus-visible { filter: brightness(1.25) drop-shadow(0 0 6px rgba(253,224,71,0.35)); outline: none; }
        @keyframes milv-tip-in { from { opacity: 0 } to { opacity: 1 } }
        .milv-tip { animation: milv-tip-in 140ms ease-out both; }
        .milv-idle .milv-window, .milv-idle .milv-beacon, .milv-idle .milv-smoke,
        .milv-idle .milv-searchlight { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) {
          .milv-window, .milv-beacon, .milv-smoke, .milv-searchlight, .milv-tip { animation: none !important; }
        }
      `}</style>


      <BuildingCard open={!!open} onClose={() => setOpen(null)} buildingId={open} />
    </section>
  );
}

// MILVERSE — Your City · isometric render (Pass 1 · SimCity pass).
// Pure SVG. 5×5 diamond grid, 8 plots + central plaza + road cross.
// Buildings grow with level: taller silhouettes, more window rows, roof
// detail unlocks at Lv3 (antennae, domes, spires, searchlights).
// Interaction: tap a tile → BuildingCard bottom sheet.
// Perf: rows memoized; ambient window flicker gated on reduced-motion.

import React, { useEffect, useMemo, useState } from "react";
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

/* ── geometry ────────────────────────────────────────────── */
const TW = 96; // tile width
const TH = 48; // tile height (2:1 iso)
const GRID = 5;
type Cell = [number, number];
const PLACEMENT: Record<BuildingId, Cell> = {
  signal_tower: [0, 0],
  outpost: [2, 0],
  archive: [4, 0],
  library: [0, 2],
  school: [4, 2],
  clean_room: [0, 4],
  newsroom: [2, 4],
  watchtower: [4, 4],
};
const iso = (gx: number, gy: number) => ({
  x: ((gx - gy) * TW) / 2,
  y: ((gx + gy) * TH) / 2,
});

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
  if (gx === 2 && gy === 2) return "plaza";
  if (gx === 2 || gy === 2) return "road";
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
  Object.values({
    signal_tower: [0, 0], outpost: [2, 0], archive: [4, 0],
    library: [0, 2], school: [4, 2],
    clean_room: [0, 4], newsroom: [2, 4], watchtower: [4, 4],
  }).map(([a, b]) => `${a}-${b}`),
);

function GroundTile({ gx, gy }: { gx: number; gy: number }) {
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

  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="0.5" />

      {/* SIDEWALK inset ring on grass tiles that hold buildings */}
      {kind === "grass" && hasBuilding && (
        <polygon
          points={`0,4 ${TW / 2 - 4},${TH / 2} 0,${TH - 4} ${-(TW / 2 - 4)},${TH / 2}`}
          fill="#2a2530"
          stroke="#3a3444"
          strokeWidth="0.4"
        />
      )}

      {/* GRASS TEXTURE — scatter tiny specks and one shrub / tree if empty */}
      {kind === "grass" && !hasBuilding && (
        <>
          {/* speck texture */}
          {[0, 1, 2, 3, 4].map((i) => {
            const rx = hashCell(gx, gy, 10 + i);
            const ry = hashCell(gx, gy, 20 + i);
            const px = -TW / 2 + 8 + rx * (TW - 16);
            const py = 6 + ry * (TH - 12);
            return (
              <circle key={i} cx={px} cy={py} r={0.6} fill="#2a2036" opacity="0.6" />
            );
          })}
          {/* tree — chosen for ~40% of empty grass */}
          {rA < 0.4 && (
            <g transform={`translate(${(rB - 0.5) * 20}, ${(rC - 0.5) * 10 + TH / 2})`}>
              <ellipse cx={0} cy={2} rx={5} ry={1.5} fill="#000" opacity="0.5" />
              <rect x={-1} y={-8} width={2} height={8} fill="#3a2818" />
              <circle cx={0} cy={-10} r={6} fill="#1e3a24" />
              <circle cx={-2} cy={-11} r={3.5} fill="#274a2e" />
              <circle cx={2} cy={-9} r={3} fill="#183020" />
            </g>
          )}
          {/* park bench occasionally */}
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

      {/* ROAD detail */}
      {kind === "road" && (
        <>
          {/* centreline */}
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
          {/* Streetlamp on corners of road (not center row/col intersection) */}
          {(gx === 2 ? gy !== 2 : true) && (gy === 2 ? gx !== 2 : true) && rA < 0.55 && (
            <g transform={`translate(${gx === 2 ? -TW / 2 + 5 : 0}, ${gy === 2 ? TH / 2 : -2})`}>
              <line x1={0} y1={0} x2={0} y2={-14} stroke="#4a4a55" strokeWidth="1" />
              <line x1={0} y1={-14} x2={4} y2={-14} stroke="#4a4a55" strokeWidth="1" />
              <circle cx={4} cy={-13} r={1.6} fill="#fde68a" opacity="0.95">
                <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
              </circle>
              {/* light pool */}
              <ellipse cx={4} cy={2} rx={10} ry={4} fill="#fde68a" opacity="0.08" />
            </g>
          )}
          {/* parked car occasionally */}
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

      {/* PLAZA fountain */}
      {kind === "plaza" && (
        <>
          <circle cx={0} cy={TH / 2} r={12} fill="#1f1a12" stroke="#5a4a2a" strokeWidth="1" />
          <circle cx={0} cy={TH / 2} r={7} fill="#3a2e1a" stroke="#5a4a2a" strokeWidth="0.6" />
          <circle cx={0} cy={TH / 2} r={3.5} fill="#fcd34d" opacity="0.6" />
          <circle cx={0} cy={TH / 2 - 4} r={1.2} fill="#fde68a">
            <animate attributeName="cy" values={`${TH / 2 - 4};${TH / 2 - 8};${TH / 2 - 4}`} dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </g>
  );
}


/* ── building block ──────────────────────────────────────── */
function Building({
  def,
  level,
  reducedMotion,
}: {
  def: BuildingDef;
  level: number;
  reducedMotion: boolean;
}) {
  if (level === 0) return <EmptyLot />;
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
}

function EmptyLot() {
  const halfW = TW / 2 - 10;
  const halfD = TH / 2 - 4;
  return (
    <g>
      <polygon
        points={`0,${-6} ${halfW},${-6 + halfD} 0,${-6 + 2 * halfD} ${-halfW},${-6 + halfD}`}
        fill="none"
        stroke="#8a6a2a"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.7"
      />
      <text
        x={0}
        y={halfD - 1}
        textAnchor="middle"
        fontSize="14"
        fill="#a97a2a"
        opacity="0.9"
        style={{ fontFamily: "monospace" }}
      >
        +
      </text>
    </g>
  );
}

/* ── per-building roof details unlocked by level ─────────── */
function RoofDetail({
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
}

/* ── main component ──────────────────────────────────────── */
export function CityIsometric() {
  const [save, setSave] = useState<CitySave | null>(null);
  const [open, setOpen] = useState<BuildingId | null>(null);
  const [flashId, setFlashId] = useState<BuildingId | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setSave(loadCity());
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
    window.addEventListener("milverse:city", refresh);
    window.addEventListener("milverse:city:built", onBuilt);
    window.addEventListener("milverse:bricks", refresh);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:city:built", onBuilt);
      window.removeEventListener("milverse:bricks", refresh);
    };
  }, []);

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

  if (!save) return null;
  const hint = nextAfford(save);
  const built = plotsBuilt(save);
  const target = hint?.cost ?? 1;
  const filled = hint ? Math.max(0, Math.min(1, (target - hint.remaining) / target)) : 1;

  // viewBox — encompass full 5×5 iso grid comfortably
  const bounds = { w: TW * (GRID + 1), h: TH * (GRID + 3) };
  const viewBox = `${-bounds.w / 2} ${-140} ${bounds.w} ${bounds.h + 60}`;

  return (
    <section
      aria-labelledby="city-iso-heading"
      className="mx-auto max-w-6xl mt-8 px-4 sm:px-6"
    >
      {/* Header */}
      <div className="border-b border-amber-400/30 pb-3 mb-3 flex items-end justify-between gap-3">
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
        </div>
        <div className="text-right shrink-0">
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
        <div className="mb-3 h-1 w-full rounded-sm bg-amber-400/10 overflow-hidden">
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

      {/* Isometric board */}
      <div className="relative rounded-md border border-amber-400/25 bg-gradient-to-b from-[#050307] via-[#0a0812] to-[#0e0916] overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
        {/* subtle grid vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        <svg
          viewBox={viewBox}
          className="block w-full h-auto"
          style={{ maxHeight: 520 }}
          role="img"
          aria-label="Your city — isometric view of all plots"
        >
          <defs>
            <filter id="glow-soft">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ground tiles */}
          {cells.map(({ gx, gy }) => (
            <GroundTile key={`t-${gx}-${gy}`} gx={gx} gy={gy} />
          ))}

          {/* buildings (already in back-to-front order because their cells are sorted with the tiles) */}
          {cells
            .map(({ gx, gy }) => buildingCells.find((b) => b.gx === gx && b.gy === gy))
            .filter(Boolean)
            .map((b) => {
              const bc = b!;
              const lvl = levelOf(save, bc.id);
              const { x, y } = iso(bc.gx, bc.gy);
              const cost = nextCost(bc.id, lvl);
              const canAfford = cost !== null && save.bricks >= cost;
              const maxed = isMaxed(bc.id, lvl);
              const flash = flashId === bc.id;
              return (
                <g
                  key={bc.id}
                  transform={`translate(${x},${y})`}
                  onClick={() => setOpen(bc.id)}
                  className="cursor-pointer milv-tile-hover"
                  role="button"
                  aria-label={`${bc.def.name} — Lv${lvl}${cost !== null ? `, next ${cost} bricks` : ", maxed"}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpen(bc.id);
                    }
                  }}
                >
                  <Building def={bc.def} level={lvl} reducedMotion={reducedMotion} />
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
                      fontSize="7.5"
                      fill={maxed ? "#a7f3d0" : canAfford ? "#fde68a" : "#d6d3d1"}
                      style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        letterSpacing: "1px",
                      }}
                    >
                      {bc.def.name.toUpperCase()}
                    </text>
                  </g>
                  {/* affordability marker */}
                  {canAfford && !maxed && (
                    <circle
                      cx={0}
                      cy={-6 - (22 + lvl * 14)}
                      r={3}
                      fill="#fde047"
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
                      fontSize="6"
                      fill="#78716c"
                      style={{ fontFamily: "monospace" }}
                    >
                      {maxed
                        ? "MAX"
                        : lvl === 0
                          ? `${cost}◼`
                          : `Lv${lvl}/${bc.def.maxLevel} · ${cost}◼`}
                    </text>
                  </g>
                  {flash && (
                    <circle
                      cx={0}
                      cy={-8}
                      r={40}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.5"
                      className="milv-flash-ring"
                    />
                  )}
                </g>
              );
            })}
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
        .milv-tile-hover:hover { filter: brightness(1.25); }
      `}</style>

      <BuildingCard open={!!open} onClose={() => setOpen(null)} buildingId={open} />
    </section>
  );
}

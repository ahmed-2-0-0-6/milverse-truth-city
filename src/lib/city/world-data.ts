// MILVERSE — spatial layout for the pannable city world.
// Positions are in world coordinates (WORLD_W × WORLD_H, logical px).
// Data-only module — no React, no side effects.

import { SCENARIOS, type Scenario } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS, type FeedScenario } from "@/lib/feed/scenarios";

export const WORLD_W = 3000;
export const WORLD_H = 2000;

export const MIRROR_COLOR = "#22d3ee"; // cyan
export const FEED_COLOR = "#f5b942";   // amber

export type LineId = "mirror" | "feed";

export interface StationBase {
  x: number;
  y: number;
  code: string;
  tier: number;
  line: LineId;
}
export interface MirrorStation extends StationBase { line: "mirror"; scenario: Scenario; }
export interface FeedStation extends StationBase { line: "feed"; scenario: FeedScenario; }
export type Station = MirrorStation | FeedStation;

/** Path along which stations are laid — Mirror quarter (upper-left). */
function mirrorAt(i: number, n: number) {
  // vertical serpentine down the left/upper quarter
  const t = i / Math.max(1, n - 1);
  const y = 260 + t * 1400;
  const x = 480 + Math.sin(t * Math.PI * 2.4) * 260;
  return { x, y };
}
/** Path along Feed quarter (upper-right). */
function feedAt(i: number, n: number) {
  const t = i / Math.max(1, n - 1);
  const y = 260 + t * 1400;
  const x = 2520 + Math.sin(t * Math.PI * 2.4 + 1.2) * 260;
  return { x, y };
}

export function buildMirrorStations(): MirrorStation[] {
  const officials = SCENARIOS.filter((s) => s.source !== "user_designed");
  const sorted = [...officials].sort((a, b) => a.tier - b.tier);
  return sorted.map((s, i) => {
    const tierPos = sorted.slice(0, i + 1).filter((x) => x.tier === s.tier).length;
    const { x, y } = mirrorAt(i, sorted.length);
    return { line: "mirror" as const, scenario: s, tier: s.tier, code: `M${s.tier}-${tierPos}`, x, y };
  });
}

export function buildFeedStations(): FeedStation[] {
  const sorted = [...FEED_SCENARIOS].sort((a, b) => a.tier - b.tier);
  return sorted.map((s, i) => {
    const tierPos = sorted.slice(0, i + 1).filter((x) => x.tier === s.tier).length;
    const { x, y } = feedAt(i, sorted.length);
    return { line: "feed" as const, scenario: s, tier: s.tier, code: `F${s.tier}-${tierPos}`, x, y };
  });
}

/** Smooth Catmull-Rom path through points. */
export function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  const d: string[] = [`M${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
  }
  return d.join(" ");
}

/* ── Landmarks (world positions) ─────────────────────────────── */
export interface Landmark {
  id: "mirror-tower" | "feed-antenna" | "city-hall" | "studio" | "archive" | "market" | "arena";
  label: string;
  x: number; y: number;
  kind: "hub" | "landmark" | "scaffold";
  district?: LineId;
  to?: string;
}
export const LANDMARKS: Landmark[] = [
  { id: "mirror-tower", label: "MIRROR TOWER", x: 480, y: 200, kind: "hub", district: "mirror" },
  { id: "feed-antenna", label: "FEED SIGNAL", x: 2520, y: 200, kind: "hub", district: "feed" },
  { id: "city-hall",   label: "CITY HALL",     x: 1500, y: 1050, kind: "landmark", to: "/city-hall" },
  { id: "studio",      label: "THE STUDIO",    x: 1180, y: 1700, kind: "landmark", to: "/studio" },
  { id: "archive",     label: "THE ARCHIVE",   x: 1820, y: 1700, kind: "landmark", to: "/archive" },
  { id: "market",      label: "THE MARKET",    x: 420,  y: 1820, kind: "scaffold", to: "/market" },
  { id: "arena",       label: "THE ARENA",     x: 2580, y: 1820, kind: "scaffold", to: "/arena" },
];

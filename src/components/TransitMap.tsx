// MILVERSE — Transit City Map (presentation layer).
// Two glowing metro lines (Mirror / Feed), landmark stations, and
// under-construction blueprint zones. Framer Motion + SVG only.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard, Library, Landmark, Compass, Play, X, Star } from "lucide-react";
import { SCENARIOS, type Scenario, type TierId } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS, type FeedScenario, type FeedTier } from "@/lib/feed/scenarios";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { getMirrorRecommendations } from "@/lib/recommendations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/* ── layout constants ─────────────────────────────────────────── */
const VB_W = 400;
const STATION_STEP = 78;
const TOP_PAD = 120;
const BOTTOM_PAD = 120;

const MIRROR_MID = 90;
const MIRROR_AMP = 42;
const FEED_MID = 310;
const FEED_AMP = 42;

const MIRROR_COLOR = "#22d3ee"; // cyan
const FEED_COLOR = "#f5b942";   // amber

/* ── types ───────────────────────────────────────────────────── */
type LineId = "mirror" | "feed";
interface StationBase {
  x: number;
  y: number;
  code: string;
  tier: number;
  line: LineId;
}
interface MirrorStation extends StationBase { line: "mirror"; scenario: Scenario; }
interface FeedStation extends StationBase { line: "feed"; scenario: FeedScenario; }
type Station = MirrorStation | FeedStation;

/* ── build ordered station lists ─────────────────────────────── */
function buildMirrorStations(): MirrorStation[] {
  const officials = SCENARIOS.filter((s) => s.source !== "user_designed");
  const sorted = [...officials].sort((a, b) => a.tier - b.tier);
  return sorted.map((s, i) => {
    // group index within same tier for prettier codes M{tier}-{n}
    const tierPos = sorted.slice(0, i + 1).filter((x) => x.tier === s.tier).length;
    return {
      line: "mirror",
      scenario: s,
      tier: s.tier,
      code: `M${s.tier}-${tierPos}`,
      x: MIRROR_MID + Math.sin(i * 0.9) * MIRROR_AMP,
      y: TOP_PAD + i * STATION_STEP,
    };
  });
}

function buildFeedStations(): FeedStation[] {
  const sorted = [...FEED_SCENARIOS].sort((a, b) => a.tier - b.tier);
  return sorted.map((s, i) => {
    const tierPos = sorted.slice(0, i + 1).filter((x) => x.tier === s.tier).length;
    return {
      line: "feed",
      scenario: s,
      tier: s.tier,
      code: `F${s.tier}-${tierPos}`,
      x: FEED_MID + Math.sin(i * 0.9 + 1.4) * FEED_AMP,
      y: TOP_PAD + i * STATION_STEP,
    };
  });
}

/* ── smooth path helper (Catmull-Rom → Bezier) ───────────────── */
function smoothPath(points: { x: number; y: number }[]): string {
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

/* ── verdict stamp helper ────────────────────────────────────── */
function verdictStamp(s: Station, played: Set<string>, profile: TrustProfile | null): "correct" | "missed" | "false" | "lucky" | null {
  if (!profile || !played.has(s.scenario.id)) return null;
  const h = profile.history.filter((x) => x.caseId === s.scenario.id).pop();
  if (!h) return "correct";
  if (h.result === "correct") return "correct";
  if (h.result === "missed_scam") return "missed";
  if (h.result === "false_alarm") return "false";
  return "lucky";
}

/* ══════════════════════════════════════════════════════════════ */
export function TransitMap() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [selected, setSelected] = useState<Station | null>(null);
  const [scaffoldOpen, setScaffoldOpen] = useState<"market" | "arena" | null>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const mirror = useMemo(buildMirrorStations, []);
  const feed = useMemo(buildFeedStations, []);
  const totalHeight = TOP_PAD + Math.max(mirror.length, feed.length) * STATION_STEP + BOTTOM_PAD;

  const played = useMemo(() => {
    const s = new Set<string>();
    profile?.history.forEach((h) => s.add(h.caseId));
    return s;
  }, [profile]);

  const mirrorDone = mirror.filter((s) => played.has(s.scenario.id)).length;
  const feedDone = feed.filter((s) => played.has(s.scenario.id)).length;
  const mirrorCurrentIdx = Math.min(mirror.length - 1, mirrorDone);
  const feedCurrentIdx = Math.min(feed.length - 1, feedDone);
  const mirrorCurrent = mirror[mirrorCurrentIdx];
  const feedCurrent = feed[feedCurrentIdx];

  // Recommended (beacon) case ids
  const recIds = useMemo(() => {
    const recs = getMirrorRecommendations(profile);
    return new Set(recs.map((r) => r.scenario.id));
  }, [profile]);

  const mirrorPath = useMemo(() => smoothPath(mirror), [mirror]);
  const feedPath = useMemo(() => smoothPath(feed), [feed]);

  // progress fractions for line-draw
  const mirrorProgress = mirror.length > 0 ? (mirrorCurrentIdx + 0.5) / mirror.length : 0;
  const feedProgress = feed.length > 0 ? (feedCurrentIdx + 0.5) / feed.length : 0;

  // auto-scroll to current station on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const y = Math.max(mirrorCurrent?.y ?? 0, feedCurrent?.y ?? 0);
    if (!y) return;
    const wrap = svgWrapRef.current;
    if (!wrap) return;
    const scale = wrap.getBoundingClientRect().width / VB_W;
    const target = (y * scale) - window.innerHeight * 0.4;
    const doScroll = () => window.scrollTo({ top: Math.max(0, wrap.offsetTop + target), behavior: prefersReduced ? "auto" : "smooth" });
    const t = setTimeout(doScroll, prefersReduced ? 50 : 900);
    return () => clearTimeout(t);
  }, [mirrorCurrent?.y, feedCurrent?.y, prefersReduced]);

  return (
    <div className="relative">
      {/* Compact header / district progress chips */}
      <div className="sticky top-[54px] z-30 -mx-4 px-4 py-2.5 bg-background/85 backdrop-blur border-b border-border/70">
        <div className="mx-auto max-w-6xl flex items-center gap-2 flex-wrap">
          <span className="stencil text-[10px] text-primary hud-blink shrink-0">● LIVE MAP</span>
          <div className="h-3 w-px bg-border/70" />
          <ChipLine color={MIRROR_COLOR} label="THE MIRROR" done={mirrorDone} total={mirror.length} />
          <ChipLine color={FEED_COLOR} label="THE FEED" done={feedDone} total={feed.length} />
          <div className="ml-auto flex items-center gap-3 stencil text-[9px] text-muted-foreground">
            <LegendDot color={MIRROR_COLOR} label="MIRROR" />
            <LegendDot color={FEED_COLOR} label="FEED" />
            <span className="hidden sm:inline">◆ LANDMARK</span>
          </div>
        </div>
      </div>

      {/* Map surface */}
      <div ref={svgWrapRef} className="relative mx-auto max-w-[560px] mt-4 mb-8">
        <svg
          viewBox={`0 0 ${VB_W} ${totalHeight}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="MILVERSE transit city map — districts and case stations"
        >
          <defs>
            <radialGradient id="tm-city-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.60 0.19 258 / 0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="tm-glow-m" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="tm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="oklch(0.60 0.19 258 / 0.08)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* backdrop */}
          <rect width={VB_W} height={totalHeight} fill="url(#tm-grid)" />
          <circle cx={VB_W / 2} cy={totalHeight / 2} r={VB_W * 0.9} fill="url(#tm-city-glow)" />

          {/* landmark buildings (aesthetic silhouettes down the center) */}
          <Silhouettes total={totalHeight} />

          {/* Mirror line — dim base + drawing progress */}
          <path d={mirrorPath} stroke={MIRROR_COLOR} strokeOpacity={0.18} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="1 6" />
          <motion.path
            d={mirrorPath}
            stroke={MIRROR_COLOR}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            style={{ filter: "url(#tm-glow-m)" }}
            initial={prefersReduced ? false : { pathLength: 0 }}
            animate={{ pathLength: mirrorProgress }}
            transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut" }}
          />
          {/* Feed line */}
          <path d={feedPath} stroke={FEED_COLOR} strokeOpacity={0.18} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="1 6" />
          <motion.path
            d={feedPath}
            stroke={FEED_COLOR}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            style={{ filter: "url(#tm-glow-m)" }}
            initial={prefersReduced ? false : { pathLength: 0 }}
            animate={{ pathLength: feedProgress }}
            transition={{ duration: prefersReduced ? 0 : 0.8, ease: "easeOut" }}
          />

          {/* Tier interchanges (thin horizontal ticks between different-tier stations) */}
          {renderTierChecks(mirror, MIRROR_COLOR)}
          {renderTierChecks(feed, FEED_COLOR)}

          {/* Landmark stations */}
          <LandmarkStation x={VB_W / 2} y={TOP_PAD - 40} label="THE STUDIO" code="STU" Icon={Clapperboard} to="/studio" />
          <LandmarkStation x={VB_W / 2} y={totalHeight * 0.5} label="THE ARCHIVE" code="ARC" Icon={Library} to="/archive" />
          <LandmarkStation x={VB_W / 2} y={totalHeight - BOTTOM_PAD + 30} label="CITY HALL" code="HAL" Icon={Landmark} to="/city-hall" />

          {/* Scaffold zones — Market + Arena */}
          <ScaffoldZone
            x={40} y={totalHeight - BOTTOM_PAD + 55}
            label="THE MARKET" code="MKT"
            onOpen={() => setScaffoldOpen("market")}
          />
          <ScaffoldZone
            x={VB_W - 90} y={totalHeight - BOTTOM_PAD + 55}
            label="THE ARENA" code="ARN"
            onOpen={() => setScaffoldOpen("arena")}
          />

          {/* Stations */}
          {mirror.map((s, i) => (
            <StationNode
              key={s.scenario.id}
              s={s}
              color={MIRROR_COLOR}
              index={i}
              isCurrent={mirrorCurrent?.scenario.id === s.scenario.id}
              isPlayed={played.has(s.scenario.id)}
              isFuture={i > mirrorCurrentIdx}
              isBeacon={recIds.has(s.scenario.id)}
              stamp={verdictStamp(s, played, profile)}
              onSelect={() => setSelected(s)}
              prefersReduced={!!prefersReduced}
            />
          ))}
          {feed.map((s, i) => (
            <StationNode
              key={s.scenario.id}
              s={s}
              color={FEED_COLOR}
              index={i}
              isCurrent={feedCurrent?.scenario.id === s.scenario.id}
              isPlayed={played.has(s.scenario.id)}
              isFuture={i > feedCurrentIdx}
              isBeacon={false}
              stamp={verdictStamp(s, played, profile)}
              onSelect={() => setSelected(s)}
              prefersReduced={!!prefersReduced}
            />
          ))}
        </svg>

        {/* subtle vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/60" />
      </div>

      {/* Station case card */}
      <StationDialog station={selected} onClose={() => setSelected(null)} />

      {/* Scaffold blueprint routes */}
      <Dialog open={!!scaffoldOpen} onOpenChange={(o) => !o && setScaffoldOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="stencil text-primary">
              {scaffoldOpen === "market" ? "THE MARKET · UNDER CONSTRUCTION" : "THE ARENA · UNDER CONSTRUCTION"}
            </DialogTitle>
            <DialogDescription>
              {scaffoldOpen === "market"
                ? "Scam ads, cloned shops, price-too-good deals. Vote on what opens next."
                : "Human-vs-human imposter duels. Vote on what opens next."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Link
              to={scaffoldOpen === "market" ? "/market" : "/arena"}
              className="stencil text-[11px] rounded-sm border border-primary/60 bg-primary/10 text-primary px-4 py-2 hover:bg-primary/20 transition"
              onClick={() => setScaffoldOpen(null)}
            >
              OPEN BLUEPRINT · VOTE →
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── station node ─────────────────────────────────────────────── */
function StationNode({
  s, color, index, isCurrent, isPlayed, isFuture, isBeacon, stamp, onSelect, prefersReduced,
}: {
  s: Station;
  color: string;
  index: number;
  isCurrent: boolean;
  isPlayed: boolean;
  isFuture: boolean;
  isBeacon: boolean;
  stamp: ReturnType<typeof verdictStamp>;
  onSelect: () => void;
  prefersReduced: boolean;
}) {
  const labelSide = s.line === "mirror" ? -1 : 1;
  const labelX = s.x + labelSide * 22;
  const opacity = isFuture ? 0.5 : 1;
  const dotFill = isPlayed ? color : isCurrent ? color : "oklch(0.22 0.06 265)";
  const stroke = color;

  return (
    <g
      transform={`translate(${s.x} ${s.y})`}
      onClick={onSelect}
      style={{ cursor: "pointer", opacity }}
      role="button"
      tabIndex={0}
      aria-label={`Station ${s.code} — ${s.scenario.title}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
    >
      {/* beacon (recommendation) */}
      {isBeacon && !isPlayed && (
        <>
          <circle r={16} fill={color} opacity={0.18}>
            {!prefersReduced && <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />}
            {!prefersReduced && <animate attributeName="opacity" values="0.28;0.05;0.28" dur="2s" repeatCount="indefinite" />}
          </circle>
          <text x={0} y={-16} textAnchor="middle" className="stencil" fontSize={7} fill={color}>PLAN</text>
        </>
      )}

      {/* current pulse */}
      {isCurrent && (
        <circle r={13} fill="none" stroke={color} strokeWidth={1.5} opacity={0.9}>
          {!prefersReduced && <animate attributeName="r" values="12;20;12" dur="1.6s" repeatCount="indefinite" />}
          {!prefersReduced && <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />}
        </circle>
      )}

      {/* station dot */}
      <circle r={8} fill={dotFill} stroke={stroke} strokeWidth={2} />
      {isPlayed && stamp === "correct" && <circle r={3} fill="oklch(1 0 0)" />}
      {isPlayed && stamp === "missed" && <text y={2.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#ff4d6d">×</text>}
      {isPlayed && stamp === "false" && <text y={2.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#ffb020">!</text>}
      {isPlayed && stamp === "lucky" && <text y={2.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="oklch(0.985 0.003 250)">?</text>}

      {/* "YOU ARE HERE" avatar */}
      {isCurrent && (
        <g transform="translate(0 -22)">
          <rect x={-22} y={-8} width={44} height={11} rx={1} fill="oklch(0.15 0.03 260)" stroke={color} strokeWidth={0.5} />
          <text x={0} y={0} textAnchor="middle" fontSize={6.2} className="stencil" fill={color}>YOU · HERE</text>
        </g>
      )}

      {/* code label */}
      <text
        x={labelX} y={-2}
        textAnchor={labelSide < 0 ? "end" : "start"}
        className="stencil"
        fontSize={7}
        fill={isFuture ? "oklch(0.5 0.02 260)" : color}
      >
        {s.code}
      </text>
      <text
        x={labelX} y={9}
        textAnchor={labelSide < 0 ? "end" : "start"}
        fontSize={7.5}
        fill={isFuture ? "oklch(0.5 0.02 260)" : "oklch(0.985 0.003 250)"}
      >
        {truncate(s.scenario.title, 22)}
      </text>
    </g>
  );
}

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

/* ── tier interchange checkpoints ─────────────────────────────── */
function renderTierChecks(list: Station[], color: string) {
  const marks: React.ReactNode[] = [];
  for (let i = 1; i < list.length; i++) {
    if (list[i].tier !== list[i - 1].tier) {
      const y = (list[i].y + list[i - 1].y) / 2;
      const x = (list[i].x + list[i - 1].x) / 2;
      marks.push(
        <g key={`${color}-tc-${i}`} transform={`translate(${x} ${y})`}>
          <rect x={-14} y={-6} width={28} height={12} rx={1} fill="oklch(0.15 0.03 260)" stroke={color} strokeWidth={0.7} opacity={0.9} />
          <text y={2.5} textAnchor="middle" fontSize={6.5} className="stencil" fill={color}>T{list[i].tier}</text>
        </g>
      );
    }
  }
  return <>{marks}</>;
}

/* ── landmark station ─────────────────────────────────────────── */
function LandmarkStation({
  x, y, label, code, Icon, to,
}: { x: number; y: number; label: string; code: string; Icon: typeof Clapperboard; to: string }) {
  const nav = useNavigate();
  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ cursor: "pointer" }}
      onClick={() => nav({ to })}
      role="button"
      aria-label={label}
    >
      <rect x={-18} y={-18} width={36} height={36} rx={2} fill="oklch(0.15 0.03 260)" stroke="oklch(0.60 0.19 258)" strokeWidth={1.2} />
      <g transform="translate(-8 -8)">
        <foreignObject x={0} y={0} width={16} height={16}>
          <div style={{ color: "#3b82f6", width: 16, height: 16 }}>
            <Icon width={16} height={16} />
          </div>
        </foreignObject>
      </g>
      <text y={30} textAnchor="middle" fontSize={7} className="stencil" fill="oklch(0.60 0.19 258)">{code}</text>
      <text y={40} textAnchor="middle" fontSize={7} fill="oklch(0.985 0.003 250)">{label}</text>
    </g>
  );
}

/* ── scaffold (blueprint) zone ────────────────────────────────── */
function ScaffoldZone({ x, y, label, code, onOpen }: { x: number; y: number; label: string; code: string; onOpen: () => void }) {
  return (
    <g transform={`translate(${x} ${y})`} onClick={onOpen} style={{ cursor: "pointer" }} role="button" aria-label={`${label} — blueprint`}>
      <rect x={0} y={0} width={50} height={38} rx={1} fill="oklch(0.15 0.03 260)" stroke="oklch(0.60 0.19 258)" strokeWidth={0.8} strokeDasharray="3 3" />
      {/* scaffold cross-hatch */}
      <line x1={0} y1={0} x2={50} y2={38} stroke="oklch(0.60 0.19 258 / 0.5)" strokeWidth={0.5} strokeDasharray="2 2" />
      <line x1={50} y1={0} x2={0} y2={38} stroke="oklch(0.60 0.19 258 / 0.5)" strokeWidth={0.5} strokeDasharray="2 2" />
      <text x={25} y={17} textAnchor="middle" fontSize={7} className="stencil" fill="oklch(0.60 0.19 258)">{code}</text>
      <text x={25} y={27} textAnchor="middle" fontSize={5.5} className="stencil" fill="oklch(0.985 0.003 250)">BLUEPRINT</text>
      <text x={25} y={48} textAnchor="middle" fontSize={6.5} className="stencil" fill="oklch(0.985 0.003 250)">{label}</text>
    </g>
  );
}

/* ── ambient city silhouettes (down the middle spine) ─────────── */
function Silhouettes({ total }: { total: number }) {
  const bars = [];
  const cx = VB_W / 2;
  for (let y = 60; y < total - 60; y += 55) {
    const w = 6 + ((y * 7) % 14);
    const h = 12 + ((y * 3) % 32);
    const dx = ((y * 11) % 60) - 30;
    bars.push(<rect key={y} x={cx + dx - w / 2} y={y} width={w} height={h} fill="oklch(0.20 0.03 260)" opacity={0.55} />);
  }
  return <g aria-hidden="true">{bars}</g>;
}

/* ── chips + legend ──────────────────────────────────────────── */
function ChipLine({ color, label, done, total }: { color: string; label: string; done: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-sm border border-border/70 bg-card/60 px-2 py-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="stencil text-[10px] text-foreground">{label}</span>
      <span className="stencil text-[10px] text-muted-foreground">{done}/{total}</span>
    </div>
  );
}
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ── station dialog (case card) ──────────────────────────────── */
function StationDialog({ station, onClose }: { station: Station | null; onClose: () => void }) {
  const nav = useNavigate();
  if (!station) return null;
  const isMirror = station.line === "mirror";
  const color = isMirror ? MIRROR_COLOR : FEED_COLOR;
  const to = isMirror ? "/mirror/$caseId" : "/feed/$caseId";
  return (
    <Dialog open={!!station} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
            <span className="stencil text-[10px]" style={{ color }}>{station.code}</span>
            <span className="stencil text-[10px] text-muted-foreground">· TIER {station.tier}</span>
          </div>
          <DialogTitle className="text-lg leading-tight">{station.scenario.title}</DialogTitle>
          <DialogDescription>
            {"teaser" in station.scenario ? station.scenario.teaser : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 stencil text-[10px] text-muted-foreground">
            <Star className="h-3 w-3" /> {isMirror ? "MIRROR LINE" : "FEED LINE"}
          </div>
          <button
            onClick={() => { onClose(); nav({ to, params: { caseId: station.scenario.id } }); }}
            className="inline-flex items-center gap-2 rounded-sm px-4 py-2 stencil text-[11px] text-primary-foreground"
            style={{ background: color, boxShadow: `0 0 20px ${color}55` }}
          >
            <Play className="h-3.5 w-3.5 fill-current" /> PLAY
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

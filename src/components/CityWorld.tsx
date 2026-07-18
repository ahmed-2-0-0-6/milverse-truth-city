// MILVERSE — Pannable noir city world (SVG + transforms only).
// Age-of-Empires-style camera: drag to pan (inertia), 3-level zoom,
// mini-map + quick-travel dock + recenter + cinematic intro.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import {
  Play,
  X,
  Home,
  Landmark as LandmarkIcon,
  Clapperboard,
  Library,
  Eye,
  Newspaper,
  Store,
  Swords,
} from "lucide-react";
import {
  WORLD_W,
  WORLD_H,
  MIRROR_COLOR,
  FEED_COLOR,
  buildMirrorStations,
  buildFeedStations,
  smoothPath,
  LANDMARKS,
  type Station,
  type Landmark as WorldLandmark,
} from "@/lib/city/world-data";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { getMirrorRecommendations } from "@/lib/recommendations";
import { useVisualMode } from "@/lib/visual-quality";
import { SignalBeacons, BEACON_ANCHORS } from "@/components/city/SignalBeacons";
import { AmbientLife } from "@/components/city/AmbientLife";
import type { CitySignal } from "@/lib/city/signals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ── camera constants ─────────────────────────────────────────── */
const ZOOM_LEVELS = [0.35, 0.7, 1.25]; // overview / quarter / street
const DEFAULT_ZOOM_IDX = 1;

/* ══════════════════════════════════════════════════════════════ */
export function CityWorld({ onSwitchToList }: { onSwitchToList: () => void }) {
  const nav = useNavigate();
  const prefersReduced = useReducedMotion();
  const { mode } = useVisualMode();
  const ambient = mode === "cinematic" && !prefersReduced;
  const [profile, setProfile] = useState<TrustProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  // Single 60s clock for ambient life (windows + tint). One interval, cleaned up.
  const [clock, setClock] = useState(() => {
    const d = new Date();
    return { hour: d.getHours(), minuteOfDay: d.getHours() * 60 + d.getMinutes() };
  });
  useEffect(() => {
    if (!ambient) return; // ambient is off — no need to tick
    const tick = () => {
      const d = new Date();
      setClock({ hour: d.getHours(), minuteOfDay: d.getHours() * 60 + d.getMinutes() });
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [ambient]);


  const mirror = useMemo(buildMirrorStations, []);
  const feed = useMemo(buildFeedStations, []);
  const mirrorPath = useMemo(() => smoothPath(mirror), [mirror]);
  const feedPath = useMemo(() => smoothPath(feed), [feed]);

  const played = useMemo(() => {
    const s = new Set<string>();
    profile?.history.forEach((h) => s.add(h.caseId));
    return s;
  }, [profile]);
  const mirrorDone = mirror.filter((s) => played.has(s.scenario.id)).length;
  const feedDone = feed.filter((s) => played.has(s.scenario.id)).length;
  const mirrorCurrent = mirror[Math.min(mirror.length - 1, mirrorDone)];
  const feedCurrent = feed[Math.min(feed.length - 1, feedDone)];

  const recIds = useMemo(() => {
    const recs = getMirrorRecommendations(profile);
    return new Set(recs.map((r) => r.scenario.id));
  }, [profile]);

  /* ── camera state ─────────────────────────────────────────── */
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [cam, setCam] = useState({
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    z: ZOOM_LEVELS[DEFAULT_ZOOM_IDX],
  });
  const camRef = useRef(cam);
  camRef.current = cam;

  // measure viewport
  useEffect(() => {
    if (!viewportRef.current) return;
    const el = viewportRef.current;
    const measure = () => setVp({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // clamp camera to world bounds so viewport never leaves the map
  const clampCam = useCallback(
    (c: typeof cam) => {
      const halfW = vp.w / (2 * c.z);
      const halfH = vp.h / (2 * c.z);
      const minX = halfW;
      const maxX = WORLD_W - halfW;
      const minY = halfH;
      const maxY = WORLD_H - halfH;
      return {
        z: c.z,
        x: minX <= maxX ? Math.max(minX, Math.min(maxX, c.x)) : WORLD_W / 2,
        y: minY <= maxY ? Math.max(minY, Math.min(maxY, c.y)) : WORLD_H / 2,
      };
    },
    [vp.w, vp.h],
  );

  // recompute clamp when viewport size changes
  useEffect(() => {
    if (vp.w && vp.h) setCam((c) => clampCam(c));
  }, [vp.w, vp.h, clampCam]);

  /* ── fly-to (eased tween) ─────────────────────────────────── */
  const flyRafRef = useRef<number | null>(null);
  const flyTo = useCallback(
    (tx: number, ty: number, tz?: number, ms = 700) => {
      if (flyRafRef.current) cancelAnimationFrame(flyRafRef.current);
      if (prefersReduced) {
        setCam((c) => clampCam({ x: tx, y: ty, z: tz ?? c.z }));
        return;
      }
      const start = performance.now();
      const from = { ...camRef.current };
      const to = { x: tx, y: ty, z: tz ?? from.z };
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / ms);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const next = {
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          z: from.z + (to.z - from.z) * e,
        };
        setCam(clampCam(next));
        if (p < 1) flyRafRef.current = requestAnimationFrame(step);
        else flyRafRef.current = null;
      };
      flyRafRef.current = requestAnimationFrame(step);
    },
    [clampCam, prefersReduced],
  );

  useEffect(
    () => () => {
      if (flyRafRef.current) cancelAnimationFrame(flyRafRef.current);
    },
    [],
  );

  /* ── cinematic intro (once) ───────────────────────────────── */
  const INTRO_KEY = "milverse.world.intro.seen";
  const [introRunning, setIntroRunning] = useState(false);
  const introCancelRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !vp.w || !vp.h) return;
    if (prefersReduced) return;
    if (localStorage.getItem(INTRO_KEY)) return;
    setIntroRunning(true);
    introCancelRef.current = false;
    const stops: { x: number; y: number; z: number; ms: number }[] = [
      { x: WORLD_W / 2, y: WORLD_H / 2, z: ZOOM_LEVELS[0], ms: 0 },
      { x: 500, y: 500, z: ZOOM_LEVELS[1], ms: 1000 },
      { x: 2500, y: 500, z: ZOOM_LEVELS[1], ms: 1000 },
      { x: 1500, y: 1300, z: ZOOM_LEVELS[0], ms: 900 },
    ];
    // land on YOU-ARE-HERE (Mirror current)
    if (mirrorCurrent)
      stops.push({ x: mirrorCurrent.x, y: mirrorCurrent.y, z: ZOOM_LEVELS[2], ms: 1100 });

    let i = 0;
    const runNext = () => {
      if (introCancelRef.current) {
        setIntroRunning(false);
        return;
      }
      const s = stops[i];
      if (!s) {
        setIntroRunning(false);
        localStorage.setItem(INTRO_KEY, "1");
        return;
      }
      if (s.ms === 0) setCam(clampCam({ x: s.x, y: s.y, z: s.z }));
      else flyTo(s.x, s.y, s.z, s.ms);
      i++;
      setTimeout(runNext, s.ms + 50);
    };
    runNext();
    return () => {
      introCancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vp.w, vp.h]);

  const skipIntro = () => {
    introCancelRef.current = true;
    setIntroRunning(false);
    localStorage.setItem(INTRO_KEY, "1");
    if (mirrorCurrent) flyTo(mirrorCurrent.x, mirrorCurrent.y, ZOOM_LEVELS[2], 500);
  };

  /* ── drag pan + inertia ───────────────────────────────────── */
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startCamX: number;
    startCamY: number;
    lastT: number;
    vx: number;
    vy: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZ: number } | null>(null);
  const inertiaRafRef = useRef<number | null>(null);

  const stopInertia = () => {
    if (inertiaRafRef.current) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  };

  const startInertia = (vx: number, vy: number) => {
    stopInertia();
    if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) return;
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.max(1, t - last);
      last = t;
      vx *= Math.pow(0.94, dt / 16);
      vy *= Math.pow(0.94, dt / 16);
      setCam((c) => clampCam({ ...c, x: c.x - (vx * dt) / c.z, y: c.y - (vy * dt) / c.z }));
      if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) {
        inertiaRafRef.current = null;
        return;
      }
      inertiaRafRef.current = requestAnimationFrame(step);
    };
    inertiaRafRef.current = requestAnimationFrame(step);
  };
  useEffect(() => () => stopInertia(), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (introRunning) skipIntro();
    stopInertia();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startCamX: camRef.current.x,
        startCamY: camRef.current.y,
        lastT: performance.now(),
        vx: 0,
        vy: 0,
        moved: false,
      };
    } else if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = { startDist: Math.hypot(a.x - b.x, a.y - b.y), startZ: camRef.current.z };
      dragRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1 && dragRef.current) {
      const d = dragRef.current;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.vx = d.vx * 0.6 + ((e.clientX - d.startX - d.vx * 0) / dt) * 0.4; // rough
      // simpler velocity: use last-frame delta
      d.vx = (e.movementX ?? 0) / dt;
      d.vy = (e.movementY ?? 0) / dt;
      d.lastT = now;
      setCam((c) => clampCam({ ...c, x: d.startCamX - dx / c.z, y: d.startCamY - dy / c.z }));
    } else if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = dist / pinchRef.current.startDist;
      const nextZ = Math.max(
        ZOOM_LEVELS[0],
        Math.min(ZOOM_LEVELS[2], pinchRef.current.startZ * ratio),
      );
      setCam((c) => clampCam({ ...c, z: nextZ }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasDrag = dragRef.current;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0 && wasDrag) {
      if (wasDrag.moved) startInertia(wasDrag.vx * 16, wasDrag.vy * 16);
      dragRef.current = null;
    }
  };

  /* ── wheel zoom (anchored at cursor) ──────────────────────── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    const cur = camRef.current.z;
    // find nearest level then step
    let idx = 0;
    let best = Infinity;
    ZOOM_LEVELS.forEach((z, i) => {
      const d = Math.abs(z - cur);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    const nextIdx = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + dir));
    const nextZ = ZOOM_LEVELS[nextIdx];
    if (nextZ === cur) return;
    // anchor: keep the world point under cursor stationary
    const rect = viewportRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const worldX = camRef.current.x + (cx - vp.w / 2) / cur;
    const worldY = camRef.current.y + (cy - vp.h / 2) / cur;
    const newCamX = worldX - (cx - vp.w / 2) / nextZ;
    const newCamY = worldY - (cy - vp.h / 2) / nextZ;
    flyTo(newCamX, newCamY, nextZ, 250);
  };

  /* ── click / double-tap ───────────────────────────────────── */
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const onViewportClick = (e: React.MouseEvent) => {
    // If a real drag happened, dragRef was cleared with moved=true right before; ignore clicks that came from drags
    // (we manage this via a small flag below)
  };
  const suppressClickRef = useRef(false);

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClickRef.current = false;
    }
  };
  // set suppress on pointerup after a drag
  const onPointerUpWrapped = (e: React.PointerEvent) => {
    const wasDrag = dragRef.current;
    onPointerUp(e);
    if (wasDrag?.moved) suppressClickRef.current = true;
  };

  /* ── station / landmark selection ─────────────────────────── */
  const [selected, setSelected] = useState<Station | null>(null);
  const [scaffoldOpen, setScaffoldOpen] = useState<"market" | "arena" | null>(null);

  const focusStation = (s: Station) => flyTo(s.x, s.y, ZOOM_LEVELS[2], 500);

  const doubleTapLandmark = (l: WorldLandmark) => {
    flyTo(l.x, l.y, ZOOM_LEVELS[2], 600);
  };

  /* ── quick-travel dock ────────────────────────────────────── */
  const dockItems: {
    id: string;
    label: string;
    Icon: typeof Eye;
    onClick: () => void;
    color?: string;
    beacon?: boolean;
  }[] = [
    {
      id: "you",
      label: "YOU",
      Icon: Home,
      onClick: () => mirrorCurrent && flyTo(mirrorCurrent.x, mirrorCurrent.y, ZOOM_LEVELS[2], 500),
      color: MIRROR_COLOR,
      beacon: recIds.size > 0,
    },
    {
      id: "mirror",
      label: "MIRROR",
      Icon: Eye,
      onClick: () => flyTo(500, 800, ZOOM_LEVELS[1], 600),
      color: MIRROR_COLOR,
    },
    {
      id: "feed",
      label: "FEED",
      Icon: Newspaper,
      onClick: () => flyTo(2500, 800, ZOOM_LEVELS[1], 600),
      color: FEED_COLOR,
    },
    {
      id: "hall",
      label: "HALL",
      Icon: LandmarkIcon,
      onClick: () => flyTo(1500, 1050, ZOOM_LEVELS[1], 600),
    },
    {
      id: "studio",
      label: "STUDIO",
      Icon: Clapperboard,
      onClick: () => {
        flyTo(1180, 1700, ZOOM_LEVELS[2], 600);
        setTimeout(() => nav({ to: "/studio" }), 700);
      },
    },
    {
      id: "archive",
      label: "ARCHIVE",
      Icon: Library,
      onClick: () => {
        flyTo(1820, 1700, ZOOM_LEVELS[2], 600);
        setTimeout(() => nav({ to: "/archive" }), 700);
      },
    },
    {
      id: "market",
      label: "MARKET",
      Icon: Store,
      onClick: () => {
        flyTo(420, 1820, ZOOM_LEVELS[2], 600);
        setTimeout(() => setScaffoldOpen("market"), 600);
      },
    },
    {
      id: "arena",
      label: "ARENA",
      Icon: Swords,
      onClick: () => {
        flyTo(2580, 1820, ZOOM_LEVELS[2], 600);
        setTimeout(() => setScaffoldOpen("arena"), 600);
      },
    },
  ];

  /* ── mini-map click handler ───────────────────────────────── */
  const miniW = 168;
  const miniH = miniW * (WORLD_H / WORLD_W);
  const miniClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    flyTo(px * WORLD_W, py * WORLD_H, camRef.current.z, 500);
  };

  /* ── beacon activation: reuse the house zoom-then-nav flourish ── */
  const onBeacon = useCallback(
    (sig: CitySignal) => {
      const anchor = BEACON_ANCHORS[sig.district];
      flyTo(anchor.x, anchor.y, ZOOM_LEVELS[2], 600);
      if (sig.to && sig.to !== "/") {
        setTimeout(() => nav({ to: sig.to }), 700);
      }
    },
    [flyTo, nav],
  );

  /* ── render ───────────────────────────────────────────────── */
  const tx = vp.w / 2 - cam.x * cam.z;
  const ty = vp.h / 2 - cam.y * cam.z;


  return (
    <div className="relative w-full h-[70vh] min-h-[520px] rounded-sm overflow-hidden border border-border/60 bg-[#050914]">
      <div
        ref={viewportRef}
        className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUpWrapped}
        onPointerCancel={onPointerUpWrapped}
        onWheel={onWheel}
        onClickCapture={onClickCapture}
        onClick={onViewportClick}
      >
        {/* world plane */}
        <div
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${cam.z})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <WorldSvg
            mirror={mirror}
            feed={feed}
            mirrorPath={mirrorPath}
            feedPath={feedPath}
            mirrorCurrent={mirrorCurrent}
            feedCurrent={feedCurrent}
            played={played}
            recIds={recIds}
            onStation={(s) => {
              focusStation(s);
              setSelected(s);
            }}
            onLandmark={(l) => {
              doubleTapLandmark(l);
              if (l.kind === "scaffold")
                setTimeout(() => setScaffoldOpen(l.id as "market" | "arena"), 600);
              else if (l.to) setTimeout(() => nav({ to: l.to! }), 700);
            }}
            prefersReduced={!!prefersReduced}
            ambient={ambient}
            hour={clock.hour}
            minuteOfDay={clock.minuteOfDay}
            onBeacon={onBeacon}
          />

        </div>
      </div>

      {/* ── UI overlays ─────────────────────────────────────── */}
      {/* top bar: MAP/LIST + recenter */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2 gap-2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-sm border border-primary/40 bg-background/70 backdrop-blur px-1 py-1 stencil text-[10px]">
          <button className="px-2 py-1 rounded-sm bg-primary text-primary-foreground">MAP</button>
          <button
            onClick={onSwitchToList}
            className="px-2 py-1 rounded-sm text-muted-foreground hover:text-foreground"
          >
            LIST
          </button>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => flyTo(WORLD_W / 2, WORLD_H / 2, ZOOM_LEVELS[0], 500)}
            className="rounded-sm border border-primary/40 bg-background/70 backdrop-blur p-2 text-primary hover:bg-primary/10"
            aria-label="Recenter"
            title="Recenter"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress chips */}
      <div className="pointer-events-none absolute top-12 left-2 flex flex-col gap-1">
        <ChipLine color={MIRROR_COLOR} label="MIRROR" done={mirrorDone} total={mirror.length} />
        <ChipLine color={FEED_COLOR} label="FEED" done={feedDone} total={feed.length} />
      </div>

      {/* Quick-travel dock */}
      <div className="pointer-events-auto absolute bottom-2 left-2 right-[188px] flex gap-1 overflow-x-auto rounded-sm border border-primary/40 bg-background/70 backdrop-blur px-1 py-1">
        {dockItems.map((it) => (
          <button
            key={it.id}
            onClick={it.onClick}
            className="relative shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 rounded-sm hover:bg-primary/10"
            title={it.label}
          >
            <it.Icon className="h-4 w-4" style={{ color: it.color ?? "currentColor" }} />
            <span className="stencil text-[8px] text-muted-foreground">{it.label}</span>
            {it.beacon && (
              <span
                className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
                style={{
                  background: it.color ?? "#22d3ee",
                  boxShadow: `0 0 8px ${it.color ?? "#22d3ee"}`,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Mini-map */}
      <div className="pointer-events-auto absolute bottom-2 right-2 rounded-sm border border-primary/40 bg-background/80 backdrop-blur p-1">
        <svg
          width={miniW}
          height={miniH}
          viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
          onClick={miniClick}
          className="cursor-pointer block"
        >
          <rect width={WORLD_W} height={WORLD_H} fill="#0a1020" />
          <path
            d={mirrorPath}
            stroke={MIRROR_COLOR}
            strokeWidth={22}
            fill="none"
            strokeOpacity={0.7}
          />
          <path d={feedPath} stroke={FEED_COLOR} strokeWidth={22} fill="none" strokeOpacity={0.7} />
          {LANDMARKS.map((l) => (
            <circle
              key={l.id}
              cx={l.x}
              cy={l.y}
              r={l.kind === "landmark" ? 40 : 30}
              fill={l.kind === "scaffold" ? "#5b6270" : "#93c5fd"}
              opacity={0.9}
            />
          ))}
          {/* viewport rect */}
          <rect
            x={cam.x - vp.w / (2 * cam.z)}
            y={cam.y - vp.h / (2 * cam.z)}
            width={vp.w / cam.z}
            height={vp.h / cam.z}
            fill="none"
            stroke="#f5b942"
            strokeWidth={18}
          />
        </svg>
        <div className="stencil text-[8px] text-muted-foreground text-center mt-0.5">
          MINI-MAP · TAP
        </div>
      </div>

      {/* Zoom controls */}
      <div className="pointer-events-auto absolute right-2 top-16 flex flex-col rounded-sm border border-primary/40 bg-background/70 backdrop-blur">
        {[2, 1, 0].map((idx) => (
          <button
            key={idx}
            onClick={() => flyTo(camRef.current.x, camRef.current.y, ZOOM_LEVELS[idx], 350)}
            className={`px-2 py-1 stencil text-[9px] ${Math.abs(cam.z - ZOOM_LEVELS[idx]) < 0.05 ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label={`Zoom ${idx === 0 ? "out" : idx === 2 ? "in" : "mid"}`}
          >
            {idx === 2 ? "STREET" : idx === 1 ? "QRTR" : "CITY"}
          </button>
        ))}
      </div>

      {/* Intro overlay */}
      {introRunning && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-24">
          <div className="pointer-events-auto flex items-center gap-3 rounded-sm border border-primary/40 bg-background/85 backdrop-blur px-3 py-2 stencil text-[10px] text-muted-foreground">
            <span className="hud-blink text-primary">◉ FLYOVER</span>
            <button onClick={skipIntro} className="text-primary hover:underline">
              SKIP →
            </button>
          </div>
        </div>
      )}

      {/* Station dialog */}
      <StationDialog station={selected} onClose={() => setSelected(null)} />

      {/* Scaffold blueprint modal */}
      <Dialog open={!!scaffoldOpen} onOpenChange={(o) => !o && setScaffoldOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="stencil text-primary">
              {scaffoldOpen === "market"
                ? "THE MARKET · UNDER CONSTRUCTION"
                : "THE ARENA · UNDER CONSTRUCTION"}
            </DialogTitle>
            <DialogDescription>
              {scaffoldOpen === "market"
                ? "Scam ads, cloned shops, price-too-good deals. Vote on what opens next."
                : "Human-vs-human imposter duels. Vote on what opens next."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <button
              onClick={() => {
                const to = scaffoldOpen === "market" ? "/market" : "/arena";
                setScaffoldOpen(null);
                nav({ to });
              }}
              className="stencil text-[11px] rounded-sm border border-primary/60 bg-primary/10 text-primary px-4 py-2 hover:bg-primary/20 transition"
            >
              OPEN BLUEPRINT · VOTE →
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
function WorldSvg({
  mirror,
  feed,
  mirrorPath,
  feedPath,
  mirrorCurrent,
  feedCurrent,
  played,
  recIds,
  onStation,
  onLandmark,
  prefersReduced,
  ambient,
  hour,
  minuteOfDay,
  onBeacon,
}: {
  mirror: Station[];
  feed: Station[];
  mirrorPath: string;
  feedPath: string;
  mirrorCurrent: Station | undefined;
  feedCurrent: Station | undefined;
  played: Set<string>;
  recIds: Set<string>;
  onStation: (s: Station) => void;
  onLandmark: (l: WorldLandmark) => void;
  prefersReduced: boolean;
  ambient: boolean;
  hour: number;
  minuteOfDay: number;
  onBeacon: (s: CitySignal) => void;
}) {
  return (
    <svg
      width={WORLD_W}
      height={WORLD_H}
      viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      <defs>
        <radialGradient id="cw-hall" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </radialGradient>
        <filter id="cw-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="cw-streets" width="120" height="120" patternUnits="userSpaceOnUse">
          <path d="M0 0H120V120" fill="none" stroke="#1c2540" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ground */}
      <rect width={WORLD_W} height={WORLD_H} fill="#050914" />
      <rect width={WORLD_W} height={WORLD_H} fill="url(#cw-streets)" opacity={0.6} />
      {/* district glow washes */}
      <ellipse cx={500} cy={800} rx={900} ry={700} fill="#22d3ee" opacity={0.05} />
      <ellipse cx={2500} cy={800} rx={900} ry={700} fill="#f5b942" opacity={0.05} />
      <ellipse cx={1500} cy={1050} rx={700} ry={500} fill="url(#cw-hall)" />

      {/* city buildings — cheap procedural block silhouettes */}
      <CitySilhouettes prefersReduced={prefersReduced} />

      {/* neighborhood labels */}
      <text
        x={500}
        y={120}
        fontSize={44}
        textAnchor="middle"
        fill="#22d3ee"
        opacity={0.5}
        className="stencil"
      >
        MIRROR QUARTER
      </text>
      <text
        x={2500}
        y={120}
        fontSize={44}
        textAnchor="middle"
        fill="#f5b942"
        opacity={0.5}
        className="stencil"
      >
        FEED QUARTER
      </text>
      <text
        x={1500}
        y={950}
        fontSize={30}
        textAnchor="middle"
        fill="#93c5fd"
        opacity={0.7}
        className="stencil"
      >
        CIVIC CORE
      </text>

      {/* transit lines — dim base + bright glow */}
      <path
        d={mirrorPath}
        stroke={MIRROR_COLOR}
        strokeOpacity={0.2}
        strokeWidth={22}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 26"
      />
      <path
        d={mirrorPath}
        stroke={MIRROR_COLOR}
        strokeWidth={12}
        fill="none"
        strokeLinecap="round"
        filter="url(#cw-glow)"
        opacity={0.95}
      />
      <path
        d={feedPath}
        stroke={FEED_COLOR}
        strokeOpacity={0.2}
        strokeWidth={22}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2 26"
      />
      <path
        d={feedPath}
        stroke={FEED_COLOR}
        strokeWidth={12}
        fill="none"
        strokeLinecap="round"
        filter="url(#cw-glow)"
        opacity={0.95}
      />

      {/* signal packets (SMIL) */}
      {!prefersReduced && (
        <>
          <SignalPackets pathId="mirror-p" d={mirrorPath} color={MIRROR_COLOR} dur={9} />
          <SignalPackets pathId="feed-p" d={feedPath} color={FEED_COLOR} dur={9} />
        </>
      )}

      {/* Tier interchanges */}
      {renderTierChecks(mirror, MIRROR_COLOR)}
      {renderTierChecks(feed, FEED_COLOR)}

      {/* Landmarks */}
      {LANDMARKS.map((l) => (
        <LandmarkNode key={l.id} l={l} onClick={() => onLandmark(l)} />
      ))}

      {/* Stations */}
      {mirror.map((s) => {
        const isCurrent = mirrorCurrent?.scenario.id === s.scenario.id;
        return (
          <StationNode
            key={s.scenario.id}
            s={s}
            color={MIRROR_COLOR}
            isCurrent={isCurrent}
            isPlayed={played.has(s.scenario.id)}
            isBeacon={recIds.has(s.scenario.id)}
            onClick={() => onStation(s)}
            prefersReduced={prefersReduced}
          />
        );
      })}
      {feed.map((s) => {
        const isCurrent = feedCurrent?.scenario.id === s.scenario.id;
        return (
          <StationNode
            key={s.scenario.id}
            s={s}
            color={FEED_COLOR}
            isCurrent={isCurrent}
            isPlayed={played.has(s.scenario.id)}
            isBeacon={false}
            onClick={() => onStation(s)}
            prefersReduced={prefersReduced}
          />
        );
      })}

      {/* CITY IS AWAKE — ambient decorative life (skip entirely if not ambient) */}
      {ambient && (
        <>
          {/* hidden path the metro rides — reuses mirror line geometry */}
          <path id="ambient-metro-path" d={mirrorPath} fill="none" stroke="none" />
          <AmbientLife
            hour={hour}
            minuteOfDay={minuteOfDay}
            metroPathId="ambient-metro-path"
            animateMetro={!prefersReduced}
          />
        </>
      )}

      {/* CITY IS AWAKE — truthful signal beacons (always render if present) */}
      <SignalBeacons ambient={ambient} onBeacon={onBeacon} />
    </svg>
  );
}


/* ── flickering city silhouettes (window lights) ─────────────── */
function CitySilhouettes({ prefersReduced }: { prefersReduced: boolean }) {
  // Deterministic pseudo-random buildings
  const items = useMemo(() => {
    const list: {
      x: number;
      y: number;
      w: number;
      h: number;
      lights: { lx: number; ly: number; delay: number }[];
    }[] = [];
    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    // scatter around whole world, avoiding transit lanes lightly
    for (let i = 0; i < 220; i++) {
      const x = rnd() * (WORLD_W - 60);
      const y = 60 + rnd() * (WORLD_H - 120);
      const w = 24 + rnd() * 60;
      const h = 40 + rnd() * 160;
      const lights: { lx: number; ly: number; delay: number }[] = [];
      const cols = Math.max(1, Math.floor(w / 8));
      const rows = Math.max(1, Math.floor(h / 12));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rnd() < 0.35) lights.push({ lx: 3 + c * 8, ly: 5 + r * 12, delay: rnd() * 5 });
        }
      }
      list.push({ x, y, w, h, lights });
    }
    return list;
  }, []);
  return (
    <g aria-hidden="true">
      {items.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          <rect width={b.w} height={b.h} fill="#0b1224" />
          <rect width={b.w} height={2} fill="#1c2540" />
          {b.lights.map((L, li) => {
            const color = (i + li) % 5 === 0 ? "#f5b942" : "#7dd3fc";
            return (
              <rect
                key={li}
                x={L.lx}
                y={L.ly}
                width={2.5}
                height={3}
                fill={color}
                opacity={prefersReduced ? 0.7 : 0.55}
              >
                {!prefersReduced && (
                  <animate
                    attributeName="opacity"
                    values="0.15;0.8;0.35;0.9;0.2"
                    dur={`${4 + (li % 4)}s`}
                    begin={`${L.delay}s`}
                    repeatCount="indefinite"
                  />
                )}
              </rect>
            );
          })}
        </g>
      ))}
    </g>
  );
}

/* ── signal packets travelling the line ──────────────────────── */
function SignalPackets({
  pathId,
  d,
  color,
  dur,
}: {
  pathId: string;
  d: string;
  color: string;
  dur: number;
}) {
  return (
    <g>
      <path id={pathId} d={d} fill="none" stroke="none" />
      {[0, 0.33, 0.66].map((offset, i) => (
        <circle key={i} r={5} fill={color} opacity={0.9} filter="url(#cw-glow)">
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${offset * dur}s`}>
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </g>
  );
}

/* ── tier interchange marker ─────────────────────────────────── */
function renderTierChecks(list: Station[], color: string) {
  const marks: React.ReactNode[] = [];
  for (let i = 1; i < list.length; i++) {
    if (list[i].tier !== list[i - 1].tier) {
      const y = (list[i].y + list[i - 1].y) / 2;
      const x = (list[i].x + list[i - 1].x) / 2;
      marks.push(
        <g key={`${color}-tc-${i}`} transform={`translate(${x} ${y})`}>
          <rect
            x={-40}
            y={-18}
            width={80}
            height={36}
            rx={4}
            fill="#0b1224"
            stroke={color}
            strokeWidth={2}
          />
          <text y={7} textAnchor="middle" fontSize={20} className="stencil" fill={color}>
            T{list[i].tier}
          </text>
        </g>,
      );
    }
  }
  return <>{marks}</>;
}

/* ── landmark node ───────────────────────────────────────────── */
function LandmarkNode({ l, onClick }: { l: WorldLandmark; onClick: () => void }) {
  const isScaffold = l.kind === "scaffold";
  const stroke = isScaffold ? "#93c5fd" : "#7dd3fc";
  return (
    <g
      transform={`translate(${l.x} ${l.y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={l.label}
    >
      {/* base */}
      <rect
        x={-48}
        y={-48}
        width={96}
        height={96}
        rx={6}
        fill="#0f1a30"
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={isScaffold ? "8 6" : undefined}
      />
      {isScaffold && (
        <>
          <line
            x1={-48}
            y1={-48}
            x2={48}
            y2={48}
            stroke={stroke}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
          <line
            x1={48}
            y1={-48}
            x2={-48}
            y2={48}
            stroke={stroke}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
          {/* crane */}
          <line x1={-30} y1={-48} x2={-30} y2={-100} stroke={stroke} strokeWidth={2} />
          <line x1={-30} y1={-100} x2={30} y2={-90} stroke={stroke} strokeWidth={2} />
          <line x1={20} y1={-90} x2={20} y2={-70} stroke={stroke} strokeWidth={1.5} />
        </>
      )}
      {/* roof */}
      {!isScaffold && <rect x={-52} y={-58} width={104} height={12} fill={stroke} opacity={0.4} />}
      {/* label plate */}
      <rect
        x={-70}
        y={54}
        width={140}
        height={l.id === "archive" ? 34 : 22}
        rx={2}
        fill="#0b1224"
        stroke={stroke}
        strokeWidth={1}
      />
      <text y={70} textAnchor="middle" fontSize={13} className="stencil" fill={stroke}>
        {l.label}
      </text>
      {l.id === "archive" && (
        <text
          y={83}
          textAnchor="middle"
          fontSize={9}
          className="stencil"
          fill={stroke}
          opacity={0.75}
        >
          CITY LIBRARY
        </text>
      )}
      {isScaffold && (
        <text y={-4} textAnchor="middle" fontSize={11} className="stencil" fill={stroke}>
          BLUEPRINT
        </text>
      )}
    </g>
  );
}

/* ── station node ───────────────────────────────────────────── */
function StationNode({
  s,
  color,
  isCurrent,
  isPlayed,
  isBeacon,
  onClick,
  prefersReduced,
}: {
  s: Station;
  color: string;
  isCurrent: boolean;
  isPlayed: boolean;
  isBeacon: boolean;
  onClick: () => void;
  prefersReduced: boolean;
}) {
  return (
    <g
      transform={`translate(${s.x} ${s.y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={`Station ${s.code}`}
    >
      {/* beacon */}
      {isBeacon && !isPlayed && (
        <circle r={30} fill={color} opacity={0.2}>
          {!prefersReduced && (
            <animate attributeName="r" values="24;42;24" dur="2s" repeatCount="indefinite" />
          )}
          {!prefersReduced && (
            <animate
              attributeName="opacity"
              values="0.35;0.05;0.35"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      )}
      {/* current pulse */}
      {isCurrent && (
        <circle r={26} fill="none" stroke={color} strokeWidth={3}>
          {!prefersReduced && (
            <animate attributeName="r" values="22;40;22" dur="1.6s" repeatCount="indefinite" />
          )}
          {!prefersReduced && (
            <animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite" />
          )}
        </circle>
      )}
      <circle r={16} fill={isPlayed ? color : "#0b1224"} stroke={color} strokeWidth={4} />
      {isPlayed && <circle r={5} fill="#fff" />}
      {isCurrent && (
        <g transform="translate(0 -44)">
          <rect
            x={-52}
            y={-14}
            width={104}
            height={20}
            rx={2}
            fill="#0b1224"
            stroke={color}
            strokeWidth={1}
          />
          <text y={0} textAnchor="middle" fontSize={11} className="stencil" fill={color}>
            YOU · HERE
          </text>
        </g>
      )}
      <text y={38} textAnchor="middle" fontSize={13} className="stencil" fill={color}>
        {s.code}
      </text>
      <text y={54} textAnchor="middle" fontSize={11} fill="#cbd5e1">
        {truncate(s.scenario.title, 24)}
      </text>
    </g>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/* ── chips ───────────────────────────────────────────────────── */
function ChipLine({
  color,
  label,
  done,
  total,
}: {
  color: string;
  label: string;
  done: number;
  total: number;
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-sm border border-primary/30 bg-background/70 backdrop-blur px-2 py-1">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="stencil text-[10px] text-foreground">{label}</span>
      <span className="stencil text-[10px] text-muted-foreground">
        {done}/{total}
      </span>
    </div>
  );
}

/* ── station dialog ──────────────────────────────────────────── */
function StationDialog({ station, onClose }: { station: Station | null; onClose: () => void }) {
  const nav = useNavigate();
  if (!station) return null;
  const isMirror = station.line === "mirror";
  const color = isMirror ? MIRROR_COLOR : FEED_COLOR;
  const to = isMirror ? "/mirror/$caseId" : "/feed/$caseId";
  return (
    <Dialog open={!!station} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            />
            <span className="stencil text-[10px]" style={{ color }}>
              {station.code}
            </span>
            <span className="stencil text-[10px] text-muted-foreground">· TIER {station.tier}</span>
          </div>
          <DialogTitle className="text-lg leading-tight">{station.scenario.title}</DialogTitle>
          <DialogDescription>
            {"teaser" in station.scenario ? station.scenario.teaser : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between pt-2">
          <div className="stencil text-[10px] text-muted-foreground">
            {isMirror ? "MIRROR LINE" : "FEED LINE"}
          </div>
          <button
            onClick={() => {
              onClose();
              nav({ to, params: { caseId: station.scenario.id } });
            }}
            className="inline-flex items-center gap-2 rounded-sm px-4 py-2 stencil text-[11px]"
            style={{ background: color, color: "#0b1224", boxShadow: `0 0 20px ${color}55` }}
          >
            <Play className="h-3.5 w-3.5 fill-current" /> PLAY
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

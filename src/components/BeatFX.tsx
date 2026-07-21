// Pure-React animated backdrops for ScrollStory beats. No images, no WebGL.
// Each variant is CSS + SVG only, gated by IntersectionObserver so idle beats cost nothing.
import { useEffect, useRef, useState } from "react";

type Variant = "arrival" | "board" | "counter";

export function BeatFX({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setLive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setLive(e.isIntersecting)),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Shared base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 45%, rgba(20,40,60,0.55) 0%, rgba(6,10,18,0.85) 60%, rgba(0,0,0,0.98) 100%)",
        }}
      />
      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      {live && variant === "arrival" && <ArrivalFX />}
      {live && variant === "board" && <BoardFX />}
      {live && variant === "counter" && <CounterFX />}
    </div>
  );
}

/* ─────────── ARRIVAL — incoming messages float up around a pulsing phone ─────────── */
function ArrivalFX() {
  const msgs = [
    { t: "Beta, send OTP…", d: 0 },
    { t: "Congrats! You won ₨50,000", d: 1.2 },
    { t: "Papa, urgent, call me", d: 2.4 },
    { t: "Your parcel is held.", d: 3.6 },
    { t: "SBP: verify account now", d: 4.8 },
  ];
  return (
    <>
      {/* Signal rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/25"
            style={{
              width: 220,
              height: 220,
              animation: `beatfx-ring 4s ease-out ${i * 1.3}s infinite`,
            }}
          />
        ))}
      </div>
      {/* Phone silhouette */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/15"
        style={{
          width: 160,
          height: 300,
          background:
            "linear-gradient(180deg, rgba(20,30,45,0.9), rgba(6,10,18,0.95))",
          boxShadow:
            "0 0 60px rgba(34,211,238,0.25), inset 0 0 40px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="absolute inset-2 rounded-[22px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(34,211,238,0.06), rgba(0,0,0,0.4))",
          }}
        />
        <div
          className="absolute left-1/2 top-4 -translate-x-1/2 h-1.5 w-14 rounded-full bg-black/70"
        />
      </div>
      {/* Floating messages */}
      {msgs.map((m, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-300/25 bg-black/70 px-3 py-2 text-[11px] text-cyan-100/90 backdrop-blur-sm"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            transform: `translate(calc(-50% + ${(i - 2) * 120}px), 0)`,
            animation: `beatfx-float 7s ease-in ${m.d}s infinite`,
            boxShadow: "0 0 20px rgba(34,211,238,0.2)",
          }}
        >
          <span className="mr-2 text-red-400/80">●</span>
          {m.t}
        </div>
      ))}
      <FXKeyframes />
    </>
  );
}

/* ─────────── BOARD — corkboard pinned cards + string lines ─────────── */
function BoardFX() {
  const pins = [
    { x: 12, y: 20, w: 90, h: 60, rot: -6 },
    { x: 68, y: 15, w: 110, h: 70, rot: 4 },
    { x: 30, y: 55, w: 100, h: 65, rot: -3 },
    { x: 75, y: 62, w: 85, h: 70, rot: 7 },
    { x: 48, y: 35, w: 95, h: 55, rot: 1 },
  ];
  return (
    <>
      {/* String web */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[[15, 25, 70, 20], [70, 20, 50, 40], [50, 40, 30, 60], [50, 40, 78, 65], [30, 60, 78, 65]].map(
          ([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(239,68,68,0.35)"
              strokeWidth="0.15"
              strokeDasharray="1 0.5"
              style={{ animation: `beatfx-dash 6s linear ${i * 0.4}s infinite` }}
            />
          ),
        )}
      </svg>
      {/* Pinned cards */}
      {pins.map((p, i) => (
        <div
          key={i}
          className="absolute border border-white/20 bg-white/[0.06] backdrop-blur-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.w,
            height: p.h,
            transform: `rotate(${p.rot}deg)`,
            animation: `beatfx-sway 5s ease-in-out ${i * 0.6}s infinite`,
            boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-red-500/80 shadow" />
          <div className="p-1.5 space-y-1">
            <div className="h-1 w-3/4 bg-cyan-300/40" />
            <div className="h-1 w-full bg-white/25" />
            <div className="h-1 w-2/3 bg-white/15" />
            <div className="h-1 w-1/2 bg-white/20" />
          </div>
        </div>
      ))}
      {/* Flashlight sweep */}
      <div
        className="absolute inset-0 mix-blend-screen opacity-40"
        style={{
          background:
            "radial-gradient(30% 25% at 30% 40%, rgba(245,185,66,0.35), transparent 70%)",
          animation: "beatfx-sweep 12s ease-in-out infinite",
        }}
      />
      <FXKeyframes />
    </>
  );
}

/* ─────────── COUNTER — scanning grid + verification ticks ─────────── */
function CounterFX() {
  return (
    <>
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.25) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(60% 50% at 50% 50%, black 40%, transparent 90%)",
        }}
      />
      {/* Scanning beam */}
      <div
        className="absolute inset-x-0 h-24 opacity-70"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(34,211,238,0.35), transparent)",
          animation: "beatfx-scan 4s linear infinite",
        }}
      />
      {/* Verification chips */}
      {[
        { l: "SOURCE", x: 15, y: 30, d: 0 },
        { l: "DATE", x: 70, y: 25, d: 0.6 },
        { l: "IMAGE", x: 20, y: 65, d: 1.2 },
        { l: "SENDER", x: 72, y: 68, d: 1.8 },
        { l: "URL", x: 45, y: 45, d: 2.4 },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute flex items-center gap-2 rounded-sm border border-cyan-300/40 bg-black/60 px-2 py-1 text-[10px] text-cyan-200 backdrop-blur"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            fontFamily: '"IBM Plex Mono", monospace',
            animation: `beatfx-verify 3.5s ease-out ${c.d}s infinite`,
            boxShadow: "0 0 18px rgba(34,211,238,0.2)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300"
            style={{ animation: `beatfx-blink 1.2s ease-in-out infinite ${c.d}s` }}
          />
          {c.l} ✓
        </div>
      ))}
      <FXKeyframes />
    </>
  );
}

function FXKeyframes() {
  return (
    <style>{`
      @keyframes beatfx-ring {
        0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
      }
      @keyframes beatfx-float {
        0% { transform: translate(var(--tx, -50%), 40vh); opacity: 0; }
        15% { opacity: 1; }
        70% { opacity: 1; }
        100% { transform: translate(var(--tx, -50%), -60vh); opacity: 0; }
      }
      @keyframes beatfx-sway {
        0%, 100% { transform: rotate(var(--r,0deg)) translateY(0); }
        50% { transform: rotate(calc(var(--r,0deg) + 1deg)) translateY(-2px); }
      }
      @keyframes beatfx-dash {
        to { stroke-dashoffset: -20; }
      }
      @keyframes beatfx-sweep {
        0%, 100% { transform: translateX(-15%); opacity: 0.2; }
        50% { transform: translateX(20%); opacity: 0.5; }
      }
      @keyframes beatfx-scan {
        0% { transform: translateY(-20%); }
        100% { transform: translateY(120vh); }
      }
      @keyframes beatfx-verify {
        0% { opacity: 0; transform: translateY(8px) scale(0.9); }
        20% { opacity: 1; transform: translateY(0) scale(1); }
        80% { opacity: 1; }
        100% { opacity: 0.3; }
      }
      @keyframes beatfx-blink {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; box-shadow: 0 0 10px rgba(34,211,238,0.9); }
      }
    `}</style>
  );
}

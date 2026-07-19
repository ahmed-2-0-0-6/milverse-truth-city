// LIVING CITY CANVAS — high-end SVG+CSS tableau that lives behind the
// hero content. Pure presentation. Rendered ONLY in cinematic mode and
// only when the OS does not request reduced motion. Positioned as a
// full-viewport aria-hidden decoration; pointer-events are off so all
// clicks pass through to the hero CTA underneath.
//
// Scenes composed here:
//   1. THE ROUND TABLE — a modern circular detective's table in the
//      top-left, rotating slowly, with case files, photos and pins
//      orbiting it. A magnifier hovers over the centre.
//   2. THE CRIME SCENE — top-right, chalk outline with pulsing
//      numbered evidence markers and a yellow tape ribbon strung
//      across the corner. A camera flash pops every few seconds.
//   3. THE CITY PARK — a full-width silhouette band at the bottom:
//      swaying trees, a swinging swing with a kid, a family walking
//      a dog, pigeons drifting off, benches and a lamppost.
//   4. THE WIND — leaves and paper scraps drift diagonally across
//      the entire viewport on wind-shaped paths.
//
// Everything is deterministic CSS/SVG so there is no runtime cost per
// frame beyond compositor work — safe to run behind the fold.

import { useVisualMode } from "@/lib/visual-quality";
import { useEffect, useState } from "react";

function useMotionOK() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOk(!m.matches);
    const on = () => setOk(!m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return ok;
}

export function LivingCityCanvas() {
  const { mode } = useVisualMode();
  const motion = useMotionOK();
  if (mode !== "cinematic" || !motion) return null;

  return (
    <div
      aria-hidden
      className="lcc-root pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{CSS}</style>

      {/* ── SCENE 1 · THE ROUND TABLE ─────────────────────────── */}
      <div className="lcc-table" aria-hidden>
        <svg viewBox="0 0 400 400" className="lcc-table-svg">
          <defs>
            <radialGradient id="lccTableFelt" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
              <stop offset="60%" stopColor="rgba(20,32,48,0.55)" />
              <stop offset="100%" stopColor="rgba(2,4,10,0.85)" />
            </radialGradient>
            <radialGradient id="lccLamp" cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor="rgba(245,185,66,0.55)" />
              <stop offset="70%" stopColor="rgba(245,185,66,0)" />
            </radialGradient>
          </defs>

          {/* lamp pool */}
          <circle cx="200" cy="180" r="180" fill="url(#lccLamp)" className="lcc-lamp" />
          {/* table disk */}
          <circle cx="200" cy="200" r="170" fill="url(#lccTableFelt)" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(34,211,238,0.14)" strokeDasharray="2 4" />
          <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="1 3" />

          {/* rotating ring of case files */}
          <g className="lcc-orbit">
            {ORBIT_ITEMS.map((it, i) => {
              const a = (i / ORBIT_ITEMS.length) * Math.PI * 2;
              const r = 128;
              const x = 200 + Math.cos(a) * r;
              const y = 200 + Math.sin(a) * r;
              const rot = (a * 180) / Math.PI + 90;
              return (
                <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
                  <g className="lcc-counter">{it}</g>
                </g>
              );
            })}
          </g>

          {/* central magnifier */}
          <g className="lcc-mag" transform="translate(200 200)">
            <circle r="26" fill="rgba(2,4,10,0.6)" stroke="rgba(34,211,238,0.85)" strokeWidth="2" />
            <circle r="26" fill="rgba(34,211,238,0.06)" />
            <line x1="18" y1="18" x2="42" y2="42" stroke="rgba(34,211,238,0.85)" strokeWidth="4" strokeLinecap="round" />
            <line x1="-10" y1="-6" x2="10" y2="-6" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="-10" y1="6" x2="10" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* ── SCENE 2 · CRIME SCENE ─────────────────────────────── */}
      <div className="lcc-crime" aria-hidden>
        <svg viewBox="0 0 360 360" className="lcc-crime-svg">
          {/* chalk outline */}
          <path
            d="M180 90 c-18 0 -34 12 -36 30 c-2 16 8 30 8 46 c0 12 -14 22 -22 34 c-8 12 -6 30 8 40 l14 8 l-6 24 l16 6 l10 -20 l14 4 l10 22 l18 -4 l-6 -26 l14 -8 c14 -10 16 -28 8 -40 c-8 -12 -22 -22 -22 -34 c0 -16 10 -30 8 -46 c-2 -18 -18 -30 -34 -30 z"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
            strokeLinejoin="round"
            className="lcc-chalk"
          />
          {/* evidence markers */}
          {[
            { x: 90, y: 120, n: 1 },
            { x: 270, y: 160, n: 2 },
            { x: 110, y: 260, n: 3 },
            { x: 250, y: 290, n: 4 },
          ].map((m, i) => (
            <g key={i} className="lcc-marker" style={{ animationDelay: `${i * 0.7}s` }}>
              <polygon
                points={`${m.x},${m.y - 18} ${m.x + 14},${m.y + 8} ${m.x - 14},${m.y + 8}`}
                fill="rgba(245,185,66,0.9)"
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="1"
              />
              <text
                x={m.x}
                y={m.y + 4}
                textAnchor="middle"
                fontFamily="'Bebas Neue', sans-serif"
                fontSize="14"
                fill="#0a0a0a"
                fontWeight="700"
              >
                {m.n}
              </text>
            </g>
          ))}
          {/* camera flash */}
          <circle cx="180" cy="180" r="200" fill="white" className="lcc-flash" />
        </svg>
        {/* yellow tape */}
        <div className="lcc-tape lcc-tape-a">
          <span>CRIME SCENE · DO NOT CROSS · </span>
          <span>CRIME SCENE · DO NOT CROSS · </span>
          <span>CRIME SCENE · DO NOT CROSS · </span>
        </div>
        <div className="lcc-tape lcc-tape-b">
          <span>MILVERSE · EVIDENCE · </span>
          <span>MILVERSE · EVIDENCE · </span>
          <span>MILVERSE · EVIDENCE · </span>
        </div>
      </div>

      {/* ── SCENE 3 · THE CITY PARK ───────────────────────────── */}
      <div className="lcc-park" aria-hidden>
        <svg viewBox="0 0 1600 300" preserveAspectRatio="xMidYEnd slice" className="lcc-park-svg">
          {/* ground */}
          <rect x="0" y="240" width="1600" height="60" fill="rgba(0,0,0,0.55)" />
          <line x1="0" y1="240" x2="1600" y2="240" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />

          {/* distant skyline */}
          <g fill="rgba(20,32,48,0.85)" opacity="0.85">
            <rect x="30" y="120" width="60" height="120" />
            <rect x="100" y="80" width="40" height="160" />
            <rect x="150" y="140" width="80" height="100" />
            <rect x="1360" y="90" width="50" height="150" />
            <rect x="1420" y="130" width="70" height="110" />
            <rect x="1500" y="70" width="40" height="170" />
          </g>
          {/* windows blink */}
          {WINDOWS.map((w, i) => (
            <rect
              key={i}
              x={w.x}
              y={w.y}
              width="3"
              height="3"
              fill="rgba(245,185,66,0.9)"
              className="lcc-window"
              style={{ animationDelay: `${(i % 7) * 0.6}s` }}
            />
          ))}

          {/* trees */}
          {[280, 720, 1180].map((tx, i) => (
            <g key={i} className="lcc-tree" style={{ transformOrigin: `${tx}px 240px`, animationDelay: `${i * 0.4}s` }}>
              <rect x={tx - 4} y="180" width="8" height="60" fill="rgba(0,0,0,0.7)" />
              <circle cx={tx} cy="170" r="42" fill="rgba(15,25,20,0.9)" />
              <circle cx={tx - 20} cy="180" r="28" fill="rgba(15,25,20,0.85)" />
              <circle cx={tx + 22} cy="182" r="30" fill="rgba(15,25,20,0.85)" />
            </g>
          ))}

          {/* lamppost */}
          <g>
            <rect x="500" y="130" width="4" height="110" fill="rgba(0,0,0,0.7)" />
            <circle cx="502" cy="128" r="8" fill="rgba(245,185,66,0.9)" className="lcc-lamppost" />
            <circle cx="502" cy="128" r="34" fill="rgba(245,185,66,0.14)" className="lcc-lamppost-halo" />
          </g>

          {/* bench */}
          <g stroke="rgba(0,0,0,0.75)" strokeWidth="3" fill="none">
            <line x1="900" y1="230" x2="980" y2="230" />
            <line x1="905" y1="230" x2="905" y2="242" />
            <line x1="975" y1="230" x2="975" y2="242" />
            <line x1="900" y1="222" x2="980" y2="222" />
          </g>

          {/* swing set */}
          <g stroke="rgba(0,0,0,0.75)" strokeWidth="3" fill="none">
            <line x1="1050" y1="240" x2="1090" y2="150" />
            <line x1="1180" y1="240" x2="1140" y2="150" />
            <line x1="1085" y1="150" x2="1145" y2="150" />
          </g>
          {/* swing + kid */}
          <g className="lcc-swing" style={{ transformOrigin: "1115px 150px" }}>
            <line x1="1115" y1="150" x2="1105" y2="210" stroke="rgba(0,0,0,0.75)" strokeWidth="2" />
            <line x1="1115" y1="150" x2="1125" y2="210" stroke="rgba(0,0,0,0.75)" strokeWidth="2" />
            <rect x="1100" y="210" width="30" height="4" fill="rgba(0,0,0,0.8)" />
            {/* kid */}
            <g transform="translate(1115 200)">
              <circle cx="0" cy="-8" r="5" fill="rgba(255,220,180,0.95)" />
              <rect x="-4" y="-4" width="8" height="12" rx="2" fill="rgba(34,211,238,0.85)" />
              <line x1="-4" y1="0" x2="-10" y2="6" stroke="rgba(255,220,180,0.95)" strokeWidth="2" />
              <line x1="4" y1="0" x2="10" y2="6" stroke="rgba(255,220,180,0.95)" strokeWidth="2" />
            </g>
          </g>

          {/* walking family */}
          <g className="lcc-family">
            {/* parent */}
            <g transform="translate(0 0)">
              <circle cx="0" cy="200" r="6" fill="rgba(255,220,180,0.95)" />
              <rect x="-5" y="206" width="10" height="20" fill="rgba(120,90,60,0.9)" />
              <g className="lcc-legs">
                <line x1="-2" y1="226" x2="-5" y2="240" stroke="rgba(0,0,0,0.85)" strokeWidth="3" />
                <line x1="2" y1="226" x2="5" y2="240" stroke="rgba(0,0,0,0.85)" strokeWidth="3" />
              </g>
            </g>
            {/* child, hand held */}
            <g transform="translate(18 8)">
              <circle cx="0" cy="200" r="4" fill="rgba(255,220,180,0.95)" />
              <rect x="-4" y="204" width="8" height="14" fill="rgba(245,185,66,0.9)" />
              <g className="lcc-legs" style={{ animationDelay: "0.15s" }}>
                <line x1="-2" y1="218" x2="-4" y2="228" stroke="rgba(0,0,0,0.85)" strokeWidth="2" />
                <line x1="2" y1="218" x2="4" y2="228" stroke="rgba(0,0,0,0.85)" strokeWidth="2" />
              </g>
            </g>
            {/* dog on leash */}
            <g transform="translate(46 26)">
              <line x1="-28" y1="-24" x2="0" y2="0" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              <ellipse cx="0" cy="4" rx="10" ry="4" fill="rgba(0,0,0,0.85)" />
              <circle cx="9" cy="2" r="3" fill="rgba(0,0,0,0.9)" />
              <line x1="12" y1="2" x2="14" y2="0" stroke="rgba(0,0,0,0.9)" strokeWidth="1.5" />
              <g className="lcc-legs" style={{ animationDelay: "0.05s" }}>
                <line x1="-6" y1="6" x2="-7" y2="12" stroke="rgba(0,0,0,0.9)" strokeWidth="1.5" />
                <line x1="6" y1="6" x2="7" y2="12" stroke="rgba(0,0,0,0.9)" strokeWidth="1.5" />
              </g>
            </g>
          </g>

          {/* pigeons */}
          {[0, 1, 2].map((i) => (
            <g key={i} className="lcc-pigeon" style={{ animationDelay: `${i * 1.8}s` }}>
              <path d="M0 0 q4 -4 8 0 q-4 -6 -8 0 q-4 -6 -8 0 q4 -4 8 0 z" fill="rgba(230,230,230,0.85)" />
            </g>
          ))}
        </svg>
      </div>

      {/* ── SCENE 4 · WIND & LEAVES ───────────────────────────── */}
      <div className="lcc-wind" aria-hidden>
        {LEAVES.map((l, i) => (
          <span
            key={i}
            className="lcc-leaf"
            style={{
              top: `${l.top}%`,
              animationDelay: `${l.delay}s`,
              animationDuration: `${l.dur}s`,
              color: l.color,
            }}
          >
            {l.char}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── ORBITING CASE FILES ──────────────────────────────────────
const ORBIT_ITEMS = [
  // manila folder
  (
    <g>
      <rect x="-14" y="-10" width="28" height="20" fill="rgba(245,185,66,0.95)" stroke="rgba(0,0,0,0.6)" />
      <rect x="-14" y="-13" width="14" height="4" fill="rgba(245,185,66,0.95)" stroke="rgba(0,0,0,0.6)" />
      <line x1="-10" y1="-4" x2="10" y2="-4" stroke="rgba(0,0,0,0.4)" />
      <line x1="-10" y1="0" x2="6" y2="0" stroke="rgba(0,0,0,0.35)" />
      <line x1="-10" y1="4" x2="8" y2="4" stroke="rgba(0,0,0,0.3)" />
    </g>
  ),
  // polaroid
  (
    <g>
      <rect x="-12" y="-14" width="24" height="26" fill="rgba(240,240,235,0.95)" stroke="rgba(0,0,0,0.5)" />
      <rect x="-9" y="-11" width="18" height="14" fill="rgba(20,32,48,0.8)" />
      <circle cx="0" cy="-4" r="3" fill="rgba(255,255,255,0.4)" />
    </g>
  ),
  // red-pin note
  (
    <g>
      <rect x="-13" y="-10" width="26" height="20" fill="rgba(255,240,220,0.95)" stroke="rgba(0,0,0,0.5)" />
      <line x1="-10" y1="-4" x2="8" y2="-4" stroke="rgba(0,0,0,0.5)" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="rgba(0,0,0,0.4)" />
      <line x1="-10" y1="4" x2="4" y2="4" stroke="rgba(0,0,0,0.4)" />
      <circle cx="0" cy="-10" r="3" fill="#ef4444" stroke="rgba(0,0,0,0.6)" />
    </g>
  ),
  // audio cassette
  (
    <g>
      <rect x="-16" y="-10" width="32" height="20" rx="2" fill="rgba(30,30,30,0.95)" stroke="rgba(255,255,255,0.35)" />
      <circle cx="-6" cy="0" r="3" fill="rgba(255,255,255,0.4)" />
      <circle cx="6" cy="0" r="3" fill="rgba(255,255,255,0.4)" />
      <rect x="-10" y="-6" width="20" height="2" fill="rgba(245,185,66,0.7)" />
    </g>
  ),
  // fingerprint
  (
    <g fill="none" stroke="rgba(34,211,238,0.9)" strokeWidth="1">
      <ellipse cx="0" cy="0" rx="10" ry="12" />
      <ellipse cx="0" cy="0" rx="7" ry="8.5" />
      <ellipse cx="0" cy="0" rx="4" ry="5" />
      <ellipse cx="0" cy="0" rx="1.5" ry="2" fill="rgba(34,211,238,0.9)" />
    </g>
  ),
  // sms screen
  (
    <g>
      <rect x="-10" y="-14" width="20" height="28" rx="3" fill="rgba(10,15,25,0.95)" stroke="rgba(34,211,238,0.6)" />
      <rect x="-7" y="-10" width="12" height="3" fill="rgba(245,185,66,0.7)" />
      <rect x="-7" y="-5" width="10" height="2" fill="rgba(255,255,255,0.5)" />
      <rect x="-7" y="-1" width="8" height="2" fill="rgba(255,255,255,0.4)" />
      <rect x="-7" y="3" width="12" height="2" fill="rgba(255,255,255,0.35)" />
    </g>
  ),
  // map pin
  (
    <g>
      <path d="M0 -12 c-6 0 -10 5 -10 11 c0 8 10 15 10 15 c0 0 10 -7 10 -15 c0 -6 -4 -11 -10 -11 z" fill="rgba(239,68,68,0.9)" stroke="rgba(0,0,0,0.6)" />
      <circle cx="0" cy="-1" r="3" fill="rgba(255,255,255,0.9)" />
    </g>
  ),
  // key
  (
    <g stroke="rgba(245,185,66,0.9)" strokeWidth="2" fill="none">
      <circle cx="-8" cy="0" r="5" />
      <line x1="-3" y1="0" x2="12" y2="0" />
      <line x1="8" y1="0" x2="8" y2="4" />
      <line x1="12" y1="0" x2="12" y2="4" />
    </g>
  ),
];

// deterministic little starfields
const WINDOWS = Array.from({ length: 34 }, (_, i) => ({
  x: 40 + ((i * 47) % 200) + (i > 15 ? 1300 : 0),
  y: 90 + ((i * 23) % 140),
}));

const LEAVES = Array.from({ length: 14 }, (_, i) => {
  const chars = ["✦", "❦", "✧", "❋", "❈", "✿"];
  const colors = [
    "rgba(245,185,66,0.8)",
    "rgba(34,211,238,0.7)",
    "rgba(239,68,68,0.6)",
    "rgba(220,220,220,0.55)",
  ];
  return {
    top: (i * 7.3) % 80,
    delay: (i * 1.7) % 12,
    dur: 14 + ((i * 3) % 10),
    char: chars[i % chars.length],
    color: colors[i % colors.length],
  };
});

const CSS = `
.lcc-root { mix-blend-mode: screen; opacity: 0.85; }
@media (max-width: 640px) { .lcc-root { opacity: 0.55; } }

/* ── scene 1 · round table ─────────────────────────────── */
.lcc-table {
  position: absolute;
  top: 4%;
  left: -6%;
  width: min(46vmin, 460px);
  aspect-ratio: 1/1;
  filter: drop-shadow(0 20px 40px rgba(34,211,238,0.18));
}
.lcc-table-svg { width: 100%; height: 100%; display: block; }
.lcc-orbit { transform-origin: 200px 200px; animation: lcc-spin 42s linear infinite; }
.lcc-counter { animation: lcc-spin-r 42s linear infinite; transform-origin: center; }
.lcc-mag { animation: lcc-hover 6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
.lcc-lamp { animation: lcc-lamp 5s ease-in-out infinite; transform-origin: 200px 180px; }
@keyframes lcc-spin { to { transform: rotate(360deg); } }
@keyframes lcc-spin-r { to { transform: rotate(-360deg); } }
@keyframes lcc-hover {
  0%,100% { transform: translate(200px,200px) scale(1); }
  50%     { transform: translate(200px,192px) scale(1.06); }
}
@keyframes lcc-lamp {
  0%,100% { opacity: 0.9; }
  40%     { opacity: 0.55; }
  42%     { opacity: 1; }
}

/* ── scene 2 · crime scene ─────────────────────────────── */
.lcc-crime {
  position: absolute;
  top: 6%;
  right: -4%;
  width: min(40vmin, 400px);
  aspect-ratio: 1/1;
  filter: drop-shadow(0 20px 30px rgba(245,185,66,0.12));
}
.lcc-crime-svg { width: 100%; height: 100%; display: block; }
.lcc-chalk {
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
  animation: lcc-draw 8s ease-in-out infinite;
}
@keyframes lcc-draw {
  0%       { stroke-dashoffset: 900; opacity: 0.15; }
  25%      { stroke-dashoffset: 0;   opacity: 0.55; }
  75%      { stroke-dashoffset: 0;   opacity: 0.55; }
  100%     { stroke-dashoffset: -900; opacity: 0.15; }
}
.lcc-marker { animation: lcc-marker-pulse 3s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
@keyframes lcc-marker-pulse {
  0%,100% { transform: scale(1); opacity: 0.9; }
  50%     { transform: scale(1.12); opacity: 1; }
}
.lcc-flash { opacity: 0; animation: lcc-flash 9s ease-out infinite; }
@keyframes lcc-flash {
  0%,88%,100% { opacity: 0; }
  90%         { opacity: 0.55; }
  92%         { opacity: 0.1; }
  94%         { opacity: 0.4; }
}
.lcc-tape {
  position: absolute;
  left: -20%;
  width: 160%;
  background: linear-gradient(180deg, rgba(245,185,66,0.95), rgba(230,170,50,0.95));
  color: #0a0a0a;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 12px;
  letter-spacing: 3px;
  padding: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  border-top: 1px solid rgba(0,0,0,0.4);
  border-bottom: 1px solid rgba(0,0,0,0.4);
}
.lcc-tape span { display: inline-block; padding: 0 8px; animation: lcc-tape-scroll 24s linear infinite; }
.lcc-tape-a { top: 22%; transform: rotate(-8deg); }
.lcc-tape-b { top: 62%; transform: rotate(6deg); background: linear-gradient(180deg, rgba(30,30,30,0.9), rgba(10,10,10,0.9)); color: rgba(245,185,66,0.95); }
.lcc-tape-b span { animation-direction: reverse; animation-duration: 30s; }
@keyframes lcc-tape-scroll { to { transform: translateX(-33.33%); } }

/* ── scene 3 · park ────────────────────────────────────── */
.lcc-park {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30vh;
  min-height: 220px;
  max-height: 340px;
  opacity: 0.85;
}
.lcc-park-svg { width: 100%; height: 100%; display: block; }
.lcc-tree { animation: lcc-sway 6s ease-in-out infinite; }
@keyframes lcc-sway {
  0%,100% { transform: rotate(-1.5deg); }
  50%     { transform: rotate(1.5deg); }
}
.lcc-window { animation: lcc-blink 4s steps(2,end) infinite; }
@keyframes lcc-blink {
  0%,80% { opacity: 0.9; }
  85%    { opacity: 0.15; }
  95%    { opacity: 0.9; }
}
.lcc-lamppost { animation: lcc-lamp 3s ease-in-out infinite; }
.lcc-lamppost-halo { animation: lcc-lamp 3s ease-in-out infinite; }
.lcc-swing { animation: lcc-swing 4.5s ease-in-out infinite; transform-origin: 1115px 150px; transform-box: fill-box; }
@keyframes lcc-swing {
  0%,100% { transform: rotate(-18deg); }
  50%     { transform: rotate(18deg); }
}
.lcc-family { animation: lcc-walk 22s linear infinite; }
@keyframes lcc-walk {
  0%   { transform: translateX(-80px); }
  100% { transform: translateX(1620px); }
}
.lcc-legs { animation: lcc-step 0.45s ease-in-out infinite; transform-origin: center top; transform-box: fill-box; }
@keyframes lcc-step {
  0%,100% { transform: skewX(6deg); }
  50%     { transform: skewX(-6deg); }
}
.lcc-pigeon { animation: lcc-fly 12s ease-in-out infinite; transform: translate(200px,220px); }
.lcc-pigeon:nth-of-type(2) { animation-duration: 15s; }
.lcc-pigeon:nth-of-type(3) { animation-duration: 18s; }
@keyframes lcc-fly {
  0%   { transform: translate(200px,240px) scale(0.6); opacity: 0; }
  10%  { opacity: 0.9; }
  60%  { transform: translate(900px,90px)  scale(1);   opacity: 0.9; }
  100% { transform: translate(1500px,40px) scale(0.7); opacity: 0; }
}

/* ── scene 4 · leaves ──────────────────────────────────── */
.lcc-wind { position: absolute; inset: 0; overflow: hidden; }
.lcc-leaf {
  position: absolute;
  left: -6%;
  font-size: 14px;
  line-height: 1;
  will-change: transform;
  animation-name: lcc-leaf-fly;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  filter: drop-shadow(0 0 6px currentColor);
}
@keyframes lcc-leaf-fly {
  0%   { transform: translate(0, 0) rotate(0deg); }
  25%  { transform: translate(30vw, 10vh) rotate(120deg); }
  50%  { transform: translate(55vw, -4vh) rotate(240deg); }
  75%  { transform: translate(80vw, 12vh) rotate(360deg); }
  100% { transform: translate(115vw, 4vh) rotate(480deg); }
}
`;

export default LivingCityCanvas;

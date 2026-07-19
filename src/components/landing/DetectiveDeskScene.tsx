// LAYER-7 — The Detective's Desk.
// A cinematic top-down desk vignette that lives directly below the hero,
// occupying the same viewport footprint the hero owns. Pure SVG + CSS so
// it costs almost nothing and stays crisp at every DPR. The circular
// desk rotates on a very slow loop (respects prefers-reduced-motion),
// coffee steam curls up, and the desk lamp breathes.
//
// Contents on the desk (all hand-drawn in SVG):
//   • Scattered manila case files with red "CLASSIFIED" stamps
//   • Loose photographs (Polaroid-style) and a redacted dossier
//   • A ceramic coffee mug with rising steam
//   • Two pens (fountain + ballpoint) and paperclips
//   • A tiny raccoon paperweight
//   • A magnifying glass, notepad, and rubber stamp
//
// Presentation-only. Zero business logic. No new deps.

import { useVisualMode } from "@/lib/visual-quality";

export function DetectiveDeskScene() {
  const { mode } = useVisualMode();
  const cinematic = mode === "cinematic";

  return (
    <section
      aria-hidden
      className="detective-desk-scene relative w-full min-h-[100svh] overflow-hidden flex items-center justify-center"
    >
      {/* Room backdrop — warm floor + noir walls */}
      <div className="absolute inset-0 -z-10 detective-room-bg" />

      {/* Warm lamp glow from top-center */}
      <div className="absolute inset-x-0 top-0 h-[60%] -z-10 detective-lamp-glow" />

      {/* Vignette */}
      <div className="absolute inset-0 -z-10 detective-vignette" />

      {/* The desk — SVG stage. viewBox is square so it scales cleanly. */}
      <div className="relative w-[min(92vmin,1100px)] aspect-square">
        <svg
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Wood grain gradient for the round desk */}
            <radialGradient id="deskWood" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#5a3a22" />
              <stop offset="55%" stopColor="#3d2515" />
              <stop offset="100%" stopColor="#1c110a" />
            </radialGradient>
            <radialGradient id="deskHighlight" cx="45%" cy="30%" r="55%">
              <stop offset="0%" stopColor="rgba(255,210,140,0.35)" />
              <stop offset="60%" stopColor="rgba(255,180,90,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <pattern id="woodGrain" width="6" height="600" patternUnits="userSpaceOnUse">
              <rect width="6" height="600" fill="rgba(0,0,0,0)" />
              <path d="M3 0 Q4 300 3 600" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" fill="none" />
            </pattern>

            {/* Paper */}
            <linearGradient id="paperCream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4ead5" />
              <stop offset="100%" stopColor="#d9c9a3" />
            </linearGradient>
            <linearGradient id="manila" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0b874" />
              <stop offset="100%" stopColor="#a67a3a" />
            </linearGradient>
            <linearGradient id="polaroid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7f2e6" />
              <stop offset="100%" stopColor="#e2dcc8" />
            </linearGradient>

            {/* Coffee */}
            <radialGradient id="coffee" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#4b2a12" />
              <stop offset="80%" stopColor="#2a170a" />
              <stop offset="100%" stopColor="#180a04" />
            </radialGradient>
            <linearGradient id="mug" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8e2d3" />
              <stop offset="100%" stopColor="#7a7263" />
            </linearGradient>

            {/* Metal for clips & pens */}
            <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c8ccd1" />
              <stop offset="50%" stopColor="#eef1f4" />
              <stop offset="100%" stopColor="#8a8f95" />
            </linearGradient>

            {/* Raccoon fur */}
            <radialGradient id="racFur" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#8b8f96" />
              <stop offset="70%" stopColor="#4a4e55" />
              <stop offset="100%" stopColor="#22252a" />
            </radialGradient>

            {/* Soft shadow for objects on the desk */}
            <filter id="objShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
              <feOffset dx="0" dy="6" result="off" />
              <feComponentTransfer><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Steam blur */}
            <filter id="steamBlur"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>

          {/* Desk shadow on floor */}
          <ellipse cx="500" cy="820" rx="430" ry="60" fill="rgba(0,0,0,0.55)" filter="url(#steamBlur)" />

          {/* Rotating desk group — files spin with the wood */}
          <g className={cinematic ? "desk-rotate" : ""} style={{ transformOrigin: "500px 500px" }}>
            {/* Desk disc */}
            <circle cx="500" cy="500" r="430" fill="url(#deskWood)" />
            <circle cx="500" cy="500" r="430" fill="url(#woodGrain)" opacity="0.6" />
            <circle cx="500" cy="500" r="430" fill="url(#deskHighlight)" />
            {/* Desk edge ring */}
            <circle cx="500" cy="500" r="430" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="4" />
            <circle cx="500" cy="500" r="422" fill="none" stroke="rgba(255,200,140,0.12)" strokeWidth="1" />

            {/* ── Manila case file (bottom-left, tilted) ── */}
            <g transform="translate(230 560) rotate(-14)" filter="url(#objShadow)">
              <rect x="0" y="0" width="290" height="200" rx="4" fill="url(#manila)" />
              <rect x="0" y="0" width="290" height="14" fill="#7a5828" />
              <rect x="12" y="26" width="266" height="150" fill="url(#paperCream)" />
              {/* Redacted lines */}
              <rect x="24" y="42" width="180" height="8" fill="#2b2118" />
              <rect x="24" y="60" width="140" height="6" fill="rgba(30,20,10,0.55)" />
              <rect x="24" y="72" width="220" height="6" fill="rgba(30,20,10,0.55)" />
              <rect x="24" y="84" width="90" height="6" fill="rgba(30,20,10,0.55)" />
              <rect x="24" y="100" width="200" height="6" fill="rgba(30,20,10,0.35)" />
              <rect x="24" y="112" width="160" height="6" fill="rgba(30,20,10,0.35)" />
              {/* CLASSIFIED stamp */}
              <g transform="translate(150 130) rotate(-10)">
                <rect x="-58" y="-16" width="116" height="32" fill="none" stroke="#b81c1c" strokeWidth="3" />
                <text x="0" y="6" textAnchor="middle" fontFamily="'Bebas Neue', Impact, sans-serif" fontSize="22" fill="#b81c1c" letterSpacing="3">CLASSIFIED</text>
              </g>
              {/* Case number */}
              <text x="16" y="196" fontFamily="'Courier New', monospace" fontSize="10" fill="rgba(0,0,0,0.55)">CASE №-0417 / KHI</text>
            </g>

            {/* ── Loose report (top-right, tilted) ── */}
            <g transform="translate(560 210) rotate(12)" filter="url(#objShadow)">
              <rect x="0" y="0" width="230" height="290" fill="url(#paperCream)" />
              <rect x="16" y="20" width="200" height="12" fill="#1a120a" />
              <rect x="16" y="42" width="120" height="8" fill="rgba(0,0,0,0.5)" />
              {Array.from({ length: 10 }).map((_, i) => (
                <rect key={i} x="16" y={70 + i * 14} width={i % 3 === 0 ? 160 : 190} height="5" fill="rgba(30,20,10,0.45)" />
              ))}
              <rect x="16" y="220" width="60" height="60" fill="#1a120a" opacity="0.85" />
              <rect x="86" y="220" width="80" height="60" fill="rgba(30,20,10,0.25)" />
              <text x="115" y="270" textAnchor="middle" fontFamily="'Bebas Neue', Impact, sans-serif" fontSize="14" fill="#7a5828">EVIDENCE 03</text>
            </g>

            {/* ── Polaroid 1 (top-left) ── */}
            <g transform="translate(180 260) rotate(-9)" filter="url(#objShadow)">
              <rect x="0" y="0" width="150" height="180" fill="url(#polaroid)" />
              <rect x="10" y="10" width="130" height="130" fill="#0d1420" />
              {/* faint city silhouette */}
              <path d="M10 140 L10 90 L30 90 L30 70 L50 70 L50 100 L75 100 L75 60 L100 60 L100 95 L120 95 L120 80 L140 80 L140 140 Z" fill="rgba(120,180,220,0.28)" />
              <circle cx="115" cy="45" r="10" fill="rgba(245,200,90,0.5)" />
              <text x="75" y="165" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="10" fill="rgba(0,0,0,0.6)">SUBJECT · SEEN</text>
            </g>

            {/* ── Polaroid 2 (bottom-right) ── */}
            <g transform="translate(620 590) rotate(8)" filter="url(#objShadow)">
              <rect x="0" y="0" width="140" height="170" fill="url(#polaroid)" />
              <rect x="10" y="10" width="120" height="120" fill="#141014" />
              <circle cx="70" cy="65" r="28" fill="#3a2a20" />
              <circle cx="60" cy="58" r="4" fill="#e8e2d3" />
              <circle cx="80" cy="58" r="4" fill="#e8e2d3" />
              <path d="M55 78 Q70 88 85 78" stroke="#e8e2d3" strokeWidth="2" fill="none" />
              <text x="70" y="155" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="9" fill="rgba(0,0,0,0.6)">UNKNOWN CALLER</text>
            </g>

            {/* ── Sticky note ── */}
            <g transform="translate(430 220) rotate(-4)" filter="url(#objShadow)">
              <rect x="0" y="0" width="130" height="120" fill="#f5d24a" />
              <text x="12" y="30" fontFamily="'Courier New', monospace" fontSize="12" fill="#3a2a10">CALL BACK</text>
              <text x="12" y="52" fontFamily="'Courier New', monospace" fontSize="12" fill="#3a2a10">RE: BANK OTP</text>
              <text x="12" y="86" fontFamily="'Courier New', monospace" fontSize="10" fill="#3a2a10">— DO NOT SEND —</text>
            </g>

            {/* ── Notepad (left mid) ── */}
            <g transform="translate(100 460) rotate(-6)" filter="url(#objShadow)">
              <rect x="0" y="0" width="180" height="230" fill="#eae1c6" />
              <rect x="0" y="0" width="180" height="20" fill="#8a2b2b" />
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={i} x1="12" y1={40 + i * 20} x2="168" y2={40 + i * 20} stroke="rgba(80,110,160,0.4)" strokeWidth="1" />
              ))}
              <text x="16" y="56" fontFamily="'Caveat', 'Comic Sans MS', cursive" fontSize="14" fill="#1e2340">verify sender ✓</text>
              <text x="16" y="76" fontFamily="'Caveat', 'Comic Sans MS', cursive" fontSize="14" fill="#1e2340">who benefits?</text>
              <text x="16" y="96" fontFamily="'Caveat', 'Comic Sans MS', cursive" fontSize="14" fill="#1e2340">callback #</text>
            </g>

            {/* ── Paperclips ── */}
            <g transform="translate(500 300) rotate(20)">
              <path d="M0 0 h30 a10 10 0 0 1 0 20 h-24 a10 10 0 0 1 0 -20 h20" stroke="url(#chrome)" strokeWidth="3" fill="none" />
            </g>
            <g transform="translate(720 470) rotate(-40)">
              <path d="M0 0 h30 a10 10 0 0 1 0 20 h-24 a10 10 0 0 1 0 -20 h20" stroke="url(#chrome)" strokeWidth="3" fill="none" />
            </g>
            <g transform="translate(360 700) rotate(60)">
              <path d="M0 0 h30 a10 10 0 0 1 0 20 h-24 a10 10 0 0 1 0 -20 h20" stroke="url(#chrome)" strokeWidth="3" fill="none" />
            </g>

            {/* ── Fountain pen (diagonal) ── */}
            <g transform="translate(300 380) rotate(-30)" filter="url(#objShadow)">
              <rect x="0" y="0" width="220" height="16" rx="8" fill="#0d0d12" />
              <rect x="140" y="0" width="80" height="16" rx="8" fill="url(#chrome)" />
              <polygon points="220,0 250,8 220,16" fill="#1a1a20" />
              <polygon points="240,6 250,8 240,10" fill="#c9a84c" />
              <circle cx="30" cy="8" r="4" fill="#c9a84c" />
            </g>

            {/* ── Ballpoint pen ── */}
            <g transform="translate(540 640) rotate(18)" filter="url(#objShadow)">
              <rect x="0" y="0" width="180" height="10" rx="5" fill="#22d3ee" opacity="0.9" />
              <rect x="150" y="0" width="30" height="10" rx="5" fill="url(#chrome)" />
              <polygon points="180,0 195,5 180,10" fill="#111" />
              <rect x="4" y="-4" width="18" height="4" fill="url(#chrome)" />
            </g>

            {/* ── Magnifying glass ── */}
            <g transform="translate(700 320) rotate(25)" filter="url(#objShadow)">
              <circle cx="0" cy="0" r="46" fill="rgba(200,230,255,0.15)" stroke="#2a2a30" strokeWidth="6" />
              <circle cx="-10" cy="-14" r="10" fill="rgba(255,255,255,0.35)" />
              <rect x="30" y="30" width="72" height="12" rx="6" transform="rotate(45 30 30)" fill="#3a2a1a" stroke="#111" strokeWidth="2" />
            </g>

            {/* ── Rubber stamp (little) ── */}
            <g transform="translate(430 720) rotate(-8)" filter="url(#objShadow)">
              <rect x="0" y="20" width="70" height="24" rx="3" fill="#1c1c22" />
              <rect x="18" y="0" width="34" height="24" rx="2" fill="#2b1414" />
              <rect x="24" y="4" width="22" height="16" fill="#0f0808" />
              <text x="35" y="40" textAnchor="middle" fontFamily="'Bebas Neue',Impact,sans-serif" fontSize="10" fill="#c9a84c" letterSpacing="1">VERIFIED</text>
            </g>

            {/* ── Coffee mug + steam ── */}
            <g transform="translate(580 430)" filter="url(#objShadow)">
              {/* saucer */}
              <ellipse cx="60" cy="130" rx="90" ry="18" fill="#1a120a" opacity="0.7" />
              <ellipse cx="60" cy="128" rx="86" ry="15" fill="#3a2a1a" />
              {/* mug body */}
              <path d="M10 30 Q10 20 20 20 H100 Q110 20 110 30 V110 Q110 122 100 122 H20 Q10 122 10 110 Z" fill="url(#mug)" stroke="#2a2620" strokeWidth="2" />
              {/* handle */}
              <path d="M110 45 Q140 55 140 80 Q140 105 110 100" fill="none" stroke="url(#mug)" strokeWidth="10" />
              {/* rim */}
              <ellipse cx="60" cy="30" rx="50" ry="10" fill="#2a1c10" />
              <ellipse cx="60" cy="30" rx="46" ry="8" fill="url(#coffee)" />
              {/* highlight on coffee */}
              <ellipse cx="46" cy="28" rx="12" ry="3" fill="rgba(255,220,180,0.35)" />
            </g>

            {/* Steam — sits outside rotating desk group? Keep with mug so it moves too. */}
            <g transform="translate(640 400)" filter="url(#steamBlur)" opacity="0.85">
              <path className="steam steam-a" d="M0 0 C -14 -30, 14 -60, 0 -100 C -12 -140, 10 -170, -4 -210"
                fill="none" stroke="rgba(230,240,250,0.7)" strokeWidth="6" strokeLinecap="round" />
              <path className="steam steam-b" d="M20 0 C 8 -32, 32 -60, 20 -110 C 6 -150, 28 -180, 16 -220"
                fill="none" stroke="rgba(220,230,240,0.55)" strokeWidth="5" strokeLinecap="round" />
              <path className="steam steam-c" d="M-14 0 C -28 -28, -4 -58, -18 -108 C -32 -150, -8 -180, -22 -220"
                fill="none" stroke="rgba(210,220,235,0.45)" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* ── Raccoon paperweight (tiny) ── */}
            <g transform="translate(470 470)" filter="url(#objShadow)">
              {/* base disc */}
              <ellipse cx="0" cy="26" rx="30" ry="6" fill="rgba(0,0,0,0.55)" />
              {/* body */}
              <ellipse cx="0" cy="10" rx="26" ry="20" fill="url(#racFur)" />
              {/* head */}
              <circle cx="0" cy="-10" r="18" fill="url(#racFur)" />
              {/* ears */}
              <path d="M-16 -22 L-10 -32 L-6 -22 Z" fill="#2a2d33" />
              <path d="M16 -22 L10 -32 L6 -22 Z" fill="#2a2d33" />
              <path d="M-14 -22 L-10 -28 L-8 -22 Z" fill="#8b8f96" />
              <path d="M14 -22 L10 -28 L8 -22 Z" fill="#8b8f96" />
              {/* mask */}
              <path d="M-16 -10 Q0 0 16 -10 Q10 -2 0 -2 Q-10 -2 -16 -10 Z" fill="#111318" />
              {/* eyes */}
              <circle cx="-6" cy="-8" r="2.2" fill="#f5efe0" />
              <circle cx="6" cy="-8" r="2.2" fill="#f5efe0" />
              <circle cx="-6" cy="-8" r="1" fill="#0a0a0a" />
              <circle cx="6" cy="-8" r="1" fill="#0a0a0a" />
              {/* snout */}
              <ellipse cx="0" cy="-2" rx="4" ry="3" fill="#e6dcc6" />
              <circle cx="0" cy="-3" r="1.4" fill="#111" />
              {/* tail rings */}
              <path d="M22 16 Q40 8 42 -6" stroke="#4a4e55" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M28 10 L34 6" stroke="#e6dcc6" strokeWidth="2" />
              <path d="M34 4 L40 0" stroke="#e6dcc6" strokeWidth="2" />
            </g>
          </g>

          {/* Static overlay — desk-lamp catchlight (does NOT rotate) */}
          <ellipse cx="500" cy="330" rx="360" ry="200" fill="url(#deskHighlight)" opacity="0.35" pointerEvents="none" />
        </svg>

        {/* Caption below the scene — pure decoration */}
        <div className="absolute inset-x-0 -bottom-2 sm:bottom-4 text-center pointer-events-none">
          <div className="stencil text-[10px] tracking-[0.35em] text-cyan-300/70">
            // THE DESK · CASE FILES · COLD COFFEE · NO ACCOUNTS
          </div>
        </div>
      </div>
    </section>
  );
}

export default DetectiveDeskScene;

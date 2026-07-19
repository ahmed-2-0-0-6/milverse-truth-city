// LAYER-1 — Detective desk ambient scene.
// Renders as a background layer inside the first story beat. SVG-only so it
// stays crisp at any size and cheap on the paint thread. The whole tabletop
// rotates in a very slow circle; individual props drift, coffee steams,
// desk lamp breathes, raccoon paperweight keeps watch.
//
// Presentation-only: no state, no data. Respects prefers-reduced-motion via
// CSS (defined in styles.css under /* Detective desk */).

type DetectiveDeskProps = {
  className?: string;
};

export function DetectiveDesk({ className = "" }: DetectiveDeskProps) {
  return (
    <div
      className={`detective-desk pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* Warm desk-lamp pool bleeding through the ink */}
      <div className="desk-lamp-pool" />

      <svg
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          {/* Circular walnut tabletop */}
          <radialGradient id="dd-wood" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#3a2617" />
            <stop offset="55%" stopColor="#25170d" />
            <stop offset="100%" stopColor="#0d0805" />
          </radialGradient>
          <radialGradient id="dd-wood-rim" cx="50%" cy="50%" r="50%">
            <stop offset="90%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.85)" />
          </radialGradient>
          {/* Wood grain — subtle concentric noise */}
          <pattern id="dd-grain" x="0" y="0" width="1200" height="900" patternUnits="userSpaceOnUse">
            <ellipse cx="600" cy="450" rx="380" ry="360" fill="none" stroke="rgba(255,220,180,0.03)" strokeWidth="1" />
            <ellipse cx="600" cy="450" rx="300" ry="280" fill="none" stroke="rgba(255,220,180,0.025)" strokeWidth="1" />
            <ellipse cx="600" cy="450" rx="220" ry="210" fill="none" stroke="rgba(255,220,180,0.02)" strokeWidth="1" />
            <ellipse cx="600" cy="450" rx="150" ry="140" fill="none" stroke="rgba(255,220,180,0.02)" strokeWidth="1" />
          </pattern>

          {/* Warm lamp glow */}
          <radialGradient id="dd-lamp" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(255,180,90,0.35)" />
            <stop offset="35%" stopColor="rgba(255,140,60,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Case-file paper */}
          <linearGradient id="dd-paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2ead3" />
            <stop offset="100%" stopColor="#d8caa2" />
          </linearGradient>
          <linearGradient id="dd-paper-manila" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a86a" />
            <stop offset="100%" stopColor="#a67a3f" />
          </linearGradient>
          <linearGradient id="dd-paper-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a2a25" />
            <stop offset="100%" stopColor="#4d1512" />
          </linearGradient>

          {/* Coffee */}
          <radialGradient id="dd-coffee" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#3b1e0d" />
            <stop offset="80%" stopColor="#1a0c05" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="dd-cup" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4efe6" />
            <stop offset="80%" stopColor="#c9c2b3" />
            <stop offset="100%" stopColor="#6c6558" />
          </radialGradient>

          {/* Vignette on top of everything */}
          <radialGradient id="dd-vignette" cx="50%" cy="55%" r="70%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.85)" />
          </radialGradient>

          {/* Steam blur */}
          <filter id="dd-steam-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          {/* Paper drop shadow */}
          <filter id="dd-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="2" dy="4" result="off" />
            <feComponentTransfer><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ---------- rotating tabletop ---------- */}
        <g className="dd-table" style={{ transformOrigin: "600px 500px" }}>
          {/* Wood disc */}
          <circle cx="600" cy="500" r="560" fill="url(#dd-wood)" />
          <circle cx="600" cy="500" r="560" fill="url(#dd-grain)" />
          <circle cx="600" cy="500" r="560" fill="url(#dd-wood-rim)" />
          {/* subtle scratches */}
          <g stroke="rgba(255,220,180,0.05)" strokeWidth="0.6" fill="none">
            <path d="M 320 300 Q 500 340 720 320" />
            <path d="M 400 640 Q 600 660 820 620" />
            <path d="M 260 480 Q 400 500 540 470" />
          </g>

          {/* Warm lamp pool baked into the wood */}
          <circle cx="600" cy="470" r="500" fill="url(#dd-lamp)" />

          {/* ---------- scattered case files ---------- */}
          {/* red file, back-left */}
          <g transform="translate(220 260) rotate(-14)" filter="url(#dd-shadow)" className="dd-paper dd-drift-a">
            <rect x="0" y="0" width="220" height="280" rx="3" fill="url(#dd-paper-red)" />
            <rect x="12" y="14" width="196" height="24" fill="rgba(0,0,0,0.35)" />
            <text x="20" y="32" fontFamily="'JetBrains Mono', monospace" fontSize="14" fill="#f2ead3" letterSpacing="2">CASE · 0447</text>
            <rect x="20" y="60" width="120" height="6" fill="rgba(242,234,211,0.55)" />
            <rect x="20" y="76" width="180" height="4" fill="rgba(242,234,211,0.35)" />
            <rect x="20" y="88" width="150" height="4" fill="rgba(242,234,211,0.35)" />
            <rect x="20" y="120" width="180" height="90" fill="rgba(0,0,0,0.35)" />
            <text x="30" y="140" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="rgba(242,234,211,0.7)">CLASSIFIED</text>
          </g>

          {/* manila folder, center-back */}
          <g transform="translate(500 200) rotate(6)" filter="url(#dd-shadow)" className="dd-paper dd-drift-b">
            <rect x="0" y="0" width="260" height="200" rx="4" fill="url(#dd-paper-manila)" />
            <rect x="0" y="0" width="120" height="18" rx="3" fill="#8f6431" />
            <text x="12" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#f2ead3" letterSpacing="1.5">DOSSIER · 12B</text>
            <rect x="16" y="36" width="228" height="150" fill="url(#dd-paper)" />
            <rect x="30" y="52" width="140" height="5" fill="rgba(60,40,20,0.5)" />
            <rect x="30" y="66" width="200" height="3" fill="rgba(60,40,20,0.3)" />
            <rect x="30" y="76" width="180" height="3" fill="rgba(60,40,20,0.3)" />
            <rect x="30" y="86" width="150" height="3" fill="rgba(60,40,20,0.3)" />
            {/* portrait redaction */}
            <rect x="30" y="102" width="70" height="70" fill="#3a2c18" />
            <rect x="34" y="106" width="62" height="8" fill="#1a1408" />
            <rect x="110" y="106" width="120" height="4" fill="rgba(60,40,20,0.4)" />
            <rect x="110" y="118" width="100" height="4" fill="rgba(60,40,20,0.4)" />
            <rect x="110" y="130" width="115" height="4" fill="rgba(60,40,20,0.4)" />
            <rect x="110" y="160" width="90" height="10" fill="#8a2a25" />
          </g>

          {/* loose paper, right */}
          <g transform="translate(800 320) rotate(9)" filter="url(#dd-shadow)" className="dd-paper dd-drift-c">
            <rect x="0" y="0" width="200" height="260" rx="2" fill="url(#dd-paper)" />
            <text x="16" y="30" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="#3a2c18" letterSpacing="2">TRANSCRIPT</text>
            <line x1="16" y1="40" x2="184" y2="40" stroke="#3a2c18" strokeWidth="0.8" />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x="16" y={54 + i * 14} width={80 + ((i * 37) % 100)} height="3" fill="rgba(60,40,20,0.55)" />
            ))}
            {/* red stamp */}
            <g transform="translate(110 190) rotate(-12)">
              <rect x="0" y="0" width="80" height="30" fill="none" stroke="#8a2a25" strokeWidth="2" />
              <text x="8" y="20" fontFamily="'Bebas Neue', sans-serif" fontSize="18" fill="#8a2a25" letterSpacing="2">VERIFIED</text>
            </g>
            {/* paper clip */}
            <g transform="translate(150 -6)">
              <path d="M 0 0 q 8 0 8 8 v 30 q 0 6 -6 6 t -6 -6 v -22" fill="none" stroke="#c9c9d0" strokeWidth="2.2" />
              <path d="M 2 8 v 26" fill="none" stroke="#8f8f95" strokeWidth="1" />
            </g>
          </g>

          {/* small note, front-left */}
          <g transform="translate(320 620) rotate(-6)" filter="url(#dd-shadow)" className="dd-paper dd-drift-b">
            <rect x="0" y="0" width="150" height="120" rx="2" fill="#f4d97a" />
            <text x="12" y="24" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fill="#3a2c18">check the</text>
            <text x="12" y="42" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fill="#3a2c18">timestamps —</text>
            <text x="12" y="66" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontStyle="italic" fill="#8a2a25">they lied.</text>
            <line x1="12" y1="86" x2="120" y2="86" stroke="rgba(60,40,20,0.35)" strokeWidth="1" />
          </g>

          {/* Polaroid */}
          <g transform="translate(560 660) rotate(4)" filter="url(#dd-shadow)" className="dd-paper dd-drift-a">
            <rect x="0" y="0" width="140" height="170" fill="#f2ead3" />
            <rect x="10" y="10" width="120" height="120" fill="#0f1a2a" />
            {/* faint face silhouette */}
            <circle cx="70" cy="70" r="26" fill="#233248" />
            <rect cx="70" y="96" width="60" height="34" x="40" fill="#1a2536" />
            <text x="14" y="152" fontFamily="'Space Grotesk', sans-serif" fontSize="10" fill="#3a2c18">SUBJECT · UNKNOWN</text>
          </g>

          {/* ---------- pens & tools ---------- */}
          {/* fountain pen */}
          <g transform="translate(760 620) rotate(28)" className="dd-drift-c">
            <rect x="0" y="0" width="180" height="10" rx="4" fill="#111" />
            <rect x="0" y="0" width="60" height="10" rx="4" fill="#2a2018" />
            <polygon points="180,0 200,5 180,10" fill="#c9a24a" />
            <circle cx="60" cy="5" r="2.5" fill="#c9a24a" />
          </g>
          {/* pencil */}
          <g transform="translate(280 500) rotate(-22)" className="dd-drift-a">
            <rect x="0" y="0" width="170" height="8" rx="1" fill="#e4b73b" />
            <rect x="150" y="0" width="14" height="8" fill="#c98a2a" />
            <rect x="164" y="0" width="6" height="8" fill="#4a3418" />
            <polygon points="0,0 -14,4 0,8" fill="#f2ead3" />
            <polygon points="0,0 -8,4 0,8" fill="#111" />
          </g>
          {/* paper clips scattered */}
          <g transform="translate(470 480)" className="dd-drift-b">
            <path d="M 0 0 q 8 0 8 8 v 22 q 0 6 -6 6 t -6 -6 v -16" fill="none" stroke="#c9c9d0" strokeWidth="2" />
          </g>
          <g transform="translate(720 260) rotate(40)" className="dd-drift-c">
            <path d="M 0 0 q 8 0 8 8 v 22 q 0 6 -6 6 t -6 -6 v -16" fill="none" stroke="#c9c9d0" strokeWidth="2" />
          </g>

          {/* magnifying glass */}
          <g transform="translate(430 380) rotate(-18)" filter="url(#dd-shadow)" className="dd-drift-b">
            <circle cx="0" cy="0" r="46" fill="rgba(180,220,255,0.08)" stroke="#c9a24a" strokeWidth="4" />
            <circle cx="0" cy="0" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <path d="M 33 33 L 78 78" stroke="#4a3418" strokeWidth="8" strokeLinecap="round" />
            <path d="M 33 33 L 78 78" stroke="#c9a24a" strokeWidth="3" strokeLinecap="round" />
            {/* lens highlight */}
            <ellipse cx="-14" cy="-16" rx="14" ry="8" fill="rgba(255,255,255,0.25)" />
          </g>

          {/* ---------- coffee cup ---------- */}
          <g transform="translate(870 500)" className="dd-cup" filter="url(#dd-shadow)">
            {/* saucer */}
            <ellipse cx="0" cy="6" rx="86" ry="24" fill="#1a1108" />
            <ellipse cx="0" cy="4" rx="82" ry="22" fill="url(#dd-cup)" />
            <ellipse cx="0" cy="2" rx="72" ry="18" fill="#0d0805" />
            {/* cup body (top-down) */}
            <ellipse cx="0" cy="-4" rx="60" ry="18" fill="url(#dd-cup)" />
            <ellipse cx="0" cy="-6" rx="55" ry="16" fill="url(#dd-coffee)" />
            {/* handle */}
            <path d="M 55 -8 q 24 0 24 12 t -24 12" fill="none" stroke="#c9c2b3" strokeWidth="6" />
            {/* crema highlight */}
            <ellipse cx="-14" cy="-10" rx="16" ry="4" fill="rgba(255,220,180,0.15)" />
          </g>

          {/* ---------- raccoon paperweight (tiny) ---------- */}
          <g transform="translate(660 470)" className="dd-raccoon">
            {/* body/base */}
            <ellipse cx="0" cy="14" rx="28" ry="10" fill="#0b0b0f" />
            {/* head */}
            <circle cx="0" cy="0" r="20" fill="#2e2a2f" />
            <circle cx="0" cy="4" r="18" fill="#3a3438" />
            {/* ears */}
            <path d="M -18 -14 l -6 -10 l 10 -2 z" fill="#2e2a2f" />
            <path d="M 18 -14 l 6 -10 l -10 -2 z" fill="#2e2a2f" />
            <path d="M -16 -12 l -3 -6 l 6 -1 z" fill="#5a4a48" />
            <path d="M 16 -12 l 3 -6 l -6 -1 z" fill="#5a4a48" />
            {/* mask */}
            <path d="M -16 2 q 16 -10 32 0 q 0 8 -16 8 q -16 0 -16 -8 z" fill="#0b0b0f" />
            {/* eyes */}
            <circle cx="-7" cy="4" r="2.6" fill="#ffdc73" className="dd-eye" />
            <circle cx="7" cy="4" r="2.6" fill="#ffdc73" className="dd-eye" />
            <circle cx="-7" cy="4" r="1" fill="#111" />
            <circle cx="7" cy="4" r="1" fill="#111" />
            {/* snout */}
            <ellipse cx="0" cy="12" rx="6" ry="4" fill="#c9c2b3" />
            <circle cx="0" cy="10" r="1.6" fill="#111" />
            {/* muzzle stripe */}
            <path d="M 0 12 v 4" stroke="#111" strokeWidth="0.8" />
            {/* tiny "PAPERWEIGHT" pedestal */}
            <rect x="-30" y="20" width="60" height="4" fill="#c9a24a" opacity="0.35" />
          </g>

          {/* inkwell */}
          <g transform="translate(200 400)" filter="url(#dd-shadow)">
            <ellipse cx="0" cy="14" rx="26" ry="8" fill="#0b0b0f" />
            <rect x="-22" y="-4" width="44" height="20" rx="4" fill="#141018" />
            <ellipse cx="0" cy="-4" rx="22" ry="6" fill="#0a0a10" />
            <ellipse cx="0" cy="-5" rx="16" ry="4" fill="#050508" />
          </g>
        </g>

        {/* ---------- steam (outside table so it doesn't rotate) ---------- */}
        <g transform="translate(870 490)" filter="url(#dd-steam-blur)" opacity="0.7">
          <path className="dd-steam dd-steam-a" d="M -10 0 q -8 -30 6 -60 q 10 -30 -4 -60" fill="none" stroke="rgba(230,235,245,0.45)" strokeWidth="6" strokeLinecap="round" />
          <path className="dd-steam dd-steam-b" d="M 4 0 q 10 -34 -4 -66 q -10 -28 6 -58" fill="none" stroke="rgba(230,235,245,0.35)" strokeWidth="5" strokeLinecap="round" />
          <path className="dd-steam dd-steam-c" d="M 18 0 q -6 -28 8 -58 q 10 -26 -6 -54" fill="none" stroke="rgba(230,235,245,0.3)" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Lamp breathing highlight */}
        <ellipse cx="600" cy="450" rx="520" ry="360" fill="url(#dd-lamp)" className="dd-lamp-breath" />

        {/* Vignette caps the top so it blends into the beat text */}
        <rect width="1200" height="900" fill="url(#dd-vignette)" />
      </svg>

      {/* Dust motes / lens grain over the top */}
      <div className="dd-dust" />
    </div>
  );
}

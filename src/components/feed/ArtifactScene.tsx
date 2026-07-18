// MILVERSE — ArtifactScene: CSS-art "media" for in-world artifacts.
// Turns the flat emoji-on-gray placeholder into something that reads as a
// captured photo / screen-grab: layered gradient scene, vignette, scrim,
// file-metadata chrome. Deterministic per artifact (no randomness), no real
// images, no real people — the subject stays an abstract emoji-mark treated
// as part of the composition.

interface SceneStyle {
  /** Layered background (scene). */
  bg: string;
  /** Accent for the glow behind the subject. */
  glow: string;
}

// Scene palette keyed by the artifact's subject emoji. Each is a layered
// gradient that suggests a place (dusk street, flood water, clinic light)
// without depicting anyone.
const SCENES: Record<string, SceneStyle> = {
  "🌊": {
    bg: "linear-gradient(180deg, #24435f 0%, #1b3348 40%, #10222f 100%)",
    glow: "rgba(96, 165, 250, 0.35)",
  },
  "🚐": {
    bg: "linear-gradient(180deg, #3b3347 0%, #2a2438 55%, #191521 100%)",
    glow: "rgba(196, 181, 253, 0.3)",
  },
  "🏙️": {
    bg: "linear-gradient(180deg, #452f3b 0%, #33212f 50%, #1c1420 100%)",
    glow: "rgba(251, 146, 60, 0.3)",
  },
  "🩺": {
    bg: "linear-gradient(180deg, #173f43 0%, #122f34 55%, #0b1d21 100%)",
    glow: "rgba(45, 212, 191, 0.32)",
  },
  "💊": {
    bg: "linear-gradient(180deg, #3f2f17 0%, #302312 55%, #1d150a 100%)",
    glow: "rgba(251, 191, 36, 0.3)",
  },
  "🌿": {
    bg: "linear-gradient(180deg, #1d3d29 0%, #16301f 55%, #0d1d13 100%)",
    glow: "rgba(134, 239, 172, 0.3)",
  },
  "🌍": {
    bg: "linear-gradient(180deg, #1e3a4f 0%, #172c3e 55%, #0e1a26 100%)",
    glow: "rgba(125, 211, 252, 0.32)",
  },
  "📱": {
    bg: "linear-gradient(180deg, #3d2a4f 0%, #2c1f3a 55%, #191223 100%)",
    glow: "rgba(232, 121, 249, 0.3)",
  },
  "💻": {
    bg: "linear-gradient(180deg, #232c45 0%, #1a2136 55%, #0f1322 100%)",
    glow: "rgba(129, 140, 248, 0.32)",
  },
};

const FALLBACK: SceneStyle = {
  bg: "linear-gradient(180deg, #31343c 0%, #24262d 55%, #15161b 100%)",
  glow: "rgba(148, 163, 184, 0.3)",
};

/** Tiny deterministic hash for per-artifact variation. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}

export function ArtifactScene({
  emoji,
  alt,
  seed,
  aspect = "video",
  chrome = "photo",
}: {
  emoji?: string;
  alt?: string;
  /** Any stable string (case id / headline) — drives file-name chrome. */
  seed: string;
  aspect?: "video" | "square";
  /** photo = camera file chrome; screenshot = crop hint; none = bare. */
  chrome?: "photo" | "screenshot" | "none";
}) {
  const scene = SCENES[emoji ?? ""] ?? FALLBACK;
  const h = hash(seed);
  const fileName = `IMG-2026${String((h % 89) + 10)}${String((h % 899) + 100)}-WA00${(h % 90) + 10}`;
  const fileSize = `${((h % 26) + 5) / 10} MB`;

  return (
    <div
      role="img"
      aria-label={alt ?? "Forwarded image"}
      className={`relative overflow-hidden ${aspect === "square" ? "aspect-square" : "aspect-video"}`}
      style={{ background: scene.bg }}
    >
      {/* light shafts + haze — makes it read as a lens capture, not a flat fill */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 75% 55% at ${30 + (h % 40)}% 28%, ${scene.glow}, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "repeating-linear-gradient(115deg, transparent 0px, transparent 18px, rgba(255,255,255,0.02) 18px, rgba(255,255,255,0.02) 20px)",
        }}
      />
      {/* subject */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-6xl sm:text-7xl"
          style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.55)) saturate(0.9)" }}
        >
          {emoji ?? "🖼️"}
        </span>
      </div>
      {/* vignette + bottom scrim */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%), linear-gradient(180deg, transparent 68%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {chrome === "photo" && (
        <div
          aria-hidden
          className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between font-mono text-[8px] tracking-wider text-white/45"
        >
          <span>{fileName}.jpg</span>
          <span>{fileSize}</span>
        </div>
      )}
      {chrome === "screenshot" && (
        <div
          aria-hidden
          className="absolute bottom-1.5 left-2 font-mono text-[8px] tracking-wider text-white/45"
        >
          screen capture · cropped
        </div>
      )}
    </div>
  );
}

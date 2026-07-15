// LAYER-3 — Animated district page header. Ken-Burns drift + fog layer +
// occasional neon flicker on the title. Duotone/vignette treatment.
// LITE / prefers-reduced-motion → static image, no drift, no flicker.

import { useVisualMode } from "@/lib/visual-quality";

interface Props {
  art: string;
  title: string;
  tag?: string;
  /** rgb triplet like "34,211,238" for the district's accent glow */
  glow?: string;
  className?: string;
}

export function DistrictHeader({ art, title, tag, glow = "34,211,238", className = "" }: Props) {
  const { mode } = useVisualMode();
  const cinematic = mode === "cinematic";

  return (
    <header
      className={`district-header relative w-full overflow-hidden border-b border-white/10 ${className}`}
      style={{ height: "clamp(220px, 34vh, 360px)" }}
    >
      {/* Base art with Ken-Burns drift */}
      <img
        src={art}
        alt=""
        loading="lazy"
        decoding="async"
        width={1536}
        height={1024}
        className={`absolute inset-0 h-full w-full object-cover ${cinematic ? "kenburns" : ""}`}
        style={{ filter: "contrast(1.08) saturate(0.75) brightness(0.6)" }}
      />

      {/* Duotone tint + vignette */}
      <div className="absolute inset-0 mix-blend-multiply" style={{
        background: `linear-gradient(180deg, rgba(4,8,14,0.35), rgba(0,0,0,0.75))`,
      }} />
      <div className="absolute inset-0" style={{
        background: `radial-gradient(120% 80% at 50% 40%, transparent 55%, rgba(0,0,0,0.85) 100%)`,
      }} />

      {/* Fog layer */}
      {cinematic && (
        <div className="fog-drift absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" aria-hidden style={{
          backgroundImage:
            "radial-gradient(60% 40% at 20% 60%, rgba(180,200,220,0.35), transparent 60%)," +
            "radial-gradient(50% 35% at 80% 40%, rgba(140,170,200,0.3), transparent 65%)",
          backgroundSize: "200% 200%",
        }} />
      )}

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none" aria-hidden style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
        backgroundSize: "3px 3px",
      }} />

      {/* Copy */}
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-8 pb-6 max-w-6xl mx-auto">
        {tag && (
          <div className="stencil text-[10px] mb-2" style={{ color: `rgb(${glow})` }}>
            {tag}
          </div>
        )}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.9] text-white ${cinematic ? "neon-flicker" : ""}`}
          style={{
            fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif',
            textShadow: `0 0 24px rgba(${glow},0.5), 0 0 6px rgba(${glow},0.9)`,
          }}
        >
          {title}
        </h1>
      </div>
    </header>
  );
}

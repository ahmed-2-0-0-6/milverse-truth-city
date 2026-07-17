// LAYER-3 — DistrictHero. Full-bleed cinematic banner for a district index.
// Uses the district's key art (cracked mirror, flooded feed, etc.) as a
// movie-poster backdrop, with the district thesis set over it. This is the
// first thing a player sees entering a wing — it should feel like a title card.
//
// LITE / prefers-reduced-motion → static art, no drift, no flicker.
// The art is decorative (aria-hidden); the heading carries the real semantics.

import { type ReactNode } from "react";
import { useVisualMode } from "@/lib/visual-quality";
import { DistrictLiveFX, type DistrictKey } from "@/components/DistrictLiveFX";

interface Props {
  art: string;
  kicker: string; // "CHAPTER 01 · THE MIRROR"
  title: string; // big display headline
  thesis: ReactNode; // one or two sentences; may include highlighted spans
  /** rgb triplet like "34,211,238" for the district's accent glow */
  glow?: string;
  district?: DistrictKey;
  /** rooted-in note shown as a small caution pill under the thesis */
  rooted?: string;
  /** right-aligned slot (progress, share-code entry, etc.) */
  aside?: ReactNode;
}

export function DistrictHero({
  art,
  kicker,
  title,
  thesis,
  glow = "34,211,238",
  district,
  rooted,
  aside,
}: Props) {
  const { mode } = useVisualMode();
  const cinematic = mode === "cinematic";

  return (
    <header className="district-hero relative w-full overflow-hidden border-b border-white/10">
      {/* Base art with Ken-Burns drift */}
      <img
        src={art}
        alt=""
        aria-hidden
        loading="eager"
        decoding="async"
        width={1536}
        height={1024}
        className={`absolute inset-0 h-full w-full object-cover ${cinematic ? "kenburns" : ""}`}
        style={{ filter: "contrast(1.06) saturate(0.8) brightness(0.62)" }}
      />

      {/* Left-to-right readability scrim + bottom fade into the page */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(4,6,10,0.92) 0%, rgba(4,6,10,0.72) 42%, rgba(4,6,10,0.25) 100%)," +
            "linear-gradient(0deg, var(--color-background) 2%, transparent 45%)",
        }}
      />

      {/* District-specific live overlay (rain, ripples…) */}
      {cinematic && district && <DistrictLiveFX district={district} />}

      {/* Fine grain */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Copy */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-8 py-14 sm:py-20 md:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="stencil text-[10px] sm:text-[11px] mb-3" style={{ color: `rgb(${glow})` }}>
              {kicker}
            </div>
            <h1
              className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.88] text-white ${
                cinematic ? "neon-flicker" : ""
              }`}
              style={{
                fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif',
                textShadow: `0 0 28px rgba(${glow},0.45), 0 0 6px rgba(${glow},0.85)`,
              }}
            >
              {title}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed">{thesis}</p>
            {rooted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-caution/40 bg-black/40 px-3 py-1 text-[11px] font-mono tracking-widest text-caution backdrop-blur-sm">
                🇵🇰 {rooted}
              </div>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      </div>
    </header>
  );
}

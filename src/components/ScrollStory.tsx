// LAYER-7 — Scroll-driven story beats. GSAP ScrollTrigger + horizontal districts.
// Lazy imports GSAP; respects reduced-motion (renders static).
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DistrictLiveFX, type DistrictKey } from "@/components/DistrictLiveFX";
import { MilCityScene } from "@/components/MilCityScene";


import mirrorArt from "@/assets/district-mirror.jpg";
import feedArt from "@/assets/district-feed.jpg";
import studioArt from "@/assets/district-studio.jpg";
import archiveArt from "@/assets/district-archive.jpg";
import cleanroomArt from "@/assets/district-cleanroom.jpg";
import gothamDeskArt from "@/assets/detective-desk-gotham.jpg";
import gothamBoardPortraitArt from "@/assets/detective-board-gotham-wide.jpg";
import gothamCrimeSceneArt from "@/assets/detective-crime-scene-gotham.jpg";
import gothamRooftopArt from "@/assets/detective-rooftop-gotham.jpg";

const BEAT_BACKDROPS: (string | undefined)[] = [
  undefined,
  gothamBoardPortraitArt,
  gothamCrimeSceneArt,
  undefined, // beat 4 uses live <MilCityScene />
];
// Keep reference so lint doesn't complain if the rooftop asset lingers.
void gothamRooftopArt;


type District = {
  key: string;
  label: string;
  tag: string;
  art: string;
  video?: string;
  href: string;
  glow: string;
};
const DISTRICTS: District[] = [
  {
    key: "mirror",
    label: "THE MIRROR",
    tag: "Judge messages aimed at you — real family, or someone wearing them?",
    art: mirrorArt,
    href: "/mirror",
    glow: "34,211,238",
  },
  {
    key: "feed",
    label: "THE FEED",
    tag: "Judge real-world posts — true, false, or misleading?",
    art: feedArt,
    href: "/feed",
    glow: "245,185,66",
  },
  {
    key: "studio",
    label: "THE STUDIO",
    tag: "Design the attack yourself — teach by authoring.",
    art: studioArt,
    href: "/studio",
    glow: "245,185,66",
  },
  {
    key: "archive",
    label: "THE ARCHIVE",
    tag: "Revisit closed cases — build the pattern memory.",
    art: archiveArt,
    href: "/archive",
    glow: "34,211,238",
  },
  {
    key: "cleanroom",
    label: "CLEAN ROOM",
    tag: "Calibrate confidence — know when you know.",
    art: cleanroomArt,
    href: "/devintel",
    glow: "34,211,238",
  },
];

const BEATS = [
  {
    eyebrow: "CASE ARRIVAL",
    headline: "Every day, someone in your family gets a message.",
    sub: "It's already happened this week. Maybe today.",
  },
  {
    eyebrow: "EVIDENCE BOARD",
    headline: "It looks real. It sounds real.",
    sub: "Perfect grammar. Familiar face. Small ask.",
  },
  {
    eyebrow: "THE COUNTER-MOVE",
    headline: "Spotting fakes is dying. Verifying is forever.",
    sub: "You can't out-see a machine. You can out-verify one.",
  },
  {
    eyebrow: "ENTER THE CITY",
    headline: "This is MILVERSE.",
    sub: "Walk in as a target. Walk out as a designer.",
    finale: true,
  },
];

const MIL_TRIAD = [
  { word: "MEDIA", line: "Every format a lie can wear: posts, forwards, headlines, images." },
  {
    word: "INFORMATION",
    line: "Name the manipulation: misinformation, disinformation, malinformation.",
  },
  { word: "LITERACY", line: "Learn the counter-move, then design your own cases." },
];

export function ScrollStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [submerging, setSubmerging] = useState<string | null>(null);

  function submerge(href: string, key: string) {
    if (submerging) return;
    setSubmerging(key);
    window.setTimeout(() => {
      (navigate as unknown as (opts: { to: string }) => void)({ to: href });
    }, 720);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Beat pins + reveals
        gsap.utils.toArray<HTMLElement>(".story-beat").forEach((el) => {
          gsap.from(el.querySelectorAll(".beat-line"), {
            yPercent: 40,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: el,
              start: "top 70%",
              end: "bottom top",
              toggleActions: "play none none reverse",
            },
          });
          if (!el.classList.contains("story-beat--image") && !el.classList.contains("finale-beat") && !el.classList.contains("thesis-beat")) {
            gsap.to(el.querySelector(".beat-bg"), {
              yPercent: -20,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
            });
          }

        });

        // Horizontal district gallery
        const track = trackRef.current;
        const wrap = horizontalRef.current;
        if (track && wrap && window.innerWidth >= 768) {
          const distance = track.scrollWidth - window.innerWidth + 32;
          gsap.to(track, {
            x: -distance,
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "top top",
              end: () => `+=${distance}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });
        }

        // Numbers count up
        gsap.utils.toArray<HTMLElement>(".count-num").forEach((el) => {
          const target = Number(el.dataset.target || "0");
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString();
            },
          });
        });
      }, rootRef);

      cleanup = () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);




  return (
    <div ref={rootRef} className="scrollstory relative isolate">
      {/* Gotham detective-desk backdrop — sticks to viewport across the whole ScrollStory. */}
      <div
        className="pointer-events-none sticky top-0 left-0 z-0 h-screen w-full overflow-hidden"
        style={{ marginBottom: "-100vh" }}
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage: `url(${gothamDeskArt})`,
            filter: "saturate(0.85) contrast(1.05)",
            transform: "scale(1.05)",
          }}
        />
        {/* Cold Gotham teal wash + vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 40%, transparent 30%, rgba(3,6,12,0.55) 70%, rgba(0,0,0,0.9) 100%), linear-gradient(180deg, rgba(10,20,35,0.35) 0%, rgba(5,8,14,0.6) 100%)",
          }}
        />
        {/* Subtle bat-signal flicker glow behind the window */}
        <div
          className="absolute left-1/2 top-[18%] h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(140,190,255,0.55), transparent 70%)" }}
        />
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
      </div>






      {/* Story beats */}
      {BEATS.map((b, i) => (
        <section
          key={i}
          className={`story-beat relative min-h-screen flex items-center justify-center overflow-hidden px-6 ${BEAT_BACKDROPS[i] ? "story-beat--image" : ""} ${b.finale ? "finale-beat" : ""}`}
        >
          <div className={`beat-bg pointer-events-none absolute z-[1] ${b.finale ? "inset-0" : "-inset-y-[24vh] inset-x-0"}`} aria-hidden>

            {BEAT_BACKDROPS[i] && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-70 blur-sm scale-105"
                  style={{
                    backgroundImage: `url(${BEAT_BACKDROPS[i]})`,
                    filter: "saturate(0.9) contrast(1.06) blur(8px)",
                  }}
                />
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${BEAT_BACKDROPS[i]})`,
                    filter: "saturate(0.96) contrast(1.14)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(72% 44% at 50% 52%, rgba(3,6,12,0.2) 0%, rgba(3,6,12,0.44) 58%, rgba(0,0,0,0.82) 100%), linear-gradient(180deg, rgba(10,20,35,0.12) 0%, rgba(5,8,14,0.3) 100%)",
                  }}
                />
              </>
            )}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "3px 3px",
              }}
            />
            {i === 3 && <MilCityScene />}
          </div>


          <div className="beat-copy relative z-[2] max-w-5xl text-center">

            <div className="beat-overline beat-line mb-7">
              <span>{b.eyebrow}</span>
              <span>BEAT · 0{i + 1} / 04</span>
            </div>
            <TypedHeadline text={b.headline} />
            <p className="beat-line beat-subtitle mt-6 max-w-xl mx-auto">
              {b.sub}
            </p>
            {b.finale && (
              <div className="beat-line mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto">
                <Stat label="CASES" value={128} />
                <Stat label="VERIFIED" value={4212} />
                <Stat label="PILOTS" value={37} />
              </div>
            )}
          </div>
        </section>
      ))}


      {/* MIL triad — judge-proofing */}
      <section className="story-beat thesis-beat relative min-h-[100dvh] py-24 flex items-center justify-center overflow-hidden px-6 border-y border-white/5">
        <div className="beat-bg pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <ThesisBackdrop />
        </div>

        <div className="relative z-[2] max-w-5xl text-center">
          <div className="stencil text-[10px] text-cyan-300/70 mb-6">THE THESIS</div>
          <h2
            className="beat-line text-3xl sm:text-5xl font-black leading-tight tracking-tight text-white mb-10"
            style={{ fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif' }}
          >
            THIS IS MEDIA &amp; INFORMATION LITERACY, <span className="text-cyan-300">PLAYED.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MIL_TRIAD.map((m) => (
              <div
                key={m.word}
                className="beat-line border border-white/10 bg-white/[0.03] p-6 rounded-sm"
              >
                <div
                  className="text-5xl sm:text-6xl font-black text-cyan-300 tracking-tight"
                  style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    textShadow: "0 0 24px rgba(34,211,238,0.45)",
                  }}
                >
                  {m.word}
                </div>
                <p className="mt-3 text-sm text-white/70 leading-relaxed">{m.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Horizontal district gallery */}
      <div ref={horizontalRef} className="relative hidden overflow-hidden">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 stencil text-[10px] text-cyan-300/70 z-10">
          THE DISTRICTS · SCROLL →
        </div>
        <div
          ref={trackRef}
          className="flex gap-0 h-screen items-center will-change-transform"
        >
          {DISTRICTS.map((d) => {
            const isSubmerging = submerging === d.key;
            const dimmed = submerging && !isSubmerging;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => submerge(d.href, d.key)}
                aria-label={`Enter ${d.label}`}
                className={`district-card group relative shrink-0 w-screen h-screen rounded-none overflow-hidden border-0 text-left transition-all duration-500 ${isSubmerging ? "submerging" : ""} ${dimmed ? "opacity-20 scale-95" : ""}`}
                style={{
                  boxShadow: `0 30px 80px -20px rgba(${d.glow},0.45)`,
                  ["--glow" as string]: d.glow,
                }}
              >
                <img
                  src={d.art}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={1920}
                  height={1080}
                  className="absolute inset-0 h-full w-full object-cover kenburns"
                />

                <DistrictLiveFX district={d.key as DistrictKey} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div
                  className="absolute inset-0 opacity-20 mix-blend-overlay dot-drift"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
                    backgroundSize: "3px 3px",
                  }}
                />
                {/* animated scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none scanlines-live opacity-30"
                  aria-hidden
                />
                {/* moving sheen */}
                <div className="absolute inset-0 pointer-events-none scan-sheen" aria-hidden />
                {/* neon flicker vignette */}
                <div
                  className="absolute inset-0 pointer-events-none neon-flicker-edge"
                  style={{
                    boxShadow: `inset 0 0 80px rgba(${d.glow},0.35), inset 0 0 180px rgba(${d.glow},0.15)`,
                  }}
                  aria-hidden
                />
                {/* pulsing color glow */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
                  style={{
                    background: `radial-gradient(60% 40% at 50% 60%, rgba(${d.glow},0.35), transparent 70%)`,
                    animation: "district-pulse 4.5s ease-in-out infinite",
                  }}
                  aria-hidden
                />
                {/* hover chromatic ripple */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `conic-gradient(from 0deg at 50% 50%, transparent, rgba(${d.glow},0.18), transparent 60%)`,
                    animation: "district-swirl 8s linear infinite",
                  }}
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div
                    className="stencil text-[10px] mb-2 tracking-widest"
                    style={{ color: `rgb(${d.glow})` }}
                  >
                    {d.tag}
                  </div>
                  <h3
                    className="text-5xl font-black text-white tracking-tight glitch-flicker"
                    style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      textShadow: `0 0 24px rgba(${d.glow},0.55), 0 0 4px rgba(${d.glow},0.9)`,
                    }}
                  >
                    {d.label}
                  </h3>
                  <div className="mt-3 stencil text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    CLICK TO ENTER →
                  </div>
                </div>
                <div className="absolute top-4 right-4 stencil text-[9px] text-white/60 border border-white/20 px-2 py-1 hud-blink-slow">
                  DIST · 0{DISTRICTS.indexOf(d) + 1}
                </div>
                {/* submerge wave */}
                {isSubmerging && (
                  <div
                    className="absolute inset-0 pointer-events-none submerge-flash"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, rgba(${d.glow},0.8), rgba(0,0,0,0.95) 70%)`,
                    }}
                  />
                )}
              </button>
            );
          })}
          <div className="shrink-0 w-8" />
        </div>
      </div>

      {/* Mobile district stack */}
      <div className="space-y-0">
        <div className="stencil text-[10px] text-cyan-300/70 text-center py-4">THE DISTRICTS</div>
        {DISTRICTS.map((d) => {
          const isSubmerging = submerging === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => submerge(d.href, d.key)}
              className={`district-card block w-full relative h-screen overflow-hidden rounded-none border-0 text-left ${isSubmerging ? "submerging" : ""}`}
              style={{ ["--glow" as string]: d.glow }}
            >
              {d.video ? (
                <video
                  src={d.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <img
                  src={d.art}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={1536}
                  height={1024}
                  className="absolute inset-0 h-full w-full object-cover"
                />

              )}
              <DistrictLiveFX district={d.key as DistrictKey} intensity="soft" />
              <div
                className="absolute inset-0 pointer-events-none scanlines-live opacity-25"
                aria-hidden
              />
              <div
                className="absolute inset-0 pointer-events-none neon-flicker-edge"
                style={{ boxShadow: `inset 0 0 60px rgba(${d.glow},0.35)` }}
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="stencil text-[9px]" style={{ color: `rgb(${d.glow})` }}>
                  {d.tag}
                </div>
                <h3
                  className="text-3xl font-black text-white glitch-flicker"
                  style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    textShadow: `0 0 18px rgba(${d.glow},0.5)`,
                  }}
                >
                  {d.label}
                </h3>
              </div>
              {isSubmerging && (
                <div
                  className="absolute inset-0 pointer-events-none submerge-flash"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(${d.glow},0.8), rgba(0,0,0,0.95) 70%)`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThesisBackdrop() {
  // MIL 101 collage — cameras, broadcast rings, spotlights, headlines,
  // scanlines. Pure CSS/SVG so it costs nothing on the GPU.
  return (
    <div className="thesis-backdrop absolute inset-0 overflow-hidden">
      {/* base cool wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(34,211,238,0.10), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(245,185,66,0.08), transparent 55%), linear-gradient(180deg, #04070d 0%, #02040a 100%)",
        }}
      />

      {/* crossing spotlights */}
      <div className="thesis-spot thesis-spot-a" />
      <div className="thesis-spot thesis-spot-b" />

      {/* broadcast rings + antenna removed per request */}


      {/* SVG icon collage — cameras, mic, satellite, film reel, tv, newspaper */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.14]" viewBox="0 0 1200 700" fill="none">
        <g stroke="rgba(200,230,255,0.9)" strokeWidth="1.2" fill="none">
          {/* Camera 1 — top-left */}
          <g transform="translate(90 120) rotate(-8)">
            <rect x="0" y="20" width="120" height="70" rx="6" />
            <rect x="20" y="10" width="40" height="14" rx="3" />
            <circle cx="60" cy="55" r="22" />
            <circle cx="60" cy="55" r="12" />
            <circle cx="100" cy="30" r="3" />
          </g>
          {/* Microphone — mid-left (U-arc base removed) */}
          <g transform="translate(60 380) rotate(-14)">
            <rect x="0" y="0" width="26" height="70" rx="13" />
            <line x1="13" y1="70" x2="13" y2="110" />
            <line x1="0" y1="110" x2="26" y2="110" />
          </g>
          {/* satellite dish / lamp removed per request */}

          {/* Film reel — top-right */}
          <g transform="translate(1000 100)">
            <circle cx="60" cy="60" r="55" />
            <circle cx="60" cy="60" r="10" />
            <circle cx="60" cy="18" r="10" />
            <circle cx="60" cy="102" r="10" />
            <circle cx="18" cy="60" r="10" />
            <circle cx="102" cy="60" r="10" />
          </g>
          {/* TV — right-mid */}
          <g transform="translate(1030 340)">
            <rect x="0" y="0" width="120" height="80" rx="4" />
            <rect x="10" y="10" width="100" height="60" />
            <line x1="45" y1="88" x2="60" y2="100" />
            <line x1="75" y1="88" x2="60" y2="100" />
            <line x1="45" y1="100" x2="75" y2="100" />
          </g>
          {/* Newspaper — bottom-right */}
          <g transform="translate(960 530) rotate(6)">
            <rect x="0" y="0" width="140" height="90" />
            <line x1="10" y1="14" x2="130" y2="14" strokeWidth="3" />
            <line x1="10" y1="28" x2="130" y2="28" />
            <line x1="10" y1="38" x2="130" y2="38" />
            <line x1="10" y1="48" x2="90" y2="48" />
            <rect x="10" y="58" width="50" height="24" />
            <line x1="70" y1="60" x2="130" y2="60" />
            <line x1="70" y1="70" x2="130" y2="70" />
            <line x1="70" y1="80" x2="110" y2="80" />
          </g>
          {/* Camera 2 — bottom-center */}
          <g transform="translate(520 580) rotate(4)">
            <rect x="0" y="14" width="100" height="60" rx="6" />
            <rect x="18" y="6" width="34" height="12" rx="3" />
            <circle cx="50" cy="44" r="18" />
            <circle cx="50" cy="44" r="10" />
          </g>

        </g>
      </svg>

      {/* Brand-accurate social/media logos — rendered in their real colors,
          in a separate SVG so they read at full saturation over the collage. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 1200 700"
        aria-hidden
      >
        {(() => {
          type Brand = { id: string; x: number; y: number; size?: number; color: string; d: string };
          const brands: Brand[] = [
            // Instagram — hot pink (approximating the gradient)
            {
              id: "ig", x: 288, y: 60, size: 46, color: "#E4405F",
              d: "M7.03.084c-1.277.06-2.149.264-2.91.563-.789.308-1.459.72-2.126 1.388S.926 3.362.62 4.152c-.297.762-.5 1.635-.559 2.913C.002 8.345 0 8.755 0 12.017s.014 3.67.073 4.95c.06 1.277.264 2.15.563 2.91.308.79.72 1.459 1.388 2.126.667.667 1.336 1.077 2.126 1.384.762.297 1.635.5 2.913.559 1.28.06 1.687.072 4.948.072 3.264 0 3.67-.014 4.95-.072 1.277-.06 2.149-.264 2.91-.563.789-.308 1.459-.72 2.126-1.388.667-.667 1.077-1.336 1.384-2.126.297-.762.5-1.635.56-2.913.055-1.28.072-1.687.072-4.95s-.014-3.67-.072-4.95c-.06-1.277-.264-2.15-.564-2.911-.308-.789-.72-1.459-1.387-2.126C21.319 1.347 20.65.935 19.86.63c-.762-.297-1.635-.5-2.913-.56C15.667.017 15.258 0 11.995 0S8.324.014 7.044.072zm.052 21.638c-1.17-.05-1.805-.248-2.228-.415-.56-.217-.96-.477-1.382-.898-.42-.42-.68-.822-.9-1.38-.165-.423-.363-1.058-.417-2.228-.06-1.264-.072-1.644-.072-4.85s.013-3.586.072-4.85c.05-1.17.248-1.805.415-2.227.217-.56.477-.96.898-1.382.42-.42.822-.68 1.38-.9.423-.165 1.058-.363 2.228-.417 1.265-.06 1.644-.072 4.85-.072 3.205 0 3.586.013 4.85.072 1.17.055 1.805.248 2.227.415.56.217.96.477 1.382.898.42.42.68.822.9 1.38.165.423.363 1.058.417 2.228.06 1.265.073 1.644.073 4.85s-.013 3.586-.073 4.85c-.055 1.17-.248 1.805-.415 2.228-.217.56-.477.96-.898 1.382-.42.42-.822.68-1.38.9-.423.165-1.058.363-2.228.417-1.265.06-1.644.072-4.85.072-3.205 0-3.586-.013-4.85-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z",
            },
            // Reddit — orange
            {
              id: "reddit", x: 330, y: 195, size: 46, color: "#FF4500",
              d: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12.5c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
            },
            // YouTube — red, top-center strip
            {
              id: "yt", x: 620, y: 24, size: 48, color: "#FF0000",
              d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.75 15.6V8.4L15.9 12Z",
            },
            // TikTok — white (with dark backdrop for legibility)
            {
              id: "tt", x: 300, y: 618, size: 46, color: "#FFFFFF",
              d: "M19.6 6.6a5.6 5.6 0 0 1-3.4-1.2 5.6 5.6 0 0 1-2.2-3.9V1.5h-3.2v13.3a3.3 3.3 0 1 1-2.3-3.2V8.3a6.5 6.5 0 1 0 5.5 6.5V8.6a8.8 8.8 0 0 0 5.6 1.9V7.3Z",
            },
            // Snapchat — signature yellow
            {
              id: "sc", x: 878, y: 60, size: 46, color: "#FFFC00",
              d: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226a.727.727 0 0 1-.045-.225.516.516 0 0 1 .42-.509c3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z",
            },
            // Facebook — blue
            {
              id: "fb", x: 858, y: 185, size: 46, color: "#1877F2",
              d: "M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3v-2.6c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z",
            },
            // X (formerly Twitter) — white
            {
              id: "x", x: 1090, y: 260, size: 46, color: "#FFFFFF",
              d: "M18.9 1.7h3.4l-7.4 8.5L23.6 22h-6.8l-5.3-6.9L5.4 22H2l7.9-9-8.4-11.3h7l4.8 6.3ZM17.7 20h1.9L6.4 3.7H4.3Z",
            },
            // Discord — blurple
            {
              id: "discord", x: 868, y: 605, size: 48, color: "#5865F2",
              d: "M20.3 4.6a19.8 19.8 0 0 0-4.9-1.5.07.07 0 0 0-.08.04c-.2.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0c-.17-.4-.4-.88-.6-1.25a.08.08 0 0 0-.08-.04A19.8 19.8 0 0 0 3.7 4.6a.07.07 0 0 0-.03.03C.55 9.24-.32 13.7.1 18.09a.08.08 0 0 0 .03.06 20 20 0 0 0 6 3.05.08.08 0 0 0 .09-.03 14.4 14.4 0 0 0 1.24-2.02.08.08 0 0 0-.04-.11 13.2 13.2 0 0 1-1.88-.9.08.08 0 0 1-.01-.13 10.3 10.3 0 0 0 .37-.29.08.08 0 0 1 .08-.01 14.3 14.3 0 0 0 12.06 0 .08.08 0 0 1 .08.01 9.9 9.9 0 0 0 .37.29.08.08 0 0 1-.01.13 12.4 12.4 0 0 1-1.88.9.08.08 0 0 0-.04.11 16 16 0 0 0 1.24 2.02.08.08 0 0 0 .09.03 20 20 0 0 0 6.03-3.05.08.08 0 0 0 .03-.06 19.7 19.7 0 0 0-3.55-13.45.06.06 0 0 0-.03-.03ZM8.02 15.35c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.22 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.22 0 2.18 1.09 2.16 2.42 0 1.34-.94 2.42-2.16 2.42Z",
            },
            // OpenAI / ChatGPT — brand green
            {
              id: "gpt", x: 1070, y: 470, size: 48, color: "#10A37F",
              d: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
            },
            // Wikipedia — reference-matched serif W, far left gutter
            {
              id: "wiki", x: 24, y: 92, size: 42, color: "#FFFFFF",
              d: "M1.25 3.05h7.1v.78c-.75.04-1.28.12-1.59.26-.3.14-.45.38-.45.73 0 .2.06.5.17.89l3.11 10.18 2.5-7.45-.9-2.82c-.2-.62-.48-1.06-.84-1.33-.36-.27-.93-.42-1.72-.46v-.78h7.35v.78c-.82.03-1.37.1-1.65.22-.28.12-.42.34-.42.66 0 .2.06.5.18.9l3.18 10.2 3.05-9.64c.15-.5.23-.9.23-1.18 0-.42-.18-.72-.53-.9-.35-.18-.92-.27-1.7-.28v-.78h5.43v.78c-.69.07-1.21.25-1.56.54-.35.3-.65.82-.9 1.58L16.03 22h-.9L12.6 13.7 9.78 22h-.9L3.82 5.66c-.22-.72-.52-1.2-.9-1.46-.38-.25-.94-.38-1.67-.38v-.77z",
            },
            // WhatsApp — brand green, left gutter (#1 misinfo vector in PK)
            {
              id: "wa", x: 360, y: 24, size: 44, color: "#25D366",
              d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
            },
            // Telegram — sky blue, left gutter
            {
              id: "tg", x: 30, y: 230, size: 44, color: "#26A5E4",
              d: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
            },
            // Google — blue G, top-center strip
            {
              id: "google", x: 490, y: 24, size: 46, color: "#4285F4",
              d: "M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013Z",
            },
            // LinkedIn — top-center strip
            {
              id: "in", x: 750, y: 26, size: 44, color: "#0A66C2",
              d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
            },
            // Twitch — left gutter (needs disc for purple on dark)
            {
              id: "twitch", x: 210, y: 24, size: 44, color: "#9146FF",
              d: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z",
            },
            // Canva — creative tools, right gutter (special-cased render: teal disc + white C)
            {
              id: "canva", x: 40, y: 540, size: 46, color: "#00C4CC",
              d: "",
            },
            // Gemini — Google AI, left gutter far-below (moved off content)
            {
              id: "gemini", x: 200, y: 560, size: 40, color: "#8E75FF",
              d: "M12 24A14.3 14.3 0 0 0 0 12 14.3 14.3 0 0 0 12 0a14.3 14.3 0 0 0 12 12 14.3 14.3 0 0 0-12 12Z",
            },
            // ElevenLabs — voice-clones, right gutter (white bars on disc)
            {
              id: "eleven", x: 970, y: 490, size: 42, color: "#FFFFFF",
              d: "M9 3v18H5V3zm10 0v18h-4V3z",
            },
          ];

          return brands.map((b) => {
            const s = b.size ?? 46;
            const needsDisc = b.id === "tt" || b.id === "x" || b.id === "twitch" || b.id === "gemini" || b.id === "eleven";

            // Canva — accurate mark: teal gradient disc + white bold C
            if (b.id === "canva") {
              return (
                <g key={b.id} transform={`translate(${b.x} ${b.y})`}>
                  <defs>
                    <radialGradient id="canvaGrad" cx="0.3" cy="0.3" r="0.9">
                      <stop offset="0" stopColor="#7D2AE7" />
                      <stop offset="0.55" stopColor="#00C4CC" />
                      <stop offset="1" stopColor="#01F1A9" />
                    </radialGradient>
                  </defs>
                  <circle cx={s / 2} cy={s / 2} r={s / 2} fill="url(#canvaGrad)" />
                  <text
                    x={s / 2}
                    y={s / 2 + s * 0.16}
                    textAnchor="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontWeight={700}
                    fontSize={s * 0.62}
                    fill="#FFFFFF"
                  >
                    C
                  </text>
                </g>
              );
            }

            return (
              <g key={b.id} transform={`translate(${b.x} ${b.y})`}>
                {needsDisc && (
                  <circle cx={s / 2} cy={s / 2} r={s / 2} fill="#0b0f16" />
                )}
                <svg width={s} height={s} viewBox="0 0 24 24">
                  <path d={b.d} fill={b.color} stroke="none" />
                </svg>
              </g>
            );
          });

        })()}
      </svg>


      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(rgba(200,230,255,0.35) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* scanlines */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* red REC dot + label, top-left */}
      <div className="absolute top-6 left-6 flex items-center gap-2 stencil text-[10px] text-white/60">
        <span className="thesis-rec-dot" />
        <span>REC · MIL 101</span>
      </div>

      {/* top/bottom headline tickers removed per request */}


      {/* Spotlit MIL industry terms — drift in from the corners, never cross the center */}
      <SpotlitTerms />

      {/* corner brackets */}
      <div className="absolute top-4 left-4 h-6 w-6 border-l border-t border-cyan-300/40" />
      <div className="absolute top-4 right-4 h-6 w-6 border-r border-t border-cyan-300/40" />
      <div className="absolute bottom-4 left-4 h-6 w-6 border-l border-b border-cyan-300/40" />
      <div className="absolute bottom-4 right-4 h-6 w-6 border-r border-b border-cyan-300/40" />


    </div>
  );
}

type PillColor = "cyan" | "amber" | "rose" | "lime" | "violet" | "sky" | "pink" | "red" | "yellow" | "white" | "green";
type PillIcon = "ig" | "yt" | "tt" | "sc" | "tv" | "np" | "radio" | "mic" | "cam" | "gpt" | "x" | "fb" | "reddit" | "discord";

const PillGlyph = ({ icon }: { icon: PillIcon }) => {
  const s = { width: 18, height: 18, display: "block" } as const;
  switch (icon) {
    case "ig":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "yt":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 0 0 .5 7.2C0 9.1 0 12 0 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
        </svg>
      );
    case "tt":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.7a8.16 8.16 0 0 0 4.77 1.52V6.77a4.83 4.83 0 0 1-1.84-.08Z" />
        </svg>
      );

    case "sc":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M12 1.6c3.7 0 5.9 2.7 5.9 6 0 1.3-.1 2.7-.1 3 .3.1.9.2 1.5.2.7 0 1.5-.3 1.5.4 0 .8-1.7 1.1-2.6 1.4-.5.2-.2.9.4 1.9.9 1.4 2.5 2.4 4 2.7.6.1.5.9-.2 1.2-1.2.6-2.5.5-2.9 1-.2.3.1 1.3-.6 1.5-.8.2-1.9-.6-3.4-.3-1.6.3-2.8 1.9-4.5 1.9s-2.9-1.6-4.5-1.9c-1.5-.3-2.6.5-3.4.3-.7-.2-.4-1.2-.6-1.5-.4-.5-1.7-.4-2.9-1-.7-.3-.8-1.1-.2-1.2 1.5-.3 3.1-1.3 4-2.7.6-1 .9-1.7.4-1.9-.9-.3-2.6-.6-2.6-1.4 0-.7.8-.4 1.5-.4.6 0 1.2-.1 1.5-.2 0-.3-.1-1.7-.1-3 0-3.3 2.2-6 5.9-6z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5.2 22H2.1l7.7-8.8L1.4 2H8.1l4.7 6.2L18.9 2zm-1.2 18h1.8L7 4h-2l12.7 16z" />
        </svg>
      );
    case "fb":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z" />
        </svg>
      );
    case "reddit":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M22 12.1a2.1 2.1 0 0 0-3.6-1.5 10.4 10.4 0 0 0-5.5-1.7l1-4.4 3 .7a1.5 1.5 0 1 0 .2-1L13.5 3l-1.3 5.6a10.4 10.4 0 0 0-5.6 1.7 2.1 2.1 0 1 0-2.3 3.4 4 4 0 0 0 0 .7c0 3.4 4 6.2 8.7 6.2s8.7-2.8 8.7-6.2a4 4 0 0 0-.1-.7 2.1 2.1 0 0 0 .4-1.6zM7 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm8.3 4a5.6 5.6 0 0 1-3.3.9 5.6 5.6 0 0 1-3.3-.9.5.5 0 1 1 .6-.7 4.7 4.7 0 0 0 2.7.7 4.7 4.7 0 0 0 2.7-.7.5.5 0 1 1 .6.7zm-.4-2.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" />
        </svg>
      );
    case "discord":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="currentColor">
          <path d="M20.3 4.5A18 18 0 0 0 16 3l-.2.4a16 16 0 0 1 3.8 1.2A14.6 14.6 0 0 0 12 3.5a14.6 14.6 0 0 0-7.5 1.1A16 16 0 0 1 8.2 3.4L8 3a18 18 0 0 0-4.3 1.5C1 8.8.2 13 .6 17.1a18 18 0 0 0 5.5 2.8l1.1-1.5a11.6 11.6 0 0 1-1.8-.9l.5-.3a13 13 0 0 0 12.2 0l.5.3a11.6 11.6 0 0 1-1.8.9l1.1 1.5a18 18 0 0 0 5.5-2.8c.5-4.7-.5-8.9-3.1-12.6zM8.5 14.6a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm7 0a2 2 0 1 1 2-2 2 2 0 0 1-2 2z" />
        </svg>
      );
    case "gpt":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 10a4.4 4.4 0 0 0-.4-3.6 4.5 4.5 0 0 0-4.8-2.1A4.5 4.5 0 0 0 7.7 5.9a4.4 4.4 0 0 0-3 2.1 4.5 4.5 0 0 0 .6 5.3 4.4 4.4 0 0 0 .4 3.6 4.5 4.5 0 0 0 4.8 2.1 4.5 4.5 0 0 0 7.6-1.6 4.4 4.4 0 0 0 3-2.1 4.5 4.5 0 0 0-.6-5.3zM12 20a3.4 3.4 0 0 1-2.2-.8l.1-.1 3.7-2.2a.6.6 0 0 0 .3-.5v-5.3l1.6.9v4.5A3.4 3.4 0 0 1 12 20z" />
        </svg>
      );
    case "tv":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="6" width="19" height="13" rx="2" />
          <path d="M8 22h8M8 2l4 3 4-3" />
        </svg>
      );
    case "np":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M4 5h13v14H4z" />
          <path d="M17 8h3v9a2 2 0 0 1-2 2h-1" />
          <path d="M7 9h7M7 12h7M7 15h4" strokeLinecap="round" />
        </svg>
      );
    case "radio":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <rect x="2.5" y="8" width="19" height="12" rx="2" />
          <circle cx="16" cy="14" r="3" />
          <path d="M6 12v4M7 4l10-2" strokeLinecap="round" />
        </svg>
      );
    case "mic":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
    case "cam":
      return (
        <svg viewBox="0 0 24 24" style={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M3 7h4l2-2h6l2 2h4v12H3z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
  }
};

const SPOTLIT_TERMS: Array<{
  text: string;
  side: "l" | "r";
  left: string;
  delay: string;
  color: PillColor;
  icon: PillIcon;
}> = [
  // LEFT gutter (bumped inward from 2-3% → 5-6% so pills stay fully on-screen)
  { text: "TIKTOK: 'trending sound'",         side: "l", left: "6%",  delay: "0s",    color: "pink",   icon: "tt"    },
  { text: "BREAKING: source unverified",      side: "l", left: "16%", delay: "1.2s",  color: "rose",   icon: "tv"    },
  { text: "INSTAGRAM: reel resurfaced",       side: "l", left: "8%",  delay: "2.4s",  color: "pink",   icon: "ig"    },
  { text: "CHYRON: 'EXCLUSIVE'",              side: "l", left: "18%", delay: "3.6s",  color: "cyan",   icon: "tv"    },
  { text: "YOUTUBE: clipped out of context",  side: "l", left: "5%",  delay: "4.8s",  color: "red",    icon: "yt"    },
  { text: "B-ROLL: stock footage",            side: "l", left: "14%", delay: "6s",    color: "violet", icon: "cam"   },
  { text: "SNAPCHAT: 24h receipt",            side: "l", left: "7%",  delay: "7.2s",  color: "yellow", icon: "sc"    },
  { text: "TELEPROMPTER: on-message",         side: "l", left: "20%", delay: "8.4s",  color: "sky",    icon: "mic"   },
  { text: "GPT: hallucinated a source",       side: "l", left: "10%", delay: "9s",    color: "green",  icon: "gpt"   },
  { text: "COLOR GRADE: mood = fear",         side: "l", left: "8%",  delay: "9.6s",  color: "amber",  icon: "cam"   },
  { text: "RADIO: caller was staged",         side: "l", left: "17%", delay: "10.8s", color: "lime",   icon: "radio" },
  { text: "REDDIT: brigaded thread",          side: "l", left: "12%", delay: "5.4s",  color: "amber",  icon: "reddit"},
  { text: "DISCORD: server leak",             side: "l", left: "19%", delay: "2s",    color: "violet", icon: "discord"},
  // RIGHT gutter
  { text: "YOUTUBE SHORTS: auto-caption lie", side: "r", left: "74%", delay: "0.6s",  color: "red",    icon: "yt"    },
  { text: "HEADLINE: rage-bait",              side: "r", left: "86%", delay: "1.8s",  color: "rose",   icon: "np"    },
  { text: "INSTAGRAM: filter deepfake",       side: "r", left: "72%", delay: "3s",    color: "pink",   icon: "ig"    },
  { text: "BYLINE: anonymous",                side: "r", left: "84%", delay: "4.2s",  color: "sky",    icon: "np"    },
  { text: "TIKTOK: creator paid to post",     side: "r", left: "76%", delay: "5.4s",  color: "pink",   icon: "tt"    },
  { text: "DATELINE: geolocation faked",      side: "r", left: "82%", delay: "6.6s",  color: "amber",  icon: "tv"    },
  { text: "SNAPCHAT: story stitched",         side: "r", left: "73%", delay: "7.8s",  color: "yellow", icon: "sc"    },
  { text: "NEWS WIRE: paid placement",        side: "r", left: "80%", delay: "9s",    color: "cyan",   icon: "np"    },
  { text: "SEGMENT: sponsored",               side: "r", left: "77%", delay: "10.2s", color: "violet", icon: "tv"    },
  { text: "ARCHIVE: 6 years old",             side: "r", left: "82%", delay: "11.4s", color: "sky",    icon: "np"    },
  { text: "X: viral quote-tweet",             side: "r", left: "75%", delay: "4.5s",  color: "white",  icon: "x"     },
  { text: "FACEBOOK: group repost",           side: "r", left: "78%", delay: "8.4s",  color: "sky",    icon: "fb"    },
  { text: "GPT: synthetic 'expert'",          side: "r", left: "72%", delay: "1.2s",  color: "green",  icon: "gpt"   },
];

function SpotlitTerms() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden hidden md:block" aria-hidden>
      {SPOTLIT_TERMS.map((t, i) => (
        <div
          key={i}
          className={`thesis-term thesis-term-${t.color} ${t.side === "l" ? "thesis-term-l" : "thesis-term-r"}`}
          style={{
            left: t.left,
            bottom: "-10%",
            fontSize: "13px",
            animationDelay: t.delay,
          }}
        >
          <span className="thesis-term-icon" aria-hidden>
            <PillGlyph icon={t.icon} />
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {

  return (
    <div className="border border-white/10 bg-white/[0.03] p-3">
      <div
        className="count-num text-3xl font-black text-cyan-300 tabular-nums"
        data-target={value}
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        0
      </div>
      <div className="stencil text-[9px] text-white/50 mt-1">{label}</div>
    </div>
  );
}

function highlight(text: string) {
  // Wrap key words with treatments. Multi-word phrases (e.g. "every day")
  // are matched first so both words get the same colour.
  const phraseMap: Array<[RegExp, string]> = [
    [/^every$/i, "word-red"],
    [/^day[,.]?$/i, "word-red"],
    [/^family[,.]?$/i, "word-yellow"],
    [/^message[,.]?$/i, "word-red"],
  ];
  const map: Record<string, string> = {
    trust: "word-glow",
    fake: "word-glitch",
    fakes: "word-glitch",
    verify: "word-underline",
    verifying: "word-underline",
    MILVERSE: "word-glow",
  };
  return text.split(/(\s+)/).map((tok, i) => {
    const clean = tok.replace(/[^a-zA-Z]/g, "");
    const phraseCls = phraseMap.find(([rx]) => rx.test(tok))?.[1];
    const cls = phraseCls || map[clean.toLowerCase()] || map[clean];
    if (cls)
      return (
        <span key={i} className={cls}>
          {tok}
        </span>
      );
    return <span key={i}>{tok}</span>;
  });
}

// TypedHeadline — per-letter reveal on scroll-in. Keeps highlight() colour
// treatments (red / yellow / glow) by wrapping each word in its treatment
// span and each character in a `.beat-letter` with a staggered delay.
function TypedHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setTyped(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTyped(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const nodes = highlight(text);
  let letterIndex = 0;
  const STEP_MS = 32;

  const wrapLetters = (str: string) =>
    Array.from(str).map((ch) => {
      const delay = `${letterIndex * STEP_MS}ms`;
      letterIndex += 1;
      return (
        <span
          key={`l${letterIndex}`}
          className="beat-letter"
          style={{ ["--letter-delay" as string]: delay }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      );
    });

  return (
    <h2
      ref={ref}
      className={`beat-line beat-headline text-4xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight text-white ${typed ? "typed" : ""}`}
      style={{ fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif' }}
      aria-label={text}
    >
      {nodes.map((node, i) => {
        if (typeof node === "string") return <span key={i}>{wrapLetters(node)}</span>;
        // node is a <span className="word-*">TOK</span>
        const el = node as ReactElement<{ className?: string; children?: ReactNode }>;
        const cls = el.props.className ?? "";
        const child = el.props.children;

        const str = typeof child === "string" ? child : "";
        return (
          <span key={i} className={cls}>
            {wrapLetters(str)}
          </span>
        );
      })}
    </h2>
  );
}


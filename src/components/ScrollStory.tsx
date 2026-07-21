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
import mirrorVideo from "@/assets/mirror.mp4.asset.json";
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
    video: mirrorVideo.url,
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
          if (!el.classList.contains("story-beat--image") && !el.classList.contains("finale-beat")) {
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
        <div className="beat-bg pointer-events-none absolute -inset-y-[24vh] inset-x-0 z-[1]" aria-hidden>
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
          className="flex gap-6 pl-8 pr-8 h-screen items-center will-change-transform"
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
                className={`district-card group relative shrink-0 w-[78vw] max-w-[720px] aspect-[4/5] rounded-sm overflow-hidden border border-white/10 text-left transition-all duration-500 ${isSubmerging ? "submerging" : ""} ${dimmed ? "opacity-20 scale-95" : ""}`}
                style={{
                  boxShadow: `0 30px 80px -20px rgba(${d.glow},0.45)`,
                  ["--glow" as string]: d.glow,
                }}
              >
                {d.video ? (
                  <video
                    src={d.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover kenburns"
                  />
                ) : (
                  <img
                    src={d.art}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={1536}
                    height={1024}
                    className="absolute inset-0 h-full w-full object-cover kenburns"
                  />

                )}
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
      <div className="px-4 py-12 space-y-4 max-w-2xl mx-auto">
        <div className="stencil text-[10px] text-cyan-300/70 text-center">THE DISTRICTS</div>
        {DISTRICTS.map((d) => {
          const isSubmerging = submerging === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => submerge(d.href, d.key)}
              className={`district-card block w-full relative aspect-[16/10] overflow-hidden rounded-sm border border-white/10 text-left ${isSubmerging ? "submerging" : ""}`}
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

          {/* Tiny social platform glyphs — recognizable brand marks, blueprint stroke.
              Scattered in the outer gutters so the MEDIA/INFO/LITERACY cards stay clear. */}
          {/* Instagram — left upper (nudged inward so it's fully on screen) */}
          <g transform="translate(300 70)">
            <rect x="0" y="0" width="44" height="44" rx="11" />
            <circle cx="22" cy="22" r="11" />
            <circle cx="35" cy="9" r="2.4" fill="rgba(200,230,255,0.9)" stroke="none" />
          </g>
          {/* Reddit — left upper-mid */}
          <g transform="translate(340 200)">
            <circle cx="22" cy="24" r="18" />
            <circle cx="22" cy="6" r="3" />
            <line x1="22" y1="9" x2="22" y2="15" />
            <circle cx="14" cy="22" r="2.4" fill="rgba(200,230,255,0.9)" stroke="none" />
            <circle cx="30" cy="22" r="2.4" fill="rgba(200,230,255,0.9)" stroke="none" />
            <path d="M13 30 q9 5 18 0" strokeLinecap="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="38" cy="18" r="3" />
          </g>
          {/* YouTube — left mid */}
          <g transform="translate(260 360)">
            <rect x="0" y="0" width="50" height="34" rx="8" />
            <path d="M20 9 L34 17 L20 25 Z" fill="rgba(200,230,255,0.9)" stroke="none" />
          </g>
          {/* TikTok — left low */}
          <g transform="translate(300 620)">
            <path d="M22 3 v22 a9 9 0 1 1 -9 -9" strokeLinecap="round" />
            <path d="M22 3 a9 9 0 0 0 9 9" strokeLinecap="round" />
          </g>
          {/* Snapchat — right upper */}
          <g transform="translate(880 70)">
            <path d="M22 3 c8 0 12 5 12 12 v6 c0 3 5 4 8 6 -3 3 -8 3 -9 4 0 3 1 4 1 6 -3 1 -6 0 -9 1 -1 1 -1 3 -3 3 -2 0 -2 -2 -3 -3 -3 -1 -6 0 -9 -1 0 -2 1 -3 1 -6 -1 -1 -6 -1 -9 -4 3 -2 8 -3 8 -6 v-6 c0 -7 4 -12 12 -12 z" />
          </g>
          {/* Facebook — right upper-mid */}
          <g transform="translate(860 190)">
            <circle cx="22" cy="22" r="18" />
            <path d="M26 12 h4 M26 12 c-3 0 -5 2 -5 5 v5 h-4 v4 h4 v10" strokeLinecap="round" />
          </g>
          {/* X / Twitter — right mid */}
          <g transform="translate(920 340)">
            <rect x="0" y="0" width="44" height="44" rx="8" />
            <line x1="10" y1="10" x2="34" y2="34" strokeWidth="2.4" />
            <line x1="34" y1="10" x2="10" y2="34" strokeWidth="2.4" />
          </g>
          {/* Discord — right low */}
          <g transform="translate(870 610)">
            <path d="M6 9 c6 -3 12 -4 18 -4 6 0 12 1 18 4 4 9 5 18 4 27 -4 3 -9 4 -13 5 l-3 -4 c3 -1 6 -2 9 -3 -9 4 -20 4 -28 0 3 1 6 2 9 3 l-3 4 c-4 -1 -9 -2 -13 -5 -1 -9 0 -18 4 -27 z" />
            <circle cx="17" cy="21" r="3" fill="rgba(200,230,255,0.9)" stroke="none" />
            <circle cx="31" cy="21" r="3" fill="rgba(200,230,255,0.9)" stroke="none" />
          </g>
          {/* GPT / knot — right mid-lower */}
          <g transform="translate(1080 480)">
            <circle cx="22" cy="22" r="18" />
            <path d="M22 6 a10 10 0 0 1 10 10 M22 6 a10 10 0 0 0 -10 10 M6 22 a10 10 0 0 1 10 -10 M6 22 a10 10 0 0 0 10 10 M22 38 a10 10 0 0 0 10 -10 M22 38 a10 10 0 0 1 -10 -10 M38 22 a10 10 0 0 0 -10 -10 M38 22 a10 10 0 0 1 -10 10" strokeWidth="1.4" />
          </g>
        </g>
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
          <path d="M16.6 2h-3.2v13.3a3 3 0 1 1-3-3c.3 0 .5 0 .8.1V9.1a6.4 6.4 0 1 0 5.4 6.3V9.2a7.6 7.6 0 0 0 4.5 1.5V7.5a4.6 4.6 0 0 1-4.5-5.5z" />
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


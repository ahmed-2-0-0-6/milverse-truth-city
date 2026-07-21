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
      <section className="story-beat thesis-beat relative min-h-screen flex items-center justify-center overflow-hidden px-6 border-y border-white/5">
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


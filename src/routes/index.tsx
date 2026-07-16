import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { CityWorld } from "@/components/CityWorld";
import { CityList } from "@/components/CityList";
import { ChevronDown, Sparkles } from "lucide-react";
import { CityHero3D } from "@/components/city3d/CityHero3D";
import { BootScreen } from "@/components/BootScreen";
import { HeroType } from "@/components/HeroType";
import { ScrollStory } from "@/components/ScrollStory";
import { Marquee } from "@/components/Marquee";
import { DailyBeacon } from "@/components/DailyBeacon";
import { useVisualMode } from "@/lib/visual-quality";

export const Route = createFileRoute("/")({
  component: CityMap,
});

const INTRO_KEY = "milverse.intro.seen";
const VIEW_KEY = "milverse.world.view";

function preferredDefaultView(): "map" | "list" {
  if (typeof window === "undefined") return "map";
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "map" || stored === "list") return stored;
  } catch {}
  const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // @ts-expect-error saveData non-standard
  const saveData = navigator.connection?.saveData === true;
  const narrow = window.innerWidth < 360;
  return prefersReduce || saveData || narrow ? "list" : "map";
}

function CityMap() {
  const { mode } = useVisualMode();
  const [booted, setBooted] = useState(mode !== "cinematic");
  const [intro, setIntro] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");

  useEffect(() => {
    setView(preferredDefaultView());
    if (typeof window !== "undefined" && !localStorage.getItem(INTRO_KEY)) setIntro(true);
  }, []);

  useEffect(() => {
    if (mode !== "cinematic") setBooted(true);
  }, [mode]);

  const setViewPersist = (v: "map" | "list") => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch {}
  };

  return (
    <div className="noir-landing min-h-screen relative overflow-x-hidden">
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      <TopBar />
      {intro && booted && <Intro onDone={() => { localStorage.setItem(INTRO_KEY, "1"); setIntro(false); }} />}

      {/* ── HERO ── full-viewport cinematic */}
      <section className={`hero-frame relative min-h-[100svh] flex flex-col items-center px-4 overflow-hidden ${mode === "cinematic" ? "justify-center" : "justify-start pt-24 sm:pt-28"}`}>
        <div className="absolute inset-0 -z-10">
          {mode === "cinematic" ? (
            <CityHero3D className="absolute inset-0" />
          ) : (
            // LITE / low-memory fallback: static noir backdrop so the hero
            // never renders as an empty black void.
            <>
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse at 50% 15%, rgba(34,211,238,0.14), transparent 55%), radial-gradient(ellipse at 20% 90%, rgba(245,185,66,0.10), transparent 60%), linear-gradient(180deg, #05080d 0%, #02040a 100%)",
              }} />
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
              }} />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }} />
        </div>

        <div className="stencil text-[10px] text-cyan-300/80 mb-4 hud-blink">// MILVERSE · CITY OF VERIFICATION</div>
        <HeroType />
        <p className="mt-4 max-w-xl text-center text-white/70 text-sm sm:text-base">
          A city that trains your trust — play today's forward.
        </p>
        <p className="mt-2 max-w-xl text-center text-white/50 text-xs sm:text-sm">
          Learn to spot the fakes by verifying, not guessing.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/drop" className="cta-glow inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-primary-foreground stencil text-xs">
            <Sparkles className="h-3.5 w-3.5" /> PLAY TODAY'S DROP →
          </Link>
          <a href="#enter" className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-6 py-3 text-white/80 stencil text-xs hover:border-cyan-300 hover:text-cyan-200 transition">
            ENTER THE CITY ↓
          </a>
        </div>

        <div className="mt-8 w-full max-w-xl">
          <DailyBeacon />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-hint">
          <span className="stencil text-[9px] text-white/50">SCROLL</span>
          <ChevronDown className="h-4 w-4 text-white/60" />
        </div>
      </section>

      {/* ── SCROLL STORY ── */}
      <ScrollStory />

      <Marquee />


      {/* ── ENTER THE CITY (interactive map / list) ── */}
      <section id="enter" className="relative pt-16 pb-6 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-[60px] bg-cyan-400/60" />
            <div className="stencil text-[10px] text-cyan-300">// ENTER THE CITY</div>
            <div className="h-px flex-1 bg-cyan-400/20" />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              Drag the city. Zoom the quarters. Clear the stations.
            </h2>
            <DailyBeacon compact />
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-6 relative">
          <div className="relative z-[1]">
            {view === "map"
              ? <CityWorld onSwitchToList={() => setViewPersist("list")} />
              : <CityList onSwitchToMap={() => setViewPersist("map")} />}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 mt-6 border-t border-white/10 pt-6 pb-10 text-center stencil text-[10px] text-white/50 space-y-3">
        <div className="text-cyan-300/80">MEDIA &amp; INFORMATION LITERACY · VERIFY, DON'T GUESS · CALIBRATE, DON'T PANIC</div>
        <div>
          <Link to="/visit" className="inline-block rounded border border-primary/60 bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/20">
            JUDGES &amp; EDUCATORS: TAKE THE 3-MINUTE VISIT →
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link to="/drop" className="text-primary hover:underline">[F★] AAJ KA FORWARD — DAILY DROP →</Link>
          <Link to="/educators" className="text-cyan-300 hover:underline">[F0] FOR EDUCATORS →</Link>
          <Link to="/pilot" className="text-cyan-300 hover:underline">[F1] PILOT MODE — CLASSROOM DASHBOARD →</Link>
          <Link to="/kit" className="text-cyan-300 hover:underline">[F2] FIELD KIT — PRINT PACK →</Link>
          <Link to="/manual" className="text-cyan-300 hover:underline">[F3] FIELD MANUAL →</Link>
        </div>
        <div className="pt-2 text-white/40 normal-case tracking-normal">
          No accounts. No tracking. Pilot data is anonymous.
        </div>
      </footer>
    </div>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const slides = [
    "Lies come in two sizes: aimed at millions — and aimed at just you.",
    "Both die the same way. Verification.",
    "MILVERSE is a city built for that reflex. Time to fly in.",
  ];
  const [i, setI] = useState(0);
  return (
    <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="stencil text-[10px] text-cyan-300 mb-8 hud-blink">// EDITORIAL BRIEFING</div>
      <div className="max-w-2xl">
        <div key={i} className="msg-in text-2xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
          {slides[i]}
        </div>
      </div>
      <div className="mt-12 flex gap-2">
        {slides.map((_, n) => (
          <div key={n} className={`h-1 w-10 ${n <= i ? "bg-cyan-300" : "bg-white/15"}`} />
        ))}
      </div>
      <div className="absolute bottom-8 flex gap-6 stencil text-[10px]">
        <button onClick={onDone} className="text-white/50 hover:text-white">SKIP</button>
        <button
          onClick={() => { if (i + 1 < slides.length) setI(i + 1); else onDone(); }}
          className="rounded-sm bg-primary px-6 py-2.5 text-primary-foreground border-2 border-primary shadow-[0_4px_20px_oklch(0.60_0.19_258/0.35)]"
        >
          {i + 1 < slides.length ? "NEXT →" : "ENTER THE CITY →"}
        </button>
      </div>
    </div>
  );
}

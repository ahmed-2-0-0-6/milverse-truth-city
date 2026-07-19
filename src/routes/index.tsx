import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { CityWorld } from "@/components/CityWorld";
import { CityList } from "@/components/CityList";
import { ChevronDown, ArrowRight, Flame } from "lucide-react";
import { resolveNextAction, type NextAction } from "@/lib/city/nextAction";
import { loadProfile } from "@/lib/mirror/profile";
import { readDailyStatus } from "@/lib/daily/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp, RANKS } from "@/lib/ranks";
import { CityHero3D } from "@/components/city3d/CityHero3D";
import { BootScreen } from "@/components/BootScreen";
import { HeroType } from "@/components/HeroType";
import { ScrollStory } from "@/components/ScrollStory";
import { Marquee } from "@/components/Marquee";
import { DailyBeacon } from "@/components/DailyBeacon";
import { useVisualMode } from "@/lib/visual-quality";
import { InboxManager } from "@/components/inbox/InboxManager";
import { IncomingToast } from "@/components/inbox/IncomingToast";
import { IncomingCall } from "@/components/inbox/IncomingCall";
import { FirstCall } from "@/components/onboarding/FirstCall";
import { hasSeenLiveBait } from "@/components/landing/liveBaitState";
import { LandingNudge } from "@/components/landing/LandingNudge";
import { PaperNudge } from "@/components/landing/PaperNudge";

import { isReturningCitizen } from "@/lib/city/returning";
import { currentShift, isNightRegister, type Shift } from "@/lib/city/shift";
import detectiveDeskImg from "@/assets/detective-desk.jpg";
import corkboardImg from "@/assets/corkboard.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:url", content: "https://milverse-truth-city.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://milverse-truth-city.lovable.app/" }],
  }),
  component: CityMap,
});

const INTRO_KEY = "milverse.intro.seen";
const VIEW_KEY = "milverse.world.view";

function preferredDefaultView(): "map" | "list" {
  if (typeof window === "undefined") return "map";
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "map" || stored === "list") return stored;
  } catch {
    /* localStorage unavailable */
  }
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
  // Hydration idiom (mirrors the existing setView useEffect below): SSR
  // renders the poster (isReturning=false); the desk is enabled after
  // mount when localStorage is readable. Wrapped in a stable-height
  // container to avoid layout shift on either path.
  const [returning, setReturning] = useState(false);
  const [showBait, setShowBait] = useState(false);
  const [showBeacon, setShowBeacon] = useState(true);
  const [heroTyped, setHeroTyped] = useState(false);

  // THE NIGHT SHIFT — landing recomputes its band every 60s so a session
  // left open across a boundary catches up. Elsewhere band is per-mount.
  const [shift, setShift] = useState<Shift>(() => currentShift());


  useEffect(() => {
    setView(preferredDefaultView());
    const isReturner = isReturningCitizen();
    setReturning(isReturner);
    if (typeof window !== "undefined" && !localStorage.getItem(INTRO_KEY)) setIntro(true);
    // LIVE BAIT — first-time visitors only, once per session. Returning
    // citizens go straight to the desk (they've been baited already).
    setShowBait(!isReturner && !hasSeenLiveBait());
    setShift(currentShift());
    try {
      if (sessionStorage.getItem("mv:beacon-dismissed") === "1") setShowBeacon(false);
    } catch { /* sessionStorage unavailable */ }
    const tick = window.setInterval(() => setShift(currentShift()), 60_000);
    return () => window.clearInterval(tick);
  }, []);



  useEffect(() => {
    if (mode !== "cinematic") setBooted(true);
  }, [mode]);

  // Fire the left-side notifications on a fixed 800ms schedule from landing,
  // independent of the hero typing animation.
  useEffect(() => {
    const t = window.setTimeout(() => setHeroTyped(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  const setViewPersist = (v: "map" | "list") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* localStorage unavailable */
    }
  };

  const handleHeroTyped = useCallback(() => setHeroTyped(true), []);

  const night = isNightRegister(shift.band);
  const kicker =
    shift.band === "evening"
      ? "// MILVERSE · THE EVENING EDITION"
      : shift.band === "night"
        ? "// MILVERSE · THE NIGHT SHIFT"
        : shift.band === "smallHours"
          ? "// MILVERSE · THE SMALL HOURS · THE DESK NEVER CLOSES"
          : "// MILVERSE · CITY OF VERIFICATION";


  return (
    <div className={`noir-landing min-h-dvh relative overflow-x-hidden ${night ? "city-night" : ""}`}>
      <InboxManager paperDeliveryReady={heroTyped} />
      <IncomingToast />
      <IncomingCall />
      <TopBar />
      <div
        className="fixed z-[260] bottom-4 left-4 w-[calc(100%-2rem)] sm:w-[22rem] max-h-[80dvh] overflow-y-auto flex flex-col-reverse gap-3 pointer-events-none [&>*]:pointer-events-auto"
        aria-label="Notifications"
      >
        {booted && showBeacon && (
          <LandingNudge
            kind="beacon"
            shift={shift}
            onDismiss={() => {
              setShowBeacon(false);
              try { sessionStorage.setItem("mv:beacon-dismissed", "1"); } catch { /* noop */ }
            }}
          />
        )}
        {booted && showBait && (
          <LandingNudge
            kind="bait"
            shift={shift}
            onDismiss={() => setShowBait(false)}
          />
        )}
        {booted && !showBait && returning && (
          <LandingNudge
            kind="desk"
            shift={shift}
            onDismiss={() => setReturning(false)}
          />
        )}
        <PaperNudge show={heroTyped} />
      </div>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}


      {intro && booted && !showBait && (
        <FirstCall
          onDone={() => {
            try {
              localStorage.setItem(INTRO_KEY, "1");
            } catch {
              /* localStorage unavailable */
            }
            setIntro(false);
          }}
        />
      )}


      <main id="main" role="main">
      {/* ── HERO ── full-viewport cinematic. Detective-desk photo washes
          under the noir palette on every mode; the 3D city sits on top in
          cinematic. Gives the site the Ashcroft-office / FBI-field-office
          vibe requested for v2. */}
      <section
        aria-label="MILVERSE opening"
        className={`crime-scene-hero hero-frame relative min-h-[100svh] flex flex-col items-center px-4 sm:px-6 overflow-hidden ${mode === "cinematic" ? "justify-center" : "justify-start pt-20 sm:pt-24 md:pt-28"}`}
        style={{ ["--crime-scene-img" as string]: `url(${detectiveDeskImg})` }}
      >
        <div className="absolute inset-0 -z-10">
          {mode === "cinematic" ? (
            <CityHero3D className="absolute inset-0" />
          ) : (
            <>
              <div
                className={`absolute inset-0 ${night ? "city-night-lite-bg" : ""}`}
                style={
                  night
                    ? undefined
                    : {
                        background:
                          "radial-gradient(ellipse at 50% 15%, rgba(34,211,238,0.14), transparent 55%), radial-gradient(ellipse at 20% 90%, rgba(245,185,66,0.10), transparent 60%), linear-gradient(180deg, #05080d 0%, #02040a 100%)",
                      }
                }
              />

              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
                }}
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "3px 3px",
            }}
          />
        </div>

        <div className="w-full flex flex-col items-center min-h-[380px] sm:min-h-[460px]">
          <div className="stencil text-[10px] text-cyan-300/80 mb-4 hud-blink text-center">
            {kicker}
          </div>
          <HeroType onComplete={handleHeroTyped} />
          <p className="mt-4 max-w-xl text-center text-white/80 text-step-0 px-2">
            Scammers are working your city. Pick up. Play them. Burn them.
          </p>

          <div className="mt-6 sm:mt-8 w-full max-w-[380px]">
            <PlayButton />
            <StatStrip />
          </div>



        </div>



        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 scroll-hint safe-bottom">
          <span className="stencil text-[9px] text-white/50">SCROLL</span>
          <ChevronDown className="h-4 w-4 text-white/60" aria-hidden />
        </div>
      </section>


      {/* ── SCROLL STORY ── */}
      <ScrollStory />

      <Marquee />

      {/* ── EXPLORE THE CITY (interactive map / list) ── Corkboard wash
          under the section so cases feel pinned to an evidence wall.
          `bg-fixed` is dropped on mobile via media-safe CSS var to
          avoid iOS scroll jank. */}
      <section
        id="enter"
        aria-labelledby="explore-city-heading"
        className="corkboard-panel relative pt-14 sm:pt-16 pb-6 px-4 sm:px-6"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(2,4,10,0.92), rgba(2,4,10,0.96)), url(${corkboardImg})`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-[60px] bg-cyan-400/60" aria-hidden />
            <div className="stencil text-[10px] text-cyan-300">// EXPLORE THE CITY ↓</div>
            <div className="h-px flex-1 bg-cyan-400/20" aria-hidden />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="explore-city-heading"
              className="text-step-4 font-black text-white leading-none tracking-tight"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Drag the city. Zoom the quarters. Clear the stations.
            </h2>
            <DailyBeacon compact />
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-6 relative">
          <div className="relative z-[1]">
            {view === "map" ? (
              <CityWorld onSwitchToList={() => setViewPersist("list")} />
            ) : (
              <CityList onSwitchToMap={() => setViewPersist("map")} />
            )}
          </div>
        </div>
      </section>
      </main>

      <footer
        role="contentinfo"
        className="mx-auto max-w-6xl px-4 sm:px-6 mt-6 border-t border-white/10 pt-8 pb-10 safe-bottom text-white/60"
      >
        <div className="text-center stencil text-[10px] text-cyan-300/80 mb-5">
          MEDIA &amp; INFORMATION LITERACY · VERIFY, DON'T GUESS · CALIBRATE, DON'T PANIC
        </div>
        <div className="text-center mb-6">
          <Link
            to="/visit"
            className="tap inline-flex items-center justify-center rounded-md border border-primary/60 bg-primary/10 px-4 py-2 text-primary hover:bg-primary/20 stencil text-[10px] tracking-widest"
          >
            JUDGES &amp; EDUCATORS · 3-MINUTE VISIT →
          </Link>
        </div>
        <nav aria-label="Resources" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2 text-[11px] font-mono">
          <Link to="/drop" className="tap flex items-center text-primary hover:underline">
            <span className="opacity-60 mr-1">[F★]</span> Daily Drop
          </Link>
          <Link to="/educators" className="tap flex items-center text-cyan-300 hover:underline">
            <span className="opacity-60 mr-1">[F0]</span> Educators
          </Link>
          <Link to="/pilot" className="tap flex items-center text-cyan-300 hover:underline">
            <span className="opacity-60 mr-1">[F1]</span> Pilot Mode
          </Link>
          <Link to="/kit" className="tap flex items-center text-cyan-300 hover:underline">
            <span className="opacity-60 mr-1">[F2]</span> Field Kit
          </Link>
          <Link to="/manual" className="tap flex items-center text-cyan-300 hover:underline">
            <span className="opacity-60 mr-1">[F3]</span> Field Manual
          </Link>
        </nav>
        <div className="pt-4 text-center text-[11px] text-white/40">
          No accounts. No tracking. Pilot data is anonymous.
        </div>
      </footer>
    </div>
  );
}


// ── PLAY BUTTON — one big verb-first CTA that always knows the next move.
function PlayButton() {
  const [action, setAction] = useState<NextAction | null>(null);
  useEffect(() => {
    const push = () => setAction(resolveNextAction(new Date()));
    push();
    const events = [
      "milverse:profile",
      "milverse:manual",
      "milverse:retests",
      "milverse:boss",
      "storage",
    ];
    events.forEach((e) => window.addEventListener(e, push));
    return () => events.forEach((e) => window.removeEventListener(e, push));
  }, []);

  if (!action) {
    // SSR / pre-hydration: safe deterministic fallback (matches branch 1).
    return (
      <Link
        to="/mirror"
        className="cta-glow flex w-full max-w-[360px] min-h-[56px] flex-col items-center justify-center gap-1 rounded-sm bg-primary px-6 py-3 text-primary-foreground stencil"
      >
        <span className="text-sm tracking-widest">START →</span>
      </Link>
    );
  }

  const params = action.params ?? {};
  const accessible = `${action.label}. ${action.sublabel}.`;
  return (
    <Link
      to={action.to as string}
      params={params as never}
      aria-label={accessible}
      className="cta-glow flex w-full min-h-[56px] max-w-[360px] flex-col items-center justify-center gap-1 rounded-sm bg-primary px-6 py-3 text-primary-foreground stencil"
    >
      <span className="inline-flex items-center gap-2 text-sm tracking-widest">
        {action.label} <ArrowRight className="h-3.5 w-3.5" />
      </span>
      <span className="text-[10px] tracking-wider text-primary-foreground/80 normal-case truncate max-w-full">
        {action.sublabel}
      </span>
    </Link>
  );
}

// ── STAT STRIP — LVL · STREAK · CASES. Zeros are a challenge, not an absence.
function StatStrip() {
  const [stats, setStats] = useState<{ lvl: number; streak: number; cases: number } | null>(null);
  useEffect(() => {
    const push = () => {
      const p = loadProfile();
      const xp = computeXp(p, loadUnlocked().size, p.publishedCount ?? 0);
      const idx = RANKS.findIndex((r) => r.id === rankFromXp(xp).current.id);
      const daily = readDailyStatus();
      setStats({ lvl: idx + 1, streak: daily.streak, cases: p.casesPlayed });
    };
    push();
    ["milverse:profile", "milverse:manual", "storage"].forEach((e) =>
      window.addEventListener(e, push),
    );
    return () =>
      ["milverse:profile", "milverse:manual", "storage"].forEach((e) =>
        window.removeEventListener(e, push),
      );
  }, []);

  const s = stats ?? { lvl: 1, streak: 0, cases: 0 };
  return (
    <div className="mt-3 flex items-center justify-center gap-3 stencil text-[10px] text-white/70">
      <span className="tabular-nums">LVL {s.lvl}</span>
      <span aria-hidden className="text-white/25">·</span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Flame className="h-3 w-3" /> STREAK {s.streak}
      </span>
      <span aria-hidden className="text-white/25">·</span>
      <span className="tabular-nums">CASES {s.cases}</span>
    </div>
  );
}

// The old three-slide Intro was replaced by <FirstCall />
// (src/components/onboarding/FirstCall.tsx) — verb-first onboarding.



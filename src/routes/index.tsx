import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { CityWorld } from "@/components/CityWorld";
import { CityList } from "@/components/CityList";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: CityMap,
});

const INTRO_KEY = "milverse.intro.seen";
const VIEW_KEY = "milverse.world.view";

/** Pick the safest default view: list if reduced-motion, save-data, or very narrow screen. */
function preferredDefaultView(): "map" | "list" {
  if (typeof window === "undefined") return "map";
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "map" || stored === "list") return stored;
  } catch {}
  const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // @ts-expect-error saveData is non-standard
  const saveData = navigator.connection?.saveData === true;
  const narrow = window.innerWidth < 360;
  return prefersReduce || saveData || narrow ? "list" : "map";
}

function CityMap() {
  const [intro, setIntro] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");

  useEffect(() => {
    setView(preferredDefaultView());
    if (typeof window !== "undefined" && !localStorage.getItem(INTRO_KEY)) setIntro(true);
  }, []);

  const setViewPersist = (v: "map" | "list") => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch {}
  };

  return (
    <div className="min-h-screen grain relative">
      <div className="pointer-events-none fixed inset-0 scanlines opacity-30" />
      <TopBar />
      {intro && <Intro onDone={() => { localStorage.setItem(INTRO_KEY, "1"); setIntro(false); }} />}

      <main className="relative">
        {/* Compact kinetic header */}
        <section className="mx-auto max-w-6xl px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 max-w-[60px] bg-primary/60" />
            <div className="stencil text-[10px] text-primary">MILVERSE · CITY OF VERIFICATION</div>
            <div className="h-px flex-1 bg-primary/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight uppercase">
            Train your <span className="text-primary">trust</span>.
            <span className="text-muted-foreground text-sm sm:text-base normal-case font-normal tracking-normal block mt-1">
              Drag the city. Zoom the quarters. Clear the stations.
            </span>
          </h1>

          <Link to="/quick-tour" className="mt-4 flex items-center gap-3 rounded-sm border border-primary/50 bg-gradient-to-r from-primary/10 to-transparent p-3 hover:border-primary transition group">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/20 text-primary border border-primary/40 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="stencil text-[10px] text-primary">GUIDED WALKTHROUGH · 90 SEC</div>
              <div className="text-sm font-medium">Take the Quick Tour</div>
            </div>
            <div className="stencil text-[10px] text-primary opacity-0 group-hover:opacity-100 transition">START →</div>
          </Link>
        </section>

        {/* World / List */}
        <section className="mx-auto max-w-6xl px-3 sm:px-4">
          {view === "map"
            ? <CityWorld onSwitchToList={() => setViewPersist("list")} />
            : <CityList onSwitchToMap={() => setViewPersist("map")} />}
        </section>

        <footer className="mx-auto max-w-6xl px-4 mt-6 border-t border-border pt-6 pb-10 text-center stencil text-[10px] text-muted-foreground space-y-3">
          <div className="text-primary/80">VERIFY, DON'T GUESS · CALIBRATE, DON'T PANIC</div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/pilot" className="text-primary hover:underline">[F1] PILOT MODE — CLASSROOM DASHBOARD →</Link>
            <Link to="/kit" className="text-primary hover:underline">[F2] FIELD KIT — PRINT PACK →</Link>
          </div>
          <div className="pt-2 text-muted-foreground/80 normal-case tracking-normal">
            No accounts. No tracking. Pilot data is anonymous.
          </div>
          <div className="pt-1 text-muted-foreground/70 normal-case tracking-normal">
            Works on any phone · No install · No account · Low-data friendly · Offline classroom kit available.
          </div>
        </footer>
      </main>
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
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-6 text-center scanlines">
      <div className="stencil text-[10px] text-primary mb-8 hud-blink">// EDITORIAL BRIEFING</div>
      <div className="max-w-2xl">
        <div key={i} className="msg-in text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight">
          {slides[i]}
        </div>
      </div>
      <div className="mt-12 flex gap-2">
        {slides.map((_, n) => (
          <div key={n} className={`h-1 w-10 ${n <= i ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <div className="absolute bottom-8 flex gap-6 stencil text-[10px]">
        <button onClick={onDone} className="text-muted-foreground hover:text-foreground">SKIP</button>
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

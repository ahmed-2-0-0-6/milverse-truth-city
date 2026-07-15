import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import {
  Eye, Newspaper, Store, Swords, Clapperboard, Library, Landmark, Lock, Sparkles,
} from "lucide-react";
import { loadProfile, unlockedMaxTier, type TrustProfile } from "@/lib/mirror/profile";

export const Route = createFileRoute("/")({
  component: CityMap,
});

interface District {
  id: string;
  name: string;
  Icon: typeof Eye;
  unlocked: boolean;
  to?: string;
  tagline: (p: TrustProfile | null) => string;
}

const DISTRICTS: District[] = [
  {
    id: "mirror", name: "The Mirror", Icon: Eye, unlocked: true, to: "/mirror",
    tagline: (p) => p ? `Tier ${unlockedMaxTier(p)} unlocked · verify the person on the other end` : "Personal deception. Verify the person on the other end.",
  },
  {
    id: "feed", name: "The Feed", Icon: Newspaper, unlocked: true, to: "/feed",
    tagline: () => "Mass deception. Verify the claim without breaking the relationship.",
  },
  { id: "studio", name: "The Studio", Icon: Clapperboard, unlocked: true, to: "/studio", tagline: () => "Design a case. Share with friends." },
  { id: "market", name: "The Market", Icon: Store, unlocked: false, tagline: () => "Scam ads and fake shops training. Verify the seller — not the price." },
  { id: "arena", name: "The Arena", Icon: Swords, unlocked: false, tagline: () => "Human-vs-human imposter duels. Play the mask, or spot it." },
  { id: "archive", name: "The Archive", Icon: Library, unlocked: false, tagline: () => "Community case library. Every survivor story, indexed and playable." },
  { id: "hall", name: "City Hall", Icon: Landmark, unlocked: true, to: "/city-hall", tagline: () => "Your Trust Calibration — one chart, every district." },
];

const INTRO_KEY = "milverse.intro.seen";

function CityMap() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [intro, setIntro] = useState(false);
  useEffect(() => {
    setProfile(loadProfile());
    if (typeof window !== "undefined" && !localStorage.getItem(INTRO_KEY)) setIntro(true);
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  return (
    <div className="min-h-screen grain relative">
      {/* Ambient scan sweep */}
      <div className="pointer-events-none fixed inset-0 scanlines opacity-30" />
      <TopBar />
      {intro && <Intro onDone={() => { localStorage.setItem(INTRO_KEY, "1"); setIntro(false); }} />}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14 relative">
        {/* Editorial masthead */}
        <section className="mb-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 max-w-[60px] bg-primary/60" />
            <div className="stencil text-[10px] text-primary">MEDIA &amp; INFORMATION LITERACY · ISSUE 001</div>
            <div className="h-px flex-1 bg-primary/20" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-tight uppercase">
            Train your <span className="text-primary">trust</span>.<br />
            <span className="text-muted-foreground text-2xl sm:text-3xl normal-case font-normal tracking-normal block mt-3">
              From viral lies to voice clones — one verification instinct.
            </span>
          </h1>
          <p className="mt-6 text-muted-foreground max-w-2xl leading-relaxed">
            Two labs are open. <span className="text-foreground font-medium">The Mirror</span> trains you
            against personal deception — the scammer talking to you.{" "}
            <span className="text-foreground font-medium">The Feed</span> trains you against mass
            misinformation — the viral post someone just forwarded.
            Same instinct powers both: <b className="text-primary">verify, use sources, protect evidence, protect people.</b>
          </p>
        </section>

        {/* Quick Tour banner */}
        <Link to="/quick-tour" className="block mb-10 hud-frame rounded-sm border border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 hover:border-primary transition group relative overflow-hidden scan-sweep">
          <div className="flex items-center gap-4 relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/20 text-primary shrink-0 border border-primary/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="stencil text-[10px] text-primary">GUIDED WALKTHROUGH · 90 SEC</div>
              <div className="mt-1 text-lg font-semibold">Take the Quick Tour</div>
              <div className="text-sm text-muted-foreground">Watch one case unfold before you try a live one.</div>
            </div>
            <div className="stencil text-[10px] text-primary opacity-0 group-hover:opacity-100 transition">
              START →
            </div>
          </div>
        </Link>

        <div className="mb-4 flex items-center gap-3">
          <div className="stencil text-[10px] text-muted-foreground">DISTRICTS</div>
          <div className="h-px flex-1 bg-border" />
          <div className="stencil text-[10px] text-primary hud-blink">● OPEN</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DISTRICTS.map((d) => (
            <DistrictTile key={d.id} d={d} profile={profile} />
          ))}
        </div>

        <footer className="mt-16 border-t border-border pt-6 text-center stencil text-[10px] text-muted-foreground space-y-3">
          <div className="text-primary/80">VERIFY, DON'T GUESS · CALIBRATE, DON'T PANIC</div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/pilot" className="text-primary hover:underline">
              [F1] PILOT MODE — CLASSROOM DASHBOARD →
            </Link>
            <Link to="/kit" className="text-primary hover:underline">
              [F2] FIELD KIT — PRINT PACK →
            </Link>
          </div>
          <div className="pt-2 text-muted-foreground/80 normal-case tracking-normal">
            No accounts. No tracking. Pilot data is anonymous.
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
    "MILVERSE is where you train that reflex. Let's open the first case.",
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
          {i + 1 < slides.length ? "NEXT →" : "ENTER THE LAB →"}
        </button>
      </div>
    </div>
  );
}

function DistrictTile({ d, profile }: { d: District; profile: TrustProfile | null }) {
  const Icon = d.Icon;
  const body = (
    <div
      className={`group relative overflow-hidden rounded-sm border p-5 transition-all ${
        d.unlocked
          ? "border-border bg-card hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_0_32px_oklch(0.82_0.16_85/0.18)] hud-frame"
          : "border-border/40 bg-card/40 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-sm ${d.unlocked ? "bg-primary/15 text-primary border border-primary/40" : "bg-muted text-muted-foreground border border-border"}`}>
          <Icon className="h-5 w-5" />
        </div>
        {!d.unlocked ? (
          <span className="flex items-center gap-1.5 rounded-sm border border-caution/40 bg-caution/10 px-2.5 py-1 stencil text-[9px] text-caution">
            <Lock className="h-3 w-3" /> LOCKED
          </span>
        ) : (
          <span className="rounded-sm border border-primary/50 bg-primary/10 px-2.5 py-1 stencil text-[9px] text-primary">
            ● OPEN
          </span>
        )}
      </div>
      <h3 className="mt-5 stencil text-sm text-foreground">{d.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.tagline(profile)}</p>
      {d.unlocked && (
        <div className="mt-4 stencil text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
          OPEN →
        </div>
      )}
    </div>
  );
  if (d.unlocked && d.to) {
    return <Link to={d.to as "/mirror"} className="block">{body}</Link>;
  }
  return body;
}

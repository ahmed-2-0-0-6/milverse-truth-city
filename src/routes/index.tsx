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
  { id: "market", name: "The Market", Icon: Store, unlocked: false, tagline: () => "Fake shops and scam ads — verify the seller, not the price." },
  { id: "arena", name: "The Arena", Icon: Swords, unlocked: false, tagline: () => "Multiplayer sources duel — whose evidence wins?" },
  { id: "archive", name: "The Archive", Icon: Library, unlocked: false, tagline: () => "Survivor stories and the anatomy of past lies." },
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
    <div className="min-h-screen grain">
      <TopBar />
      {intro && <Intro onDone={() => { localStorage.setItem(INTRO_KEY, "1"); setIntro(false); }} />}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <section className="mb-8 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary mb-3">MEDIA & INFORMATION LITERACY · BY DOING</div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
            Train your trust<span className="text-primary">.</span><br />
            From viral lies to voice clones —<br />one verification instinct.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Two wings are open. <span className="text-foreground">The Mirror</span> trains you
            against personal deception — the scammer talking to you.{" "}
            <span className="text-foreground">The Feed</span> trains you against mass
            misinformation — the viral lie your uncle just forwarded.
            Same instinct powers both: <b>verify, use sources, protect evidence, protect people.</b>
          </p>
        </section>

        {/* Quick Tour banner */}
        <Link to="/quick-tour" className="block mb-8 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 to-transparent p-5 hover:border-primary/70 transition group">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-widest text-primary">START HERE · 90 SECONDS</div>
              <div className="mt-1 text-lg font-semibold">Take the Quick Tour</div>
              <div className="text-sm text-muted-foreground">Watch one case unfold before playing live.</div>
            </div>
            <div className="font-mono text-xs tracking-widest text-primary opacity-0 group-hover:opacity-100 transition">
              GO →
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISTRICTS.map((d) => (
            <DistrictTile key={d.id} d={d} profile={profile} />
          ))}
        </div>

        <footer className="mt-16 text-center text-xs font-mono text-muted-foreground tracking-widest space-y-3">
          <div>SPOTTING IS DYING · VERIFYING IS FOREVER</div>
          <div>
            <Link to="/kit" className="text-primary hover:underline">
              NO INTERNET? PRINT THE FIELD KIT →
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const slides = [
    "Lies come in two sizes: aimed at millions (misinformation) — and aimed at just you (scams).",
    "Both die the same way: verification.",
    "MILVERSE is a city that trains that instinct. Enter.",
  ];
  const [i, setI] = useState(0);
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl">
        <div key={i} className="msg-in text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight">
          {slides[i]}
        </div>
      </div>
      <div className="mt-12 flex gap-2">
        {slides.map((_, n) => (
          <div key={n} className={`h-1 w-8 rounded ${n <= i ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <div className="absolute bottom-8 flex gap-6 font-mono text-xs tracking-widest">
        <button onClick={onDone} className="text-muted-foreground hover:text-foreground">SKIP</button>
        <button
          onClick={() => { if (i + 1 < slides.length) setI(i + 1); else onDone(); }}
          className="rounded-md bg-primary px-5 py-2 text-primary-foreground"
        >
          {i + 1 < slides.length ? "NEXT →" : "ENTER MILVERSE →"}
        </button>
      </div>
    </div>
  );
}

function DistrictTile({ d, profile }: { d: District; profile: TrustProfile | null }) {
  const Icon = d.Icon;
  const body = (
    <div
      className={`group relative overflow-hidden rounded-xl border p-6 transition-all ${
        d.unlocked
          ? "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_32px_oklch(0.82_0.15_210/0.15)]"
          : "border-border/60 bg-card/50 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${d.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
        {!d.unlocked ? (
          <span className="flex items-center gap-1.5 rounded-full border border-caution/40 bg-caution/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-caution">
            <Lock className="h-3 w-3" /> In dev
          </span>
        ) : (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
            Open
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold">{d.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{d.tagline(profile)}</p>
      {d.unlocked && (
        <div className="mt-4 font-mono text-xs tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
          ENTER →
        </div>
      )}
    </div>
  );
  if (d.unlocked && d.to) {
    return <Link to={d.to as "/mirror"} className="block">{body}</Link>;
  }
  return body;
}

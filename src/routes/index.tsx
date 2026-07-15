import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import {
  Eye, Newspaper, Store, Swords, Clapperboard, Library, Landmark, Lock,
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
    tagline: (p) => p ? `Tier ${unlockedMaxTier(p)} unlocked · flight simulator for scams` : "Flight simulator for scams",
  },
  { id: "feed", name: "The Feed", Icon: Newspaper, unlocked: false, tagline: () => "Spot misinformation in a scrolling feed." },
  { id: "market", name: "The Market", Icon: Store, unlocked: false, tagline: () => "Fake shops, phishing DMs, scam ads." },
  { id: "arena", name: "The Arena", Icon: Swords, unlocked: false, tagline: () => "Multiplayer. The Imposter Protocol." },
  { id: "studio", name: "The Studio", Icon: Clapperboard, unlocked: false, tagline: () => "Survivors recreate scams. Forgery filter." },
  { id: "archive", name: "The Archive", Icon: Library, unlocked: false, tagline: () => "Progress Ladder. Survivor library." },
  { id: "hall", name: "City Hall", Icon: Landmark, unlocked: true, to: "/city-hall", tagline: () => "Your Trust Calibration." },
];

function CityMap() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <section className="mb-12 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary mb-3">WELCOME TO THE CITY</div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
            Survive the age of scams,<br />deepfakes, and misinformation
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Seven districts. Each one teaches a survival skill through play — not tips. Start with{" "}
            <span className="text-foreground">The Mirror</span>: a flight simulator for scams.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISTRICTS.map((d) => (
            <DistrictTile key={d.id} d={d} profile={profile} />
          ))}
        </div>

        <footer className="mt-16 text-center text-xs font-mono text-muted-foreground tracking-widest">
          SPOTTING IS DYING · VERIFYING IS FOREVER
        </footer>
      </main>
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

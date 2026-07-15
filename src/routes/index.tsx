import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import {
  Eye,
  Newspaper,
  Store,
  Swords,
  Clapperboard,
  Library,
  Landmark,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: CityMap,
});

interface District {
  id: string;
  name: string;
  tagline: string;
  Icon: typeof Eye;
  unlocked: boolean;
  to?: string;
}

const DISTRICTS: District[] = [
  {
    id: "mirror",
    name: "The Mirror",
    tagline: "Real person, or imposter? A live conversation.",
    Icon: Eye,
    unlocked: true,
    to: "/mirror",
  },
  {
    id: "feed",
    name: "The Feed",
    tagline: "Spot misinformation in a scrolling social feed.",
    Icon: Newspaper,
    unlocked: false,
  },
  {
    id: "market",
    name: "The Market",
    tagline: "Fake shops, phishing DMs, scam ads.",
    Icon: Store,
    unlocked: false,
  },
  {
    id: "arena",
    name: "The Arena",
    tagline: "Multiplayer. The Imposter Protocol.",
    Icon: Swords,
    unlocked: false,
  },
  {
    id: "studio",
    name: "The Studio",
    tagline: "Survivors recreate scams. Forgery filter.",
    Icon: Clapperboard,
    unlocked: false,
  },
  {
    id: "archive",
    name: "The Archive",
    tagline: "Survivor library. Difficulty ladder.",
    Icon: Library,
    unlocked: false,
  },
  {
    id: "hall",
    name: "City Hall",
    tagline: "Your Trust Calibration. Classroom mode.",
    Icon: Landmark,
    unlocked: true,
    to: "/city-hall",
  },
];

function CityMap() {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <section className="mb-12 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary mb-3">
            WELCOME TO THE CITY
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
            Survive the age of scams,
            <br />
            deepfakes, and misinformation
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Seven districts. Each one teaches a survival skill through play — not
            through tips. Start with{" "}
            <span className="text-foreground">The Mirror</span>: a flight
            simulator for scams.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISTRICTS.map((d) => (
            <DistrictTile key={d.id} d={d} />
          ))}
        </div>

        <footer className="mt-16 text-center text-xs font-mono text-muted-foreground tracking-widest">
          SPOTTING IS DYING · VERIFYING IS FOREVER
        </footer>
      </main>
    </div>
  );
}

function DistrictTile({ d }: { d: District }) {
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
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            d.unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!d.unlocked && (
          <span className="flex items-center gap-1.5 rounded-full border border-caution/40 bg-caution/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-caution">
            <Lock className="h-3 w-3" /> In dev
          </span>
        )}
        {d.unlocked && (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
            Open
          </span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold">{d.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{d.tagline}</p>
      {d.unlocked && (
        <div className="mt-4 font-mono text-xs tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
          ENTER →
        </div>
      )}
    </div>
  );
  if (d.unlocked && d.to) {
    return (
      <Link to={d.to as "/mirror"} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

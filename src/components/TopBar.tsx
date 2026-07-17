import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Volume2, VolumeX, BookOpen, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  loadProfile,
  calibrationLabel,
  operatorCallsign,
  type TrustProfile,
} from "@/lib/mirror/profile";
import { isMuted, setMuted } from "@/lib/mirror/audio";
import { VisualQualityToggle } from "@/components/VisualQualityToggle";
import { AccessPanel } from "@/components/AccessPanel";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp } from "@/lib/ranks";

const NAV_GROUPS: { label: string; items: { label: string; to: string; desc?: string }[] }[] = [
  {
    label: "PLAY",
    items: [
      { label: "The City", to: "/", desc: "Enter MILVERSE" },
      { label: "Daily Drop", to: "/drop", desc: "Today's case" },
      { label: "The Feed", to: "/feed", desc: "Verify or scroll" },
      { label: "The Mirror", to: "/mirror", desc: "Read the room" },
      { label: "The Paper", to: "/paper", desc: "Read like a pro" },
      { label: "Boss Fights", to: "/boss", desc: "Take down operators" },
    ],
  },
  {
    label: "LEARN",
    items: [
      { label: "First Phone", to: "/first-phone", desc: "For juniors" },
      { label: "Field Manual", to: "/manual", desc: "Tactics reference" },
      { label: "City Charter", to: "/charter", desc: "Our promises" },
      { label: "Quick Tour", to: "/quick-tour", desc: "30-second orientation" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { label: "For Educators", to: "/educators", desc: "Classroom kit" },
      { label: "For Family", to: "/family", desc: "Household dashboard" },
      { label: "Visit", to: "/visit", desc: "3-minute guided tour" },
      { label: "City Hall", to: "/city-hall", desc: "Vote & propose" },
      { label: "Archive", to: "/archive", desc: "Real cases" },
    ],
  },
];

export function TopBar() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [muted, setLocalMuted] = useState(false);
  const [manualUnlocks, setManualUnlocks] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setProfile(loadProfile());
    setLocalMuted(isMuted());
    setManualUnlocks(loadUnlocked().size);
    const onProfile = () => setProfile(loadProfile());
    const onMute = () => setLocalMuted(isMuted());
    const onManual = () => setManualUnlocks(loadUnlocked().size);
    window.addEventListener("storage", onProfile);
    window.addEventListener("milverse:profile", onProfile);
    window.addEventListener("milverse:mute", onMute);
    window.addEventListener("milverse:manual", onManual);
    return () => {
      window.removeEventListener("storage", onProfile);
      window.removeEventListener("milverse:profile", onProfile);
      window.removeEventListener("milverse:mute", onMute);
      window.removeEventListener("milverse:manual", onManual);
    };
  }, []);

  const cal = profile ? calibrationLabel(profile) : { label: "STANDBY", tone: "neutral" as const };
  const call = profile ? operatorCallsign(profile) : "———";
  const xp = computeXp(profile, manualUnlocks, profile?.publishedCount ?? 0);
  const noirRank = rankFromXp(xp);
  const toneClass =
    cal.tone === "good"
      ? "text-primary border-primary/50"
      : cal.tone === "warn"
        ? "text-caution border-caution/50"
        : cal.tone === "bad"
          ? "text-destructive border-destructive/50"
          : "text-muted-foreground border-border";

  return (
    <header className="print:hidden sticky top-0 z-50 border-b-2 border-primary/30 bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-3 group min-w-0">
          <div className="relative h-7 w-7 shrink-0">
            <div className="absolute inset-0 rounded-sm bg-primary shadow-[0_0_18px_oklch(0.82_0.14_195/0.7)] group-hover:animate-pulse" />
            <div className="absolute inset-1 rounded-sm border border-background/60" />
          </div>
          <div className="min-w-0">
            <div className="stencil text-sm text-foreground leading-none">MILVERSE</div>
            <div className="stencil text-[9px] text-primary/70 mt-0.5 hidden sm:block lg:hidden xl:block truncate">
              MEDIA &amp; INFORMATION LITERACY LAB
            </div>
          </div>
        </Link>

        {/* Desktop primary nav */}
        <nav aria-label="Primary" className="hidden lg:flex items-center justify-center gap-1">
          {NAV_GROUPS.flatMap((g) => g.items)
            .filter((i) => ["/", "/first-phone", "/educators", "/family", "/visit"].includes(i.to))
            .map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={`relative stencil text-[10px] tracking-widest rounded px-2.5 py-1.5 transition-colors ${
                    active
                      ? "text-primary bg-primary/10 after:absolute after:left-2 after:right-2 after:-bottom-[9px] after:h-[2px] after:bg-primary after:shadow-[0_0_8px_oklch(0.82_0.14_195/0.7)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label.toUpperCase()}
                </Link>
              );
            })}

          <button
            onClick={() => setNavOpen(true)}
            className="stencil text-[10px] tracking-widest rounded px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent inline-flex items-center gap-1"
            aria-label="Open full menu"
          >
            <Menu className="h-3.5 w-3.5" /> ALL
          </button>
        </nav>

        <div className="flex items-center gap-2 justify-end">
          <div className="hidden xl:flex items-center gap-2 stencil text-[10px] text-muted-foreground border border-border rounded px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary hud-blink" />
            <span>HANDLE</span>
            <span className="text-foreground">{call}</span>
          </div>
          <Link
            to="/manual"
            className="hidden md:inline-flex items-center gap-1.5 rounded border border-border px-2 py-1.5 stencil text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent"
            title="Field Manual"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">MANUAL</span>
          </Link>
          <VisualQualityToggle />
          <AccessPanel />
          <button
            onClick={() => {
              setMuted(!muted);
              setLocalMuted(!muted);
            }}
            className="rounded border border-border p-2 text-muted-foreground transition hover:text-foreground hover:bg-accent"
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <Link
            to="/profile"
            className={`hidden sm:flex items-center gap-2 rounded border px-2.5 py-1.5 stencil text-[10px] transition-colors hover:bg-accent ${toneClass}`}
            title={`${noirRank.current.name} · ${xp} XP${noirRank.next ? ` · next ${noirRank.next.name}` : ""}`}
          >
            <span className="opacity-70">{noirRank.current.code}</span>
            <span className="hidden md:inline text-foreground/90">{noirRank.current.name}</span>
            <span className="hidden lg:inline-block h-1 w-8 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full bg-primary"
                style={{ width: `${Math.round(noirRank.progress * 100)}%` }}
              />
            </span>
            <span className="hidden lg:inline text-muted-foreground">·</span>
            <span className="hidden lg:inline opacity-80">{cal.label.toUpperCase()}</span>
          </Link>

          {/* Mobile / catch-all menu trigger */}
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden rounded border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <SheetTitle className="stencil text-sm text-foreground">MILVERSE</SheetTitle>
                <SheetClose
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </SheetClose>
              </div>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <nav aria-label="Full site" className="px-2 py-3">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div className="stencil text-[10px] tracking-[0.2em] text-primary/70 px-3 pb-1">
                      {group.label}
                    </div>
                    <ul className="flex flex-col">
                      {group.items.map((item) => {
                        const active =
                          item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                        return (
                          <li key={item.to}>
                            <SheetClose asChild>
                              <Link
                                to={item.to}
                                aria-current={active ? "page" : undefined}
                                className={`flex flex-col rounded px-3 py-2 border-l-2 transition-colors ${
                                  active
                                    ? "bg-primary/10 text-primary border-primary"
                                    : "text-foreground hover:bg-accent border-transparent"
                                }`}
                              >
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.desc && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {item.desc}
                                  </span>
                                )}
                              </Link>
                            </SheetClose>
                          </li>

                        );
                      })}
                    </ul>
                  </div>
                ))}
                <div className="border-t border-border px-3 pt-3 mt-2 flex flex-col gap-2">
                  <SheetClose asChild>
                    <Link
                      to="/profile"
                      className="stencil text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      PROFILE · {noirRank.current.name} · {xp} XP
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/pilot"
                      className="stencil text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      PILOT ACCESS
                    </Link>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

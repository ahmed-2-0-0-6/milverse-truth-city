import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Volume2, VolumeX, BookOpen, Menu } from "lucide-react";
import { InboxTray } from "@/components/inbox/InboxTray";
import { RankChip } from "@/components/rank/RankChip";
import { useJuniorMode } from "@/hooks/useJuniorMode";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { GameBar, isGameSurface } from "@/components/GameBar";
import {
  loadProfile,
  calibrationLabel,
  operatorCallsign,
  type TrustProfile,
} from "@/lib/mirror/profile";
import { isMuted, setMuted } from "@/lib/mirror/audio";

import { SoundIntroChip } from "@/components/SoundIntroChip";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { FullscreenPrompt } from "@/components/FullscreenPrompt";
import { AccessPanel } from "@/components/AccessPanel";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp } from "@/lib/ranks";

type NavItem = { label: string; to: string; desc?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "SIMULATION (THE MIRAGE)",
    items: [
      { label: "The Mirage City", to: "/", desc: "Enter The Mirage — City of Verification" },
      { label: "Daily Drop", to: "/drop", desc: "One quick case a day. Keep the streak alive" },
      { label: "The Feed", to: "/feed", desc: "Is that viral forward true? Prove it" },
      { label: "The Mirror", to: "/mirror", desc: "Catch the scammer sliding into your DMs" },
      { label: "The Shift", to: "/shift", desc: "Five cases, three lives, one score" },
      { label: "The Paper", to: "/paper", desc: "The city's newspaper. Play the front page" },
      { label: "Boss Fights", to: "/boss", desc: "Con artists your fact-checks can't touch" },
    ],
  },
  {
    label: "AGE & GRADE SPECTRUM",
    items: [
      { label: "Early Years (Ages 4-7)", to: "/early-years", desc: "Picture stories & parent co-reading" },
      { label: "First Phone (Grades 1-8)", to: "/first-phone", desc: "10-lesson interactive phone simulator" },
      { label: "AI & Deepfakes (Grades 9-12+)", to: "/ai-literacy", desc: "Synthetic media & provenance verification" },
      { label: "Field Manual Codex", to: "/manual", desc: "Every scam trick & manipulation tactic" },
      { label: "City Charter", to: "/charter", desc: "The founding articles of digital trust" },
    ],
  },
  {
    label: "COMMUNITY & SCHOOLS",
    items: [
      { label: "Educators & NGOs", to: "/educators", desc: "Classroom kit, Braille & printable packs" },
      { label: "Teacher Academy", to: "/teacher-academy", desc: "Professional development & lesson plans" },
      { label: "Family & Homeschool", to: "/homeschool", desc: "Household agreements & family toolkits" },
      { label: "Community Commons", to: "/community", desc: "Grade rooms, student posts & reflection" },
      { label: "Guided Tour", to: "/visit", desc: "3-minute UNESCO evaluation tour" },
      { label: "Youth Studio", to: "/studio", desc: "Design your own scam case. Test your friends" },
    ],
  },
];

// Desktop primary rail — one item per group, everything else lives in the full menu
const DESKTOP_PRIMARY: NavItem[] = [
  { label: "City", to: "/" },
  { label: "Mirror", to: "/mirror" },
  { label: "Shift", to: "/shift" },
  { label: "Feed", to: "/feed" },
  { label: "Manual", to: "/manual" },
];

export function TopBar() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [muted, setLocalMuted] = useState(false);
  const [manualUnlocks, setManualUnlocks] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const junior = useJuniorMode();
  const showInbox =
    junior.ready &&
    !junior.active &&
    !pathname.startsWith("/visit") &&
    !pathname.startsWith("/first-phone");
  const showRankChip =
    !pathname.startsWith("/visit") &&
    !pathname.startsWith("/first-phone") &&
    !pathname.startsWith("/family");

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

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header
      role="banner"
      className="print:hidden fixed top-0 inset-x-0 z-50 bg-transparent pointer-events-none"
    >
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 sm:px-4 py-2 safe-top pointer-events-none [&>*]:pointer-events-auto">

        {/* ── Brand ── */}
        <Link
          to="/"
          className="flex items-center gap-2 min-w-0 focus-visible:outline-none rounded-md -m-1 p-1"
          aria-label="MILVERSE home"
        >
          <div className="relative h-7 w-7 shrink-0" aria-hidden>
            <div className="absolute inset-0 rounded-sm bg-primary shadow-[0_0_18px_oklch(0.82_0.14_195/0.7)]" />
            <div className="absolute inset-1 rounded-sm border border-background/60" />
          </div>
          <div className="stencil text-[13px] sm:text-sm text-foreground leading-none truncate">
            MILVERSE
          </div>
        </Link>

        {/* ── Top-Center Floating Fullscreen Toggle ── */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10 pointer-events-auto">
          <FullscreenToggle />
        </div>

        {/* ── Compact actions — only truly essential, always-fitting items ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showRankChip && <RankChip />}
          {showInbox && <InboxTray />}

          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center h-11 w-11 tap rounded-md border border-border text-foreground hover:bg-accent"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 safe-top">
                <SheetTitle className="stencil text-sm text-foreground">MILVERSE</SheetTitle>
              </div>
              <SheetDescription className="sr-only">Site navigation and account</SheetDescription>


              {/* Status strip inside the drawer — one glance summary */}
              <div className="border-b border-border/60 px-4 py-3 flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                <span
                  className={`chip !py-1 ${toneClass}`}
                  aria-label={`Calibration ${cal.label}`}
                >
                  {noirRank.current.code} · {cal.label}
                </span>
                <span className="ml-auto">{xp} XP</span>
              </div>

              <nav aria-label="Full site" className="px-2 py-3">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div className="stencil text-[10px] tracking-[0.2em] text-primary/70 px-3 pb-1">
                      {group.label}
                    </div>
                    <ul className="flex flex-col">
                      {group.items.map((item) => {
                        const active = isActive(item.to);
                        return (
                          <li key={item.to}>
                            <SheetClose asChild>
                              <Link
                                to={item.to}
                                aria-current={active ? "page" : undefined}
                                className={`tap flex flex-col justify-center rounded-md px-3 py-3 border-l-2 transition-colors ${
                                  active
                                    ? "bg-primary/10 text-primary border-primary"
                                    : "text-foreground hover:bg-accent border-transparent"
                                }`}
                              >
                                <span className="text-sm font-medium leading-tight">
                                  {item.label}
                                </span>
                                {item.desc && (
                                  <span className="text-[11px] text-muted-foreground leading-snug mt-0.5">
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
                <div className="border-t border-border px-3 pt-3 mt-2 flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link
                      to="/profile"
                      className="tap flex items-center rounded-md px-2 text-sm text-foreground hover:bg-accent"
                    >
                      Profile · {noirRank.current.name} · {xp} XP
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/pilot"
                      className="tap flex items-center rounded-md px-2 text-sm text-foreground hover:bg-accent"
                    >
                      Pilot Access
                    </Link>
                  </SheetClose>
                  <button
                    type="button"
                    onClick={() => {
                      setMuted(!muted);
                      setLocalMuted(!muted);
                    }}
                    className="tap flex items-center gap-2 rounded-md px-2 text-sm text-foreground hover:bg-accent text-left"
                    aria-pressed={muted}
                  >
                    {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                    {muted ? "Unmute sound" : "Mute sound"}
                  </button>



                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isGameSurface(pathname) && (
        <div className="xl:hidden overflow-x-auto pointer-events-auto">
          <GameBar compact />
        </div>
      )}


      <SoundIntroChip />
      <FullscreenPrompt />
    </header>
  );
}

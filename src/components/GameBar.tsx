// MILVERSE — GAME BAR.
// Surfaces the existing rank ladder + XP + streak on every playing page.
// Read-only over ranks.ts / profile — never mutates. Recomputes on the
// "milverse:profile" event (and manual/retest siblings). The +XP pop is
// decorative; the accessible truth lives on the progressbar's aria-valuenow.

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Flame, Heart } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { readDailyStatus } from "@/lib/daily/profile";
import { computeXp, rankFromXp, RANKS } from "@/lib/ranks";
import { getActiveShift, playedToday, type ActiveShift } from "@/lib/shift/state";

interface Snapshot {
  xp: number;
  levelIdx: number; // 0-based idx in RANKS
  rankName: string;
  cur: number; // xp above current threshold
  span: number; // xp span to next (0 at max)
  next: string | null;
  streak: number;
  streakAtRisk: boolean;
}

function snapshot(): Snapshot {
  const p = loadProfile();
  const manual = loadUnlocked().size;
  const xp = computeXp(p, manual, p.publishedCount ?? 0);
  const r = rankFromXp(xp);
  const levelIdx = RANKS.findIndex((x) => x.id === r.current.id);
  const cur = xp - r.current.minXp;
  const span = r.next ? r.next.minXp - r.current.minXp : 0;
  const daily = readDailyStatus();
  return {
    xp,
    levelIdx,
    rankName: r.current.name,
    cur,
    span,
    next: r.next?.name ?? null,
    streak: daily.streak,
    streakAtRisk: !daily.playedToday && daily.streak >= 1,
  };
}

export function GameBar({ compact = false }: { compact?: boolean }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const prevXp = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);

  useEffect(() => {
    const push = () => {
      const s = snapshot();
      setSnap(s);
      if (prevXp.current != null && s.xp > prevXp.current) {
        const delta = s.xp - prevXp.current;
        setPop(delta);
        if (popTimer.current) window.clearTimeout(popTimer.current);
        popTimer.current = window.setTimeout(() => setPop(null), 1400);
      }
      prevXp.current = s.xp;
    };
    push();
    const events = ["milverse:profile", "milverse:manual", "milverse:retests", "storage"];
    events.forEach((e) => window.addEventListener(e, push));
    return () => {
      events.forEach((e) => window.removeEventListener(e, push));
      if (popTimer.current) window.clearTimeout(popTimer.current);
    };
  }, []);

  if (!snap) {
    // Deterministic placeholder — same slot count so layout doesn't jump.
    return (
      <div
        className={`flex items-center gap-2 stencil text-[10px] text-muted-foreground ${
          compact ? "px-3 py-1.5" : ""
        }`}
        aria-hidden
      >
        <span className="opacity-40">LVL — · ———</span>
      </div>
    );
  }

  const atMax = snap.span === 0;
  const pct = atMax ? 100 : Math.max(0, Math.min(100, Math.round((snap.cur / snap.span) * 100)));
  const barLabel = atMax
    ? `Level ${snap.levelIdx + 1}, ${snap.rankName}, maximum rank`
    : `Level ${snap.levelIdx + 1}, ${snap.rankName}, ${snap.cur} of ${snap.span} XP to ${snap.next}`;

  const streakLabel = snap.streak >= 1
    ? `Streak ${snap.streak} day${snap.streak === 1 ? "" : "s"}, ${
        snap.streakAtRisk ? "today unplayed" : "today safe"
      }`
    : "";

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 ${
        compact ? "w-full justify-between px-3 py-1.5" : ""
      }`}
      role="group"
      aria-label="Progress"
    >
      {/* LEVEL CHIP */}
      <Link
        to="/profile"
        className="stencil text-[10px] tracking-widest rounded border border-border px-2 py-1 text-foreground/90 hover:bg-accent hover:text-primary min-h-[36px] inline-flex items-center whitespace-nowrap"
        aria-label={`Rank: Level ${snap.levelIdx + 1}, ${snap.rankName}. Open profile.`}
      >
        LVL {snap.levelIdx + 1} · {snap.rankName}
      </Link>

      {/* XP BAR */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="relative h-1.5 w-20 sm:w-28 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-label={barLabel}
          aria-valuemin={0}
          aria-valuemax={atMax ? 1 : snap.span}
          aria-valuenow={atMax ? 1 : snap.cur}
        >
          <span
            className="xpbar-fill block h-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="stencil text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
          {atMax ? "MAX" : `${snap.cur} / ${snap.span}`}
        </span>
        {pop != null && (
          <span
            aria-hidden
            className="xp-pop stencil text-[10px] text-primary whitespace-nowrap"
          >
            +{pop} XP
          </span>
        )}
      </div>

      {/* STREAK */}
      {snap.streak >= 1 && (
        <Link
          to="/drop"
          className={`inline-flex items-center gap-1 rounded border px-2 py-1 stencil text-[10px] min-h-[36px] whitespace-nowrap ${
            snap.streakAtRisk
              ? "border-caution/60 text-caution hover:bg-caution/10"
              : "border-primary/50 text-primary hover:bg-primary/10"
          }`}
          aria-label={streakLabel}
          title={streakLabel}
        >
          <Flame className="h-3 w-3" />
          <span className="tabular-nums">{snap.streak}</span>
        </Link>
      )}
    </div>
  );
}

// Route prefixes on which the game bar (and PLAY button) must NOT render.
const EXCLUDED_PREFIXES = [
  "/visit",
  "/family",
  "/educators",
  "/kit",
  "/pilot",
  "/review",
  "/first-phone",
];

export function isGameSurface(pathname: string): boolean {
  return !EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname === p);
}

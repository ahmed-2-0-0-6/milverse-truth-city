// MILVERSE — DailyBeacon
// A pulsing "TODAY'S FORWARD" chip that links to /drop. Shows countdown to
// next rollover if already played, or "PLAY NOW" if not. Zero heavy render.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, Radio } from "lucide-react";
import { dropDateKey, secondsToNextDrop, isDesignerFriday } from "@/lib/daily/rotation";
import { readDailyStatus } from "@/lib/daily/profile";

function hhmmss(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function DailyBeacon({ compact = false }: { compact?: boolean }) {
  const [played, setPlayed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [remain, setRemain] = useState<number>(secondsToNextDrop());
  const [friday, setFriday] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const s = readDailyStatus();
      setPlayed(s.playedToday);
      setStreak(s.streak);
      setFriday(isDesignerFriday());
    };
    refresh();
    const onProfile = () => refresh();
    window.addEventListener("milverse:profile", onProfile);
    const tick = window.setInterval(() => setRemain(secondsToNextDrop()), 1000);
    return () => {
      window.removeEventListener("milverse:profile", onProfile);
      window.clearInterval(tick);
    };
  }, []);

  const dateKey = dropDateKey();

  if (compact) {
    return (
      <Link
        to="/paper"
        className="inline-flex items-center gap-2 rounded-sm border border-primary/60 bg-primary/10 px-3 py-1.5 stencil text-[10px] text-primary hover:bg-primary/20 transition"
        title="Today's Forward"
      >
        <span className="relative h-2 w-2">
          <span className={`absolute inset-0 rounded-full ${played ? "bg-muted-foreground" : "bg-primary animate-ping"}`} />
          <span className={`absolute inset-0 rounded-full ${played ? "bg-muted-foreground" : "bg-primary"}`} />
        </span>
        <span>{played ? "COME BACK" : "TODAY'S FORWARD"}</span>
        {played && <span className="text-muted-foreground normal-case tracking-normal">· {hhmmss(remain)}</span>}
      </Link>
    );
  }

  return (
    <Link
      to="/paper"
      className="group relative block overflow-hidden rounded-sm border border-primary/60 bg-black/40 backdrop-blur px-5 py-4 hover:border-primary transition"
      style={{ boxShadow: "0 0 40px oklch(0.82 0.16 85 / 0.25)" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{
        backgroundImage: "radial-gradient(rgba(245,185,66,0.2) 1px, transparent 1px)",
        backgroundSize: "3px 3px",
      }} />
      <div className="relative flex items-center gap-4">
        <div className="relative h-10 w-10 shrink-0">
          {!played && <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />}
          <span className="absolute inset-1 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Radio className="h-4 w-4" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="stencil text-[10px] text-primary/80 flex items-center gap-2">
            {friday && <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-primary">DESIGNER FRIDAY</span>}
            AAJ KA FORWARD · {dateKey}
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-white leading-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            {played ? "THE CITY HAS MOVED ON." : "TODAY'S FORWARD IS OPEN."}
          </div>
          <div className="mt-0.5 text-xs text-white/60">
            {played
              ? <>Next drop in <span className="text-primary tabular-nums">{hhmmss(remain)}</span>. Yesterday viewable on the drop page.</>
              : <>One case. One wager. One receipt. <span className="text-primary">Play now →</span></>}
          </div>
        </div>
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-sm border border-primary/40 px-2 py-1 stencil text-[10px] text-primary">
            <Flame className="h-3 w-3" /> {streak}D
          </div>
        )}
      </div>
    </Link>
  );
}

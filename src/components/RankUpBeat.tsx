// MILVERSE — Rank-up cinematic beat.
// Global watcher: mounts once at the app root, listens to profile / manual events,
// recomputes rank from XP, and plays a "badge forges on screen" cutscene when the
// player crosses a rank threshold. LITE + prefers-reduced-motion: silent no-op
// (rank still saved so it never re-fires).

import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp, RANKS, type RankInfo } from "@/lib/ranks";
import { useVisualMode } from "@/lib/visual-quality";
import { ShieldCheck, Eye, Search, Compass, FileText, Building2 } from "lucide-react";

const KEY = "milverse.rank.v1";

const ICONS: Record<string, typeof ShieldCheck> = {
  citizen: ShieldCheck,
  spotter: Eye,
  analyst: Search,
  investigator: Compass,
  editor: FileText,
  "city-designer": Building2,
};

export function RankUpBeat() {
  const { mode } = useVisualMode();
  const [rankUp, setRankUp] = useState<RankInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function check() {
      const profile = loadProfile();
      const manual = loadUnlocked().size;
      const xp = computeXp(profile, manual, profile.publishedCount ?? 0);
      const cur = rankFromXp(xp).current;
      const prev = localStorage.getItem(KEY);
      if (prev !== cur.id) {
        localStorage.setItem(KEY, cur.id);
        if (prev) {
          const prevIdx = RANKS.findIndex((r) => r.id === prev);
          const curIdx = RANKS.findIndex((r) => r.id === cur.id);
          if (curIdx > prevIdx) setRankUp(cur);
        }
      }
    }

    check();
    const on = () => check();
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  useEffect(() => {
    if (!rankUp) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (mode !== "cinematic" || reduce) {
      const t = window.setTimeout(() => setRankUp(null), 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setRankUp(null), 3400);
    return () => window.clearTimeout(t);
  }, [rankUp, mode]);

  if (!rankUp) return null;
  const Icon = ICONS[rankUp.id] ?? ShieldCheck;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-black/85"
      aria-live="polite"
      style={{ animation: "rankup-dim 0.35s ease-out both" }}
    >
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.20) 0%, transparent 60%)",
        animation: "rankup-surge 1.6s ease-out both",
      }} />
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="stencil text-[11px] tracking-[0.45em] text-primary/80" style={{ animation: "rankup-fadein 0.5s ease-out 0.2s both" }}>
          RANK UP
        </div>
        <div
          className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-primary/70 bg-black"
          style={{
            boxShadow: "0 0 60px rgba(34,211,238,0.55), inset 0 0 40px rgba(34,211,238,0.25)",
            animation: "rankup-forge 1.4s cubic-bezier(.2,.6,.2,1) both",
          }}
        >
          <div className="absolute inset-0 rounded-2xl" style={{
            background: "linear-gradient(180deg, rgba(255,180,80,0.35), rgba(34,211,238,0.15))",
            mixBlendMode: "screen",
            animation: "rankup-pour 1.4s ease-out both",
          }} />
          <Icon className="relative h-14 w-14 text-primary" strokeWidth={1.4} />
        </div>
        <div
          className="verdict-stamp rounded-md border-2 border-primary/80 bg-black/90 px-6 py-3"
          style={{ animation: "rankup-slam 0.5s cubic-bezier(.2,.9,.2,1.1) 1.1s both" }}
        >
          <div
            className="text-4xl sm:text-5xl font-black tracking-tight text-primary"
            style={{ fontFamily: '"Bebas Neue", sans-serif', textShadow: "0 0 22px rgba(34,211,238,0.6)" }}
          >
            {rankUp.name}
          </div>
          <div className="stencil text-[10px] tracking-[0.3em] text-primary/70 mt-1">
            {rankUp.code} · {rankUp.tagline}
          </div>
        </div>
      </div>
    </div>
  );
}

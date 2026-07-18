// MILVERSE — THE ROAD.
// A visible level path: every rung on screen, walked ones filled,
// future ones DIMMED BUT VISIBLE with name + tagline + threshold.
// Between rungs, a connector line filled to the exact progress
// fraction returned by rankFromXp. A "WHAT EARNS XP" card at the
// foot prints the REAL coefficients from computeXp.
//
// Read-only over ranks.ts / profile / manual state. No animation
// beyond a CSS-only fill transition (killed under reduced-motion
// and high-legibility).

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp, RANKS, type RankInfo } from "@/lib/ranks";

interface Snapshot {
  xp: number;
  currentId: string;
  nextId: string | null;
  progress: number; // 0..1 between current and next
  next: RankInfo | null;
  needed: number; // XP to next (0 at MAX)
}

function snapshot(profile: TrustProfile | null, manual: number): Snapshot {
  const xp = computeXp(profile, manual, profile?.publishedCount ?? 0);
  const r = rankFromXp(xp);
  const needed = r.next ? Math.max(0, r.next.minXp - xp) : 0;
  return {
    xp,
    currentId: r.current.id,
    nextId: r.next?.id ?? null,
    progress: r.progress,
    next: r.next,
    needed,
  };
}

export function TheRoad({ id = "the-road" }: { id?: string }) {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [manual, setManual] = useState(0);

  useEffect(() => {
    setProfile(loadProfile());
    setManual(loadUnlocked().size);
    const on = () => {
      setProfile(loadProfile());
      setManual(loadUnlocked().size);
    };
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  const snap = useMemo(() => snapshot(profile, manual), [profile, manual]);

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="stencil text-[10px] tracking-[0.3em] text-primary/80">// THE ROAD</div>
          <h2
            id={`${id}-title`}
            className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-foreground"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            THE RANK LADDER
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-lg">
            Every rung is visible from day one. Walk the ones behind you. See what's next.
          </p>
        </div>
        <div className="text-right">
          <div className="stencil text-[9px] tracking-widest text-muted-foreground">XP</div>
          <div
            className="text-3xl font-black text-primary tabular-nums"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {snap.xp}
          </div>
        </div>
      </div>

      <ol className="mt-4 relative" aria-label="Rank ladder — six rungs">
        {RANKS.map((r, i) => {
          const isCurrent = r.id === snap.currentId;
          const isWalked = snap.xp >= r.minXp && !isCurrent;
          const isLocked = snap.xp < r.minXp;
          const nextRung = RANKS[i + 1] ?? null;
          const isConnectorLive = isCurrent && nextRung; // the one that fills fractionally
          const connectorFill = !nextRung
            ? 0
            : isWalked || (isCurrent && snap.xp >= nextRung.minXp)
              ? 1
              : isCurrent
                ? snap.progress
                : 0;
          const stateWord = isCurrent ? "current" : isLocked ? "locked" : "walked";
          const ariaExtra =
            isCurrent && snap.next
              ? `, ${snap.needed} XP to ${snap.next.name}`
              : isLocked
                ? `, ${Math.max(0, r.minXp - snap.xp)} XP to go`
                : "";
          return (
            <li
              key={r.id}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${r.name}, ${r.minXp} XP threshold, ${stateWord}${ariaExtra}`}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Rung marker + connector column */}
              <div className="relative flex flex-col items-center" aria-hidden="true">
                <div
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    isCurrent
                      ? "border-primary bg-primary/20 text-primary"
                      : isWalked
                        ? "border-primary/70 bg-primary/10 text-primary/90"
                        : "border-dashed border-border bg-background/60 text-muted-foreground"
                  }`}
                >
                  <span className="stencil text-[10px] tracking-widest">{r.code}</span>
                </div>
                {nextRung && (
                  <div className="relative mt-1 w-[3px] flex-1 min-h-[36px] rounded bg-muted overflow-hidden">
                    <div
                      className={`road-fill absolute inset-x-0 top-0 bg-primary ${
                        isConnectorLive ? "" : ""
                      }`}
                      style={{
                        height: `${Math.round(connectorFill * 100)}%`,
                        opacity: connectorFill > 0 ? 1 : 0.5,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Rung body */}
              <div
                className={`flex-1 rounded-md border px-3 py-2 ${
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : isWalked
                      ? "border-border bg-card"
                      : "border-dashed border-border bg-muted/10"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className={`font-black text-xl tracking-tight ${isLocked ? "text-muted-foreground" : "text-foreground"}`}
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {r.name}
                  </div>
                  <div className="stencil text-[10px] tracking-widest text-muted-foreground tabular-nums shrink-0">
                    {r.minXp} XP
                  </div>
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground italic">{r.tagline}</div>
                {isCurrent && snap.next && (
                  <div className="mt-1 stencil text-[10px] tracking-widest text-primary tabular-nums">
                    {snap.needed} XP TO {snap.next.name}
                  </div>
                )}
                {isCurrent && !snap.next && (
                  <div className="mt-1 stencil text-[10px] tracking-widest text-primary">
                    MAX RANK · KEEP THE CITY HONEST
                  </div>
                )}
                {isLocked && (
                  <div className="mt-1 stencil text-[10px] tracking-widest text-muted-foreground tabular-nums">
                    LOCKED · {Math.max(0, r.minXp - snap.xp)} XP TO GO
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <EarnsCard />
    </section>
  );
}

/** WHAT EARNS XP — mono ledger, verbatim to computeXp's real coefficients.
 *  Wins ×25, plays ×5, calibration ×8, manual entries ×15, published ×40. */
function EarnsCard() {
  const rows: [string, string][] = [
    ["WIN A CASE", "+25"],
    ["PLAY ANYTHING", "+5"],
    ["STAY CALIBRATED", "+8"],
    ["READ A MANUAL PAGE", "+15"],
    ["PUBLISH A CASE", "+40"],
  ];
  return (
    <div className="mt-6 rounded-md border border-border bg-card p-4">
      <div className="stencil text-[10px] tracking-[0.3em] text-primary/80">// WHAT EARNS XP</div>
      <ul className="mt-3 divide-y divide-border" role="list">
        {rows.map(([label, amt]) => (
          <li key={label} className="flex items-baseline justify-between py-2">
            <span className="font-mono text-[12px] text-foreground/90 tracking-wide">{label}</span>
            <span className="stencil text-[11px] tracking-widest text-primary tabular-nums">
              {amt}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Calibration pays when a case ends without a miss and without a false alarm. Manual pages
        pay once per page unlocked. Publishing pays on a case that survives review.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/mirror"
          className="stencil text-[10px] tracking-widest rounded border border-primary/60 bg-primary/10 px-2.5 py-1.5 text-primary hover:bg-primary/20"
        >
          THE MIRROR →
        </Link>
        <Link
          to="/feed"
          className="stencil text-[10px] tracking-widest rounded border border-primary/60 bg-primary/10 px-2.5 py-1.5 text-primary hover:bg-primary/20"
        >
          THE FEED →
        </Link>
        <Link
          to="/manual"
          className="stencil text-[10px] tracking-widest rounded border border-border px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          FIELD MANUAL →
        </Link>
      </div>
    </div>
  );
}

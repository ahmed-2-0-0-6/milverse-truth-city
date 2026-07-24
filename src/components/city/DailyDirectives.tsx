// MILVERSE — Your City · Daily Directives (Phase 3).
// Three per-day micro-missions. Claim bricks when target met.
// Wires listeners on mount for retro-tracking of case solves + brick earns.

import { memo, useEffect, useMemo, useState } from "react";
import {
  COMBO_BONUS,
  claim,
  directiveDefs,
  directiveMeta,
  loadDirectives,
  progressOf,
  wireDirectiveListeners,
  type Directive,
  type DirectiveId,
} from "@/lib/city/directives";
import { useCoalescedRefresh } from "@/hooks/useCoalescedRefresh";

/** Milliseconds until local midnight. */
function msToMidnight(): number {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  return mid.getTime() - now.getTime();
}

function fmtLeft(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function DailyDirectives() {

  const [state, setState] = useState(() => loadDirectives());

  useEffect(() => {
    wireDirectiveListeners();
  }, []);
  useCoalescedRefresh(
    [
      "milverse:directives",
      "milverse:city",
      "milverse:bricks",
      "milverse:city:built",
    ],
    () => setState(loadDirectives()),
  );

  const defs = useMemo(() => directiveDefs(state), [state]);
  const meta = useMemo(() => directiveMeta(state), [state]);
  const doneCount = useMemo(
    () => defs.filter((d) => (state.progress[d.id] ?? 0) >= d.target).length,
    [defs, state.progress],
  );


  const readyIds = useMemo(
    () =>
      defs
        .filter((d) => !state.claimed[d.id] && (state.progress[d.id] ?? 0) >= d.target)
        .map((d) => d.id),
    [defs, state.claimed, state.progress],
  );

  // Countdown to midnight; also rolls the board over when the day flips.
  const [left, setLeft] = useState(() => msToMidnight());
  useEffect(() => {
    const t = setInterval(() => {
      const ms = msToMidnight();
      setLeft(ms);
      if (ms > 23 * 3600_000) setState(loadDirectives()); // just past midnight
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const claimOne = (id: DirectiveId) => {
    const def = defs.find((x) => x.id === id);
    const res = claim(id);
    if (res.ok) {
      window.dispatchEvent(
        new CustomEvent("milverse:toast", {
          detail: {
            title: res.combo ? "COMBO CLEARED" : "DIRECTIVE COMPLETE",
            body: res.combo
              ? `+${res.reward} +${res.combo} combo. Streak ${res.streak}.`
              : `+${res.reward} BRICKS credited.`,
          },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("milverse:directive:claimed", {
          detail: { label: def?.label ?? id, reward: res.reward, combo: res.combo, streak: res.streak },
        }),
      );
    }
    return res.ok;
  };

  const onClaim = (id: DirectiveId) => {
    if (claimOne(id)) setState(loadDirectives());
  };

  const onClaimAll = () => {
    let any = false;
    for (const id of readyIds) any = claimOne(id) || any;
    if (any) setState(loadDirectives());
  };




  return (
    <section className="mx-auto mt-4 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2.5 gap-3 flex-wrap">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="stencil text-[11px] tracking-widest text-amber-300">
              TODAY'S DIRECTIVES
            </h3>
            {meta.streak > 0 && (
              <span className="stencil text-[10px] tracking-widest text-emerald-300">
                STREAK · {meta.streak}D
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] text-amber-200/60 tabular-nums"
              title="Time until the board resets."
            >
              RESET IN {fmtLeft(left)}
            </span>
            <span className="font-mono text-[10px] text-amber-200/70 tabular-nums">
              {doneCount} / {defs.length} DONE
            </span>
            <span
              className={`stencil text-[10px] tracking-widest ${
                meta.comboClaimed ? "text-emerald-300" : meta.allDone ? "text-fuchsia-300 animate-pulse" : "text-amber-200/40"
              }`}
              title="Clear all three directives for a combo bonus."
            >
              COMBO +{COMBO_BONUS}
            </span>
            {readyIds.length > 1 && (
              <button
                type="button"
                onClick={onClaimAll}
                className="tap stencil text-[10px] tracking-widest rounded px-2.5 py-1 border border-emerald-400/60 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
              >
                CLAIM ALL ({readyIds.length})
              </button>
            )}
          </div>
        </header>


        <ul className="divide-y divide-amber-400/10">
          {defs.map((d) => (
            <DirectiveRow
              key={d.id}
              d={d}
              progress={progressOf(state, d.id, d)}
              claimed={!!state.claimed[d.id]}
              onClaim={() => onClaim(d.id)}
            />
          ))}
        </ul>

        <footer className="border-t border-amber-400/15 px-4 py-2 text-[10px] text-amber-100/50 font-mono">
          Directives refresh at midnight. Clear all three for the combo. Un-claimed rewards don't roll over.
        </footer>
      </div>
    </section>
  );
}

const DirectiveRow = memo(function DirectiveRow({
  d,
  progress,
  claimed,
  onClaim,
}: {
  d: Directive;
  progress: number;
  claimed: boolean;
  onClaim: () => void;
}) {
  const pct = Math.min(100, Math.round((progress / d.target) * 100));
  const complete = progress >= d.target;
  return (
    <li className="px-4 py-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-mono text-[12px] text-amber-100/90">{d.label}</div>
          <div className="text-[11px] text-amber-100/60 leading-snug">{d.detail}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="font-mono text-[11px] tabular-nums text-amber-200/70">
            {progress}/{d.target}
          </span>
          {claimed ? (
            <span className="stencil text-[10px] tracking-widest text-emerald-300">CLAIMED</span>
          ) : (
            <button
              type="button"
              onClick={onClaim}
              disabled={!complete}
              className={`tap stencil text-[10px] tracking-widest rounded px-2.5 py-1 border transition-colors ${
                complete
                  ? "border-emerald-400/60 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20"
                  : "border-amber-400/25 text-amber-200/40 cursor-not-allowed"
              }`}
              aria-label={`Claim ${d.reward} BRICKS for ${d.label}`}
            >
              {complete ? `CLAIM +${d.reward}` : `+${d.reward}`}
            </button>
          )}
        </div>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-amber-400/10 overflow-hidden" aria-hidden>
        <div
          className={`h-full ${complete ? "bg-emerald-400/70" : "bg-amber-400/60"} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
});


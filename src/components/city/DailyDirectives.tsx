// MILVERSE — Your City · Daily Directives (Phase 3).
// Three per-day micro-missions. Claim bricks when target met.
// Wires listeners on mount for retro-tracking of case solves + brick earns.

import { useEffect, useState } from "react";
import {
  claim,
  directiveDefs,
  loadDirectives,
  progressOf,
  wireDirectiveListeners,
  type Directive,
  type DirectiveId,
} from "@/lib/city/directives";

export function DailyDirectives() {
  const [state, setState] = useState(() => loadDirectives());

  useEffect(() => {
    wireDirectiveListeners();
    const on = () => setState(loadDirectives());
    window.addEventListener("milverse:directives", on);
    window.addEventListener("milverse:city", on);
    window.addEventListener("milverse:bricks", on);
    window.addEventListener("milverse:city:built", on);
    return () => {
      window.removeEventListener("milverse:directives", on);
      window.removeEventListener("milverse:city", on);
      window.removeEventListener("milverse:bricks", on);
      window.removeEventListener("milverse:city:built", on);
    };
  }, []);

  const defs = directiveDefs(state);
  const doneCount = defs.filter((d) => (state.progress[d.id] ?? 0) >= d.target).length;

  const onClaim = (id: DirectiveId) => {
    const res = claim(id);
    if (res.ok) {
      setState(loadDirectives());
      window.dispatchEvent(
        new CustomEvent("milverse:toast", {
          detail: { title: "DIRECTIVE COMPLETE", body: `+${res.reward} BRICKS credited.` },
        }),
      );
    }
  };

  return (
    <section className="mx-auto mt-4 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2.5 gap-3 flex-wrap">
          <h3 className="stencil text-[11px] tracking-widest text-amber-300">
            TODAY'S DIRECTIVES
          </h3>
          <span className="font-mono text-[10px] text-amber-200/70 tabular-nums">
            {doneCount} / {defs.length} DONE
          </span>
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
          Directives refresh at midnight. Un-claimed rewards don't roll over.
        </footer>
      </div>
    </section>
  );
}

function DirectiveRow({
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
}

// MILVERSE — Your City · Bulletin ticker (Phase 3).
// Read-only. Scrolls the derived headlines beneath the isometric map.
// Reduced-motion: falls back to a static rotating stack.

import { useEffect, useMemo, useState } from "react";
import { loadCity } from "@/lib/city/citySave";
import { bulletinsFor, type Bulletin } from "@/lib/city/bulletin";
import { titleFor, nextTitle } from "@/lib/city/title";

function usePrefersReducedMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setRm(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return rm;
}

export function CityBulletin() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener("milverse:city", on);
    window.addEventListener("milverse:bricks", on);
    window.addEventListener("milverse:city:built", on);
    return () => {
      window.removeEventListener("milverse:city", on);
      window.removeEventListener("milverse:bricks", on);
      window.removeEventListener("milverse:city:built", on);
    };
  }, []);

  const save = loadCity();
  const items: Bulletin[] = useMemo(() => bulletinsFor(save), [save]);
  const title = useMemo(() => titleFor(save), [save]);
  const next = useMemo(() => nextTitle(save), [save]);
  const rm = usePrefersReducedMotion();

  // Rotate for reduced-motion.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!rm) return;
    const t = setInterval(() => setIdx((n) => (n + 1) % Math.max(1, items.length)), 4200);
    return () => clearInterval(t);
  }, [rm, items.length]);

  return (
    <section className="mx-auto mt-4 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm overflow-hidden">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2 gap-3 flex-wrap">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="stencil text-[10px] tracking-widest text-amber-300">
              CITY DESK BULLETIN
            </span>
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-200/70">ON AIR</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="stencil text-[10px] tracking-widest text-amber-200/70">SEAT:</span>
            <span className="font-mono text-[11px] text-amber-100">{title.rank}</span>
            <span className="text-amber-300/50 text-[10px] hidden sm:inline">·</span>
            <span className="text-amber-100/60 text-[10px] hidden sm:inline">{title.seat}</span>
          </div>
        </header>

        {/* Ticker body — hover pauses; click line opens the referenced building. */}
        <div className="relative h-9 group">
          {rm ? (
            <div className="absolute inset-0 flex items-center px-4">
              {items[idx] && <BulletinLine b={items[idx]} />}
            </div>
          ) : (
            <div
              className="absolute inset-y-0 flex items-center whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]"
              style={{ animation: `bulletin-scroll ${Math.max(24, items.length * 6)}s linear infinite` }}
            >
              {[...items, ...items].map((b, i) => (
                <span key={`${b.id}-${i}`} className="inline-flex items-center gap-2 px-6">
                  <BulletinLine b={b} />
                  <span className="text-amber-300/40">·</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {next && (
          <footer className="border-t border-amber-400/15 px-4 py-2 flex items-baseline justify-between gap-3 flex-wrap">
            <span className="stencil text-[10px] tracking-widest text-amber-300/80">NEXT SEAT</span>
            <span className="font-mono text-[11px] text-amber-100/90">
              {next.rank}
              {next.plotsNeeded > 0 && (
                <span className="text-amber-200/60"> · {next.plotsNeeded} plot{next.plotsNeeded === 1 ? "" : "s"}</span>
              )}
              {next.bricksNeeded > 0 && (
                <span className="text-amber-200/60"> · {next.bricksNeeded} bricks</span>
              )}
            </span>
          </footer>
        )}
      </div>

      <style>{`
        @keyframes bulletin-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

function BulletinLine({ b }: { b: Bulletin }) {
  // Cheap match: bulletin ids of the form "up-<id>" / "max-<id>" carry the building id.
  const m = /^(?:up|max)-(.+)$/.exec(b.id);
  const buildingId = m?.[1];
  const body = (
    <>
      <span className="stencil text-[9px] tracking-widest text-amber-300/70">{b.kicker}</span>
      <span className="text-amber-300/40">·</span>
      <span className="font-mono text-[12px] text-amber-100/90">{b.text}</span>
    </>
  );
  if (!buildingId) return body;
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("milverse:city:open", { detail: { id: buildingId } }))
      }
      className="tap inline-flex items-center gap-2 hover:text-amber-50 transition-colors"
      aria-label={`Open ${buildingId}`}
    >
      {body}
    </button>
  );
}

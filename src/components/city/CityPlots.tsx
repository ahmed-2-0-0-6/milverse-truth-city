// MILVERSE — Your City · plots panel (Pass 1 polish).
// - memoized derived rows to keep re-renders cheap
// - "PLOTS X/8" summary + progress bar to next affordable build
// - onboarding hint when nothing built yet
// - per-card "just built" flash driven by `milverse:city:built`
// - perk-active dot on maxed wired plots

import { useEffect, useMemo, useState } from "react";
import { BUILDINGS, type BuildingId, nextCost, isMaxed } from "@/lib/city/buildings";
import {
  loadCity,
  levelOf,
  nextAfford,
  plotsBuilt,
  type CitySave,
} from "@/lib/city/citySave";
import { BuildingCard } from "@/components/city/BuildingCard";
import { titleFor } from "@/lib/city/title";
import { buildingLock } from "@/lib/city/zones";

export function CityPlots() {
  const [save, setSave] = useState<CitySave | null>(null);
  const [open, setOpen] = useState<BuildingId | null>(null);
  const [flashId, setFlashId] = useState<BuildingId | null>(null);

  useEffect(() => {
    setSave(loadCity());
    const refresh = () => setSave(loadCity());
    const onBuilt = (e: Event) => {
      refresh();
      const detail = (e as CustomEvent<{ id: BuildingId; level: number }>).detail;
      if (detail?.id) {
        setFlashId(detail.id);
        window.setTimeout(() => setFlashId(null), 1200);
      }
    };
    window.addEventListener("milverse:city", refresh);
    window.addEventListener("milverse:city:built", onBuilt);
    window.addEventListener("milverse:bricks", refresh);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:city:built", onBuilt);
      window.removeEventListener("milverse:bricks", refresh);
    };
  }, []);

  const rows = useMemo(() => {
    if (!save) return [];
    const step = titleFor(save).step;
    return BUILDINGS.map((def) => {
      const lvl = levelOf(save, def.id);
      const cost = nextCost(def.id, lvl);
      const maxed = isMaxed(def.id, lvl);
      const lock = buildingLock(def.id, step);
      const canAfford = cost !== null && save.bricks >= cost && !lock.locked;
      return { def, lvl, cost, maxed, canAfford, built: lvl > 0, lock };
    });
  }, [save]);

  if (!save) return null;
  const hint = nextAfford(save);
  const built = plotsBuilt(save);
  const target = hint?.cost ?? 1;
  const filled = hint ? Math.max(0, Math.min(1, (target - hint.remaining) / target)) : 1;
  const isEmpty = built <= 1 && save.bricks === 0;

  return (
    <section
      aria-labelledby="city-plots-heading"
      className="mx-auto max-w-6xl mt-8 px-4 sm:px-6"
    >
      {/* Header strip */}
      <div className="border-b border-amber-400/30 pb-3 mb-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="stencil text-[10px] text-amber-300/80 tracking-widest">
              YOUR CITY · PLOTS {built}/{BUILDINGS.length}
            </div>
            <h2
              id="city-plots-heading"
              className="mt-0.5 text-2xl sm:text-3xl font-black text-amber-100 leading-none"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              THE PLOTS
            </h2>
          </div>
          <div className="text-right shrink-0">
            <div className="stencil text-[9px] text-amber-300/70 tracking-widest">
              BRICKS
            </div>
            <div className="font-mono text-2xl text-amber-200 tabular-nums leading-none">
              {save.bricks}
            </div>
            {hint && (
              <div
                className={`mt-0.5 font-mono text-[10px] ${
                  hint.remaining === 0 ? "text-emerald-300" : "text-amber-200/60"
                }`}
              >
                {hint.remaining === 0
                  ? "READY TO BUILD"
                  : `${hint.remaining} to next`}
              </div>
            )}
          </div>
        </div>
        {/* progress to next build */}
        {hint && (
          <div className="mt-2 h-1 w-full rounded-sm bg-amber-400/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                hint.remaining === 0
                  ? "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                  : "bg-amber-300 shadow-[0_0_6px_rgba(253,224,71,0.6)]"
              }`}
              style={{ width: `${filled * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Onboarding hint */}
      {isEmpty && (
        <div className="mb-3 rounded-sm border border-dashed border-amber-400/40 bg-amber-400/[0.03] p-3 text-[12px] text-amber-100/80">
          <span className="stencil text-amber-300 tracking-widest text-[10px] mr-2">
            HOW IT WORKS
          </span>
          Clear a Mirror or Feed case to earn <b className="text-amber-200">BRICKS</b>.
          Spend them to build the plots below. Each upgrade unlocks a perk.
        </div>
      )}

      {/* Plot grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {rows.map(({ def, lvl, cost, maxed, canAfford, built: isBuilt, lock }) => {
          const stateLabel = lock.locked
            ? `SEALED · ${lock.needRank}`
            : !def.wired
            ? "SOON"
            : maxed
              ? "MAXED"
              : isBuilt
                ? `Lv${lvl}`
                : "UNBUILT";
          const stateColor = lock.locked
            ? "text-red-200/70 border-red-400/30 bg-red-400/[0.04]"
            : !def.wired
            ? "text-red-300/70 border-red-400/30 bg-red-400/5"
            : maxed
              ? "text-emerald-200 border-emerald-400/50 bg-emerald-400/10"
              : canAfford
                ? "text-amber-100 border-amber-300/80 bg-amber-400/15"
                : "text-amber-200/70 border-amber-400/25 bg-amber-400/5";
          const flashing = flashId === def.id;

          return (
            <button
              key={def.id}
              onClick={() => setOpen(def.id)}
              className={`tap group relative text-left rounded-sm border ${stateColor} p-2.5 hover:border-amber-300 hover:bg-amber-400/15 transition-all min-h-[92px] ${
                flashing
                  ? "ring-2 ring-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.7)]"
                  : ""
              }`}
              aria-label={`${def.name} — ${stateLabel}${cost !== null && def.wired ? `, next upgrade ${cost} bricks` : ""}`}
            >
              {lock.locked && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 font-mono text-[11px] text-red-300/80"
                >
                  &#9679;&#9679;
                </span>
              )}
              {/* Ready pulse */}
              {canAfford && def.wired && !maxed && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(253,224,71,0.9)] animate-pulse"
                />
              )}
              {/* Perk-active dot */}
              {maxed && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
                  title="Perk active"
                />
              )}
              <div className="stencil text-[9px] text-amber-300/80 tracking-widest">
                {def.district.toUpperCase()}
              </div>
              <div
                className="mt-0.5 text-sm font-black text-amber-100 leading-tight"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                {def.name.toUpperCase()}
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono text-[10px]">
                <span className="opacity-70">{stateLabel}</span>
                {cost !== null && def.wired && !lock.locked && (
                  <span className={`tabular-nums ${canAfford ? "text-amber-200" : ""}`}>
                    {cost}◼
                  </span>
                )}
              </div>
              {/* level ladder */}
              <div className="mt-1.5 flex gap-0.5">
                {Array.from({ length: def.maxLevel }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-sm ${
                      i < lvl
                        ? "bg-amber-300 shadow-[0_0_4px_rgba(253,224,71,0.7)]"
                        : "bg-amber-400/15"
                    }`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-amber-200/50 italic font-mono text-center">
        Clear cases → earn BRICKS → build the city.
      </p>

      <BuildingCard open={!!open} onClose={() => setOpen(null)} buildingId={open} />
    </section>
  );
}

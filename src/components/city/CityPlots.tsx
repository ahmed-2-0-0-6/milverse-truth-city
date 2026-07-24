// MILVERSE — Your City · plots panel.
// Sits below the map on the landing page. Lists all 8 buildings with
// their current level and next cost, opens the BuildingCard sheet on
// tap. Pure presentation — reads citySave, listens for `milverse:city`.

import { useEffect, useState } from "react";
import { BUILDINGS, type BuildingId, nextCost, isMaxed } from "@/lib/city/buildings";
import { loadCity, levelOf, nextAfford, type CitySave } from "@/lib/city/citySave";
import { BuildingCard } from "@/components/city/BuildingCard";

export function CityPlots() {
  const [save, setSave] = useState<CitySave | null>(null);
  const [open, setOpen] = useState<BuildingId | null>(null);

  useEffect(() => {
    setSave(loadCity());
    const refresh = () => setSave(loadCity());
    window.addEventListener("milverse:city", refresh);
    window.addEventListener("milverse:bricks", refresh);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:bricks", refresh);
    };
  }, []);

  if (!save) return null;
  const hint = nextAfford(save);

  return (
    <section
      aria-labelledby="city-plots-heading"
      className="mx-auto max-w-6xl mt-8 px-4 sm:px-6"
    >
      {/* Header strip */}
      <div className="flex items-end justify-between gap-3 border-b border-amber-400/30 pb-2 mb-3">
        <div>
          <div className="stencil text-[10px] text-amber-300/80 tracking-widest">
            YOUR CITY · PASS 1
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
            <div className="mt-0.5 font-mono text-[10px] text-amber-200/60">
              {hint.remaining === 0
                ? "READY TO BUILD"
                : `${hint.remaining} to next`}
            </div>
          )}
        </div>
      </div>

      {/* Plot grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {BUILDINGS.map((def) => {
          const lvl = levelOf(save, def.id);
          const cost = nextCost(def.id, lvl);
          const maxed = isMaxed(def.id, lvl);
          const canAfford = cost !== null && save.bricks >= cost;
          const built = lvl > 0;

          const stateLabel = !def.wired
            ? "SOON"
            : maxed
              ? "MAXED"
              : built
                ? `Lv${lvl}`
                : "UNBUILT";
          const stateColor = !def.wired
            ? "text-red-300/70 border-red-400/30 bg-red-400/5"
            : maxed
              ? "text-emerald-200 border-emerald-400/50 bg-emerald-400/10"
              : canAfford
                ? "text-amber-200 border-amber-300/70 bg-amber-400/15"
                : "text-amber-200/60 border-amber-400/25 bg-amber-400/5";

          return (
            <button
              key={def.id}
              onClick={() => setOpen(def.id)}
              className={`tap group relative text-left rounded-sm border ${stateColor} p-2.5 hover:border-amber-300 hover:bg-amber-400/15 transition-all min-h-[92px]`}
            >
              {canAfford && def.wired && !maxed && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(253,224,71,0.9)] animate-pulse"
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
                {cost !== null && def.wired && (
                  <span className="tabular-nums">{cost}◼</span>
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

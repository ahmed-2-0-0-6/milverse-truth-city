// MILVERSE — Your City · bottom-sheet for one building.
// Tap a landmark on the map → this opens. BUILD (from Lv0), UPGRADE
// (Lv1..max-1), or MAXED. Reads/writes citySave via helpers.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { BuildingId } from "@/lib/city/buildings";
import { BUILDINGS_BY_ID, nextCost, isMaxed } from "@/lib/city/buildings";
import { loadCity, levelOf, upgradeBuilding } from "@/lib/city/citySave";
import { titleFor } from "@/lib/city/title";
import { buildingLock } from "@/lib/city/zones";

interface Props {
  open: boolean;
  onClose: () => void;
  buildingId: BuildingId | null;
}

export function BuildingCard({ open, onClose, buildingId }: Props) {
  const [bricks, setBricks] = useState(0);
  const [level, setLevel] = useState(0);
  const [flash, setFlash] = useState<"ok" | "err" | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open || !buildingId) return;
    const refresh = () => {
      const s = loadCity();
      setBricks(s.bricks);
      setLevel(levelOf(s, buildingId));
      setStep(titleFor(s).step);
    };
    refresh();
    window.addEventListener("milverse:city", refresh);
    window.addEventListener("milverse:city:built", refresh);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:city:built", refresh);
    };
  }, [open, buildingId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !buildingId) return null;
  const def = BUILDINGS_BY_ID[buildingId];
  if (!def) return null;

  const lock = buildingLock(buildingId, step);
  const cost = nextCost(buildingId, level);
  const maxed = isMaxed(buildingId, level);
  const canAfford = cost !== null && bricks >= cost && !lock.locked;
  const remaining = cost !== null ? Math.max(0, cost - bricks) : 0;

  const onUpgrade = () => {
    if (lock.locked) return;
    const out = upgradeBuilding(buildingId);
    if (out.ok) {
      setFlash("ok");
      window.setTimeout(() => setFlash(null), 700);
      // Directive tracking — fire-and-forget, presentation only.
      void import("@/lib/city/directives").then((m) => m.trackSpend(out.spent));
    } else {
      setFlash("err");
      window.setTimeout(() => setFlash(null), 500);
    }
  };

  const actionLabel = maxed
    ? "MAXED · PERK ACTIVE"
    : level === 0
      ? `BUILD · ${cost} BRICKS`
      : `UPGRADE TO Lv${level + 1} · ${cost} BRICKS`;

  return (
    <>
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="building-title"
        className={`fixed left-1/2 -translate-x-1/2 bottom-0 sm:bottom-6 z-[9991] w-full sm:w-[440px] max-w-[95vw] rounded-t-lg sm:rounded-lg border border-amber-400/40 bg-[#0a0f1c]/98 backdrop-blur-xl shadow-[0_0_60px_rgba(253,224,71,0.25)] animate-in slide-in-from-bottom-6 fade-in duration-300 ${
          flash === "ok" ? "ring-2 ring-emerald-400/70" : ""
        } ${flash === "err" ? "ring-2 ring-red-400/70" : ""}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-amber-400/20">
          <div className="min-w-0">
            <div className="stencil text-[10px] text-amber-300 tracking-widest">
              PLOT · {def.district.toUpperCase()}
            </div>
            <h2
              id="building-title"
              className="mt-1 text-xl font-black text-amber-100 leading-tight"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              {def.name.toUpperCase()}
            </h2>
            <p className="mt-1 text-[12px] text-amber-200/70 italic">{def.tagline}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="tap rounded-sm p-1 text-amber-200/60 hover:text-amber-100 hover:bg-amber-400/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Level ladder */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: def.maxLevel }).map((_, i) => {
              const filled = i < level;
              return (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm border ${
                    filled
                      ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(253,224,71,0.7)]"
                      : "bg-amber-400/10 border-amber-400/30"
                  }`}
                  aria-hidden
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono text-[11px]">
            <span className="text-amber-200/80">
              {level === 0 ? "UNBUILT PLOT" : `LEVEL ${level} / ${def.maxLevel}`}
            </span>
            {lock.locked ? (
              <span className="stencil text-[9px] text-red-300/80 tracking-widest">
                SEALED · {lock.needRank}
              </span>
            ) : !def.wired ? (
              <span className="stencil text-[9px] text-red-300/80 tracking-widest">
                LOCKED · PASS 2
              </span>
            ) : null}
          </div>
        </div>

        {/* Flavor */}
        <p className="px-4 mt-4 text-[13px] leading-snug text-amber-100/85">
          {def.flavor}
        </p>

        {/* Perk at max */}
        <div className="mx-4 mt-3 rounded-sm border border-amber-400/25 bg-amber-400/5 p-2.5">
          <div className="stencil text-[9px] text-amber-300/80 tracking-widest">
            PERK AT MAX LEVEL
          </div>
          <div className="mt-0.5 text-[12px] text-amber-100/90">{def.perkAtMax}</div>
        </div>

        {/* Action row */}
        <div className="p-4">
          {lock.locked ? (
            <div className="w-full rounded-sm border border-red-400/40 bg-red-400/5 p-3 text-center">
              <div className="stencil text-[11px] tracking-widest text-red-200/90">
                {lock.kind === "zone" ? "DISTRICT SEALED" : "NO PERMIT"}
              </div>
              <div className="mt-1 font-mono text-[11px] text-amber-200/70">
                {lock.kind === "zone"
                  ? `${lock.zone.name} opens at ${lock.needRank}.`
                  : `The city issues this permit at ${lock.needRank}.`}
              </div>
              <div className="mt-1 text-[11px] text-amber-100/60">
                Clear cases. Build plots. The badge comes with the work.
              </div>
            </div>
          ) : maxed ? (
            <div className="w-full rounded-sm border border-emerald-400/50 bg-emerald-400/10 py-3 text-center stencil text-[11px] text-emerald-200 tracking-widest">
              {actionLabel}
            </div>
          ) : !def.wired ? (
            <div className="w-full rounded-sm border border-red-400/40 bg-red-400/5 py-3 text-center stencil text-[11px] text-red-200/80 tracking-widest">
              COMING SOON · CLEAR MORE CASES
            </div>
          ) : (
            <>
              <button
                onClick={onUpgrade}
                disabled={!canAfford}
                className={`tap w-full rounded-sm border py-3 stencil text-[11px] tracking-widest transition-all ${
                  canAfford
                    ? "border-amber-400/70 bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_20px_rgba(253,224,71,0.5)]"
                    : "border-amber-400/25 bg-amber-400/5 text-amber-200/40 cursor-not-allowed"
                }`}
              >
                {actionLabel}
              </button>
              {!canAfford && cost !== null && (
                <div className="mt-2 text-center font-mono text-[11px] text-amber-200/60">
                  {remaining} BRICKS TO GO · YOU HAVE {bricks}
                </div>
              )}
              {canAfford && (
                <div className="mt-2 text-center font-mono text-[11px] text-amber-200/60">
                  YOU HAVE {bricks} · CLEARS TO {bricks - (cost ?? 0)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

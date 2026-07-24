// MILVERSE — Perk Unlock Toast (Pass 2 · Improved).
// Bright emerald celebration ribbon that appears when a city perk
// crosses its threshold. Listens for `milverse:perk:online`.
// Auto-dismisses after 4.5s. Click to open the building.

import { useEffect, useState } from "react";
import type { BuildingId } from "@/lib/city/buildings";

interface Payload {
  key: string;
  label: string;
  effect: string;
  building: BuildingId;
}

export function PerkUnlockToast() {
  const [queue, setQueue] = useState<Payload[]>([]);

  useEffect(() => {
    const onUnlock = (e: Event) => {
      const d = (e as CustomEvent<Payload>).detail;
      if (!d?.key) return;
      setQueue((q) => (q.some((x) => x.key === d.key) ? q : [...q, d]));
    };
    window.addEventListener("milverse:perk:online", onUnlock);
    return () => window.removeEventListener("milverse:perk:online", onUnlock);
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const t = window.setTimeout(() => setQueue((q) => q.slice(1)), 4500);
    return () => window.clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;
  const top = queue[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-4 z-[9998] -translate-x-1/2 animate-fade-in"
      style={{ maxWidth: "min(92vw, 420px)" }}
    >
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("milverse:city:open", { detail: { id: top.building } }),
          );
          setQueue((q) => q.slice(1));
        }}
        className="tap block w-full text-left rounded-sm border border-emerald-400/60 bg-emerald-950/90 backdrop-blur px-4 py-3 shadow-[0_0_28px_rgba(52,211,153,0.35)] hover:bg-emerald-900/90 transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="stencil text-[10px] tracking-widest text-emerald-300">
            ▲ PERK ONLINE
          </span>
          <span className="font-mono text-[10px] tabular-nums text-emerald-300/70">
            TAP TO VIEW
          </span>
        </div>
        <div className="mt-1 font-mono text-[13px] text-emerald-100">
          {top.label}
        </div>
        <div className="text-[11px] leading-snug text-emerald-200/70">
          {top.effect}
        </div>
      </button>
    </div>
  );
}

// MILVERSE — Your City · global toast host.
// Listens for `milverse:bricks` events (fired by economy.ts after a case
// resolves) and slides a small stencil card in from the top-right. Two
// events in quick succession queue; never stacks more than one at a time.

import { useEffect, useState } from "react";
import type { AwardedBricks } from "@/lib/city/economy";

type Toast = AwardedBricks & { id: number };

export function UpgradeToastHost() {
  const [queue, setQueue] = useState<Toast[]>([]);
  const [current, setCurrent] = useState<Toast | null>(null);

  useEffect(() => {
    const onBricks = (e: Event) => {
      const detail = (e as CustomEvent<AwardedBricks>).detail;
      if (!detail || !detail.delta) return;
      setQueue((q) => [...q, { ...detail, id: Date.now() + Math.random() }]);
    };
    window.addEventListener("milverse:bricks", onBricks);
    return () => window.removeEventListener("milverse:bricks", onBricks);
  }, []);

  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
    const t = window.setTimeout(() => setCurrent(null), 3400);
    return () => window.clearTimeout(t);
  }, [current, queue]);

  if (!current) return null;

  const hint = current.nextBuilding
    ? current.nextBuilding.remaining === 0
      ? `${current.nextBuilding.name.toUpperCase()} · READY TO BUILD`
      : `${current.nextBuilding.remaining} to ${current.nextBuilding.name.toUpperCase()}`
    : "EVERY PLOT MAXED";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 right-3 z-[9997] print:hidden pointer-events-none animate-in slide-in-from-right-4 fade-in duration-500"
    >
      <div className="pointer-events-auto rounded-sm border border-amber-400/60 bg-[#0a0f1c]/95 backdrop-blur-xl px-3 py-2 shadow-[0_0_30px_rgba(253,224,71,0.35)] min-w-[200px]">
        <div className="flex items-center gap-2 stencil text-[10px] text-amber-300 tracking-widest">
          <span aria-hidden>◼◼◼</span>
          <span>YOUR CITY</span>
        </div>
        <div className="mt-1 text-amber-100 font-mono text-lg tabular-nums leading-none">
          +{current.delta} <span className="text-amber-400/70 text-sm">BRICKS</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-amber-200/60 tracking-wide">
          {hint}
        </div>
      </div>
    </div>
  );
}

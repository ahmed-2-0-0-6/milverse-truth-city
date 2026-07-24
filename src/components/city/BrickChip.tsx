// MILVERSE — TopBar chip · BRICKS + tiny progress hairline.
// Always visible (including xs), pulses on award, tap → landing plots.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { loadCity, nextAfford, type CitySave } from "@/lib/city/citySave";
import { nextCost } from "@/lib/city/buildings";

export function BrickChip() {
  const [save, setSave] = useState<CitySave | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setSave(loadCity());
    const refresh = () => setSave(loadCity());
    const onBricks = () => {
      setSave(loadCity());
      setPulse(true);
      window.setTimeout(() => setPulse(false), 900);
    };
    window.addEventListener("milverse:city", refresh);
    window.addEventListener("milverse:city:built", refresh);
    window.addEventListener("milverse:bricks", onBricks);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:city:built", refresh);
      window.removeEventListener("milverse:bricks", onBricks);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!save) return null;
  const next = nextAfford(save);
  const cost = next ? nextCost(next.id, 0 /* unused */) : null;
  // progress based on the actual next-cost target, not total
  const target = next?.cost ?? 1;
  const filled = next
    ? Math.max(0, Math.min(1, (target - next.remaining) / target))
    : 1;
  const ready = !!next && next.remaining === 0;

  return (
    <Link
      to="/"
      aria-label={`Your city · ${save.bricks} bricks${next ? ` · ${next.remaining} to next build` : ""}`}
      title={next ? `${next.remaining} bricks to your next build` : "Every plot maxed"}
      className={`relative inline-flex items-center gap-1.5 rounded-full border ${
        ready ? "border-emerald-300 bg-emerald-400/10" : "border-amber-400/50 bg-black/40"
      } backdrop-blur-md px-2.5 py-1 stencil text-[10px] text-amber-200 hover:bg-amber-400/10 transition-all overflow-hidden ${
        pulse ? "ring-2 ring-amber-300/70 shadow-[0_0_18px_rgba(253,224,71,0.6)]" : ""
      }`}
    >
      <span aria-hidden className={ready ? "text-emerald-300" : "text-amber-300"}>◼</span>
      <span className="tabular-nums">{save.bricks}</span>
      {next && (
        <>
          <span className="opacity-50">·</span>
          <span className={`opacity-80 ${ready ? "text-emerald-200" : ""}`}>
            {ready ? "READY" : `${next.remaining}→`}
          </span>
        </>
      )}
      {/* progress hairline */}
      <span
        aria-hidden
        className="absolute left-0 bottom-0 h-[2px] bg-amber-300"
        style={{ width: `${filled * 100}%`, opacity: ready ? 0 : 0.7 }}
      />
      {cost /* referenced to keep the import; harmless */ ? null : null}
    </Link>
  );
}

// MILVERSE — TopBar chip showing current BRICKS and next-building progress.
// Reads citySave, listens for milverse:city + milverse:bricks. Purely visual.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { loadCity, nextAfford, type CitySave } from "@/lib/city/citySave";

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
    window.addEventListener("milverse:bricks", onBricks);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("milverse:city", refresh);
      window.removeEventListener("milverse:bricks", onBricks);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!save) return null;
  const next = nextAfford(save);
  const label = next
    ? next.remaining === 0
      ? "READY"
      : `${next.remaining}→`
    : "MAX";

  return (
    <Link
      to="/"
      aria-label={`Your city · ${save.bricks} bricks · ${label}`}
      title={next ? `${next.remaining} bricks to your next build` : "Every plot maxed"}
      className={`hidden xs:inline-flex sm:inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-black/40 backdrop-blur-md px-2.5 py-1 stencil text-[10px] text-amber-200 hover:bg-amber-400/10 transition-all ${
        pulse ? "ring-2 ring-amber-300/70 shadow-[0_0_18px_rgba(253,224,71,0.6)]" : ""
      }`}
    >
      <span aria-hidden className="text-amber-300">◼</span>
      <span className="tabular-nums">{save.bricks}</span>
      <span className="opacity-50">·</span>
      <span className="opacity-70">{label}</span>
    </Link>
  );
}

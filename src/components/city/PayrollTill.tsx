// MILVERSE — Your City · the payroll till.
// The city works while you're away. Come back, the ledger has bricks in it.
// Presentation layer over lib/city/payroll.ts — no truth logic here.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { loadCity, collectPayroll, type CitySave } from "@/lib/city/citySave";
import { readLedger, CAP_HOURS } from "@/lib/city/payroll";

export function PayrollTill({ active = true }: { active?: boolean }) {
  const [save, setSave] = useState<CitySave | null>(null);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    setSave(loadCity());
    const onCity = () => setSave(loadCity());
    window.addEventListener("milverse:city", onCity);
    return () => window.removeEventListener("milverse:city", onCity);
  }, []);

  // One cheap tick per second, only while the board is on screen.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => () => { if (flashTimer.current) window.clearTimeout(flashTimer.current); }, []);

  const onCollect = useCallback(() => {
    if (!save) return;
    const l = readLedger(save);
    const { collected, save: next } = collectPayroll(l.accrued);
    setSave(next);
    if (collected > 0) {
      setFlash(collected);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
    }
  }, [save]);

  if (!save) return null;
  const l = readLedger(save, Date.now() + tick * 0);
  if (l.perHour <= 0) return null;

  const ready = l.accrued > 0;

  return (
    <div className="absolute left-3 bottom-3 z-20 w-[190px] select-none">
      {flash !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 font-mono text-lg font-black text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] milv-payroll-pop"
        >
          +{flash}
        </div>
      )}
      <div
        className={`rounded-sm border bg-black/75 backdrop-blur-sm px-2.5 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.7)] ${
          l.full
            ? "border-red-400/50"
            : ready
              ? "border-emerald-300/50"
              : "border-amber-400/30"
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="stencil text-[9px] tracking-widest text-amber-300/70">
            NIGHT SHIFT
          </span>
          <span className="font-mono text-[9px] text-amber-200/50 tabular-nums">
            {l.perHour}/HR
          </span>
        </div>

        <div className="mt-1 flex items-end justify-between gap-2">
          <div
            className={`font-mono text-2xl leading-none tabular-nums ${
              ready ? "text-emerald-200" : "text-amber-200/70"
            }`}
          >
            {l.accrued}
          </div>
          <div className="font-mono text-[9px] text-amber-200/45 pb-0.5 tabular-nums">
            / {l.cap}
          </div>
        </div>

        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-amber-400/10">
          <div
            className={`h-full transition-[width] duration-500 ${
              l.full
                ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]"
                : "bg-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
            }`}
            style={{ width: `${Math.round(l.fill * 100)}%` }}
          />
        </div>

        <button
          type="button"
          onClick={onCollect}
          disabled={!ready}
          className={`mt-2 inline-flex min-h-[32px] w-full items-center justify-center rounded-sm border px-2 stencil text-[10px] tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${
            ready
              ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25"
              : "border-amber-400/20 bg-transparent text-amber-200/35"
          }`}
        >
          {ready ? "COLLECT" : "TILL EMPTY"}
        </button>

        <p className="mt-1 font-mono text-[9px] leading-tight text-amber-200/45">
          {l.full
            ? `Ledger's full. ${CAP_HOURS}h and the city stops counting.`
            : ready
              ? "Bricks the city made without you."
              : "The shift just started."}
        </p>
      </div>
    </div>
  );
}

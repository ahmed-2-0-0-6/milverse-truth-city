// MILVERSE — Your City · THE SIREN (overlay).
// Red light on the board, a clock running down, one way out: work a case.
// Pure presentation over lib/city/threat.ts.

import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { loadCity, type CitySave } from "@/lib/city/citySave";
import { readIncident, clockText, holdTheLine, type Incident } from "@/lib/city/threat";

export function ThreatSiren({ active = true }: { active?: boolean }) {
  const [save, setSave] = useState<CitySave | null>(null);
  const [inc, setInc] = useState<Incident | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSave(loadCity());
    const onCity = () => setSave(loadCity());
    // A payout means you were out there working — the line held.
    const onBricks = () => { holdTheLine(); setSave(loadCity()); };
    window.addEventListener("milverse:city", onCity);
    window.addEventListener("milverse:bricks", onBricks);
    window.addEventListener("milverse:city:siren", onCity);
    return () => {
      window.removeEventListener("milverse:city", onCity);
      window.removeEventListener("milverse:bricks", onBricks);
      window.removeEventListener("milverse:city:siren", onCity);
    };
  }, []);

  useEffect(() => {
    if (!save) return;
    const tick = () => setInc(readIncident(save));
    tick();
    if (!active) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [save, active]);

  // New hour, new wave — the dismissal expires with it.
  useEffect(() => { setDismissed(false); }, [inc?.slot]);

  if (!inc || dismissed) return null;

  const held = inc.held;

  return (
    <>
      {/* Red wash on the board while the wave is live. */}
      {!held && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-10 ${inc.urgency ? "milv-siren-wash milv-siren-wash--hot" : "milv-siren-wash"}`}
        />
      )}

      <div className="absolute left-1/2 top-3 z-30 w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2">
        <div
          className={`relative rounded-sm border bg-black/85 backdrop-blur-sm px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${
            held
              ? "border-emerald-300/50"
              : inc.urgency
                ? "border-red-400/70 milv-siren-edge"
                : "border-red-400/40"
          }`}
          role="status"
        >
          <button
            type="button"
            aria-label="Dismiss the alert"
            onClick={() => setDismissed(true)}
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-sm font-mono text-[11px] leading-none text-amber-200/50 hover:bg-amber-400/15 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            ×
          </button>

          <div className="flex items-center gap-2 pr-6">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 rounded-full ${
                held ? "bg-emerald-300" : "bg-red-400 milv-siren-dot"
              }`}
            />
            <span className="stencil text-[9px] tracking-widest text-red-200/80">
              {held ? "LINE HELD" : `DISPATCH ${inc.wave.code}`}
            </span>
            <span className="ml-auto font-mono text-[11px] tabular-nums text-amber-200/70">
              {clockText(inc.msLeft)}
            </span>
          </div>

          <div
            className="mt-0.5 text-lg leading-none text-amber-100"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {inc.wave.name}
          </div>

          <p className="mt-1 text-[11px] leading-snug text-amber-200/70">
            {held
              ? `You worked a case this hour. ${inc.targetName} stays standing.`
              : `${inc.wave.line} It's heading for ${inc.targetName}.`}
          </p>

          {!held && (
            <Link
              to={inc.wave.to}
              className="mt-2 inline-flex min-h-[34px] w-full items-center justify-center rounded-sm border border-red-400/60 bg-red-500/15 px-2 stencil text-[10px] tracking-widest text-red-100 transition-colors hover:bg-red-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              {inc.wave.cta}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

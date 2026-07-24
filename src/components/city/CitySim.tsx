// MILVERSE — Your City · SIM panel.
// Presentation only: renders the derived report from lib/city/sim.ts.
// No mutations, no payouts. Clicking a lever just focuses that plot on the map.

import React, { useMemo, useState } from "react";
import { loadCity } from "@/lib/city/citySave";
import { simulate } from "@/lib/city/sim";
import type { BuildingId } from "@/lib/city/buildings";
import { useCoalescedRefresh } from "@/hooks/useCoalescedRefresh";

function focusBuilding(id: BuildingId) {
  const heading = document.getElementById("city-iso-heading");
  if (heading) {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  window.dispatchEvent(new CustomEvent("milverse:city:open", { detail: { id } }));
}

const BAR_TONE: Record<string, string> = {
  good: "bg-emerald-400/70",
  warn: "bg-amber-300/70",
  bad: "bg-rose-400/70",
};

const SEV_TONE: Record<string, string> = {
  info: "text-amber-100/60 border-amber-400/20",
  warn: "text-amber-200 border-amber-300/40",
  alert: "text-rose-200 border-rose-400/40",
};

export function CitySim() {
  const [tick, setTick] = useState(0);
  useCoalescedRefresh(
    ["milverse:city", "milverse:bricks", "milverse:city:built"],
    () => setTick((n) => n + 1),
  );

  const report = useMemo(() => {
    void tick;
    if (typeof window === "undefined") return null;
    return simulate(loadCity());
  }, [tick]);

  if (!report) return null;

  return (
    <section className="mx-auto mt-6 w-full max-w-3xl px-4">
      <div className="rounded border border-amber-400/25 bg-black/30 p-4 backdrop-blur-sm">
        <header className="flex items-baseline justify-between gap-3">
          <h3 className="stencil text-[11px] tracking-widest text-amber-100/80">
            CITY REPORT
          </h3>
          <p className="font-mono text-[10px] text-amber-100/45 tabular-nums">
            {report.population.toLocaleString()} residents · {report.jobs.toLocaleString()} jobs
            <span className="ml-2 rounded border border-amber-300/40 px-1.5 py-0.5 text-amber-100">
              GRADE {report.grade}
            </span>
          </p>
        </header>

        <ul className="mt-3 space-y-2.5">
          {report.meters.map((m) => (
            <li key={m.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="stencil text-[10px] tracking-widest text-amber-100/70">
                  {m.label}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-amber-100/45">
                  {m.value}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-amber-100/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${BAR_TONE[m.tone]}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-amber-100/45">{m.reading}</p>
            </li>
          ))}
        </ul>

        <ul className="mt-4 space-y-1.5">
          {report.advisories.map((a) => (
            <li
              key={a.id}
              className={`rounded border-l-2 bg-black/20 px-3 py-2 ${SEV_TONE[a.severity]}`}
            >
              <span className="stencil mr-2 text-[9px] tracking-widest opacity-70">
                {a.who}
              </span>
              <span className="font-mono text-[11px] leading-relaxed">{a.line}</span>
              {a.lever && (
                <button
                  type="button"
                  onClick={() => focusBuilding(a.lever as BuildingId)}
                  className="tap ml-2 rounded border border-current/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider hover:bg-amber-300/10"
                >
                  Open plot
                </button>
              )}
            </li>
          ))}
        </ul>

        {report.demand && (
          <button
            type="button"
            onClick={() => focusBuilding(report.demand!.id)}
            className="tap mt-4 flex min-h-[44px] w-full items-center justify-between gap-3 rounded border border-amber-300/35 bg-amber-400/8 px-3 py-2 text-left hover:bg-amber-400/14"
          >
            <span>
              <span className="stencil block text-[10px] tracking-widest text-amber-100/70">
                THE CITY WANTS
              </span>
              <span className="font-mono text-[12px] text-amber-100">
                {report.demand.name}
              </span>
              <span className="ml-2 font-mono text-[10px] text-amber-100/45">
                {report.demand.why}
              </span>
            </span>
            <span className="font-mono text-[11px] tabular-nums text-amber-200">
              {report.demand.cost} BRICKS
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

export default React.memo(CitySim);

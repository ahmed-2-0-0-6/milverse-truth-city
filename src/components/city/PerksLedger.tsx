// MILVERSE — Your City · Perks Ledger (Pass 2).
// Presentation-only ledger of every city perk: which are active, and how
// many more levels stand between the player and the next unlock.
// Reads live from citySave; re-renders on the "milverse:city" event.

import { useEffect, useState } from "react";
import { BUILDINGS_BY_ID, type BuildingId } from "@/lib/city/buildings";
import { loadCity, levelOf } from "@/lib/city/citySave";

interface PerkRow {
  key: string;
  building: BuildingId;
  req: number;
  cur: number;
  label: string;
  effect: string;
}

const PERKS: Omit<PerkRow, "cur">[] = [
  { key: "outpost_bonus",        building: "outpost",       req: 3, label: "Outpost Bonus",     effect: "+5% BRICKS on every case." },
  { key: "library_manual",       building: "library",       req: 5, label: "Auto-Manual",       effect: "Field Manual entries open on relevant cases." },
  { key: "school_double",        building: "school",        req: 5, label: "Double Lessons",    effect: "First Phone lessons pay 2× BRICKS." },
  { key: "newsroom_rebuttal",    building: "newsroom",      req: 5, label: "Rebuttal Desk",     effect: "The Paper lets you draft rebuttals." },
  { key: "signal_hint",          building: "signal_tower",  req: 5, label: "One Hint",          effect: "One VERIFY hint per case." },
  { key: "archive_coldreads",    building: "archive",       req: 5, label: "Cold Reads",        effect: "Replay any solved case under a drill clock." },
  { key: "clean_room_tier5",     building: "clean_room",    req: 3, label: "Tier-5 Access",     effect: "Unlocks Tier-5 Boss cases." },
  { key: "watchtower_suspected", building: "watchtower",    req: 3, label: "Most-Suspected",    effect: "Global suspected-line on every case." },
];

export function PerksLedger() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener("milverse:city", onChange);
    window.addEventListener("milverse:bricks", onChange);
    return () => {
      window.removeEventListener("milverse:city", onChange);
      window.removeEventListener("milverse:bricks", onChange);
    };
  }, []);

  const save = loadCity();
  const rows: PerkRow[] = PERKS.map((p) => ({
    ...p,
    cur: levelOf(save, p.building),
  }));
  const activeCount = rows.filter((r) => r.cur >= r.req).length;

  return (
    <section className="mx-auto mt-6 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2.5">
          <h3 className="stencil text-[11px] tracking-widest text-amber-300">
            PERKS LEDGER
          </h3>
          <span className="font-mono text-[10px] text-amber-200/60 tabular-nums">
            {activeCount} / {rows.length} ACTIVE
          </span>
        </header>
        <ul className="divide-y divide-amber-400/10">
          {rows.map((r) => {
            const active = r.cur >= r.req;
            const bDef = BUILDINGS_BY_ID[r.building];
            const remaining = Math.max(0, r.req - r.cur);
            return (
              <li key={r.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2">
                <span
                  aria-hidden
                  className={`inline-block h-2 w-2 rounded-full ${
                    active
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                      : "bg-amber-400/25"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`font-mono text-[12px] ${active ? "text-emerald-200" : "text-amber-100/85"}`}>
                      {r.label}
                    </span>
                    <span className="stencil text-[9px] tracking-widest text-amber-300/60">
                      {bDef.name.replace(/^The\s+/i, "")} · LV {r.req}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-amber-100/60 truncate">
                    {r.effect}
                  </p>
                </div>
                <span className={`shrink-0 font-mono text-[11px] tabular-nums ${active ? "text-emerald-300" : "text-amber-200/50"}`}>
                  {active ? "ONLINE" : remaining === 1 ? "1 LEVEL TO GO" : `${remaining} LEVELS`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

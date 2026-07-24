// MILVERSE — Your City · Perks Ledger (Pass 2 · Improved).
// Interactive ledger of every city perk.
//   · Rows are clickable → open that building's BuildingCard.
//   · Header shows the NEXT perk to unlock + how far away it is.
//   · Live-updates on brick + city + build events.
//   · Detects perk-just-unlocked between renders and dispatches a
//     `milverse:perk:online` event that PerkUnlockToast catches.
// Presentation only — never mutates gameplay.

import { useEffect, useRef, useState } from "react";
import { BUILDINGS_BY_ID, type BuildingId } from "@/lib/city/buildings";
import { loadCity, levelOf } from "@/lib/city/citySave";

interface PerkDef {
  key: string;
  building: BuildingId;
  req: number;
  label: string;
  effect: string;
}

const PERKS: PerkDef[] = [
  { key: "outpost_bonus",        building: "outpost",       req: 3, label: "Outpost Bonus",     effect: "+5% BRICKS on every case." },
  { key: "library_manual",       building: "library",       req: 5, label: "Auto-Manual",       effect: "Field Manual entries open on relevant cases." },
  { key: "school_double",        building: "school",        req: 5, label: "Double Lessons",    effect: "First Phone lessons pay 2× BRICKS." },
  { key: "newsroom_rebuttal",    building: "newsroom",      req: 5, label: "Rebuttal Desk",     effect: "The Paper lets you draft rebuttals." },
  { key: "signal_hint",          building: "signal_tower",  req: 5, label: "One Hint",          effect: "One VERIFY hint per case." },
  { key: "archive_coldreads",    building: "archive",       req: 5, label: "Cold Reads",        effect: "Replay any solved case under a drill clock." },
  { key: "clean_room_tier5",     building: "clean_room",    req: 3, label: "Tier-5 Access",     effect: "Unlocks Tier-5 Boss cases." },
  { key: "watchtower_suspected", building: "watchtower",    req: 3, label: "Most-Suspected",    effect: "Global suspected-line on every case." },
];

function openBuilding(id: BuildingId) {
  window.dispatchEvent(new CustomEvent("milverse:city:open", { detail: { id } }));
}

export function PerksLedger() {
  const [, setTick] = useState(0);
  const prevActive = useRef<Set<string> | null>(null);

  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener("milverse:city", onChange);
    window.addEventListener("milverse:bricks", onChange);
    window.addEventListener("milverse:city:built", onChange);
    return () => {
      window.removeEventListener("milverse:city", onChange);
      window.removeEventListener("milverse:bricks", onChange);
      window.removeEventListener("milverse:city:built", onChange);
    };
  }, []);

  const save = loadCity();
  const rows = PERKS.map((p) => ({ ...p, cur: levelOf(save, p.building) }));
  const active = rows.filter((r) => r.cur >= r.req);
  const pending = rows.filter((r) => r.cur < r.req);
  const nextUp = pending
    .slice()
    .sort((a, b) => (a.req - a.cur) - (b.req - b.cur))[0];

  // Detect newly-online perks between renders → dispatch unlock event.
  useEffect(() => {
    const activeKeys = new Set(active.map((r) => r.key));
    if (prevActive.current) {
      for (const k of activeKeys) {
        if (!prevActive.current.has(k)) {
          const p = PERKS.find((x) => x.key === k);
          if (p) {
            window.dispatchEvent(
              new CustomEvent("milverse:perk:online", {
                detail: { key: p.key, label: p.label, effect: p.effect, building: p.building },
              }),
            );
          }
        }
      }
    }
    prevActive.current = activeKeys;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <section className="mx-auto mt-6 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2.5 gap-3 flex-wrap">
          <h3 className="stencil text-[11px] tracking-widest text-amber-300">
            PERKS LEDGER
          </h3>
          <span className="font-mono text-[10px] text-amber-200/60 tabular-nums">
            {active.length} / {rows.length} ONLINE
          </span>
        </header>

        {nextUp && (
          <button
            type="button"
            onClick={() => openBuilding(nextUp.building)}
            className="tap w-full border-b border-amber-400/15 bg-amber-400/[0.04] hover:bg-amber-400/[0.09] px-4 py-2.5 text-left transition-colors"
            aria-label={`Open ${BUILDINGS_BY_ID[nextUp.building].name}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="stencil text-[10px] tracking-widest text-amber-300/80">
                NEXT UNLOCK
              </span>
              <span className="font-mono text-[10px] tabular-nums text-amber-200/70">
                {nextUp.req - nextUp.cur === 1 ? "1 LEVEL AWAY" : `${nextUp.req - nextUp.cur} LEVELS AWAY`}
              </span>
            </div>
            <div className="mt-0.5 text-[12px] text-amber-100/90 font-mono">
              {nextUp.label} <span className="text-amber-300/60">·</span>{" "}
              <span className="text-amber-200/70">{BUILDINGS_BY_ID[nextUp.building].name}</span>
            </div>
            <div className="text-[11px] text-amber-100/60 leading-snug">{nextUp.effect}</div>
          </button>
        )}

        <ul className="divide-y divide-amber-400/10">
          {rows.map((r) => {
            const isOn = r.cur >= r.req;
            const bDef = BUILDINGS_BY_ID[r.building];
            const remaining = Math.max(0, r.req - r.cur);
            return (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => openBuilding(r.building)}
                  className="tap grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 text-left hover:bg-amber-400/[0.06] transition-colors"
                  aria-label={`Open ${bDef.name}`}
                >
                  <span
                    aria-hidden
                    className={`inline-block h-2 w-2 rounded-full ${
                      isOn
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                        : "bg-amber-400/25"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-mono text-[12px] ${isOn ? "text-emerald-200" : "text-amber-100/85"}`}>
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
                  <span
                    className={`shrink-0 font-mono text-[11px] tabular-nums ${
                      isOn ? "text-emerald-300" : "text-amber-200/50"
                    }`}
                  >
                    {isOn
                      ? "ONLINE"
                      : remaining === 1
                        ? "1 TO GO"
                        : `${remaining} TO GO`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// MILVERSE — Your City · Perks Ledger (Pass 2 · Upgraded).
// Interactive ledger of every city perk.
//   · Rows are clickable → scroll the map into view + open that BuildingCard.
//   · Each row carries a progress-to-unlock bar (levels built vs. required).
//   · Header shows overall wiring progress + the next perk to unlock.
//   · Filter: ALL / PENDING / ONLINE.
//   · Live-updates on brick + city + build events.
//   · Detects perk-just-unlocked between renders and dispatches a
//     `milverse:perk:online` event that PerkUnlockToast catches.
// Presentation only — never mutates gameplay.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Filter = "all" | "pending" | "online";

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

interface Row extends PerkDef {
  cur: number;
  isOn: boolean;
  remaining: number;
  pct: number;
}

const PerkRow = React.memo(function PerkRow({ r }: { r: Row }) {
  const bDef = BUILDINGS_BY_ID[r.building];
  return (
    <li>
      <button
        type="button"
        onClick={() => focusBuilding(r.building)}
        className="tap group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-amber-400/[0.06] focus-visible:bg-amber-400/[0.09] focus-visible:outline-none"
        aria-label={`${r.label} — ${r.isOn ? "online" : `${r.remaining} levels from unlock`}. Open ${bDef.name} on the map.`}
      >
        <span
          aria-hidden
          className={`inline-block h-2 w-2 rounded-full transition-shadow ${
            r.isOn
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
              : r.remaining === 1
                ? "bg-amber-300/80 shadow-[0_0_6px_rgba(253,224,71,0.5)]"
                : "bg-amber-400/25"
          }`}
        />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-mono text-[11px] ${r.isOn ? "text-emerald-200" : "text-amber-100/85"}`}>
              {r.label}
            </span>
            <span className="stencil text-[9px] tracking-widest text-amber-300/60">
              {bDef.name.replace(/^The\s+/i, "")} · LV {r.req}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-amber-100/60 line-clamp-2">
            {r.effect}
          </p>
          {/* progress to unlock */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-[3px] w-full max-w-[220px] overflow-hidden rounded-sm bg-amber-400/10">
              <div
                className={`h-full transition-[width] duration-500 ${
                  r.isOn
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    : "bg-amber-300/80 shadow-[0_0_5px_rgba(253,224,71,0.45)]"
                }`}
                style={{ width: `${r.pct * 100}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-amber-200/45">
              {Math.min(r.cur, r.req)}/{r.req}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 self-start font-mono text-[10px] tabular-nums tracking-wider ${
            r.isOn ? "text-emerald-300" : r.remaining === 1 ? "text-amber-200" : "text-amber-200/45"
          }`}
        >
          {r.isOn ? "ONLINE" : r.remaining === 1 ? "1 TO GO" : `${r.remaining} TO GO`}
        </span>
      </button>
    </li>
  );
});

export function PerksLedger() {
  const [, setTick] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
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
  const rows: Row[] = useMemo(
    () =>
      PERKS.map((p) => {
        const cur = levelOf(save, p.building);
        return {
          ...p,
          cur,
          isOn: cur >= p.req,
          remaining: Math.max(0, p.req - cur),
          pct: Math.max(0, Math.min(1, cur / p.req)),
        };
      }),
    [save],
  );

  const active = useMemo(() => rows.filter((r) => r.isOn), [rows]);
  const pending = useMemo(() => rows.filter((r) => !r.isOn), [rows]);
  const nextUp = useMemo(
    () => pending.slice().sort((a, b) => a.remaining - b.remaining || b.pct - a.pct)[0],
    [pending],
  );

  // Sorted: closest-to-unlock first, then online at the bottom.
  const sorted = useMemo(
    () => [
      ...pending.slice().sort((a, b) => a.remaining - b.remaining || b.pct - a.pct),
      ...active,
    ],
    [pending, active],
  );

  const visible = useMemo(
    () => (filter === "all" ? sorted : filter === "online" ? active : pending),
    [filter, sorted, active, pending],
  );

  const wired = active.length / rows.length;

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
  }, [active]);

  const tab = useCallback(
    (id: Filter, label: string, count: number) => (
      <button
        key={id}
        type="button"
        onClick={() => setFilter(id)}
        aria-pressed={filter === id}
        className={`tap rounded-sm px-2 py-1 font-mono text-[9px] tracking-widest transition-colors ${
          filter === id
            ? "bg-amber-400/20 text-amber-100"
            : "text-amber-200/45 hover:text-amber-100/80"
        }`}
      >
        {label} <span className="tabular-nums opacity-60">{count}</span>
      </button>
    ),
    [filter],
  );

  return (
    <section className="mx-auto mt-6 w-full max-w-5xl px-3">
      <div className="rounded-sm border border-amber-400/20 bg-black/70 backdrop-blur-sm">
        <header className="border-b border-amber-400/20 px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="stencil text-[11px] tracking-widest text-amber-300">PERKS LEDGER</h3>
            <span className="font-mono text-[10px] text-amber-200/60 tabular-nums">
              {active.length} / {rows.length} ONLINE
            </span>
          </div>
          {/* overall wiring */}
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-sm bg-amber-400/10">
            <div
              className="h-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.5)] transition-[width] duration-700"
              style={{ width: `${wired * 100}%` }}
            />
          </div>
          <div className="mt-2 flex gap-1">
            {tab("all", "ALL", rows.length)}
            {tab("pending", "PENDING", pending.length)}
            {tab("online", "ONLINE", active.length)}
          </div>
        </header>

        {nextUp && filter !== "online" && (
          <button
            type="button"
            onClick={() => focusBuilding(nextUp.building)}
            className="tap w-full border-b border-amber-400/20 bg-amber-400/[0.04] px-4 py-2.5 text-left transition-colors hover:bg-amber-400/[0.09]"
            aria-label={`Open ${BUILDINGS_BY_ID[nextUp.building].name} on the map`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="stencil text-[10px] tracking-widest text-amber-300/80">NEXT UNLOCK</span>
              <span className="font-mono text-[10px] tabular-nums text-amber-200/70">
                {nextUp.remaining === 1 ? "1 LEVEL AWAY" : `${nextUp.remaining} LEVELS AWAY`}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-amber-100/90">
              {nextUp.label} <span className="text-amber-300/60">·</span>{" "}
              <span className="text-amber-200/70">{BUILDINGS_BY_ID[nextUp.building].name}</span>
            </div>
            <div className="text-[11px] leading-snug text-amber-100/60">{nextUp.effect}</div>
          </button>
        )}

        {visible.length === 0 ? (
          <p className="px-4 py-6 text-center font-mono text-[11px] text-amber-200/45">
            {filter === "online" ? "No perks online yet. Build the city." : "Every perk is wired. The city runs itself."}
          </p>
        ) : (
          <ul className="divide-y divide-amber-400/10">
            {visible.map((r) => (
              <PerkRow key={r.key} r={r} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

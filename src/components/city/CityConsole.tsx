// MILVERSE — Your City · Console (end-level pass).
// Folds Directives / Perks / Journal into one tabbed desk console so the
// landing page stops being an endless stack of panels.
// Presentation only: it mounts the existing panels, it never changes their logic.

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { DailyDirectives } from "./DailyDirectives";
import { PerksLedger } from "./PerksLedger";
import { CityJournal } from "./CityJournal";
import { directiveDefs, loadDirectives } from "@/lib/city/directives";
import { loadCity, levelOf } from "@/lib/city/citySave";
import { loadJournal } from "@/lib/city/journal";
import { readStore, writeStore } from "@/lib/storage";
import { useCoalescedRefresh } from "@/hooks/useCoalescedRefresh";
import type { BuildingId } from "@/lib/city/buildings";

type TabId = "directives" | "perks" | "journal";

const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "directives", label: "DIRECTIVES", hint: "Today's three jobs." },
  { id: "perks", label: "WIRING", hint: "What the city switches on." },
  { id: "journal", label: "JOURNAL", hint: "What the city logged." },
];

const PERK_REQS: Array<{ building: BuildingId; req: number }> = [
  { building: "outpost", req: 3 },
  { building: "library", req: 5 },
  { building: "school", req: 5 },
  { building: "newsroom", req: 5 },
  { building: "signal_tower", req: 5 },
  { building: "archive", req: 5 },
  { building: "clean_room", req: 3 },
  { building: "watchtower", req: 3 },
];

const TAB_KEY = "milverse.city.console.tab.v1";
const SEEN_KEY = "milverse.city.console.seen.v1";

interface SeenStore { v: 1; ts: number }
const seenValid = (v: unknown): v is SeenStore =>
  !!v && typeof v === "object" && (v as SeenStore).v === 1 && typeof (v as SeenStore).ts === "number";

const tabValid = (v: unknown): v is { v: 1; tab: TabId } =>
  !!v && typeof v === "object" && (v as { v?: number }).v === 1;

export function CityConsole() {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "directives";
    const raw = readStore<{ v: 1; tab: TabId }>(TAB_KEY, tabValid);
    return raw && raw !== "corrupt" ? raw.tab : "directives";
  });
  const [tick, setTick] = useState(0);
  const [seenTs, setSeenTs] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = readStore<SeenStore>(SEEN_KEY, seenValid);
    return raw && raw !== "corrupt" ? raw.ts : 0;
  });

  useCoalescedRefresh(
    ["milverse:directives", "milverse:city", "milverse:bricks", "milverse:city:built", "milverse:journal"],
    () => setTick((n) => n + 1),
  );

  // Badge counts — cheap derivations, recomputed only on city events.
  const badges = useMemo(() => {
    if (typeof window === "undefined") return { directives: 0, perks: 0, journal: 0 };
    void tick;
    const d = loadDirectives();
    const defs = directiveDefs(d);
    const ready = defs.filter(
      (x) => !d.claimed[x.id] && (d.progress[x.id] ?? 0) >= x.target,
    ).length;
    const save = loadCity();
    const online = PERK_REQS.filter((p) => levelOf(save, p.building) >= p.req).length;
    const pending = PERK_REQS.length - online;
    const unseen = loadJournal().filter((e) => e.ts > seenTs).length;
    return { directives: ready, perks: pending, journal: unseen };
  }, [tick, seenTs]);

  const select = useCallback((id: TabId) => {
    setTab(id);
    writeStore(TAB_KEY, { v: 1, tab: id });
    if (id === "journal") {
      const ts = Date.now();
      writeStore(SEEN_KEY, { v: 1, ts });
      setSeenTs(ts);
    }
  }, []);

  // Mark journal read while it is the open tab and new lines land.
  useEffect(() => {
    if (tab !== "journal") return;
    const ts = Date.now();
    writeStore(SEEN_KEY, { v: 1, ts });
    setSeenTs(ts);
  }, [tab, tick]);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: ReactKeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <section className="mx-auto mt-4 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm overflow-hidden">
        <div
          role="tablist"
          aria-label="City desk console"
          onKeyDown={onKeyDown}
          className="flex items-stretch gap-1 border-b border-amber-400/20 px-2 pt-2"
        >
          {TABS.map((t, i) => {
            const on = t.id === tab;
            const n = badges[t.id];
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`city-tab-${t.id}`}
                aria-selected={on}
                aria-controls={`city-panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                type="button"
                onClick={() => select(t.id)}
                className={`tap relative flex-1 min-h-[44px] rounded-t px-3 py-2 stencil text-[11px] tracking-widest transition-colors ${
                  on
                    ? "bg-amber-400/12 text-amber-100 border-x border-t border-amber-300/40"
                    : "text-amber-200/55 hover:text-amber-100 border-x border-t border-transparent"
                }`}
              >
                {t.label}
                {n > 0 && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 font-mono text-[9px] tabular-nums ${
                      t.id === "directives"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : t.id === "journal"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "bg-amber-500/15 text-amber-200/80"
                    }`}
                  >
                    {n}
                  </span>
                )}
                {on && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 -bottom-px h-px bg-amber-300/70"
                  />
                )}
              </button>
            );
          })}
        </div>

        <p className="px-4 py-1.5 font-mono text-[10px] text-amber-100/45">{active.hint}</p>

        <div
          role="tabpanel"
          id={`city-panel-${tab}`}
          aria-labelledby={`city-tab-${tab}`}
          className="pb-2 motion-safe:animate-[console-in_220ms_ease-out]"
        >
          {/* Panels ship their own section chrome; pull the outer padding back in. */}
          <div className="[&>section]:mt-0 [&>section]:px-0 [&>section]:max-w-none [&>section>div]:border-0 [&>section>div]:bg-transparent [&>section>div]:backdrop-blur-none [&>section>div]:rounded-none">
            {tab === "directives" && <DailyDirectives />}
            {tab === "perks" && <PerksLedger />}
            {tab === "journal" && <CityJournal />}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes console-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}

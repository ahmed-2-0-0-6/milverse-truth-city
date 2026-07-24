// MILVERSE — Your City · Journal panel (Phase 3 upgrade).

import { memo, useEffect, useMemo, useState } from "react";
import { loadJournal, wireJournalListeners, type JournalEntry } from "@/lib/city/journal";
import { useTabAwake } from "@/hooks/useOnScreen";
import { useCoalescedRefresh } from "@/hooks/useCoalescedRefresh";

const KIND_LABEL: Record<JournalEntry["kind"], { tag: string; tone: string }> = {
  built:      { tag: "GROUNDBREAKING", tone: "text-amber-200" },
  perk:       { tag: "PERK ONLINE",    tone: "text-emerald-300" },
  directive:  { tag: "DIRECTIVE",      tone: "text-cyan-300" },
  combo:      { tag: "COMBO",          tone: "text-fuchsia-300" },
  promotion:  { tag: "PROMOTION",      tone: "text-yellow-200" },
};

function relTime(ts: number, now: number): string {
  const s = Math.max(1, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type Filter = "all" | JournalEntry["kind"];

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "built", label: "BUILDS" },
  { id: "perk", label: "PERKS" },
  { id: "directive", label: "DIRECTIVES" },
  { id: "promotion", label: "SEATS" },
];

export function CityJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => loadJournal());
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    wireJournalListeners();
  }, []);
  useCoalescedRefresh(["milverse:journal"], () => setEntries(loadJournal()));

  // Refresh "Xs ago" once a minute — cheap, no listener churn.
  const awake = useTabAwake();
  useEffect(() => {
    if (!awake) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [awake]);

  const shown = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((e) =>
            filter === "directive" ? e.kind === "directive" || e.kind === "combo" : e.kind === filter,
          ),
    [entries, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.kind] = (map[e.kind] ?? 0) + 1;
    return map;
  }, [entries]);

  return (
    <section className="mx-auto mt-4 w-full max-w-5xl px-3">
      <div className="rounded-sm border border-amber-400/20 bg-black/70 backdrop-blur-sm">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2.5 gap-3 flex-wrap">
          <h3 className="stencil text-[11px] tracking-widest text-amber-300">CITY JOURNAL</h3>
          <span className="font-mono text-[10px] text-amber-200/60 tabular-nums">
            {entries.length ? `LAST ${entries.length}` : "QUIET NIGHT"}
          </span>
        </header>

        {entries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-amber-400/20 px-4 py-2">
            {FILTERS.map((f) => {
              const n =
                f.id === "all"
                  ? entries.length
                  : f.id === "directive"
                    ? (counts.directive ?? 0) + (counts.combo ?? 0)
                    : (counts[f.id] ?? 0);
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  disabled={n === 0}
                  className={`tap stencil rounded border px-2 py-0.5 text-[9px] tracking-widest transition-colors ${
                    active
                      ? "border-amber-300/70 bg-amber-400/15 text-amber-100"
                      : n === 0
                        ? "border-amber-400/20 text-amber-200/25 cursor-not-allowed"
                        : "border-amber-400/20 text-amber-200/70 hover:text-amber-100"
                  }`}
                  aria-pressed={active}
                >
                  {f.label} · {n}
                </button>
              );
            })}
          </div>
        )}

        {shown.length === 0 ? (
          <div className="px-4 py-6 text-center font-mono text-[11px] text-amber-100/50">
            {entries.length === 0
              ? "Nothing on the wire yet. Take down a case or break ground."
              : "Nothing filed under that tag yet."}
          </div>
        ) : (
          <ul className="divide-y divide-amber-400/10 max-h-64 overflow-y-auto">
            {shown.map((e, i) => (
              <JournalRow key={`${e.ts}-${i}`} entry={e} rel={relTime(e.ts, now)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}


const JournalRow = memo(function JournalRow({
  entry,
  rel,
}: {
  entry: JournalEntry;
  rel: string;
}) {
  const meta = KIND_LABEL[entry.kind];
  return (
    <li className="px-4 py-2 grid grid-cols-[auto_1fr_auto] items-baseline gap-3">
      <span className={`stencil text-[9px] tracking-widest ${meta.tone}`}>{meta.tag}</span>
      <span className="font-mono text-[11px] text-amber-100/90 truncate">{entry.text}</span>
      <span className="font-mono text-[10px] tabular-nums text-amber-200/50">{rel}</span>
    </li>
  );
});

// MILVERSE — Your City · Journal panel (Phase 3 upgrade).

import { useEffect, useState } from "react";
import { loadJournal, wireJournalListeners, type JournalEntry } from "@/lib/city/journal";

const KIND_LABEL: Record<JournalEntry["kind"], { tag: string; tone: string }> = {
  built:      { tag: "GROUNDBREAKING", tone: "text-amber-200" },
  perk:       { tag: "PERK ONLINE",    tone: "text-emerald-300" },
  directive:  { tag: "DIRECTIVE",      tone: "text-cyan-300" },
  combo:      { tag: "COMBO",          tone: "text-fuchsia-300" },
  promotion:  { tag: "PROMOTION",      tone: "text-yellow-200" },
};

function relTime(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function CityJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => loadJournal());

  useEffect(() => {
    wireJournalListeners();
    const on = () => setEntries(loadJournal());
    window.addEventListener("milverse:journal", on);
    return () => window.removeEventListener("milverse:journal", on);
  }, []);

  return (
    <section className="mx-auto mt-4 w-full max-w-5xl px-3">
      <div className="rounded-md border border-amber-400/25 bg-black/60 backdrop-blur-sm">
        <header className="flex items-baseline justify-between border-b border-amber-400/20 px-4 py-2.5 gap-3 flex-wrap">
          <h3 className="stencil text-[11px] tracking-widest text-amber-300">CITY JOURNAL</h3>
          <span className="font-mono text-[10px] text-amber-200/60 tabular-nums">
            {entries.length ? `LAST ${entries.length}` : "QUIET NIGHT"}
          </span>
        </header>

        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center font-mono text-[11px] text-amber-100/50">
            Nothing on the wire yet. Take down a case or break ground.
          </div>
        ) : (
          <ul className="divide-y divide-amber-400/10 max-h-64 overflow-y-auto">
            {entries.map((e, i) => {
              const meta = KIND_LABEL[e.kind];
              return (
                <li key={`${e.ts}-${i}`} className="px-4 py-2 grid grid-cols-[auto_1fr_auto] items-baseline gap-3">
                  <span className={`stencil text-[9px] tracking-widest ${meta.tone}`}>{meta.tag}</span>
                  <span className="font-mono text-[12px] text-amber-100/90 truncate">{e.text}</span>
                  <span className="font-mono text-[10px] tabular-nums text-amber-200/50">{relTime(e.ts)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

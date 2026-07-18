// MILVERSE — Spool UI. Collapsed section on /drop that reprints every past
// receipt on demand. Zero canvas work until a row is opened.

import { useEffect, useMemo, useRef, useState } from "react";
import { ReceiptCard } from "@/components/daily/ReceiptCard";
import {
  rebuildReceipt,
  spoolEntries,
  outcomeWord,
  SPOOL_LIST_CAP,
} from "@/lib/daily/spool";
import type { DailyPlayEntry } from "@/lib/mirror/profile";
import { X } from "lucide-react";

const OUTCOME_TONE: Record<ReturnType<typeof outcomeWord>, string> = {
  CORRECT: "text-primary",
  "MISSED SCAM": "text-destructive",
  "FALSE ALARM": "text-[#f5b942]",
};

export function Spool() {
  const [entries, setEntries] = useState<DailyPlayEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Hydrate from localStorage after mount (SSR-safe).
  useEffect(() => {
    setEntries(spoolEntries());
    const on = () => setEntries(spoolEntries());
    if (typeof window !== "undefined") window.addEventListener("milverse:profile", on);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("milverse:profile", on);
    };
  }, []);

  const total = entries.length;
  const listed = useMemo(() => entries.slice(0, SPOOL_LIST_CAP), [entries]);
  const truncated = total > SPOOL_LIST_CAP;

  const openRow = (idx: number, btn: HTMLButtonElement) => {
    openerRef.current = btn;
    setOpenIdx(idx);
  };
  const closeOverlay = () => {
    setOpenIdx(null);
    // Return focus to the opener after the next tick.
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  // Focus trap + Escape.
  useEffect(() => {
    if (openIdx === null) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = dialogRef.current;
    el?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverlay();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const focusables = el.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // If overlay unmounted for reasons other than closeOverlay(), restore.
      if (prev && document.contains(prev)) (prev as HTMLElement).focus?.();
    };
  }, [openIdx]);

  if (total === 0) {
    return (
      <section className="mt-10">
        <div className="stencil text-[10px] text-muted-foreground">
          THE SPOOL · EMPTY. THE FIRST RECEIPT PRINTS TOMORROW MORNING.
        </div>
      </section>
    );
  }

  const openEntry = openIdx !== null ? listed[openIdx] : null;
  const openReceipt = openEntry ? rebuildReceipt(openEntry, entries) : null;

  return (
    <section className="mt-10">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="stencil text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-sm px-2 py-1"
      >
        THE SPOOL · {total} RECEIPT{total === 1 ? "" : "S"} ON FILE
        {expanded ? " — HIDE" : " — OPEN"}
      </button>

      {expanded && (
        <div className="mt-3 rounded-sm border border-border bg-card divide-y divide-border">
          {listed.map((e, i) => {
            const word = outcomeWord(e);
            const deltaStr = e.correct ? `+${e.delta}` : `${e.delta}`;
            const label = `Receipt, ${e.dateKey}, ${word.toLowerCase()}, stake ${e.stake}`;
            return (
              <button
                key={`${e.dateKey}-${e.ts}`}
                aria-label={label}
                onClick={(ev) => openRow(i, ev.currentTarget)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 font-mono text-xs"
              >
                <span className="text-muted-foreground w-[92px]">{e.dateKey}</span>
                <span
                  className={`stencil text-[10px] w-[110px] ${OUTCOME_TONE[word]}`}
                >
                  {word}
                </span>
                <span className="text-muted-foreground w-[110px]">
                  {e.stake} → <span className={e.correct ? "text-primary" : "text-destructive"}>{deltaStr}</span>
                </span>
                <span className="ml-auto text-muted-foreground">streak {e.dateKey ? streakBadge(e, entries) : 0}</span>
              </button>
            );
          })}
          {truncated && (
            <div className="px-3 py-2 font-mono text-[11px] text-muted-foreground stencil">
              OLDER TAPE ARCHIVED · THE SPOOL KEEPS {SPOOL_LIST_CAP}.
            </div>
          )}
        </div>
      )}

      {openReceipt && openEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4"
          onClick={closeOverlay}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Receipt for ${openEntry.dateKey}`}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg my-6 rounded-sm border border-primary/40 bg-background p-4 outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="stencil text-[10px] tracking-widest text-primary">
                REPRINT · {openEntry.dateKey}
              </div>
              <button
                onClick={closeOverlay}
                className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 stencil text-[10px] text-muted-foreground hover:text-foreground"
                aria-label="Close receipt"
              >
                <X className="h-3.5 w-3.5" /> CLOSE
              </button>
            </div>
            <ReceiptCard data={openReceipt} />
          </div>
        </div>
      )}
    </section>
  );
}

// Small inline helper so we don't paint every canvas at page load just to
// display the streak-at-time integer. Cheap arithmetic on already-loaded data.
function streakBadge(e: DailyPlayEntry, all: DailyPlayEntry[]): number {
  const set = new Set(all.map((p) => p.dateKey));
  let count = 0;
  let cursor = e.dateKey;
  while (set.has(cursor)) {
    count += 1;
    cursor = new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
  }
  return count;
}

// THE DAILY MIRAGE — Classifieds. "Circle the red flags."
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { EditionClassified } from "@/lib/paper/types";
import { markSectionDone } from "@/lib/paper/profile";
import { logPaperInteraction } from "@/lib/paper.functions";
import { getDeviceId } from "@/lib/pilot";

export function PaperClassifieds({
  items,
  editionNumber,
  onDone,
}: {
  items: EditionClassified[];
  editionNumber: number;
  onDone: () => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <section className="paper-section">
      <div className="paper-section-kicker">TODAY'S SUSPECT COLUMN INCHES · {items.length} ADS</div>
      <p className="paper-section-lede">
        Three ads landed at the desk. Tap one — circle the tells.
      </p>
      <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((c, i) => (
          <li
            key={i}
            className="border border-current/40 p-3 rounded-sm cursor-pointer hover:bg-black/5 transition-colors"
            style={{ borderColor: "var(--paper-rule)" }}
            onClick={() => setOpenIdx(i)}
          >
            <h4 className="paper-serif" style={{ fontWeight: 900 }}>
              {c.title}
            </h4>
            <p className="paper-body no-dropcap text-sm mt-1 line-clamp-4">{c.body}</p>
            <div className="paper-mono text-[10px] mt-2 tracking-[0.25em] underline decoration-dotted text-[color:var(--paper-muted)]">
              TAP TO INSPECT →
            </div>
          </li>
        ))}
      </ul>

      {openIdx !== null && (
        <FlagFinder
          item={items[openIdx]}
          editionNumber={editionNumber}
          onClose={() => setOpenIdx(null)}
          onDone={onDone}
        />
      )}
    </section>
  );
}

function FlagFinder({
  item,
  editionNumber,
  onClose,
  onDone,
}: {
  item: EditionClassified;
  editionNumber: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [circled, setCircled] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const logInt = useServerFn(logPaperInteraction);

  const combined = `${item.title}\n${item.body}`;

  // Split by flags to render circle-clickable spans
  const parts: Array<{ text: string; flag: string | null }> = [];
  const idx = 0;
  const remaining: string[] = [combined];
  // simple sequential split
  const acc: Array<{ text: string; flag: string | null }> = [];
  let source = combined;
  const flagOrder: string[] = [];
  item.flags.forEach((f) => flagOrder.push(f));
  while (source.length) {
    let nextI = -1;
    let nextFlag = "";
    for (const f of flagOrder) {
      const at = source.indexOf(f);
      if (at >= 0 && (nextI < 0 || at < nextI)) {
        nextI = at;
        nextFlag = f;
      }
    }
    if (nextI < 0) {
      acc.push({ text: source, flag: null });
      break;
    }
    if (nextI > 0) acc.push({ text: source.slice(0, nextI), flag: null });
    acc.push({ text: nextFlag, flag: nextFlag });
    source = source.slice(nextI + nextFlag.length);
  }
  void idx;
  void parts;
  void remaining;

  function toggle(f: string) {
    if (revealed) return;
    const n = new Set(circled);
    if (n.has(f)) n.delete(f);
    else n.add(f);
    setCircled(n);
  }
  function submit() {
    setRevealed(true);
    const correct = item.flags.every((f) => circled.has(f)) && circled.size === item.flags.length;
    void logInt({
      data: { number: editionNumber, section: "classified", correct, deviceId: getDeviceId() },
    }).catch(() => {});
    markSectionDone(editionNumber, "classified");
    onDone();
  }
  const hits = item.flags.filter((f) => circled.has(f)).length;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4 no-print"
      onClick={onClose}
    >
      <div
        className="paper max-w-lg w-full rounded-sm border-4 double p-5 relative"
        style={{ borderColor: "var(--paper-ink)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 right-3 paper-mono text-xs">
          ✕
        </button>
        <div className="paper-mono text-[10px] tracking-[0.3em] text-[color:var(--paper-muted)]">
          CIRCLE THE RED FLAGS · {item.flags.length} TELLS
        </div>
        <div className="mt-3 paper-body no-dropcap text-base whitespace-pre-wrap leading-snug">
          {acc.map((p, i) =>
            p.flag ? (
              <span
                key={i}
                onClick={() => toggle(p.flag!)}
                className={`cursor-pointer transition ${circled.has(p.flag) ? "paper-flag-marked" : "hover:bg-[oklch(0.9_0.05_25/0.4)] rounded"}`}
              >
                {p.text}
              </span>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="paper-mono text-[10px]">
            {hits}/{item.flags.length} circled
          </div>
          <div className="flex-1" />
          {!revealed ? (
            <button
              onClick={submit}
              className="border-4 double px-3 py-2 paper-mono text-xs tracking-widest"
              style={{ borderColor: "var(--paper-ink)" }}
            >
              REVEAL
            </button>
          ) : (
            <button
              onClick={onClose}
              className="border-4 double px-3 py-2 paper-mono text-xs tracking-widest"
              style={{ borderColor: "var(--paper-ink)" }}
            >
              CLOSE
            </button>
          )}
        </div>
        {revealed && (
          <p className="paper-serif italic mt-3 text-sm">
            The tells:{" "}
            {item.flags.map((f) => (
              <span key={f} className="paper-flag-marked mr-1">
                {f}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

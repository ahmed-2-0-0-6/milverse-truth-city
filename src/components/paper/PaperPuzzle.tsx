// THE DAILY MIRAGE — Puzzle Corner. HEADLINE AUTOPSY: reorder words into honest form.
import { useMemo, useState } from "react";
import type { EditionPuzzle } from "@/lib/paper/types";
import { markSectionDone } from "@/lib/paper/profile";

function shuffled<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PaperPuzzle({
  puzzle,
  editionNumber,
  onDone,
}: {
  puzzle: EditionPuzzle;
  editionNumber: number;
  onDone: () => void;
}) {
  const initialPool = useMemo(() => shuffled(puzzle.words), [puzzle.words]);
  const [pool, setPool] = useState<string[]>(initialPool);
  const [chosen, setChosen] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const target = puzzle.honest.trim().replace(/[.,!?]$/, "");
  const currentGuess = chosen.join(" ");
  const correct = revealed && currentGuess.toLowerCase() === target.toLowerCase();

  function pick(w: string, i: number) {
    if (revealed) return;
    setChosen((c) => [...c, w]);
    setPool((p) => p.filter((_, idx) => idx !== i));
  }
  function unpick(i: number) {
    if (revealed) return;
    setPool((p) => [...p, chosen[i]]);
    setChosen((c) => c.filter((_, idx) => idx !== i));
  }
  function reveal() {
    setRevealed(true);
    markSectionDone(editionNumber, "puzzle");
    onDone();
  }
  function reset() {
    setPool(shuffled(puzzle.words));
    setChosen([]);
    setRevealed(false);
  }

  if (puzzle.kind !== "headline_autopsy") {
    return (
      <section className="paper-section">
        <div className="paper-section-kicker">SPOT THE TELL</div>
        <p className="paper-section-lede">{puzzle.clickbait}</p>
        <button onClick={reveal} className="paper-btn mt-3">
          REVEAL
        </button>
        {revealed && <p className="paper-body no-dropcap mt-3">{puzzle.reveal}</p>}
      </section>
    );
  }

  return (
    <section className="paper-section">
      <div className="paper-section-kicker">HEADLINE AUTOPSY · 60 SECONDS</div>
      <p className="paper-section-lede">
        Rearrange the words into the honest version of this clickbait.
      </p>
      <blockquote
        className="mt-3 border-l-4 pl-3 italic paper-serif text-lg"
        style={{ borderColor: "var(--paper-ink)" }}
      >
        “{puzzle.clickbait}”
      </blockquote>


      <div
        className="mt-4 border border-current/40 p-3 min-h-16 rounded-sm flex flex-wrap gap-2"
        style={{ borderColor: "var(--paper-rule)" }}
      >
        {chosen.length === 0 && (
          <span className="paper-mono text-[10px] text-[color:var(--paper-muted)]">
            tap words below to build the honest version
          </span>
        )}
        {chosen.map((w, i) => (
          <button
            key={`${w}-${i}`}
            onClick={() => unpick(i)}
            className="paper-mono text-sm px-2 py-1 border rounded-sm bg-white/60"
            style={{ borderColor: "var(--paper-rule)" }}
          >
            {w} ✕
          </button>
        ))}
      </div>

      {!revealed && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pool.map((w, i) => (
            <button
              key={`${w}-${i}`}
              onClick={() => pick(w, i)}
              className="paper-mono text-sm px-2 py-1 border-2 rounded-sm hover:bg-black/5"
              style={{ borderColor: "var(--paper-ink)" }}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        {!revealed ? (
          <>
            <button
              onClick={reveal}
              disabled={chosen.length === 0}
              className="paper-btn-primary"
            >
              REVEAL HONEST HEADLINE
            </button>
            <button onClick={reset} className="paper-mono text-[10px] tracking-[0.2em] underline decoration-dotted text-[color:var(--paper-muted)]">
              RESET
            </button>
          </>

        ) : (
          <div>
            <div
              className={`paper-stamp inline-block border-4 px-3 py-1 paper-mono text-xs tracking-[0.3em] ${correct ? "text-[oklch(0.35_0.15_140)] border-[oklch(0.4_0.15_140)]" : "text-[oklch(0.4_0.2_25)] border-[oklch(0.5_0.2_25)]"}`}
            >
              {correct ? "CLEAN CUT" : "CLOSE — HONEST VERSION BELOW"}
            </div>
            <p className="paper-serif italic mt-2">“{puzzle.honest}”</p>
            <p className="paper-body no-dropcap text-sm mt-2">{puzzle.reveal}</p>
          </div>
        )}
      </div>
    </section>
  );
}

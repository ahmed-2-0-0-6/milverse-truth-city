// THE DAILY MIRAGE — Forgery Column ("Real or Engine-Made?")
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { EditionForgery } from "@/lib/paper/types";
import { markSectionDone, readEditionRecord } from "@/lib/paper/profile";
import { logPaperInteraction, getPaperSplit } from "@/lib/paper.functions";
import { getDeviceId } from "@/lib/pilot";

export function PaperForgeryColumn({
  forgery,
  editionNumber,
  onDone,
}: {
  forgery: EditionForgery;
  editionNumber: number;
  onDone: () => void;
}) {
  const rec = readEditionRecord(editionNumber);
  const [guess, setGuess] = useState<"REAL" | "AI" | null>(null);
  const [split, setSplit] = useState<{ total: number; correct: number } | null>(null);
  const done = rec.sectionsDone.includes("forgery");
  const logInt = useServerFn(logPaperInteraction);
  const getSplit = useServerFn(getPaperSplit);
  useEffect(() => {
    if (guess || done)
      getSplit({ data: { number: editionNumber, section: "forgery" } })
        .then((s) => setSplit(s as { total: number; correct: number }))
        .catch(() => {});
  }, [guess, done, getSplit, editionNumber]);

  function submit(v: "REAL" | "AI") {
    setGuess(v);
    const correct = v === forgery.truth;
    void logInt({
      data: { number: editionNumber, section: "forgery", correct, deviceId: getDeviceId() },
    }).catch(() => {});
    markSectionDone(editionNumber, "forgery");
    onDone();
  }

  const revealed = !!guess;
  const cityPct = split && split.total > 0 ? Math.round((split.correct / split.total) * 100) : null;

  return (
    <section className="mt-2 grid md:grid-cols-[minmax(0,1fr)_260px] gap-6">
      <div>
        <div className="paper-mono text-[10px] tracking-[0.3em] text-[color:var(--paper-muted)]">
          REAL OR ENGINE-MADE?
        </div>
        <h3 className="paper-serif text-3xl mt-1" style={{ fontWeight: 900 }}>
          The Forgery Column
        </h3>
        <p className="paper-body no-dropcap mt-2">{forgery.prompt}</p>
        {!revealed ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => submit("REAL")}
              className="border-2 py-2 px-4 paper-mono text-xs tracking-widest hover:bg-black/5"
              style={{ borderColor: "var(--paper-ink)" }}
            >
              REAL CAMERA
            </button>
            <button
              onClick={() => submit("AI")}
              className="border-2 py-2 px-4 paper-mono text-xs tracking-widest hover:bg-black/5"
              style={{ borderColor: "var(--paper-ink)" }}
            >
              ENGINE-MADE
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div
              className={`paper-stamp inline-block border-4 px-3 py-1 paper-mono text-xs tracking-[0.3em] ${guess === forgery.truth ? "text-[oklch(0.35_0.15_140)] border-[oklch(0.4_0.15_140)]" : "text-[oklch(0.4_0.2_25)] border-[oklch(0.5_0.2_25)]"}`}
            >
              TRUTH: {forgery.truth === "AI" ? "ENGINE-MADE" : "REAL CAMERA"}
            </div>
            <p className="paper-body no-dropcap text-sm mt-3">{forgery.provenance}</p>
            {cityPct !== null && (
              <p className="paper-serif italic mt-2 text-sm">
                The city is right <span className="font-black">{cityPct}%</span> of the time on this
                one. {cityPct >= 45 && cityPct <= 55 ? "A coin flip." : ""}
              </p>
            )}
            <p className="paper-serif italic mt-2 text-sm">{forgery.thesis}</p>
          </div>
        )}
      </div>
      <figure className="border border-current/40 p-2" style={{ borderColor: "var(--paper-rule)" }}>
        <div
          className="paper-halftone h-52 flex items-center justify-center text-6xl"
          aria-label={forgery.imageAlt}
        >
          <span aria-hidden style={{ mixBlendMode: "multiply", opacity: revealed ? 1 : 0.75 }}>
            {forgery.imageEmoji}
          </span>
        </div>
        <figcaption className="paper-mono text-[10px] mt-1 text-[color:var(--paper-muted)]">
          EXHIBIT · CITY DESK OVERNIGHT
        </figcaption>
      </figure>
    </section>
  );
}

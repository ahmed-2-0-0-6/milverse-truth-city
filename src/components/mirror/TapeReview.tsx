// MILVERSE — TapeReview. Post-verdict annotated playback of a Mirror
// conversation. Read-only over the stored sim/tape record. Static document
// flow — no autoplay, no entrance animation, just the chat with the
// annotation layer switched on.

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { VoiceNote } from "@/components/VoiceNote";
import { skinForCase, type ChatSkin } from "@/lib/chat/skins";
import { getScenario, type Scenario } from "@/lib/mirror/scenarios";
import type { TapeMessage, TapeResult } from "@/lib/mirror/tapes";

interface Props {
  scenario: Scenario;
  messages: TapeMessage[];
  result: TapeResult;
  onClose: () => void;
}

const FOOTER: Record<TapeResult, string> = {
  correct: "You saw it live. Now you've seen it twice.",
  missed_scam:
    "Read it again knowing the truth. Find the line where you started believing him.",
  false_alarm:
    "Read it again. Find the line where a real person stopped sounding real to you.",
  lucky_guess: "Right call. Now find the evidence you skipped.",
};

function probeChip(m: TapeMessage, scenario: Scenario): string | null {
  if (m.probeQuality === "strong") {
    let text = "STRONG PROBE";
    if (m.factId) {
      const hit = scenario.facts.some((f) => f.id === m.factId);
      if (hit) text += `, hit the ${m.factId} file`;
    }
    return text;
  }
  if (m.probeQuality === "weak") return "WEAK — answerable with a search";
  if (m.probeQuality === "wasted") return "WASTED — they could just lie";
  return null;
}

function chipCls(q: TapeMessage["probeQuality"]): string {
  if (q === "strong") return "border-primary/50 text-primary bg-primary/10";
  if (q === "weak") return "border-border text-muted-foreground bg-muted/20";
  return "border-destructive/40 text-destructive/90 bg-destructive/10";
}

export function TapeReview({ scenario, messages, result, onClose }: Props) {
  const skin: ChatSkin = useMemo(() => skinForCase(scenario.id), [scenario.id]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const counts = useMemo(() => {
    let tell = 0,
      strong = 0,
      weak = 0,
      wasted = 0;
    for (const m of messages) {
      if (m.role === "contact" && m.isTell) tell++;
      if (m.role === "player") {
        if (m.probeQuality === "strong") strong++;
        else if (m.probeQuality === "weak") weak++;
        else if (m.probeQuality === "wasted") wasted++;
      }
    }
    return { tell, strong, weak, wasted };
  }, [messages]);

  // Focus trap + escape.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !overlayRef.current) return;
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Case tape"
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
    >
      {/* Sticky tape chrome */}
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="stencil text-[10px] tracking-[0.3em] text-caution">
              THE TAPE · {scenario.title}
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground tabular-nums">
              {counts.tell} TELLS ON RECORD · {counts.strong} STRONG / {counts.weak} WEAK /{" "}
              {counts.wasted} WASTED PROBES
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground/80">
              ◈ tell · chips grade your questions
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 font-mono text-[10px] tracking-widest text-muted-foreground hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close case tape"
          >
            <X className="h-3.5 w-3.5" /> CLOSE
          </button>
        </div>
      </header>

      {/* Transcript in the case's platform skin */}
      <div
        className={`flex-1 overflow-y-auto ${skin.bodyClass}`}
        style={skin.bodyStyle}
      >
        <div
          role="log"
          aria-label="Annotated conversation"
          className="mx-auto max-w-2xl px-3 py-4 space-y-3"
        >
          {messages.map((m, i) => (
            <TapeRow key={i} m={m} skin={skin} scenario={scenario} />
          ))}
        </div>
      </div>

      {/* Footer editorial line */}
      <footer className="shrink-0 border-t border-border bg-card/95 backdrop-blur">
        <p className="mx-auto max-w-2xl px-4 py-4 text-center font-mono text-[11px] leading-relaxed tracking-wide text-muted-foreground">
          {FOOTER[result]}
        </p>
      </footer>
    </div>
  );
}

function TapeRow({
  m,
  skin,
  scenario,
}: {
  m: TapeMessage;
  skin: ChatSkin;
  scenario: Scenario;
}) {
  if (m.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[90%] rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-primary">
          {m.text}
        </div>
      </div>
    );
  }

  const isPlayer = m.role === "player";
  const contactTell = m.role === "contact" && m.isTell;
  const chip = isPlayer ? probeChip(m, scenario) : null;
  const chipTone = chipCls(m.probeQuality);
  const tellNote =
    m.tellExplanation && m.tellExplanation.trim().length > 0
      ? m.tellExplanation
      : "this reply dodged instead of answering";

  return (
    <div className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}>
      <div
        className={`flex ${isPlayer ? "justify-end" : "justify-start"} w-full`}
      >
        {m.kind === "voice" && m.voice ? (
          <div
            className={
              contactTell
                ? "max-w-[80%] border-l-2 border-caution pl-2"
                : "max-w-[80%]"
            }
          >
            {m.text && (
              <div
                className={`mb-1 px-3 py-1.5 text-xs italic shadow-sm ${
                  isPlayer ? skin.outBubble : `${skin.inBubble} text-white/80`
                }`}
              >
                {m.text}
              </div>
            )}
            <VoiceNote voice={m.voice} fromPlayer={isPlayer} />
          </div>
        ) : (
          <div
            className={`px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm max-w-[80%] ${
              isPlayer ? skin.outBubble : skin.inBubble
            } ${contactTell ? "border-l-2 border-caution" : ""}`}
          >
            {m.text}
          </div>
        )}
      </div>

      {contactTell && (
        <div className="mt-1 w-full max-w-[80%] self-start pl-1 font-mono text-[10px] leading-relaxed tracking-wide text-caution">
          <span aria-hidden>◈ </span>
          <span className="sr-only">Tell: </span>
          TELL — {tellNote}
        </div>
      )}

      {chip && (
        <div
          className={`mt-1 inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-widest ${chipTone}`}
        >
          {chip}
        </div>
      )}
    </div>
  );
}

// Convenience re-export so callers don't need two imports.
export { getScenario };

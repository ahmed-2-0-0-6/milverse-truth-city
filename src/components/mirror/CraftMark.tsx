// MILVERSE — Craft Mark under-bubble control.
// A quiet button that names how the player's last question was graded, with
// the WHY one tap/focus away. The strip is not a chat message; it never
// enters the transcript, the saved sim, or the tape.

import { useEffect, useRef, useState } from "react";
import type { Grade } from "@/lib/mirror/craftMarks";
import { labelFor } from "@/lib/mirror/craftMarks";

interface Props {
  grade: Grade;
  why: string;
  /** Parent-controlled single-open coordination. */
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** When true on mount, the strip opens once without stealing focus. */
  autoOpen?: boolean;
}

export function CraftMark({ grade, why, open, onOpen, onClose, autoOpen }: Props) {
  const [liveText, setLiveText] = useState("");
  const firedAutoRef = useRef(false);

  // Auto-open once on mount (first-of-grade or first-wasted-in-case).
  useEffect(() => {
    if (autoOpen && !firedAutoRef.current) {
      firedAutoRef.current = true;
      onOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Announce the WHY politely whenever this mark's strip opens.
  useEffect(() => {
    if (open) setLiveText(`${labelFor(grade)}. ${why}`);
  }, [open, grade, why]);

  // Escape closes the open strip (global while open).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const tone =
    grade === "strong"
      ? "text-primary/60 hover:text-primary"
      : grade === "wasted"
        ? "text-destructive/60 hover:text-destructive"
        : "text-muted-foreground/70 hover:text-foreground";

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-label={`Probe graded ${grade}. Why?`}
        className={`self-end font-mono text-[9px] tracking-widest transition ${tone}`}
      >
        {labelFor(grade)}
      </button>
      {open && (
        <div className="mt-1 self-end max-w-[85%] rounded-sm border-l-2 border-primary/40 bg-neutral-900/60 px-2 py-1 font-mono text-[10px] leading-snug tracking-wide text-white/85">
          {why}
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {liveText}
      </div>
    </>
  );
}

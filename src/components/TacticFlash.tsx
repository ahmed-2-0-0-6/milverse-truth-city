// MILVERSE — Mid-case "TACTIC IDENTIFIED" micro-cutscene.
// Presentational, non-blocking, auto-dismisses. Never declares truth.
// LITE mode + reduced-motion: no overlay, silent no-op.

import { useEffect, useState } from "react";
import { getManualEntry, type TacticId } from "@/lib/manual/entries";
import { unlockTactic } from "@/lib/manual/state";
import { useVisualMode } from "@/lib/visual-quality";

interface Props {
  tacticId: TacticId | null;
  onDone?: () => void;
  /** ms visible before auto-dismiss (default 1600). */
  duration?: number;
}

export function TacticFlash({ tacticId, onDone, duration = 1600 }: Props) {
  const { mode } = useVisualMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!tacticId) return;
    // Always unlock — the player has demonstrably encountered the tactic.
    unlockTactic(tacticId);

    const reduce = typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (mode !== "cinematic" || reduce) {
      onDone?.();
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => window.clearTimeout(t);
  }, [tacticId, mode, duration, onDone]);

  if (!tacticId || !visible) return null;
  const entry = getManualEntry(tacticId);
  if (!entry) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-[250] flex justify-center px-4"
      aria-live="polite"
    >
      <div
        className="verdict-stamp rounded-md border-2 border-primary/70 bg-black/85 px-5 py-3 shadow-[0_18px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur"
        style={{ transform: "translateZ(0)" }}
      >
        <div className="stencil text-[10px] tracking-[0.35em] text-primary">
          TACTIC IDENTIFIED · {entry.code}
        </div>
        <div
          className="text-2xl sm:text-3xl font-black tracking-tight text-primary"
          style={{ fontFamily: '"Bebas Neue", sans-serif', textShadow: "0 0 18px rgba(34,211,238,0.5)" }}
        >
          {entry.name}
        </div>
      </div>
    </div>
  );
}

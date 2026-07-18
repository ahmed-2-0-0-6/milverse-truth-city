// MILVERSE — Tier 5 VOB Ritual. The out-of-band exit staged as a heist:
// STEP OUT → THE DOORS → THE ACT. Resolves through the exact same useVob
// path the modal uses at Tiers 1–4 — identical result message, identical
// ended state, identical points. Presentation only.

import { useEffect, useRef, useState } from "react";
import { VOB_METHODS, type VobMethod } from "@/lib/mirror/engine";

interface Props {
  onClose: () => void;
  onPick: (m: VobMethod) => void;
}

/** Truth-blind staged line per real VOB method id. Verbatim. */
const ACT_LINE: Record<VobMethod, string> = {
  known_number:
    "You dial the number you've always had. It rings somewhere outside this room.",
  usual_app:
    "You message them on the thread you've always used. It lands somewhere outside this room.",
  mutual: "You ask someone you both know — on a channel this room doesn't touch.",
  in_person: "You ask to move this somewhere a face has to show up.",
};

type Stage = "doors" | "act";

export function VobRitual({ onClose, onPick }: Props) {
  const [stage, setStage] = useState<Stage>("doors");
  const [picked, setPicked] = useState<VobMethod | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstDoorRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape returns to chat unchanged.
  useEffect(() => {
    firstDoorRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pick(m: VobMethod) {
    setPicked(m);
    setStage("act");
    window.setTimeout(() => onPick(m), 1600);
  }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ritual-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      style={{ backgroundColor: "rgba(244, 244, 240, 0.94)" }}
    >
      <span className="sr-only" role="status" aria-live="polite">
        Out-of-band verification. Choose a channel.
      </span>

      <div className="w-full max-w-2xl text-[#1b2430]">
        <div
          id="ritual-title"
          className="stencil text-[11px] text-[#1b2430]/70"
        >
          STEP OUT OF THE ROOM
        </div>
        <p className="mt-2 text-base sm:text-lg font-light leading-relaxed">
          Nothing inside the room can prove anything about the room. Pick your channel.
        </p>

        {stage === "doors" && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VOB_METHODS.map((m, i) => (
              <button
                key={m.id}
                ref={i === 0 ? firstDoorRef : undefined}
                type="button"
                onClick={() => pick(m.id)}
                className="text-left rounded-sm border border-[#1b2430]/40 bg-white/70 px-5 py-6 min-h-[120px] transition hover:border-[#1b2430] hover:bg-white focus-visible:border-[#1b2430]"
              >
                <div className="stencil text-[10px] text-[#1b2430]/60">DOOR</div>
                <div className="mt-2 text-base font-semibold">{m.label}</div>
                <div className="mt-1 text-sm text-[#1b2430]/70">{m.blurb}</div>
              </button>
            ))}
          </div>
        )}

        {stage === "act" && picked && (
          <p className="mt-10 ritual-line text-lg sm:text-xl font-light leading-relaxed">
            {ACT_LINE[picked]}
          </p>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={onClose}
            className="stencil text-[10px] text-[#1b2430]/50 hover:text-[#1b2430]"
          >
            ← STEP BACK INTO THE ROOM
          </button>
        </div>
      </div>
    </div>
  );
}

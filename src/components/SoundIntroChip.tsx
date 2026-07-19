// MILVERSE — The Sound of the City · first-contact consent chip.
// Listens for the "milverse:soundintro:request" event dispatched by
// audio.ts the first time any cue would fire while the intro flag is
// absent. Shows a dismissible chip anchored near the TopBar mute control.
// Never returns once dismissed (either choice sets the flag).

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import {
  arrivalTap,
  markSoundIntroSeen,
  setMuted,
  soundIntroSeen,
} from "@/lib/mirror/audio";

export function SoundIntroChip() {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (soundIntroSeen()) return;

    const onRequest = () => {
      if (soundIntroSeen()) return;
      setOpen((cur) => {
        if (cur) return cur;
        // Remember what was focused so we can restore on dismiss.
        returnFocusRef.current =
          (document.activeElement as HTMLElement | null) ?? null;
        return true;
      });
    };
    window.addEventListener("milverse:soundintro:request", onRequest);
    return () =>
      window.removeEventListener("milverse:soundintro:request", onRequest);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Autofocus the primary action.
    const raf = requestAnimationFrame(() => firstFocusRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        keepSilent();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    setOpen(false);
    try {
      returnFocusRef.current?.focus();
    } catch {
      /* ignore */
    }
  }

  function turnOn() {
    setMuted(false);
    markSoundIntroSeen();
    // Confirmation tap — allowed now that the flag is set + unmuted.
    arrivalTap();
    dismiss();
  }

  function keepSilent() {
    setMuted(true);
    markSoundIntroSeen();
    dismiss();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="sound-intro-title"
      aria-describedby="sound-intro-desc"
      ref={cardRef}
      className="fixed z-[240] right-3 top-14 sm:right-4 sm:top-16 w-[min(320px,92vw)] rounded-md border border-primary/50 bg-card/95 text-card-foreground shadow-xl backdrop-blur-md pointer-events-auto"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3 px-4 pt-3 pr-8">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"
        >
          <Volume2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div
            id="sound-intro-title"
            className="stencil text-[10px] tracking-widest text-primary"
          >
            THE CITY HAS A SOUND
          </div>
          <div
            id="sound-intro-desc"
            className="mt-1 text-sm leading-snug text-foreground"
          >
            It&apos;s quiet.
          </div>
          <div className="mt-1 text-xs text-muted-foreground leading-snug">
            Stamps, arrivals, a ring in the distance. You can turn it off
            anytime from the mute button.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 pt-3">
        <button
          ref={firstFocusRef}
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            turnOn();
          }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-primary/60 bg-primary/15 px-3 py-1.5 stencil text-[10px] tracking-widest text-primary hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <Volume2 className="h-3.5 w-3.5" /> SOUND ON
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            keepSilent();
          }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-border px-3 py-1.5 stencil text-[10px] tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <VolumeX className="h-3.5 w-3.5" /> KEEP IT SILENT
        </button>
      </div>
    </div>
  );
}

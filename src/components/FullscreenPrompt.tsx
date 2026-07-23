import { useEffect, useState } from "react";
import { Maximize2, X, Monitor } from "lucide-react";
import { useFullscreen } from "@/hooks/useFullscreen";
import { arrivalTap } from "@/lib/mirror/audio";

const PROMPT_KEY = "milverse.fullscreen.promptSeen";

export function FullscreenPrompt() {
  const [open, setOpen] = useState(false);
  const { isFullscreen, isSupported, enterFullscreen } = useFullscreen();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSupported) return;
    if (isFullscreen) return;

    try {
      const seen = localStorage.getItem(PROMPT_KEY) === "1";
      if (!seen) {
        const timer = setTimeout(() => {
          setOpen(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, [isFullscreen, isSupported]);

  useEffect(() => {
    if (isFullscreen && open) {
      setOpen(false);
    }
  }, [isFullscreen, open]);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(PROMPT_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const handleEnterFullscreen = () => {
    arrivalTap();
    enterFullscreen();
    handleDismiss();
  };

  if (!open || isFullscreen || !isSupported) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="fullscreen-prompt-title"
      className="fixed z-[230] left-1/2 -translate-x-1/2 top-3 sm:top-4 w-[min(300px,90vw)] rounded-full border border-primary/40 bg-black/50 p-1.5 pl-3.5 pr-2 text-card-foreground shadow-[0_0_20px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 pointer-events-auto flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Monitor className="h-3.5 w-3.5 shrink-0 text-primary animate-pulse" />
        <span id="fullscreen-prompt-title" className="stencil text-[10px] tracking-widest text-foreground truncate">
          GO FULLSCREEN?
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleEnterFullscreen}
          className="tap inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/20 px-2.5 py-1 stencil text-[9px] tracking-widest text-primary hover:bg-primary/30 transition-all"
        >
          <Maximize2 className="h-3 w-3" />
          YES
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

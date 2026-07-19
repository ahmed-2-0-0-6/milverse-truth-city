import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Newspaper } from "lucide-react";
import {
  supplementWeek,
  readLastSeenWeek,
  markSupplementSeen,
} from "@/lib/paper/supplement";

/**
 * Left-side dismissible notification announcing the fresh weekly supplement.
 * "Delivered" ~1.2s after mount so it feels like it arrives once the desk
 * finishes loading. Once the current week has been seen or dismissed,
 * it stays quiet until the next Sunday rollover.
 */
export function PaperNudge() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const week = supplementWeek();

  useEffect(() => {
    if (readLastSeenWeek() === week.weekKey) {
      setDismissed(true);
      return;
    }
    const t = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(t);
  }, [week.weekKey]);

  if (dismissed || !ready) return null;

  const dismiss = () => {
    markSupplementSeen(week.weekKey);
    setDismissed(true);
  };

  return (
    <div
      className="w-full paper-nudge-in"
      role="region"
      aria-label="New supplement delivered"
    >
      <div className="relative rounded-xl border border-primary/40 bg-background/90 backdrop-blur-md elev-3 p-3 pr-10">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-1.5 right-1.5 h-8 w-8 tap inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Dismiss the paper"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <Link
          to="/paper/supplement"
          onClick={dismiss}
          className="flex items-center gap-3 tap"
          aria-label="Open this week's supplement"
        >
          <span
            className="grid place-items-center h-10 w-10 shrink-0 rounded-full border border-primary/50 text-primary"
            aria-hidden
          >
            <Newspaper className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block stencil text-[10px] tracking-widest text-primary/90">
              THE SUNDAY SUPPLEMENT · {week.sundayLabel}
            </span>
            <span className="block text-sm text-foreground truncate">
              Fresh off the press. Read this week's paper.
            </span>
          </span>
          <span
            className="stencil text-[10px] px-2 py-1 rounded-md border border-primary/50 text-primary"
            aria-hidden
          >
            READ
          </span>
        </Link>
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, Radio, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LiveBait } from "./LiveBait";
import { CitizenDesk } from "./CitizenDesk";
import { DailyBeacon } from "@/components/DailyBeacon";
import type { Shift } from "@/lib/city/shift";

type Kind = "bait" | "desk" | "beacon";

interface Props {
  kind: Kind;
  shift: Shift;
  onDismiss: () => void;
  /** Deprecated — the parent NudgeTower now controls stacking. */
  stack?: number;
}

/**
 * A single notification card. Positioned by the parent NudgeTower so that
 * every visible nudge stacks as a tower (all readable) instead of overlapping.
 */
export function LandingNudge({ kind, shift, onDismiss }: Props) {
  const [open, setOpen] = useState(false);

  const isBait = kind === "bait";
  const isBeacon = kind === "beacon";

  // ── Beacon variant: compact, links straight to /drop, no sheet ──
  if (isBeacon) {
    return (
      <div
        className="w-full"
        role="region"
        aria-label="Today's Forward"
      >
        <div className="relative rounded-xl border border-primary/40 bg-background/90 backdrop-blur-md elev-3 p-3 pr-10">
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-1.5 right-1.5 h-8 w-8 tap inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <Link to="/drop" className="block tap" aria-label="Open today's forward">
            <div className="stencil text-[10px] tracking-widest text-primary/90 mb-1">
              AAJ KA FORWARD
            </div>
            <DailyBeacon />
          </Link>
        </div>
      </div>
    );
  }

  const title = isBait ? "INCOMING · UNKNOWN NUMBER" : "THE DESK · YOUR CASELOAD";
  const body = isBait
    ? "A scammer just texted. Catch them out."
    : "Today's drop and the week's paper are waiting.";
  const cta = isBait ? "PICK UP" : "OPEN DESK";
  const Icon = isBait ? Phone : Radio;

  return (
    <>
      <div
        className="w-full"
        role="region"
        aria-label={title}
      >
        <div
          className={`relative rounded-xl border ${
            isBait ? "border-destructive/50" : "border-primary/40"
          } bg-background/90 backdrop-blur-md elev-3 p-3 pr-10`}
        >
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-1.5 right-1.5 h-8 w-8 tap inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full text-left flex items-center gap-3 tap"
            aria-label={cta}
          >
            <span
              className={`grid place-items-center h-10 w-10 shrink-0 rounded-full border ${
                isBait
                  ? "border-destructive/60 text-destructive hud-blink"
                  : "border-primary/50 text-primary"
              }`}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block stencil text-[10px] tracking-widest ${
                  isBait ? "text-destructive/90" : "text-primary/90"
                }`}
              >
                {title}
              </span>
              <span className="block text-sm text-foreground truncate">{body}</span>
            </span>
            <span
              className={`stencil text-[10px] px-2 py-1 rounded-md border ${
                isBait
                  ? "border-destructive/60 text-destructive"
                  : "border-primary/50 text-primary"
              }`}
              aria-hidden
            >
              {cta}
            </span>
          </button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto p-4 sm:p-6 rounded-t-2xl"
        >
          <SheetTitle className="stencil text-[10px] tracking-widest text-primary/80">
            {title}
          </SheetTitle>
          <SheetDescription className="sr-only">{body}</SheetDescription>
          <div className="mt-3">
            {isBait ? (
              <LiveBait
                onDismiss={() => {
                  setOpen(false);
                  onDismiss();
                }}
              />
            ) : (
              <CitizenDesk shift={shift} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}


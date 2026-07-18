// MILVERSE — CaseStampCard. A closed case file, pinned to the corkboard.
// Front: title + district/tier + date + rubber stamp.
// Back:  verdict-vs-truth + points + (for losses) the tactic lesson line.

import { useState, useCallback, useEffect, useRef } from "react";

export interface WallCard {
  key: string;
  district: "MIRROR" | "FEED" | "BOSS" | "DAILY";
  tierLabel: string; // "T1" / "T2" / "☠☠" / "DAILY"
  title: string;
  ts: number;
  stampText: string; // e.g. "CASE CLOSED"
  stampTone: "green" | "red" | "amber" | "gold" | "white";
  verdictLine: string; // "You said REAL · Truth REAL"
  points: number;
  tacticLine?: string; // "Tactic: IMPERSONATION" — only for losses
  outcomeKind: "win" | "miss" | "false" | "lucky" | "boss-win";
}

const stampToneClass: Record<WallCard["stampTone"], string> = {
  green: "border-primary text-primary",
  red: "border-destructive text-destructive",
  amber: "border-caution text-caution",
  gold: "border-caution text-caution",
  white: "border-white/50 text-white/60",
};

function shortHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h;
}

export function CaseStampCard({
  card,
  index,
  onOpenTape,
}: {
  card: WallCard;
  index: number;
  onOpenTape?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const h = shortHash(card.key + ":" + index);
  // -2.5 → +2.5 degrees, deterministic
  const rotDeg = ((h % 51) - 25) / 10;
  // pin dot horizontal offset 20%..80%
  const pinLeft = 20 + (h % 60);

  const toggle = useCallback(() => setFlipped((v) => !v), []);

  useEffect(() => {
    if (!flipped) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFlipped(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped]);

  const date = new Date(card.ts).toLocaleDateString();
  const aria = `${card.district} case: ${card.title}. Stamp: ${card.stampText}. ${card.verdictLine}. Points ${card.points}. Press to ${flipped ? "hide details" : "show details"}.`;

  return (
    <div
      ref={rootRef}
      className="wall-card-wrap mb-4 break-inside-avoid"
      style={{ transform: `rotate(${rotDeg}deg)` }}
    >
      {/* Pin */}
      <span
        aria-hidden
        className="block absolute -top-1 h-2.5 w-2.5 rounded-full bg-caution shadow-[0_1px_2px_rgba(0,0,0,0.6)] z-10"
        style={{ left: `${pinLeft}%` }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={flipped}
        aria-label={aria}
        className="card-flip relative block w-full text-left rounded-md border border-border/80 bg-card p-4 shadow-[0_6px_14px_-8px_rgba(0,0,0,0.7)] transition-shadow hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {!flipped ? (
          <div key="front" className="card-face">
            <div className="flex items-center justify-between">
              <div className="stencil text-[9px] tracking-widest text-muted-foreground">
                {card.district} · {card.tierLabel}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {date}
              </div>
            </div>
            <div className="mt-2 text-sm font-semibold leading-snug text-foreground line-clamp-2">
              {card.title}
            </div>

            <div className="mt-4 flex justify-end">
              <span
                className={`inline-block border-double border-4 px-3 py-1 stencil text-[10px] tracking-[0.25em] rotate-[-6deg] ${stampToneClass[card.stampTone]}`}
              >
                {card.stampText}
              </span>
            </div>
          </div>
        ) : (
          <div key="back" className="card-face">
            <div className="stencil text-[9px] tracking-widest text-muted-foreground">
              DEBRIEF
            </div>
            <div className="mt-2 space-y-1 font-mono text-xs text-foreground">
              <div>{card.verdictLine}</div>
              <div className="text-muted-foreground">
                {card.points >= 0 ? "+" : ""}
                {card.points} pts
              </div>
              {card.tacticLine && (
                <div className="pt-1 text-destructive/90">{card.tacticLine}</div>
              )}
            </div>
            <div className="mt-3 stencil text-[9px] text-muted-foreground">
              Press again to flip back · Esc
            </div>
          </div>
        )}
      </button>
      {onOpenTape && (
        <button
          type="button"
          onClick={onOpenTape}
          className="mt-1 block w-full rounded-md border border-caution/40 bg-caution/5 px-2 py-1 stencil text-[9px] tracking-widest text-caution hover:bg-caution/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caution"
        >
          TAPE ON FILE →
        </button>
      )}
    </div>
  );
}

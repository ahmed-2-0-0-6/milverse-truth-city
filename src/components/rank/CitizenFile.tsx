// MILVERSE — The Citizen File sheet.
// A private, read-only dossier the player has on themselves. Presentation only.

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { operatorCallsign, type TrustProfile } from "@/lib/mirror/profile";
import { rankFromXp } from "@/lib/ranks";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";
import { getActiveGroup } from "@/lib/pilot";
import { computeConviction } from "@/lib/mirror/conviction";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: TrustProfile | null;
  xp: number;
  manualUnlocks: number;
}

export function CitizenFile({ open, onOpenChange, profile, xp, manualUnlocks }: Props) {
  const rank = rankFromXp(xp);
  const pct = Math.round(rank.progress * 100);
  const isMax = !rank.next;
  const codename = profile ? operatorCallsign(profile) : null;
  const delta = rank.next ? Math.max(0, rank.next.minXp - xp) : 0;

  const [activeGroup, setActiveGroupState] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setActiveGroupState(getActiveGroup());
    const on = () => setActiveGroupState(getActiveGroup());
    window.addEventListener("milverse:pilot", on);
    return () => window.removeEventListener("milverse:pilot", on);
  }, [open]);

  const casesPlayed = profile?.casesPlayed ?? 0;
  const correct = profile?.correctVerdicts ?? 0;
  const missed = profile?.missedScams ?? 0;
  const falseAlarms = profile?.falseAlarms ?? 0;
  const streak = profile?.dailyStreak ?? 0;
  const timeStolen = lifetimeStolenSeconds(profile?.history);


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-background p-0"
      >
        <div className="border-b border-border px-5 py-4">
          <SheetTitle asChild>
            <div className="stencil text-xs text-primary">CITIZEN FILE</div>
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-1 stencil text-sm text-foreground">
              {codename && codename !== "———" ? codename : "UNREGISTERED CITIZEN"}
            </div>
          </SheetDescription>
        </div>

        {/* Rank block */}
        <section className="px-5 py-5 border-b border-border">
          <div className="stencil text-[10px] text-muted-foreground">CURRENT RANK</div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {rank.current.name}
            </div>
            <div className="font-mono text-sm text-muted-foreground">
              {xp} XP
            </div>
          </div>

          <div className="mt-4">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress from ${rank.current.name} to ${rank.next?.name ?? "max"}`}
            >
              <span
                className={`block h-full ${isMax ? "bg-caution" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between stencil text-[9px] text-muted-foreground">
              <span>{rank.current.name}</span>
              <span>{rank.next?.name ?? "MAX"}</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground italic">
            Verdicts pay. Calibration pays more. Designing cases pays most.
          </p>
        </section>

        {/* Ledger */}
        <section className="px-5 py-5 border-b border-border">
          <div className="stencil text-[10px] text-muted-foreground mb-3">THE LEDGER</div>
          <dl className="space-y-1.5 font-mono text-xs">
            <Row label="Cases played" value={casesPlayed} />
            <Row label="Correct verdicts" value={correct} />
            <Row label="Missed scams" value={missed} />
            <Row label="False alarms" value={falseAlarms} />
            <Row label="Daily streak" value={streak} />
            <Row
              label="Manual entries"
              value={`${manualUnlocks} / ${MANUAL_ENTRIES.length}`}
            />
          </dl>
          <p className="mt-3 text-[11px] text-muted-foreground italic">
            Both columns lose. Gullibility and paranoia are the same bill.
          </p>

          {/* CONVICTION — parallel measurement (does not affect points/XP). */}
          {(() => {
            const rep = computeConviction(profile?.history ?? []);
            return (
              <div className="mt-4 border-t border-border/60 pt-3">
                <div className="stencil text-[10px] text-muted-foreground mb-2">CONVICTION</div>
                {rep.status === "insufficient" ? (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {rep.labelLine}
                  </p>
                ) : (
                  <>
                    <div className="flex items-baseline gap-4 font-mono text-xs">
                      <div>
                        <span className="text-muted-foreground">mean</span>{" "}
                        <span className="tabular-nums text-foreground">{rep.meanConfidence}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">record</span>{" "}
                        <span className="tabular-nums text-foreground">{rep.accuracyPct}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">gap</span>{" "}
                        <span className="tabular-nums text-foreground">
                          {rep.gap >= 0 ? "+" : ""}
                          {rep.gap}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-foreground/90">
                      {rep.labelLine}
                    </p>
                  </>
                )}
              </div>
            );
          })()}
          <Link
            to="/wall"
            onClick={() => onOpenChange(false)}
            className="mt-3 flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 stencil text-[10px] tracking-widest text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>THE CASE WALL</span>
            <span aria-hidden>→</span>
          </Link>
          <Link
            to="/paper/supplement"
            onClick={() => onOpenChange(false)}
            className="mt-2 flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 stencil text-[10px] tracking-widest text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>SUNDAY SUPPLEMENT</span>
            <span aria-hidden>→</span>
          </Link>
          {activeGroup && (
            <Link
              to="/board"
              onClick={() => onOpenChange(false)}
              className="mt-2 flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 stencil text-[10px] tracking-widest text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>THE CITY BOARD</span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </section>

        {/* Next */}
        <section className="px-5 py-5">
          {rank.next ? (
            <div className="flex items-baseline justify-between">
              <div className="stencil text-[10px] text-muted-foreground">
                NEXT: {rank.next.name}
              </div>
              <div className="font-mono text-xs text-foreground">{delta} XP short</div>
            </div>
          ) : (
            <div className="stencil text-xs text-caution">
              THE CITY KNOWS YOUR NAME.
            </div>
          )}
        </section>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

// MILVERSE — THE SHIFT · in-case banner + debrief row.
// Mounted at the top of the mirror and feed case routes. When a shift is
// active AND this case is the current slot, renders:
//   1) a one-line banner strip above the case chrome
//   2) on debrief phase, a single row above the debrief with the shift
//      delta and a NEXT FILE / CLOCK OUT button
// Zero engine diffs: outcomes are read out of profile.history after the
// case writes to it normally (shifts are real play, per spec).

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart } from "lucide-react";
import {
  getActiveShift,
  isSlotFor,
  markSlotEntered,
  readSlotEnteredAt,
  recordSlot,
  type ActiveShift,
  type SlotResult,
} from "@/lib/shift/state";
import { historyKey, shiftDateKey, type SlotRef } from "@/lib/shift/docket";
import { loadProfile, type HistoryEntry } from "@/lib/mirror/profile";

type Phase = "brief" | "sim" | "verdict" | "reveal" | "debrief" | string;

interface ShiftBannerProps {
  kind: "mirror" | "feed";
  caseId: string; // raw scenario id
  phase: Phase;
}

function refFromProps(kind: "mirror" | "feed", caseId: string, tier: number): SlotRef {
  return { kind, id: caseId, tier };
}

function historyKeyFor(kind: "mirror" | "feed", caseId: string): string {
  return historyKey({ kind, id: caseId, tier: 1 });
}

/** Latest history row for this case. Reads once per call. */
function latestHistoryFor(caseHistoryKey: string): HistoryEntry | null {
  const p = loadProfile();
  for (let i = p.history.length - 1; i >= 0; i--) {
    if (p.history[i].caseId === caseHistoryKey) return p.history[i];
  }
  return null;
}

/**
 * Watches profile writes; when a matching history entry appears AFTER the
 * shift slot was entered, records the slot outcome exactly once.
 */
function useShiftRecorder(
  active: ActiveShift | null,
  match: boolean,
  kind: "mirror" | "feed",
  caseId: string,
  tier: number,
): SlotResult | null {
  const recordedRef = useRef(false);
  const [result, setResult] = useState<SlotResult | null>(null);

  useEffect(() => {
    if (!active || !match) return;
    // Reset when the slot changes (new case, or re-entry).
    recordedRef.current = false;
    setResult(null);
  }, [active?.dateKey, active?.slot, match]);

  useEffect(() => {
    if (!active || !match) return;
    const key = historyKeyFor(kind, caseId);
    const enteredAt = readSlotEnteredAt(active.dateKey, active.slot, active.startedAt);

    const tryRecord = () => {
      if (recordedRef.current) return;
      const entry = latestHistoryFor(key);
      if (!entry || entry.ts < enteredAt) return;
      const outcome = recordSlot(refFromProps(kind, caseId, tier), entry.result, enteredAt, new Date());
      if (outcome) {
        recordedRef.current = true;
        setResult(outcome.recorded);
      }
    };

    tryRecord();
    const onProfile = () => tryRecord();
    window.addEventListener("milverse:profile", onProfile);
    window.addEventListener("storage", onProfile);
    return () => {
      window.removeEventListener("milverse:profile", onProfile);
      window.removeEventListener("storage", onProfile);
    };
  }, [active?.dateKey, active?.slot, match, kind, caseId, tier]);

  return result;
}

export function ShiftBanner({ kind, caseId, phase }: ShiftBannerProps) {
  const [active, setActive] = useState<ActiveShift | null>(() => getActiveShift());

  // Keep local shift state fresh on ledger changes.
  useEffect(() => {
    const push = () => setActive(getActiveShift());
    push();
    window.addEventListener("milverse:shift", push);
    window.addEventListener("storage", push);
    return () => {
      window.removeEventListener("milverse:shift", push);
      window.removeEventListener("storage", push);
    };
  }, []);

  const caseHistoryKey = useMemo(() => historyKeyFor(kind, caseId), [kind, caseId]);
  const isCurrent = !!active && isSlotFor(caseHistoryKey);
  const currentRef = isCurrent && active ? active.caseRefs[active.slot] : null;
  const tier = currentRef?.tier ?? 1;

  // Stamp slot-entered time on first visible phase so the speed pinch has a
  // consistent origin per (dateKey, slot).
  useEffect(() => {
    if (!active || !isCurrent) return;
    markSlotEntered(active.dateKey, active.slot);
  }, [active?.dateKey, active?.slot, isCurrent]);

  const result = useShiftRecorder(active, isCurrent, kind, caseId, tier);

  if (!active || !isCurrent) return null;

  // Post-record snapshot: the recorded slot advanced `active.slot`, so read
  // the record from the returned SlotResult to render the debrief row.
  const bust = result ? result.livesAfter <= 0 : false;
  const slotJustPlayed = result ? result.slot : active.slot;
  const isLastSlot = slotJustPlayed >= active.caseRefs.length - 1;
  const shiftEnded = !!result && (bust || isLastSlot);

  // ── BANNER STRIP (all phases; reads shift state, not case state).
  const bannerLives = result ? result.livesAfter : active.lives;
  const bannerCombo = result ? result.comboAfter : active.combo;
  const bannerScore = active.score; // already updated by recordSlot
  const bannerSlot = result ? result.slot + 1 : active.slot + 1;

  return (
    <>
      <div
        className="mx-auto max-w-3xl px-4 pt-3"
        aria-hidden
      >
        <div className="flex items-center justify-between gap-3 rounded border border-primary/40 bg-primary/5 px-3 py-1.5 stencil text-[10px] text-primary tabular-nums whitespace-nowrap overflow-x-auto">
          <span>SHIFT {Math.min(bannerSlot, active.caseRefs.length)}/{active.caseRefs.length}</span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3 w-3" /> {bannerLives}
          </span>
          <span>COMBO ×{bannerCombo}</span>
          <span>{bannerScore}</span>
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          Shift: slot {Math.min(bannerSlot, active.caseRefs.length)} of {active.caseRefs.length},
          {" "}{bannerLives} lives, combo times {bannerCombo}.
        </span>
      </div>

      {phase === "debrief" && result && (
        <div className="mx-auto max-w-3xl px-4 pt-3">
          <div
            className={`rounded border px-3 py-2 flex items-center justify-between gap-3 stencil text-xs ${
              result.outcome.kind === "loss"
                ? "border-destructive/60 bg-destructive/5 text-destructive"
                : "border-primary/50 bg-primary/5 text-primary"
            }`}
          >
            <span className="tabular-nums">
              {result.outcome.kind === "loss"
                ? "−1 LIFE · COMBO RESET"
                : result.outcome.kind === "lucky"
                  ? `+${result.pointsDelta} SHIFT · LUCKY GUESS · COMBO RESET`
                  : `+${result.pointsDelta} SHIFT · COMBO ×${result.outcome.combo}${
                      result.outcome.speedBonus ? " · SPEED +25" : ""
                    }`}
            </span>
            {shiftEnded ? (
              <Link
                to="/shift"
                className="inline-flex items-center gap-1 rounded border border-current px-3 py-1.5 min-h-[36px] tracking-widest hover:bg-current/10"
              >
                CLOCK OUT <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                to="/shift"
                className="inline-flex items-center gap-1 rounded border border-current px-3 py-1.5 min-h-[36px] tracking-widest hover:bg-current/10"
              >
                NEXT FILE <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

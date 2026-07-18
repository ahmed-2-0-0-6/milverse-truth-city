// MILVERSE — The Citizen File chip.
// Persistent identity chip for the TopBar. Presentation only: reads existing
// profile + manual state, uses the locked ranks.ts helpers.

import { useEffect, useMemo, useRef, useState } from "react";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp } from "@/lib/ranks";
import { CitizenFile } from "./CitizenFile";
import { useVisualMode } from "@/lib/visual-quality";

export function RankChip() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [manualUnlocks, setManualUnlocks] = useState(0);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(false);
  const lastXpRef = useRef<number | null>(null);
  const { mode } = useVisualMode();

  useEffect(() => {
    setProfile(loadProfile());
    setManualUnlocks(loadUnlocked().size);
    const on = () => {
      setProfile(loadProfile());
      setManualUnlocks(loadUnlocked().size);
    };
    window.addEventListener("storage", on);
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  const xp = useMemo(
    () => computeXp(profile, manualUnlocks, profile?.publishedCount ?? 0),
    [profile, manualUnlocks],
  );
  const rank = useMemo(() => rankFromXp(xp), [xp]);

  // Pulse the chip when XP moves upward (only in cinematic + no reduced-motion).
  useEffect(() => {
    if (lastXpRef.current === null) {
      lastXpRef.current = xp;
      return;
    }
    if (xp <= lastXpRef.current) {
      lastXpRef.current = xp;
      return;
    }
    lastXpRef.current = xp;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (mode !== "cinematic" || reduce) return;
    setTick(true);
    const t = window.setTimeout(() => setTick(false), 420);
    return () => window.clearTimeout(t);
  }, [xp, mode]);

  const pct = Math.round(rank.progress * 100);
  const isMax = !rank.next;
  const glyph = rank.current.name.charAt(0);
  const ariaLabel = rank.next
    ? `Rank: ${rank.current.name}. ${pct} percent to ${rank.next.name}.`
    : `Rank: ${rank.current.name}. City designer.`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`group inline-flex items-center gap-2 rounded border px-2 py-1.5 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
          isMax ? "border-caution/60" : "border-border"
        } ${tick ? "rank-tick" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`grid h-6 w-6 place-items-center stencil text-[10px] leading-none ${
            isMax ? "bg-caution/20 text-caution" : "bg-primary/15 text-primary"
          }`}
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        >
          {glyph}
        </span>
        <span className="hidden md:flex flex-col leading-tight">
          <span className="stencil text-[10px] text-foreground/90">
            {rank.current.name}
          </span>
          <span
            className="mt-1 block h-[2px] w-[28px] overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to ${rank.next?.name ?? "max rank"}`}
          >
            <span
              className={`block h-full ${isMax ? "bg-caution" : "bg-primary"} rank-underline`}
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
      </button>
      <CitizenFile
        open={open}
        onOpenChange={setOpen}
        profile={profile}
        xp={xp}
        manualUnlocks={manualUnlocks}
      />
    </>
  );
}

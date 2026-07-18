// MILVERSE — THE SHIFT · route.
// Three surfaces on one route:
//   1) CLOCK-IN         (no active, no finished shift today)
//   2) RESUME           (active shift in flight)
//   3) PUNCH-OUT        (a shift finished today)

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { ArrowRight, Heart, MessageSquare, Newspaper } from "lucide-react";
import {
  clockIn,
  getActiveShift,
  lastFinishedShift,
  playedToday,
  reapExpired,
  bestForSeed,
  type ActiveShift,
  type SlotResult,
  type FinishedShift,
} from "@/lib/shift/state";
import { buildDocket, historyKey, shiftDateKey, slotTitle, type SlotRef } from "@/lib/shift/docket";
import { loadProfile } from "@/lib/mirror/profile";
import { readDailyStatus } from "@/lib/daily/profile";


export const Route = createFileRoute("/shift")({
  head: () => ({
    meta: [
      { title: "The Shift — MILVERSE" },
      {
        name: "description",
        content:
          "Five files. Three lives. Missed scams and false alarms cost the same. The score only pays for calibration.",
      },
      { property: "og:title", content: "The Shift — MILVERSE" },
      {
        property: "og:description",
        content: "Clock in. Work the docket. Chase a shift score.",
      },
    ],
  }),
  component: ShiftPage,
});

function ShiftPage() {
  const [active, setActive] = useState<ActiveShift | null>(null);
  const [finished, setFinished] = useState<FinishedShift | null>(null);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const wasReaped = reapExpired();
    setExpiredNotice(wasReaped);
    const push = () => {
      setActive(getActiveShift());
      // Show punch-out only if a shift finished today.
      const last = lastFinishedShift();
      if (last && playedToday()) setFinished(last);
      else setFinished(null);
    };
    push();
    window.addEventListener("milverse:shift", push);
    return () => window.removeEventListener("milverse:shift", push);
  }, []);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {expiredNotice && !active && !finished && (
          <p className="mb-4 stencil text-[10px] text-muted-foreground">
            Yesterday's shift expired on the desk. Today's docket is fresh.
          </p>
        )}
        {finished ? (
          <PunchOut shift={finished} />
        ) : active ? (
          <Resume shift={active} onGo={(to, params) => navigate({ to, params: params as never })} />
        ) : (
          <ClockIn />
        )}
      </main>
    </div>
  );
}

/* ─────────────── CLOCK IN ─────────────── */

function ClockIn() {
  const [profile, setProfile] = useState(() => (typeof window !== "undefined" ? loadProfile() : null));
  useEffect(() => {
    setProfile(loadProfile());
  }, []);
  // Face-down docket preview — pure buildDocket, no state writes.
  const preview = useMemo(() => {
    if (!profile) return null;
    const d = buildDocket(shiftDateKey(), profile);
    return { seed: d.seed, refs: d.caseRefs };
  }, [profile]);

  const handleClockIn = () => {
    if (!profile) return;
    const a = clockIn(new Date(), profile);
    if (!a) return;
    // Navigate straight into slot 0.
    const first = a.caseRefs[0];
    const to = first.kind === "mirror" ? "/mirror/$caseId" : "/feed/$caseId";
    window.location.assign(
      to.replace("$caseId", first.id),
    );
  };

  return (
    <section aria-labelledby="clockin-title">
      <div className="stencil text-[10px] text-primary/80 mb-2">// THE SHIFT</div>
      <h1
        id="clockin-title"
        className="text-4xl sm:text-5xl font-black text-foreground leading-none tracking-tight"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        THE SHIFT.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Five files. Three lives. Falling for a scam costs a life. Calling wolf on a real one costs a life. The combo pays
        for clean, consecutive work. Clock in.
      </p>

      <div className="mt-6 grid grid-cols-5 gap-2" aria-label="Today's docket, face down">
        {(preview?.refs ?? Array.from({ length: 5 })).map((ref, i) => (
          <SlotFaceDown key={i} ref={ref as SlotRef | undefined} index={i} />
        ))}
      </div>
      {preview && (
        <div className="mt-2 stencil text-[10px] text-muted-foreground">
          DOCKET {preview.seed}
        </div>
      )}

      <button
        onClick={handleClockIn}
        disabled={!profile}
        className="mt-6 cta-glow inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 min-h-[56px] stencil text-sm tracking-widest text-primary-foreground disabled:opacity-50"
      >
        CLOCK IN <ArrowRight className="h-4 w-4" />
      </button>
      <p className="mt-4 stencil text-[10px] text-muted-foreground max-w-md">
        One shift per day per device. Leave mid-shift and you can resume; leave overnight and the docket dies with the day.
      </p>
    </section>
  );
}

function SlotFaceDown({ ref, index }: { ref?: SlotRef; index: number }) {
  const Icon = ref?.kind === "feed" ? Newspaper : MessageSquare;
  return (
    <div
      className="flex flex-col items-center justify-center rounded border border-border bg-card/70 py-5 text-muted-foreground"
      aria-label={
        ref
          ? `Slot ${index + 1}, ${ref.kind === "feed" ? "feed" : "mirror"} file, face down`
          : `Slot ${index + 1}, face down`
      }
    >
      <Icon className="h-5 w-5 opacity-70" />
      <div className="mt-2 stencil text-[9px] tracking-widest">{index + 1}</div>
    </div>
  );
}

/* ─────────────── RESUME ─────────────── */

function Resume({
  shift,
  onGo,
}: {
  shift: ActiveShift;
  onGo: (to: string, params?: Record<string, string>) => void;
}) {
  const next = shift.caseRefs[shift.slot];
  const done = shift.slot >= shift.caseRefs.length;
  const to = next ? (next.kind === "mirror" ? "/mirror/$caseId" : "/feed/$caseId") : "/";
  return (
    <section aria-labelledby="resume-title">
      <div className="stencil text-[10px] text-primary/80 mb-2">// SHIFT IN PROGRESS</div>
      <h1
        id="resume-title"
        className="text-4xl sm:text-5xl font-black text-foreground leading-none tracking-tight"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        SHIFT {Math.min(shift.slot + 1, shift.caseRefs.length)}/{shift.caseRefs.length}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 stencil text-[11px] text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-destructive" /> {shift.lives} LIVES
        </span>
        <span>COMBO ×{shift.combo}</span>
        <span>SCORE {shift.score}</span>
        <span>DOCKET {shift.seed}</span>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2">
        {shift.caseRefs.map((r, i) => (
          <SlotChip key={i} ref={r} index={i} played={shift.results.find((x) => x.slot === i) ?? null} isNext={i === shift.slot} />
        ))}
      </div>

      {!done && next && (
        <button
          onClick={() => onGo(to, { caseId: next.id })}
          className="mt-6 cta-glow inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 min-h-[56px] stencil text-sm tracking-widest text-primary-foreground"
        >
          GO TO NEXT FILE <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}

function SlotChip({
  ref,
  index,
  played,
  isNext,
}: {
  ref: SlotRef;
  index: number;
  played: import("@/lib/shift/state").SlotResult | null;
  isNext?: boolean;
}) {
  const Icon = ref.kind === "feed" ? Newspaper : MessageSquare;
  let glyph = "—";
  let toneClass = "border-border text-muted-foreground";
  let a11y = `Slot ${index + 1}, ${ref.kind}, unplayed`;
  if (played) {
    if (played.outcome.kind === "loss") {
      glyph = "✕";
      toneClass = "border-destructive/60 text-destructive bg-destructive/5";
      a11y = `Slot ${index + 1}, ${played.result.replace("_", " ")}`;
    } else {
      glyph = "✓";
      toneClass = "border-primary/60 text-primary bg-primary/5";
      a11y = `Slot ${index + 1}, ${played.outcome.kind === "lucky" ? "lucky guess" : "clean"}`;
    }
  } else if (isNext) {
    toneClass = "border-primary/50 text-primary";
  }
  return (
    <div
      className={`flex flex-col items-center justify-center rounded border py-3 ${toneClass}`}
      aria-label={a11y}
    >
      <Icon className="h-4 w-4 opacity-70" />
      <div className="mt-1 stencil text-[9px]">{index + 1}</div>
      <div className="mt-1 text-xs tabular-nums" aria-hidden>
        {glyph}
      </div>
    </div>
  );
}

/* ─────────────── PUNCH OUT ─────────────── */

function PunchOut({ shift }: { shift: FinishedShift }) {
  const [display, setDisplay] = useState(0);
  const best = bestForSeed(shift.seed);
  const isNewBest = shift.score >= best && shift.score > 0;
  const dailyUnplayed = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return !readDailyStatus().playedToday;
    } catch {
      return false;
    }
  }, []);

  // shift-tally animation — killed under reduced-motion / LITE by CSS.
  useEffect(() => {
    const target = shift.score;
    if (target <= 0) {
      setDisplay(0);
      return;
    }
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const lite =
      typeof document !== "undefined" && document.documentElement.dataset.highLegibility === "on";
    if (reduce || lite) {
      setDisplay(target);
      return;
    }
    const duration = 900;
    const started = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - started) / duration);
      setDisplay(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [shift.score]);

  return (
    <section aria-labelledby="punchout-title">
      <div className="stencil text-[10px] text-primary/80 mb-2">// SHIFT WORKED</div>
      <h1
        id="punchout-title"
        className="text-6xl sm:text-8xl font-black text-foreground leading-none tracking-tight shift-tally tabular-nums"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        {display}
      </h1>
      <div className="mt-2 stencil text-[10px] text-muted-foreground">SHIFT SCORE</div>

      <div className="mt-5 grid grid-cols-5 gap-2">
        {shift.results.map((r, i) => (
          <SlotChip key={i} ref={r.ref} index={i} played={r} />
        ))}
        {Array.from({ length: 5 - shift.results.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex flex-col items-center justify-center rounded border border-dashed border-border py-3 text-muted-foreground"
            aria-label={`Slot ${shift.results.length + i + 1}, unplayed`}
          >
            <div className="stencil text-[9px]">{shift.results.length + i + 1}</div>
            <div className="mt-1 text-xs" aria-hidden>—</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 stencil text-[11px] text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-destructive" /> {shift.livesLeft} LIVES LEFT
        </span>
        <span>BEST COMBO ×{shift.bestCombo}</span>
        <span>DOCKET {shift.seed} · TIERS 1-{shift.maxTier}</span>
      </div>

      <p className="mt-6 max-w-xl text-sm text-foreground">
        Missed scams and false alarms cost the same in this city. The score only pays for calibration.
      </p>

      <div className="mt-4 stencil text-[11px] text-muted-foreground">
        {isNewBest ? "NEW BEST." : `BEST: ${best}`}
      </div>

      <div className="mt-2 stencil text-[10px] text-muted-foreground max-w-xl">
        Your crew ran the same docket today. Compare on the board.
        <span className="ml-2">
          <Link to="/board" className="text-primary hover:underline">
            → THE BOARD
          </Link>
        </span>
      </div>

      {dailyUnplayed && (
        <p className="mt-3 stencil text-[10px] text-muted-foreground">
          The daily drop is still open. The streak is a different ledger.
        </p>
      )}

      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded border border-primary/60 bg-primary/10 px-4 py-2 stencil text-[11px] tracking-widest text-primary hover:bg-primary/20"
        >
          BACK TO THE CITY <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-4 stencil text-[10px] text-muted-foreground">
        The next docket prints at midnight.
      </p>
    </section>
  );
}

// Uses `slotTitle` only for a11y hover title on the resume card if we grow it.
void slotTitle;
void historyKey;

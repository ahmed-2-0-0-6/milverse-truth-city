// MILVERSE — "THE DOUBLE" route.
//
// A scripted, perspective-flipped drill. Zero AI, zero cloud, zero engine
// touches, zero free-text inputs, and the only localStorage write is to
// `milverse.double.v1` via `saveDoubleRun`.
//
// All content strings live in `src/lib/double/script.ts`. This file is
// composition only.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Phone, PhoneIncoming } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { CHAT_SKINS } from "@/lib/chat/skins";
import { loadProfile } from "@/lib/mirror/profile";
import {
  TURNS,
  ENDINGS,
  DEBRIEF_LESSON,
  NERVE_START,
  rotationForTurn,
  resolveEnding,
  saveDoubleRun,
  type Chip,
  type DoubleEnding,
  type DoubleTurn,
} from "@/lib/double/script";

export const Route = createFileRoute("/double")({
  head: () => ({
    meta: [
      { title: "The Double — MILVERSE" },
      {
        name: "description",
        content: "Someone's running your name on your khala. You're the backup.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DoubleRoute,
});

/* ─────────────────────────── phase machine ─────────────────────────── */

type Phase = "cold-open" | "sim" | "call" | "debrief";

interface Pick {
  turnIdx: number;
  chip: Chip;
}

function DoubleRoute() {
  const [phase, setPhase] = useState<Phase>("cold-open");
  const [turnIdx, setTurnIdx] = useState(0);
  const [nerve, setNerve] = useState(NERVE_START);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [relayLog, setRelayLog] = useState<
    Array<
      | { kind: "khala"; text: string; screenshot?: { from: string; text: string } }
      | { kind: "me"; text: string; grade: Chip["grade"] }
    >
  >([]);
  const [ending, setEnding] = useState<DoubleEnding | null>(null);
  const [nerveDelta, setNerveDelta] = useState<number | null>(null);
  const skin = CHAT_SKINS.whatsapp;

  // Seed the log with T1's opening relay on entry to the sim.
  useEffect(() => {
    if (phase === "sim" && relayLog.length === 0) {
      const t = TURNS[0];
      setRelayLog([{ kind: "khala", text: t.relay, screenshot: t.screenshot }]);
    }
  }, [phase, relayLog.length]);

  const score = useMemo(() => picks.filter((p) => p.chip.grade === "strong").length, [picks]);

  function pickChip(chip: Chip) {
    const nextPicks = [...picks, { turnIdx, chip }];
    const nextNerve = Math.max(0, Math.min(100, nerve + chip.nerve));
    setPicks(nextPicks);
    setNerve(nextNerve);
    setNerveDelta(chip.nerve);
    window.setTimeout(() => setNerveDelta(null), 900);

    // Push the player's coaching + Khala's reaction into the log.
    setRelayLog((log) => [
      ...log,
      { kind: "me", text: chip.text, grade: chip.grade },
      { kind: "khala", text: chip.reaction },
    ]);

    // Advance or resolve.
    if (turnIdx + 1 < TURNS.length) {
      const nextIdx = turnIdx + 1;
      // Push the next turn's relay in a moment so the previous exchange lands.
      window.setTimeout(() => {
        const nt = TURNS[nextIdx];
        setRelayLog((log) => [
          ...log,
          { kind: "khala", text: nt.relay, screenshot: nt.screenshot },
        ]);
        setTurnIdx(nextIdx);
      }, 400);
    } else {
      // Last turn resolved — branch. If the T5 strong pick was chosen, we
      // route through the CALL beat. Otherwise skip directly to debrief.
      const wentToCall = chip.grade === "strong";
      const nextScore = nextPicks.filter((p) => p.chip.grade === "strong").length;
      const resolved = resolveEnding(nextScore, nextNerve);
      window.setTimeout(() => {
        setEnding(resolved);
        setPhase(wentToCall ? "call" : "debrief");
      }, 500);
    }
  }

  function finishCall() {
    if (ending) {
      saveDoubleRun({ completed: true, ending, ts: Date.now() });
    }
    setPhase("debrief");
  }

  // Fire the drill log once, when the debrief mounts and no call was made.
  useEffect(() => {
    if (phase === "debrief" && ending) {
      saveDoubleRun({ completed: true, ending, ts: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopBar />

      {phase === "cold-open" && <ColdOpen onStart={() => setPhase("sim")} />}

      {phase === "sim" && (
        <Simulation
          skin={skin}
          nerve={nerve}
          nerveDelta={nerveDelta}
          turn={TURNS[turnIdx]}
          turnIdx={turnIdx}
          log={relayLog}
          onPick={pickChip}
          disabled={false}
        />
      )}

      {phase === "call" && ending && (
        <CallBeat ending={ending} onEnd={finishCall} />
      )}

      {phase === "debrief" && ending && (
        <Debrief ending={ending} picks={picks} nerve={nerve} score={score} />
      )}
    </div>
  );
}

/* ─────────────────────────── cold open ─────────────────────────── */

function ColdOpen({ onStart }: { onStart: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/mirror"
        className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> BACK TO THE CITY
      </Link>

      <div className="mt-6 rounded-lg border border-amber-500/50 bg-amber-500/5 p-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-amber-400">
          SPECIAL FILE · THE DOUBLE
        </div>
        <h1
          data-phase-anchor="double"
          tabIndex={-1}
          className="mt-3 text-2xl font-semibold outline-none"
        >
          You're not the target this time. You're the backup.
        </h1>
        <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
          Someone is running your name on your khala. She's texting you
          screenshots of the conversation, hands shaking, thumb hovering over
          the bank app. You cannot text him. You cannot see him. You can only
          coach her — one chip at a time — through checking that the person on
          the other end is you.
        </p>
        <p className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          DRILL — NOTHING HERE TOUCHES YOUR RECORD. NO POINTS. NO STREAK.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-md bg-amber-500 py-3 font-mono text-sm tracking-widest text-black hover:bg-amber-400"
        >
          TAKE THE CALL →
        </button>
      </div>
    </main>
  );
}

/* ─────────────────────────── simulation ─────────────────────────── */

function Simulation({
  skin,
  nerve,
  nerveDelta,
  turn,
  turnIdx,
  log,
  onPick,
  disabled,
}: {
  skin: typeof CHAT_SKINS.whatsapp;
  nerve: number;
  nerveDelta: number | null;
  turn: DoubleTurn;
  turnIdx: number;
  log: Array<
    | { kind: "khala"; text: string; screenshot?: { from: string; text: string } }
    | { kind: "me"; text: string; grade: Chip["grade"] }
  >;
  onPick: (c: Chip) => void;
  disabled: boolean;
}) {
  const nerveColor =
    nerve <= 30 ? "bg-destructive" : nerve <= 55 ? "bg-caution" : "bg-primary";
  const rotation = rotationForTurn(turnIdx);

  // Scroll to bottom on new entries.
  useEffect(() => {
    const el = document.getElementById("double-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] max-w-md flex-col">
      {/* Header — WhatsApp-flavored, Khala's thread. */}
      <div className={`flex items-center gap-3 border-b border-white/10 px-3 py-3 ${skin.headerClass}`}>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
          KS
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">Khala Saima</div>
          <div className="truncate text-[11px] text-white/60">online</div>
        </div>
        <Link
          to="/mirror"
          className="font-mono text-[10px] tracking-widest text-white/60 hover:text-white"
        >
          EXIT
        </Link>
      </div>

      {/* Nerve meter row. Truth-neutral: it's HER, not the double. */}
      <div className="border-b border-white/10 bg-neutral-950/80 px-3 py-2">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/60">
          <span className={nerve <= 30 ? "text-destructive" : ""}>
            KHALA'S NERVE
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            {nerveDelta !== null && (
              <span
                key={nerveDelta}
                className={`msg-in font-bold ${nerveDelta < 0 ? "text-destructive" : "text-primary"}`}
                aria-hidden="true"
              >
                {nerveDelta > 0 ? `+${nerveDelta}` : nerveDelta}
              </span>
            )}
            <span>{Math.round(nerve)}</span>
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full transition-all duration-500 ${nerveColor}`}
            style={{ width: `${nerve}%` }}
          />
        </div>
      </div>

      {/* Thread. */}
      <div
        id="double-scroll"
        className={`flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5 ${skin.bodyClass}`}
        style={skin.bodyStyle}
      >
        <div className="flex justify-center">
          <div className="max-w-[85%] rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-center text-[10px] leading-relaxed text-amber-200/80">
            🔒 {skin.systemNote}
          </div>
        </div>

        <div role="log" aria-live="polite" aria-relevant="additions text" className="contents">
          {log.map((entry, i) =>
            entry.kind === "khala" ? (
              <div key={i} className="flex flex-col items-start gap-1 msg-in">
                <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${skin.inBubble}`}>
                  {entry.text}
                </div>
                {entry.screenshot && <ScreenshotCard from={entry.screenshot.from} text={entry.screenshot.text} />}
              </div>
            ) : (
              <div key={i} className="flex justify-end msg-in">
                <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${skin.outBubble}`}>
                  {entry.text}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Chip cluster — the composer, minus any text input. */}
      <div className="border-t border-white/10 bg-neutral-950 p-3">
        <div className="mb-2 font-mono text-[10px] tracking-widest text-white/50">
          COACH KHALA · TURN {turnIdx + 1}/{TURNS.length}
        </div>
        <div
          role="radiogroup"
          aria-label={`Coaching options, turn ${turnIdx + 1}`}
          className="flex flex-col gap-2"
        >
          {rotation.map((originalIdx, i) => {
            const chip = turn.chips[originalIdx];
            return (
              <button
                key={`${turnIdx}-${i}`}
                type="button"
                role="radio"
                aria-checked="false"
                disabled={disabled}
                onClick={() => onPick(chip)}
                className="touch-manipulation min-h-[44px] rounded-md border border-white/15 bg-neutral-900 px-3 py-2.5 text-left text-sm text-white transition hover:border-primary/60 hover:bg-neutral-800 disabled:opacity-40"
              >
                {chip.text}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────── screenshot card ─────────────────────────── */

function ScreenshotCard({ from, text }: { from: string; text: string }) {
  // The "forwarded screenshot" chrome — borrows the ArtifactScene idiom
  // (bordered, slight rotate, muted). NEVER introduces a new keyframe.
  return (
    <div
      className="max-w-[85%] -rotate-1 rounded-md border border-white/15 bg-neutral-900/90 p-2 shadow-md"
      role="figure"
      aria-label={`Forwarded screenshot from ${from}`}
    >
      <div className="mb-1 font-mono text-[9px] tracking-widest text-white/40">
        FORWARDED · SCREENSHOT
      </div>
      <div className="rounded bg-[#0b141a] p-2">
        <div className="mb-1 text-[10px] font-semibold text-emerald-300">{from}</div>
        <div className="text-[13px] leading-snug text-white/90">{text}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────── call beat ─────────────────────────── */

function CallBeat({ ending, onEnd }: { ending: DoubleEnding; onEnd: () => void }) {
  const [state, setState] = useState<"ringing" | "connected">("ringing");
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (state !== "ringing") return;
    const t = window.setTimeout(() => setState("connected"), reduced ? 200 : 1800);
    return () => window.clearTimeout(t);
  }, [state, reduced]);

  // Line shown after "connect", per ending.
  const line =
    ending === "HELD"
      ? "It's you. Allah, it's really you. I almost sent it, beta."
      : ending === "SENT"
        ? "Beta… I sent it. He said 5 minutes and the shop closed. His number's off."
        : "Beta I'm scared. I don't want to answer any calls right now.";

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-md flex-col items-center justify-between bg-gradient-to-b from-neutral-900 via-black to-neutral-950 px-6 pt-16 pb-10 text-white">
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
          {state === "ringing" ? "Incoming call" : "In call"}
        </div>
        <div className="mt-6 text-3xl font-semibold">Beta (Saved 2019)</div>
        <div className="mt-1 font-mono text-sm tracking-wider text-white/60">
          +92 300 · · · · · · ·
        </div>
        <div className="mt-2 text-xs text-white/50">{state === "ringing" ? "…" : "00:03"}</div>
      </div>

      {state === "connected" && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto max-w-xs rounded-md border border-white/15 bg-black/60 p-4 text-center text-sm leading-relaxed"
        >
          {line}
        </div>
      )}

      <div className="flex items-center gap-8">
        {state === "ringing" ? (
          <>
            <button
              type="button"
              onClick={onEnd}
              aria-label="Decline call"
              className="grid h-16 w-16 place-items-center rounded-full bg-destructive text-white"
            >
              <Phone className="h-6 w-6 rotate-[135deg]" />
            </button>
            <button
              type="button"
              onClick={() => setState("connected")}
              aria-label="Answer call"
              className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-black"
            >
              <PhoneIncoming className="h-6 w-6" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onEnd}
            className="rounded-full bg-white/10 px-6 py-3 font-mono text-xs tracking-widest text-white hover:bg-white/20"
          >
            END CALL · SEE THE DEBRIEF →
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── debrief ─────────────────────────── */

function Debrief({
  ending,
  picks,
  nerve,
  score,
}: {
  ending: DoubleEnding;
  picks: Pick[];
  nerve: number;
  score: number;
}) {
  const copy = ENDINGS[ending];
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div
        className={`rounded-lg border p-6 ${
          ending === "HELD"
            ? "border-emerald-500/40 bg-emerald-500/5"
            : ending === "SENT"
              ? "border-destructive/40 bg-destructive/5"
              : "border-caution/40 bg-caution/5"
        }`}
      >
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          THE DOUBLE · DEBRIEF
        </div>
        <h1
          data-phase-anchor="double-debrief"
          tabIndex={-1}
          className="mt-2 text-3xl font-semibold outline-none"
        >
          {copy.headline}
        </h1>
        <p className="mt-3 text-base italic text-foreground/85">"{copy.body}"</p>

        <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] tracking-widest text-muted-foreground">
          <span>SCORE · {score}/{picks.length}</span>
          <span>KHALA'S NERVE · {Math.round(nerve)}/100</span>
        </div>
      </div>

      {/* The grade ledger — every pick, its grade, in play order. */}
      <section className="mt-8">
        <div className="mb-3 font-mono text-xs tracking-widest text-muted-foreground">
          YOUR COACHING · IN ORDER
        </div>
        <ol className="space-y-2">
          {picks.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="mt-0.5 font-mono text-[10px] tracking-widest text-muted-foreground">
                T{i + 1}
              </span>
              <span className="min-w-0 flex-1">{p.chip.text}</span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-widest ${
                  p.chip.grade === "strong"
                    ? "border-emerald-500/50 text-emerald-400"
                    : p.chip.grade === "weak"
                      ? "border-caution/50 text-caution"
                      : "border-destructive/50 text-destructive"
                }`}
              >
                {p.chip.grade.toUpperCase()}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* The flip — the drill's whole thesis, in one line. */}
      <section className="mt-8 rounded-lg border border-primary/40 bg-primary/5 p-5">
        <div className="mb-2 font-mono text-[10px] tracking-widest text-primary">
          THE FLIP
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{DEBRIEF_LESSON.flip}</p>
      </section>

      {/* Protocol card — the family agreement. */}
      <section className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="mb-2 font-mono text-[10px] tracking-widest text-amber-400">
          PROTOCOL · FOR TONIGHT
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{DEBRIEF_LESSON.protocol}</p>
      </section>

      <p className="mt-8 text-center font-mono text-[11px] tracking-widest text-muted-foreground">
        {copy.closing}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/manual/$entryId"
          params={{ entryId: "impersonation" }}
          className="rounded-md border border-primary/60 bg-primary/10 px-4 py-2 font-mono text-xs tracking-widest text-primary hover:bg-primary/20"
        >
          THE FIELD MANUAL ON IMPERSONATION →
        </Link>
        <button
          type="button"
          onClick={() => navigate({ to: "/mirror" })}
          className="rounded-md border border-border px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          BACK TO THE CITY →
        </button>
      </div>
    </main>
  );
}

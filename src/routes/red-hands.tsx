// MILVERSE — "RED HANDS" route.
//
// Assigned inoculation drill. You run a scam script against Bibi Zainab,
// graduate of the ten lessons. You lose. The math is the message.
//
// Zero AI, zero cloud, zero engine touches, zero free-text input. All copy
// lives in src/lib/redhands/script.ts. The only localStorage write is
// milverse.redhands.v1 via saveRun().

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { CHAT_SKINS } from "@/lib/chat/skins";
import {
  COVERS,
  CHIPS,
  HANDLER_BRIEFING,
  DRILL_TAG,
  START_TRUST,
  TRUST_THRESHOLD,
  TURN_QUOTA,
  ENDINGS,
  CLOSING_LINE,
  WALL_LABELS,
  FLIP_LINE,
  applyPick,
  initialState,
  rotationForTurn,
  saveRun,
  wallsHitFor,
  type ChipKind,
  type Cover,
  type Ending,
  type RunState,
} from "@/lib/redhands/script";

export const Route = createFileRoute("/red-hands")({
  head: () => ({
    meta: [
      { title: "Red Hands — MILVERSE" },
      {
        name: "description",
        content: "Assigned inoculation drill. You run the script. You lose.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RedHandsRoute,
});

type Phase = "briefing" | "cover" | "sim" | "debrief";

function RedHandsRoute() {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [cover, setCover] = useState<Cover | null>(null);
  const [state, setState] = useState<RunState>(initialState);
  const [ending, setEnding] = useState<Ending | null>(null);

  function onPick(kind: ChipKind) {
    if (!cover) return;
    const res = applyPick(state, cover, kind);
    setState(res.state);
    if (res.ended) {
      setEnding(res.ended);
      saveRun(res.ended);
      // Small pause so the last bibi reply lands before switching phase.
      window.setTimeout(() => setPhase("debrief"), 450);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      {phase === "briefing" && (
        <Briefing
          onContinue={() => setPhase("cover")}
        />
      )}
      {phase === "cover" && (
        <CoverPick
          onPick={(c) => {
            setCover(c);
            setState(initialState());
            setEnding(null);
            setPhase("sim");
          }}
        />
      )}
      {phase === "sim" && cover && (
        <Simulation state={state} cover={cover} onPick={onPick} />
      )}
      {phase === "debrief" && cover && ending && (
        <Debrief cover={cover} state={state} ending={ending} />
      )}
    </div>
  );
}

/* ─────────────────────────── briefing ──────────────────────────── */

function Briefing({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/arena"
        className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> BACK TO THE ARENA
      </Link>

      <div className="mt-6 rounded-lg border border-red-500/50 bg-red-500/5 p-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-red-400">
          RED HANDS · ASSIGNED DRILL
        </div>
        <h1
          data-phase-anchor="red-hands"
          tabIndex={-1}
          className="mt-3 text-2xl font-semibold outline-none"
        >
          Tonight you're the script.
        </h1>
        <div className="mt-4 space-y-3">
          {HANDLER_BRIEFING.map((line, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-foreground/85"
            >
              <span className="mr-2 font-mono text-[10px] tracking-widest text-red-400/70">
                HANDLER
              </span>
              {line}
            </p>
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground">
          {DRILL_TAG}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-md bg-red-500 py-3 font-mono text-sm tracking-widest text-black hover:bg-red-400"
        >
          PICK YOUR COVER →
        </button>
      </div>
    </main>
  );
}

/* ─────────────────────────── cover pick ────────────────────────── */

function CoverPick({ onPick }: { onPick: (c: Cover) => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-red-400">
        CHOOSE A COVER
      </div>
      <p className="mt-2 text-sm text-foreground/70">
        Three angles. Every one of them is on the Field Manual. Pick the one
        you understand best from the target's side.
      </p>
      <div className="mt-6 grid gap-3">
        {COVERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c)}
            className="rounded-md border border-white/15 bg-neutral-900 p-4 text-left hover:border-red-500/60 hover:bg-neutral-800"
          >
            <div className="font-mono text-xs tracking-widest text-red-300">
              {c.label}
            </div>
            <div className="mt-1.5 text-xs text-white/60">
              She will ask: "{c.memoryQ}"
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

/* ─────────────────────────── simulation ────────────────────────── */

function Simulation({
  state,
  cover,
  onPick,
}: {
  state: RunState;
  cover: Cover;
  onPick: (k: ChipKind) => void;
}) {
  const skin = CHAT_SKINS.whatsapp;
  const slot = useMemo(
    () => rotationForTurn(state.turn - 1, state.openQuestion !== null),
    [state.turn, state.openQuestion],
  );

  useEffect(() => {
    const el = document.getElementById("redhands-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.picks.length]);

  const trustPct = Math.max(0, Math.min(100, state.trust));
  const meterColor =
    trustPct < 30
      ? "bg-destructive"
      : trustPct < TRUST_THRESHOLD
        ? "bg-caution"
        : "bg-primary";

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] max-w-md flex-col">
      {/* Header */}
      <div className={`flex items-center gap-3 border-b border-white/10 px-3 py-3 ${skin.headerClass}`}>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
          BZ
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">Bibi Zainab</div>
          <div className="truncate text-[11px] text-white/60">
            online · reads carefully
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPick("FOLD")}
          className="font-mono text-[10px] tracking-widest text-white/60 hover:text-white"
          aria-label="Break character and end the drill"
        >
          FOLD
        </button>
      </div>

      {/* Trust meter — labeled from her side. */}
      <div className="border-b border-white/10 bg-neutral-950/80 px-3 py-2">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/60">
          <span>HER TRUST</span>
          <span className="tabular-nums">
            {trustPct} / {TRUST_THRESHOLD}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10 relative">
          <div
            className={`h-full transition-all duration-500 ${meterColor}`}
            style={{ width: `${trustPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-white/40"
            style={{ left: `${TRUST_THRESHOLD}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] tracking-widest text-white/40">
          <span>SHIFT · TURN {Math.min(state.turn, TURN_QUOTA)}/{TURN_QUOTA}</span>
          <span>COVER · {cover.label}</span>
        </div>
      </div>

      {/* Thread */}
      <div
        id="redhands-scroll"
        className={`flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5 ${skin.bodyClass}`}
        style={skin.bodyStyle}
      >
        <div className="flex justify-center">
          <div className="max-w-[85%] rounded-md border border-red-500/30 bg-black/40 px-3 py-1.5 text-center text-[10px] leading-relaxed text-red-200/80">
            {DRILL_TAG}
          </div>
        </div>

        {/* Her opening turn. */}
        <BibiBubble text="Assalamu alaikum. Who is this, please? I don't recognise the number." skin={skin} />

        <div role="log" aria-live="polite" aria-relevant="additions text" className="contents">
          {state.picks.map((p, i) => (
            <div key={i} className="contents">
              <div className="flex justify-end msg-in">
                <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${skin.outBubble}`}>
                  <div className="mb-1 font-mono text-[9px] tracking-widest text-white/50">
                    {p.chip.label}
                    {p.chip.code ? ` · ${p.chip.code}` : ""}
                    {p.trustDelta !== 0 && (
                      <span className={p.trustDelta < 0 ? " text-destructive" : " text-primary"}>
                        {"  "}
                        {p.trustDelta > 0 ? `+${p.trustDelta}` : p.trustDelta}
                      </span>
                    )}
                  </div>
                  <div className="italic text-white/85">"{p.chip.hint}"</div>
                </div>
              </div>
              {p.bibiReply && <BibiBubble text={p.bibiReply} skin={skin} />}
            </div>
          ))}
        </div>
      </div>

      {/* Chip cluster */}
      <div className="border-t border-white/10 bg-neutral-950 p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-widest text-white/50">
          <span>YOUR MOVE</span>
          {state.openQuestion && (
            <span className="text-caution">SHE ASKED A QUESTION</span>
          )}
        </div>
        <div
          role="radiogroup"
          aria-label={`Moves, turn ${state.turn}`}
          className="grid grid-cols-1 gap-2"
        >
          {slot.chips.map((chip, i) => (
            <ChipButton key={`${state.turn}-${i}`} chip={chip} onPick={onPick} />
          ))}
          {slot.askAvailable && (
            <ChipButton chip={CHIPS.ASK} onPick={onPick} tone="danger" />
          )}
        </div>
      </div>
    </main>
  );
}

function BibiBubble({
  text,
  skin,
}: {
  text: string;
  skin: (typeof CHAT_SKINS)["whatsapp"];
}) {
  return (
    <div className="flex flex-col items-start gap-1 msg-in">
      <div className={`max-w-[85%] whitespace-pre-line px-3 py-2 text-sm leading-relaxed ${skin.inBubble}`}>
        {text}
      </div>
    </div>
  );
}

function ChipButton({
  chip,
  onPick,
  tone,
}: {
  chip: (typeof CHIPS)[ChipKind];
  onPick: (k: ChipKind) => void;
  tone?: "danger";
}) {
  const border =
    tone === "danger"
      ? "border-red-500/50 hover:border-red-400"
      : "border-white/15 hover:border-red-500/60";
  return (
    <button
      type="button"
      role="radio"
      aria-checked="false"
      onClick={() => onPick(chip.kind)}
      className={`touch-manipulation min-h-[44px] rounded-md ${border} bg-neutral-900 px-3 py-2.5 text-left text-sm text-white transition hover:bg-neutral-800`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-red-300">
          {chip.label}
        </span>
        {chip.code && (
          <span className="font-mono text-[9px] tracking-widest text-white/40">
            {chip.code}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-white/70">{chip.hint}</div>
    </button>
  );
}

/* ─────────────────────────── debrief ───────────────────────────── */

function Debrief({
  cover,
  state,
  ending,
}: {
  cover: Cover;
  state: RunState;
  ending: Ending;
}) {
  const copy = ENDINGS[ending];
  const walls = wallsHitFor(state, ending);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-red-400">
        RED HANDS · DEBRIEF
      </div>
      <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-foreground/85">
        {copy.body}
      </p>
      {copy.handlerTag && (
        <p className="mt-3 rounded-md border border-white/10 bg-neutral-900/60 p-3 text-sm text-foreground/80">
          <span className="mr-2 font-mono text-[10px] tracking-widest text-red-400/70">
            HANDLER
          </span>
          {copy.handlerTag}
        </p>
      )}

      {/* Ledger — every move you made, with tactic code and delta. */}
      <section className="mt-8">
        <h2 className="font-mono text-[10px] tracking-widest text-muted-foreground">
          YOUR MOVES · COVER {cover.label}
        </h2>
        <ol className="mt-3 space-y-1 border-t border-white/10">
          {state.picks.map((p, i) => (
            <li
              key={i}
              className="flex items-center justify-between border-b border-white/10 py-2 text-xs"
            >
              <span className="font-mono tracking-widest text-white/70">
                T{p.turn} · {p.chip.label}
                {p.chip.code ? ` · ${p.chip.code}` : ""}
              </span>
              <span
                className={`tabular-nums ${p.trustDelta < 0 ? "text-destructive" : p.trustDelta > 0 ? "text-primary" : "text-white/50"}`}
              >
                {p.trustDelta > 0 ? `+${p.trustDelta}` : p.trustDelta} ·{" "}
                {p.trustAfter}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between py-2 font-mono text-[10px] tracking-widest">
            <span className="text-white/60">FINAL TRUST</span>
            <span className="tabular-nums text-white/90">
              {state.trust} / {TRUST_THRESHOLD} · started {START_TRUST}
            </span>
          </li>
        </ol>
      </section>

      {/* Walls hit. */}
      {walls.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[10px] tracking-widest text-muted-foreground">
            WHAT STOPPED YOU
          </h2>
          <ul className="mt-3 space-y-2">
            {walls.map((w) => (
              <li
                key={w}
                className="rounded-md border border-white/10 bg-neutral-900/50 p-3 text-sm leading-relaxed text-foreground/85"
              >
                {WALL_LABELS[w]}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Flip. */}
      <section className="mt-8 rounded-md border border-primary/40 bg-primary/5 p-4">
        <div className="font-mono text-[10px] tracking-widest text-primary">
          INSTALL AT HOME
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          {FLIP_LINE}
        </p>
      </section>

      <p className="mt-8 font-mono text-[11px] tracking-[0.2em] text-red-300/80">
        {CLOSING_LINE}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/arena"
          className="rounded-md border border-white/15 bg-neutral-900 px-4 py-2 font-mono text-xs tracking-widest text-white/80 hover:border-white/30"
        >
          ← ARENA
        </Link>
        <Link
          to="/manual"
          className="rounded-md border border-white/15 bg-neutral-900 px-4 py-2 font-mono text-xs tracking-widest text-white/80 hover:border-white/30"
        >
          FIELD MANUAL
        </Link>
      </div>
    </main>
  );
}

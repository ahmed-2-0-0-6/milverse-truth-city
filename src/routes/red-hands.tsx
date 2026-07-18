import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PhoneIncoming, Phone } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { CHAT_SKINS } from "@/lib/chat/skins";
import {
  TURN_DECKS,
  FOLD_CHIP,
  FORCED,
  COVERS,
  chipFor,
  rotationForTurn,
  ASK_THRESHOLD,
  TRUST_START,
  QUOTA_TURNS,
  HANDLER_BRIEF,
  BRIEF_SUBLINE,
  ENDINGS,
  CLOSING_CARD,
  WALL_COPY,
  FLIP,
  saveRedHandsRun,
  type Chip,
  type Cover,
  type Ending,
  type MoveFamily,
} from "@/lib/redhands/script";

export const Route = createFileRoute("/red-hands")({
  head: () => ({
    meta: [
      { title: "Red Hands — MILVERSE" },
      {
        name: "description",
        content:
          "The inoculation flip. Run a scam script at a target trained by the ten lessons. You will lose — and learn every wall she uses.",
      },
    ],
  }),
  component: RedHandsRoute,
});

type Phase = "brief" | "cover" | "sim" | "callback" | "debrief";

interface Pick {
  turn: number;
  chip: Chip;
}

function RedHandsRoute() {
  const skin = CHAT_SKINS.whatsapp;
  const [phase, setPhase] = useState<Phase>("brief");
  const [cover, setCover] = useState<Cover>("nephew");

  const [turnIdx, setTurnIdx] = useState(0);
  const [trust, setTrust] = useState(TRUST_START);
  const [trustDelta, setTrustDelta] = useState<number | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [ending, setEnding] = useState<Ending | null>(null);

  // Forced-beat memory.
  const [warmStreak, setWarmStreak] = useState(0);
  const [provePlayed, setProvePlayed] = useState(false);
  const [challengePending, setChallengePending] = useState(false);

  type Entry =
    | { kind: "her"; text: string }
    | { kind: "me"; text: string; family: MoveFamily }
    | { kind: "system"; text: string };

  const [log, setLog] = useState<Entry[]>([
    { kind: "system", text: "This is a training simulation. She's the graduate." },
    {
      kind: "her",
      text: "Assalam-o-alaikum. Kaun bol raha hai?",
    },
  ]);

  useEffect(() => {
    const el = document.getElementById("rh-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  // Turn-3 forced preface if no PROVE yet.
  useEffect(() => {
    if (phase !== "sim") return;
    if (turnIdx === 2 && !provePlayed) {
      setLog((l) => [
        ...l,
        { kind: "her", text: FORCED.unpromptedChallengePreface },
        { kind: "her", text: COVERS[cover].challenge },
      ]);
      setChallengePending(true);
    }
    if (turnIdx === 4) {
      setLog((l) => [...l, { kind: "her", text: FORCED.callAnnouncement }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIdx, phase]);

  function pickChip(chip: Chip) {
    if (chip.family === "FOLD") {
      setPicks((p) => [...p, { turn: turnIdx, chip }]);
      setEnding("FOLD");
      setLog((l) => [...l, { kind: "me", text: chip.text, family: "FOLD" }]);
      window.setTimeout(() => setPhase("debrief"), 400);
      return;
    }

    // Apply trust deltas — including any challenge penalty riding on this turn.
    let delta = chip.trust;
    if (challengePending) {
      delta -= 12;
    }
    const nextTrust = Math.max(0, Math.min(100, trust + delta));
    setTrust(nextTrust);
    setTrustDelta(delta);
    setPicks((p) => [...p, { turn: turnIdx, chip }]);

    // WARM streak / forced pushback.
    let herReply = chip.reply;
    if (chip.family === "WARM") {
      const nextStreak = warmStreak + 1;
      setWarmStreak(nextStreak);
      if (nextStreak >= 2) herReply = FORCED.warmPushback;
    } else {
      setWarmStreak(0);
    }
    if (chip.family === "PROVE") setProvePlayed(true);
    if (challengePending) setChallengePending(false);

    // ASK path — instant DOOR if under threshold.
    setLog((l) => [
      ...l,
      { kind: "me", text: chip.text, family: chip.family },
      ...(herReply && herReply !== "…" ? [{ kind: "her" as const, text: herReply }] : []),
      ...(herReply === "…" && chip.family === "ASK"
        ? [
            {
              kind: "her" as const,
              text:
                nextTrust >= ASK_THRESHOLD
                  ? "…" // unreachable by construction
                  : "Beta, main aap ko nahi janti. Aur ab main aap ka number report kar rahi hoon.",
            },
          ]
        : []),
    ]);

    if (chip.family === "ASK") {
      // Threshold unreachable — always DOOR.
      setEnding("DOOR");
      window.setTimeout(() => setPhase("debrief"), 600);
      return;
    }

    // Advance turn or end at quota.
    const nextIdx = turnIdx + 1;
    if (nextIdx >= QUOTA_TURNS) {
      // Never asked, never folded → real nephew picks up.
      setEnding("CALLBACK");
      window.setTimeout(() => setPhase("callback"), 500);
      return;
    }
    window.setTimeout(() => setTurnIdx(nextIdx), 400);
  }

  useEffect(() => {
    if (phase === "debrief" && ending) saveRedHandsRun(ending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function finishCallback() {
    setPhase("debrief");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />

      {phase === "brief" && <Brief onContinue={() => setPhase("cover")} />}
      {phase === "cover" && (
        <CoverPicker
          cover={cover}
          onPick={(c) => setCover(c)}
          onStart={() => setPhase("sim")}
        />
      )}
      {phase === "sim" && (
        <Simulation
          skin={skin}
          cover={cover}
          trust={trust}
          trustDelta={trustDelta}
          turnIdx={turnIdx}
          log={log}
          onPick={pickChip}
        />
      )}
      {phase === "callback" && <CallbackBeat onEnd={finishCallback} />}
      {phase === "debrief" && ending && (
        <Debrief ending={ending} picks={picks} trust={trust} />
      )}
    </div>
  );
}

/* ─────────── brief ─────────── */

function Brief({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/arena"
        className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> BACK TO THE ARENA
      </Link>

      <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/[0.06] p-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-destructive">
          SPECIAL FILE · RED HANDS
        </div>
        <h1 tabIndex={-1} className="mt-3 text-2xl font-semibold outline-none">
          Tonight, you're the script.
        </h1>
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/85">
          {HANDLER_BRIEF.map((line, i) => (
            <li key={i} className="border-l-2 border-destructive/40 pl-3">
              {line}
            </li>
          ))}
        </ol>
        <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground">
          {BRIEF_SUBLINE}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-md bg-destructive py-3 font-mono text-sm tracking-widest text-white hover:bg-destructive/90"
        >
          ACCEPT SHIFT →
        </button>
      </div>
    </main>
  );
}

/* ─────────── cover picker ─────────── */

function CoverPicker({
  cover,
  onPick,
  onStart,
}: {
  cover: Cover;
  onPick: (c: Cover) => void;
  onStart: () => void;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
        PICK YOUR COVER
      </div>
      <div className="mt-4 space-y-3">
        {(Object.values(COVERS)).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className={`w-full rounded-md border p-4 text-left transition ${
              cover === c.id
                ? "border-destructive bg-destructive/[0.07]"
                : "border-border hover:border-foreground/40"
            }`}
          >
            <div className="font-mono text-[10px] tracking-widest text-destructive">
              {c.label}
            </div>
            <div className="mt-1 text-sm text-foreground/90">{c.pitch}</div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 w-full rounded-md bg-destructive py-3 font-mono text-sm tracking-widest text-white hover:bg-destructive/90"
      >
        START THE SHIFT →
      </button>
    </main>
  );
}

/* ─────────── simulation ─────────── */

function Simulation({
  skin,
  cover,
  trust,
  trustDelta,
  turnIdx,
  log,
  onPick,
}: {
  skin: typeof CHAT_SKINS.whatsapp;
  cover: Cover;
  trust: number;
  trustDelta: number | null;
  turnIdx: number;
  log: Array<
    | { kind: "her"; text: string }
    | { kind: "me"; text: string; family: MoveFamily }
    | { kind: "system"; text: string }
  >;
  onPick: (c: Chip) => void;
}) {
  const rotation = rotationForTurn(turnIdx);
  const chips = useMemo(
    () => rotation.map((s) => chipFor(turnIdx, s, cover)),
    [turnIdx, rotation, cover],
  );

  const trustColor =
    trust <= 20
      ? "bg-destructive"
      : trust < ASK_THRESHOLD
        ? "bg-caution"
        : "bg-primary";

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] max-w-md flex-col">
      {/* Header — her, not you. */}
      <div
        className={`flex items-center gap-3 border-b border-white/10 px-3 py-3 ${skin.headerClass}`}
      >
        <div className="grid h-9 w-9 place-items-center rounded-full bg-neutral-700 text-sm font-semibold text-white">
          BS
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">Bibi Shamim</div>
          <div className="truncate text-[11px] text-white/60">
            last seen · a moment ago
          </div>
        </div>
        <Link
          to="/arena"
          className="font-mono text-[10px] tracking-widest text-white/60 hover:text-white"
        >
          EXIT
        </Link>
      </div>

      {/* SHIFT QUOTA + TRUST meter. */}
      <div className="border-b border-white/10 bg-neutral-950/80 px-3 py-2">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/60">
          <span>SHIFT QUOTA · TURN {turnIdx + 1}/{QUOTA_TURNS}</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <span className="text-white/50">ASK LINE {ASK_THRESHOLD}</span>
            {trustDelta !== null && trustDelta !== 0 && (
              <span
                key={`${turnIdx}-${trustDelta}`}
                className={`msg-in font-bold ${
                  trustDelta < 0 ? "text-destructive" : "text-primary"
                }`}
                aria-hidden="true"
              >
                {trustDelta > 0 ? `+${trustDelta}` : trustDelta}
              </span>
            )}
            <span>TRUST {Math.round(trust)}</span>
          </span>
        </div>
        <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full transition-all duration-500 ${trustColor}`}
            style={{ width: `${trust}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-white/50"
            style={{ left: `${ASK_THRESHOLD}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Thread. */}
      <div
        id="rh-scroll"
        className={`flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5 ${skin.bodyClass}`}
        style={skin.bodyStyle}
      >
        <div role="log" aria-live="polite" aria-relevant="additions text" className="contents">
          {log.map((entry, i) => {
            if (entry.kind === "system") {
              return (
                <div key={i} className="flex justify-center">
                  <div className="max-w-[85%] rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-center text-[10px] leading-relaxed text-destructive/80">
                    ⚑ {entry.text}
                  </div>
                </div>
              );
            }
            if (entry.kind === "her") {
              return (
                <div key={i} className="flex flex-col items-start gap-1 msg-in">
                  <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${skin.inBubble}`}>
                    {entry.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex flex-col items-end gap-1 msg-in">
                <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${skin.outBubble}`}>
                  {entry.text}
                </div>
                <div className="font-mono text-[9px] tracking-widest text-destructive/70">
                  YOU · {entry.family}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chip cluster + always-on FOLD. */}
      <div className="border-t border-white/10 bg-neutral-950 p-3">
        <div className="mb-2 font-mono text-[10px] tracking-widest text-white/50">
          PICK YOUR MOVE
        </div>
        <div
          role="radiogroup"
          aria-label={`Moves, turn ${turnIdx + 1}`}
          className="flex flex-col gap-2"
        >
          {chips.map((chip, i) => (
            <button
              key={`${turnIdx}-${i}`}
              type="button"
              role="radio"
              aria-checked="false"
              onClick={() => onPick(chip)}
              className="touch-manipulation min-h-[44px] rounded-md border border-white/15 bg-neutral-900 px-3 py-2.5 text-left text-sm text-white transition hover:border-destructive/60 hover:bg-neutral-800"
            >
              <div className="flex items-start justify-between gap-2">
                <span>{chip.text}</span>
                <span className="shrink-0 font-mono text-[9px] tracking-widest text-white/40">
                  {chip.family}
                  {chip.code ? ` · ${chip.code}` : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPick(FOLD_CHIP)}
          className="mt-3 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-left font-mono text-[11px] tracking-widest text-white/50 hover:border-white/30 hover:text-white/80"
        >
          [FOLD] · {FOLD_CHIP.text}
        </button>
      </div>
    </main>
  );
}

/* ─────────── callback beat ─────────── */

function CallbackBeat({ onEnd }: { onEnd: () => void }) {
  const [state, setState] = useState<"ringing" | "connected">("ringing");
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (state !== "ringing") return;
    const t = window.setTimeout(() => setState("connected"), reduced ? 200 : 1600);
    return () => window.clearTimeout(t);
  }, [state, reduced]);

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-md flex-col items-center justify-between bg-gradient-to-b from-neutral-900 via-black to-neutral-950 px-6 pt-16 pb-10 text-white">
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
          {state === "ringing" ? "She is calling · nephew (saved)" : "In call · she & nephew"}
        </div>
        <div className="mt-6 text-3xl font-semibold">Danish (Saved 2018)</div>
        <div className="mt-1 font-mono text-sm tracking-wider text-white/60">
          +92 300 · · · · · · ·
        </div>
      </div>

      {state === "connected" && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto max-w-xs rounded-md border border-white/15 bg-black/60 p-4 text-center text-sm leading-relaxed"
        >
          "Khala, main theek hoon. Kaun aap ko tang kar raha hai?"
          <div className="mt-2 font-mono text-[10px] tracking-widest text-white/50">
            YOUR NUMBER · REPORTED · BURNED
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onEnd}
        className="rounded-full bg-white/10 px-6 py-3 font-mono text-xs tracking-widest text-white hover:bg-white/20"
      >
        END SHIFT · SEE THE DEBRIEF →
      </button>
    </div>
  );
}

/* ─────────── debrief ─────────── */

function Debrief({
  ending,
  picks,
  trust,
}: {
  ending: Ending;
  picks: Pick[];
  trust: number;
}) {
  const copy = ENDINGS[ending];
  const navigate = useNavigate();

  // Tally families used for the "walls" section.
  const familiesUsed = new Set(picks.map((p) => p.chip.family));
  const askedFamilies: Array<keyof typeof WALL_COPY> = [];
  if (familiesUsed.has("WARM")) askedFamilies.push("WARM");
  if (familiesUsed.has("PROVE")) askedFamilies.push("PROVE");
  if (familiesUsed.has("RUSH")) askedFamilies.push("RUSH");
  if (picks.length >= 3) askedFamilies.push("QUESTION");
  if (ending === "CALLBACK") askedFamilies.push("CALLBACK");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div
        className={`rounded-lg border p-6 ${
          ending === "DOOR"
            ? "border-emerald-500/40 bg-emerald-500/5"
            : ending === "CALLBACK"
              ? "border-destructive/40 bg-destructive/5"
              : "border-caution/40 bg-caution/5"
        }`}
      >
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          RED HANDS · DEBRIEF
        </div>
        <h1
          data-phase-anchor="redhands-debrief"
          tabIndex={-1}
          className="mt-2 text-3xl font-semibold outline-none"
        >
          {copy.headline}
        </h1>
        <p className="mt-3 text-base italic text-foreground/85">"{copy.body}"</p>
        {copy.handler && (
          <p className="mt-3 rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] tracking-wider text-white/70">
            HANDLER · {copy.handler}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] tracking-widest text-muted-foreground">
          <span>TURNS · {picks.length}/{QUOTA_TURNS}</span>
          <span>TRUST · {Math.round(trust)}/100 · ASK LINE {ASK_THRESHOLD}</span>
        </div>
      </div>

      {/* Move ledger — grouped by family, no grades. */}
      <section className="mt-8">
        <div className="mb-3 font-mono text-xs tracking-widest text-muted-foreground">
          YOUR SHIFT · IN ORDER
        </div>
        <ol className="space-y-2">
          {picks.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="mt-0.5 font-mono text-[10px] tracking-widest text-muted-foreground">
                T{p.turn + 1}
              </span>
              <span className="min-w-0 flex-1">{p.chip.text}</span>
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground">
                {p.chip.family}
                {p.chip.code ? ` · ${p.chip.code}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Her walls — the whole point. */}
      <section className="mt-8">
        <div className="mb-3 font-mono text-xs tracking-widest text-muted-foreground">
          HER WALLS · WHAT KILLED THE SHIFT
        </div>
        <ul className="space-y-2">
          {askedFamilies.map((k) => (
            <li
              key={k}
              className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.04] px-3 py-2 text-sm"
            >
              <span className="mr-2 font-mono text-[10px] tracking-widest text-emerald-400">
                {k}
              </span>
              {WALL_COPY[k]}
            </li>
          ))}
        </ul>
      </section>

      {/* The flip. */}
      <section className="mt-8 rounded-lg border border-primary/40 bg-primary/5 p-5">
        <div className="mb-2 font-mono text-[10px] tracking-widest text-primary">
          THE FLIP · INSTALL AT HOME
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{FLIP}</p>
      </section>

      <p className="mt-8 text-center font-mono text-[11px] tracking-widest text-muted-foreground">
        {CLOSING_CARD}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/manual/$entryId"
          params={{ entryId: "impersonation" }}
          className="rounded-md border border-primary/60 bg-primary/10 px-4 py-2 font-mono text-xs tracking-widest text-primary hover:bg-primary/20"
        >
          FIELD MANUAL · IMPERSONATION →
        </Link>
        <button
          type="button"
          onClick={() => navigate({ to: "/arena" })}
          className="rounded-md border border-border px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          BACK TO THE ARENA →
        </button>
      </div>

      {/* Icons imported but unused elsewhere — silence lint. */}
      <span className="hidden" aria-hidden>
        <PhoneIncoming /> <Phone />
      </span>
    </main>
  );
}

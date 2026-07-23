// /visit — THE JUDGE'S CUT.
// A GUIDED VISIT + the filming location for the competition video.
// SANDBOX LAWS: zero-AI, zero-cloud, zero-profile-writes. PRESENTATION imports
// only (chat skins config + chat shell + VerdictMoment). No engine logic, no
// server fns, no localStorage writes. Verified: `rg` this file's imports before
// shipping — engine modules will trip the audit.
//
// Director Mode: ?director=1 auto-runs the whole tour for clean recording. It
// is intentionally IGNORED under prefers-reduced-motion — recording happens on
// a machine without that setting, and preserving accessibility trumps auto-run.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  SkipForward,
  X,
  Keyboard,
  Newspaper,
  BookOpen,
  Coins,
  Users,
  Shield,
  Sparkles,
  Phone,
  Search,
  GraduationCap,
  Printer,
  Timer,
  FileText,
  Repeat,
  HeartPulse,
  Trophy,
} from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { CallScreen } from "@/components/chat/CallScreen";
import { VerdictMoment, type CalibrationOutcome } from "@/components/VerdictMoment";
import { DOCTRINE_RULES } from "@/lib/boss/doctrine";
import { CHAT_SKINS } from "@/lib/chat/skins";

// Timings live here so retiming for the video edit is arithmetic, not
// archaeology. Comments are running totals (ms) from tour start.
export const DIRECTOR_TIMINGS = {
  arrival: 2800,             //  2.8s — Beat 0 hold
  beat1_openerHold: 1400,    //  4.2s — read opener
  beat1_press: 400,          // press flash before each firing
  beat1_perTurn: 4800,       // per chat turn (× 4) = 19.2s → 23.4s
  beat1_verdictOpen: 1200,   // 24.6s
  beat1_convictionPick: 1400,// 26.0s
  beat1_verdictPick: 1400,   // 27.4s (VerdictMoment then runs ~3.2s)
  beat1_stampBudget: 3300,   // 30.7s
  beat1_debriefHold: 5000,   // 35.7s
  beat2_step0_read: 4200,    // 39.9s
  beat2_step0_pick: 1400,    // 41.3s
  beat2_step0_advance: 2600, // 43.9s
  beat2_step1_read: 3600,    // 47.5s
  beat2_step1_pick: 1400,    // 48.9s
  beat2_callHold: 3500,      // 52.4s
  beat2_doctrineAdvance: 2000, // 54.4s
  beat2_doctrineHold: 7500,  // 61.9s
  beat3_perPanel: 5000,      // per panel (× 6 = 30s) → 91.9s
  beat3_advance: 1600,       // 93.5s
  beat4_hold: 8000,          // 101.5s → rests on DEPARTURE
} as const;

export const Route = createFileRoute("/visit")({
  validateSearch: (search: Record<string, unknown>): { director: string } => ({
    director: typeof search.director === "string" ? search.director : "",
  }),
  head: () => ({
    meta: [
      { title: "Visit MILVERSE — 3 minutes inside the city that trains trust" },
      {
        name: "description",
        content:
          "A guided 3-minute tour for judges, educators, and press. Play a scam, meet a boss, tour the city — no signup.",
      },
      {
        property: "og:title",
        content: "Visit MILVERSE — 3 minutes inside the city that trains trust",
      },
      {
        property: "og:description",
        content:
          "A guided 3-minute tour for judges, educators, and press. Play a scam, meet a boss, tour the city — no signup.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://milverse-truth-city.lovable.app/visit" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://milverse-truth-city.lovable.app/visit" }],
  }),
  component: VisitPage,
});

type Beat = 0 | 1 | 2 | 3 | 4 | 5;
const BEAT_LABELS = [
  "ARRIVAL",
  "GET SCAMMED",
  "MEET A BOSS",
  "THE CITY",
  "THE LICENSE",
  "DEPARTURE",
];

function usePrefersReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setRm(mq.matches);
    const on = () => setRm(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return rm;
}

function VisitPage() {
  const navigate = useNavigate();
  const { director: directorParam } = Route.useSearch();
  const [beat, setBeat] = useState<Beat>(0);
  const reducedMotion = usePrefersReducedMotion();

  // Director is active only when explicitly requested AND not cancelled AND
  // reduced motion is off. Any keypress/click during director flips the switch.
  const [directorCancelled, setDirectorCancelled] = useState(false);
  const director = directorParam === "1" && !reducedMotion && !directorCancelled;

  const leave = () => navigate({ to: "/" });
  const next = () => setBeat((b) => (b < 5 ? ((b + 1) as Beat) : b));
  const skip = next;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any input during director hand-back to the user at the current beat.
  useEffect(() => {
    if (!director) return;
    const cancel = () => setDirectorCancelled(true);
    window.addEventListener("keydown", cancel, { once: true });
    window.addEventListener("pointerdown", cancel, { once: true });
    return () => {
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("pointerdown", cancel);
    };
  }, [director]);

  return (
    <div className="min-h-[100dvh] bg-black text-white grain">
      <TourChrome beat={beat} onSkip={skip} onLeave={leave} hideControls={director} />
      {director && (
        <div
          aria-hidden
          className="fixed top-3 right-4 z-50 flex items-center gap-1.5 rounded border border-red-500/60 bg-black/70 px-2 py-1 stencil text-[10px] tracking-[0.3em] text-red-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 visit-rec-pulse" /> REC
        </div>
      )}
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4">
        {beat === 0 && <Beat0Arrival onNext={next} director={director} />}
        {beat === 1 && (
          <Beat1Scam onNext={next} reducedMotion={reducedMotion} director={director} />
        )}
        {beat === 2 && (
          <Beat2Boss onNext={next} reducedMotion={reducedMotion} director={director} />
        )}
        {beat === 3 && (
          <Beat3City onNext={next} reducedMotion={reducedMotion} director={director} />
        )}
        {beat === 4 && <Beat4License onNext={next} director={director} />}
        {beat === 5 && <Beat5Departure />}
      </main>
    </div>
  );
}

/* ---------- Chrome ---------- */

function TourChrome({
  beat,
  onSkip,
  onLeave,
  hideControls,
}: {
  beat: Beat;
  onSkip: () => void;
  onLeave: () => void;
  hideControls: boolean;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-1.5 stencil text-[10px] tracking-[0.3em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> GUIDED VISIT
        </div>
        <div
          className="mx-2 flex flex-1 items-center gap-1.5"
          aria-label={`Beat ${beat} of 5: ${BEAT_LABELS[beat]}`}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                beat >= n ? "bg-primary" : "bg-white/15"
              }`}
            />
          ))}
        </div>
        {!hideControls && beat < 5 && (
          <button
            onClick={onSkip}
            className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 stencil text-[10px] text-white/70 hover:bg-white/10"
            aria-label="Skip this beat"
          >
            SKIP <SkipForward className="h-3 w-3" />
          </button>
        )}
        {!hideControls && (
          <button
            onClick={onLeave}
            className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 stencil text-[10px] text-white/70 hover:bg-white/10"
            aria-label="Leave the tour"
          >
            LEAVE <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- BEAT 0 — ARRIVAL ---------- */

function Beat0Arrival({ onNext, director }: { onNext: () => void; director: boolean }) {
  useEffect(() => {
    if (!director) return;
    const t = setTimeout(onNext, DIRECTOR_TIMINGS.arrival);
    return () => clearTimeout(t);
  }, [director, onNext]);

  return (
    <section className="relative mt-10 overflow-hidden rounded-lg border border-white/10 text-center sm:mt-16">
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(70% 100% at 50% 115%, oklch(0.82 0.14 195 / 0.22), transparent 60%)," +
            "radial-gradient(40% 60% at 85% -10%, oklch(0.8 0.14 80 / 0.1), transparent 70%)," +
            "linear-gradient(180deg, #05070c 0%, #02040a 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24 opacity-60 pointer-events-none"
        aria-hidden
        style={{
          background:
            "repeating-linear-gradient(90deg, oklch(0.1 0.02 255) 0 22px, transparent 22px 30px, oklch(0.12 0.02 255) 30px 58px, transparent 58px 66px)",
          maskImage: "linear-gradient(0deg, black 55%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-20 opacity-30 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.82 0.14 195 / 0.8) 1px, transparent 1px), radial-gradient(oklch(0.8 0.14 80 / 0.7) 1px, transparent 1px)",
          backgroundSize: "23px 17px, 37px 23px",
          backgroundPosition: "3px 5px, 14px 11px",
          maskImage: "linear-gradient(0deg, black 45%, transparent 95%)",
        }}
      />
      <div className="scan-sweep absolute inset-0 pointer-events-none" aria-hidden />
      <div className="relative p-6 sm:p-12">
        <div className="stencil text-[10px] tracking-[0.4em] text-primary hud-blink">
          MILVERSE · NOW ARRIVING
        </div>
        <h1
          className="mt-3 text-4xl sm:text-6xl font-black tracking-tight leading-[0.9]"
          style={{
            fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif',
            textShadow: "0 0 28px oklch(0.82 0.14 195 / 0.45)",
          }}
        >
          A CITY THAT TRAINS TRUST.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
          You have 3 minutes. Five beats. Real interaction — you'll play, not watch.
          <br />
          <span className="text-primary">Let's get you scammed.</span>
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 stencil text-[10px] tracking-[0.25em] text-white/40">
          <Keyboard className="h-3.5 w-3.5" /> KEYBOARD OK · ESC LEAVES · SKIP ANY TIME
        </div>
        <button
          autoFocus
          onClick={onNext}
          className="cta-glow mt-8 rounded-md bg-primary px-6 py-3 stencil text-xs tracking-[0.3em] text-primary-foreground hover:opacity-90"
        >
          BEGIN THE VISIT <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

/* ---------- Local ClaimedClockChip (scripted, no engine coupling) ---------- */

function ClaimedClockChip({
  seconds,
  label,
  reducedMotion,
}: {
  seconds: number;
  label: string;
  reducedMotion: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (reducedMotion) return; // static at seconds
    const start = Date.now();
    const iv = window.setInterval(() => {
      const left = seconds - Math.floor((Date.now() - start) / 1000);
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) window.clearInterval(iv);
    }, 500);
    return () => window.clearInterval(iv);
  }, [seconds, reducedMotion]);
  const m = Math.floor(remaining / 60);
  const s = (remaining % 60).toString().padStart(2, "0");
  return (
    <span
      aria-hidden
      className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-amber-300"
    >
      <Timer className="h-3 w-3" />
      <span className="stencil text-[9px] text-amber-300/80">{label}</span>
      <span className="tabular-nums text-amber-100">{`${m}:${s}`}</span>
    </span>
  );
}

/* ---------- BEAT 1 — GET SCAMMED (SMS SKIN + CLAIMED CLOCK + CONVICTION) ---------- */

interface ScamTurn {
  contact: string;
  choices: { text: string; smart: boolean }[];
}
const SCAM_TITLE = "IMPOSTER — 'SANA' (WORK)";
const SCAM_NUMBER = "+92 302 118 44 06";
const SCAM_SCRIPT: ScamTurn[] = [
  {
    contact:
      "Hey it's Sana from work — dropped my phone in a rickshaw, using a friend's SIM. Small favor, kinda urgent?",
    choices: [
      { text: "Sure — what do you need?", smart: false },
      { text: "What were the last 4 digits of your old number?", smart: true },
    ],
  },
  {
    contact:
      "long story, SIM's dying, no time for that. i need you to send an EasyPaisa top-up to my cousin RIGHT NOW, ill pay back at office monday.",
    choices: [
      { text: "Sending — what's the number?", smart: false },
      { text: "I'll call your saved number to confirm. 2 mins.", smart: true },
    ],
  },
  {
    contact:
      "DONT call the old number its bricked. please yaar just 5k, cousin stranded. why r u making this hard.",
    choices: [
      { text: "Okay, calm down — sending 5k.", smart: false },
      { text: "Ping me on Slack from your work login. Then we talk.", smart: true },
    ],
  },
  {
    contact: "slack's down for me. LOOK if u can't help just say so. i thought we were friends.",
    choices: [
      { text: "Fine, sending it now — don't be mad.", smart: false },
      { text: "This is an imposter pattern. Blocking and reporting to Sana on Slack.", smart: true },
    ],
  },
];

type Conviction = "HUNCH" | "READ" | "CERTAIN";
const CONVICTION_OPTIONS: { id: Conviction; pct: number }[] = [
  { id: "HUNCH", pct: 60 },
  { id: "READ", pct: 75 },
  { id: "CERTAIN", pct: 90 },
];

function Beat1Scam({
  onNext,
  reducedMotion,
  director,
}: {
  onNext: () => void;
  reducedMotion: boolean;
  director: boolean;
}) {
  const skin = CHAT_SKINS.sms;
  const [turn, setTurn] = useState(0);
  const [log, setLog] = useState<{ from: "contact" | "you"; text: string }[]>([
    { from: "contact", text: SCAM_SCRIPT[0].contact },
  ]);
  const [pickedSmart, setPickedSmart] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<"chat" | "verdict" | "stamp" | "debrief">("chat");
  const [verdict, setVerdict] = useState<"REAL" | "FAKE" | null>(null);
  const [conviction, setConviction] = useState<Conviction | null>(null);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [pressedConv, setPressedConv] = useState<Conviction | null>(null);
  const [pressedVerdict, setPressedVerdict] = useState<"REAL" | "FAKE" | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [log, reducedMotion]);

  const smartRate = useMemo(() => {
    if (pickedSmart.length === 0) return 0;
    return pickedSmart.filter(Boolean).length / pickedSmart.length;
  }, [pickedSmart]);

  const choose = (idx: number) => {
    const t = SCAM_SCRIPT[turn];
    const choice = t.choices[idx];
    setLog((L) => [...L, { from: "you", text: choice.text }]);
    setPickedSmart((s) => [...s, choice.smart]);
    setPressedIdx(null);
    if (turn + 1 < SCAM_SCRIPT.length) {
      setTimeout(
        () => {
          setLog((L) => [...L, { from: "contact", text: SCAM_SCRIPT[turn + 1].contact }]);
          setTurn(turn + 1);
        },
        reducedMotion ? 60 : 700,
      );
    } else {
      setTimeout(() => setPhase("verdict"), reducedMotion ? 60 : 500);
    }
  };

  // Director auto-play — chat turns
  useEffect(() => {
    if (!director || phase !== "chat") return;
    const smartIdx = SCAM_SCRIPT[turn].choices.findIndex((c) => c.smart);
    const initial = turn === 0 ? DIRECTOR_TIMINGS.beat1_openerHold : 0;
    const t1 = setTimeout(
      () => setPressedIdx(smartIdx),
      initial + DIRECTOR_TIMINGS.beat1_perTurn - DIRECTOR_TIMINGS.beat1_press,
    );
    const t2 = setTimeout(
      () => choose(smartIdx),
      initial + DIRECTOR_TIMINGS.beat1_perTurn,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [director, phase, turn]);

  // Director auto-play — verdict
  useEffect(() => {
    if (!director || phase !== "verdict") return;
    const t1 = setTimeout(
      () => setPressedConv("CERTAIN"),
      DIRECTOR_TIMINGS.beat1_verdictOpen + DIRECTOR_TIMINGS.beat1_convictionPick -
        DIRECTOR_TIMINGS.beat1_press,
    );
    const t2 = setTimeout(() => {
      setConviction("CERTAIN");
      setPressedConv(null);
    }, DIRECTOR_TIMINGS.beat1_verdictOpen + DIRECTOR_TIMINGS.beat1_convictionPick);
    const t3 = setTimeout(
      () => setPressedVerdict("FAKE"),
      DIRECTOR_TIMINGS.beat1_verdictOpen +
        DIRECTOR_TIMINGS.beat1_convictionPick +
        DIRECTOR_TIMINGS.beat1_verdictPick -
        DIRECTOR_TIMINGS.beat1_press,
    );
    const t4 = setTimeout(() => {
      setVerdict("FAKE");
      setPhase("stamp");
    }, DIRECTOR_TIMINGS.beat1_verdictOpen +
      DIRECTOR_TIMINGS.beat1_convictionPick +
      DIRECTOR_TIMINGS.beat1_verdictPick);
    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, [director, phase]);

  // Director auto-advance from debrief
  useEffect(() => {
    if (!director || phase !== "debrief") return;
    const t = setTimeout(onNext, DIRECTOR_TIMINGS.beat1_debriefHold);
    return () => clearTimeout(t);
  }, [director, phase, onNext]);

  const outcome: CalibrationOutcome =
    verdict === "FAKE" ? "correct" : verdict === "REAL" ? "missed_scam" : "correct";
  const gotIt = verdict === "FAKE";
  const convictionLine =
    conviction === "CERTAIN" && !gotIt
      ? "Certain, and wrong. That combination is the one that empties accounts."
      : conviction === "HUNCH" && gotIt
        ? "Right on a hunch. Luck is not a method."
        : "Your sureness is data too. The city tracks it.";

  return (
    <section aria-label="Beat 1 of 5 — Get scammed">
      <div className="mb-3 text-center stencil text-[10px] tracking-[0.3em] text-white/60">
        BEAT 1 / 5 · <span className="text-primary">GET SCAMMED</span>
      </div>

      {phase !== "stamp" && (
        <div className="mx-auto w-full max-w-[420px]">
          <ChatShell
            header={
              <ChatHeader
                name="Sana (work?)"
                number={SCAM_NUMBER}
                isSaved={false}
                subtitle={skin.presenceLine}
                chrome={skin.headerClass}
                right={
                  phase === "chat" ? (
                    <ClaimedClockChip
                      seconds={120}
                      label="THEIR CLAIM · 2 MIN"
                      reducedMotion={reducedMotion}
                    />
                  ) : undefined
                }
              />
            }
          >
            <div
              className={`flex-1 overflow-y-auto px-3 py-3 space-y-2 ${skin.bodyClass}`}
              style={skin.bodyStyle}
            >
              {skin.systemNote && (
                <div className="flex justify-center">
                  <div className="max-w-[90%] rounded-md bg-black/50 border border-white/10 px-3 py-1.5 text-center text-[10px] leading-relaxed text-amber-200/80">
                    🔒 {skin.systemNote}
                  </div>
                </div>
              )}
              <div className="sr-only">The contact claims a deadline.</div>
              {log.map((m, i) => {
                const isYou = m.from === "you";
                const isLast = i === log.length - 1;
                return (
                  <div key={i} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      <div
                        className={`px-3 py-2 text-sm shadow-sm ${isYou ? skin.outBubble : skin.inBubble}`}
                      >
                        {m.text}
                      </div>
                      {isYou && isLast && (
                        <div className={`mt-0.5 text-right text-[10px] ${skin.readColor}`}>
                          Delivered · now
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={logEnd} />
            </div>
            {phase === "chat" && (
              <div className="border-t border-white/10 bg-neutral-950 p-2 space-y-1.5">
                <div className="stencil text-[9px] tracking-[0.25em] text-white/40 px-1">
                  CHOOSE YOUR REPLY
                </div>
                {SCAM_SCRIPT[turn].choices.map((c, i) => {
                  const pressed = pressedIdx === i;
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      aria-pressed={pressed}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm text-white transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
                        pressed
                          ? "border-primary bg-primary/20 ring-1 ring-primary/60"
                          : "border-white/15 bg-neutral-900 hover:bg-neutral-800"
                      }`}
                    >
                      {c.text}
                    </button>
                  );
                })}
              </div>
            )}
            {phase === "verdict" && (
              <div className="border-t border-white/10 bg-neutral-950 p-3 space-y-3">
                <div className="stencil text-[10px] tracking-[0.3em] text-caution">
                  CALL IT — REAL OR FAKE?
                </div>
                <div>
                  <div className="mb-1.5 stencil text-[9px] tracking-widest text-white/50">
                    HOW SURE ARE YOU?
                  </div>
                  <div
                    role="radiogroup"
                    aria-label="Conviction"
                    className="grid grid-cols-3 gap-1.5"
                  >
                    {CONVICTION_OPTIONS.map((opt) => {
                      const active = conviction === opt.id;
                      const pressed = pressedConv === opt.id;
                      return (
                        <button
                          key={opt.id}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setConviction(opt.id)}
                          className={`rounded border px-2 py-1.5 stencil text-[10px] tracking-widest transition-colors ${
                            active || pressed
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-white/15 bg-neutral-900 text-white/70 hover:bg-neutral-800"
                          }`}
                        >
                          <div>{opt.id}</div>
                          <div className="mt-0.5 font-mono text-[9px] tabular-nums text-white/60">
                            {opt.pct}%
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!conviction}
                    onClick={() => {
                      setVerdict("REAL");
                      setPhase("stamp");
                    }}
                    className={`rounded-md border-2 px-3 py-2 stencil text-xs tracking-widest disabled:opacity-40 ${
                      pressedVerdict === "REAL"
                        ? "border-primary/80 bg-primary/10"
                        : "border-white/15 hover:border-primary/50"
                    }`}
                  >
                    REAL
                  </button>
                  <button
                    disabled={!conviction}
                    onClick={() => {
                      setVerdict("FAKE");
                      setPhase("stamp");
                    }}
                    className={`rounded-md border-2 px-3 py-2 stencil text-xs tracking-widest disabled:opacity-40 ${
                      pressedVerdict === "FAKE"
                        ? "border-destructive/80 bg-destructive/10"
                        : "border-white/15 hover:border-destructive/50"
                    }`}
                  >
                    FAKE
                  </button>
                </div>
                {!conviction && (
                  <div className="text-center font-mono text-[10px] text-white/40">
                    Pick your conviction first.
                  </div>
                )}
              </div>
            )}
            {phase === "debrief" && (
              <div className="border-t border-white/10 bg-neutral-950 p-3">
                <button
                  onClick={onNext}
                  autoFocus
                  className="w-full rounded-md bg-primary px-3 py-3 stencil text-xs tracking-[0.3em] text-primary-foreground"
                >
                  NEXT: MEET A BOSS →
                </button>
              </div>
            )}
          </ChatShell>
        </div>
      )}

      {phase === "stamp" && verdict && (
        <VerdictMoment
          caseTitle="Imposter — 'Sana'"
          caseId="visit-scam-01"
          stampLabel={verdict}
          outcome={outcome}
          onDone={() => setPhase("debrief")}
        />
      )}

      {phase === "debrief" && (
        <div className="mx-auto mt-4 max-w-lg space-y-3">
          <div className="rounded-lg border-2 border-primary/60 bg-primary/10 p-4">
            <div className="stencil text-[10px] tracking-[0.3em] text-primary">YOU JUST FACED</div>
            <div className="mt-1 text-lg font-semibold text-primary">IMPERSONATION</div>
            <p className="mt-2 text-sm text-white/80">
              New number + urgency + a favor + refusal to verify out-of-band. Every scammer's
              signature. Verdict: <b>{verdict}</b> · Conviction:{" "}
              <b>{conviction ?? "—"}</b> · Smart-question rate:{" "}
              <b>{Math.round(smartRate * 100)}%</b>.
            </p>
            <p className="mt-2 font-mono text-[11px] tracking-wide text-white/70">
              {convictionLine}
            </p>
          </div>
          <div className="rounded-md border border-white/15 bg-neutral-900 p-4">
            <div className="stencil text-[10px] tracking-[0.3em] text-white/60 mb-2">
              CALIBRATION 2×2
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-200">
                <b>CORRECT CALL</b>
                <div>trust earned</div>
              </div>
              <div className="rounded border border-caution/40 bg-caution/10 p-2 text-caution">
                <b>FALSE ALARM</b>
                <div>paranoia</div>
              </div>
              <div className="rounded border border-caution/40 bg-caution/10 p-2 text-caution">
                <b>MISSED SCAM</b>
                <div>gullibility</div>
              </div>
              <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-200">
                <b>CORRECT PASS</b>
                <div>trust kept</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/70">
              This game punishes gullibility <b>AND</b> paranoia — we train{" "}
              <span className="text-primary">calibrated trust</span>, not suspicion.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- BEAT 2 — MEET A BOSS (WHATSAPP SKIN) ---------- */

interface BossStep {
  msg: string;
  choices: { text: string; result: string; correct?: boolean }[];
  callout?: string;
}
const BOSS_STEPS: BossStep[] = [
  {
    msg: "Salaam. This is Kamran from your bank's fraud desk. Two charges from Bali on your card — INR 42,880 at a resort called 'Ubud Sanctuary'. Was that you? I'll walk you through the reversal.",
    choices: [
      {
        text: "🔎 Reverse-image the resort",
        result: "Real resort. Photos check out on TripAdvisor. Ratings 4.6.",
        correct: true,
      },
      {
        text: "🔎 Cross-check the fraud desk number",
        result: "Number matches a real bank branch line. Even the hold music is real.",
        correct: true,
      },
      {
        text: "🔎 Check the charge amount format",
        result: "'INR 42,880' — exactly how your bank writes amounts in SMS.",
        correct: true,
      },
    ],
    callout: "Every fact-check will CONFIRM his story. The scam is built from true facts.",
  },
  {
    msg: "I need you to read me the OTP that just arrived — that BLOCKS the fraudulent transaction. If you don't read it in 90 seconds it goes through and we can't reverse it.",
    choices: [
      {
        text: "Read him the OTP — the resort was real, this is legit",
        result: "You handed the boss your account. Loss: PKR 480,000. He was never at your bank.",
        correct: false,
      },
      {
        text: "Hang up. Call the number printed on the back of your physical card.",
        result:
          "Your bank has no fraud alert on file. No Bali charges exist. The call was the scam.",
        correct: true,
      },
      {
        text: "Ask him to send an official email first",
        result:
          "He sends one — from bank-fraud-desk@gmail.com. You almost trust the domain. Almost.",
        correct: false,
      },
    ],
  },
];

function Beat2Boss({
  onNext,
  reducedMotion,
  director,
}: {
  onNext: () => void;
  reducedMotion: boolean;
  director: boolean;
}) {
  const skin = CHAT_SKINS.whatsapp;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [showDoctrine, setShowDoctrine] = useState(false);

  const current = BOSS_STEPS[step];
  const advance = () => {
    setPicked(null);
    if (step + 1 < BOSS_STEPS.length) setStep(step + 1);
    else setShowDoctrine(true);
  };

  const pick = (i: number) => {
    setPicked(i);
    setPressedIdx(null);
    if (step === 1 && current.choices[i].correct) {
      setTimeout(() => setShowCall(true), reducedMotion ? 60 : 400);
    }
  };

  // Director auto-play
  useEffect(() => {
    if (!director || showDoctrine) return;
    if (picked !== null) return;
    const readMs = step === 0 ? DIRECTOR_TIMINGS.beat2_step0_read : DIRECTOR_TIMINGS.beat2_step1_read;
    const pickMs = step === 0 ? DIRECTOR_TIMINGS.beat2_step0_pick : DIRECTOR_TIMINGS.beat2_step1_pick;
    // step 0: first correct fact-check (idx 0). step 1: hang-up (idx 1).
    const targetIdx = step === 0 ? 0 : 1;
    const t1 = setTimeout(
      () => setPressedIdx(targetIdx),
      readMs + pickMs - DIRECTOR_TIMINGS.beat1_press,
    );
    const t2 = setTimeout(() => pick(targetIdx), readMs + pickMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [director, step, picked, showDoctrine]);

  useEffect(() => {
    if (!director || picked === null || showDoctrine) return;
    if (showCall) {
      const t = setTimeout(() => setShowCall(false), DIRECTOR_TIMINGS.beat2_callHold);
      return () => clearTimeout(t);
    }
    const advMs =
      step === 0 ? DIRECTOR_TIMINGS.beat2_step0_advance : DIRECTOR_TIMINGS.beat2_doctrineAdvance;
    const t = setTimeout(advance, advMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [director, picked, showCall, showDoctrine, step]);

  useEffect(() => {
    if (!director || !showDoctrine) return;
    const t = setTimeout(onNext, DIRECTOR_TIMINGS.beat2_doctrineHold);
    return () => clearTimeout(t);
  }, [director, showDoctrine, onNext]);

  return (
    <section aria-label="Beat 2 of 5 — Meet a boss">
      <div className="mb-3 text-center stencil text-[10px] tracking-[0.3em] text-white/60">
        BEAT 2 / 5 · <span className="text-primary">THE GHOST OF BALI</span>
      </div>

      {!showDoctrine && (
        <div className="mx-auto w-full max-w-[420px]">
          <ChatShell
            header={
              <ChatHeader
                name="Kamran · Bank Fraud Desk"
                number="+92 21 111 222 333"
                isSaved={false}
                subtitle="claims to be your bank"
                accent="destructive"
                chrome={skin.headerClass}
              />
            }
          >
            <div
              className={`flex-1 overflow-y-auto px-3 py-3 space-y-2 ${skin.bodyClass}`}
              style={skin.bodyStyle}
            >
              {skin.systemNote && (
                <div className="flex justify-center">
                  <div className="max-w-[90%] rounded-md bg-black/50 border border-white/10 px-3 py-1.5 text-center text-[10px] leading-relaxed text-emerald-200/70">
                    🔒 {skin.systemNote}
                  </div>
                </div>
              )}
              <div className="flex justify-start">
                <div className={`max-w-[85%] px-3 py-2 text-sm shadow-sm ${skin.inBubble}`}>
                  {current.msg}
                </div>
              </div>
              {picked !== null && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <Search className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>{current.choices[picked].result}</span>
                  </div>
                </div>
              )}
              {current.callout && picked !== null && step === 0 && (
                <div className="rounded-md border border-caution/60 bg-caution/10 p-3 text-xs text-caution">
                  <b>NOTICE:</b> {current.callout}
                </div>
              )}
            </div>
            <div className="border-t border-white/10 bg-neutral-950 p-2 space-y-1.5">
              <div className="stencil text-[9px] tracking-[0.25em] text-white/40 px-1">
                {picked === null
                  ? step === 0
                    ? "PICK A FACT-CHECK"
                    : "PICK YOUR PROTOCOL"
                  : "RESULT"}
              </div>
              {picked === null ? (
                current.choices.map((c, i) => {
                  const pressed = pressedIdx === i;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      aria-pressed={pressed}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm text-white transition-colors ${
                        pressed
                          ? "border-primary bg-primary/20 ring-1 ring-primary/60"
                          : "border-white/15 bg-neutral-900 hover:bg-neutral-800"
                      }`}
                    >
                      {c.text}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={advance}
                  autoFocus
                  className="w-full rounded-md bg-primary px-3 py-2 stencil text-xs tracking-[0.3em] text-primary-foreground"
                >
                  {step + 1 < BOSS_STEPS.length ? "CONTINUE →" : "SEE THE DOCTRINE →"}
                </button>
              )}
            </div>
            {showCall && (
              <CallScreen
                open
                contactName="Bank (card back)"
                contactNumber="+92 21 111 000 111"
                resultLine="No fraud alert on file. No Bali charges. There is no Kamran here."
                onEnd={() => setShowCall(false)}
                reducedMotion={reducedMotion}
              />
            )}
          </ChatShell>
        </div>
      )}

      {showDoctrine && (
        <div className="mx-auto max-w-lg space-y-3">
          <div className="rounded-lg border-2 border-primary/60 bg-primary/10 p-5">
            <div className="stencil text-[10px] tracking-[0.3em] text-primary">
              DOCTRINE DECLASSIFIED
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white">
              {DOCTRINE_RULES.map((d) => (
                <li key={d.n} className="flex gap-2">
                  <span className="stencil text-primary">§{d.n}</span>
                  <span>{d.rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-center text-xs text-white/70">
            Fact-checking as taught today <b>fails</b> at boss level. Protocol wins.{" "}
            <span className="text-primary">That's the graduate lesson.</span>
          </p>
          <button
            onClick={onNext}
            autoFocus
            className="w-full rounded-md bg-primary px-4 py-3 stencil text-xs tracking-[0.3em] text-primary-foreground"
          >
            NEXT: THE CITY IS BIGGER →
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- BEAT 3 — THE CITY IS BIGGER (honest evidence only) ----------
 * Panels are gated at authoring time — each entry names its backing file.
 * When any candidate's file is removed from the repo, delete the entry here
 * in the same change. Order is honored; cap 6. This gate is a discipline, not
 * runtime feature-detection (the sandbox does zero I/O).
 */

interface CityPanel {
  icon: typeof Newspaper;
  title: string;
  body: string;
}

// Always-on
const PANEL_MIRROR_FEED: CityPanel = {
  icon: Users,
  title: "THE MIRROR & THE FEED",
  body: "Two districts. Personal cons and public lies. Both die the same way.",
};
const PANEL_DROP: CityPanel = {
  icon: Coins,
  title: "THE DAILY DROP",
  body: "One case a day. Stake your trust, build your streak.",
};
// Conditional (backing files verified present in this repo at authoring time)
const PANEL_BOARD: CityPanel = {
  // src/routes/board.tsx
  icon: Trophy,
  title: "THE CITY BOARD",
  body: "Classroom leaderboards with no names. Callsigns only. Dark below five citizens — privacy is a feature.",
};
const PANEL_SUPPLEMENT: CityPanel = {
  // src/lib/paper/supplement.ts
  icon: Newspaper,
  title: "THE SUNDAY SUPPLEMENT",
  body: "Once a week the Paper prints your week. Circulation: 1.",
};
const PANEL_REOPENED: CityPanel = {
  // src/lib/mirror/retests.ts
  icon: Repeat,
  title: "REOPENED FILES",
  body: "Lose a case and the city checks back days later with the same trick in new clothes.",
};
const PANEL_SURVIVOR: CityPanel = {
  // src/lib/mirror/aftermath.ts
  icon: HeartPulse,
  title: "SURVIVOR FILES",
  body: "Two cases drawn from reported scams end quiet, with the day-after steps that matter.",
};
const PANEL_FIRSTPHONE: CityPanel = {
  icon: GraduationCap,
  title: "FIRST PHONE",
  body: "Ten lessons for the youngest citizens. Then the phone's theirs.",
};

const CITY_PANELS: CityPanel[] = (() => {
  const list = [
    PANEL_MIRROR_FEED,
    PANEL_DROP,
    PANEL_BOARD,
    PANEL_SUPPLEMENT,
    PANEL_REOPENED,
    PANEL_SURVIVOR,
    PANEL_FIRSTPHONE,
  ];
  // FIRST PHONE is the required tail; trim from the middle if over cap.
  if (list.length <= 6) return list;
  return [...list.slice(0, 5), PANEL_FIRSTPHONE];
})();

function Beat3City({
  onNext,
  reducedMotion,
  director,
}: {
  onNext: () => void;
  reducedMotion: boolean;
  director: boolean;
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const dwell = director ? DIRECTOR_TIMINGS.beat3_perPanel : 6500;
  useEffect(() => {
    if ((paused && !director) || reducedMotion) return;
    if (i >= CITY_PANELS.length - 1) return;
    const t = setTimeout(() => setI((x) => x + 1), dwell);
    return () => clearTimeout(t);
  }, [i, paused, reducedMotion, dwell, director]);

  // Director advance to Beat 4 after the final panel dwells.
  useEffect(() => {
    if (!director) return;
    if (i < CITY_PANELS.length - 1) return;
    const t = setTimeout(onNext, dwell + DIRECTOR_TIMINGS.beat3_advance);
    return () => clearTimeout(t);
  }, [director, i, dwell, onNext]);

  return (
    <section aria-label="Beat 3 of 5 — The city is bigger">
      <div className="mb-3 text-center stencil text-[10px] tracking-[0.3em] text-white/60">
        BEAT 3 / 5 · <span className="text-primary">THE CITY IS BIGGER</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CITY_PANELS.map((p, idx) => {
          const Icon = p.icon;
          const active = idx === i;
          return (
            <div
              key={p.title}
              className={`rounded-lg border p-4 transition-all ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-white/10 bg-neutral-950 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-white/40"}`} />
                <div className="stencil text-[10px] tracking-[0.25em]">{p.title}</div>
              </div>
              <p className="mt-2 text-sm text-white/80">{p.body}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded border border-white/15 px-2 py-1 stencil text-[10px] text-white/60 hover:bg-white/10"
        >
          {paused ? "RESUME AUTO-ADVANCE" : "PAUSE"}
        </button>
        <div className="stencil text-[10px] tracking-widest text-white/40">
          {i + 1} / {CITY_PANELS.length}
        </div>
        {i < CITY_PANELS.length - 1 ? (
          <button
            onClick={() => setI((x) => Math.min(x + 1, CITY_PANELS.length - 1))}
            className="rounded border border-white/15 px-2 py-1 stencil text-[10px] text-white/60 hover:bg-white/10"
          >
            NEXT PANEL →
          </button>
        ) : (
          <button
            onClick={onNext}
            autoFocus
            className="rounded-md bg-primary px-3 py-2 stencil text-[10px] tracking-[0.3em] text-primary-foreground"
          >
            NEXT: THE LICENSE →
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- BEAT 4 — THE LICENSE ---------- */

function Beat4License({ onNext, director }: { onNext: () => void; director: boolean }) {
  useEffect(() => {
    if (!director) return;
    const t = setTimeout(onNext, DIRECTOR_TIMINGS.beat4_hold);
    return () => clearTimeout(t);
  }, [director, onNext]);
  return (
    <section aria-label="Beat 4 of 5 — The license">
      <div className="mb-3 text-center stencil text-[10px] tracking-[0.3em] text-white/60">
        BEAT 4 / 5 · <span className="text-primary">THE FIRST PHONE LICENSE</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-neutral-950 p-5">
          <div className="stencil text-[10px] tracking-[0.3em] text-primary">
            DRIVER'S ED — FOR PHONES
          </div>
          <p className="mt-2 text-sm text-white/80">
            10 lessons. Each one costs 30 seconds. Each one names a tactic. The child graduates with
            a <b>license</b> — not a lecture.
          </p>
          <ol className="mt-4 grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              "Stranger DM",
              "OTP Ask",
              "Deepfake voice",
              "Prize scam",
              "Group pressure",
              "Fake login",
              "Screenshot lie",
              "Deadline urgency",
              "Fake charity",
              "Family imposter",
            ].map((l, i) => (
              <li
                key={l}
                className="flex items-center gap-1.5 rounded border border-white/10 bg-neutral-900 px-2 py-1"
              >
                <span className="stencil text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-white/80">{l}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative overflow-hidden rounded-lg border-2 border-primary/50 bg-gradient-to-br from-neutral-900 to-black p-5">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
            <div className="stencil rotate-[-18deg] text-6xl tracking-[0.4em] text-primary">
              SPECIMEN
            </div>
          </div>
          <div className="stencil text-[10px] tracking-[0.3em] text-primary">
            FIRST PHONE LICENSE
          </div>
          <div className="mt-2 flex items-start gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/60 bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Aisha K.</div>
              <div className="font-mono text-[11px] text-white/60">LIC-FPL-000-042 · Class J</div>
              <div className="mt-1 stencil text-[9px] tracking-widest text-emerald-300">
                CERTIFIED · 10/10 LESSONS
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-3 text-[10px] font-mono text-white/50">
            Issued by MILVERSE · valid where trust must be earned
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-sm italic text-white/85">
        Other tools <b>childproof</b> the phone. MILVERSE{" "}
        <b className="text-primary">phone-proofs the child.</b>
      </p>

      <div className="mt-5 rounded-lg border border-white/10 bg-neutral-950 p-4">
        <div className="stencil text-[10px] tracking-[0.3em] text-white/60 mb-3">ACCESS LADDER</div>
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <LadderCard icon={Sparkles} label="CINEMATIC WEB" note="fast connection" />
          <LadderCard icon={Phone} label="LITE / POTATO" note="any phone" />
          <LadderCard icon={Printer} label="FIELD KIT PRINT" note="no signal" />
          <LadderCard icon={GraduationCap} label="FIRST PHONE" note="the license path" />
        </div>
        <p className="mt-3 text-center text-xs text-white/60">
          <span className="text-primary">Truth is not a premium feature.</span>
        </p>
      </div>

      <button
        onClick={onNext}
        autoFocus
        className="mt-6 w-full rounded-md bg-primary px-4 py-3 stencil text-xs tracking-[0.3em] text-primary-foreground"
      >
        FINAL BEAT →
      </button>
    </section>
  );
}

function LadderCard({
  icon: Icon,
  label,
  note,
}: {
  icon: typeof Sparkles;
  label: string;
  note: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-neutral-900 p-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <div className="mt-1 stencil text-[10px] tracking-widest text-white">{label}</div>
      <div className="text-[10px] text-white/50">{note}</div>
    </div>
  );
}

/* ---------- BEAT 5 — DEPARTURE ---------- */

function Beat5Departure() {
  return (
    <section aria-label="Beat 5 of 5 — Departure" className="mt-6">
      <div className="mb-3 text-center stencil text-[10px] tracking-[0.3em] text-white/60">
        BEAT 5 / 5 · <span className="text-primary">DEPARTURE</span>
      </div>
      <div className="rounded-lg border border-primary/50 bg-primary/5 p-6 text-center">
        <p className="mx-auto max-w-2xl text-base text-white sm:text-lg">
          <b>MILVERSE</b> turns media &amp; information literacy into a <b>city you walk through</b>{" "}
          — and graduates kids into their first phone with a <b className="text-primary">license</b>{" "}
          instead of a lecture.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ExitDoor to="/" label="PLAY THE FULL CITY" hint="all of it, live" primary />
        <ExitDoor to="/educators" label="FOR EDUCATORS" hint="curriculum + pilot notes" />
        <ExitDoor to="/charter" label="THE CHARTER" hint="what we promise the player" />
        <ExitDoor to="/review" label="THE PILOT DATA" hint="live during pilot" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="stencil rounded border-2 border-primary/70 bg-primary/10 px-5 py-3 text-lg tracking-[0.4em] text-primary">
          TRAIN YOUR TRUST
        </div>
      </div>
    </section>
  );
}

function ExitDoor({
  to,
  label,
  hint,
  primary,
}: {
  to: string;
  label: string;
  hint: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-lg border p-4 transition-colors ${
        primary
          ? "border-primary bg-primary/15 hover:bg-primary/25"
          : "border-white/15 bg-neutral-950 hover:bg-neutral-900"
      }`}
    >
      <div
        className={`stencil text-[10px] tracking-[0.3em] ${primary ? "text-primary" : "text-white/70"}`}
      >
        {label} →
      </div>
      <div className="mt-1 text-xs text-white/60">{hint}</div>
    </Link>
  );
}

// Retain unused import placeholder for the boss title constant to keep the
// SCAM_TITLE identifier live for future non-visual reference in the tour edit.
void SCAM_TITLE;
void FileText;

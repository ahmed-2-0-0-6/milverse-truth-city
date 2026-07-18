// /visit — A GUIDED VISIT TO THE CITY. Judges/educators/press. ~3 min, 5 beats.
// ZERO cloud, ZERO AI, ZERO real-profile writes. All content hardcoded below.
// Reuses existing ChatShell/ChatHeader/CallScreen/VerdictMoment components.
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
} from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { CallScreen } from "@/components/chat/CallScreen";
import { VerdictMoment, type CalibrationOutcome } from "@/components/VerdictMoment";
import { useVisualMode } from "@/lib/visual-quality";
import { DOCTRINE_RULES } from "@/lib/boss/doctrine";

export const Route = createFileRoute("/visit")({
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
  const [beat, setBeat] = useState<Beat>(0);
  const reducedMotion = usePrefersReducedMotion();

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

  return (
    <div className="min-h-[100dvh] bg-black text-white grain">
      <TourChrome beat={beat} onSkip={skip} onLeave={leave} />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4">
        {beat === 0 && <Beat0Arrival onNext={next} />}
        {beat === 1 && <Beat1Scam onNext={next} reducedMotion={reducedMotion} />}
        {beat === 2 && <Beat2Boss onNext={next} reducedMotion={reducedMotion} />}
        {beat === 3 && <Beat3City onNext={next} reducedMotion={reducedMotion} />}
        {beat === 4 && <Beat4License onNext={next} />}
        {beat === 5 && <Beat5Departure />}
      </main>
    </div>
  );
}

/* ---------- Chrome: progress dots, skip, leave ---------- */

function TourChrome({
  beat,
  onSkip,
  onLeave,
}: {
  beat: Beat;
  onSkip: () => void;
  onLeave: () => void;
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
        {beat < 5 && (
          <button
            onClick={onSkip}
            className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 stencil text-[10px] text-white/70 hover:bg-white/10"
            aria-label="Skip this beat"
          >
            SKIP <SkipForward className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={onLeave}
          className="flex items-center gap-1 rounded border border-white/15 px-2 py-1 stencil text-[10px] text-white/70 hover:bg-white/10"
          aria-label="Leave the tour"
        >
          LEAVE <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ---------- BEAT 0 — ARRIVAL ---------- */

function Beat0Arrival({ onNext }: { onNext: () => void }) {
  return (
    <section className="relative mt-10 overflow-hidden rounded-lg border border-white/10 text-center sm:mt-16">
      {/* night-arrival backdrop: runway glow + skyline bars, pure CSS */}
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
      {/* skyline silhouette — repeating vertical bars along the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 opacity-60 pointer-events-none"
        aria-hidden
        style={{
          background:
            "repeating-linear-gradient(90deg, oklch(0.1 0.02 255) 0 22px, transparent 22px 30px, oklch(0.12 0.02 255) 30px 58px, transparent 58px 66px)",
          maskImage: "linear-gradient(0deg, black 55%, transparent 100%)",
        }}
      />
      {/* lit windows */}
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

/* ---------- BEAT 1 — GET SCAMMED (Mirror micro-case) ---------- */

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
      { text: "This is an imposter pattern. Blocking + reporting to Sana on Slack.", smart: true },
    ],
  },
];

function Beat1Scam({ onNext, reducedMotion }: { onNext: () => void; reducedMotion: boolean }) {
  const [turn, setTurn] = useState(0);
  const [log, setLog] = useState<{ from: "contact" | "you"; text: string }[]>([
    { from: "contact", text: SCAM_SCRIPT[0].contact },
  ]);
  const [confidence, setConfidence] = useState(75);
  const [pickedSmart, setPickedSmart] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<"chat" | "verdict" | "stamp" | "debrief">("chat");
  const [verdict, setVerdict] = useState<"REAL" | "FAKE" | null>(null);
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

  const outcome: CalibrationOutcome =
    verdict === "FAKE" ? "correct" : verdict === "REAL" ? "missed_scam" : "correct";

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
                subtitle="unknown number · claims to be Sana"
              />
            }
          >
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {log.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "you"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-neutral-800 text-white rounded-bl-sm border border-white/5"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={logEnd} />
            </div>
            {phase === "chat" && (
              <div className="border-t border-white/10 bg-neutral-950 p-2 space-y-1.5">
                <div className="stencil text-[9px] tracking-[0.25em] text-white/40 px-1">
                  CHOOSE YOUR REPLY
                </div>
                {SCAM_SCRIPT[turn].choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className="w-full rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-left text-sm text-white hover:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            )}
            {phase === "verdict" && (
              <div className="border-t border-white/10 bg-neutral-950 p-3 space-y-3">
                <div className="stencil text-[10px] tracking-[0.3em] text-caution">
                  CALL IT — REAL OR FAKE?
                </div>
                <div>
                  <label className="mb-1 flex items-center justify-between stencil text-[9px] tracking-widest text-white/50">
                    <span>CONFIDENCE</span>
                    <span>{confidence}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={confidence}
                    onChange={(e) => setConfidence(parseInt(e.target.value))}
                    className="w-full accent-primary"
                    aria-label="Confidence percent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setVerdict("REAL");
                      setPhase("stamp");
                    }}
                    className="rounded-md border-2 border-white/15 px-3 py-2 stencil text-xs tracking-widest hover:border-primary/50"
                  >
                    REAL
                  </button>
                  <button
                    onClick={() => {
                      setVerdict("FAKE");
                      setPhase("stamp");
                    }}
                    className="rounded-md border-2 border-white/15 px-3 py-2 stencil text-xs tracking-widest hover:border-destructive/50"
                  >
                    FAKE
                  </button>
                </div>
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
              signature. Verdict: <b>{verdict}</b> · Confidence: <b>{confidence}%</b> ·
              Smart-question rate: <b>{Math.round(smartRate * 100)}%</b>.
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

/* ---------- BEAT 2 — MEET A BOSS (Ghost of Bali excerpt) ---------- */

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

function Beat2Boss({ onNext, reducedMotion }: { onNext: () => void; reducedMotion: boolean }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showCall, setShowCall] = useState(false);
  const [showDoctrine, setShowDoctrine] = useState(false);

  const current = BOSS_STEPS[step];
  const advance = () => {
    setPicked(null);
    if (step + 1 < BOSS_STEPS.length) setStep(step + 1);
    else setShowDoctrine(true);
  };

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
              />
            }
          >
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-800 border border-white/5 px-3 py-2 text-sm text-white">
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
                current.choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPicked(i);
                      // "Call his saved number yourself" trigger
                      if (step === 1 && c.correct) {
                        setTimeout(() => setShowCall(true), reducedMotion ? 60 : 400);
                      }
                    }}
                    className="w-full rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-left text-sm text-white hover:bg-neutral-800"
                  >
                    {c.text}
                  </button>
                ))
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

/* ---------- BEAT 3 — THE CITY IS BIGGER (auto-advancing panels) ---------- */

const CITY_PANELS = [
  {
    icon: Newspaper,
    title: "THE PAPER",
    body: "A daily newspaper where every story is false — published by a live human newsroom. Spot the forgery on the front page.",
  },
  {
    icon: BookOpen,
    title: "FIELD MANUAL",
    body: "Every tactic you name enters your Manual. A personal, growing dictionary of manipulation.",
  },
  {
    icon: Coins,
    title: "AAJ KA FORWARD",
    body: "Daily wager. Verify one viral forward. Winners take receipts; losers learn faster.",
  },
  {
    icon: Users,
    title: "STUDIO → ARCHIVE",
    body: "Players design the city's next cases. The community authors the curriculum.",
  },
];

function Beat3City({ onNext, reducedMotion }: { onNext: () => void; reducedMotion: boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || reducedMotion) return;
    if (i >= CITY_PANELS.length - 1) return;
    const t = setTimeout(() => setI((x) => x + 1), 6500);
    return () => clearTimeout(t);
  }, [i, paused, reducedMotion]);

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

function Beat4License({ onNext }: { onNext: () => void }) {
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

        {/* Specimen license */}
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

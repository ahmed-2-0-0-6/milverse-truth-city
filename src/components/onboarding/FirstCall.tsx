import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare, Phone, X } from "lucide-react";
import { MIRROR_SCRIPT } from "@/lib/tour/script";

const FIRST_CALL_KEY = "milverse.firstcall";

type Beat = "framing" | "ring" | "drill" | "outro";
type Outro = "correct" | "wrong" | "declined";

interface FirstCallProps {
  onDone: () => void;
}

/**
 * FirstCall — the first 90 seconds of MILVERSE for a brand-new citizen.
 * Replaces the old three-slide philosophy Intro for anyone without
 * INTRO_KEY. Runs the Sana imposter drill from src/lib/tour/script.ts as
 * a TRAINING LINE — never touches the real mirror profile, XP, or lean.
 */
export function FirstCall({ onDone }: FirstCallProps) {
  const navigate = useNavigate();
  const [beat, setBeat] = useState<Beat>("framing");
  const [outro, setOutroState] = useState<Outro>("declined");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-advance beat 1 after 2.5s (skipped by tap/click).
  // Reduced-motion / high-legibility: no auto-advance — user taps.
  useEffect(() => {
    if (beat !== "framing") return;
    if (typeof window === "undefined") return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-high-legibility") === "on";
    if (reduce) return;
    const t = window.setTimeout(() => setBeat("ring"), 2500);
    return () => window.clearTimeout(t);
  }, [beat]);

  // Focus the dialog on mount + on every beat change so keyboard users
  // land somewhere predictable.
  useEffect(() => {
    dialogRef.current?.focus();
  }, [beat]);

  // Escape at any beat = NOT NOW path.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOutroState("declined");
        setBeat("outro");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function markDrill(verdict: "REAL" | "FAKE") {
    const correct = verdict === "FAKE";
    try {
      localStorage.setItem(
        FIRST_CALL_KEY,
        JSON.stringify({ verdict, correct, ts: Date.now() }),
      );
    } catch {
      /* localStorage unavailable */
    }
    setOutroState(correct ? "correct" : "wrong");
    setBeat("outro");
  }

  function finish(dest?: "/mirror" | "/drop") {
    onDone();
    if (dest) {
      // Defer navigation a tick so the overlay unmounts first.
      setTimeout(() => navigate({ to: dest }), 0);
    }
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-label="First call"
      aria-modal="true"
      className="fixed inset-0 z-[150] bg-black text-white outline-none overflow-y-auto"
    >
      {beat === "framing" && <FramingBeat onNext={() => setBeat("ring")} />}
      {beat === "ring" && (
        <RingBeat
          onOpen={() => setBeat("drill")}
          onDecline={() => {
            setOutroState("declined");
            setBeat("outro");
          }}
        />
      )}
      {beat === "drill" && (
        <DrillBeat
          onVerdict={markDrill}
          onEscape={() => {
            setOutroState("declined");
            setBeat("outro");
          }}
        />
      )}
      {beat === "outro" && <OutroBeat outro={outro} onChoose={finish} />}
    </div>
  );
}

/* ────────────────────────── BEAT 1 ────────────────────────── */

function FramingBeat({ onNext }: { onNext: () => void }) {
  return (
    <button
      type="button"
      onClick={onNext}
      className="fc-fade-in group absolute inset-0 flex flex-col items-center justify-center px-6 text-center focus:outline-none"
      aria-label="Continue"
    >
      <div className="stencil text-[10px] text-cyan-300 mb-8">// EDITORIAL BRIEFING</div>
      <div
        className="max-w-2xl text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        Lies come in two sizes: aimed at millions — and aimed at just you.
      </div>
      <div className="absolute bottom-8 stencil text-[10px] text-white/50 group-hover:text-white/80">
        TAP TO CONTINUE
      </div>
    </button>
  );
}

/* ────────────────────────── BEAT 2 ────────────────────────── */

function RingBeat({ onOpen, onDecline }: { onOpen: () => void; onDecline: () => void }) {
  return (
    <div className="fc-fade-in absolute inset-0 flex flex-col items-center justify-center px-6">
      <button
        type="button"
        onClick={onDecline}
        aria-label="Not now"
        className="absolute top-4 right-4 stencil text-[10px] text-white/50 hover:text-white/90 px-3 py-2"
      >
        <X className="inline h-3 w-3 mr-1" />
        NOT NOW
      </button>
      <div className="stencil text-[10px] text-white/50 mb-4">// INCOMING</div>
      <div className="fc-notif w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/60">
              <span>SANA · SMS</span>
              <span>now</span>
            </div>
            <div className="mt-0.5 text-sm text-white truncate">
              Hi — it's Sana. Lost my phone, this is a temp number…
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-8 rounded-md bg-primary px-8 py-3 font-mono text-xs tracking-widest text-primary-foreground border-2 border-primary shadow-[0_4px_20px_oklch(0.82_0.14_195/0.35)]"
        autoFocus
      >
        OPEN IT →
      </button>
    </div>
  );
}

/* ────────────────────────── BEAT 3 ────────────────────────── */

function DrillBeat({
  onVerdict,
  onEscape,
}: {
  onVerdict: (v: "REAL" | "FAKE") => void;
  onEscape: () => void;
}) {
  const [i, setI] = useState(0);
  const [verdict, setVerdict] = useState<"REAL" | "FAKE" | null>(null);
  const [asking, setAsking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const shown = MIRROR_SCRIPT.slice(0, i + 1);
  const current = MIRROR_SCRIPT[i];
  const last = i + 1 >= MIRROR_SCRIPT.length;

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [i, asking, verdict]);

  return (
    <div className="fc-fade-in mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-3 flex items-center justify-between">
        <div className="stencil text-[10px] tracking-[0.3em] text-cyan-300">
          TRAINING LINE · NOT SCORED
        </div>
        <button
          type="button"
          onClick={onEscape}
          className="stencil text-[10px] text-white/40 hover:text-white/80 px-2 py-1"
          aria-label="Not now"
        >
          <X className="inline h-3 w-3 mr-1" />
          NOT NOW
        </button>
      </div>

      <div className="mb-3 rounded-md border border-caution/30 bg-caution/5 p-3 text-xs text-white/80">
        <div className="font-mono text-[10px] tracking-widest text-caution mb-1">
          DOSSIER · WHAT YOU KNOW
        </div>
        <ul className="space-y-0.5">
          <li>· Sana never texts after 6pm — she always calls.</li>
          <li>
            · Sana's real number ends in <b className="text-white">4472</b>.
          </li>
          <li>· Company uses Slack, not SMS.</li>
        </ul>
      </div>

      {current?.meter !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/60">
            <span>THE LINE</span>
            <span>{current.meter}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all duration-500 ${
                current.meter > 60
                  ? "bg-primary"
                  : current.meter > 30
                    ? "bg-caution"
                    : "bg-destructive"
              }`}
              style={{ width: `${current.meter}%` }}
            />
          </div>
        </div>
      )}

      <div
        ref={scroller}
        className="rounded-lg border border-white/10 bg-white/[0.03] p-4 min-h-[240px] max-h-[340px] overflow-y-auto space-y-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {shown.map((m, idx) => {
          if (m.from === "system") {
            return (
              <div
                key={idx}
                className="text-center text-xs font-mono text-primary tracking-widest"
              >
                — {m.text} —
              </div>
            );
          }
          const isPlayer = m.from === "player";
          return (
            <div
              key={idx}
              className={`msg-in flex ${isPlayer ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  isPlayer
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : m.isTell
                      ? "bg-caution/10 border border-caution/40 text-white rounded-bl-sm"
                      : "bg-white/[0.06] border border-white/10 text-white rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      {current?.tip && !asking && !verdict && (
        <div className="mt-3 rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-white/85">
          <div className="font-mono text-[10px] tracking-widest text-primary mb-1">GUIDE</div>
          {current.tip}
        </div>
      )}

      {!asking && verdict === null && (
        <button
          type="button"
          onClick={() => {
            if (last) setAsking(true);
            else setI(i + 1);
          }}
          autoFocus
          className="mt-4 w-full rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
        >
          {last ? "MAKE YOUR CALL" : "NEXT MESSAGE →"}
        </button>
      )}

      {asking && verdict === null && (
        <div className="mt-4">
          <div className="font-mono text-xs tracking-[0.3em] text-caution mb-2">
            REAL OR FAKE?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setVerdict("REAL");
                onVerdict("REAL");
              }}
              className="rounded-md border-2 border-white/20 p-4 font-mono tracking-widest text-white hover:border-primary/60"
            >
              REAL
            </button>
            <button
              type="button"
              onClick={() => {
                setVerdict("FAKE");
                onVerdict("FAKE");
              }}
              className="rounded-md border-2 border-white/20 p-4 font-mono tracking-widest text-white hover:border-destructive/60"
            >
              FAKE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── BEAT 4 ────────────────────────── */

function OutroBeat({
  outro,
  onChoose,
}: {
  outro: Outro;
  onChoose: (dest?: "/mirror" | "/drop") => void;
}) {
  const headline =
    outro === "correct"
      ? "You just worked your first line."
      : outro === "wrong"
        ? "That one stings. Good."
        : "The city can wait. The scammers won't.";

  const sub =
    outro === "correct"
      ? "Question, verify, then decide. The city runs on that reflex. Everything in here is a rep."
      : outro === "wrong"
        ? "You just met the tactic in a safe room. The city exists so the real one bounces off you."
        : "Two districts. Real tactics, fictional people. Verify your way through.";

  return (
    <div className="fc-fade-in min-h-full flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="stencil text-[10px] text-cyan-300 mb-6">
        {outro === "correct" ? "// CALIBRATED" : outro === "wrong" ? "// LESSON LOGGED" : "// AT EASE"}
      </div>
      <h1
        className="max-w-2xl text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        {headline}
      </h1>
      <p className="mt-4 max-w-xl text-sm sm:text-base text-white/70">{sub}</p>

      <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onChoose("/mirror")}
          autoFocus
          className="group rounded-lg border border-white/15 bg-white/[0.04] p-4 text-left hover:border-primary/60 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2 stencil text-[10px] tracking-widest text-primary">
            <MessageSquare className="h-3 w-3" />
            THE MIRROR
          </div>
          <div className="mt-2 text-sm text-white">where that text came from</div>
        </button>
        <button
          type="button"
          onClick={() => onChoose("/drop")}
          className="group rounded-lg border border-white/15 bg-white/[0.04] p-4 text-left hover:border-primary/60 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2 stencil text-[10px] tracking-widest text-primary">
            <Phone className="h-3 w-3" />
            TODAY'S DROP
          </div>
          <div className="mt-2 text-sm text-white">one call a day</div>
        </button>
        <button
          type="button"
          onClick={() => onChoose()}
          className="group rounded-lg border border-white/15 bg-white/[0.04] p-4 text-left hover:border-white/40 hover:bg-white/[0.08] transition-colors"
        >
          <div className="stencil text-[10px] tracking-widest text-white/60">
            JUST SHOW ME THE CITY
          </div>
          <div className="mt-2 text-sm text-white/80">dismiss to the map</div>
        </button>
      </div>
    </div>
  );
}

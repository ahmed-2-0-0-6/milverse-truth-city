// LIVE BAIT — the landing page's first move.
// A scam text starts typing the moment the page loads. Before any
// marketing, before the hero, before the scroll story. The visitor
// has to answer REAL or SCAM. Then the truth reveals, a "time stolen"
// counter starts ticking, and only then does Milverse introduce itself.
//
// Presentation only. No backend. No accounts. Once answered this
// session, it stays folded (via sessionStorage) so scrolling doesn't
// replay it, but a fresh tab always gets the punch.

import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Check, X, ArrowRight } from "lucide-react";

const SEEN_KEY = "milverse.livebait.seen.v1";

// The pretext. Written to feel like a real Pakistani smishing attempt:
// urgency window, fake authority, "reply to prevent" pressure. No real
// bank name is used verbatim — it's a plausible composite.
const SCRIPT = [
  { who: "sys", text: "SMS · +92 300 ••• ••42" },
  {
    who: "them",
    text:
      "Assalamu alaikum. This is HBL Security Desk. 3 login attempts detected on your account from an unknown device in Karachi. Was this you? Reply YES / NO in 5 mins to prevent lockout. Ref: 8842-KHI.",
  },
];

const REVEAL = {
  title: "SCAM.",
  spine: "That's a smishing pretext.",
  tells: [
    "Real banks never threaten a 5-minute lockout by SMS.",
    "Real banks never ask you to reply YES / NO to a text.",
    "The number is a mobile line, not a bank shortcode.",
  ],
};

export function LiveBait({ onDismiss }: { onDismiss?: () => void }) {
  const [phase, setPhase] = useState<"boot" | "typing" | "asking" | "reveal">("boot");
  const [typed, setTyped] = useState("");
  const [answered, setAnswered] = useState<"real" | "scam" | null>(null);
  const [stolen, setStolen] = useState(0);
  const startedAt = useRef<number>(0);
  const dismissed = useRef(false);

  useEffect(() => {
    let alive = true;
    const boot = window.setTimeout(() => alive && setPhase("typing"), 350);
    return () => {
      alive = false;
      window.clearTimeout(boot);
    };
  }, []);

  useEffect(() => {
    if (phase !== "typing") return;
    startedAt.current = Date.now();
    const full = SCRIPT[1].text;
    let i = 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(full);
      setPhase("asking");
      return;
    }
    const id = window.setInterval(() => {
      i += 2;
      if (i >= full.length) {
        setTyped(full);
        window.clearInterval(id);
        window.setTimeout(() => setPhase("asking"), 400);
      } else {
        setTyped(full.slice(0, i));
      }
    }, 22);
    return () => window.clearInterval(id);
  }, [phase]);

  // Time-stolen counter starts the moment they hit an answer.
  useEffect(() => {
    if (phase !== "reveal") return;
    const base = Math.max(3, Math.round((Date.now() - startedAt.current) / 1000));
    setStolen(base);
    const id = window.setInterval(() => setStolen((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  function answer(pick: "real" | "scam") {
    setAnswered(pick);
    setPhase("reveal");
  }

  function dismiss() {
    if (dismissed.current) return;
    dismissed.current = true;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    onDismiss?.();
  }

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* THE PHONE */}
      <div
        className={`live-bait-phone relative rounded-[28px] p-1 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] bg-gradient-to-b from-neutral-800 to-neutral-950 ${phase === "reveal" ? "ring-2 ring-destructive/60" : ""}`}
      >
        <div className="rounded-[24px] overflow-hidden bg-[#0b0b0f] min-h-[420px] flex flex-col">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-mono text-white/60">
            <span className="tabular-nums">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-white/60" />
              <span className="h-1 w-1 rounded-full bg-white/60" />
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span className="ml-1">4G</span>
            </span>
          </div>

          {/* header — SMS */}
          <div className="px-4 pb-3 border-b border-white/10">
            <div className="text-[10px] font-mono tracking-[0.25em] text-white/40">MESSAGES</div>
            <div className="mt-0.5 text-sm text-white/90 font-semibold">
              {SCRIPT[0].text}
            </div>
          </div>

          {/* thread */}
          <div className="flex-1 px-4 py-4 space-y-3">
            {phase !== "boot" && (
              <div className="flex">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-800 px-3.5 py-2.5 text-[13px] leading-snug text-white/95">
                  {typed}
                  {phase === "typing" && (
                    <span className="ml-0.5 inline-block w-[2px] h-3 align-middle bg-white/70 live-bait-cursor" />
                  )}
                </div>
              </div>
            )}

            {phase === "reveal" && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/90 px-3.5 py-2.5 text-[13px] leading-snug text-primary-foreground font-medium">
                  {answered === "scam"
                    ? "You called it. Not replying."
                    : "You almost replied. Watch this."}
                </div>
              </div>
            )}
          </div>

          {/* action bar — REAL / SCAM */}
          {phase === "asking" && (
            <div className="border-t border-white/10 bg-black/40 p-3 grid grid-cols-2 gap-2 live-bait-actions">
              <button
                onClick={() => answer("real")}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white text-sm font-semibold hover:bg-white/10 active:scale-[0.98] transition"
              >
                <Check className="inline h-4 w-4 mr-1 text-emerald-400" /> REAL BANK
              </button>
              <button
                onClick={() => answer("scam")}
                className="rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-white text-sm font-semibold hover:bg-destructive/25 active:scale-[0.98] transition"
              >
                <X className="inline h-4 w-4 mr-1 text-destructive" /> SCAM
              </button>
            </div>
          )}

          {phase === "typing" && (
            <div className="border-t border-white/10 bg-black/40 p-3 text-center text-[11px] font-mono text-white/40">
              …incoming
            </div>
          )}

          {phase === "boot" && (
            <div className="flex-1 flex items-center justify-center text-[11px] font-mono text-white/30">
              <ShieldAlert className="h-4 w-4 mr-2" /> 1 new message
            </div>
          )}
        </div>
      </div>

      {/* REVEAL card — verdict, tells, hook */}
      {phase === "reveal" && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 live-bait-reveal">
          <div className="flex items-baseline justify-between">
            <div
              className="text-3xl font-black tracking-tight text-destructive"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              {REVEAL.title}
            </div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-destructive/70">
              TIME STOLEN
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-sm text-white/85">{REVEAL.spine}</div>
            <div
              className="text-2xl font-black tabular-nums text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              aria-live="polite"
            >
              {String(Math.floor(stolen / 60)).padStart(1, "0")}:
              {String(stolen % 60).padStart(2, "0")}
            </div>
          </div>

          <ul className="mt-3 space-y-1 text-[12px] text-white/70">
            {REVEAL.tells.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-destructive/80 select-none">›</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded border border-primary/40 bg-primary/10 p-3">
            <div className="text-[10px] font-mono tracking-[0.25em] text-primary/90">
              WELCOME TO THE COUNTER-SCAM DESK
            </div>
            <p className="mt-1 text-[13px] text-white/85 leading-snug">
              Every second you keep them typing is a second they can't spend on
              someone's grandmother. That's the job. Real cases below —
              scammers, verdicts, receipts.
            </p>
            <button
              onClick={dismiss}
              className="mt-3 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-primary-foreground font-mono text-[11px] tracking-widest hover:brightness-110 active:scale-[0.98] transition"
            >
              WORK THE DESK <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {phase !== "reveal" && (
        <button
          onClick={dismiss}
          className="mt-4 mx-auto block text-[10px] font-mono tracking-[0.2em] text-white/40 hover:text-white/70"
        >
          SKIP INTRO →
        </button>
      )}
    </div>
  );
}

export function hasSeenLiveBait(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

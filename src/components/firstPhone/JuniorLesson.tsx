import { useEffect, useMemo, useRef, useState } from "react";
import type { Lesson, JuniorCase } from "@/lib/firstPhone/lessons";
import type { FirstPhoneState } from "@/lib/firstPhone/profile";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { NotificationBanner } from "@/components/chat/NotificationBanner";
import { LockScreen } from "./LockScreen";
import { shouldReduceMotion } from "@/lib/access";
import { Shield, Check, ChevronLeft, PhoneCall } from "lucide-react";
import { JUNIOR_COPY } from "@/lib/firstPhone/copy";

interface Props {
  lesson: Lesson;
  state: FirstPhoneState;
  onBackHome: () => void;
  onComplete: (caseId: string) => void;
}

type Bubble = {
  role: "in" | "out";
  text: string;
  ts: number;
  meta?: string; // e.g. "voice note", "photo"
};

type Phase = "intro" | "chat" | "feedback" | "adult" | "debrief";

export function JuniorLesson({ lesson, state, onBackHome, onComplete }: Props) {
  const c: JuniorCase = lesson.cases[0];
  const reduced = useMemo(() => shouldReduceMotion(), []);
  const [phase, setPhase] = useState<Phase>("intro");
  const [showBanner, setShowBanner] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [chosen, setChosen] = useState<JuniorCase["options"][number] | null>(null);
  const [adultTyping, setAdultTyping] = useState(false);
  const [adultBubbles, setAdultBubbles] = useState<Bubble[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  // Intro: after a short beat, drop the notification.
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setShowBanner(true), reduced ? 100 : 700);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  // Chat: stream artifact lines with typing rhythm.
  useEffect(() => {
    if (phase !== "chat") return;
    let cancelled = false;
    const lines = c.artifact;
    const stepMs = reduced ? 120 : 900;
    const typeMs = reduced ? 60 : 500;

    async function stream() {
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        setTyping(true);
        await new Promise((r) => setTimeout(r, typeMs));
        if (cancelled) return;
        setTyping(false);
        setBubbles((prev) => [...prev, { role: "in", text: lines[i], ts: Date.now() }]);
        await new Promise((r) => setTimeout(r, stepMs));
      }
    }
    void stream();
    return () => {
      cancelled = true;
    };
  }, [phase, c.artifact, reduced]);

  // Adult scene: kid's outgoing → adult typing → adult reply.
  useEffect(() => {
    if (phase !== "adult") return;
    let cancelled = false;
    setAdultBubbles([
      { role: "out", text: "Hi — something feels off. Can you help?", ts: Date.now() },
    ]);
    const t1 = setTimeout(() => !cancelled && setAdultTyping(true), reduced ? 100 : 800);
    const t2 = setTimeout(
      () => {
        if (cancelled) return;
        setAdultTyping(false);
        setAdultBubbles((prev) => [
          ...prev,
          { role: "in", text: c.adultScene.line, ts: Date.now() },
        ]);
      },
      reduced ? 400 : 2200,
    );
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, c.adultScene.line, reduced]);

  // Autoscroll
  useEffect(() => {
    scroller.current?.scrollTo({ top: 1e9, behavior: reduced ? "auto" : "smooth" });
  }, [bubbles, typing, adultBubbles, adultTyping, phase, reduced]);

  // Sender is unknown unless the artifact clearly identifies as a known contact.
  const senderLooksKnown =
    /Baba|Ammi|Nani|cousin|Auntie|Uncle/i.test(c.sender) && !/unknown/i.test(c.sender);

  // ============= INTRO / LOCK SCREEN =============
  if (phase === "intro") {
    return (
      <ChatShell
        variant="junior"
        header={
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-neutral-900/70 backdrop-blur">
            <button
              onClick={onBackHome}
              aria-label="Back to home"
              className="p-1.5 -ml-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="font-mono text-[10px] tracking-[0.25em] text-white/60">
              LESSON {lesson.n}
            </div>
          </div>
        }
      >
        <LockScreen
          wallpaper={state.wallpaper}
          cityName={state.kidCityName}
          hint="Tap the notification when it arrives."
          notification={
            showBanner ? (
              <div className={reduced ? "" : "animate-shudder-in"}>
                <NotificationBanner
                  banner={{
                    id: c.id,
                    sender: c.platform,
                    preview: `New message from ${c.sender}`,
                    ts: Date.now(),
                  }}
                  onDismiss={() => setPhase("chat")}
                  reducedMotion={reduced}
                />
              </div>
            ) : null
          }
        />
      </ChatShell>
    );
  }

  // ============= ADULT SCENE =============
  if (phase === "adult") {
    return (
      <ChatShell
        variant="junior"
        header={
          <ChatHeader
            name={c.adultScene.who}
            isSaved
            subtitle="Trusted contact"
            onBack={() => setPhase("chat")}
            accent="primary"
          />
        }
      >
        <div ref={scroller} className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {adultBubbles.map((b, i) => (
            <MessageBubble key={i} bubble={b} />
          ))}
          {adultTyping && <TypingDots />}
          {!adultTyping && adultBubbles.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-300 text-xs font-mono tracking-[0.2em]">
              <PhoneCall className="h-3 w-3" />
              {JUNIOR_COPY.trustedAdultCelebrate}
            </div>
          )}
        </div>
        <div className="p-3">
          <button
            onClick={() => setPhase("debrief")}
            disabled={adultTyping || adultBubbles.length < 2}
            className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all"
          >
            Continue
          </button>
        </div>
      </ChatShell>
    );
  }

  // ============= CHAT (messages + reply chips / feedback / debrief overlay) =============
  const overlay =
    phase === "feedback" && chosen ? (
      <FeedbackOverlay
        correct={chosen.correct}
        text={chosen.feedback}
        onContinue={() => setPhase("debrief")}
      />
    ) : phase === "debrief" ? (
      <DebriefOverlay note={c.truthNote} onDone={() => onComplete(c.id)} />
    ) : null;

  return (
    <ChatShell
      variant="junior"
      overlay={overlay}
      header={
        <ChatHeader
          name={c.platform}
          number={senderLooksKnown ? undefined : c.sender}
          isSaved={senderLooksKnown}
          subtitle={senderLooksKnown ? c.sender : `From: ${c.sender}`}
          onBack={onBackHome}
          accent={senderLooksKnown ? "primary" : "destructive"}
        />
      }
      composer={
        phase === "chat" && !chosen ? (
          <div className="p-3 space-y-2">
            <div className="font-mono text-[10px] tracking-[0.25em] text-white/50 pb-1">
              PICK A REPLY
            </div>
            {c.options.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setChosen(o);
                  setBubbles((prev) => [...prev, { role: "out", text: o.label, ts: Date.now() }]);
                  setTimeout(() => setPhase("feedback"), reduced ? 100 : 500);
                }}
                className="w-full text-left rounded-2xl border border-white/15 bg-neutral-800 px-4 py-2.5 text-sm text-white hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all"
              >
                {o.label}
              </button>
            ))}
            <button
              onClick={() => setPhase("adult")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/60 bg-amber-400/15 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-amber-200 hover:bg-amber-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition-all shadow-lg shadow-amber-500/10"
            >
              <Shield className="h-4 w-4" />
              {JUNIOR_COPY.trustedAdultChip}
            </button>
          </div>
        ) : undefined
      }
    >
      <div ref={scroller} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {bubbles.map((b, i) => (
          <MessageBubble key={i} bubble={b} />
        ))}
        {typing && <TypingDots />}
      </div>
    </ChatShell>
  );
}

function MessageBubble({ bubble }: { bubble: Bubble }) {
  const isOut = bubble.role === "out";
  const ts = new Date(bubble.ts);
  const hh = ts.getHours().toString().padStart(2, "0");
  const mm = ts.getMinutes().toString().padStart(2, "0");
  return (
    <div className={`msg-in flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm ${
          isOut
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-neutral-800 border border-white/10 text-white rounded-bl-sm"
        }`}
      >
        <div>{bubble.text}</div>
        <div
          className={`mt-0.5 text-[9px] font-mono tabular-nums opacity-60 ${isOut ? "text-right" : "text-left"}`}
        >
          {hh}:{mm}
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="msg-in flex justify-start" aria-label="Typing">
      <div className="rounded-2xl rounded-bl-sm bg-neutral-800 border border-white/10 px-3 py-2">
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" />
          <span
            className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce"
            style={{ animationDelay: "0.15s" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce"
            style={{ animationDelay: "0.3s" }}
          />
        </span>
      </div>
    </div>
  );
}

function FeedbackOverlay({
  correct,
  text,
  onContinue,
}: {
  correct: boolean;
  text: string;
  onContinue: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={correct ? "Good read" : "The city caught it"}
      className="absolute inset-x-0 bottom-0 top-auto z-50 rounded-t-3xl border-t border-white/10 bg-neutral-900 p-5 shadow-2xl"
    >
      <div
        className={`font-mono text-[11px] tracking-[0.25em] ${correct ? "text-emerald-400" : "text-amber-400"}`}
      >
        {correct ? "GOOD READ" : "THE CITY CAUGHT IT"}
      </div>
      <p className="mt-2 text-sm text-white/90 leading-relaxed">{text}</p>
      <button
        onClick={onContinue}
        className="mt-4 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        Continue
      </button>
    </div>
  );
}

function DebriefOverlay({ note, onDone }: { note: string; onDone: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Lesson debrief"
      className="absolute inset-x-0 bottom-0 top-auto z-50 rounded-t-3xl border-t border-primary/30 bg-neutral-900 p-5 shadow-2xl"
    >
      <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-primary">
        <Check className="h-3.5 w-3.5" /> TRUTH NOTE
      </div>
      <p className="mt-2 text-sm italic text-white/90 leading-relaxed">{note}</p>
      <button
        onClick={onDone}
        className="mt-4 w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        Mark lesson complete
      </button>
    </div>
  );
}

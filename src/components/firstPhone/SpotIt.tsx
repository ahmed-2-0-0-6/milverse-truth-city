// MILVERSE — SPOT IT: junior speed-recognition drill.
// Pure presentation over hand-authored JuniorCases. AI-free, loss-free.

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, Check, Target } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { LessonCleared } from "./LessonCleared";
import { shouldReduceMotion } from "@/lib/access";
import {
  buildRounds,
  TACTIC_LABEL,
  type SpotItRound,
} from "@/lib/firstPhone/spotit";
import { loadFirstPhone, setSpotItBest } from "@/lib/firstPhone/profile";

interface Props {
  onBackHome: () => void;
  onGoToLesson1: () => void;
}

type Answer = { correct: boolean; picked: string } | null;

export function SpotIt({ onBackHome, onGoToLesson1 }: Props) {
  const reduced = useMemo(() => shouldReduceMotion(), []);
  const [tick, setTick] = useState(0); // rebuild rounds on AGAIN
  const state = useMemo(() => loadFirstPhone(), [tick]);
  const rounds = useMemo(() => buildRounds(state, new Date()), [state, tick]);
  const [i, setI] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(state.spotItBest);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState<Answer>(null);
  const [swapping, setSwapping] = useState(false);
  const [done, setDone] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const streakSrRef = useRef<HTMLDivElement>(null);

  // Locked state
  if (rounds.length === 0) {
    return (
      <ChatShell
        variant="junior"
        header={<Header title="SPOT IT" onBack={onBackHome} />}
      >
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 bg-neutral-950 text-white text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-400/40 mb-4">
            <Target className="h-8 w-8 text-teal-300" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-semibold">Nothing to replay yet.</h2>
          <p className="mt-2 text-sm text-white/70 max-w-xs">
            Finish Lesson 1 and this game opens. It replays the tricks you've
            already beaten.
          </p>
          <button
            onClick={onGoToLesson1}
            className="mt-6 rounded-xl bg-teal-500 hover:bg-teal-400 px-5 py-3 font-semibold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
          >
            GO TO LESSON 1
          </button>
        </div>
      </ChatShell>
    );
  }

  const round: SpotItRound | undefined = rounds[i];

  function onPick(id: string, isCorrect: boolean) {
    if (answer) return;
    setAnswer({ correct: isCorrect, picked: id });
    if (isCorrect) {
      const nc = correct + 1;
      const ns = streak + 1;
      setCorrect(nc);
      setStreak(ns);
      if (ns > best) {
        setBest(ns);
        setSpotItBest(ns);
      }
    } else {
      setStreak(0);
    }
  }

  function next() {
    const isLast = i >= rounds.length - 1;
    if (isLast) {
      const perfect = correct === rounds.length;
      setDone(true);
      if (perfect && !reduced) setShowCelebrate(true);
      return;
    }
    if (reduced) {
      setI(i + 1);
      setAnswer(null);
      return;
    }
    setSwapping(true);
    window.setTimeout(() => {
      setI(i + 1);
      setAnswer(null);
      setSwapping(false);
    }, 200);
  }

  function again() {
    setI(0);
    setStreak(0);
    setCorrect(0);
    setAnswer(null);
    setDone(false);
    setShowCelebrate(false);
    setTick((t) => t + 1);
  }

  // Session summary
  if (done) {
    return (
      <ChatShell
        variant="junior"
        header={<Header title="SPOT IT" onBack={onBackHome} />}
      >
        {showCelebrate && (
          <LessonCleared
            lessonN={0}
            totalDone={correct}
            totalLessons={rounds.length}
            onDone={() => setShowCelebrate(false)}
          />
        )}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 bg-neutral-950 text-white text-center">
          {correct === rounds.length && (
            <div className="mb-2 text-teal-300 font-semibold">
              Every single one. Sharp eyes.
            </div>
          )}
          <div className="text-2xl font-semibold">
            You spotted {correct} of {rounds.length}.
          </div>
          <div className="mt-2 text-sm text-white/70">Best streak: {best}</div>
          <div className="mt-6 flex flex-col gap-2 items-center">
            <button
              onClick={again}
              className="rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3 font-semibold text-neutral-950 min-w-[10rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
            >
              AGAIN
            </button>
            <button
              onClick={onBackHome}
              className="font-mono text-[11px] tracking-widest text-white/60 hover:text-white py-2"
            >
              HOME
            </button>
          </div>
        </div>
      </ChatShell>
    );
  }

  if (!round) return null;

  return (
    <ChatShell
      variant="junior"
      header={<Header title="SPOT IT" onBack={onBackHome} />}
    >
      <div className="flex-1 min-h-0 flex flex-col bg-neutral-950 text-white">
        {/* Streak bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-900/70">
          <div className="font-mono text-[10px] tracking-[0.25em] text-teal-300">
            STREAK {streak}
          </div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-white/50">
            {i + 1} / {rounds.length}
          </div>
        </div>
        <div ref={streakSrRef} className="sr-only" aria-live="polite">
          Streak {streak}
        </div>

        {/* Artifact card */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div
            className={`spot-slide rounded-2xl bg-neutral-900 border border-white/10 p-4 shadow-lg ${
              swapping ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
            } ${
              answer && !answer.correct
                ? "ring-2 ring-amber-400/60"
                : answer?.correct
                  ? "ring-2 ring-emerald-400/60"
                  : ""
            }`}
            aria-live="polite"
            aria-label={`From ${round.sender} on ${round.platform}: ${round.artifact.join(". ")}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-white">
                {round.sender}
              </div>
              <div className="font-mono text-[10px] tracking-widest text-white/50">
                {round.platform.toUpperCase()}
              </div>
            </div>
            <div className="space-y-1.5">
              {round.artifact.map((line, k) => (
                <div
                  key={k}
                  className="rounded-2xl bg-neutral-800 px-3 py-2 text-[13px] leading-snug text-white/90"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {answer && (
            <div
              className={`mt-4 rounded-xl p-3 text-sm ${
                answer.correct
                  ? "bg-emerald-500/15 border border-emerald-400/40 text-emerald-100"
                  : "bg-amber-500/15 border border-amber-400/40 text-amber-100"
              }`}
            >
              {answer.correct ? (
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
                  <div>
                    <div className="font-semibold">That's the one.</div>
                    <div className="mt-1 text-white/85">{round.truthNote}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-semibold">
                    Close. It was {TACTIC_LABEL[round.tactic]}.
                  </div>
                  <div className="mt-1 text-white/85">{round.truthNote}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Answer buttons */}
        <div className="border-t border-white/10 bg-neutral-900/70 p-3">
          {!answer ? (
            round.truthy ? (
              <div className="grid grid-cols-2 gap-2">
                <AnswerBtn
                  label="OK TO TRUST"
                  onClick={() => onPick("trust", true)}
                  tone="teal"
                />
                <AnswerBtn
                  label="STOP — CHECK FIRST"
                  onClick={() => onPick("stop", false)}
                  tone="slate"
                />
              </div>
            ) : (
              <div>
                <div className="mb-2 text-center font-mono text-[10px] tracking-[0.25em] text-white/60">
                  WHY? — WHICH TRICK IS THIS?
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {round.tacticChoices.map((t) => (
                    <AnswerBtn
                      key={t}
                      label={TACTIC_LABEL[t]}
                      onClick={() => onPick(t, t === round.tactic)}
                      tone="teal"
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            <button
              onClick={next}
              className="w-full min-h-[44px] rounded-xl bg-white text-neutral-950 font-semibold hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
            >
              {i >= rounds.length - 1 ? "SEE RESULTS →" : "NEXT →"}
            </button>
          )}
        </div>
      </div>
    </ChatShell>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-neutral-900/70">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] tracking-[0.25em] text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <ChevronLeft className="h-3 w-3" /> HOME
      </button>
      <div className="font-mono text-[10px] tracking-[0.25em] text-teal-300">
        {title}
      </div>
      <div className="w-14" aria-hidden />
    </div>
  );
}

function AnswerBtn({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: "teal" | "slate";
}) {
  const cls =
    tone === "teal"
      ? "bg-teal-500 hover:bg-teal-400 text-neutral-950"
      : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/15";
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] rounded-xl px-3 py-3 font-semibold text-sm ${cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200`}
    >
      {label}
    </button>
  );
}

// Ensure named import stays used even if tree-shaking is aggressive.
useEffect;

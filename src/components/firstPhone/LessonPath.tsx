import { useEffect, useState } from "react";
import { LESSONS, TOTAL_LESSONS, type Lesson, type JuniorCase } from "@/lib/firstPhone/lessons";
import {
  loadFirstPhone,
  markLessonComplete,
  isLessonUnlocked,
  type FirstPhoneState,
} from "@/lib/firstPhone/profile";
import { TrustedAdultChip } from "./TrustedAdultChip";
import { logPilotEntry } from "@/lib/pilot";
import { Lock, Check, Circle } from "lucide-react";
import { LicenseCard } from "./LicenseCard";

function freshState(): FirstPhoneState {
  return {
    active: false,
    kidCityName: "",
    familyCode: null,
    lessonsCompleted: [],
    licenseIssuedAt: null,
    licenseNumber: null,
    wallpaper: 0,
    handoverSeen: false,
  };
}

export function LessonPath() {
  // Hydration-safe: SSR + first client render use a neutral state; real state
  // loads in useEffect. Prevents mismatch for kids mid-program.
  const [state, setState] = useState<FirstPhoneState>(freshState);
  const [openLesson, setOpenLesson] = useState<number | null>(null);
  const [showLicense, setShowLicense] = useState(false);

  useEffect(() => {
    setState(loadFirstPhone());
  }, []);

  function refresh() {
    setState(loadFirstPhone());
  }

  function completeLesson(n: number, caseId: string) {
    const wasIssued = state.licenseIssuedAt !== null;
    const next = markLessonComplete(n);
    // Reuse pilot infra: junior progress reported on the "daily" wing with a
    // junior: prefix. Only lesson number + result — no message content.
    logPilotEntry({
      wing: "daily",
      caseId: `junior:L${n}:${caseId}`,
      result: "correct",
      points: 10,
      ts: Date.now(),
    });
    refresh();
    setOpenLesson(null);
    if (n === 10 && !wasIssued && next.licenseIssuedAt) {
      setTimeout(() => setShowLicense(true), 400);
    }
  }

  const current = openLesson ? LESSONS.find((l) => l.n === openLesson) : null;

  if (showLicense) {
    return (
      <div className="mt-8">
        <LicenseCard onClose={() => setShowLicense(false)} />
      </div>
    );
  }

  if (current) {
    return (
      <div className="mt-6">
        <button
          onClick={() => setOpenLesson(null)}
          className="font-mono text-[11px] tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← ALL LESSONS
        </button>
        <LessonView lesson={current} onComplete={(caseId) => completeLesson(current.n, caseId)} />
      </div>
    );
  }

  const done = state.lessonsCompleted.length;

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-[11px] tracking-widest text-primary">
          THE PATH · {done} / {TOTAL_LESSONS}
        </div>
        {state.licenseIssuedAt && (
          <button
            onClick={() => setShowLicense(true)}
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[10px] tracking-widest text-primary"
          >
            VIEW LICENSE
          </button>
        )}
      </div>

      <div className="relative">
        {/* Transit line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/60 via-primary/30 to-border" />
        <ul className="space-y-3">
          {LESSONS.map((l) => {
            const complete = state.lessonsCompleted.includes(l.n);
            const unlocked = isLessonUnlocked(state, l.n);
            return (
              <li key={l.n} className="relative pl-16">
                <div
                  className={`absolute left-2 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    complete
                      ? "border-primary bg-primary text-primary-foreground"
                      : unlocked
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {complete ? (
                    <Check className="h-4 w-4" />
                  ) : unlocked ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </div>
                <button
                  onClick={() => unlocked && setOpenLesson(l.n)}
                  disabled={!unlocked}
                  className={`w-full text-left rounded-lg border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    complete
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : unlocked
                        ? "border-border bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-px"
                        : "border-dashed border-border bg-muted/20 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                    LESSON {l.n}
                  </div>
                  <div className="mt-1 font-semibold">{l.title}</div>
                  {!unlocked && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Finish lesson {l.n - 1} to unlock.
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LessonView({
  lesson,
  onComplete,
}: {
  lesson: Lesson;
  onComplete: (caseId: string) => void;
}) {
  const [caseIdx, setCaseIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const c = lesson.cases[caseIdx];

  function choose(opt: JuniorCase["options"][number]) {
    setFeedback({ correct: opt.correct, text: opt.feedback });
  }

  function finish() {
    onComplete(c.id);
  }

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="font-mono text-[10px] tracking-widest text-primary">LESSON {lesson.n}</div>
        <h2 className="mt-1 text-2xl font-semibold">{lesson.title}</h2>
        <div className="mt-3 space-y-1.5 text-sm text-foreground/90">
          {lesson.teach.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-2 flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
            {c.platform.toUpperCase()}
          </div>
          <div className="text-xs text-muted-foreground">{c.sender}</div>
        </div>
        <div className="p-4 space-y-1.5 text-sm">
          {c.artifact.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>

      {!feedback ? (
        <div className="space-y-2">
          {c.options.map((o) => (
            <button
              key={o.id}
              onClick={() => choose(o)}
              className="w-full text-left rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50 hover:shadow-md hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all"
            >
              {o.label}
            </button>
          ))}
          <TrustedAdultChip scene={c.adultScene} onResolved={finish} className="mt-3" />
        </div>
      ) : (
        <div
          className={`rounded-xl border p-5 ${feedback.correct ? "border-primary/40 bg-primary/10" : "border-caution/40 bg-caution/10"}`}
        >
          <div
            className={`font-mono text-[11px] tracking-widest ${feedback.correct ? "text-primary" : "text-caution"}`}
          >
            {feedback.correct ? "GOOD READ" : "THE CITY CAUGHT IT"}
          </div>
          <p className="mt-2 text-sm">{feedback.text}</p>
          <p className="mt-3 text-xs text-muted-foreground italic">{c.truthNote}</p>
          <button
            onClick={finish}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {feedback.correct ? "Mark lesson complete" : "Try again next case — mark complete"}
          </button>
        </div>
      )}
    </div>
  );
}

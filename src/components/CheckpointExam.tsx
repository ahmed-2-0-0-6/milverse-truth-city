import { useState } from "react";
import { CheckCircle2, XCircle, Award, RotateCcw } from "lucide-react";
import { phoneKeyTap, correctChime, wrongBuzz } from "@/lib/mirror/audio";

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Props {
  title: string;
  subtitle?: string;
  questions: Question[];
  onComplete?: (score: number, total: number) => void;
}

export function CheckpointExam({ title, subtitle, questions, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    phoneKeyTap();
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;
    setIsSubmitted(true);
    if (selectedOption === currentQ.correctIndex) {
      correctChime();
      setScore((prev) => prev + 1);
    } else {
      wrongBuzz();
    }
  };

  const handleNextQuestion = () => {
    phoneKeyTap();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setCompleted(true);
      if (onComplete) onComplete(score + (selectedOption === currentQ.correctIndex ? 1 : 0), questions.length);
    }
  };

  const handleRestart = () => {
    phoneKeyTap();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    return (
      <div className="rounded-2xl border border-primary/40 bg-neutral-900/90 p-6 text-center text-white shadow-xl backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/50 bg-primary/20 text-primary mb-3">
          <Award className="h-7 w-7" />
        </div>
        <div className="stencil text-[11px] tracking-widest text-primary">CHECKPOINT EXAM COMPLETE</div>
        <h3 className="mt-1 text-2xl font-black">{title}</h3>
        <p className="mt-2 text-sm text-white/80">
          You scored <span className="font-semibold text-primary">{finalScore}</span> out of <span className="font-semibold">{questions.length}</span> ({percentage}%)
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={handleRestart}
            className="tap inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> RETAKE EXAM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-neutral-900/90 p-5 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div>
          <div className="stencil text-[10px] tracking-widest text-primary">INTERACTIVE CHECKPOINT EXAM</div>
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary">
          QUESTION {currentIndex + 1} OF {questions.length}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-white/90 leading-relaxed">{currentQ.prompt}</p>

        <div className="space-y-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            let btnStyle = "border-white/10 bg-neutral-800/80 text-white/90 hover:bg-neutral-800 hover:border-primary/50";
            
            if (isSubmitted) {
              if (idx === currentQ.correctIndex) {
                btnStyle = "border-emerald-500/80 bg-emerald-500/20 text-emerald-200 font-semibold";
              } else if (isSelected && idx !== currentQ.correctIndex) {
                btnStyle = "border-rose-500/80 bg-rose-500/20 text-rose-200";
              }
            } else if (isSelected) {
              btnStyle = "border-primary bg-primary/20 text-primary font-semibold shadow-[0_0_12px_oklch(0.82_0.14_195/0.3)]";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleOptionSelect(idx)}
                className={`w-full rounded-xl border p-3 text-left text-xs transition-all flex items-start gap-3 ${btnStyle}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 font-mono text-[10px]">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
                {isSubmitted && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {isSubmitted && isSelected && idx !== currentQ.correctIndex && (
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-white/80">
            <div className="font-semibold text-primary mb-1">EXPLANATION:</div>
            {currentQ.explanation}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className={`rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all ${
                selectedOption === null ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
              }`}
            >
              SUBMIT ANSWER
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              {currentIndex < questions.length - 1 ? "NEXT QUESTION →" : "FINISH EXAM →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

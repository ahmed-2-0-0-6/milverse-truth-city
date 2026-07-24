import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RotateCw, ArrowRight, X, ShieldAlert, CheckCircle2, Lock, Sparkles, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { SCENARIOS, type Scenario } from "@/lib/mirror/scenarios";
import { type CaseCardOutcome } from "./CaseCard";

interface GiantCaseFlashcardModalProps {
  scenario: Scenario | null;
  onClose: () => void;
  onSelectScenario?: (s: Scenario) => void;
  outcome?: CaseCardOutcome;
  isUnlocked?: boolean;
  done?: boolean;
  bestClearedTime?: string;
}

function fileNo(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${String((h % 90) + 10)}-${String((h % 900) + 100)}`;
}

export function GiantCaseFlashcardModal({
  scenario,
  onClose,
  onSelectScenario,
  isUnlocked = true,
  done = false,
  bestClearedTime,
}: GiantCaseFlashcardModalProps) {
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  // Reset flipped state when scenario changes
  useEffect(() => {
    setFlipped(false);
  }, [scenario?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!scenario) return null;

  const no = fileNo(scenario.title);
  const currentIndex = SCENARIOS.findIndex((s) => s.id === scenario.id);
  const prevScenario = currentIndex > 0 ? SCENARIOS[currentIndex - 1] : SCENARIOS[SCENARIOS.length - 1];
  const nextScenario = currentIndex < SCENARIOS.length - 1 ? SCENARIOS[currentIndex + 1] : SCENARIOS[0];

  const handlePrev = () => {
    if (onSelectScenario) onSelectScenario(prevScenario);
  };

  const handleNext = () => {
    if (onSelectScenario) onSelectScenario(nextScenario);
  };

  const handlePlayDirect = () => {
    onClose();
    navigate({ to: "/mirror/$caseId", params: { caseId: scenario.id } });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-2xl animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="giant-card-title"
    >
      <div
        className="w-full max-w-4xl flashcard-perspective min-h-[620px] sm:min-h-[680px] relative pointer-events-auto flex flex-col items-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Carousel Navigation Bar */}
        <div className="w-full mb-3 flex items-center justify-between gap-3 font-mono text-xs tracking-widest z-30">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white transition-all shadow-md"
          >
            <X className="h-4 w-4" /> CLOSE (CASE FILES)
          </button>

          {/* Carousel prev/next switchers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/80 px-4 py-2 text-white/90 hover:bg-white/20 hover:border-primary/50 transition-all shadow"
              title={`Previous: ${prevScenario.title}`}
            >
              <ChevronLeft className="h-4 w-4 text-primary" /> PREV
            </button>
            <span className="text-primary font-bold text-[11px] px-3 py-1 rounded-full bg-primary/10 border border-primary/30 shadow-sm">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${SCENARIOS.length}` : "CITIZEN CASE"}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/80 px-4 py-2 text-white/90 hover:bg-white/20 hover:border-primary/50 transition-all shadow"
              title={`Next: ${nextScenario.title}`}
            >
              NEXT <ChevronRight className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>

        {/* 3D Flash Card Box */}
        <div className={`flashcard-inner w-full h-full min-h-[600px] sm:min-h-[650px] ${flipped ? "is-flipped" : ""}`}>

          {/* ── FRONT SIDE OF GIANT FLASH CARD ── */}
          <div className="flashcard-front w-full min-h-[600px] sm:min-h-[650px] rounded-3xl border-2 border-primary/50 bg-slate-950 p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Ambient neon backdrop glow */}
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Folder Header Tab */}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/15">
                <div className="flex items-center gap-2.5 font-mono text-xs tracking-[0.25em] text-primary font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  DOSSIER FILE #{no}
                  <span className="ml-2 rounded-md bg-primary/20 px-2.5 py-1 font-mono text-xs tracking-widest text-primary font-bold border border-primary/30">
                    TIER {scenario.tier}
                  </span>
                </div>
                <div className="font-mono text-xs tracking-widest text-white/70 uppercase border border-white/10 rounded-md px-2.5 py-1 bg-white/5">
                  FORMAT · {scenario.channel}
                </div>
              </div>

              {/* Status & Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {scenario.isSurvivorStory && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-caution/40 bg-caution/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-caution font-semibold">
                    <ShieldAlert className="h-3.5 w-3.5" /> Survivor Donated
                  </span>
                )}
                {done && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                  </span>
                )}
                {!isUnlocked && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/30 bg-muted px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Locked
                  </span>
                )}
                {bestClearedTime && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-mono tracking-widest text-white/80">
                    COLD CLEARED · {bestClearedTime}
                  </span>
                )}
              </div>

              {/* Title & Teaser */}
              <h2 id="giant-card-title" className="mt-4 text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                {scenario.title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-white/85 leading-relaxed italic">
                {scenario.teaser}
              </p>

              {/* Claim Box */}
              <div className="mt-4 rounded-2xl border border-white/15 bg-black/60 p-4 shadow-inner">
                <span className="block font-mono text-xs tracking-[0.25em] text-caution uppercase font-bold mb-1">
                  WHO IS CONTACTING YOU (THE CLAIM)
                </span>
                <p className="text-sm sm:text-base text-white leading-relaxed font-medium">{scenario.dossier.contactClaim}</p>
              </div>

              {/* Known Facts (K1..K5) */}
              <div className="mt-4">
                <div className="font-mono text-xs tracking-widest text-primary font-bold uppercase mb-2">
                  WHAT YOU KNOW FOR CERTAIN (ONLY YOU AND THE REAL ONE)
                </div>
                <ul className="space-y-2">
                  {scenario.dossier.knownFacts.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs sm:text-sm text-white">
                      <span className="shrink-0 rounded-md bg-primary/20 px-2 py-0.5 font-mono text-xs font-bold text-primary border border-primary/40">
                        K{i + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="relative z-20 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFlipped(true);
                }}
                className="hover-lift inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-5 py-3 font-mono text-xs font-bold tracking-widest text-primary hover:bg-primary/20 transition-all shadow-md cursor-pointer"
              >
                <RotateCw className="h-4 w-4" /> FLIP FOR PUBLIC FACTS & TACTICS 🔄
              </button>

              {isUnlocked ? (
                <button
                  type="button"
                  onClick={handlePlayDirect}
                  className="hover-lift neon-glow-cyan inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-mono text-sm font-black tracking-widest text-primary-foreground shadow-xl hover:bg-primary/90 transition-all cursor-pointer"
                >
                  ⚡ START CASE NOW <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <span className="font-mono text-xs tracking-widest text-muted-foreground">
                  LOCKED · CLEAR TIER BELOW
                </span>
              )}
            </div>
          </div>

          {/* ── BACK SIDE OF GIANT FLASH CARD ── */}
          <div className="flashcard-back w-full min-h-[600px] sm:min-h-[650px] rounded-3xl border-2 border-primary/60 bg-neutral-950 p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Ambient neon backdrop glow */}
            <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Header Tab */}
              <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/15 font-mono text-xs">
                <div className="flex items-center gap-2 text-primary font-bold tracking-[0.25em]">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  CLASSIFIED INTEL & PUBLIC AMMUNITION
                </div>
                <div className="text-white/70 font-bold">FILE #{no}</div>
              </div>

              {/* Public Facts (P1..P2) */}
              <div className="mt-4">
                <div className="font-mono text-xs tracking-widest text-caution font-bold uppercase mb-1">
                  PUBLICLY FINDABLE (AMMUNITION FOR IMPOSTERS)
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-2">
                  If they only ever prove these, they've proven nothing.
                </div>
                <ul className="space-y-2">
                  {scenario.dossier.publicFacts.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-white/15 bg-black/60 p-3 text-xs sm:text-sm text-white/90">
                      <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-white/80 border border-white/20">
                        P{i + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tactic & Facts */}
              <div className="mt-4 grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
                  <span className="block text-[10px] tracking-widest text-primary font-bold">PRIMARY TACTIC</span>
                  <span className="block font-black text-white mt-1 uppercase text-base">{scenario.tactic}</span>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/60 p-4">
                  <span className="block text-[10px] tracking-widest text-caution font-bold">FACTS TO PROBE</span>
                  <span className="block font-black text-white mt-1 uppercase text-base">{scenario.facts.length} EVIDENCE POINTS</span>
                </div>
              </div>

              {/* Opener speech bubble */}
              <div className="mt-4 rounded-2xl border border-white/15 bg-black/70 p-5">
                <span className="block font-mono text-[10px] tracking-widest text-muted-foreground uppercase mb-1.5">
                  FIRST SCAM MESSAGE INCOMING:
                </span>
                <p className="text-sm sm:text-base font-sans italic text-white/95 leading-relaxed">
                  "{scenario.opener}"
                </p>
              </div>

              {scenario.tier === 5 && (
                <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/20 p-4 text-xs text-red-200">
                  <span className="font-mono text-xs tracking-widest text-red-400 font-bold block mb-1">TIER 5 · THE CLEAN ROOM</span>
                  Flawless imposter performance. Reading alone cannot settle it — use the VERIFY door.
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="relative z-20 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFlipped(false);
                }}
                className="hover-lift inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-5 py-3 font-mono text-xs font-bold tracking-widest text-primary hover:bg-primary/20 transition-all shadow-md cursor-pointer"
              >
                <RotateCw className="h-4 w-4" /> FLIP TO FRONT COVER 🔄
              </button>

              {isUnlocked && (
                <button
                  type="button"
                  onClick={handlePlayDirect}
                  className="hover-lift neon-glow-cyan inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-mono text-sm font-black tracking-widest text-primary-foreground shadow-xl hover:bg-primary/90 transition-all cursor-pointer"
                >
                  ⚡ START CASE NOW <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

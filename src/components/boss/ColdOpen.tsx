// LAYER-3-CROWN — The Cold Open. Entrance cinematic for Boss Protocol.
// Hypes the OPPONENT (codename, threat, prior record, doctrine). Contains
// zero truth-leaks — no line implies the contact is fake, because some
// variants are REAL and blank-refusal must still be punishable.
//
// Non-cinematic / reduced-motion players NEVER mount this component; the
// intro card carries every piece of information the cold open shows.

import { useEffect, useRef, useState } from "react";
import type { BossConfig } from "@/lib/boss/types";
import { stampSlam, glitch } from "@/lib/mirror/audio";

interface Props {
  boss: BossConfig;
  record: { attempts: number; wins: number };
  onDone: () => void;
}

type Beat = "rule" | "frame" | "codename" | "rating" | "record" | "tagline" | "doctrine" | "cut" | "line";

const BEATS: { at: number; beat: Beat }[] = [
  { at: 0,    beat: "rule" },
  { at: 500,  beat: "frame" },
  { at: 1400, beat: "codename" },
  { at: 2200, beat: "rating" },
  { at: 3000, beat: "record" },
  { at: 4200, beat: "tagline" },
  { at: 5200, beat: "doctrine" },
  { at: 6200, beat: "cut" },
  { at: 6400, beat: "line" },
];

function recordLine(record: { attempts: number; wins: number }): string {
  if (record.attempts === 0) return "NO PRIOR CONTACT. YOU ARE THE FIRST CALL.";
  if (record.wins === 0) return `PRIOR CONTACTS: ${record.attempts}. SURVIVORS: 0.`;
  return `PRIOR CONTACTS: ${record.attempts}. YOU WALKED AWAY ${record.wins} TIME(S).`;
}

export function ColdOpen({ boss, record, onDone }: Props) {
  const [reached, setReached] = useState<Set<Beat>>(new Set());
  const [ratingChars, setRatingChars] = useState(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const dialogRef = useRef<HTMLDivElement>(null);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    // Focus the dialog so Escape/Enter reach us without hunting.
    dialogRef.current?.focus();

    const timeouts: number[] = [];
    for (const b of BEATS) {
      timeouts.push(
        window.setTimeout(() => {
          setReached((prev) => {
            if (prev.has(b.beat)) return prev;
            const next = new Set(prev);
            next.add(b.beat);
            return next;
          });
          if (b.beat === "codename") {
            try { stampSlam(); } catch { /* audio muted or unavailable */ }
          }
          if (b.beat === "cut") {
            try { glitch(80, 0.05); } catch { /* audio muted or unavailable */ }
          }
        }, b.at),
      );
    }
    // Threat rating typewriter — 3 chars max, 120ms apart, starts with beat.
    const skulls = boss.threatRating.length;
    for (let i = 1; i <= skulls; i++) {
      timeouts.push(window.setTimeout(() => setRatingChars(i), 2200 + i * 120));
    }
    // Final onDone.
    timeouts.push(window.setTimeout(finish, 7400));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id]);

  const has = (b: Beat) => reached.has(b);
  const skulls = boss.threatRating.length;
  const ratingDisplay = "☠".repeat(ratingChars);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Case opening"
      tabIndex={-1}
      onClick={finish}
      className="fixed inset-0 z-[320] bg-black text-white flex items-center justify-center overflow-hidden outline-none select-none cursor-pointer"
    >
      {/* Single polite announcement */}
      <div className="sr-only" aria-live="polite">
        {`${boss.codename}. Threat rating ${skulls} skull${skulls === 1 ? "" : "s"}. Tap to skip.`}
      </div>

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Cut-to-black overlay */}
      {has("cut") && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          aria-hidden
          style={{ animation: "coldCut 200ms ease-out both" }}
        />
      )}

      {!has("line") && (
        <div className="relative w-[min(88vw,560px)]">
          {/* The horizontal red rule / top border of the file frame */}
          <div
            className={`cold-rule h-[2px] bg-red-500 origin-left ${has("rule") ? "cold-rule-in" : "scale-x-0"}`}
            style={{ boxShadow: "0 0 12px rgba(239,68,68,0.7)" }}
            aria-hidden
          />

          {/* File frame (expands downward once t1.4 hits) */}
          <div
            className={`overflow-hidden border-x border-b border-red-900/60 bg-gradient-to-b from-red-950/20 to-black transition-[max-height,opacity] duration-300 ease-out ${has("frame") ? "opacity-100" : "opacity-0"}`}
            style={{ maxHeight: has("frame") ? 520 : 0 }}
          >
            <div className="px-6 pt-4 pb-6 space-y-4">
              {/* Headers above the rule are absolute — we render the labels inside for LITE-parity clarity */}
              <div className="flex items-center justify-between text-[10px] tracking-[0.4em]">
                <span className={`text-red-400 transition-opacity duration-500 ${has("rule") ? "opacity-100" : "opacity-0"}`}>
                  CITY THREAT DIVISION
                </span>
                <span className={`font-mono text-white/50 transition-opacity duration-500 ${has("rule") ? "opacity-100" : "opacity-0"}`}>
                  SPECIAL CASE FILE
                </span>
              </div>

              {/* Codename */}
              <div
                className={`text-5xl font-black tracking-tight leading-none ${has("codename") ? "cold-slam" : "opacity-0"}`}
                style={{ textShadow: "0 0 24px rgba(239,68,68,0.35)" }}
              >
                {boss.codename}
              </div>

              {/* Threat rating */}
              {has("rating") && (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl text-red-500 tabular-nums min-w-[3ch]">
                    {ratingDisplay}
                  </span>
                  <span className="text-[10px] tracking-[0.4em] text-red-400">THREAT RATING</span>
                </div>
              )}

              {/* Record line — truthful, local, dramatic */}
              {has("record") && (
                <div
                  className="font-mono text-xs text-white/70 tracking-wider border-l-2 border-white/20 pl-3"
                  style={{ animation: "coldStamp 240ms ease-out both" }}
                >
                  {recordLine(record)}
                </div>
              )}

              {/* Tagline */}
              {has("tagline") && (
                <p
                  className="italic text-white/80 leading-relaxed"
                  style={{ animation: "coldFade 500ms ease-out both" }}
                >
                  {boss.tagline}
                </p>
              )}

              {/* Doctrine */}
              {has("doctrine") && (
                <div
                  className="text-[11px] tracking-[0.2em] text-amber-300 border-t border-amber-900/40 pt-3"
                  style={{ animation: "coldFade 500ms ease-out both" }}
                >
                  {boss.doctrineRule}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final: THE LINE IS OPENING */}
      {has("line") && (
        <div className="relative flex items-center gap-2 font-mono text-white text-lg" style={{ animation: "coldFade 600ms ease-out both" }}>
          <span>THE LINE IS OPENING.</span>
          <span className="cold-cursor inline-block w-[10px] h-[18px] bg-white/90" aria-hidden />
        </div>
      )}

      {/* Skip affordance */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute bottom-4 right-4 stencil text-[10px] tracking-[0.3em] text-white/50 hover:text-white/90 border border-white/15 px-3 py-1.5"
      >
        TAP TO SKIP
      </button>
    </div>
  );
}

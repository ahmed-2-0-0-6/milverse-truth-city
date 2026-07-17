// MILVERSE — THE HANDLER'S READING.
// Signature scene: case-file-on-you, typewriter reveal, deterministic-first
// with cached AI upgrade. Refreshes at most once per UTC+5 day.

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { loadProfile } from "@/lib/mirror/profile";
import { computeReading } from "@/lib/handler/profile";
import { fallbackReading, assignmentReason } from "@/lib/handler/copy";
import { feedTacticMap } from "@/lib/handler/feedTactics";
import { useHandlerLine } from "@/lib/handler/useHandlerLine";

const REDUCED =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function HandlersReading() {
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile> | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const reading = useMemo(
    () => (profile ? computeReading(profile, feedTacticMap()) : null),
    [profile],
  );

  const fallback = useMemo(
    () => (reading ? fallbackReading(reading, profile?.playerId ? hash(profile.playerId) : 0) : ""),
    [reading, profile?.playerId],
  );

  const line = useHandlerLine({
    surface: "reading",
    fallback,
    enabled: !!reading && reading.lean.id !== "rookie",
    cacheKey: profile?.playerId,
    summary: reading
      ? {
          lean: reading.lean.label,
          leanBlurb: reading.lean.blurb,
          strength: reading.strength,
          directive: reading.directive,
          weakestTactic: reading.weakness ? String(reading.weakness.tactic) : null,
          weakestWrong: reading.weakness?.wrong ?? 0,
          weakestSeen: reading.weakness?.seen ?? 0,
          wager: reading.wager.label,
          dailyStreak: profile?.dailyStreak ?? 0,
        }
      : {
          lean: "",
          leanBlurb: "",
          strength: "",
          directive: "",
          weakestTactic: null,
          weakestWrong: 0,
          weakestSeen: 0,
          wager: "—",
          dailyStreak: 0,
        },
  });

  // Typewriter reveal on `line.text`.
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!line.text) {
      setTyped("");
      return;
    }
    if (REDUCED) {
      setTyped(line.text);
      return;
    }
    setTyped("");
    let i = 0;
    const t = window.setInterval(() => {
      i += 2;
      setTyped(line.text.slice(0, i));
      if (i >= line.text.length) window.clearInterval(t);
    }, 14);
    return () => window.clearInterval(t);
  }, [line.text]);

  if (!reading) return null;
  const rookie = reading.lean.id === "rookie";

  return (
    <section className="mt-6 rounded-2xl border border-primary/40 bg-[#050813] p-5 sm:p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)",
        }}
      />
      <div className="relative">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="stencil text-[10px] tracking-[0.35em] text-primary">
              THE HANDLER'S READING
            </div>
            <div className="stencil text-[9px] tracking-widest text-muted-foreground mt-0.5">
              CASE FILE · {reading.lean.code} · {reading.lean.label}
            </div>
          </div>
          <div className="stencil text-[9px] tracking-widest text-muted-foreground">
            REFRESHES DAILY
          </div>
        </div>

        {rookie ? (
          <p className="mt-4 text-sm text-muted-foreground italic">
            File's thin, kid. Close five cases so I can read you properly.
          </p>
        ) : (
          <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground/95 min-h-[6.5rem]">
            {typed}
            <span className="inline-block w-2 h-4 align-[-2px] bg-primary/80 animate-pulse ml-0.5" />
          </pre>
        )}

        {!rookie && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <Chip label="LEAN" value={reading.lean.label} />
            <Chip label="WAGER" value={reading.wager.label} />
            <Chip
              label="WEAKEST"
              value={reading.weakness ? String(reading.weakness.tactic).toUpperCase() : "—"}
            />
            <Chip
              label="STREAK"
              value={
                String(profile?.dailyStreak ?? 0) +
                " DAY" +
                ((profile?.dailyStreak ?? 0) === 1 ? "" : "S")
              }
            />
          </div>
        )}

        {!rookie && (
          <div className="mt-5 rounded-md border border-border bg-background/60 p-4">
            <div className="stencil text-[10px] tracking-widest text-primary">ASSIGNMENT</div>
            <div className="mt-1 text-sm text-foreground">
              {reading.assignment.district === "feed" && "Feed District — verify the next artifact"}
              {reading.assignment.district === "mirror" && "Mirror District — take the next call"}
              {reading.assignment.district === "drop" && "AAJ KA FORWARD — one drop, one stake"}
              {reading.assignment.tactic && (
                <span className="ml-2 stencil text-[10px] tracking-widest text-muted-foreground">
                  · FOCUS · {String(reading.assignment.tactic).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-[12px] text-muted-foreground italic mt-1">
              {assignmentReason(reading)}
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to={
                  reading.assignment.district === "feed"
                    ? "/feed"
                    : reading.assignment.district === "mirror"
                      ? "/mirror"
                      : "/drop"
                }
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground"
              >
                REPORT FOR DUTY
              </Link>
            </div>
          </div>
        )}

        <p className="mt-4 text-[10px] text-muted-foreground italic">
          Profile reflects your play in MILVERSE — it measures training habits, nothing else.
        </p>
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 px-2.5 py-1.5">
      <div className="stencil text-[9px] tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-[11px] text-foreground truncate">{value}</div>
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

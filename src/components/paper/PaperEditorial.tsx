// THE DAILY MIRAGE — Handler's Editorial (AI once/day, deterministic fallback always).
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { EditionEditorial } from "@/lib/paper/types";
import { generateHandlerLine } from "@/lib/handler.functions";
import { readCache, writeCache, fingerprint } from "@/lib/handler/cache";
import { loadProfile } from "@/lib/mirror/profile";
import { computeReading } from "@/lib/handler/profile";
import { feedTacticMap } from "@/lib/handler/feedTactics";

export function PaperEditorial({
  editorial,
  editionNumber,
}: {
  editorial: EditionEditorial;
  editionNumber: number;
}) {
  const [line, setLine] = useState<string>(editorial.fallback);
  const genFn = useServerFn(generateHandlerLine);

  useEffect(() => {
    const surface = "psych-eval" as const; // reuse existing surface enum for the editorial slot
    const p = loadProfile();
    const reading = computeReading(p, feedTacticMap());
    const hash = fingerprint({
      editionNumber,
      cp: p.casesPlayed,
      ms: p.missedScams,
      fa: p.falseAlarms,
    });
    const cached = readCache(surface, hash);
    if (cached) {
      setLine(cached.text);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    genFn({
      data: {
        surface,
        summary: {
          lean: reading.lean.label,
          leanBlurb: reading.lean.blurb,
          strength: reading.strength,
          directive: reading.directive,
          weakestTactic: reading.weakness ? String(reading.weakness.tactic) : null,
          weakestWrong: reading.weakness?.wrong ?? 0,
          weakestSeen: reading.weakness?.seen ?? 0,
          wager: reading.wager.label,
          dailyStreak: p.dailyStreak,
        },
        fallback: editorial.fallback,
      },
    })
      .then((r) => {
        const text = r.text ?? editorial.fallback;
        writeCache(surface, hash, text, r.source ?? "fallback");
        setLine(text);
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editionNumber]);

  return (
    <section className="paper-section max-w-3xl mx-auto">
      <div className="paper-section-kicker text-center">THE HANDLER'S EDITORIAL</div>
      <blockquote className="paper-serif italic text-xl sm:text-2xl leading-relaxed mt-3 text-center px-4">
        “{line}”
      </blockquote>
      <div className="paper-mono text-[10px] tracking-[0.25em] mt-3 text-center text-[color:var(--paper-muted)]">
        — {editorial.signoff}
      </div>
    </section>
  );
}

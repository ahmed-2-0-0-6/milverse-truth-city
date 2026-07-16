// THE DAILY MIRAGE — Handler's Editorial (AI once/day, deterministic fallback always).
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { EditionEditorial } from "@/lib/paper/types";
import { generateHandlerLine } from "@/lib/handler.functions";
import { readCache, writeCache, fingerprint } from "@/lib/handler/cache";
import { loadProfile } from "@/lib/mirror/profile";

export function PaperEditorial({ editorial, editionNumber }: { editorial: EditionEditorial; editionNumber: number }) {
  const [line, setLine] = useState<string>(editorial.fallback);
  const genFn = useServerFn(generateHandlerLine);

  useEffect(() => {
    const surface = "psych-eval" as const; // reuse existing surface enum for the editorial slot
    const p = loadProfile();
    const hash = fingerprint({ editionNumber, cp: p.casesPlayed, ms: p.missedScams, fa: p.falseAlarms });
    const cached = readCache(surface, hash);
    if (cached) { setLine(cached.text); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    genFn({ data: {
      surface,
      profileSummary: {
        casesPlayed: p.casesPlayed,
        correctVerdicts: p.correctVerdicts,
        missedScams: p.missedScams,
        falseAlarms: p.falseAlarms,
        dailyStreak: p.dailyStreak,
        trust: p.trust,
      },
      fallback: editorial.fallback,
    } as never })
      .then((r) => {
        const text = (r as { line?: string })?.line ?? editorial.fallback;
        writeCache(surface, hash, text, "ai");
        setLine(text);
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(timer));
    return () => { controller.abort(); window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editionNumber]);

  return (
    <section className="mt-2 max-w-3xl mx-auto">
      <div className="paper-mono text-[10px] tracking-[0.3em] text-center text-[color:var(--paper-muted)]">THE HANDLER'S EDITORIAL</div>
      <blockquote className="paper-serif italic text-xl sm:text-2xl leading-relaxed mt-3 text-center px-4">
        “{line}”
      </blockquote>
      <div className="paper-mono text-[10px] tracking-[0.25em] mt-2 text-center text-[color:var(--paper-muted)]">{editorial.signoff}</div>
    </section>
  );
}

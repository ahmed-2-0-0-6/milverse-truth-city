// MILVERSE — Rookie intro line for first 3 cases only. No AI, deterministic.

import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/mirror/profile";
import { ROOKIE_INTROS } from "@/lib/handler/copy";

export function RookieIntro() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const p = loadProfile();
    const n = p.casesPlayed;
    if (n < ROOKIE_INTROS.length) setText(ROOKIE_INTROS[n]);
    else setText(null);
  }, []);
  if (!text) return null;
  return (
    <div className="mb-3 rounded-md border border-primary/40 bg-background/70 px-3 py-2">
      <div className="stencil text-[9px] tracking-widest text-primary">THE HANDLER</div>
      <div className="mt-0.5 text-[13px] text-foreground/95 italic">"{text}"</div>
    </div>
  );
}

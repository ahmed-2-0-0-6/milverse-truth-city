// MILVERSE — Reusable district-intro banner.
// Non-blocking: renders as a compact banner at the top of the district page.
// Shows ONCE PER PROFILE (playerId-scoped). Never covers the case list.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import type { DistrictKey } from "@/components/DistrictLiveFX";

interface Props {
  id: string;                    // unique district key
  chapter: string;               // "CHAPTER 02"
  title: string;                 // "THE FEED"
  art?: string;                  // (unused in banner form, kept for API compat)
  artVideo?: string;             // (unused in banner form, kept for API compat)
  district?: DistrictKey;        // (unused in banner form, kept for API compat)
  lines: [string, string];       // exactly two lines of narration
  onDone?: () => void;
}

export function DistrictIntro({ id, chapter, title, lines, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = loadProfile();
    const key = `milverse.intro.v2.${p.playerId}.${id}`;
    if (localStorage.getItem(key)) return;
    setVisible(true);
    localStorage.setItem(key, "1");
  }, [id]);

  if (!visible) return null;

  function close() {
    setVisible(false);
    onDone?.();
  }

  return (
    <div
      role="note"
      className="relative w-full border border-primary/30 bg-primary/[0.06] rounded-md px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <button
        onClick={close}
        className="absolute top-2 right-2 rounded p-1 text-white/60 hover:text-white"
        aria-label="Dismiss intro"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="stencil text-[9px] tracking-[0.35em] text-primary/80">{chapter} · {title}</div>
      <p className="mt-1 text-sm text-foreground/90 leading-snug pr-6">{lines[0]}</p>
      <p className="mt-1 text-sm text-foreground/70 leading-snug pr-6">{lines[1]}</p>
    </div>
  );
}

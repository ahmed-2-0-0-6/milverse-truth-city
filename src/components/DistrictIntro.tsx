// MILVERSE — Reusable district-intro cutscene.
// 2-panel typewriter narration, skippable, ONCE PER PROFILE (playerId-scoped).

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { DistrictLiveFX, type DistrictKey } from "@/components/DistrictLiveFX";

interface Props {
  id: string;                    // unique district key
  chapter: string;               // "CHAPTER 02"
  title: string;                 // "THE FEED"
  art?: string;                  // background image URL
  district?: DistrictKey;        // which live overlay to render on the art
  lines: [string, string];       // exactly two lines of narration
  onDone?: () => void;
}

export function DistrictIntro({ id, chapter, title, art, district, lines, onDone }: Props) {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState(0);
  const [typed, setTyped] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = loadProfile();
    // Scope to playerId so intros play once per profile, not once per tab.
    const key = `milverse.intro.v2.${p.playerId}.${id}`;
    if (localStorage.getItem(key)) return;
    setReducedMotion(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    setVisible(true);
    localStorage.setItem(key, "1");
  }, [id]);


  useEffect(() => {
    if (!visible) return;
    const target = lines[panel] ?? "";
    if (reducedMotion) { setTyped(target); return; }
    setTyped("");
    let i = 0;
    const iv = window.setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) window.clearInterval(iv);
    }, 22);
    return () => window.clearInterval(iv);
  }, [visible, panel, lines, reducedMotion]);

  if (!visible) return null;

  function next() {
    if (panel < 1) setPanel(panel + 1);
    else close();
  }
  function close() {
    setVisible(false);
    onDone?.();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {art && (
        <div className="absolute inset-0 opacity-30 overflow-hidden">
          <img src={art} alt="" className="h-full w-full object-cover kenburns" />
          {district && <DistrictLiveFX district={district} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
        </div>
      )}
      <button
        onClick={close}
        className="absolute top-4 right-4 rounded border border-white/20 p-2 stencil text-[10px] tracking-widest text-white/70 hover:text-white z-10"
        aria-label="Skip intro"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative max-w-2xl w-full">
        <div className="stencil text-[10px] tracking-[0.35em] text-primary/70 mb-3">{chapter}</div>
        <h1
          className="text-6xl sm:text-7xl font-black tracking-tight text-white"
          style={{ fontFamily: '"Bebas Neue", sans-serif', textShadow: "0 0 30px rgba(34,211,238,0.4)" }}
        >
          {title}
        </h1>
        <div className="mt-8 min-h-[6rem] text-lg sm:text-xl text-white/85 leading-relaxed">
          {typed}
          <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="stencil text-[10px] tracking-widest text-white/40">
            {panel + 1} / 2
          </div>
          <button
            onClick={next}
            className="rounded-md border border-primary/50 bg-primary/10 px-4 py-2 stencil text-[10px] tracking-widest text-primary hover:bg-primary/20"
          >
            {panel < 1 ? "NEXT →" : "ENTER →"}
          </button>
        </div>
      </div>
    </div>
  );
}

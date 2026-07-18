// MILVERSE — Tier 5 Airlock cinematic. Three beats: wash → line → resolve.
// Tap or Esc skips. Mounted only in CINEMATIC mode; the caller short-circuits
// in LITE / reduced-motion (the dossier notice already carries the words).

import { useEffect, useRef, useState } from "react";

interface Props {
  onDone: () => void;
}

export function Airlock({ onDone }: Props) {
  const [beat, setBeat] = useState<0 | 1 | 2>(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t1 = window.setTimeout(() => setBeat(1), 800);
    const t2 = window.setTimeout(() => setBeat(2), 2200);
    const t3 = window.setTimeout(() => onDoneRef.current(), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onDoneRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      type="button"
      onClick={() => onDoneRef.current()}
      aria-label="Skip airlock"
      className={`fixed inset-0 z-[80] flex items-center justify-center airlock-wash ${
        beat === 2 ? "opacity-0" : "opacity-100"
      } transition-opacity duration-500`}
      style={{ backgroundColor: "#f4f4f0" }}
    >
      <p
        className={`px-8 text-center text-[#1b2430] font-light text-xl sm:text-2xl tracking-wide transition-opacity duration-500 ${
          beat === 1 ? "opacity-100" : "opacity-0"
        }`}
      >
        No shadows. No tells. Just the claim.
      </p>
    </button>
  );
}

// LAYER-7 — Typed neon headline for the hero.
import { useEffect, useRef, useState } from "react";

const TEXT = "TRAIN YOUR TRUST";

type HeroTypeProps = {
  onComplete?: () => void;
  onFullyTyped?: () => void;
};

export function HeroType({ onComplete, onFullyTyped }: HeroTypeProps) {
  const [n, setN] = useState(0);
  const completedRef = useRef(false);
  const fullyTypedRef = useRef(false);

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
    try {
      window.dispatchEvent(new CustomEvent("milverse:hero-typed"));
    } catch {
      /* noop */
    }
  };

  const fullyTyped = () => {
    if (fullyTypedRef.current) return;
    fullyTypedRef.current = true;
    onFullyTyped?.();
    try {
      window.dispatchEvent(new CustomEvent("milverse:hero-fully-typed"));
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setN(TEXT.length);
      complete();
      fullyTyped();
      return;
    }
    // Left-side notifications: fire ~200ms after typing starts.
    const signal = window.setTimeout(complete, 200);
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= TEXT.length) {
        window.clearInterval(id);
        // Right-side newspaper: fire only once the headline is fully typed.
        fullyTyped();
      }
    }, 60);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(signal);
    };
  }, []);


  return (
    <h1
      className="hero-type text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-[-0.02em] leading-[0.85] text-white text-center"
      style={{ fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif' }}
      aria-label={TEXT}
    >
      {TEXT.split("").map((ch, i) => (
        <span
          key={i}
          className={i < n ? "neon-letter" : "opacity-0"}
          style={{ animationDelay: `${i * 40}ms` }}

        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h1>
  );
}

// LAYER-7 — Typed neon headline for the hero.
import { useEffect, useRef, useState } from "react";

const TEXT = "TRAIN YOUR TRUST";

type HeroTypeProps = {
  onComplete?: () => void;
};

export function HeroType({ onComplete }: HeroTypeProps) {
  const [n, setN] = useState(0);
  const completedRef = useRef(false);

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

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setN(TEXT.length);
      complete();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= TEXT.length) {
        window.clearInterval(id);
      }
    }, 60);
    return () => window.clearInterval(id);
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
          onAnimationEnd={i === TEXT.length - 1 ? complete : undefined}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h1>
  );
}

// LAYER-7 — Typed neon headline for the hero.
import { useEffect, useState } from "react";

const TEXT = "TRAIN YOUR TRUST";

export function HeroType() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const fire = () => {
      try {
        window.dispatchEvent(new CustomEvent("milverse:hero-typed"));
      } catch {
        /* noop */
      }
    };
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setN(TEXT.length);
      fire();
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= TEXT.length) {
        window.clearInterval(id);
        fire();
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
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h1>
  );
}

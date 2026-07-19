// LAYER-7 — Typed neon headline for the hero.
// OPERATION GRAVITY: the new front-door line has to hit like a slap.
import { useEffect, useState } from "react";

const TEXT = "SOMEONE IS LYING TO YOU RIGHT NOW.";

export function HeroType() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setN(TEXT.length);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setN(i);
      if (i >= TEXT.length) window.clearInterval(id);
    }, 40);
    return () => window.clearInterval(id);
  }, []);
  return (
    <h1
      className="hero-type text-4xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-black tracking-[-0.02em] leading-[0.9] text-white text-center"
      style={{ fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif' }}
      aria-label={TEXT}
    >
      {TEXT.split("").map((ch, i) => (
        <span
          key={i}
          className={i < n ? "neon-letter" : "opacity-0"}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h1>
  );
}

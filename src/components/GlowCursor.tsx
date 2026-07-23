// LAYER-4 — Desktop-only glow-dot cursor with high-performance trailing ease.
import { useEffect, useRef } from "react";
import { useVisualMode } from "@/lib/visual-quality";

export function GlowCursor() {
  const { mode } = useVisualMode();
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "cinematic") return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    let running = false;

    const update = () => {
      // Instant movement for main dot (offset by half width/height: -4px)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      }

      // Responsive trailing for ambient trail ring (offset by half width/height: -16px)
      const dx = x - tx;
      const dy = y - ty;
      tx += dx * 0.40;
      ty += dy * 0.40;

      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${tx - 16}px, ${ty - 16}px, 0)`;
      }

      // Keep RAF loop active only while moving; pause when resting to conserve CPU/GPU
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        raf = requestAnimationFrame(update);
      } else {
        running = false;
      }
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(update);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    
    // Position dot initially
    if (dotRef.current) dotRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
    if (trailRef.current) trailRef.current.style.transform = `translate3d(${tx - 16}px, ${ty - 16}px, 0)`;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [mode]);

  if (mode !== "cinematic") return null;

  return (
    <>
      <div
        ref={trailRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 h-8 w-8 rounded-full"
        style={{
          zIndex: 2147483646,
          background: "radial-gradient(circle, oklch(0.60 0.19 258 / 0.35), transparent 70%)",
          willChange: "transform",
          transform: "translate3d(-100px, -100px, 0)",
          contain: "strict",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 h-2 w-2 rounded-full"
        style={{
          zIndex: 2147483647,
          background: "oklch(0.60 0.19 258)",
          boxShadow: "0 0 12px oklch(0.60 0.19 258 / 0.9)",
          willChange: "transform",
          transform: "translate3d(-100px, -100px, 0)",
          contain: "strict",
        }}
      />
    </>
  );
}

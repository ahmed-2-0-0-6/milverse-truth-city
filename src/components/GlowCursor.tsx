// LAYER-4 — Desktop-only glow-dot cursor with trailing ease.
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

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    let raf = 0;
    const onMove = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    window.addEventListener("pointermove", onMove);
    const loop = () => {
      tx += (x - tx) * 0.18;
      ty += (y - ty) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (trailRef.current) trailRef.current.style.transform = `translate3d(${tx}px,${ty}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, [mode]);

  if (mode !== "cinematic") return null;
  return (
    <>
      <div ref={trailRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80] h-8 w-8 rounded-full"
        style={{ background: "radial-gradient(circle, oklch(0.60 0.19 258 / 0.35), transparent 70%)", willChange: "transform" }} />
      <div ref={dotRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[81] h-2 w-2 rounded-full"
        style={{ background: "oklch(0.60 0.19 258)", boxShadow: "0 0 12px oklch(0.60 0.19 258 / 0.9)", willChange: "transform" }} />
    </>
  );
}

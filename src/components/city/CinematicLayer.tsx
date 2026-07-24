import { useEffect, useRef, useState } from "react";

/**
 * Presentation-only film layer for the city board.
 * Letterbox bars, grain, anamorphic bloom, an establishing light sweep and a
 * one-time slate. No gameplay, no state, no cost when motion is reduced.
 */
export function CinematicLayer({
  active,
  immersed,
  reducedMotion,
  lowFx,
  title,
  subtitle,
}: {
  active: boolean;
  immersed: boolean;
  reducedMotion: boolean;
  lowFx: boolean;
  title: string;
  subtitle: string;
}) {
  const [slate, setSlate] = useState(false);
  const shown = useRef(false);

  // The slate plays once, the first time the board comes on screen.
  useEffect(() => {
    if (!active || shown.current || reducedMotion) return;
    shown.current = true;
    setSlate(true);
    const t = window.setTimeout(() => setSlate(false), 2600);
    return () => window.clearTimeout(t);
  }, [active, reducedMotion]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
      {/* anamorphic bloom — warm light pooling in the middle of the frame */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 55%, rgba(251,191,36,0.10), transparent 70%)",
        }}
      />
      {/* cold rim light from the top corners */}
      <div
        className="absolute inset-0 mix-blend-screen opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 8% 0%, rgba(103,232,249,0.10), transparent 70%), radial-gradient(ellipse 40% 30% at 92% 0%, rgba(168,85,247,0.10), transparent 70%)",
        }}
      />
      {/* film grain */}
      {!lowFx && <div className="milv-grain absolute inset-0" />}
      {/* scanline sheen */}
      {!lowFx && <div className="milv-scanlines absolute inset-0" />}
      {/* letterbox — full cinema in immerse, a hairline crop otherwise */}
      <div
        className="absolute inset-x-0 top-0 bg-black transition-all duration-700"
        style={{ height: immersed ? "6vh" : 10 }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-black transition-all duration-700"
        style={{ height: immersed ? "6vh" : 10 }}
      />
      {/* frame brackets */}
      <div className="absolute left-2 top-4 h-6 w-6 border-l border-t border-amber-300/30" />
      <div className="absolute right-2 top-4 h-6 w-6 border-r border-t border-amber-300/30" />
      <div className="absolute left-2 bottom-4 h-6 w-6 border-b border-l border-amber-300/30" />
      <div className="absolute right-2 bottom-4 h-6 w-6 border-b border-r border-amber-300/30" />

      {/* establishing sweep + slate, once */}
      {slate && (
        <>
          <div className="milv-sweep absolute inset-0" />
          <div className="milv-slate absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="stencil text-[10px] tracking-[0.5em] text-amber-300/70">
              {subtitle}
            </div>
            <div className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-amber-100">
              {title}
            </div>
            <div className="mt-3 h-px w-24 bg-amber-300/40" />
          </div>
        </>
      )}
    </div>
  );
}

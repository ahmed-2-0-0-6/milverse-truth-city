import { useMemo } from "react";

/**
 * DETECTIVE TABLE BACKGROUND
 * Pure CSS/SVG cinematic backdrop: a round detective's table seen from above,
 * with case files, photos, pins, and paper scraps orbiting slowly around a
 * central desk lamp. Compositor-only transforms (rotate/translate/opacity) —
 * no filters, no repaints — safe to run behind the hero.
 */
export function DetectiveTableBg({ className = "" }: { className?: string }) {
  // Deterministic scraps around the ring so SSR + hydrate agree.
  const scraps = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        i,
        angle: (360 / 14) * i,
        r: 34 + ((i * 53) % 18), // % of container
        kind: (["file", "photo", "note", "photo", "file", "note"] as const)[i % 6],
        tilt: ((i * 47) % 30) - 15,
        delay: -(i * 1.7),
      })),
    []
  );

  return (
    <div
      className={`detective-table pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Warm lamp pool in the center */}
      <div className="dt-lamp" />
      {/* Wood-grain radial vignette */}
      <div className="dt-wood" />
      {/* Slow ring of case scraps */}
      <div className="dt-ring">
        {scraps.map((s) => (
          <div
            key={s.i}
            className={`dt-scrap dt-${s.kind}`}
            style={{
              // Position each scrap on the ring
              transform: `rotate(${s.angle}deg) translate(${s.r}%) rotate(${-s.angle + s.tilt}deg)`,
              animationDelay: `${s.delay}s`,
            }}
          >
            {s.kind === "file" && (
              <>
                <div className="dt-file-tab" />
                <div className="dt-file-line" />
                <div className="dt-file-line short" />
                <div className="dt-file-line" />
              </>
            )}
            {s.kind === "photo" && <div className="dt-photo-frame" />}
            {s.kind === "note" && (
              <>
                <div className="dt-note-line" />
                <div className="dt-note-line short" />
              </>
            )}
          </div>
        ))}
      </div>
      {/* Counter-rotating pin-thread ring, very faint */}
      <div className="dt-threads">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(220,38,38,0.10)" strokeWidth="0.15" strokeDasharray="0.8 2" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(245,185,66,0.10)" strokeWidth="0.12" strokeDasharray="0.4 3" />
        </svg>
      </div>
      {/* Grain */}
      <div className="dt-grain" />
    </div>
  );
}

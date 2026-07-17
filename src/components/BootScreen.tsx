// LAYER-6 — City power-grid boot sequence. Session-scoped, max 2s.
import { useEffect, useState } from "react";

const KEY = "milverse.boot.seen";
const STATIONS = ["MIRROR", "FEED", "STUDIO", "ARCHIVE", "CITY HALL", "ARENA"];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [lit, setLit] = useState(0);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) {
      onDone();
      return;
    }
    if (sessionStorage.getItem(KEY)) {
      onDone();
      return;
    }

    let i = 0;
    const step = 260; // ms per station -> ~1.6s total
    const id = window.setInterval(() => {
      i++;
      setLit(i);
      if (i >= STATIONS.length) {
        window.clearInterval(id);
        setTimeout(() => {
          sessionStorage.setItem(KEY, "1");
          setHide(true);
          setTimeout(onDone, 380);
        }, 260);
      }
    }, step);
    return () => window.clearInterval(id);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black text-white transition-opacity duration-300 ${hide ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden={hide}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="relative flex flex-col items-center gap-8 px-6">
        <div className="stencil text-[10px] text-cyan-300/80 hud-blink">
          // SYSTEM BOOT · MILVERSE.CITY
        </div>
        <div
          className="boot-logo text-5xl sm:text-7xl font-black tracking-[0.08em] leading-none text-white"
          style={{
            fontFamily: '"Bebas Neue", "Space Grotesk", sans-serif',
            textShadow: "0 0 24px rgba(34,211,238,0.55), 0 0 8px rgba(34,211,238,0.9)",
          }}
        >
          MILVERSE
        </div>

        {/* mini transit line */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          {STATIONS.map((s, i) => {
            const on = i < lit;
            return (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full border transition-all duration-200 ${on ? "bg-cyan-300 border-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.9)]" : "bg-transparent border-white/25"}`}
                />
                <div
                  className={`stencil text-[8px] transition-colors ${on ? "text-cyan-200" : "text-white/25"}`}
                >
                  {s}
                </div>
              </div>
            );
          })}
          <div className="absolute left-1.5 right-1.5 top-1.5 h-px bg-white/10 -z-0" />
          <div
            className="absolute left-1.5 top-1.5 h-px bg-cyan-300/70 transition-[width] duration-200 -z-0"
            style={{
              width: `${(lit / STATIONS.length) * 100}%`,
              boxShadow: "0 0 8px rgba(34,211,238,0.7)",
            }}
          />
        </div>

        <div className="stencil text-[10px] text-white/40">
          POWERING GRID · {Math.min(100, Math.round((lit / STATIONS.length) * 100))}%
        </div>
      </div>
    </div>
  );
}

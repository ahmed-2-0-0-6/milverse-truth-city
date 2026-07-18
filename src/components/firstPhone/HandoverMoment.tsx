import { useEffect, useState } from "react";
import { WALLPAPERS, getWallpaper } from "./wallpapers";
import {
  loadFirstPhone,
  setWallpaper,
  markHandoverSeen,
  setActive,
} from "@/lib/firstPhone/profile";
import { shouldReduceMotion } from "@/lib/access";
import { Gift, Check } from "lucide-react";

interface Props {
  cityName: string;
  onDone: () => void;
}

/**
 * The 6-second handover beat — once per kid. Plays when First Phone is
 * activated. Gift box slides in, unwraps, phone powers on, kid picks a
 * wallpaper. LITE / reduced-motion = static composed frame.
 */
export function HandoverMoment({ cityName, onDone }: Props) {
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [picked, setPicked] = useState<number>(0);

  useEffect(() => {
    const r = shouldReduceMotion();
    setReduced(r);
    setPicked(loadFirstPhone().wallpaper ?? 0);
    if (r) setPhase(3);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const t1 = setTimeout(() => setPhase(1), 900); // gift slides up
    const t2 = setTimeout(() => setPhase(2), 2100); // unwraps
    const t3 = setTimeout(() => setPhase(3), 3600); // boot glow
    const t4 = setTimeout(() => setPhase(4), 5400); // wallpaper picker
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [reduced]);

  function commit() {
    setWallpaper(picked);
    markHandoverSeen();
    setActive(true, cityName);
    onDone();
  }

  function skip() {
    setWallpaper(picked);
    markHandoverSeen();
    setActive(true, cityName);
    onDone();
  }

  const wp = getWallpaper(picked);
  const showPicker = phase >= 3;

  return (
    <div
      role="dialog"
      aria-label="Your first phone"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white"
    >
      {/* Skip */}
      <button
        onClick={skip}
        className="absolute top-4 right-4 rounded-md px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        SKIP
      </button>

      <div className="text-center px-6">
        <div className="mb-6 font-mono text-[10px] tracking-[0.3em] text-primary/80">
          MILVERSE · DEPARTMENT OF DIGITAL TRUST
        </div>

        {/* Phone silhouette */}
        <div className="mx-auto relative">
          <div
            className={`mx-auto w-[220px] h-[420px] rounded-[36px] border border-white/15 shadow-2xl overflow-hidden relative transition-all duration-700 ${
              phase >= 1 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{
              background: phase >= 3 ? wp.bg : "#0b0b0b",
              boxShadow: phase >= 3 ? "0 0 60px rgba(124,58,237,0.35)" : undefined,
            }}
            aria-hidden="true"
          >
            {/* Wrapping ribbon */}
            {phase < 2 && (
              <>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 bg-primary/70" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-primary/70" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gift className="h-10 w-10 text-white drop-shadow" />
                </div>
              </>
            )}
            {/* Boot glow */}
            {phase === 2 && <div className="absolute inset-0 bg-white/90 animate-pulse" />}
            {/* Lock screen preview */}
            {phase >= 3 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow">
                <div className="text-[9px] font-mono tracking-[0.3em] opacity-80">TODAY</div>
                <div className="text-5xl font-thin mt-1">08:14</div>
                {cityName && <div className="mt-3 text-xs opacity-90">Hey {cityName}.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 max-w-md mx-auto">
          <div className="text-lg font-semibold leading-snug">
            Your first phone. Learn it before the world learns your number.
          </div>

          {showPicker && (
            <div className="mt-6">
              <div className="font-mono text-[10px] tracking-[0.25em] text-white/60 mb-3">
                PICK A WALLPAPER
              </div>
              <div className="grid grid-cols-4 gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setPicked(w.id)}
                    aria-label={`Wallpaper: ${w.name}`}
                    aria-pressed={picked === w.id}
                    className={`relative h-16 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      picked === w.id
                        ? "border-primary scale-105 shadow-lg shadow-primary/30"
                        : "border-white/20 hover:border-white/40"
                    }`}
                    style={{ background: w.bg }}
                  >
                    {picked === w.id && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={commit}
                className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all"
              >
                Turn on my phone
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Signal, Wifi, BatteryMedium } from "lucide-react";

export function StatusBar() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      setTime(`${hh}:${mm}`);
    };
    fmt();
    const iv = setInterval(fmt, 15_000);
    return () => clearInterval(iv);
  }, []);
  // Decorative iOS-style status bar — hidden from AT.
  return (
    <div
      aria-hidden="true"
      className="relative flex items-center justify-between px-4 py-1.5 text-[10px] font-mono tracking-wider text-white/80 bg-black/90 border-b border-white/10 select-none z-20"
      style={{ paddingTop: "max(0.375rem, env(safe-area-inset-top))" }}
    >
      {/* Hardware Dynamic Island Notch */}
      <div className="hidden sm:flex absolute left-1/2 top-1 -translate-x-1/2 h-4 w-28 rounded-full bg-black border border-white/15 shadow-inner items-center justify-between px-2.5 pointer-events-none z-30">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-950/80 border border-blue-900/50" />
        <span className="h-2 w-2 rounded-full bg-neutral-900 border border-neutral-700/80" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-white font-semibold tracking-[0.2em] stencil text-[9px]">CitizenOS</span>
      </div>
      <div className="text-white/90 font-semibold tabular-nums text-[11px]">{time || "—:—"}</div>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3 w-3 text-emerald-400/90" strokeWidth={2.5} />
        <Wifi className="h-3 w-3 text-emerald-400/90" strokeWidth={2.5} />
        <BatteryMedium className="h-3.5 w-3.5 text-emerald-400/90" strokeWidth={2.5} />
      </div>
    </div>
  );
}

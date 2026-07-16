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
      className="flex items-center justify-between px-4 py-1.5 text-[10px] font-mono tracking-wider text-white/80 bg-black/80 border-b border-white/10 select-none"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-white font-semibold tracking-[0.2em]">CitizenOS</span>
      </div>
      <div className="text-white/90 font-semibold tabular-nums">{time || "—:—"}</div>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3 w-3" strokeWidth={2.5} />
        <Wifi className="h-3 w-3" strokeWidth={2.5} />
        <BatteryMedium className="h-3.5 w-3.5" strokeWidth={2.5} />
      </div>
    </div>
  );
}

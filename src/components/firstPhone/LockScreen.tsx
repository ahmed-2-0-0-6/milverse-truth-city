import { useEffect, useState, type ReactNode } from "react";
import { getWallpaper } from "./wallpapers";
import { ShieldCheck } from "lucide-react";

interface Props {
  wallpaper: number;
  cityName: string;
  /** If true, paint a subtle city-seal watermark + "LICENSED CITIZEN" label. */
  licensed?: boolean;
  /** Optional notification/banner slot rendered near the top. */
  notification?: ReactNode;
  /** Optional hint / caption under the clock. */
  hint?: string;
  className?: string;
}

/**
 * Full-height lock-screen surface — paints the kid's wallpaper, big clock,
 * their city-name. Used inside the junior PhoneShell.
 */
export function LockScreen({
  wallpaper,
  cityName,
  licensed,
  notification,
  hint,
  className,
}: Props) {
  const wp = getWallpaper(wallpaper);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(iv);
  }, []);
  const h12 = ((now.getHours() + 11) % 12) + 1;
  const mm = now.getMinutes().toString().padStart(2, "0");
  const day = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const fg = wp.fg === "light" ? "text-white" : "text-neutral-900";

  return (
    <div
      className={`relative flex-1 min-h-0 flex flex-col ${fg} ${className ?? ""}`}
      style={{ background: wp.bg }}
      aria-label="Lock screen"
    >
      {/* Subtle glass overlay for readability */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" aria-hidden="true" />

      {/* Licensed watermark */}
      {licensed && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="rounded-full border-2 border-white/25 p-8 opacity-30">
            <ShieldCheck className="h-24 w-24" strokeWidth={1.2} />
          </div>
        </div>
      )}

      <div className="relative flex-1 flex flex-col items-center px-4 pt-8">
        <div className="text-center drop-shadow-md">
          <div
            className="text-6xl font-thin tabular-nums leading-none"
            aria-hidden="true"
          >{`${h12}:${mm}`}</div>
          <div className="mt-2 text-[13px] font-medium tracking-wide opacity-90" aria-hidden="true">
            {day}
          </div>
          {cityName && <div className="mt-4 text-sm font-medium opacity-90">Hey {cityName}.</div>}
          {hint && <div className="mt-1 text-[11px] opacity-70">{hint}</div>}
        </div>

        {notification && <div className="w-full mt-6">{notification}</div>}
      </div>

      {licensed && (
        <div className="relative px-4 pb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur px-3 py-1 font-mono text-[10px] tracking-[0.25em]">
            <ShieldCheck className="h-3 w-3" /> LICENSED CITIZEN
          </div>
        </div>
      )}
    </div>
  );
}

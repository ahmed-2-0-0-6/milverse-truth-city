import { useEffect, useState } from "react";

export interface NotificationPayload {
  id: string;
  sender: string;
  preview: string;
  ts?: number;
}

interface Props {
  banner: NotificationPayload | null;
  onDismiss: (id: string) => void;
  reducedMotion?: boolean;
}

export function NotificationBanner({ banner, onDismiss, reducedMotion }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!banner) { setShow(false); return; }
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(() => onDismiss(banner.id), 200);
    }, 3500);
    return () => clearTimeout(t);
  }, [banner, onDismiss]);

  if (!banner) return null;
  const ts = banner.ts ? new Date(banner.ts) : new Date();
  const hh = ts.getHours().toString().padStart(2, "0");
  const mm = ts.getMinutes().toString().padStart(2, "0");

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute left-2 right-2 top-2 z-[60] pointer-events-none ${
        reducedMotion ? "" : show ? "animate-in slide-in-from-top duration-300" : "animate-out slide-out-to-top duration-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onDismiss(banner.id)}
        aria-label={`Notification from ${banner.sender}: ${banner.preview}. Tap to dismiss.`}
        className="pointer-events-auto w-full text-left rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-2xl px-3 py-2.5 cursor-pointer hover:bg-neutral-800/95 transition-colors"
      >
        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-white/50 mb-0.5">
          <span>{banner.sender}</span>
          <span>{hh}:{mm}</span>
        </div>
        <div className="text-xs text-white line-clamp-2">{banner.preview}</div>
      </button>
    </div>
  );
}

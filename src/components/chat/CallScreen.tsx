import { useEffect, useState } from "react";
import { PhoneOff, Phone, PhoneIncoming } from "lucide-react";

interface Props {
  open: boolean;
  contactName: string;
  contactNumber?: string;
  /** Text shown after ring — scripted result from engine. */
  resultLine?: string | null;
  direction?: "out" | "in";
  onEnd: () => void;
  onAccept?: () => void;
  reducedMotion?: boolean;
}

export function CallScreen({
  open,
  contactName,
  contactNumber,
  resultLine,
  direction = "out",
  onEnd,
  onAccept,
  reducedMotion,
}: Props) {
  const [ringing, setRinging] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!open) return;
    setRinging(true);
    setSeconds(0);
    if (direction === "out" && resultLine) {
      const t = setTimeout(() => setRinging(false), reducedMotion ? 200 : 1800);
      return () => clearTimeout(t);
    }
  }, [open, resultLine, direction, reducedMotion]);

  useEffect(() => {
    if (!open || ringing) return;
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [open, ringing]);

  if (!open) return null;
  const initials = contactName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-screen-title"
      className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-neutral-900 via-black to-neutral-950 text-white px-6 pt-16 pb-10"
    >
      <div className="text-center">
        <div className="text-[10px] font-mono tracking-[0.3em] text-white/60 uppercase">
          {direction === "in" ? "Incoming call" : ringing ? "Calling saved number…" : "In call"}
        </div>
        <div id="call-screen-title" className="mt-6 text-3xl font-semibold">
          {contactName}
        </div>
        {contactNumber && (
          <div className="mt-1 text-sm font-mono text-white/60 tracking-wider">{contactNumber}</div>
        )}
        <div className="mt-2 text-xs text-white/50">{ringing ? "…" : `${mm}:${ss}`}</div>
      </div>

      <div className="relative flex items-center justify-center">
        {!reducedMotion && ringing && (
          <>
            <span className="absolute h-40 w-40 rounded-full bg-primary/10 animate-ping" />
            <span className="absolute h-56 w-56 rounded-full bg-primary/5 animate-pulse" />
          </>
        )}
        <div
          className={`flex h-32 w-32 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary text-2xl font-bold font-mono ${reducedMotion ? "" : ringing ? "" : ""}`}
        >
          {initials}
        </div>
      </div>

      {resultLine && !ringing && (
        <div className="mx-auto max-w-sm rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90 text-center leading-relaxed">
          {resultLine}
        </div>
      )}

      <div className="flex items-center gap-6">
        {direction === "in" && onAccept && ringing && (
          <button
            onClick={() => {
              setRinging(false);
              onAccept();
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50 transition-colors"
            aria-label="Accept"
          >
            <PhoneIncoming className="h-6 w-6" />
          </button>
        )}
        <button
          onClick={onEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white shadow-xl shadow-red-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300/50 transition-colors"
          aria-label="End call"
        >
          {ringing && direction === "out" ? (
            <PhoneOff className="h-6 w-6" />
          ) : (
            <Phone className="h-6 w-6 rotate-[135deg]" />
          )}
        </button>
      </div>
    </div>
  );
}

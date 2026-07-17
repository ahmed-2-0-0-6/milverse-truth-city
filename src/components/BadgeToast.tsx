import { useEffect, useState } from "react";
import type { BadgeDef } from "@/lib/mirror/badges";

export function BadgeToast() {
  const [badge, setBadge] = useState<BadgeDef | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<BadgeDef>).detail;
      if (!detail) return;
      setBadge(detail);
      const t = setTimeout(() => setBadge(null), 5000);
      return () => clearTimeout(t);
    };
    window.addEventListener("milverse:badge", on);
    return () => window.removeEventListener("milverse:badge", on);
  }, []);
  if (!badge) return null;
  return (
    <div
      className="fixed inset-x-0 top-6 z-[200] flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <button
        onClick={() => setBadge(null)}
        className="msg-in pointer-events-auto flex items-center gap-4 rounded-xl border-2 border-primary bg-card/95 backdrop-blur px-6 py-4 shadow-[0_0_40px_oklch(0.82_0.16_85/0.35)] max-w-md"
      >
        <div className="text-4xl">{badge.emoji}</div>
        <div className="text-left">
          <div className="font-mono text-[10px] tracking-[0.3em] text-primary">BADGE EARNED</div>
          <div className="mt-0.5 text-lg font-semibold">{badge.name}</div>
          <div className="text-xs text-muted-foreground">{badge.blurb}</div>
        </div>
      </button>
    </div>
  );
}

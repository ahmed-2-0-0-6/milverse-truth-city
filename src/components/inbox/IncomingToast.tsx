// MILVERSE — Citizen Inbox arrival toast. Listens for
// "milverse:inbox:arrive" events, renders a stack of banners, auto-collapses
// after 6s (unless reduced motion). Clicking a banner navigates to the case.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { InboxItem } from "@/lib/inbox/scheduler";
import { markOpened } from "@/lib/inbox/profile";
import { shouldReduceMotion } from "@/lib/access";
import { arrivalTap } from "@/lib/mirror/audio";
import { platformStyle } from "./platform-style";
import { currentShift, isNightRegister } from "@/lib/city/shift";

const AUTO_HIDE_MS = 6000;

export function IncomingToast() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    const reduce = shouldReduceMotion();
    const onArrive = (e: Event) => {
      const detail = (e as CustomEvent<InboxItem>).detail;
      if (!detail) return;
      setItems((cur) => {
        if (cur.some((i) => i.id === detail.id)) return cur;
        arrivalTap();
        return [...cur, detail];
      });
      if (!reduce) {
        const t = window.setTimeout(() => {
          setItems((cur) => cur.filter((i) => i.id !== detail.id));
          timers.current.delete(detail.id);
        }, AUTO_HIDE_MS);
        timers.current.set(detail.id, t);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setItems([]);
    };
    window.addEventListener("milverse:inbox:arrive", onArrive);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("milverse:inbox:arrive", onArrive);
      window.removeEventListener("keydown", onKey);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const dismiss = (id: string) => {
    setItems((cur) => cur.filter((i) => i.id !== id));
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  };

  const open = (it: InboxItem) => {
    markOpened(it.id);
    dismiss(it.id);
    navigate({ to: it.route });
  };

  if (items.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 top-16 z-40 flex flex-col items-center gap-2 px-4 pointer-events-none"
      role="region"
      aria-label="Incoming messages"
      aria-live="polite"
    >
      {items.map((it) => {
        const s = platformStyle(it.platform);
        return (
          <div
            key={it.id}
            className="inbox-toast-in w-full max-w-md pointer-events-auto"
          >
            <div
              className="flex items-stretch gap-3 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-lg overflow-hidden"
              style={{ borderLeft: `4px solid ${s.border}` }}
            >
              <button
                onClick={() => open(it)}
                className="flex-1 flex items-start gap-3 text-left px-3 py-2.5 hover:bg-accent/50 focus-visible:outline-none focus-visible:bg-accent/60"
              >
                <span
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: s.border }}
                  aria-hidden
                >
                  {s.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground leading-tight">
                    <span className="truncate">{it.senderName}</span>
                    <span className="ml-auto stencil text-[9px] text-muted-foreground">now</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {it.preview}
                  </span>
                </span>
                <span className="stencil text-[10px] text-primary self-center pl-1">OPEN</span>
              </button>
              <button
                onClick={() => dismiss(it.id)}
                aria-label="Dismiss"
                className="px-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:bg-accent"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

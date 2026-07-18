// MILVERSE — Citizen Inbox scheduler mount. Renders NOTHING; only schedules
// arrivals for the current page. Safe to mount on multiple hub pages —
// dedup via the per-day arrived[] log in localStorage.

import { useEffect } from "react";
import {
  todaysArrivals,
  callAlreadyFiredToday,
  type InboxItem,
} from "@/lib/inbox/scheduler";
import { loadInbox, markArrived } from "@/lib/inbox/profile";
import { useVisualMode } from "@/lib/visual-quality";
import { useJuniorMode } from "@/hooks/useJuniorMode";
import { shouldReduceMotion } from "@/lib/access";

export function InboxManager() {
  const { mode } = useVisualMode();
  const junior = useJuniorMode();

  useEffect(() => {
    if (!junior.ready) return;
    if (junior.active) return; // never fire for juniors
    const items = todaysArrivals();
    if (items.length === 0) return;
    const already = new Set(loadInbox().arrived);
    const reduce = shouldReduceMotion();
    const lite = mode !== "cinematic";

    const messages = items.filter((it) => it.type === "message");
    const call = items.find((it) => it.type === "call") ?? null;

    if (lite) {
      // LITE: pre-fill tray with messages, no toasts.
      for (const it of messages) if (!already.has(it.id)) markArrived(it.id);
      // LITE + reduced motion: voicemail lands directly (no ring takeover).
      if (call && !callAlreadyFiredToday() && !already.has(call.id)) {
        markArrived(call.id);
      }
      return;
    }

    const handles: number[] = [];
    for (const it of messages) {
      if (already.has(it.id)) continue;
      const h = window.setTimeout(() => {
        markArrived(it.id);
        window.dispatchEvent(new CustomEvent("milverse:inbox:arrive", { detail: it }));
      }, it.arriveAfterSec * 1000);
      handles.push(h);
    }

    // The Missed Call
    if (call && !callAlreadyFiredToday()) {
      if (reduce) {
        // Reduced motion: skip the takeover, land voicemail in tray.
        const h = window.setTimeout(() => {
          markArrived(call.id);
          window.dispatchEvent(
            new CustomEvent("milverse:inbox:arrive", { detail: call }),
          );
        }, call.arriveAfterSec * 1000);
        handles.push(h);
      } else {
        const h = window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent<InboxItem>("milverse:inbox:call", { detail: call }),
          );
        }, call.arriveAfterSec * 1000);
        handles.push(h);
      }
    }

    return () => {
      for (const h of handles) window.clearTimeout(h);
    };
  }, [mode, junior.ready, junior.active]);

  return null;
}

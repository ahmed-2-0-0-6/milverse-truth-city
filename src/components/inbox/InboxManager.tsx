// MILVERSE — Citizen Inbox scheduler mount. Renders NOTHING; only schedules
// arrivals for the current page. Safe to mount on multiple hub pages —
// dedup via the per-day arrived[] log in localStorage.

import { useEffect } from "react";
import { todaysArrivals } from "@/lib/inbox/scheduler";
import { loadInbox, markArrived } from "@/lib/inbox/profile";
import { useVisualMode } from "@/lib/visual-quality";
import { useJuniorMode } from "@/hooks/useJuniorMode";

export function InboxManager() {
  const { mode } = useVisualMode();
  const junior = useJuniorMode();

  useEffect(() => {
    if (!junior.ready) return;
    if (junior.active) return; // never fire for juniors
    const items = todaysArrivals();
    if (items.length === 0) return;
    const already = new Set(loadInbox().arrived);

    if (mode !== "cinematic") {
      // LITE: pre-fill tray, no toasts.
      for (const it of items) if (!already.has(it.id)) markArrived(it.id);
      return;
    }

    const handles: number[] = [];
    for (const it of items) {
      if (already.has(it.id)) continue;
      const h = window.setTimeout(() => {
        markArrived(it.id);
        window.dispatchEvent(new CustomEvent("milverse:inbox:arrive", { detail: it }));
      }, it.arriveAfterSec * 1000);
      handles.push(h);
    }
    return () => {
      for (const h of handles) window.clearTimeout(h);
    };
  }, [mode, junior.ready, junior.active]);

  return null;
}

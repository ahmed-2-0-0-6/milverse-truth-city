// MILVERSE — coalesce a flurry of window events into a single rAF tick.
// Multiple Phase 3 panels listen to the same city/bricks/built events; a
// single build fires several in the same task and would trigger N re-renders.
// This bundles them into one paint.

import { useEffect } from "react";

export function useCoalescedRefresh(events: string[], onRefresh: () => void) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        onRefresh();
      });
    };
    for (const ev of events) window.addEventListener(ev, schedule);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      for (const ev of events) window.removeEventListener(ev, schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join("|")]);
}

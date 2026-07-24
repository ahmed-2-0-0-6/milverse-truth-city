// MILVERSE — perf hook. "Is this thing actually on screen right now?"
// Combines IntersectionObserver with document visibility so offscreen or
// backgrounded surfaces can stop animating and stop ticking.
// SSR-safe: returns false until mounted, then settles on the real answer.

import { useEffect, useRef, useState } from "react";

export function useOnScreen<T extends HTMLElement>(
  rootMargin = "200px",
): { ref: React.RefObject<T | null>; active: boolean } {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  const [awake, setAwake] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    const onVis = () => setAwake(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return { ref, active: visible && awake };
}

/** Tab-visibility only — for tickers that have no element to observe. */
export function useTabAwake(): boolean {
  const [awake, setAwake] = useState(true);
  useEffect(() => {
    const onVis = () => setAwake(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return awake;
}

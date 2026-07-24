// MILVERSE — perf hook. "Is this thing actually on screen right now?"
// Combines IntersectionObserver with document visibility so offscreen or
// backgrounded surfaces can stop animating and stop ticking.
// SSR-safe: returns false until mounted, then settles on the real answer.

import { useCallback, useEffect, useState } from "react";

export function useOnScreen<T extends HTMLElement>(
  rootMargin = "200px",
): { ref: (node: T | null) => void; active: boolean } {
  // Callback ref: the observed node may mount late (components that render a
  // placeholder before their save loads), so a plain ref would never attach.
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback((n: T | null) => setNode(n), []);
  const [visible, setVisible] = useState(false);
  const [awake, setAwake] = useState(true);

  useEffect(() => {
    const el = node;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => { (window as any).__io = (window as any).__io || []; (window as any).__io.push(entries.map(e=>e.isIntersecting)); setVisible(entries.some((e) => e.isIntersecting)); },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [node, rootMargin]);

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

// LAYER-1 — Lazy loader for the WebGL city. Only mounts in cinematic mode.
// Kick off the chunk fetch immediately on mount (no artificial delay) and
// mount as soon as it resolves — the 2D map is a separate section and no
// longer contends with the hero for the main thread.

import { lazy, Suspense, useEffect, useState } from "react";
import { useVisualMode } from "@/lib/visual-quality";

const NoirCityScene = lazy(() => import("./NoirCityScene"));

// Warm the chunk as soon as this module is evaluated on the client so the
// network fetch overlaps with the rest of the hero render.
if (typeof window !== "undefined") {
  void import("./NoirCityScene").catch(() => {});
}

export function CityHero3D({ className = "" }: { className?: string }) {
  const { mode } = useVisualMode();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mode !== "cinematic") return;
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback;
    if (idle) {
      const id = idle(() => setReady(true));
      return () => {
        const cancel = (window as unknown as { cancelIdleCallback?: (id: number) => void })
          .cancelIdleCallback;
        cancel?.(id);
      };
    }
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, [mode]);

  if (mode !== "cinematic" || !ready) return null;
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Suspense fallback={null}>
        <NoirCityScene />
      </Suspense>
    </div>
  );
}

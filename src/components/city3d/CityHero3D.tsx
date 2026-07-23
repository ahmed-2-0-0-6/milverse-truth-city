// LAYER-1 — Lazy loader for the WebGL city. Only mounts in cinematic mode
// and after the first paint so map interactivity is never blocked.

import { lazy, Suspense, useEffect, useState } from "react";
import { useVisualMode } from "@/lib/visual-quality";

const NoirCityScene = lazy(() => import("./NoirCityScene"));

export function CityHero3D({ className = "" }: { className?: string }) {
  const { mode } = useVisualMode();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mode !== "cinematic") return;
    // Wait one frame past first interaction paint so 2D map is usable first.
    const id = window.setTimeout(() => setReady(true), 300);
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

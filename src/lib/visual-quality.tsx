// LAYER-0 — Visual quality system. Presentation-layer only.
// Two modes: CINEMATIC (default, all effects on) and LITE (site as it was).
// Persisted in localStorage. Auto-fallback on low memory, reduced-motion, or no WebGL.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type VisualMode = "cinematic" | "lite";
const KEY = "milverse.visual.mode";

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function autoForceLite(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error non-standard
  const mem = navigator.deviceMemory as number | undefined;
  if (typeof mem === "number" && mem <= 2) return true;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  if (!detectWebGL()) return true;
  return false;
}

interface Ctx {
  mode: VisualMode;
  setMode: (m: VisualMode) => void;
  forced: boolean;
}
const VisualCtx = createContext<Ctx>({ mode: "lite", setMode: () => {}, forced: false });

export function VisualQualityProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<VisualMode>("lite");
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const auto = autoForceLite();
    if (auto) {
      setModeState("lite");
      setForced(true);
      return;
    }
    let stored: VisualMode | null = null;
    try {
      const s = localStorage.getItem(KEY);
      if (s === "cinematic" || s === "lite") stored = s;
    } catch {}
    setModeState(stored ?? "cinematic");
  }, []);

  const setMode = (m: VisualMode) => {
    if (forced) return;
    setModeState(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {}
    if (typeof window !== "undefined") window.dispatchEvent(new Event("milverse:visual"));
  };

  return <VisualCtx.Provider value={{ mode, setMode, forced }}>{children}</VisualCtx.Provider>;
}

export function useVisualMode() {
  return useContext(VisualCtx);
}

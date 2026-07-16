// PASS-1 — Access infrastructure.
// A single provider that owns every accessibility preference the city offers.
// Composes with (never fights) the visual-quality store.
//
// Persisted in localStorage under "milverse.access.v1".
// Applied as data-* attributes on <html> so CSS can respond globally.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TextSize = "default" | "large" | "xl";
export interface AccessPrefs {
  textSize: TextSize;
  highLegibility: boolean;   // plain dark bg, no grain/flicker/vignette, denser leading
  forceReduceMotion: boolean; // additive to system prefers-reduced-motion
  transcriptsAlwaysOpen: boolean;
}

const DEFAULTS: AccessPrefs = {
  textSize: "default",
  highLegibility: false,
  forceReduceMotion: false,
  transcriptsAlwaysOpen: false,
};

const KEY = "milverse.access.v1";

interface Ctx {
  prefs: AccessPrefs;
  set: <K extends keyof AccessPrefs>(k: K, v: AccessPrefs[K]) => void;
  reset: () => void;
}

const AccessCtx = createContext<Ctx>({ prefs: DEFAULTS, set: () => {}, reset: () => {} });

function apply(prefs: AccessPrefs) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.dataset.textSize = prefs.textSize;
  html.dataset.highLegibility = prefs.highLegibility ? "on" : "off";
  html.dataset.forceReduceMotion = prefs.forceReduceMotion ? "on" : "off";
  html.dataset.transcriptsOpen = prefs.transcriptsAlwaysOpen ? "on" : "off";
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = { ...DEFAULTS, ...JSON.parse(raw) } as AccessPrefs;
        setPrefs(p);
        apply(p);
        return;
      }
    } catch {}
    apply(DEFAULTS);
  }, []);

  const set = <K extends keyof AccessPrefs>(k: K, v: AccessPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [k]: v };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      apply(next);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("milverse:access"));
      return next;
    });
  };

  const reset = () => {
    setPrefs(DEFAULTS);
    try { localStorage.removeItem(KEY); } catch {}
    apply(DEFAULTS);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("milverse:access"));
  };

  return <AccessCtx.Provider value={{ prefs, set, reset }}>{children}</AccessCtx.Provider>;
}

export function useAccess() { return useContext(AccessCtx); }

/** Query helper for imperative code (audio, animations). Reads live from the DOM. */
export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  const sys = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const forced = document.documentElement.dataset.forceReduceMotion === "on";
  return sys || forced;
}

// LAYER-0 — Shared animation utility. Presentation-layer only.
// Default easings/durations for GSAP. Lazy-loads gsap + ScrollTrigger on demand
// so nothing ships to the initial bundle. Every consumer must gate on
// useVisualMode() === "cinematic" — LITE must render exactly as before.

export const EASE = {
  entrance: "power3.out",
  exit: "power2.in",
  elastic: "elastic.out(1, 0.6)", // reserve for special moments
} as const;

export const DUR = {
  fast: 0.3,
  base: 0.45,
  slow: 0.6,
} as const;

export const STAGGER = {
  tight: 0.06,
  base: 0.075,
  loose: 0.09,
} as const;

let _gsapPromise: Promise<typeof import("gsap").gsap> | null = null;
export function loadGsap() {
  if (!_gsapPromise) {
    _gsapPromise = import("gsap").then((m) => m.gsap);
  }
  return _gsapPromise;
}

let _stPromise: Promise<typeof import("gsap/ScrollTrigger").ScrollTrigger> | null = null;
export async function loadScrollTrigger() {
  if (!_stPromise) {
    _stPromise = (async () => {
      const [gsap, st] = await Promise.all([loadGsap(), import("gsap/ScrollTrigger")]);
      gsap.registerPlugin(st.ScrollTrigger);
      return st.ScrollTrigger;
    })();
  }
  return _stPromise;
}

/** Stagger helper — pass an array length or elements, get gsap-friendly seconds. */
export function stagger(kind: keyof typeof STAGGER = "base") {
  return STAGGER[kind];
}

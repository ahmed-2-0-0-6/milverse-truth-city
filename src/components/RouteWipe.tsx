// LAYER-4 — Noir wipe on route change. 400ms, non-blocking.
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

export function RouteWipe() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    setKey((k) => k + 1);
  }, [path]);
  return (
    <div key={key} aria-hidden className="pointer-events-none fixed inset-0 z-[90] route-wipe" />
  );
}

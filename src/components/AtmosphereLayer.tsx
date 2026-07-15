// LAYER-5 — Film grain + vignette + subtle neon flicker overlay. CSS only.
import { useVisualMode } from "@/lib/visual-quality";

export function AtmosphereLayer() {
  const { mode } = useVisualMode();
  if (mode !== "cinematic") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] mix-blend-overlay">
      <div className="atmo-grain absolute inset-0 opacity-[0.08]" />
      <div className="atmo-vignette absolute inset-0" />
      <div className="atmo-flicker absolute inset-0" />
    </div>
  );
}

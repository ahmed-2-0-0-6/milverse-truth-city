// LAYER-0 — Toggle for CINEMATIC / LITE modes. Lives in the top bar.
import { Sparkles, Gauge } from "lucide-react";
import { useVisualMode } from "@/lib/visual-quality";

export function VisualQualityToggle() {
  const { mode, setMode, forced } = useVisualMode();
  const isCinematic = mode === "cinematic";
  return (
    <button
      onClick={() => setMode(isCinematic ? "lite" : "cinematic")}
      disabled={forced}
      className={`flex items-center gap-1.5 rounded border px-2 py-1.5 stencil text-[10px] transition-colors hover:bg-accent ${
        isCinematic ? "border-primary/50 text-primary" : "border-border text-muted-foreground"
      } ${forced ? "opacity-50 cursor-not-allowed" : ""}`}
      title={
        forced
          ? "LITE forced (low memory / reduced motion / no WebGL)"
          : isCinematic
            ? "Switch to LITE"
            : "Switch to CINEMATIC"
      }
      aria-label="Toggle visual quality"
    >
      {isCinematic ? <Sparkles className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isCinematic ? "CINEMATIC" : "LITE"}</span>
    </button>
  );
}

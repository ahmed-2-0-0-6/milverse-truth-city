import { Maximize2 } from "lucide-react";
import { useFullscreen } from "@/hooks/useFullscreen";

export function FullscreenToggle() {
  const { isFullscreen, isSupported, enterFullscreen } = useFullscreen();

  // Hide button completely when already in fullscreen or if not supported
  if (!isSupported || isFullscreen) return null;

  return (
    <button
      type="button"
      onClick={enterFullscreen}
      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/80 bg-background/80 text-foreground hover:bg-accent hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 shadow-sm"
      title="Enter Fullscreen Mode (F11)"
      aria-label="Enter Fullscreen Mode"
    >
      <Maximize2 className="h-4 w-4 text-primary" aria-hidden />
    </button>
  );
}

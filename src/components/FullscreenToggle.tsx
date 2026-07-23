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
      className="tap inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 stencil text-[10px] tracking-widest text-white/80 transition-all duration-200 backdrop-blur-md hover:border-primary/50 hover:text-white hover:bg-white/10 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      title="Enter Fullscreen Mode"
      aria-label="Enter Fullscreen Mode"
    >
      <Maximize2 className="h-3.5 w-3.5 text-primary/90" aria-hidden />
      <span>FULLSCREEN</span>
    </button>
  );
}

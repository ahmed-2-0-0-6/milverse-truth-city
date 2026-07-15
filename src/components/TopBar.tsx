import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  loadProfile,
  calibrationLabel,
  operatorRank,
  operatorCallsign,
  type TrustProfile,
} from "@/lib/mirror/profile";
import { isMuted, setMuted } from "@/lib/mirror/audio";
import { VisualQualityToggle } from "@/components/VisualQualityToggle";

export function TopBar() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [muted, setLocalMuted] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setLocalMuted(isMuted());
    const onProfile = () => setProfile(loadProfile());
    const onMute = () => setLocalMuted(isMuted());
    window.addEventListener("storage", onProfile);
    window.addEventListener("milverse:profile", onProfile);
    window.addEventListener("milverse:mute", onMute);
    return () => {
      window.removeEventListener("storage", onProfile);
      window.removeEventListener("milverse:profile", onProfile);
      window.removeEventListener("milverse:mute", onMute);
    };
  }, []);

  const cal = profile ? calibrationLabel(profile) : { label: "STANDBY", tone: "neutral" as const };
  const rank = profile ? operatorRank(profile) : null;
  const call = profile ? operatorCallsign(profile) : "———";
  const toneClass =
    cal.tone === "good" ? "text-primary border-primary/50"
    : cal.tone === "warn" ? "text-caution border-caution/50"
    : cal.tone === "bad" ? "text-destructive border-destructive/50"
    : "text-muted-foreground border-border";

  return (
    <header className="sticky top-0 z-50 border-b-2 border-primary/30 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-sm bg-primary shadow-[0_0_18px_oklch(0.82_0.16_85/0.7)] group-hover:animate-pulse" />
            <div className="absolute inset-1 rounded-sm border border-background/60" />
          </div>
          <div>
            <div className="stencil text-sm text-foreground leading-none">MILVERSE</div>
            <div className="stencil text-[9px] text-primary/70 mt-0.5 hidden sm:block">
              MEDIA &amp; INFORMATION LITERACY LAB
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 stencil text-[10px] text-muted-foreground border border-border rounded px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary hud-blink" />
            <span>HANDLE</span>
            <span className="text-foreground">{call}</span>
          </div>
          <VisualQualityToggle />
          <button
            onClick={() => { setMuted(!muted); setLocalMuted(!muted); }}
            className="rounded border border-border p-2 text-muted-foreground transition hover:text-foreground hover:bg-accent"
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <Link
            to="/city-hall"
            className={`flex items-center gap-2 rounded border px-2.5 py-1.5 stencil text-[10px] transition-colors hover:bg-accent ${toneClass}`}
          >
            {rank && <span className="opacity-70">{rank.code}</span>}
            <span className="hidden sm:inline text-foreground/90">{rank?.rank ?? "READER"}</span>
            <span className="text-muted-foreground">·</span>
            <span className="opacity-80">{cal.label.toUpperCase()}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

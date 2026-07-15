import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { loadProfile, calibrationLabel, type TrustProfile } from "@/lib/mirror/profile";
import { isMuted, setMuted } from "@/lib/mirror/audio";

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

  const cal = profile ? calibrationLabel(profile) : { label: "Recruit", tone: "neutral" as const };
  const toneClass =
    cal.tone === "good" ? "text-primary border-primary/40"
    : cal.tone === "warn" ? "text-caution border-caution/40"
    : cal.tone === "bad" ? "text-destructive border-destructive/40"
    : "text-muted-foreground border-border";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-6 w-6 rounded-sm bg-primary shadow-[0_0_18px_oklch(0.82_0.15_210/0.6)] group-hover:animate-pulse" />
          <div className="font-mono text-sm tracking-[0.28em] text-foreground">MILVERSE</div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMuted(!muted); setLocalMuted(!muted); }}
            className="rounded-md border border-border p-2 text-muted-foreground transition hover:text-foreground hover:bg-accent"
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <Link
            to="/city-hall"
            className={`flex items-center gap-3 rounded-md border px-3 py-1.5 text-xs font-mono transition-colors hover:bg-accent ${toneClass}`}
          >
            <span className="uppercase tracking-widest">TRUST</span>
            <span className="opacity-80">{cal.label}</span>
            {profile && (
              <span className="hidden sm:inline text-muted-foreground">
                · {profile.casesPlayed} case{profile.casesPlayed === 1 ? "" : "s"}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

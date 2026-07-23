// PASS-1 — Access panel. One place, discoverable from the TopBar.
// Uses Radix Sheet (already in ui/) which handles focus trap + ESC + return focus.

import { Accessibility, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAccess, type TextSize } from "@/lib/access";
import { isMuted, setMuted } from "@/lib/mirror/audio";
import { storageHealth } from "@/lib/storage";


const SIZE_LABEL: Record<TextSize, string> = {
  default: "Default",
  large: "Large",
  xl: "Extra Large",
};

export function AccessPanel() {
  const { prefs, set, reset } = useAccess();
  const [muted, setLocalMuted] = useState(false);
  const [quarantined, setQuarantined] = useState<string[]>([]);

  useEffect(() => {
    setLocalMuted(isMuted());
    setQuarantined(storageHealth().quarantined);
    const onMute = () => setLocalMuted(isMuted());
    window.addEventListener("milverse:mute", onMute);
    return () => window.removeEventListener("milverse:mute", onMute);
  }, []);


  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="rounded border border-border p-2 text-muted-foreground transition hover:text-foreground hover:bg-accent"
          aria-label="Open accessibility settings"
          title="Accessibility"
        >
          <Accessibility className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="stencil text-sm">Access · The City for Everyone</SheetTitle>
          <SheetDescription>
            Truth is not a premium feature. Tune the city to your eyes, ears, hands, and phone.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <fieldset>
            <legend className="stencil text-[11px] text-muted-foreground mb-2">Text size</legend>
            <div className="grid grid-cols-3 gap-2">
              {(["default", "large", "xl"] as TextSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => set("textSize", s)}
                  aria-pressed={prefs.textSize === s}
                  className={`rounded border px-3 py-2 text-sm transition ${
                    prefs.textSize === s
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {SIZE_LABEL[s]}
                </button>
              ))}
            </div>
          </fieldset>

          <ToggleRow
            id="access-high-legibility"
            label="High legibility mode"
            help="Plain dark background. No grain, flicker, or vignette. Denser line-height. Composes with LITE mode."
            checked={prefs.highLegibility}
            onChange={(v) => set("highLegibility", v)}
          />

          <ToggleRow
            id="access-reduce-motion"
            label="Reduce motion"
            help="Force calm animations even if your system does not request it. System preference is always respected."
            checked={prefs.forceReduceMotion}
            onChange={(v) => set("forceReduceMotion", v)}
          />

          <ToggleRow
            id="access-transcripts"
            label="Always show transcripts"
            help="Voice notes and calls open with their written transcript visible by default."
            checked={prefs.transcriptsAlwaysOpen}
            onChange={(v) => set("transcriptsAlwaysOpen", v)}
          />

          <ToggleRow
            id="access-dyslexic-font"
            label="Dyslexia friendly typography"
            help="Increases letter spacing, line height, and font clarity for neurodivergent reading accessibility."
            checked={prefs.dyslexicFont}
            onChange={(v) => set("dyslexicFont", v)}
          />

          <div className="flex items-center justify-between rounded border border-border p-3">
            <div>
              <div className="text-sm text-foreground">Sound</div>
              <div className="text-xs text-muted-foreground">
                Applies to voice notes, stings, and callback audio.
              </div>
            </div>
            <button
              onClick={() => {
                setMuted(!muted);
                setLocalMuted(!muted);
              }}
              className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
              aria-label={muted ? "Unmute sound" : "Mute sound"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{muted ? "Muted" : "On"}</span>
            </button>
          </div>

          <button
            onClick={reset}
            className="w-full rounded border border-border px-3 py-2 stencil text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            Reset to defaults
          </button>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Keyboard shortcut: <kbd className="rounded border border-border px-1">Tab</kbd> moves
            through controls; <kbd className="rounded border border-border px-1">Esc</kbd> closes
            overlays; arrow keys adjust sliders.
          </p>

          <div className="rounded border border-border p-3 text-xs text-muted-foreground">
            <div className="stencil text-[10px] mb-1">Cold storage integrity</div>
            {quarantined.length === 0 ? (
              <div>All records intact. No quarantine on disk.</div>
            ) : (
              <div>
                {quarantined.length} record{quarantined.length === 1 ? "" : "s"} quarantined for
                recovery: <span className="font-mono">{quarantined.join(", ")}</span>
              </div>
            )}
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}

function ToggleRow({
  id,
  label,
  help,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded border border-border p-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm text-foreground cursor-pointer">
          {label}
        </label>
        <div className="text-xs text-muted-foreground mt-1">{help}</div>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`shrink-0 relative h-6 w-11 rounded-full border transition ${
          checked ? "bg-primary border-primary" : "bg-muted border-border"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition ${
            checked ? "left-[calc(100%-1.375rem)]" : "left-0.5"
          }`}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

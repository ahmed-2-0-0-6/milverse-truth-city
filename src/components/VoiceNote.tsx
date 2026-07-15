import { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { playVoiceNote, waveformBars, inferGender, type PlaybackHandle } from "@/lib/mirror/voice";
import type { VoicePayload } from "@/lib/mirror/engine";

interface Props {
  voice: VoicePayload;
  fromPlayer?: boolean;
  speakerName?: string;
  speakerVoiceDesc?: string;
}

export function VoiceNote({ voice, fromPlayer = false, speakerName, speakerVoiceDesc }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const bars = waveformBars(voice.text);

  useEffect(() => {
    return () => handleRef.current?.cancel();
  }, []);

  function toggle() {
    if (playing) {
      handleRef.current?.cancel();
      handleRef.current = null;
      setPlaying(false);
      return;
    }
    setProgress(0);
    setPlaying(true);
    const gender = fromPlayer ? "neutral" : inferGender(speakerName, speakerVoiceDesc);
    const h = playVoiceNote(voice.text, voice.artifact, voice.artifactPos, gender);
    handleRef.current = h;
    h.onProgress((t) => {
      setProgress(t);
      if (t >= 1) {
        setPlaying(false);
        handleRef.current = null;
      }
    });
  }

  const bg = fromPlayer
    ? "bg-primary text-primary-foreground rounded-br-sm"
    : "bg-card border border-border rounded-bl-sm";
  const barCol = fromPlayer ? "bg-primary-foreground/70" : "bg-primary/70";
  const barColActive = fromPlayer ? "bg-primary-foreground" : "bg-primary";

  return (
    <div className={`msg-in max-w-[80%] rounded-2xl px-3 py-2.5 ${bg}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            fromPlayer ? "bg-primary-foreground/15 hover:bg-primary-foreground/25" : "bg-primary/15 hover:bg-primary/25"
          }`}
          aria-label={playing ? "Pause voice note" : "Play voice note"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="flex items-end gap-[2px] h-8">
            {bars.map((h, i) => {
              const active = i / bars.length <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${active ? barColActive : barCol}`}
                  style={{ height: `${Math.max(8, h * 100)}%`, opacity: active ? 1 : 0.4 }}
                />
              );
            })}
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[10px] tracking-widest opacity-70">
            <span className="flex items-center gap-1">
              <Mic className="h-2.5 w-2.5" /> VOICE NOTE
            </span>
            <span>{Math.round((handleRef.current?.duration ?? 3) * (playing ? (1 - progress) : 1))}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Shield, PhoneCall, Check } from "lucide-react";
import type { JuniorAdultScene } from "@/lib/firstPhone/lessons";
import { JUNIOR_COPY } from "@/lib/firstPhone/copy";

interface Props {
  scene: JuniorAdultScene;
  onResolved: () => void;
  className?: string;
}

/**
 * Junior-mode protocol move. Config-level: reuses boss engine's move pattern —
 * a persistent, always-available reply chip that resolves the case as a
 * correct-protocol win. No engine changes.
 */
export function TrustedAdultChip({ scene, onResolved, className }: Props) {
  const [stage, setStage] = useState<"idle" | "calling" | "done">("idle");

  if (stage === "calling") {
    return (
      <div className={`rounded-xl border border-primary/40 bg-primary/5 p-5 ${className ?? ""}`}>
        <div className="flex items-center gap-2 text-primary">
          <PhoneCall className="h-4 w-4 animate-pulse" />
          <span className="font-mono text-[11px] tracking-widest">CALLING {scene.who.toUpperCase()}…</span>
        </div>
        <button
          onClick={() => setStage("done")}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium"
        >
          Connect
        </button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className={`rounded-xl border border-primary/40 bg-primary/10 p-5 ${className ?? ""}`}>
        <div className="font-mono text-[11px] tracking-widest text-primary">{scene.who.toUpperCase()} SAYS</div>
        <p className="mt-2 text-base leading-relaxed">"{scene.line}"</p>
        <div className="mt-4 flex items-center gap-2 text-primary">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">{JUNIOR_COPY.trustedAdultCelebrate}</span>
        </div>
        <button
          onClick={onResolved}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStage("calling")}
      className={`w-full rounded-xl border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors p-4 flex items-center justify-center gap-2 ${className ?? ""}`}
    >
      <Shield className="h-4 w-4 text-primary" />
      <span className="font-mono text-[11px] tracking-widest text-primary">{JUNIOR_COPY.trustedAdultChip}</span>
    </button>
  );
}

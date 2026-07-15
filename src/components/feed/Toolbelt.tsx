// MILVERSE — Verification Toolbelt.
// Groups scenario actions by REAL-WORLD tool. Teaches tool choice.
// Wrong tool for the media format = a soft cue after use (never grades for the player).

import { useState } from "react";
import { Image as ImageIcon, Globe2, Layers, CalendarClock } from "lucide-react";
import type { FeedAction, FeedFormat, FeedToolKind } from "@/lib/feed/scenarios";

const TOOLS: { kind: FeedToolKind; label: string; Icon: typeof ImageIcon; hint: string; bestFor: FeedFormat[] }[] = [
  { kind: "reverse_image", label: "REVERSE IMAGE SEARCH", Icon: ImageIcon, hint: "Best when the claim rides on a photo or video frame.",  bestFor: ["image", "instagram", "video"] },
  { kind: "check_source",  label: "CHECK THE SOURCE",     Icon: Globe2,    hint: "Best when the claim wears a newsroom, brand, or handle.", bestFor: ["news", "instagram", "whatsapp"] },
  { kind: "cross_check",   label: "CROSS-CHECK OUTLETS",  Icon: Layers,    hint: "Best when you need a second independent witness.",       bestFor: ["news", "whatsapp", "video"] },
  { kind: "check_date",    label: "CHECK DATE / METADATA",Icon: CalendarClock, hint: "Best when the claim depends on 'yesterday' or 'now'.", bestFor: ["whatsapp", "image", "news"] },
];

interface Props {
  actions: FeedAction[];
  format: FeedFormat;
  used: string[];
  onUse: (actionId: string) => void;
}

export function Toolbelt({ actions, format, used, onUse }: Props) {
  const [wrongToolFlash, setWrongToolFlash] = useState<FeedToolKind | null>(null);

  return (
    <div className="space-y-4">
      <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
        VERIFICATION TOOLBELT · pick the right tool for a {format.toUpperCase()} artifact
      </div>
      {TOOLS.map((tool) => {
        const matching = actions.filter((a) => (a.tool ?? "check_source") === tool.kind);
        if (matching.length === 0) return null;
        const isBest = tool.bestFor.includes(format);
        const flashed = wrongToolFlash === tool.kind;
        return (
          <section key={tool.kind} className={`rounded-md border ${isBest ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card"} p-3`}>
            <header className="flex items-center gap-2 mb-2">
              <tool.Icon className={`h-4 w-4 ${isBest ? "text-primary" : "text-muted-foreground"}`} />
              <div className="stencil text-[10px] tracking-widest">{tool.label}</div>
              {isBest && <span className="stencil text-[9px] text-primary">· FIT</span>}
            </header>
            <p className="text-[11px] text-muted-foreground mb-2">{tool.hint}</p>
            {flashed && !isBest && (
              <p className="text-[11px] text-caution mb-2">
                Not the best fit for a {format} artifact — but the result still counts. Consider a {tool.bestFor[0].toUpperCase()} tool next time.
              </p>
            )}
            <div className="space-y-1.5">
              {matching.map((a) => {
                const isUsed = used.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => { if (!isBest) setWrongToolFlash(tool.kind); onUse(a.id); }}
                    disabled={isUsed}
                    className={`w-full text-left rounded-md border p-2.5 text-sm transition ${
                      isUsed ? "border-primary/40 bg-primary/5 opacity-80" : "border-border hover:border-primary/50 bg-background/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.label}</span>
                      {isUsed && <span className="ml-auto font-mono text-[10px] tracking-widest text-primary">USED</span>}
                    </div>
                    {isUsed && <div className="mt-1.5 text-xs text-muted-foreground">{a.result}</div>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

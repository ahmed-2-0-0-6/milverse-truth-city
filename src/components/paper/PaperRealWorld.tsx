// THE DAILY MIRAGE — This Week in the Real World.
import type { EditionRealWorld } from "@/lib/paper/types";
import { ExternalLink } from "lucide-react";

export function PaperRealWorld({ realWorld }: { realWorld: EditionRealWorld }) {
  return (
    <section
      className="paper-section max-w-3xl mx-auto border-4 double p-5"
      style={{ borderColor: "var(--paper-ink)" }}
    >
      <div className="paper-section-kicker">THIS WEEK · IN THE REAL WORLD</div>
      <p className="paper-serif mt-2 text-base leading-relaxed">{realWorld.lede}</p>
      <a
        href={realWorld.linkHref}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex items-center gap-1 paper-mono text-[11px] tracking-[0.2em] underline decoration-dotted"
      >
        {realWorld.linkLabel} <ExternalLink className="h-3 w-3" />
      </a>
    </section>
  );
}

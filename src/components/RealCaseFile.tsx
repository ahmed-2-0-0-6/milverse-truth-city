// MILVERSE — "REAL CASE FILE" declassified-stamp card for the debrief.
import { INSPIRED_BY, type InspiredByCase } from "@/lib/mirror/inspired";
import { FileText } from "lucide-react";

export function RealCaseFile({ caseId, inline }: { caseId: string; inline?: InspiredByCase }) {
  const data = inline ?? INSPIRED_BY[caseId];
  if (!data) return null;
  return (
    <section className="relative rounded-sm border-2 border-caution/60 bg-caution/5 p-6 overflow-hidden">
      <div className="pointer-events-none absolute -right-8 -top-2 rotate-12 border-2 border-destructive/60 px-3 py-1 stencil text-[10px] tracking-widest text-destructive/80 bg-background/70">
        DECLASSIFIED · CASE FILE
      </div>
      <div className="flex items-center gap-2 stencil text-[10px] tracking-widest text-caution mb-2">
        <FileText className="h-3.5 w-3.5" /> INSPIRED BY A REAL CASE
      </div>
      <h3 className="text-lg font-semibold">
        {data.patternName}
        <span className="ml-2 stencil text-[10px] text-muted-foreground">
          {data.country} · {data.year}
        </span>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{data.whatHappened}</p>
      <div className="mt-4 border-t border-caution/30 pt-3">
        <div className="stencil text-[10px] tracking-widest text-primary mb-2">HOW IT'S BEATEN</div>
        <ul className="space-y-1.5">
          {data.prevention.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-primary font-mono">▸</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground italic">
        Tactics only. No real names, numbers, or messages are reproduced.
      </p>
    </section>
  );
}

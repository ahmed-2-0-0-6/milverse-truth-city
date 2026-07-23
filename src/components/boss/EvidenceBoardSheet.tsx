import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Pin, ShieldCheck } from "lucide-react";
import type { BossState } from "@/lib/boss/engine";
import type { BossVariant } from "@/lib/boss/types";

interface Props {
  open: boolean;
  onClose: () => void;
  state: BossState | null;
  variant: BossVariant | null;
}

export function EvidenceBoardSheet({ open, onClose, state, variant }: Props) {
  if (!state || !variant) return null;

  const usedChecks = state.factChecksUsed.map(id => variant.factChecks.find(f => f.id === id)).filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] bg-black border-t border-cyan-900/50 p-0 sm:max-w-none">
        <SheetHeader className="px-6 py-4 border-b border-white/10 bg-neutral-900/40 text-left">
          <SheetTitle className="text-cyan-400 font-mono text-xs tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4" /> EVIDENCE BOARD
          </SheetTitle>
        </SheetHeader>
        <div className="p-6 overflow-y-auto max-h-full space-y-4 pb-24">
          <p className="text-sm text-white/70 italic max-w-xl">
            This board pins the results of your completed fact-checks. Remember: in Boss cases, facts often support the cover story. The trap is believing the story instead of verifying the channel.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {usedChecks.length === 0 && (
              <div className="col-span-full border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-white/40">
                <Pin className="w-6 h-6 mb-2 opacity-50" />
                <span className="font-mono text-xs">NO EVIDENCE PINNED YET</span>
              </div>
            )}
            
            {usedChecks.map((check) => (
              <div key={check?.id} className="relative border border-cyan-900/40 bg-cyan-950/20 rounded-xl p-4 shadow-lg overflow-hidden group">
                <div className="absolute top-0 right-0 w-8 h-8 flex items-start justify-end p-2 pointer-events-none">
                  <Pin className="w-4 h-4 text-cyan-500/60 -rotate-12 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h4 className="text-cyan-300 font-semibold text-sm mb-2 pr-6">
                  {check?.label}
                </h4>
                <div className="text-white/90 text-sm mb-3">
                  {check?.result}
                </div>
                {check?.supportsCoverStory && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-950/40 border border-red-900/50 text-[10px] tracking-wider text-red-400 font-mono mt-2">
                    <ShieldCheck className="w-3 h-3" />
                    SUPPORTS COVER STORY
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

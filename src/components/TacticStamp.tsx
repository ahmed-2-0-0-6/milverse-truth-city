// MILVERSE — Tactic reveal stamp for case debriefs.
// Presentational only. Links to the Field Manual entry.

import { Link } from "@tanstack/react-router";
import { FileSearch } from "lucide-react";
import { getManualEntry, type TacticId } from "@/lib/manual/entries";
import { useEffect, useState } from "react";
import { unlockTactic } from "@/lib/manual/state";

export function TacticStamp({
  tacticId,
  autoUnlock = true,
}: {
  tacticId: TacticId;
  autoUnlock?: boolean;
}) {
  const entry = getManualEntry(tacticId);
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    if (autoUnlock) {
      const fresh = unlockTactic(tacticId);
      if (fresh) setJustUnlocked(true);
    }
  }, [tacticId, autoUnlock]);

  if (!entry) return null;

  return (
    <div className="rounded-xl border-2 border-primary/50 bg-primary/[0.06] p-5 relative overflow-hidden">
      <div
        className="absolute -right-8 -top-4 rotate-12 stencil text-[9px] tracking-[0.35em] text-primary/60 border border-primary/40 px-3 py-1"
        aria-hidden
      >
        FIELD MANUAL · {entry.code}
      </div>
      <div className="flex items-center gap-2 stencil text-[10px] tracking-[0.3em] text-primary">
        <FileSearch className="h-3.5 w-3.5" />
        TACTIC IDENTIFIED
        {justUnlocked && (
          <span className="ml-1 rounded-sm bg-primary/20 px-1.5 py-0.5 text-[9px] text-primary">
            + NEW MANUAL ENTRY
          </span>
        )}
      </div>
      <div
        className="mt-2 text-2xl font-black tracking-tight"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        {entry.name}
      </div>
      <p className="mt-1 text-sm text-muted-foreground italic">{entry.oneLine}</p>
      <Link
        to="/manual/$entryId"
        params={{ entryId: entry.id }}
        className="mt-3 inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 stencil text-[10px] tracking-widest text-primary hover:bg-primary/20"
      >
        OPEN MANUAL ENTRY →
      </Link>
    </div>
  );
}

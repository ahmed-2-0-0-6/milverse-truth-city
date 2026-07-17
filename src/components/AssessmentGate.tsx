// MILVERSE — pilot-only nudge that appears when a group is joined and the
// player hasn't done intake (or when the group is in exit phase and they
// haven't done exit). Renders nothing for non-pilot players.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getActiveGroup } from "@/lib/pilot";
import { getCodename, hashCodename, hasAttempt, syncPending } from "@/lib/assessment/state";
import { fetchGroupPhase } from "@/lib/assessment.functions";

export function AssessmentGate() {
  const fetchPhase = useServerFn(fetchGroupPhase);
  const [needed, setNeeded] = useState<null | "intake" | "exit">(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const g = getActiveGroup();
      if (!g) {
        setNeeded(null);
        return;
      }
      const hash = await hashCodename(getCodename());
      let phase: "intake" | "exit" = "intake";
      try {
        const res = await fetchPhase({ data: { groupCode: g } as never });
        phase = (res as { phase: "intake" | "exit" }).phase;
      } catch {
        /* offline OK */
      }
      if (cancelled) return;
      if (phase === "intake" && !hasAttempt(g, hash, "intake")) {
        setNeeded("intake");
        return;
      }
      if (phase === "exit" && !hasAttempt(g, hash, "exit")) {
        setNeeded("exit");
        return;
      }
      setNeeded(null);
    }
    void check();
    void syncPending();
    const on = () => void check();
    window.addEventListener("milverse:pilot", on);
    window.addEventListener("milverse:assessment", on);
    return () => {
      cancelled = true;
      window.removeEventListener("milverse:pilot", on);
      window.removeEventListener("milverse:assessment", on);
    };
  }, [fetchPhase]);

  if (!needed) return null;
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path === "/assessment") return null;

  return (
    <div className="sticky top-0 z-50 border-b border-primary/40 bg-primary/10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs">
        <div className="min-w-0">
          <span className="stencil text-[10px] tracking-widest text-primary">
            CITIZEN BASELINE · {needed === "intake" ? "INTAKE REQUIRED" : "EXIT AVAILABLE"}
          </span>
          <span className="ml-2 text-muted-foreground">
            {needed === "intake"
              ? "3 minutes. The city measures before it trains."
              : "3 minutes. See what a week in the city changed."}
          </span>
        </div>
        <Link
          to="/assessment"
          className="shrink-0 rounded-md border border-primary bg-primary px-3 py-1.5 stencil text-[10px] tracking-widest text-primary-foreground"
        >
          {needed === "intake" ? "TAKE BASELINE" : "TAKE EXIT"}
        </Link>
      </div>
    </div>
  );
}

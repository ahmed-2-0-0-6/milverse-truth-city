// MILVERSE — "REOPENED FILE" strip on the Mirror hub.
// Surfaces due retests. NEVER names the tactic or the source case.
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileClock } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { dueRetests, type Retest } from "@/lib/mirror/retests";
import { getScenario } from "@/lib/mirror/scenarios";

interface Row {
  retest: Retest;
  title: string;
  teaser: string;
  tier: number;
}

export function ReopenedStrip() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const build = () => {
      const due = dueRetests(loadProfile());
      const out: Row[] = [];
      for (const r of due) {
        const s = getScenario(r.retestCaseId);
        if (!s) continue;
        out.push({ retest: r, title: s.title, teaser: s.teaser, tier: s.tier });
      }
      setRows(out);
    };
    build();
    const on = () => build();
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:retests", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:retests", on);
    };
  }, []);

  if (!rows.length) return null;
  return (
    <section className="mb-8" aria-label="reopened file">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-widest text-caution">
        <FileClock className="h-3 w-3" /> REOPENED FILE
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((row) => (
          <Link
            key={row.retest.id}
            to="/mirror/$caseId"
            params={{ caseId: row.retest.retestCaseId }}
            aria-label={`reopened file — ${row.title}`}
            className="reopen-card group relative rounded-sm border border-caution/40 bg-caution/5 p-4 pl-5 transition hover:border-caution"
          >
            <span className="reopen-pulse pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-caution" aria-hidden />
            <div className="font-mono text-[9px] tracking-widest text-caution/80">
              REOPENED FILE · TIER {row.tier}
            </div>
            <div className="mt-1.5 text-sm font-semibold group-hover:text-caution">
              {row.title}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{row.teaser}</div>
            <div className="mt-3 border-t border-caution/20 pt-2 text-[11px] italic text-muted-foreground">
              The city has follow-up business with you.
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-widest text-caution">
              ANSWER IT →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

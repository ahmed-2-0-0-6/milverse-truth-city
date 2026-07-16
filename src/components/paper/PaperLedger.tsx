// THE DAILY MIRAGE — The Ledger. City stats box in stock-ticker styling.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPaperSplit } from "@/lib/paper.functions";
import { fetchSharpestWatch } from "@/lib/daily.functions";

export function PaperLedger({ editionNumber, note }: { editionNumber: number; note?: string }) {
  const [lead, setLead] = useState<{ total: number; correct: number } | null>(null);
  const [forg, setForg] = useState<{ total: number; correct: number } | null>(null);
  const [sharp, setSharp] = useState<Array<{ handle: string; correct_pct: number }>>([]);
  const gp = useServerFn(getPaperSplit);
  useEffect(() => {
    void gp({ data: { number: editionNumber, section: "lead" } }).then((s) => setLead(s as { total: number; correct: number })).catch(() => {});
    void gp({ data: { number: editionNumber, section: "forgery" } }).then((s) => setForg(s as { total: number; correct: number })).catch(() => {});
    void fetchSharpestWatch().then((r) => setSharp((r.rows ?? []).slice(0, 3))).catch(() => {});
  }, [gp, editionNumber]);

  const leadPct = lead && lead.total ? Math.round(((lead.total - lead.correct) / lead.total) * 100) : null;
  const forgPct = forg && forg.total ? Math.round((forg.correct / forg.total) * 100) : null;

  return (
    <section className="mt-2">
      <div className="paper-mono text-[10px] tracking-[0.3em] text-[color:var(--paper-muted)]">THE LEDGER · CITY DESK</div>
      <div className="mt-2 border-y-4 double" style={{ borderColor: "var(--paper-ink)" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-current/30 paper-mono text-xs" style={{ divideColor: "var(--paper-rule)" } as never}>
          <Cell label="FOOLED BY LEAD" value={leadPct === null ? "—" : `${leadPct}%`} sub={lead ? `${lead.total} plays` : ""} />
          <Cell label="FORGERY ACC." value={forgPct === null ? "—" : `${forgPct}%`} sub={forg ? `${forg.total} guesses` : ""} />
          <Cell label="SHARPEST" value={sharp[0]?.handle ?? "—"} sub={sharp[0] ? `${sharp[0].correct_pct}%` : ""} />
          <Cell label="EDITION" value={`#${String(editionNumber).padStart(3, "0")}`} sub="live" />
        </div>
      </div>
      {note && <p className="paper-serif italic text-sm mt-3 text-[color:var(--paper-muted)]">{note}</p>}
    </section>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3">
      <div className="paper-mono text-[10px] tracking-[0.25em] text-[color:var(--paper-muted)]">{label}</div>
      <div className="paper-serif text-2xl mt-0.5" style={{ fontWeight: 900 }}>{value}</div>
      {sub && <div className="paper-mono text-[10px] mt-0.5 text-[color:var(--paper-muted)]">{sub}</div>}
    </div>
  );
}

// MILVERSE — THE INTELLIGENCE DESK.
// Passcode-gated (server-side, matches /review). Zero player-facing exposure.
// Three tabs: Precinct Board (aggregates), AI Briefs, Pre-flight Checklist.

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import {
  Lock,
  Radio,
  ClipboardCopy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  fetchIntelligence,
  listBriefs,
  runAnalysisBrief,
  type IntelSummary,
  type Brief,
} from "@/lib/devintel.functions";
import { runHeuristicChecks, type HeuristicResult } from "@/lib/devintel-checks";

export const Route = createFileRoute("/devintel")({
  head: () => ({
    meta: [
      { title: "Intelligence Desk — MILVERSE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DevIntelPage,
});

type Tab = "board" | "briefs" | "checklist";

function DevIntelPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("board");
  const [intel, setIntel] = useState<IntelSummary | null>(null);
  const [briefs, setBriefs] = useState<
    Array<{ id: string; created_at: string; brief: Brief; source: string }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchIntelFn = useServerFn(fetchIntelligence);
  const listBriefsFn = useServerFn(listBriefs);
  const runBriefFn = useServerFn(runAnalysisBrief);

  async function authenticate() {
    setErr(null);
    setBusy(true);
    try {
      const s = await fetchIntelFn({ data: { passcode } });
      setIntel(s);
      const b = await listBriefsFn({ data: { passcode } });
      setBriefs((b as unknown as { rows: typeof briefs }).rows);
      setAuthed(true);
      toast.success("Intel desk open");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Access denied.";
      setErr(msg);
      toast.error("Access denied", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function refreshIntel() {
    setBusy(true);
    try {
      const s = await fetchIntelFn({ data: { passcode } });
      setIntel(s);
      toast.success("Intel refreshed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      toast.error("Refresh failed", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function runBrief() {
    setBusy(true);
    setErr(null);
    try {
      await runBriefFn({ data: { passcode } });
      const b = await listBriefsFn({ data: { passcode } });
      setBriefs((b as unknown as { rows: typeof briefs }).rows);
      setTab("briefs");
      toast.success("New brief generated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      toast.error("Brief generation failed", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen grain">
        <TopBar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <Lock className="mx-auto h-6 w-6 text-primary" />
          <h1
            className="mt-3 text-2xl font-black"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            INTELLIGENCE DESK
          </h1>
          <p className="stencil text-[10px] text-muted-foreground mt-1">
            RESTRICTED · PASSCODE REQUIRED
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void authenticate();
            }}
            className="mt-6 flex flex-col gap-2"
          >
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Passcode"
              autoComplete="current-password"
            />
            <button
              disabled={busy || !passcode}
              className="rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {busy ? "OPENING FILE…" : "ENTER"}
            </button>
            {err && <div className="text-xs text-destructive mt-1">{err}</div>}
          </form>
          <p className="mt-6 text-[10px] text-muted-foreground italic">
            Zero telemetry contains message content or player identity — only anonymous, aggregate
            counts.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="stencil text-[10px] tracking-[0.35em] text-primary">
              INTELLIGENCE DESK
            </div>
            <h1 className="text-4xl font-black" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              PRECINCT BOARD
            </h1>
          </div>
          <button
            onClick={refreshIntel}
            disabled={busy}
            className="stencil text-[10px] text-muted-foreground hover:text-foreground"
          >
            REFRESH
          </button>
        </div>

        <div className="mt-5 flex gap-1 border-b border-border">
          {(["board", "briefs", "checklist"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 stencil text-[10px] tracking-widest border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "board" ? "PRECINCT BOARD" : t === "briefs" ? "AI BRIEFS" : "PRE-FLIGHT"}
            </button>
          ))}
        </div>

        {err && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {err}
          </div>
        )}

        {tab === "board" && intel && <BoardTab intel={intel} onRunBrief={runBrief} busy={busy} />}
        {tab === "briefs" && <BriefsTab briefs={briefs} onRunBrief={runBrief} busy={busy} />}
        {tab === "checklist" && <ChecklistTab />}
      </main>
    </div>
  );
}

function BoardTab({
  intel,
  onRunBrief,
  busy,
}: {
  intel: IntelSummary;
  onRunBrief: () => void;
  busy: boolean;
}) {
  const funnelPct = (n: number, base: number) => (base > 0 ? Math.round((n / base) * 100) : 0);
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <Card title="TRAFFIC" chip={`${intel.windowDays}d WINDOW`}>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="SESSIONS" value={intel.sessions} />
          <Stat label="EVENTS" value={intel.totalEvents} />
          <Stat label="ERRORS" value={intel.errors.reduce((s, e) => s + e.count, 0)} tone="bad" />
        </div>
        <div className="mt-4 stencil text-[10px] text-muted-foreground">FUNNEL</div>
        <FunnelRow
          label="LANDING"
          count={intel.funnel.landing}
          base={intel.funnel.landing}
          pct={100}
        />
        <FunnelRow
          label="FIRST CASE"
          count={intel.funnel.firstCase}
          base={intel.funnel.landing}
          pct={funnelPct(intel.funnel.firstCase, intel.funnel.landing)}
        />
        <FunnelRow
          label="DAY-2 RETURN"
          count={intel.funnel.day2Return}
          base={intel.funnel.landing}
          pct={funnelPct(intel.funnel.day2Return, intel.funnel.landing)}
        />
      </Card>

      <Card title="TOP ROUTES">
        <List
          rows={intel.routeVisits
            .slice(0, 10)
            .map((r) => ({ left: r.route, right: String(r.count) }))}
        />
        {intel.deadZones.length > 0 && (
          <>
            <div className="mt-4 stencil text-[10px] text-caution">DEAD ZONES</div>
            <List
              tone="warn"
              rows={intel.deadZones.map((z) => ({ left: z.route, right: z.reason }))}
            />
          </>
        )}
      </Card>

      <Card title="5 HARDEST CASES" chip="FOOL RATE">
        <List
          rows={intel.hardestCases.map((c) => ({
            left: c.case_id,
            right: `${Math.round(c.foolRate * 100)}% · n=${c.plays}`,
            tone: c.foolRate > 0.6 ? "bad" : undefined,
          }))}
        />
      </Card>

      <Card title="5 MOST ABANDONED" chip="ABANDON RATE">
        <List
          rows={intel.mostAbandoned.map((c) => ({
            left: c.case_id,
            right: `${Math.round(c.abandonRate * 100)}% · starts=${c.starts}`,
            tone: c.abandonRate > 0.5 ? "bad" : undefined,
          }))}
        />
      </Card>

      <Card title="WAGER HEALTH">
        {Object.keys(intel.wager.buckets).length === 0 ? (
          <div className="text-xs text-muted-foreground">Nobody's wagered yet.</div>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(intel.wager.buckets).map(([bucket, count]) => {
              const correct = intel.wager.correctByBucket[bucket] ?? 0;
              const pct = count > 0 ? Math.round((correct / count) * 100) : 0;
              return (
                <div key={bucket} className="flex items-center gap-2 text-xs">
                  <span className="w-12 font-mono">{bucket}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pct >= 60 ? "bg-primary" : "bg-caution"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-muted-foreground font-mono">
                    {pct}% · {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="DAILY DROP RETENTION" chip="14d">
        {intel.dropRetention.length === 0 ? (
          <div className="text-xs text-muted-foreground">Drop board's cold this week.</div>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {intel.dropRetention.map((d) => {
              const max = Math.max(1, ...intel.dropRetention.map((x) => x.players));
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/70 rounded-t"
                    style={{ height: `${(d.players / max) * 88}px` }}
                    title={`${d.day}: ${d.players}`}
                  />
                  <div className="text-[8px] text-muted-foreground">{d.day.slice(5)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="TOOLBELT PICKS">
        <List
          rows={intel.toolPicks.map((t) => ({
            left: t.tool,
            right: `${t.picks}× · fit ${t.correctRate == null ? "—" : Math.round(t.correctRate * 100) + "%"}`,
          }))}
        />
      </Card>

      <Card title="MANUAL OPENS">
        <List
          rows={intel.manualOpens
            .slice(0, 10)
            .map((m) => ({ left: m.entry, right: String(m.count) }))}
        />
      </Card>

      <Card title="MISC">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="SHARE COPIES" value={intel.shareCopies} />
          <Stat
            label="LITE FALLBACKS"
            value={intel.liteFallbacks}
            tone={intel.liteFallbacks > 10 ? "warn" : undefined}
          />
        </div>
      </Card>

      <Card title="ERROR LOG" chip={String(intel.errors.length)}>
        {intel.errors.length === 0 ? (
          <div className="text-xs text-muted-foreground">No errors logged.</div>
        ) : (
          <ul className="space-y-1 text-[11px] font-mono">
            {intel.errors.slice(0, 8).map((e) => (
              <li key={e.message} className="text-destructive">
                <span className="text-muted-foreground">×{e.count}</span> {e.message}
                {e.sample_route && (
                  <span className="text-muted-foreground"> · {e.sample_route}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="md:col-span-2 flex items-center justify-between rounded-md border border-primary/40 bg-primary/[0.06] p-4">
        <div>
          <div className="stencil text-[10px] tracking-widest text-primary">RUN ANALYSIS</div>
          <div className="text-xs text-muted-foreground mt-1">
            Sends AGGREGATE stats (numbers only) to the AI. Never runs automatically.
          </div>
        </div>
        <button
          onClick={onRunBrief}
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {busy ? "ANALYZING…" : "RUN"}
        </button>
      </div>
    </div>
  );
}

function BriefsTab({
  briefs,
  onRunBrief,
  busy,
}: {
  briefs: Array<{ id: string; created_at: string; brief: Brief; source: string }>;
  onRunBrief: () => void;
  busy: boolean;
}) {
  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-card p-3">
        <div className="text-xs text-muted-foreground">
          Last {briefs.length}/10 briefs. Each cached with its snapshot.
        </div>
        <button
          onClick={onRunBrief}
          disabled={busy}
          className="rounded-md bg-primary px-3 py-1.5 stencil text-[10px] tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "NEW BRIEF"}
        </button>
      </div>
      {briefs.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Nothing filed. Trigger a brief from the Precinct Board.
        </div>
      )}
      {briefs.map((b) => (
        <div key={b.id} className="rounded-lg border-2 border-primary/30 bg-card p-4">
          <div className="flex items-baseline justify-between">
            <div className="stencil text-[10px] tracking-widest text-primary">
              {b.source === "ai" ? "AI BRIEF" : "FALLBACK BRIEF"}
            </div>
            <div className="stencil text-[9px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(b.created_at).toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">{b.brief.headline}</div>
          <div className="mt-3 space-y-3">
            {b.brief.items.map((it, i) => (
              <div key={i} className="rounded-md border border-border bg-background/60 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-caution mt-0.5" />
                  <div className="text-sm font-semibold">{it.problem}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="stencil text-[9px] text-primary">EVIDENCE · </span>
                  {it.evidence}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="stencil text-[9px] text-primary">HYPOTHESIS · </span>
                  {it.hypothesis}
                </div>
                <div className="mt-3 relative">
                  <pre className="max-h-40 overflow-auto rounded-sm border border-border bg-black/30 p-2 text-[11px] whitespace-pre-wrap font-mono">
                    {it.prompt}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(it.prompt);
                    }}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-sm bg-primary px-2 py-1 stencil text-[9px] text-primary-foreground"
                  >
                    <ClipboardCopy className="h-3 w-3" /> COPY PROMPT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistTab() {
  const results = useMemo(() => runHeuristicChecks(), []);
  const pass = results.filter((r) => r.status === "pass").length;
  const total = results.length;
  const clear = pass === total;
  return (
    <div className="mt-5 space-y-4">
      <div
        className={`rounded-lg border-2 p-5 ${clear ? "border-primary/50 bg-primary/[0.06]" : "border-caution/50 bg-caution/[0.05]"}`}
      >
        <div className="stencil text-[10px] tracking-widest text-muted-foreground">PRE-FLIGHT</div>
        <div
          className="mt-1 text-4xl font-black"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          {clear ? "CLEAR FOR JUDGES" : "HOLD"} · {pass}/{total}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Deterministic checks. No AI, no network.
        </div>
      </div>
      <ul className="space-y-2">
        {results.map((r) => (
          <li
            key={r.id}
            className={`flex items-start gap-3 rounded-md border p-3 ${r.status === "pass" ? "border-border bg-card" : r.status === "warn" ? "border-caution/40 bg-caution/[0.06]" : "border-destructive/40 bg-destructive/[0.06]"}`}
          >
            {r.status === "pass" ? (
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
            ) : r.status === "warn" ? (
              <AlertTriangle className="h-4 w-4 text-caution mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────
function Card({
  title,
  chip,
  children,
}: {
  title: string;
  chip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div className="stencil text-[10px] tracking-widest text-primary">{title}</div>
        {chip && <div className="stencil text-[9px] text-muted-foreground">{chip}</div>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  const color =
    tone === "bad" ? "text-destructive" : tone === "warn" ? "text-caution" : "text-foreground";
  return (
    <div className="rounded-sm border border-border bg-background/40 p-2 text-center">
      <div
        className={`text-xl font-black ${color}`}
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        {value}
      </div>
      <div className="stencil text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}

function FunnelRow({
  label,
  count,
  base,
  pct,
}: {
  label: string;
  count: number;
  base: number;
  pct: number;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <span className="w-28 stencil text-[10px] text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="w-24 text-right font-mono text-muted-foreground">
        {count} · {pct}%
      </span>
    </div>
  );
}

function List({
  rows,
  tone,
}: {
  rows: Array<{ left: string; right: string; tone?: "bad" | "warn" }>;
  tone?: "warn";
}) {
  if (rows.length === 0) return <div className="text-xs text-muted-foreground">—</div>;
  return (
    <ul className="space-y-1 text-xs">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between gap-3 font-mono">
          <span
            className={`truncate ${tone === "warn" || r.tone === "warn" ? "text-caution" : "text-foreground"}`}
          >
            {r.left}
          </span>
          <span
            className={`shrink-0 ${r.tone === "bad" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {r.right}
          </span>
        </li>
      ))}
    </ul>
  );
}

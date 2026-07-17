// MILVERSE — Moderation queue + Assessment cohort dashboard.
// Passcode-gated at the server. No auth system.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { Lock, CheckCircle2, XCircle, BarChart3, FileText, Download, RefreshCw, ArrowRightLeft } from "lucide-react";
import { listPendingSubmissions, rejectSubmission, approveSubmissionAndPublish } from "@/lib/story.functions";
import { fetchAssessmentGroup, setGroupPhase } from "@/lib/assessment.functions";
import type { ItemResponse, Metrics } from "@/lib/assessment/scoring";
import { rollupCohort, headlineSentence, type CohortAttempt } from "@/lib/assessment/scoring";
import { FORMS, type FormId } from "@/lib/assessment/items";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Queue — MILVERSE" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

interface StoryRow {
  id: string;
  story: {
    whatHappened: string; channel: string;
    whatScammerWanted: string; whatTippedYouOff: string;
    country: string; year: number; patternGuess?: string;
  };
  country: string | null; year: number | null; status: string; created_at: string;
}
const TIERS = [1, 2, 3, 4, 5] as const;

function randomShareCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = ""; for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

type Tab = "submissions" | "assessment";

function ReviewPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("submissions");
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listFn = useServerFn(listPendingSubmissions);
  const rejectFn = useServerFn(rejectSubmission);
  const approveFn = useServerFn(approveSubmissionAndPublish);

  async function authenticate() {
    setErr(null); setBusy(true);
    try {
      const res = await listFn({ data: { passcode } as never });
      setRows((res as { rows: StoryRow[] }).rows);
      setAuthed(true);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function refresh() {
    try {
      const res = await listFn({ data: { passcode } as never });
      setRows((res as { rows: StoryRow[] }).rows);
    } catch (e) { setErr((e as Error).message); }
  }

  if (!authed) {
    return (
      <div className="min-h-screen grain">
        <TopBar />
        <main className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center gap-2 stencil text-[10px] text-primary">
              <Lock className="h-3 w-3" /> REVIEWER ACCESS
            </div>
            <h1 className="mt-2 text-2xl font-semibold uppercase">Review Queue</h1>
            <p className="mt-2 text-xs text-muted-foreground">Enter the reviewer passcode.</p>
            <input
              type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)}
              className="mt-4 w-full rounded-sm border border-border bg-background p-3 text-sm"
              placeholder="passcode"
              onKeyDown={(e) => { if (e.key === "Enter") authenticate(); }}
            />
            {err && <div className="mt-3 text-xs text-destructive">{err}</div>}
            <button
              onClick={authenticate} disabled={busy || !passcode}
              className="mt-4 w-full rounded-sm border-2 border-primary bg-primary py-2.5 stencil text-[10px] text-primary-foreground disabled:opacity-40"
            >
              {busy ? "CHECKING…" : "ENTER"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-semibold uppercase">Review</h1>
          <div className="flex-1" />
          <div className="inline-flex rounded-sm border border-border overflow-hidden">
            <button
              onClick={() => setTab("submissions")}
              className={`px-3 py-1.5 stencil text-[10px] tracking-widest inline-flex items-center gap-1 ${tab==="submissions" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            >
              <FileText className="h-3 w-3" /> SUBMISSIONS
            </button>
            <button
              onClick={() => setTab("assessment")}
              className={`px-3 py-1.5 stencil text-[10px] tracking-widest inline-flex items-center gap-1 ${tab==="assessment" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
            >
              <BarChart3 className="h-3 w-3" /> ASSESSMENT
            </button>
          </div>
        </div>

        {tab === "submissions" && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className="stencil text-[10px] text-muted-foreground">{rows.length} PENDING</span>
              <div className="flex-1" />
              <button onClick={refresh} className="rounded-sm border border-border px-3 py-1 stencil text-[10px] hover:bg-accent">REFRESH</button>
            </div>
            {err && <div className="mb-4 text-sm text-destructive">{err}</div>}
            {rows.length === 0 && (
              <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nothing pending. Good work.
              </div>
            )}
            <div className="space-y-4">
              {rows.map((r) => (
                <SubmissionCard
                  key={r.id} row={r} passcode={passcode}
                  onReject={async (reason) => {
                    await rejectFn({ data: { passcode, id: r.id, reason } as never });
                    setRows((cur) => cur.filter((x) => x.id !== r.id));
                  }}
                  onApprove={async (scenario) => {
                    const code = randomShareCode();
                    await approveFn({ data: { passcode, id: r.id, shareCode: code, scenario } as never });
                    setRows((cur) => cur.filter((x) => x.id !== r.id));
                    alert(`Published as ${code} on the Community shelf.`);
                  }}
                />
              ))}
            </div>
          </>
        )}

        {tab === "assessment" && <AssessmentTab passcode={passcode} />}
      </main>
    </div>
  );
}

/* ─────────────────────── ASSESSMENT TAB ─────────────────────── */

interface CloudAssessmentRow {
  codename_hash: string;
  phase: "intake" | "exit";
  form: FormId;
  items: ItemResponse[];
  accuracy: number;
  mean_confidence: number;
  calibration_gap: number;
  overconfident_errors: number;
  missed_scams: number;
  false_alarms: number;
  unverifiable_recognized: number;
  created_at: string;
}

function AssessmentTab({ passcode }: { passcode: string }) {
  const fetchFn = useServerFn(fetchAssessmentGroup);
  const flipFn = useServerFn(setGroupPhase);
  const [code, setCode] = useState("");
  const [loadedCode, setLoadedCode] = useState<string | null>(null);
  const [rows, setRows] = useState<CloudAssessmentRow[]>([]);
  const [phase, setPhase] = useState<"intake" | "exit">("intake");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(c: string) {
    const upper = c.trim().toUpperCase();
    if (upper.length < 4) return;
    setBusy(true); setErr(null);
    try {
      const res = (await fetchFn({ data: { groupCode: upper } as never })) as unknown as {
        entries: CloudAssessmentRow[]; phase: { phase: "intake" | "exit" };
      };
      setRows(res.entries ?? []);
      setPhase(res.phase?.phase ?? "intake");
      setLoadedCode(upper);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function flip(next: "intake" | "exit") {
    if (!loadedCode) return;
    setBusy(true); setErr(null);
    try {
      await flipFn({ data: { passcode, groupCode: loadedCode, phase: next } as never });
      setPhase(next);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  const attempts: CohortAttempt[] = useMemo(() => rows.map((r) => ({
    codenameHash: r.codename_hash, phase: r.phase, form: r.form,
    items: r.items,
    metrics: {
      accuracy: r.accuracy, meanConfidence: r.mean_confidence, calibrationGap: r.calibration_gap,
      overconfidentErrors: r.overconfident_errors, missedScams: r.missed_scams,
      falseAlarms: r.false_alarms, unverifiableRecognized: r.unverifiable_recognized,
    },
    ts: new Date(r.created_at).getTime(),
  })), [rows]);
  const rollup = useMemo(() => rollupCohort(attempts), [attempts]);
  const daysSpan = useMemo(() => {
    if (!rollup.meanIntake || !rollup.meanExit) return 0;
    // Approx: median exit ts minus median intake ts, in days.
    const intakeTs = attempts.filter((a) => a.phase === "intake").map((a) => a.ts).sort();
    const exitTs   = attempts.filter((a) => a.phase === "exit").map((a) => a.ts).sort();
    if (!intakeTs.length || !exitTs.length) return 0;
    const midI = intakeTs[Math.floor(intakeTs.length/2)];
    const midE = exitTs[Math.floor(exitTs.length/2)];
    return Math.max(1, Math.round((midE - midI) / (1000*60*60*24)));
  }, [attempts, rollup]);
  const headline = headlineSentence(daysSpan, rollup);

  function exportCsv() {
    if (!loadedCode) return;
    const header = [
      "group_code","codename_hash","phase","form","ts_iso",
      "accuracy","mean_confidence","calibration_gap","overconfident_errors",
      "missed_scams","false_alarms","unverifiable_recognized",
      "i1_id","i1_verdict","i1_confidence","i1_correct",
      "i2_id","i2_verdict","i2_confidence","i2_correct",
      "i3_id","i3_verdict","i3_confidence","i3_correct",
      "i4_id","i4_verdict","i4_confidence","i4_correct",
      "i5_id","i5_verdict","i5_confidence","i5_correct",
      "i6_id","i6_verdict","i6_confidence","i6_correct",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      const form = FORMS[r.form];
      const cells: string[] = [
        loadedCode, r.codename_hash, r.phase, r.form, r.created_at,
        String(r.accuracy), String(r.mean_confidence), String(r.calibration_gap),
        String(r.overconfident_errors), String(r.missed_scams), String(r.false_alarms),
        String(r.unverifiable_recognized),
      ];
      for (let i = 0; i < 6; i++) {
        const item = form[i];
        const resp = r.items.find((x) => x.itemId === item.id);
        const correct = resp ? (resp.verdict === item.truth ? "1" : "0") : "";
        cells.push(item?.id ?? "", resp?.verdict ?? "", resp ? String(resp.confidence) : "", correct);
      }
      lines.push(cells.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `assessment-${loadedCode}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="rounded-sm border border-border bg-card p-5">
        <div className="stencil text-[10px] text-muted-foreground">GROUP CODE</div>
        <div className="mt-2 flex gap-2">
          <input
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && load(code)}
            placeholder="e.g. K4M9P" maxLength={6}
            className="flex-1 rounded-sm border border-border bg-background p-2 text-sm font-mono tracking-widest"
          />
          <button
            onClick={() => load(code)} disabled={busy || code.trim().length < 4}
            className="rounded-sm border-2 border-primary bg-primary px-4 stencil text-[10px] text-primary-foreground disabled:opacity-40"
          >
            {busy ? "…" : "LOAD"}
          </button>
          {loadedCode && (
            <button onClick={() => load(loadedCode)} className="rounded-sm border border-border px-3 stencil text-[10px] hover:bg-accent inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> REFRESH
            </button>
          )}
        </div>
        {err && <div className="mt-3 text-xs text-destructive">{err}</div>}
      </div>

      {loadedCode && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="stencil text-[10px] text-muted-foreground">GROUP</span>
            <span className="font-mono text-lg tracking-widest">{loadedCode}</span>
            <span className="stencil text-[10px] text-muted-foreground ml-3">PHASE</span>
            <span className={`stencil text-[10px] px-2 py-0.5 rounded-sm border ${phase==="exit" ? "border-caution text-caution" : "border-primary text-primary"}`}>
              {phase.toUpperCase()}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => flip(phase === "intake" ? "exit" : "intake")}
              disabled={busy}
              className="rounded-sm border border-caution/60 bg-caution/10 px-3 py-1.5 stencil text-[10px] text-caution inline-flex items-center gap-1"
              title="Flip the measurement phase for this group"
            >
              <ArrowRightLeft className="h-3 w-3" />
              FLIP TO {phase === "intake" ? "EXIT" : "INTAKE"}
            </button>
            <button
              onClick={exportCsv} disabled={rows.length === 0}
              className="rounded-sm border border-border px-3 py-1.5 stencil text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
            >
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="INTAKE COMPLETED" value={rollup.nIntake} />
            <Stat label="EXIT COMPLETED" value={rollup.nExit} />
            <Stat label="PAIRED (both)" value={rollup.nPaired} accent />
          </div>

          {headline && (
            <div className="mt-4 rounded-sm border-2 border-primary bg-primary/10 p-4">
              <div className="stencil text-[10px] text-primary">HEADLINE</div>
              <p className="mt-2 text-lg font-semibold">{headline}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Based on {rollup.nPaired} of {Math.max(rollup.nIntake, rollup.nExit)} student{Math.max(rollup.nIntake, rollup.nExit)===1?"":"s"} completing both phases.
              </p>
            </div>
          )}

          {rollup.nPaired < 5 ? (
            <div className="mt-4 rounded-sm border border-caution/40 bg-caution/5 p-4 text-sm">
              <div className="stencil text-[10px] text-caution mb-1">NOT ENOUGH DATA YET</div>
              <p className="text-muted-foreground">
                Cohort metrics and per-tactic breakdown are shown when the group is larger
                (at least 5 paired participants). Currently paired: {rollup.nPaired}.
                Day-level activity only — exact timestamps are not shown.
              </p>
            </div>
          ) : (
            <>
              {rollup.meanIntake && rollup.meanExit && (
                <div className="mt-4 rounded-sm border border-border bg-card p-5">
                  <div className="stencil text-[10px] text-muted-foreground">COHORT MEANS · PAIRED PARTICIPANTS ONLY</div>
                  <div className="mt-3 space-y-3">
                    <PairedBar label="Accuracy (out of 6)" pre={rollup.meanIntake.accuracy} post={rollup.meanExit.accuracy} max={6} higherIsBetter />
                    <PairedBar label="Calibration gap (|value|)" pre={Math.abs(rollup.meanIntake.calibrationGap)} post={Math.abs(rollup.meanExit.calibrationGap)} max={50} higherIsBetter={false} note={`${rollup.meanIntake.calibrationGap} → ${rollup.meanExit.calibrationGap}`} />
                    <PairedBar label="Overconfident errors" pre={rollup.meanIntake.overconfidentErrors} post={rollup.meanExit.overconfidentErrors} max={6} higherIsBetter={false} />
                    <PairedBar label="Missed scams" pre={rollup.meanIntake.missedScams} post={rollup.meanExit.missedScams} max={2} higherIsBetter={false} />
                    <PairedBar label="False alarms" pre={rollup.meanIntake.falseAlarms} post={rollup.meanExit.falseAlarms} max={2} higherIsBetter={false} />
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-sm border border-border bg-card p-5">
                <div className="stencil text-[10px] text-muted-foreground">PER-TACTIC · CORRECT %</div>
                <div className="mt-3 space-y-2">
                  {rollup.perTactic.map((t) => (
                    <div key={t.pairId} className="flex items-center gap-3 text-sm">
                      <div className="w-40 truncate">{t.label}</div>
                      <div className="w-16 text-right font-mono text-muted-foreground">{t.intakeCorrectPct ?? "—"}%</div>
                      <div className="text-muted-foreground">→</div>
                      <div className={`w-16 text-right font-mono ${t.exitCorrectPct != null && t.intakeCorrectPct != null && t.exitCorrectPct > t.intakeCorrectPct ? "text-primary" : ""}`}>
                        {t.exitCorrectPct ?? "—"}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-sm border border-border bg-card p-5">
                <div className="stencil text-[10px] text-muted-foreground">PER-STUDENT · CODENAME ONLY · DAY-LEVEL</div>
                <table className="mt-3 w-full text-xs">
                  <thead className="text-left text-muted-foreground stencil text-[10px]">
                    <tr><th>CODENAME</th><th>INTAKE</th><th>EXIT</th></tr>
                  </thead>
                  <tbody>
                    {rollup.perStudent.map((s) => (
                      <tr key={s.codenameHash} className="border-t border-border/60">
                        <td className="py-1.5 font-mono">{s.codenameHash.slice(0,6)}</td>
                        <td className="py-1.5">{s.intakeAt ? <CheckCircle2 className="inline h-3 w-3 text-primary" /> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="py-1.5">{s.exitAt ? <CheckCircle2 className="inline h-3 w-3 text-primary" /> : <span className="text-muted-foreground">—</span>}</td>
                      </tr>
                    ))}
                    {rollup.perStudent.length === 0 && (
                      <tr><td colSpan={3} className="py-3 text-muted-foreground">No attempts yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
            <b>Anonymous by design:</b> codenames only, no accounts, no names.
            Two matched forms (A/B), counterbalanced by codename hash, so no item repeats between phases.
            Self-selected school sample; N is small; this is a pilot signal, not a peer-reviewed study.
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-sm border p-3 ${accent ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
      <div className="stencil text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-2xl ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function PairedBar({ label, pre, post, max, higherIsBetter, note }: {
  label: string; pre: number; post: number; max: number; higherIsBetter: boolean; note?: string;
}) {
  const preW = Math.max(2, Math.round((pre / max) * 100));
  const postW = Math.max(2, Math.round((post / max) * 100));
  const improved = higherIsBetter ? post > pre : post < pre;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">
          {note ?? `${pre.toFixed(2)} → ${post.toFixed(2)}`}
          {improved ? <span className="ml-2 text-primary">✓</span> : null}
        </span>
      </div>
      <div className="mt-1 space-y-1">
        <div className="h-2 rounded-sm bg-border/40">
          <div className="h-2 rounded-sm bg-muted-foreground/50" style={{ width: `${preW}%` }} />
        </div>
        <div className="h-2 rounded-sm bg-border/40">
          <div className={`h-2 rounded-sm ${improved ? "bg-primary" : "bg-caution/70"}`} style={{ width: `${postW}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── SUBMISSION CARD (unchanged) ─────────────────────── */

function SubmissionCard({
  row, passcode: _passcode, onReject, onApprove,
}: {
  row: StoryRow; passcode: string;
  onReject: (reason: string) => Promise<void>;
  onApprove: (scenario: Record<string, unknown>) => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "reject" | "edit">("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const suggestedPattern = row.story.patternGuess?.trim() || "Scam attempt";
  const [title, setTitle] = useState(suggestedPattern);
  const [teaser, setTeaser] = useState(row.story.whatHappened.slice(0, 140));
  const [tier, setTier] = useState<1|2|3|4|5>(2);
  const [truth, setTruth] = useState<"REAL" | "IMPOSTER">("IMPOSTER");
  const [claimed, setClaimed] = useState("Someone claiming an official role");
  const [contactClaim, setContactClaim] = useState(`Claims to be ${suggestedPattern.toLowerCase()}.`);
  const [opener, setOpener] = useState(row.story.whatHappened.split(/(?<=\.|\!|\?)\s/)[0] ?? row.story.whatHappened.slice(0, 200));
  const [agenda, setAgenda] = useState(row.story.whatScammerWanted);

  async function publish() {
    setBusy(true);
    const id = `community-${crypto.randomUUID().slice(0, 8)}`;
    const scenario = {
      id, title: title.trim(), teaser: teaser.trim(), channel: "text" as const, tier, truth,
      claimedIdentity: claimed.trim(), agenda: agenda.trim(),
      dossier: { contactClaim: contactClaim.trim(), knownFacts: [], publicFacts: [] },
      facts: [], opener: opener.trim(),
      persona: { voice: "generic urgent", fillers: ["please","listen","just do this"], urgencyLines: ["it's urgent","no time to explain"], pushLines: ["do it now","trust me"] },
      evidenceChips: [
        { id: "c1", label: "Rushed with urgency", correct: true, explain: "Urgency is a manipulation lever." },
        { id: "c2", label: "Asked me to send money / codes", correct: true, explain: "The ask itself is the scam." },
        { id: "c3", label: "Sounded polite", correct: false, explain: "Politeness is not evidence of legitimacy." },
      ],
      source: "community_story",
      inspiredBy: {
        patternName: suggestedPattern, country: row.story.country, year: String(row.story.year),
        whatHappened: row.story.whatHappened.slice(0, 400),
        prevention: [row.story.whatTippedYouOff.slice(0, 200), "Verify out-of-band using a number you already trust.", "Slow down — real institutions do not require instant decisions."],
      },
    };
    try { await onApprove(scenario as unknown as Record<string, unknown>); }
    catch (e) { alert((e as Error).message); }
    setBusy(false);
  }

  return (
    <article className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center gap-2 stencil text-[9px] text-muted-foreground">
        <span>{new Date(row.created_at).toLocaleString()}</span>
        <span>·</span><span>{row.story.country}, {row.story.year}</span>
        <span>·</span><span>{row.story.channel.toUpperCase()}</span>
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap">{row.story.whatHappened}</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-sm border border-border p-2"><b>Wanted:</b> {row.story.whatScammerWanted}</div>
        <div className="rounded-sm border border-border p-2"><b>Tell:</b> {row.story.whatTippedYouOff}</div>
      </div>

      {mode === "view" && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => setMode("edit")} className="rounded-sm border border-primary bg-primary/10 px-3 py-1.5 stencil text-[10px] text-primary hover:bg-primary/20">
            <CheckCircle2 className="inline h-3 w-3 mr-1" /> APPROVE → EDIT & PUBLISH
          </button>
          <button onClick={() => setMode("reject")} className="rounded-sm border border-destructive/60 bg-destructive/10 px-3 py-1.5 stencil text-[10px] text-destructive hover:bg-destructive/20">
            <XCircle className="inline h-3 w-3 mr-1" /> REJECT
          </button>
        </div>
      )}
      {mode === "reject" && (
        <div className="mt-4 space-y-2">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full min-h-[70px] rounded-sm border border-border bg-background p-2 text-sm" placeholder="Why is this being rejected?" />
          <div className="flex gap-2">
            <button disabled={busy || reason.trim().length < 3} onClick={async () => { setBusy(true); await onReject(reason.trim()); setBusy(false); }} className="rounded-sm border-2 border-destructive bg-destructive px-3 py-1.5 stencil text-[10px] text-destructive-foreground disabled:opacity-40">
              CONFIRM REJECT
            </button>
            <button onClick={() => setMode("view")} className="rounded-sm border border-border px-3 py-1.5 stencil text-[10px] hover:bg-accent">CANCEL</button>
          </div>
        </div>
      )}
      {mode === "edit" && (
        <div className="mt-4 rounded-sm border border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="stencil text-[10px] text-primary">PRE-FILLED FROM STORY · EDIT BEFORE PUBLISH</div>
          <label className="block"><div className="text-xs text-muted-foreground">Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block"><div className="text-xs text-muted-foreground">Teaser</div>
            <input value={teaser} onChange={(e) => setTeaser(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><div className="text-xs text-muted-foreground">Tier</div>
              <select value={tier} onChange={(e) => setTier(Number(e.target.value) as 1|2|3|4|5)} className="w-full rounded-sm border border-border bg-background p-2 text-sm">
                {TIERS.map((t) => <option key={t} value={t}>Tier {t}</option>)}
              </select>
            </label>
            <label className="block"><div className="text-xs text-muted-foreground">Ground truth</div>
              <select value={truth} onChange={(e) => setTruth(e.target.value as "REAL" | "IMPOSTER")} className="w-full rounded-sm border border-border bg-background p-2 text-sm">
                <option value="IMPOSTER">IMPOSTER</option><option value="REAL">REAL</option>
              </select>
            </label>
          </div>
          <label className="block"><div className="text-xs text-muted-foreground">Claimed identity</div>
            <input value={claimed} onChange={(e) => setClaimed(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block"><div className="text-xs text-muted-foreground">Contact's claim (dossier)</div>
            <input value={contactClaim} onChange={(e) => setContactClaim(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block"><div className="text-xs text-muted-foreground">Opener</div>
            <textarea value={opener} onChange={(e) => setOpener(e.target.value)} className="w-full min-h-[80px] rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block"><div className="text-xs text-muted-foreground">Contact's goal / agenda</div>
            <input value={agenda} onChange={(e) => setAgenda(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <div className="flex gap-2 pt-2">
            <button disabled={busy || !title.trim() || !opener.trim()} onClick={publish} className="rounded-sm border-2 border-primary bg-primary px-4 py-2 stencil text-[10px] text-primary-foreground disabled:opacity-40">
              {busy ? "PUBLISHING…" : "PUBLISH TO COMMUNITY SHELF"}
            </button>
            <button onClick={() => setMode("view")} className="rounded-sm border border-border px-3 py-1.5 stencil text-[10px] hover:bg-accent">CANCEL</button>
          </div>
        </div>
      )}
    </article>
  );
}

// Silence unused-var lint from destructured passcode
useEffect;

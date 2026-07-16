// THE DAILY MIRAGE — Front Page.
// Renders the lead as a real news article, then a "YOUR CALL, CITIZEN" plate:
// verdict → wager slider → stamp slam → city split → tactic debrief.

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Coins, Search } from "lucide-react";
import type { EditionLead } from "@/lib/paper/types";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import { toDailyVerdict } from "@/lib/daily/rotation";
import { commitLeadPlay, readEditionRecord } from "@/lib/paper/profile";
import { logPaperInteraction, getPaperSplit } from "@/lib/paper.functions";
import { loadProfile } from "@/lib/mirror/profile";
import { getDeviceId } from "@/lib/pilot";
import { track } from "@/lib/telemetry";

type Verdict = "LEGIT" | "SCAM" | "MISLEADING";

export function PaperFrontPage({ lead, editionNumber, editionDate, onDone }: {
  lead: EditionLead;
  editionNumber: number;
  editionDate: string;
  onDone: () => void;
}) {
  const scenario = useMemo(() => FEED_SCENARIOS.find((s) => s.id === lead.caseId), [lead.caseId]);
  const truth: Verdict = scenario ? toDailyVerdict(scenario.verdict) : "SCAM";
  const [record, setRecord] = useState<ReturnType<typeof readEditionRecord> | null>(null);
  useEffect(() => { setRecord(readEditionRecord(editionNumber)); }, [editionNumber]);
  const played = !!record?.playedLeadAt;

  return (
    <article className="mt-8">
      <div className="paper-mono text-[10px] tracking-[0.3em] text-[color:var(--paper-muted)]">{lead.kicker}</div>
      <h2 className="paper-serif mt-1 leading-[1.05]" style={{ fontWeight: 900, fontSize: "clamp(2rem, 5.5vw, 3.75rem)" }}>
        {lead.headline}
      </h2>
      <p className="paper-serif italic mt-2 text-lg sm:text-xl text-[color:var(--paper-muted)]">{lead.subhead}</p>
      <div className="paper-mono text-[10px] tracking-[0.25em] mt-2 pb-3 border-b border-current/40" style={{ borderColor: "var(--paper-rule)" }}>
        {lead.byline}
      </div>

      {/* Halftone image */}
      <figure className="mt-4 sm:float-right sm:ml-6 sm:w-[42%] sm:max-w-[420px]">
        <div className="paper-halftone paper-halftone-mask h-48 sm:h-64 border border-current/30" style={{ borderColor: "var(--paper-rule)" }} />
        <figcaption className="paper-mono text-[10px] mt-1 text-[color:var(--paper-muted)]">
          Screenshot circulating on WhatsApp overnight. Reprinted for analysis.
        </figcaption>
      </figure>

      <div className={`mt-4 paper-body paper-cols-3 ${lead.dropCap ? "" : "no-dropcap"}`}>
        {lead.columns.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      {/* YOUR CALL, CITIZEN */}
      <div className="clear-both mt-8 border-y-4 double p-5 sm:p-6" style={{ borderColor: "var(--paper-ink)" }}>
        <div className="paper-mono text-[10px] tracking-[0.3em] text-[color:var(--paper-muted)]">
          {lead.yourCallTitle ?? "YOUR CALL, CITIZEN"}
        </div>
        {played ? (
          <PostPlay record={record} truth={truth} scenario={scenario} editionNumber={editionNumber} />
        ) : (
          <PlayFlow
            editionNumber={editionNumber}
            editionDate={editionDate}
            caseId={lead.caseId}
            truth={truth}
            probes={scenario?.actions?.slice(0, 4) ?? []}
            onCommit={() => {
              setRecord(readEditionRecord(editionNumber));
              onDone();
            }}
          />
        )}
      </div>
    </article>
  );
}

function PlayFlow({ editionNumber, editionDate, caseId, truth, probes, onCommit }: {
  editionNumber: number;
  editionDate: string;
  caseId: string;
  truth: Verdict;
  probes: Array<{ id: string; label: string; result: string }>;
  onCommit: () => void;
}) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [probesUsed, setProbesUsed] = useState<string[]>([]);
  const [openProbeResult, setOpenProbeResult] = useState<string | null>(null);
  const [stake, setStake] = useState(20);
  const [stage, setStage] = useState<"verdict" | "wager" | "reveal">("verdict");
  const trustCap = Math.max(10, Math.min(100, loadProfile().trust ?? 100));
  const logInt = useServerFn(logPaperInteraction);

  function commit() {
    const res = commitLeadPlay({
      editionNumber, editionDateKey: editionDate, caseId,
      verdict: verdict!, truth, stake,
    });
    if (!res) return;
    void logInt({ data: { number: editionNumber, section: "lead", correct: res.correct, deviceId: getDeviceId() } }).catch(() => {});
    track("case_verdict_locked", { case_id: caseId, payload: { correct: res.correct } });
    setStage("reveal");
    onCommit();
  }

  return (
    <div>
      {stage === "verdict" && (
        <>
          <p className="paper-body no-dropcap mt-3">
            Two probes at your desk before you file. Use them wisely.
          </p>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {probes.slice(0, 4).map((p) => {
              const used = probesUsed.includes(p.id);
              const disabled = !used && probesUsed.length >= 2;
              return (
                <button
                  key={p.id}
                  disabled={disabled}
                  onClick={() => {
                    if (used) { setOpenProbeResult(p.result); return; }
                    setProbesUsed((v) => [...v, p.id]);
                    setOpenProbeResult(p.result);
                  }}
                  className={`text-left border p-2 rounded-sm paper-mono text-[11px] tracking-normal ${used ? "bg-black/5" : disabled ? "opacity-40" : "hover:bg-black/5"}`}
                  style={{ borderColor: "var(--paper-rule)" }}
                >
                  <span className="inline-flex items-center gap-1"><Search className="h-3 w-3" /> {p.label}</span>
                  {used && <span className="ml-2 text-[oklch(0.35_0.15_140)]">✓ used</span>}
                </button>
              );
            })}
          </div>
          {openProbeResult && (
            <div className="mt-2 paper-serif italic text-sm border-l-2 pl-3" style={{ borderColor: "var(--paper-ink)" }}>
              {openProbeResult}
            </div>
          )}
          <div className="mt-6 paper-mono text-[10px] tracking-[0.3em]">FILE YOUR VERDICT</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["LEGIT", "SCAM", "MISLEADING"] as Verdict[]).map((v) => (
              <button
                key={v}
                onClick={() => { setVerdict(v); setStage("wager"); }}
                className="border-2 py-3 rounded-sm paper-mono text-xs tracking-widest hover:bg-black/5"
                style={{ borderColor: "var(--paper-ink)" }}
              >{v}</button>
            ))}
          </div>
        </>
      )}
      {stage === "wager" && verdict && (
        <div>
          <div className="paper-mono text-[10px] tracking-[0.3em]">YOU CALLED <span className="text-[oklch(0.4_0.15_25)]">{verdict}</span></div>
          <p className="paper-body no-dropcap mt-2">Stake your Trust. Correct doubles it. Wrong burns it. (No real money — Trust is a fictional civic currency.)</p>
          <div className="mt-3 flex items-center gap-3">
            <Coins className="h-4 w-4" />
            <input type="range" min={5} max={trustCap} value={stake} onChange={(e) => setStake(Number(e.target.value))} className="flex-1 accent-[oklch(0.4_0.15_25)]" />
            <span className="paper-mono text-xs tabular-nums w-10 text-right">{stake}</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setStage("verdict")} className="paper-mono text-[10px] underline decoration-dotted">← change verdict</button>
            <div className="flex-1" />
            <button onClick={commit} className="border-4 double px-4 py-2 paper-mono text-xs tracking-widest bg-[oklch(0.18_0.02_60)] text-[oklch(0.95_0.02_85)] hover:opacity-90" style={{ borderColor: "var(--paper-ink)" }}>
              SLAM THE STAMP
            </button>
          </div>
        </div>
      )}
      {stage === "reveal" && verdict && (
        <RevealBlock verdict={verdict} truth={truth} scenario={caseId} editionNumber={editionNumber} />
      )}
    </div>
  );
}

function RevealBlock({ verdict, truth, editionNumber }: { verdict: Verdict; truth: Verdict; scenario: string; editionNumber: number }) {
  const correct = verdict === truth;
  const [split, setSplit] = useState<{ total: number; correct: number } | null>(null);
  const getSplit = useServerFn(getPaperSplit);
  useEffect(() => {
    getSplit({ data: { number: editionNumber, section: "lead" } }).then((s) => setSplit(s as { total: number; correct: number })).catch(() => {});
  }, [getSplit, editionNumber]);
  return (
    <div className="mt-2">
      <div className={`paper-stamp inline-block border-4 px-4 py-2 paper-mono text-sm tracking-[0.3em] ${correct ? "text-[oklch(0.35_0.15_140)] border-[oklch(0.4_0.15_140)]" : "text-[oklch(0.4_0.2_25)] border-[oklch(0.5_0.2_25)]"}`}>
        {correct ? "CORRECT — TRUTH: " + truth : "MISFIRE — TRUTH: " + truth}
      </div>
      {split && split.total > 1 && (
        <p className="paper-body no-dropcap mt-4 text-sm">
          THE CITY'S SPLIT: <span className="font-black">{Math.round((split.correct / split.total) * 100)}%</span> of {split.total} readers filed the correct verdict on this story.
        </p>
      )}
      <p className="paper-serif italic mt-4">
        Tactic in play: <span className="font-black not-italic">{lookupTactic(editionNumber)}</span>. The whole toolkit lives in the
        {" "}<Link to="/manual" className="underline">Field Manual</Link>.
      </p>
    </div>
  );
}

function lookupTactic(_n: number): string {
  // Tactic label comes from the FEED_SCENARIOS mapping; keeping this simple in prototype.
  return "urgency + imposter framing";
}

function PostPlay({ record, truth, scenario, editionNumber }: { record: ReturnType<typeof readEditionRecord>; truth: Verdict; scenario: ReturnType<typeof FEED_SCENARIOS.find>; editionNumber: number }) {
  void scenario;
  const [split, setSplit] = useState<{ total: number; correct: number } | null>(null);
  const getSplit = useServerFn(getPaperSplit);
  useEffect(() => { getSplit({ data: { number: editionNumber, section: "lead" } }).then((s) => setSplit(s as { total: number; correct: number })).catch(() => {}); }, [getSplit, editionNumber]);
  return (
    <div className="mt-3">
      <div className={`paper-stamp inline-block border-4 px-4 py-2 paper-mono text-sm tracking-[0.3em] ${record.correct ? "text-[oklch(0.35_0.15_140)] border-[oklch(0.4_0.15_140)]" : "text-[oklch(0.4_0.2_25)] border-[oklch(0.5_0.2_25)]"}`}>
        {record.correct ? "YOU FILED — TRUTH: " + truth : "YOU MISSED — TRUTH: " + truth}
      </div>
      <p className="paper-body no-dropcap text-sm mt-3">
        Trust delta: {record.trustDelta >= 0 ? "+" : ""}{record.trustDelta}. Only one filing per edition — come back tomorrow.
      </p>
      {split && split.total > 1 && (
        <p className="paper-body no-dropcap mt-2 text-sm">
          City split: <span className="font-black">{Math.round((split.correct / split.total) * 100)}%</span> filed correct ({split.total} readers).
        </p>
      )}
    </div>
  );
}

// MILVERSE — /drop  "AAJ KA FORWARD" — the Daily Drop.
// Stages: intake → wager → reveal → receipt. One play per day (UTC+5).
// Yesterday's case is viewable but not playable.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { FormatFrame } from "@/components/feed/FormatFrame";
import { VerdictMoment } from "@/components/VerdictMoment";
import { TacticFlash } from "@/components/TacticFlash";
import { ReceiptCard, type ReceiptData } from "@/components/daily/ReceiptCard";
import { HandlerDropLine } from "@/components/handler/HandlerDropLine";
import {
  todaysDailyCase,
  yesterdaysDailyCase,
  toDailyVerdict,
  dropDateKey,
  secondsToNextDrop,
  isDesignerFriday,
} from "@/lib/daily/rotation";
import { commitDailyPlay, readDailyStatus, stakeBounds, localSharpness } from "@/lib/daily/profile";
import {
  logDailyPlay,
  fetchDailySplit,
  fetchSharpestWatch,
  fetchMostDeviousDesigner,
} from "@/lib/daily.functions";
import { getDeviceId, logPilotEntry, getActiveGroup } from "@/lib/pilot";
import { track, bucketStake, bucketStreak } from "@/lib/telemetry";
import type { FeedScenario, FeedToolKind } from "@/lib/feed/scenarios";
import { Flame, Radio, Coins, Search, Trophy, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/drop")({
  head: () => ({
    meta: [
      { title: "Aaj Ka Forward — MILVERSE Daily Drop" },
      {
        name: "description",
        content: "One case a day. Same for everyone. Wager Trust, verify, and post your receipt.",
      },
      { property: "og:title", content: "AAJ KA FORWARD — MILVERSE" },
      {
        property: "og:description",
        content: "One case a day. One wager. One receipt. The city's daily verification ritual.",
      },
    ],
  }),
  component: DropPage,
});

type Stage = "intake" | "wager" | "verdict-cinema" | "reveal" | "receipt";

function DropPage() {
  const emptyStatus = { playedToday: false, todayEntry: null, streak: 0, trust: 100 };
  const [status, setStatus] = useState<ReturnType<typeof readDailyStatus>>(emptyStatus);
  const [now, setNow] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setStatus(readDailyStatus());
    setNow(Date.now());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [hydrated]);

  const today = useMemo(() => todaysDailyCase(), []);
  const yesterday = useMemo(() => yesterdaysDailyCase(), []);
  const [showYesterday, setShowYesterday] = useState(false);

  // Midnight rollover (UTC+5): a tab left open past 00:00 would otherwise
  // freeze on yesterday's case with a stuck countdown. When the ticking
  // clock crosses into a new dateKey, reload — cleanest way to refresh
  // case, status, and every child mid-flow state at once.
  useEffect(() => {
    if (!hydrated || now === 0) return;
    if (dropDateKey(new Date(now)) !== today.dateKey) window.location.reload();
  }, [hydrated, now, today.dateKey]);

  // NOTE: we deliberately do NOT re-read status on `milverse:profile`. The
  // child PlayFlow calls onDone() itself once the cinematic is finished; if we
  // synced on every profile ping, committing the play would immediately flip
  // playedToday → true and unmount the cinematic mid-slam.

  const rollover = secondsToNextDrop(new Date(now));
  const hh = String(Math.floor(rollover / 3600)).padStart(2, "0");
  const mm = String(Math.floor((rollover % 3600) / 60)).padStart(2, "0");
  const ss = String(rollover % 60).padStart(2, "0");
  const friday = isDesignerFriday(today.dateKey);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-8 w-8">
            {!status.playedToday && (
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            )}
            <span className="absolute inset-1 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Radio className="h-3.5 w-3.5" />
            </span>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-primary flex items-center gap-2">
              {friday && (
                <span className="rounded-sm bg-primary/20 px-1.5 py-0.5">DESIGNER FRIDAY</span>
              )}
              AAJ KA FORWARD · {today.dateKey}
            </div>
            <h1
              className="mt-0.5 text-4xl sm:text-5xl font-black tracking-tight"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              TODAY'S FORWARD.
            </h1>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5 stencil text-[10px] text-primary">
            <Coins className="h-3.5 w-3.5" /> TRUST{" "}
            <span className="text-foreground tabular-nums">{status.trust}</span>
          </div>
          <div className="flex items-center gap-1.5 stencil text-[10px] text-caution">
            <Flame className="h-3.5 w-3.5" /> {status.streak}D ON WATCH
          </div>
          <div className="flex-1" />
          <div className="stencil text-[10px] text-muted-foreground">
            NEXT DROP {hh}:{mm}:{ss}
          </div>
        </div>

        {status.playedToday ? (
          <PostPlayState
            status={status}
            today={today}
            onOpenYesterday={() => setShowYesterday(true)}
          />
        ) : (
          <PlayFlow
            scenario={today.scenario}
            dateKey={today.dateKey}
            onDone={() => setStatus(readDailyStatus())}
          />
        )}

        <section className="mt-10">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowYesterday((v) => !v)}
              className="stencil text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-sm px-2 py-1"
            >
              {showYesterday ? "HIDE YESTERDAY" : "VIEW YESTERDAY (READ-ONLY)"}
            </button>
            <span className="stencil text-[10px] text-muted-foreground">
              THE CITY HAS MOVED ON.
            </span>
          </div>
          {showYesterday && (
            <div className="rounded-sm border border-border bg-card p-4 opacity-90">
              <div className="stencil text-[10px] text-muted-foreground">
                YESTERDAY · {yesterday.dateKey}
              </div>
              <div
                className="mt-1 text-lg font-black"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                {yesterday.scenario.title}
              </div>
              <div className="mt-2">
                <FormatFrame
                  format={yesterday.scenario.format ?? "whatsapp"}
                  senderName={yesterday.scenario.sender.name}
                  forward={yesterday.scenario.forward}
                  aiGenerated={yesterday.scenario.aiGenerated}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Answer:{" "}
                <span className="text-foreground stencil">
                  {toDailyVerdict(yesterday.scenario.verdict)}
                </span>
                {yesterday.scenario.tacticId && (
                  <>
                    {" "}
                    · Tactic: <span className="text-foreground">{yesterday.scenario.tacticId}</span>
                  </>
                )}
                {" — "}Playable window closed at UTC+5 midnight.
              </div>
            </div>
          )}
        </section>

        <Leaderboards />
      </main>
    </div>
  );
}

/* ────────── Post-play (already played today) ────────── */

function PostPlayState({
  status,
  today,
  onOpenYesterday,
}: {
  status: ReturnType<typeof readDailyStatus>;
  today: { scenario: FeedScenario; dateKey: string };
  onOpenYesterday: () => void;
}) {
  const entry = status.todayEntry!;
  const [split, setSplit] = useState<{ total: number; correct: number } | null>(null);
  useEffect(() => {
    fetchDailySplit({ data: { dropDate: entry.dateKey, caseId: entry.caseId } })
      .then((r) => setSplit(r))
      .catch(() => setSplit({ total: 1, correct: entry.correct ? 1 : 0 }));
  }, [entry.dateKey, entry.caseId, entry.correct]);

  const receipt: ReceiptData = useMemo(
    () => ({
      dropNumber: Math.floor(new Date(entry.dateKey + "T00:00:00Z").getTime() / 86400000) - 20000,
      dateKey: entry.dateKey,
      probesUsed: entry.probesUsed,
      correct: entry.correct,
      outcome: entry.correct ? "correct" : entry.truth === "SCAM" ? "missed_scam" : "false_alarm",
      stake: entry.stake,
      delta: entry.delta,
      streak: status.streak,
      sharpness: localSharpness(),
      siteUrl:
        typeof window !== "undefined" ? `${window.location.origin}/drop` : "milverse.app/drop",
    }),
    [entry, status.streak],
  );

  const pct = split && split.total > 0 ? Math.round((split.correct / split.total) * 100) : null;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-sm border border-primary/40 bg-primary/[0.05] p-5">
        <div className="stencil text-[10px] tracking-widest text-primary mb-2">
          TODAY'S CALL — LOCKED
        </div>
        <div className="text-3xl font-black" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
          {entry.correct
            ? "CORRECT CALL."
            : entry.truth === "SCAM"
              ? "MISSED SCAM."
              : "FALSE ALARM."}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          You called <span className="text-foreground stencil">{entry.verdict}</span>. The city
          dossier says <span className="text-foreground stencil">{entry.truth}</span>. Stake{" "}
          {entry.stake} →{" "}
          <span className={entry.correct ? "text-primary" : "text-destructive"}>
            {entry.correct ? "+" : ""}
            {entry.delta}
          </span>{" "}
          Trust.
        </div>
        {pct !== null && (
          <div className="mt-4">
            <div className="stencil text-[10px] text-muted-foreground">THE CITY'S SPLIT</div>
            <div className="mt-1 text-lg font-black">{pct}% of the city called it right today.</div>
            <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {split!.total} watchers reported in.
            </div>
          </div>
        )}
        {today.scenario.tacticId && (
          <div className="mt-4 rounded-sm border border-border bg-background/50 p-3 text-sm">
            <div className="stencil text-[10px] text-primary">YOU JUST FACED</div>
            <div className="text-lg font-black mt-0.5">
              {today.scenario.tacticId.replace(/-/g, " ").toUpperCase()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{today.scenario.truthNote}</div>
            <Link
              to="/manual/$entryId"
              params={{ entryId: today.scenario.tacticId }}
              className="mt-2 inline-flex items-center gap-1 stencil text-[10px] text-primary"
            >
              OPEN FIELD MANUAL <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
        <HandlerDropLine
          correct={entry.correct}
          stake={entry.stake}
          streak={status.streak}
          cacheKey={entry.dateKey}
        />
      </div>

      <div>
        <div className="stencil text-[10px] tracking-widest text-primary mb-2">THE RECEIPT</div>
        <ReceiptCard data={receipt} />
      </div>

      <button
        onClick={onOpenYesterday}
        className="stencil text-[10px] text-muted-foreground underline underline-offset-4"
      >
        Look at yesterday's case →
      </button>
    </div>
  );
}

/* ────────── Play flow ────────── */

function PlayFlow({
  scenario,
  dateKey,
  onDone,
}: {
  scenario: FeedScenario;
  dateKey: string;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("intake");
  const [probesUsed, setProbesUsed] = useState<FeedToolKind[]>([]);
  const [probeResults, setProbeResults] = useState<{ kind: FeedToolKind; text: string }[]>([]);
  const [verdict, setVerdict] = useState<"LEGIT" | "SCAM" | "MISLEADING" | null>(null);
  const truth = toDailyVerdict(scenario.verdict);

  const status = readDailyStatus();
  const bounds = stakeBounds(status.trust);
  const [stake, setStake] = useState<number>(Math.min(30, bounds.max));

  const [showTactic, setShowTactic] = useState(false);
  const [committing, setCommitting] = useState(false);

  const runProbe = (kind: FeedToolKind) => {
    if (probesUsed.length >= 2 || probesUsed.includes(kind)) return;
    const evidence =
      scenario.toolbelt?.[kind] ??
      scenario.actions.find((a) => (a.tool ?? "check_source") === kind)?.result ??
      "Nothing surfaces from this angle on this artifact.";
    setProbesUsed((p) => [...p, kind]);
    setProbeResults((r) => [...r, { kind, text: evidence }]);
  };

  const lockVerdict = (v: "LEGIT" | "SCAM" | "MISLEADING") => {
    setVerdict(v);
    setStage("wager");
  };

  const commit = async () => {
    if (!verdict || committing) return;
    setCommitting(true);
    const result = commitDailyPlay({
      caseId: scenario.id,
      verdict,
      truth,
      stake,
      probesUsed: probesUsed.length,
    });
    if (!result) {
      setCommitting(false);
      onDone();
      return;
    }

    // Fire-and-forget cloud log + pilot capture
    void logDailyPlay({
      data: {
        dropDate: dateKey,
        caseId: scenario.id,
        deviceId: getDeviceId(),
        verdict,
        correct: result.correct,
        stake,
      },
    }).catch(() => {
      /* offline OK */
    });

    if (getActiveGroup()) {
      logPilotEntry({
        wing: "daily",
        caseId: `daily:${dateKey}:${scenario.id}`,
        result: result.outcome === "correct" ? "correct" : result.outcome,
        points: result.delta,
        probeStats: { strong: probesUsed.length, weak: 0, wasted: 0 },
        ts: Date.now(),
      });
    }

    track("drop_play", {
      case_id: scenario.id,
      payload: {
        stake_bucket: bucketStake(stake),
        streak_bucket: bucketStreak(status.streak),
        correct: result.correct,
        probes: probesUsed.length,
      },
    });
    if (!result.correct && status.streak > 0) {
      track("drop_break", {
        case_id: scenario.id,
        payload: { streak_bucket: bucketStreak(status.streak) },
      });
    }

    setStage("verdict-cinema");
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Intake */}
      {stage === "intake" && (
        <>
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="stencil text-[10px] tracking-widest text-primary">INCOMING FORWARD</div>
            <div
              className="mt-1 text-2xl font-black"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              {scenario.title}
            </div>
            <div className="mt-3">
              <FormatFrame
                format={scenario.format ?? "whatsapp"}
                senderName={scenario.sender.name}
                forward={scenario.forward}
                aiGenerated={scenario.aiGenerated}
              />
            </div>
          </div>

          <QuickProbes
            scenario={scenario}
            probesUsed={probesUsed}
            probeResults={probeResults}
            onRun={runProbe}
          />

          <div className="rounded-sm border border-primary/40 bg-primary/[0.05] p-4">
            <div className="stencil text-[10px] tracking-widest text-primary mb-2">
              YOUR VERDICT
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["LEGIT", "SCAM", "MISLEADING"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => lockVerdict(v)}
                  className="rounded-sm border border-border bg-background hover:border-primary hover:bg-primary/10 px-3 py-3 stencil text-xs text-foreground transition"
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Probes used: {probesUsed.length} / 2 · You always judge — the site never declares
              truth for you.
            </div>
          </div>
        </>
      )}

      {/* Wager */}
      {stage === "wager" && verdict && (
        <Wager
          verdict={verdict}
          stake={stake}
          bounds={bounds}
          onStake={setStake}
          onConfirm={commit}
          onBack={() => setStage("intake")}
          committing={committing}
        />
      )}

      {/* Verdict cinema — reuses crown-jewel animation */}
      {stage === "verdict-cinema" && verdict && (
        <>
          <VerdictMoment
            caseTitle={scenario.title}
            caseId={scenario.id}
            stampLabel={truth}
            outcome={
              verdict === truth ? "correct" : truth === "SCAM" ? "missed_scam" : "false_alarm"
            }
            onDone={() => {
              setShowTactic(!!scenario.tacticId);
              setStage("reveal");
            }}
          />
          {showTactic && scenario.tacticId && (
            <TacticFlash tacticId={scenario.tacticId} onDone={() => setShowTactic(false)} />
          )}
        </>
      )}

      {/* Reveal → auto-shows via onDone flip; the parent re-reads status and shows PostPlayState next mount */}
      {stage === "reveal" && (
        <div className="rounded-sm border border-primary/40 bg-primary/[0.05] p-4">
          <div className="stencil text-[10px] text-primary">SHOWING RECEIPT…</div>
          <button
            onClick={onDone}
            className="mt-2 stencil text-xs rounded-sm bg-primary text-primary-foreground px-4 py-2"
          >
            CONTINUE →
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────── Probes (compact, 2-shot) ────────── */

function QuickProbes({
  scenario,
  probesUsed,
  probeResults,
  onRun,
}: {
  scenario: FeedScenario;
  probesUsed: FeedToolKind[];
  probeResults: { kind: FeedToolKind; text: string }[];
  onRun: (kind: FeedToolKind) => void;
}) {
  const TOOLS: { kind: FeedToolKind; label: string }[] = [
    { kind: "reverse_image", label: "REVERSE IMAGE" },
    { kind: "check_source", label: "CHECK SOURCE" },
    { kind: "cross_check", label: "CROSS-CHECK" },
    { kind: "check_date", label: "CHECK DATE" },
  ];
  const left = 2 - probesUsed.length;
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="stencil text-[10px] tracking-widest text-muted-foreground">
          <Search className="inline h-3 w-3 mr-1" /> QUICK PROBES — {left} LEFT
        </div>
        <div className="stencil text-[10px] text-muted-foreground">
          DOSSIER · {(scenario.format ?? "whatsapp").toUpperCase()}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TOOLS.map((t) => {
          const used = probesUsed.includes(t.kind);
          const disabled = used || left === 0;
          return (
            <button
              key={t.kind}
              disabled={disabled}
              onClick={() => onRun(t.kind)}
              className={`rounded-sm border px-2 py-2 stencil text-[10px] transition ${
                used
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : disabled
                    ? "border-border/40 text-muted-foreground/60 cursor-not-allowed"
                    : "border-border hover:border-primary hover:bg-primary/10 text-foreground"
              }`}
            >
              {t.label}
              {used ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      {probeResults.length > 0 && (
        <div className="mt-3 space-y-2">
          {probeResults.map((r) => (
            <div
              key={r.kind}
              className="rounded-sm border border-primary/30 bg-background/60 p-2 text-sm"
            >
              <div className="stencil text-[9px] text-primary">
                {r.kind.replace(/_/g, " ").toUpperCase()}
              </div>
              <div className="mt-0.5 text-xs text-foreground">{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────── Wager ────────── */

function Wager({
  verdict,
  stake,
  bounds,
  onStake,
  onConfirm,
  onBack,
  committing,
}: {
  verdict: "LEGIT" | "SCAM" | "MISLEADING";
  stake: number;
  bounds: { min: number; max: number };
  onStake: (s: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  committing: boolean;
}) {
  const clamped = Math.max(bounds.min, Math.min(bounds.max, stake));
  useEffect(() => {
    if (clamped !== stake) onStake(clamped);
  }, [clamped, stake, onStake]);
  const winAmt = clamped;
  const lossAmt = -clamped;
  return (
    <div className="rounded-sm border-2 border-primary/60 bg-gradient-to-b from-black/60 to-primary/5 p-5">
      <div className="stencil text-[10px] tracking-widest text-primary">THE STAKE</div>
      <div
        className="mt-1 text-2xl sm:text-3xl font-black"
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        SLIDE YOUR CHIPS. YOU CALLED <span className="text-primary">{verdict}</span>.
      </div>

      {/* Chips slider */}
      <div className="mt-6">
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={5}
          value={clamped}
          onChange={(e) => onStake(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Wager amount"
        />
        <div className="mt-2 flex items-center justify-between text-[10px] stencil text-muted-foreground">
          <span>MIN {bounds.min}</span>
          <span
            className="text-primary text-lg font-black"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {clamped}
          </span>
          <span>MAX {bounds.max}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-sm border border-primary/40 bg-primary/[0.06] p-3">
          <div className="stencil text-[10px] text-primary">IF RIGHT</div>
          <div
            className="text-2xl font-black text-primary"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            +{winAmt}
          </div>
        </div>
        <div className="rounded-sm border border-destructive/40 bg-destructive/[0.06] p-3">
          <div className="stencil text-[10px] text-destructive">IF WRONG</div>
          <div
            className="text-2xl font-black text-destructive"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {lossAmt}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="stencil text-[10px] text-muted-foreground hover:text-foreground"
        >
          ← back to verdict
        </button>
        <div className="flex-1" />
        <button
          onClick={onConfirm}
          disabled={committing}
          className="rounded-sm bg-primary text-primary-foreground stencil text-xs px-5 py-3 disabled:opacity-50"
        >
          {committing ? "LOCKING…" : "LOCK IN — SLAM THE STAMP"}
        </button>
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">
        Wager is fictional Trust — no real money anywhere in MILVERSE. If Trust hits 0 the city
        fronts you 50.
      </div>
    </div>
  );
}

/* ────────── Leaderboards ────────── */

function Leaderboards() {
  const [sharp, setSharp] = useState<Array<{ handle: string; plays: number; correct_pct: number }>>(
    [],
  );
  const [devious, setDevious] = useState<
    Array<{ case_id: string; plays: number; fooled_pct: number }>
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchSharpestWatch().catch(() => ({ rows: [] })),
      fetchMostDeviousDesigner().catch(() => ({ rows: [] })),
    ]).then(([a, b]) => {
      if (!alive) return;
      setSharp(a.rows);
      setDevious(b.rows);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded) return null;
  if (sharp.length === 0 && devious.length === 0) return null;

  return (
    <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="stencil text-[10px] text-primary flex items-center gap-1.5">
          <Trophy className="h-3 w-3" /> SHARPEST WATCH
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Top calibration · minimum 7 daily plays
        </div>
        {sharp.length === 0 ? (
          <div className="mt-3 text-xs text-muted-foreground italic">
            First 7-play watchers will appear here.
          </div>
        ) : (
          <ol className="mt-3 space-y-1 text-sm">
            {sharp.map((r, i) => (
              <li key={r.handle} className="flex items-center gap-3">
                <span className="stencil text-[10px] text-muted-foreground w-6">#{i + 1}</span>
                <span className="font-mono text-xs text-foreground flex-1">{r.handle}</span>
                <span className="stencil text-[10px] text-primary">{r.correct_pct}%</span>
                <span className="stencil text-[10px] text-muted-foreground">{r.plays} plays</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="stencil text-[10px] text-primary flex items-center gap-1.5">
          <Trophy className="h-3 w-3" /> MOST DEVIOUS DESIGNER
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Community cases · highest fooled-% (moderated)
        </div>
        {devious.length === 0 ? (
          <div className="mt-3 text-xs text-muted-foreground italic">
            Board's empty till Friday. Designer Friday fills this list.
          </div>
        ) : (
          <ol className="mt-3 space-y-1 text-sm">
            {devious.map((r, i) => (
              <li key={r.case_id} className="flex items-center gap-3">
                <span className="stencil text-[10px] text-muted-foreground w-6">#{i + 1}</span>
                <span className="font-mono text-xs text-foreground flex-1 truncate">
                  {r.case_id}
                </span>
                <span className="stencil text-[10px] text-caution">{r.fooled_pct}% fooled</span>
                <span className="stencil text-[10px] text-muted-foreground">{r.plays}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

// MILVERSE — /standoff. The pass-the-phone couch duel.
// Presentation-only. Zero network. Zero engine/scenario/scoring-math diffs.
// The only trace this whole flow leaves is milverse.standoff.v1 (see rules.ts).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { TopBar } from "@/components/TopBar";
import { loadProfile } from "@/lib/mirror/profile";
import { SCENARIOS, loadCitizenCases, getScenario, type Scenario } from "@/lib/mirror/scenarios";
import {
  armStandoff,
  pendingStandoffCase,
  clearPendingStandoff,
  scoreRound,
  isFairPick,
  TWO_WAY_LINE,
  appendStandoffRounds,
  type ReaderResult,
  type RoundCard,
} from "@/lib/standoff/rules";

const SESSION_KEY = "milverse.standoff.session";
const VERDICT_KEY = "milverse.verdict";
const SIM_KEY = "milverse.sim.current";

type Stage = "terms" | "pick" | "handoff" | "reveal" | "swap" | "card";

interface RoundRecord {
  seatWarden: 1 | 2;   // which round-number the warden held (1 or 2)
  caseId: string;
  fair: boolean;
  reader: ReaderResult;
  card: RoundCard;
}
interface Session {
  stage: Stage;
  round: 1 | 2;
  rounds: RoundRecord[];
  pickMode: "file" | "mask";
}

function loadSession(): Session {
  if (typeof window === "undefined") {
    return { stage: "terms", round: 1, rounds: [], pickMode: "file" };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch { /* noop */ }
  return { stage: "terms", round: 1, rounds: [], pickMode: "file" };
}
function saveSession(s: Session) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* noop */ }
}
function resetSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

export const Route = createFileRoute("/standoff")({
  head: () => ({
    meta: [
      { title: "The Standoff — MILVERSE" },
      { name: "description", content: "One phone. Two citizens. The warden knows the truth; the reader has four minutes to find it." },
      { property: "og:title", content: "The Standoff — MILVERSE" },
      { property: "og:description", content: "The couch duel. Best of two, same ledger, no network." },
    ],
  }),
  component: StandoffRoute,
});

function StandoffRoute() {
  const [session, setSession] = useState<Session>(() => loadSession());

  // If we returned here after a READ (mirror handoff), advance to reveal.
  useEffect(() => {
    const pending = pendingStandoffCase();
    if (pending && session.stage !== "reveal" && session.stage !== "card") {
      setSession((s) => {
        const next = { ...s, stage: "reveal" as Stage };
        saveSession(next);
        return next;
      });
    }
  }, [session.stage]);

  function set(update: Partial<Session>) {
    setSession((s) => {
      const next = { ...s, ...update };
      saveSession(next);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      {session.stage === "terms" && <TermsScreen onNext={() => set({ stage: "pick" })} />}
      {session.stage === "pick" && (
        <PickScreen
          round={session.round}
          pickMode={session.pickMode}
          onModeChange={(m) => set({ pickMode: m })}
          onPick={(caseId) => {
            armStandoff(caseId);
            set({ stage: "handoff" });
          }}
        />
      )}
      {session.stage === "handoff" && <HandoffScreen />}
      {session.stage === "reveal" && (
        <RevealScreen
          onNext={(record) => {
            const rounds = [...session.rounds, record];
            clearPendingStandoff();
            try { sessionStorage.removeItem(VERDICT_KEY); sessionStorage.removeItem(SIM_KEY); } catch { /* noop */ }
            if (session.round === 1) {
              set({ rounds, round: 2, stage: "swap" });
            } else {
              // Log the whole match and go to card.
              appendStandoffRounds(rounds.map((r) => ({
                caseId: r.caseId,
                fair: r.fair,
                reader: r.reader,
                seat: { warden: r.card.score.warden, reader: r.card.score.reader },
                ts: Date.now(),
              })));
              set({ rounds, stage: "card" });
            }
          }}
        />
      )}
      {session.stage === "swap" && <SwapScreen onNext={() => set({ stage: "pick" })} />}
      {session.stage === "card" && (
        <CardScreen
          rounds={session.rounds}
          onRematch={() => { resetSession(); setSession(loadSession()); }}
        />
      )}
    </div>
  );
}

/* ─────────── SCREEN 1 — THE TERMS ─────────── */
function TermsScreen({ onNext }: { onNext: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-caution">
        THE ARENA · EXHIBIT — LIVE
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">THE STANDOFF</h1>
      <div className="mt-6 rounded-xl border-2 border-border bg-card p-6">
        <p className="text-sm leading-relaxed text-foreground/90">
          Two seats. The WARDEN picks a file they've already cracked. The READER plays it cold.
          The city's rules hold on this couch: falling for it loses, calling wolf on a real one
          loses, and picking an unwinnable file loses — for the warden. Best of two rounds; you
          swap seats.
        </p>
      </div>
      <button
        onClick={onNext}
        className="mt-6 w-full min-h-[48px] rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground hover:brightness-110"
      >
        ROUND ONE →
      </button>
      <Link
        to="/arena"
        className="mt-3 block text-center font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← BACK TO THE ARENA
      </Link>
    </main>
  );
}

/* ─────────── SCREEN 2 — WARDEN'S PICK ─────────── */
function PickScreen({
  round, pickMode, onModeChange, onPick,
}: {
  round: 1 | 2;
  pickMode: "file" | "mask";
  onModeChange: (m: "file" | "mask") => void;
  onPick: (caseId: string) => void;
}) {
  const [solved, setSolved] = useState<Scenario[]>([]);
  const [masks, setMasks] = useState<Scenario[]>([]);

  useEffect(() => {
    // Solved-latest-correct rule (mirrors coldreads.isColdEligible).
    const p = loadProfile();
    const latest = new Map<string, string>(); // caseId → result of latest entry
    const sorted = [...p.history].sort((a, b) => a.ts - b.ts);
    for (const h of sorted) latest.set(h.caseId, h.result);
    const eligibleIds = new Set(
      [...latest.entries()].filter(([, r]) => r === "correct").map(([id]) => id),
    );
    const officialSolved: Scenario[] = [];
    for (const s of SCENARIOS) if (eligibleIds.has(s.id)) officialSolved.push(s);
    setSolved(officialSolved);
    setMasks(loadCitizenCases());
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-caution">
        ROUND {round} · WARDEN'S PICK
      </div>
      <h1 className="mt-2 text-2xl font-semibold">READER — EYES OFF. Warden's screen.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The warden picks. Nothing on this screen names truth — you already know which file you're
        putting on the table.
      </p>

      <div className="mt-4 flex gap-2 font-mono text-[11px] tracking-widest">
        <button
          onClick={() => onModeChange("file")}
          className={`rounded-md border px-3 py-2 min-h-[44px] ${
            pickMode === "file"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          FILE MODE
        </button>
        <button
          onClick={() => onModeChange("mask")}
          className={`rounded-md border px-3 py-2 min-h-[44px] ${
            pickMode === "mask"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          RUN YOUR OWN MASK
        </button>
      </div>

      {pickMode === "file" ? (
        <>
          {solved.length === 0 ? (
            <div className="mt-6 rounded-md border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              No solved files on this device yet. The warden needs a file they already cracked —
              play a case in{" "}
              <Link to="/mirror" className="text-primary underline">The Mirror</Link>{" "}
              first, then come back.
            </div>
          ) : (
            <ul className="mt-6 space-y-2">
              {solved.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onPick(s.id)}
                    className="w-full text-left rounded-md border border-border bg-card p-4 hover:border-primary/60 min-h-[64px]"
                  >
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                      TIER {s.tier} · {s.channel.toUpperCase()}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{s.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-md border-l-2 border-caution bg-caution/5 p-4 text-sm">
            <div className="font-mono text-[10px] tracking-widest text-caution mb-1">
              THE HONESTY GATE
            </div>
            <p className="text-foreground/90">
              Ask the reader first: "Heard of the case you're about to pick?" If they've played
              it, pick another. The couch runs on that.
            </p>
          </div>
        </>
      ) : (
        <MaskPickList masks={masks} onPick={onPick} />
      )}
    </main>
  );
}

function MaskPickList({ masks, onPick }: { masks: Scenario[]; onPick: (caseId: string) => void }) {
  if (masks.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        No Studio masks on this device yet. Build one in{" "}
        <Link to="/studio" className="text-primary underline">the Studio</Link>{" "}
        and it'll appear here.
      </div>
    );
  }
  return (
    <ul className="mt-6 space-y-2">
      {masks.map((s) => {
        const fair = isFairPick(s);
        return (
          <li key={s.id}>
            <button
              onClick={() => onPick(s.id)}
              className={`w-full text-left rounded-md border p-4 min-h-[64px] ${
                fair
                  ? "border-border bg-card hover:border-primary/60"
                  : "border-destructive/60 bg-destructive/[0.05] hover:border-destructive"
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] tracking-widest">
                <span className="text-muted-foreground">TIER {s.tier} · MASK</span>
                {!fair && (
                  <span className="rounded-sm border border-destructive/60 px-1.5 py-0.5 text-destructive">
                    UNFAIR PICK — WARDEN LOSES ON REVEAL
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm font-semibold">{s.title}</div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────── SCREEN 3 — HANDOFF ─────────── */
function HandoffScreen() {
  const navigate = useNavigate();
  const pending = pendingStandoffCase();
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="font-mono text-[10px] tracking-[0.3em] text-caution">HANDOFF</div>
      <h1 className="mt-3 text-3xl font-semibold leading-snug">
        PHONE TO THE READER.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/85">
        Warden: your face is now part of the case. Keep it shut.
      </p>
      <button
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (pending) navigate({ to: "/mirror/$caseId", params: { caseId: pending } });
          }
        }}
        onClick={() => { if (pending) navigate({ to: "/mirror/$caseId", params: { caseId: pending } }); }}
        className="mt-8 min-h-[52px] rounded-md bg-primary px-8 py-3 font-mono text-sm tracking-widest text-primary-foreground hover:brightness-110"
      >
        I'M THE READER — DEAL ME IN
      </button>
    </main>
  );
}

/* ─────────── SCREEN 5 — THE REVEAL ─────────── */
function RevealScreen({ onNext }: { onNext: (r: RoundRecord) => void }) {
  const record = useMemo<RoundRecord | null>(() => {
    if (typeof window === "undefined") return null;
    const caseId = pendingStandoffCase();
    if (!caseId) return null;
    const s = getScenario(caseId);
    if (!s) return null;
    let verdictRaw: { verdict: "REAL" | "FAKE" } | null = null;
    try {
      const raw = sessionStorage.getItem(VERDICT_KEY);
      if (raw) verdictRaw = JSON.parse(raw) as { verdict: "REAL" | "FAKE" };
    } catch { /* noop */ }
    const truthLabel: "REAL" | "FAKE" = s.truth === "REAL" ? "REAL" : "FAKE";
    // If the reader ran out the clock with no verdict, the mirror route
    // forces CALL IT (cold-read fence). If VERDICT_KEY is empty for any
    // reason, count as a loss for the reader — same as false alarm on a
    // real case: the couch never allows "no answer" as a strategy.
    const reader: ReaderResult =
      verdictRaw && verdictRaw.verdict === truthLabel ? "correct" : "wrong";
    const fair = s.source === "user_designed" ? isFairPick(s) : true;
    const card = scoreRound({ fair, reader });
    return {
      seatWarden: 1,
      caseId: s.id,
      fair,
      reader,
      card,
    };
  }, []);

  if (!record) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        No round on record.{" "}
        <Link to="/standoff" className="text-primary underline">
          Restart the standoff
        </Link>
      </main>
    );
  }

  const s = getScenario(record.caseId)!;
  const truthLabel = s.truth === "REAL" ? "REAL" : "FAKE";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-caution">THE REVEAL</div>
      <h1 className="mt-2 text-2xl font-semibold">Both eyes on the phone.</h1>

      {/* Verdict stamp (mirrors the existing verdict-stamp look; render inline
          so we don't remount the mirror's VerdictMoment full-screen chrome here). */}
      <div
        className={`mt-6 rounded-xl border-2 p-6 text-center ${
          record.reader === "correct"
            ? "border-primary/60 bg-primary/10 text-primary"
            : "border-destructive/60 bg-destructive/10 text-destructive"
        }`}
      >
        <div className="font-mono text-[10px] tracking-[0.3em] opacity-80">TRUTH</div>
        <div className="mt-2 text-4xl font-bold tracking-widest">{truthLabel}</div>
        <div className="mt-3 font-mono text-[11px] tracking-widest opacity-90">
          READER CALLED IT · {record.reader === "correct" ? "RIGHT" : "WRONG"}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          ROUND CARD · {record.fair ? "FAIR FILE" : "UNFAIR FILE"}
        </div>
        <div className="mt-2 text-lg font-semibold">{record.card.headline}</div>
        <p className="mt-2 text-sm text-foreground/85">{record.card.body}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs tracking-widest">
          <div className="rounded-md border border-border p-3">
            <div className="text-muted-foreground">WARDEN</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {record.card.score.warden.toFixed(1)}
            </div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-muted-foreground">READER</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {record.card.score.reader.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-l-2 border-caution bg-caution/5 p-4 text-sm text-foreground/90">
        {TWO_WAY_LINE}
      </div>

      <button
        onClick={() => onNext(record)}
        className="mt-6 w-full min-h-[48px] rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground hover:brightness-110"
      >
        SWAP SEATS — ROUND TWO →
      </button>
    </main>
  );
}

/* ─────────── SCREEN — SWAP ─────────── */
function SwapScreen({ onNext }: { onNext: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="font-mono text-[10px] tracking-[0.3em] text-caution">SWAP SEATS</div>
      <h1 className="mt-3 text-3xl font-semibold">Reader becomes warden. Warden becomes reader.</h1>
      <p className="mt-4 max-w-md text-sm text-foreground/85">
        Same couch, different chairs. The new warden picks a file the new reader hasn't played.
      </p>
      <button
        onClick={onNext}
        className="mt-8 min-h-[52px] rounded-md bg-primary px-8 py-3 font-mono text-sm tracking-widest text-primary-foreground hover:brightness-110"
      >
        WARDEN — YOUR PICK →
      </button>
    </main>
  );
}

/* ─────────── SCREEN 6 — THE CARD ─────────── */
function CardScreen({ rounds, onRematch }: { rounds: RoundRecord[]; onRematch: () => void }) {
  const tally = rounds.reduce(
    (acc, r, i) => {
      // Seats swap between round 1 and round 2 — track by seat label per round.
      // Warden of round 1 = Player A; Warden of round 2 = Player B.
      if (i === 0) {
        acc.wardenR1 += r.card.score.warden;
        acc.readerR1 += r.card.score.reader;
      } else {
        acc.wardenR2 += r.card.score.warden;
        acc.readerR2 += r.card.score.reader;
      }
      return acc;
    },
    { wardenR1: 0, readerR1: 0, wardenR2: 0, readerR2: 0 },
  );
  const playerA = tally.wardenR1 + tally.readerR2;
  const playerB = tally.wardenR2 + tally.readerR1;

  let verdictLine: string;
  if (playerA > playerB) verdictLine = "WARDEN R1 / READER R2 TAKES IT.";
  else if (playerB > playerA) verdictLine = "WARDEN R2 / READER R1 TAKES IT.";
  else verdictLine = "SPLIT DECISION — the city keeps the point.";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="font-mono text-[10px] tracking-[0.3em] text-caution">
        THE STANDOFF · FINAL CARD
      </div>
      <h1 className="mt-2 text-2xl font-semibold">The couch is tallied.</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
            WARDEN R1 · READER R2
          </div>
          <div className="mt-2 text-3xl font-bold">{playerA.toFixed(1)}</div>
          <div className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            W {tally.wardenR1.toFixed(1)} · R {tally.readerR2.toFixed(1)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
            WARDEN R2 · READER R1
          </div>
          <div className="mt-2 text-3xl font-bold">{playerB.toFixed(1)}</div>
          <div className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            W {tally.wardenR2.toFixed(1)} · R {tally.readerR1.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border-2 border-primary/50 bg-primary/5 p-5 text-center">
        <div className="text-lg font-semibold text-primary">{verdictLine}</div>
        <p className="mt-3 text-sm text-foreground/85">Same phone tomorrow. Different file.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onRematch}
          className="flex-1 min-h-[48px] rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground hover:brightness-110"
        >
          REMATCH →
        </button>
        <Link
          to="/arena"
          className="flex-1 min-h-[48px] rounded-md border border-border py-3 text-center font-mono text-sm tracking-widest text-muted-foreground hover:text-foreground flex items-center justify-center"
        >
          BACK TO THE ARENA
        </Link>
      </div>
    </main>
  );
}

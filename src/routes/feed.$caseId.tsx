import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { getFeedScenario, type FeedScenario, type FeedVerdict } from "@/lib/feed/scenarios";
import {
  initFeedState, senderReact, runAction, gradeVerdict, classifyTone,
  type FeedMessage, type FeedState, type FeedOutcome,
} from "@/lib/feed/engine";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { checkAndAwardBadges } from "@/lib/mirror/badges";
import { logPilotEntry } from "@/lib/pilot";
import { Send, Search, Forward, Heart, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { RealCaseFile } from "@/components/RealCaseFile";

export const Route = createFileRoute("/feed/$caseId")({
  loader: ({ params }) => {
    const s = getFeedScenario(params.caseId);
    if (!s) throw notFound();
    return { scenario: s };
  },
  component: FeedPlay,
});

type Phase = "brief" | "sim" | "verdict" | "debrief";

function FeedPlay() {
  const { scenario } = Route.useLoaderData();
  const [phase, setPhase] = useState<Phase>("brief");
  const [state, setState] = useState<FeedState>(() => initFeedState());
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [outcome, setOutcome] = useState<FeedOutcome | null>(null);
  const [verdict, setVerdict] = useState<FeedVerdict | null>(null);
  const [finalReply, setFinalReply] = useState("");
  const [conclusion, setConclusion] = useState("");


  useEffect(() => {
    if (phase === "sim" && messages.length === 0) {
      setMessages([
        { role: "sender", text: scenario.opener, ts: Date.now() },
      ]);
    }
  }, [phase, scenario.opener, messages.length]);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      {phase === "brief" && <Brief scenario={scenario} onStart={() => setPhase("sim")} />}
      {phase === "sim" && (
        <Sim
          scenario={scenario}
          state={state}
          setState={setState}
          messages={messages}
          setMessages={setMessages}
          onDeliverVerdict={() => setPhase("verdict")}
        />
      )}
      {phase === "verdict" && (
        <VerdictScreen
          scenario={scenario}
          state={state}
          finalReply={finalReply}
          setFinalReply={setFinalReply}
          verdict={verdict}
          setVerdict={setVerdict}
          conclusion={conclusion}
          setConclusion={setConclusion}
          onConfirm={() => {

            if (!verdict) return;
            const oc = gradeVerdict(scenario, state, verdict, finalReply);
            setOutcome(oc);
            // feed the ONE chart in City Hall
            const p = loadProfile();
            p.casesPlayed += 1;
            p.points += oc.points;
            if (oc.result === "correct") p.correctVerdicts += 1;
            if (oc.result === "missed_fake") p.missedScams += 1;
            if (oc.result === "false_alarm") p.falseAlarms += 1;
            if (oc.result === "pyrrhic") p.falseAlarms += 1; // treated as calibration failure
            p.history.push({
              caseId: `feed:${scenario.id}`,
              tier: (scenario.tier as unknown) as 1 | 2 | 3 | 4 | 5,
              verdict: verdict === "TRUE" ? "REAL" : "FAKE",
              truth: scenario.verdict === "TRUE" ? "REAL" : "IMPOSTER",
              result:
                oc.result === "correct" ? "correct" :
                oc.result === "missed_fake" ? "missed_scam" :
                oc.result === "false_alarm" ? "false_alarm" :
                "false_alarm",
              points: oc.points,
              ts: Date.now(),
            });
            saveProfile(p);
            logPilotEntry({
              wing: "feed",
              caseId: scenario.id,
              result:
                oc.result === "correct" ? "correct" :
                oc.result === "missed_fake" ? "missed_scam" :
                oc.result === "false_alarm" ? "false_alarm" :
                oc.result === "pyrrhic" ? "pyrrhic" :
                "false_alarm",
              points: oc.points,
              ts: Date.now(),
            });
            window.dispatchEvent(new Event("milverse:profile"));
            checkAndAwardBadges(p);
            setPhase("debrief");
          }}
        />
      )}
      {phase === "debrief" && outcome && (
        <Debrief scenario={scenario} outcome={outcome} state={state} verdict={verdict} conclusion={conclusion} finalReply={finalReply} />
      )}

    </div>
  );
}

/* ─────────── BRIEF ─────────── */
function Brief({ scenario, onStart }: { scenario: FeedScenario; onStart: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/feed" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">← FEED</Link>
      <div className="mt-6 rounded-xl border border-caution/30 bg-caution/5 p-6">
        <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-caution">
          <ShieldAlert className="h-4 w-4" /> INCOMING FORWARD · TIER {scenario.tier}
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{scenario.title}</h1>
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">WHO SENT IT</div>
          <p className="mt-1 text-sm">{scenario.sender.name} — {scenario.sender.relationship}</p>
        </section>
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">WHY THEY SENT IT</div>
          <p className="mt-1 text-sm">{scenario.senderMotive}</p>
        </section>
        <section className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="font-mono text-[11px] tracking-widest text-primary mb-2">TWO JOBS</div>
          <div className="flex gap-2"><Search className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Judge the CLAIM: <b>TRUE</b>, <b>FALSE</b>, or <b>MISLEADING</b>.</span></div>
          <div className="mt-2 flex gap-2"><Heart className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Protect the RELATIONSHIP. Being right rudely = the lie survives.</span></div>
        </section>
      </div>
      <button onClick={onStart} className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]">
        OPEN THE CHAT
      </button>
    </main>
  );
}

/* ─────────── SIM ─────────── */
function Sim({
  scenario, state, setState, messages, setMessages, onDeliverVerdict,
}: {
  scenario: FeedScenario;
  state: FeedState;
  setState: (s: FeedState) => void;
  messages: FeedMessage[];
  setMessages: React.Dispatch<React.SetStateAction<FeedMessage[]>>;
  onDeliverVerdict: () => void;
}) {
  const [tab, setTab] = useState<"chat" | "toolkit">("chat");
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    const t = input.trim();
    if (!t) return;
    const next = { ...state, actionsUsed: [...state.actionsUsed] };
    setMessages((prev) => [...prev, { role: "player", text: t, ts: Date.now() }]);
    setInput("");
    const react = senderReact(scenario, next, t);
    setState(next);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "sender", text: react.text, ts: Date.now() }]);
    }, 500);
  }

  function doAction(id: string) {
    const next = { ...state, actionsUsed: [...state.actionsUsed] };
    const r = runAction(scenario, next, id);
    if (!r) return;
    setState(next);
    const a = scenario.actions.find((x) => x.id === id)!;
    setMessages((prev) => [
      ...prev,
      { role: "system", text: `🔎 You: ${a.label}`, ts: Date.now(), isAction: true },
      { role: "system", text: r.snippet, ts: Date.now() + 1, isAction: true },
    ]);
    setTab("chat");
  }

  const dignityColor =
    state.dignity > 60 ? "bg-primary" : state.dignity > 30 ? "bg-caution" : "bg-destructive";

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 flex flex-col" style={{ minHeight: "calc(100vh - 57px)" }}>
      <div className="rounded-t-xl border border-border border-b-0 bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{scenario.sender.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{scenario.sender.relationship}</div>
          </div>
          <button
            onClick={onDeliverVerdict}
            disabled={messages.length < 2}
            className="rounded-md border border-primary/50 bg-primary/10 px-2.5 py-1.5 text-[10px] font-mono tracking-widest text-primary hover:bg-primary/20 disabled:opacity-40"
          >
            DELIVER VERDICT →
          </button>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
            <span>DIGNITY · {scenario.sender.name.split(" ")[0]}</span>
            <span>{Math.round(state.dignity)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full transition-all duration-500 ${dignityColor}`} style={{ width: `${state.dignity}%` }} />
          </div>
        </div>
        <div className="mt-3 flex gap-1 border-t border-border pt-2">
          {(["chat", "toolkit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1 font-mono text-[10px] tracking-widest transition ${
                tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "chat" ? "CHAT" : `TOOLKIT · ${state.actionsUsed.length}/${scenario.actions.length}`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden border-x border-border bg-background/40">
        {tab === "chat" ? (
          <div ref={scroller} className="h-full overflow-y-auto p-4 space-y-3">
            <ForwardCard scenario={scenario} />
            {messages.map((m, i) => <FeedRow key={i} m={m} />)}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
              VERIFICATION ACTIONS · each one costs a turn (a small hit to dignity — they'll feel you're stalling)
            </div>
            {scenario.actions.map((a) => {
              const used = state.actionsUsed.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => doAction(a.id)}
                  disabled={used}
                  className={`w-full text-left rounded-md border p-3 text-sm transition ${
                    used
                      ? "border-primary/40 bg-primary/5 opacity-70"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{a.label}</span>
                    {used && <span className="ml-auto font-mono text-[10px] tracking-widest text-primary">USED</span>}
                  </div>
                  {used && <div className="mt-2 text-xs text-muted-foreground">{a.result}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-b-xl border border-border border-t-0 bg-card p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Reply to them…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button onClick={send} disabled={!input.trim()} className="rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground">
          OPEN TOOLKIT TO CHECK FACTS · BE KIND, BE CORRECT
        </div>
      </div>
    </main>
  );
}

function FeedRow({ m }: { m: FeedMessage }) {
  if (m.role === "system") {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
        <div className="font-mono text-[10px] tracking-widest text-primary">{m.isAction ? "VERIFICATION" : "SYSTEM"}</div>
        <div className="mt-1 text-foreground/90">{m.text}</div>
      </div>
    );
  }
  const isPlayer = m.role === "player";
  return (
    <div className={`msg-in flex ${isPlayer ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
        isPlayer ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border border-border rounded-bl-sm"
      }`}>{m.text}</div>
    </div>
  );
}

function ForwardCard({ scenario }: { scenario: FeedScenario }) {
  const f = scenario.forward;
  return (
    <div className="rounded-lg border border-caution/40 bg-caution/5 overflow-hidden">
      {f.meta && <div className="px-3 py-1.5 font-mono text-[10px] tracking-widest text-caution border-b border-caution/30 flex items-center gap-1.5">
        <Forward className="h-3 w-3" /> {f.meta}
      </div>}
      {f.imageEmoji && (
        <div className="flex items-center justify-center bg-muted/40 py-8 text-6xl" aria-label={f.imageAlt}>{f.imageEmoji}</div>
      )}
      <div className="p-3">
        {f.headline && <div className="text-sm font-semibold">{f.headline}</div>}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {f.bodyLines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </div>
    </div>
  );
}

/* ─────────── VERDICT ─────────── */
function VerdictScreen({
  scenario, state, verdict, setVerdict, finalReply, setFinalReply, conclusion, setConclusion, onConfirm,
}: {
  scenario: FeedScenario;
  state: FeedState;
  verdict: FeedVerdict | null;
  setVerdict: (v: FeedVerdict) => void;
  finalReply: string;
  setFinalReply: (s: string) => void;
  conclusion: string;
  setConclusion: (s: string) => void;
  onConfirm: () => void;
}) {
  const tone = classifyTone(finalReply);
  const toneColor =
    tone === "rude" ? "text-destructive" : tone === "respectful" ? "text-primary" : "text-muted-foreground";
  const usedActions = scenario.actions.filter((a) => state.actionsUsed.includes(a.id));
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="font-mono text-xs tracking-[0.3em] text-caution">INVESTIGATION BOARD</div>
      <h1 className="mt-2 text-2xl font-semibold">Assemble the case. Deliver the verdict.</h1>

      <section className="mt-5 rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
          CASE FILE · AUTO-COLLECTED
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-widest text-primary mb-1.5">
            THE CLAIM
          </div>
          <p className="text-xs italic border-l-2 border-primary/40 pl-2.5">"{scenario.opener}"</p>
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-widest text-caution mb-1.5">
            VERIFICATION STEPS USED · {usedActions.length}/{scenario.actions.length}
          </div>
          {usedActions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No toolkit actions used — you're calling this cold.</p>
          ) : (
            <ul className="text-xs text-muted-foreground space-y-1">
              {usedActions.map((a) => (
                <li key={a.id}>· {a.label}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="mt-6 text-sm text-muted-foreground">
        MISLEADING = the core is true but the framing (photo, date, context) is not. That's the most common type.
      </p>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["TRUE", "MISLEADING", "FALSE", "UNVERIFIED"] as FeedVerdict[]).map((v) => (
          <button
            key={v}
            onClick={() => setVerdict(v)}
            className={`rounded-md border-2 p-4 font-mono text-xs tracking-widest transition ${
              verdict === v
                ? v === "TRUE" ? "border-primary bg-primary/10 text-primary" :
                  v === "MISLEADING" ? "border-caution bg-caution/10 text-caution" :
                  v === "UNVERIFIED" ? "border-muted-foreground bg-muted/40 text-foreground" :
                  "border-destructive bg-destructive/10 text-destructive"
                : "border-border hover:border-primary/50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        UNVERIFIED = the claim can neither be confirmed nor disproved. Refusing to forward fear you can't check is the correct move.
      </p>

      <div className="mt-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
          NOW WRITE YOUR REPLY TO {scenario.sender.name.toUpperCase()}
        </div>
        <textarea
          value={finalReply}
          onChange={(e) => setFinalReply(e.target.value)}
          rows={5}
          placeholder="Type what you'd actually send them…"
          className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
        />
        <div className={`mt-1 font-mono text-[10px] tracking-widest ${toneColor}`}>
          TONE READ: {tone.toUpperCase()}
        </div>
      </div>

      <div className="mt-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
          INVESTIGATOR'S CONCLUSION · OPTIONAL
        </div>
        <textarea
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value.slice(0, 300))}
          rows={2}
          placeholder="In one line: why this verdict? (max 300 chars)"
          className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
        />
        <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{conclusion.length}/300</div>
      </div>

      <button
        onClick={onConfirm}
        disabled={!verdict || !finalReply.trim()}
        className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground disabled:opacity-40"
      >
        SEND & SEE RESULT
      </button>
    </main>
  );
}

/* ─────────── DEBRIEF ─────────── */
function Debrief({ scenario, outcome, state, verdict, conclusion, finalReply }: { scenario: FeedScenario; outcome: FeedOutcome; state: FeedState; verdict: FeedVerdict | null; conclusion: string; finalReply: string }) {

  const navigate = useNavigate();
  const Icon = outcome.result === "correct" ? CheckCircle2 : outcome.result === "pyrrhic" ? Heart : AlertTriangle;
  const border =
    outcome.result === "correct" ? "border-primary bg-primary/10 text-primary" :
    outcome.result === "pyrrhic" ? "border-caution bg-caution/10 text-caution" :
    "border-destructive bg-destructive/10 text-destructive";

  // 4-axis stars (each 0, 0.5, or 1) → total 0–4
  const tone = classifyTone(finalReply);
  const correctVerdict = verdict === scenario.verdict;
  const total = scenario.actions.length || 1;
  const usedRatio = state.actionsUsed.length / total;
  const starDecision = correctVerdict ? (outcome.result === "pyrrhic" ? 0.5 : 1) : 0;
  const starEvidence = usedRatio >= 0.6 ? 1 : usedRatio >= 0.3 ? 0.5 : 0;
  const starVerification = state.actionsUsed.length >= 2 ? 1 : state.actionsUsed.length >= 1 ? 0.5 : 0;
  const starReasoning =
    (tone === "respectful" ? 1 : tone === "neutral" ? 0.5 : 0) +
    (conclusion.trim().length >= 20 ? 0.25 : 0);
  const clampedReasoning = Math.min(1, starReasoning);
  const stars = starDecision + starEvidence + starVerification + clampedReasoning;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <div className={`rounded-xl border-2 p-6 ${border}`}>
        <Icon className="h-8 w-8 mb-3" />
        <div className="font-mono text-xs tracking-[0.3em] opacity-80">{outcome.result.replace("_", " ").toUpperCase()} · {outcome.points > 0 ? "+" : ""}{outcome.points}</div>
        <div className="mt-1 text-xl font-semibold">{outcome.headline}</div>
        <p className="mt-2 text-sm">{outcome.detail}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-xs tracking-widest text-muted-foreground">
            INVESTIGATOR RATING
          </div>
          <div className="font-mono text-lg text-primary">{stars.toFixed(1)} / 4.0</div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FeedStarAxis label="Decision" value={starDecision} />
          <FeedStarAxis label="Evidence" value={starEvidence} />
          <FeedStarAxis label="Verification" value={starVerification} />
          <FeedStarAxis label="Reasoning" value={clampedReasoning} />
        </div>
      </section>

      {conclusion.trim() && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">YOUR CONCLUSION</div>
          <p className="text-sm italic border-l-2 border-primary pl-3">"{conclusion.trim()}"</p>
        </div>
      )}


      <div className="rounded-xl border border-border bg-card p-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">WHAT'S ACTUALLY TRUE</div>
        <p className="text-sm">{scenario.truthNote}</p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <div className="font-mono text-xs tracking-widest text-primary mb-2">A REPLY THAT WOULD HAVE WORKED</div>
        <p className="text-sm italic">"{scenario.respectfulScript}"</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Actions used</span>
        <span className="font-mono">{state.actionsUsed.length} / {scenario.actions.length}</span>
      </div>

      <RealCaseFile caseId={scenario.id} inline={scenario.inspiredBy} />

      <div className="flex gap-2">

        <button onClick={() => navigate({ to: "/feed" })} className="flex-1 rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground">
          BACK TO THE FEED
        </button>
        <button onClick={() => navigate({ to: "/city-hall" })} className="flex-1 rounded-md border border-border py-3 font-mono text-xs tracking-widest hover:border-primary/50">
          VIEW CALIBRATION →
        </button>
      </div>
    </main>
  );
}

function FeedStarAxis({ label, value }: { label: string; value: number }) {
  const filled = value >= 1 ? "★" : value >= 0.5 ? "⯪" : "☆";
  const tone = value >= 1 ? "text-primary" : value >= 0.5 ? "text-caution" : "text-muted-foreground/40";
  return (
    <div className="rounded-md border border-border bg-background/50 p-3 text-center">
      <div className={`text-2xl ${tone}`}>{filled}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

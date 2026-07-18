import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { getFeedScenario, type FeedScenario, type FeedVerdict } from "@/lib/feed/scenarios";
import {
  initFeedState,
  senderReact,
  runAction,
  gradeVerdict,
  classifyTone,
  type FeedMessage,
  type FeedState,
  type FeedOutcome,
} from "@/lib/feed/engine";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { computeXp } from "@/lib/ranks";
import { loadUnlocked } from "@/lib/manual/state";
import { writeXpDelta } from "@/lib/rank/xpSnapshot";
import { XpDeltaLine } from "@/components/rank/XpDeltaLine";
import { checkAndAwardBadges } from "@/lib/mirror/badges";
import { logPilotEntry } from "@/lib/pilot";
import { appendFeedWall } from "@/lib/feed/wall";
import { Send, Search, Heart, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { RealCaseFile } from "@/components/RealCaseFile";
import { NextCaseCard } from "@/components/NextCaseCard";
import { CAST } from "@/lib/cast";

import { FormatFrame } from "@/components/feed/FormatFrame";
import { Toolbelt } from "@/components/feed/Toolbelt";
import { TacticStamp } from "@/components/TacticStamp";
import { CalibrationQuadrant } from "@/components/CalibrationQuadrant";
import { CitySolved } from "@/components/CitySolved";
import { TacticFlash } from "@/components/TacticFlash";
import { VerdictMoment, type CalibrationOutcome } from "@/components/VerdictMoment";
import { RookieIntro } from "@/components/handler/RookieIntro";
import { SendOff } from "@/components/handler/SendOff";
import { LossBeat } from "@/components/handler/LossBeat";
import { labelForTactic } from "@/lib/handler/profile";
import { track } from "@/lib/telemetry";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useJuniorGate } from "@/components/firstPhone/JuniorGate";

export const Route = createFileRoute("/feed/$caseId")({
  loader: ({ params }) => {
    const s = getFeedScenario(params.caseId);
    if (!s) throw notFound();
    return { scenario: s };
  },
  component: function FeedCaseGuarded() {
    const gate = useJuniorGate("The Feed");
    return gate ?? <FeedPlay />;
  },
});

type Phase = "brief" | "sim" | "verdict" | "reveal" | "debrief";

function FeedPlay() {
  const { scenario } = Route.useLoaderData();
  const [phase, setPhase] = useState<Phase>("brief");
  const [state, setState] = useState<FeedState>(() => initFeedState());
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [outcome, setOutcome] = useState<FeedOutcome | null>(null);
  const [verdict, setVerdict] = useState<FeedVerdict | null>(null);
  const [finalReply, setFinalReply] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [loadBearing, setLoadBearing] = useState<string[]>([]);


  useEffect(() => {
    track("case_start", {
      case_id: scenario.id,
      payload: { district: "feed", tactic: scenario.tacticId ?? "unknown" },
    });
  }, [scenario.id, scenario.tacticId]);

  useEffect(() => {
    if (outcome) {
      track("case_complete", {
        case_id: scenario.id,
        payload: {
          district: "feed",
          correct: outcome.result === "correct",
          result: outcome.result,
          tactic: scenario.tacticId ?? "unknown",
        },
      });
    }
  }, [outcome, scenario.id, scenario.tacticId]);

  useEffect(() => {
    if (phase === "sim" && messages.length === 0) {
      setMessages([{ role: "sender", text: scenario.opener, ts: Date.now() }]);
    }
  }, [phase, scenario.opener, messages.length]);

  // In "sim" phase, ChatShell owns the whole viewport (CitizenOS phone).
  if (phase === "sim") {
    return (
      <Sim
        scenario={scenario}
        state={state}
        setState={setState}
        messages={messages}
        setMessages={setMessages}
        onDeliverVerdict={() => setPhase("verdict")}
      />
    );
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <RookieIntro />
      </div>
      {phase === "brief" && <Brief scenario={scenario} onStart={() => setPhase("sim")} />}
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
          loadBearing={loadBearing}
          setLoadBearing={setLoadBearing}
          onConfirm={() => {

            if (!verdict) return;
            const oc = gradeVerdict(scenario, state, verdict, finalReply);
            setOutcome(oc);
            // feed the ONE chart in City Hall
            const p = loadProfile();
            const xpBefore = computeXp(p, loadUnlocked().size, p.publishedCount ?? 0);
            p.casesPlayed += 1;
            p.points += oc.points;
            if (oc.result === "correct") p.correctVerdicts += 1;
            if (oc.result === "missed_fake") p.missedScams += 1;
            if (oc.result === "false_alarm") p.falseAlarms += 1;
            if (oc.result === "pyrrhic") p.falseAlarms += 1; // treated as calibration failure
            p.history.push({
              caseId: `feed:${scenario.id}`,
              tier: scenario.tier as unknown as 1 | 2 | 3 | 4 | 5,
              verdict: verdict === "TRUE" ? "REAL" : "FAKE",
              truth: scenario.verdict === "TRUE" ? "REAL" : "IMPOSTER",
              result:
                oc.result === "correct"
                  ? "correct"
                  : oc.result === "missed_fake"
                    ? "missed_scam"
                    : oc.result === "false_alarm"
                      ? "false_alarm"
                      : "false_alarm",
              points: oc.points,
              ts: Date.now(),
            });
            saveProfile(p);
            const xpAfter = computeXp(p, loadUnlocked().size, p.publishedCount ?? 0);
            writeXpDelta(xpBefore, xpAfter);
            const nowTs = Date.now();
            logPilotEntry({
              wing: "feed",
              caseId: scenario.id,
              result:
                oc.result === "correct"
                  ? "correct"
                  : oc.result === "missed_fake"
                    ? "missed_scam"
                    : oc.result === "false_alarm"
                      ? "false_alarm"
                      : oc.result === "pyrrhic"
                        ? "pyrrhic"
                        : "false_alarm",
              points: oc.points,
              ts: nowTs,
            });
            appendFeedWall({
              caseId: scenario.id,
              verdict: verdict as "TRUE" | "FALSE" | "MISLEADING",
              result:
                oc.result === "correct"
                  ? "correct"
                  : oc.result === "missed_fake"
                    ? "missed_scam"
                    : oc.result === "false_alarm"
                      ? "false_alarm"
                      : "pyrrhic",
              ts: nowTs,
            });
            window.dispatchEvent(new Event("milverse:profile"));
            checkAndAwardBadges(p);
            setPhase("reveal");
          }}
        />
      )}
      {phase === "reveal" && outcome && (
        <VerdictMoment
          caseTitle={scenario.opener.slice(0, 140)}
          caseId={scenario.id}
          stampLabel={verdict ?? "UNVERIFIED"}
          outcome={
            (outcome.result === "correct"
              ? "correct"
              : outcome.result === "missed_fake"
                ? "missed_scam"
                : "false_alarm") as CalibrationOutcome
          }
          onDone={() => setPhase("debrief")}
        />
      )}
      {phase === "debrief" && outcome && (
        <Debrief
          scenario={scenario}
          outcome={outcome}
          state={state}
          verdict={verdict}
          conclusion={conclusion}
          finalReply={finalReply}
          loadBearing={loadBearing}
        />

      )}
    </div>
  );
}

/* ─────────── BRIEF ─────────── */
function Brief({ scenario, onStart }: { scenario: FeedScenario; onStart: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/feed"
        className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← FEED
      </Link>
      <div className="mt-6 rounded-xl border border-caution/30 bg-caution/5 p-6">
        <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-caution">
          <ShieldAlert className="h-4 w-4" /> INCOMING FORWARD · TIER {scenario.tier}
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{scenario.title}</h1>
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            WHO SENT IT
          </div>
          <p className="mt-1 text-sm">
            {scenario.sender.name} — {scenario.sender.relationship}
          </p>
        </section>
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            WHY THEY SENT IT
          </div>
          <p className="mt-1 text-sm">{scenario.senderMotive}</p>
        </section>
        <section className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="font-mono text-[11px] tracking-widest text-primary mb-2">TWO JOBS</div>
          <div className="flex gap-2">
            <Search className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Judge the CLAIM: <b>TRUE</b>, <b>FALSE</b>, or <b>MISLEADING</b>.
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <Heart className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>Protect the RELATIONSHIP. Being right rudely = the lie survives.</span>
          </div>
        </section>
      </div>
      <SendOff />
      <button
        onClick={onStart}
        className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]"
      >
        OPEN THE CHAT
      </button>
    </main>
  );
}

/* ─────────── SIM ─────────── */
function Sim({
  scenario,
  state,
  setState,
  messages,
  setMessages,
  onDeliverVerdict,
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
  const [typing, setTyping] = useState(false);
  const [tacticFlash, setTacticFlash] = useState<typeof scenario.tacticId | null>(null);
  const tacticFlashed = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send() {
    const t = input.trim();
    if (!t) return;
    const next = { ...state, actionsUsed: [...state.actionsUsed] };
    setMessages((prev) => [...prev, { role: "player", text: t, ts: Date.now() }]);
    setInput("");
    const react = senderReact(scenario, next, t);
    setState(next);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "sender", text: react.text, ts: Date.now() }]);
    }, 900);
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
    if (a.decisive && scenario.tacticId && !tacticFlashed.current) {
      tacticFlashed.current = true;
      setTacticFlash(scenario.tacticId);
    }
    setTab("chat");
  }

  const dignityColor =
    state.dignity > 60 ? "bg-primary" : state.dignity > 30 ? "bg-caution" : "bg-destructive";

  return (
    <>
      <TacticFlash tacticId={tacticFlash ?? null} onDone={() => setTacticFlash(null)} />
      <ChatShell
        header={
          <>
            <ChatHeader
              name={scenario.sender.name}
              subtitle={scenario.sender.relationship.toUpperCase()}
              isSaved={true}
              onContacts={undefined}
            />
            <div className="px-3 py-2 bg-neutral-950/80 border-b border-white/10">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/50">
                <span>DIGNITY · {scenario.sender.name.split(" ")[0]}</span>
                <span>{Math.round(state.dignity)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-500 ${dignityColor}`}
                  style={{ width: `${state.dignity}%` }}
                />
              </div>
              <div className="mt-2 flex gap-1">
                {(["chat", "toolkit"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded px-3 py-1 font-mono text-[10px] tracking-widest transition ${
                      tab === t ? "bg-primary/15 text-primary" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t === "chat"
                      ? "CHAT"
                      : `TOOLKIT · ${state.actionsUsed.length}/${scenario.actions.length}`}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={onDeliverVerdict}
                  disabled={messages.length < 2}
                  className="rounded border border-primary/50 bg-primary/10 px-2 py-1 text-[9px] font-mono tracking-widest text-primary hover:bg-primary/20 disabled:opacity-40"
                >
                  DELIVER VERDICT →
                </button>
              </div>
            </div>
          </>
        }
        composer={
          <div className="p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Reply to them…"
                className="flex-1 rounded-full border border-white/15 bg-neutral-900 px-4 py-2 text-sm text-white outline-none focus:border-primary"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="rounded-full bg-primary px-4 text-primary-foreground disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 font-mono text-[9px] tracking-widest text-white/40">
              OPEN TOOLBELT · PICK THE RIGHT TOOL FOR THIS FORMAT
            </div>
          </div>
        }
      >
        {tab === "chat" ? (
          <div ref={scroller} className="flex-1 overflow-y-auto p-3 space-y-3">
            <FormatFrame
              format={scenario.format ?? "whatsapp"}
              senderName={scenario.sender.name}
              forward={scenario.forward}
              aiGenerated={scenario.aiGenerated}
            />
            {messages.map((m, i) => (
              <FeedRow
                key={i}
                m={m}
                read={
                  m.role === "player" &&
                  (typing || messages.some((later, j) => j > i && later.role === "sender"))
                }
              />
            ))}
            {typing && (
              <div className="msg-in flex justify-start" aria-label="Typing">
                <div className="rounded-2xl rounded-bl-sm bg-neutral-800 border border-white/10 px-3 py-2">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            <Toolbelt
              scenario={scenario}
              used={state.actionsUsed}
              onUse={doAction}
              onGrade={(_kind, quality) => {
                if (quality === "strong" && scenario.tacticId && !tacticFlashed.current) {
                  tacticFlashed.current = true;
                  setTacticFlash(scenario.tacticId);
                }
              }}
            />
          </div>
        )}
      </ChatShell>
    </>
  );
}

function FeedRow({ m, read }: { m: FeedMessage; read?: boolean }) {
  if (m.role === "system") {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-xs">
        <div className="font-mono text-[10px] tracking-widest text-primary">
          {m.isAction ? "VERIFICATION" : "SYSTEM"}
        </div>
        <div className="mt-1 text-white/90">{m.text}</div>
      </div>
    );
  }
  const isPlayer = m.role === "player";
  const stamp = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`msg-in flex ${isPlayer ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex flex-col gap-0.5 ${isPlayer ? "items-end" : "items-start"}`}
        style={{ maxWidth: "80%" }}
      >
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isPlayer
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-neutral-800 border border-white/10 text-white rounded-bl-sm"
          }`}
        >
          {m.text}
        </div>
        <div className="px-1 font-mono text-[9px] tabular-nums text-white/35" aria-hidden>
          {stamp}
          {isPlayer && (
            <span className={`ml-1 ${read ? "text-primary/80" : "text-white/35"}`}>
              {read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── VERDICT ─────────── */
function VerdictScreen({
  scenario,
  state,
  verdict,
  setVerdict,
  finalReply,
  setFinalReply,
  conclusion,
  setConclusion,
  loadBearing,
  setLoadBearing,
  onConfirm,
}: {
  scenario: FeedScenario;
  state: FeedState;
  verdict: FeedVerdict | null;
  setVerdict: (v: FeedVerdict) => void;
  finalReply: string;
  setFinalReply: (s: string) => void;
  conclusion: string;
  setConclusion: (s: string) => void;
  loadBearing: string[];
  setLoadBearing: React.Dispatch<React.SetStateAction<string[]>>;
  onConfirm: () => void;
}) {
  const tone = classifyTone(finalReply);
  const toneColor =
    tone === "rude"
      ? "text-destructive"
      : tone === "respectful"
        ? "text-primary"
        : "text-muted-foreground";
  const usedActions = state.actionsUsed
    .map((id) => scenario.actions.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const [srMsg, setSrMsg] = useState("");
  function toggleLoadBearing(id: string, label: string) {
    setLoadBearing((prev) => {
      if (prev.includes(id)) {
        setSrMsg(`${label} unmarked`);
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        setSrMsg("Two marks maximum");
        const el = document.getElementById(`lb-${id}`);
        if (el) {
          el.animate(
            [
              { transform: "translateX(0)" },
              { transform: "translateX(-4px)" },
              { transform: "translateX(4px)" },
              { transform: "translateX(0)" },
            ],
            { duration: 220, easing: "ease-out" },
          );
        }
        return prev;
      }
      setSrMsg(`${label} marked as load-bearing`);
      return [...prev, id];
    });
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="font-mono text-xs tracking-[0.3em] text-caution">INVESTIGATION BOARD</div>
      <h1 className="mt-2 text-2xl font-semibold">Assemble the case. Deliver the verdict.</h1>

      <span className="sr-only" aria-live="polite" role="status">
        {srMsg}
      </span>

      <section className="mt-5 rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
          CASE FILE · AUTO-COLLECTED
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-widest text-primary mb-1.5">THE CLAIM</div>
          <p className="text-xs italic border-l-2 border-primary/40 pl-2.5">"{scenario.opener}"</p>
        </div>
        <div
          aria-description="Mark at most two evidence cards as load-bearing."
        >
          <div className="font-mono text-[10px] tracking-widest text-caution mb-1.5">
            VERIFICATION STEPS USED · {usedActions.length}/{scenario.actions.length}
          </div>
          {usedActions.length === 0 ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>No toolkit actions used — you're calling this cold.</p>
              <p>Cold calls are how MISLEADING wins.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {usedActions.map((a) => {
                const marked = loadBearing.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={`rounded-md border p-3 transition ${
                      marked ? "border-primary bg-primary/5" : "border-border bg-background/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] tracking-widest text-primary">
                          {a.label}
                        </div>
                        <p className="mt-1.5 text-xs italic border-l-2 border-primary/30 pl-2.5 text-foreground/90">
                          "{a.result}"
                        </p>
                      </div>
                      <button
                        id={`lb-${a.id}`}
                        type="button"
                        aria-pressed={marked}
                        aria-label={`Mark ${a.label} as load-bearing evidence`}
                        onClick={() => toggleLoadBearing(a.id, a.label)}
                        className={`shrink-0 inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[9px] tracking-widest transition ${
                          marked
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        <span aria-hidden>{marked ? "◆" : "◇"}</span>
                        LOAD-BEARING
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>


      <p className="mt-6 text-sm text-muted-foreground">
        MISLEADING = the core is true but the framing (photo, date, context) is not. That's the most
        common type.
      </p>

      <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground">
        Verdicts rest on evidence. Mark what's holding yours up.
      </p>


      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["TRUE", "MISLEADING", "FALSE", "UNVERIFIED"] as FeedVerdict[]).map((v) => (
          <button
            key={v}
            onClick={() => setVerdict(v)}
            className={`rounded-md border-2 p-4 font-mono text-xs tracking-widest transition ${
              verdict === v
                ? v === "TRUE"
                  ? "border-primary bg-primary/10 text-primary"
                  : v === "MISLEADING"
                    ? "border-caution bg-caution/10 text-caution"
                    : v === "UNVERIFIED"
                      ? "border-muted-foreground bg-muted/40 text-foreground"
                      : "border-destructive bg-destructive/10 text-destructive"
                : "border-border hover:border-primary/50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        UNVERIFIED = the claim can neither be confirmed nor disproved. Refusing to forward fear you
        can't check is the correct move.
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
        <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
          {conclusion.length}/300
        </div>
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
function Debrief({
  scenario,
  outcome,
  state,
  verdict,
  conclusion,
  finalReply,
  loadBearing,
}: {
  scenario: FeedScenario;
  outcome: FeedOutcome;
  state: FeedState;
  verdict: FeedVerdict | null;
  conclusion: string;
  finalReply: string;
  loadBearing: string[];
}) {

  const navigate = useNavigate();
  const [profileSnap, setProfileSnap] = useState(() => loadProfile());
  useEffect(() => {
    const on = () => setProfileSnap(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);
  const Icon =
    outcome.result === "correct"
      ? CheckCircle2
      : outcome.result === "pyrrhic"
        ? Heart
        : AlertTriangle;
  const border =
    outcome.result === "correct"
      ? "border-primary bg-primary/10 text-primary"
      : outcome.result === "pyrrhic"
        ? "border-caution bg-caution/10 text-caution"
        : "border-destructive bg-destructive/10 text-destructive";

  // 4-axis stars (each 0, 0.5, or 1) → total 0–4
  const tone = classifyTone(finalReply);
  const correctVerdict = verdict === scenario.verdict;
  const total = scenario.actions.length || 1;
  const usedRatio = state.actionsUsed.length / total;
  const starDecision = correctVerdict ? (outcome.result === "pyrrhic" ? 0.5 : 1) : 0;
  const starEvidence = usedRatio >= 0.6 ? 1 : usedRatio >= 0.3 ? 0.5 : 0;
  const starVerification =
    state.actionsUsed.length >= 2 ? 1 : state.actionsUsed.length >= 1 ? 0.5 : 0;
  const starReasoning =
    (tone === "respectful" ? 1 : tone === "neutral" ? 0.5 : 0) +
    (conclusion.trim().length >= 20 ? 0.25 : 0);
  const clampedReasoning = Math.min(1, starReasoning);
  const stars = starDecision + starEvidence + starVerification + clampedReasoning;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <div className={`rounded-xl border-2 p-6 ${border}`}>
        <Icon className="h-8 w-8 mb-3" />
        <div className="font-mono text-xs tracking-[0.3em] opacity-80">
          {outcome.result.replace("_", " ").toUpperCase()} · {outcome.points > 0 ? "+" : ""}
          {outcome.points}
        </div>
        <div className="mt-1 text-xl font-semibold">{outcome.headline}</div>
        <p className="mt-2 text-sm">{outcome.detail}</p>
        <div className="mt-3">
          <XpDeltaLine />
        </div>
      </div>

      <CalibrationQuadrant profile={profileSnap} compact caption="CALIBRATION · AFTER THIS CASE" />

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

      <BoardGraded scenario={scenario} state={state} loadBearing={loadBearing} />

      {scenario.tacticId && <TacticStamp tacticId={scenario.tacticId} />}


      {conclusion.trim() && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
            YOUR CONCLUSION
          </div>
          <p className="text-sm italic border-l-2 border-primary pl-3">"{conclusion.trim()}"</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
          WHAT'S ACTUALLY TRUE
        </div>
        <p className="text-sm">{scenario.truthNote}</p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <div className="font-mono text-xs tracking-widest text-primary mb-2">
          A REPLY THAT WOULD HAVE WORKED
        </div>
        <p className="text-sm italic">"{scenario.respectfulScript}"</p>
      </div>

      {scenario.castAfterword && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
            AT HOME, LATER — {CAST[scenario.castAfterword.who].name.toUpperCase()}
          </div>
          <p className="text-sm leading-relaxed">{scenario.castAfterword.line}</p>
          <p className="mt-2 text-xs text-muted-foreground italic">
            {CAST[scenario.castAfterword.who].relation}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Actions used</span>
        <span className="font-mono">
          {state.actionsUsed.length} / {scenario.actions.length}
        </span>
      </div>

      <RealCaseFile caseId={scenario.id} inline={scenario.inspiredBy} />

      <CitySolved
        caseId={scenario.id}
        playerResult={
          outcome.result === "correct"
            ? "correct"
            : outcome.result === "missed_fake"
              ? "missed_scam"
              : "false_alarm"
        }
      />

      {(outcome.result === "missed_fake" || outcome.result === "false_alarm") && (
        <LossBeat
          result={outcome.result === "missed_fake" ? "missed_scam" : "false_alarm"}
          tacticLabel={scenario.tacticId ? labelForTactic(scenario.tacticId as never) : null}
          seedKey={`feed:${scenario.id}`}
        />
      )}


      <NextCaseCard wing="feed" currentId={scenario.id} />

      <div className="flex gap-2">
        <button
          onClick={() => navigate({ to: "/feed" })}
          className="flex-1 rounded-md border border-border py-3 font-mono text-xs tracking-widest hover:border-primary/50"
        >
          BACK TO THE FEED
        </button>
        <button
          onClick={() => navigate({ to: "/city-hall" })}
          className="flex-1 rounded-md border border-border py-3 font-mono text-xs tracking-widest hover:border-primary/50"
        >
          VIEW CALIBRATION →
        </button>
      </div>
    </main>
  );
}

function FeedStarAxis({ label, value }: { label: string; value: number }) {
  const filled = value >= 1 ? "★" : value >= 0.5 ? "⯪" : "☆";
  const tone =
    value >= 1 ? "text-primary" : value >= 0.5 ? "text-caution" : "text-muted-foreground/40";
  return (
    <div className="rounded-md border border-border bg-background/50 p-3 text-center">
      <div className={`text-2xl ${tone}`}>{filled}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/* ─────────── THE BOARD, GRADED ─────────── */
function BoardGraded({
  scenario,
  state,
  loadBearing,
}: {
  scenario: FeedScenario;
  state: FeedState;
  loadBearing: string[];
}) {
  const used = state.actionsUsed
    .map((id) => scenario.actions.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const marked = loadBearing
    .map((id) => scenario.actions.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const anyDecisiveUsed = used.some((a) => a.decisive);
  const markedDecisive = marked.some((a) => a.decisive);
  const stillInBelt = scenario.actions.filter(
    (a) => a.decisive && !state.actionsUsed.includes(a.id),
  );

  let summary = "";
  if (used.length === 0) {
    summary = "No evidence, no board, no grade. The toolkit exists because 'it sounds off' is not a method.";
  } else if (marked.length === 0) {
    summary = "You checked, then voted from your gut anyway. Marking evidence is how you catch yourself bluffing.";
  } else if (markedDecisive) {
    summary = "Your verdict stood on the right evidence. That's the whole method.";
  } else if (anyDecisiveUsed) {
    summary = "You had the crack in the case on your board and leaned on something softer. Re-read what you skipped.";
  } else {
    summary = "Nothing you ran could settle this one. The tool that could is still in the belt.";
  }

  const unverifiedNote =
    scenario.verdict === "UNVERIFIED" && marked.length > 0
      ? "Some cases have no decisive evidence. Recognizing that IS the verdict."
      : null;

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="font-mono text-xs tracking-widest text-muted-foreground">
        THE BOARD, GRADED
      </div>
      {marked.length > 0 && (
        <ul className="space-y-1.5">
          {marked.map((a) => (
            <li key={a.id} className="text-xs">
              <span className="font-mono text-[10px] tracking-widest text-primary">{a.label}</span>
              <span className="text-muted-foreground"> — </span>
              {a.decisive ? (
                <span className="text-primary">
                  ◈ decisive — this was the crack in the case
                </span>
              ) : (
                <span className="text-muted-foreground">
                  supporting — real, but it didn't settle anything
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-foreground/90">{summary}</p>
      {unverifiedNote && (
        <p className="text-xs italic text-muted-foreground">{unverifiedNote}</p>
      )}
      {stillInBelt.length > 0 && (
        <div className="rounded-md border border-caution/40 bg-caution/5 p-4 space-y-2">
          <div className="font-mono text-[10px] tracking-widest text-caution">
            STILL IN THE BELT
          </div>
          <ul className="space-y-2">
            {stillInBelt.map((a) => (
              <li key={a.id}>
                <div className="font-mono text-[10px] tracking-widest text-caution">
                  {a.label}
                </div>
                <p className="mt-1 text-xs italic border-l-2 border-caution/40 pl-2.5 text-foreground/90">
                  "{a.result}"
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}


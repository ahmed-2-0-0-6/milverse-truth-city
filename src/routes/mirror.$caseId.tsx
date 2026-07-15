import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { getScenario, type EvidenceChip, type Scenario } from "@/lib/mirror/scenarios";
import {
  initState,
  respond,
  gradeProbe,
  type EngineState,
  type Message,
} from "@/lib/mirror/engine";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { FileText, Pin, StickyNote, Send, Phone } from "lucide-react";

export const Route = createFileRoute("/mirror/$caseId")({
  loader: ({ params }) => {
    const s = getScenario(params.caseId);
    if (!s) throw notFound();
    return { scenario: s };
  },
  component: CasePlay,
});

type Phase = "dossier" | "sim" | "verdict" | "debrief";

function CasePlay() {
  const { scenario } = Route.useLoaderData();
  const [phase, setPhase] = useState<Phase>("dossier");

  return (
    <div className="min-h-screen grain">
      <TopBar />
      {phase === "dossier" && <Dossier scenario={scenario} onStart={() => setPhase("sim")} />}
      {phase === "sim" && (
        <Simulation scenario={scenario} onCall={() => setPhase("verdict")} sharedKey={scenario.id} />
      )}
      {phase === "verdict" && (
        <Verdict scenario={scenario} onDone={() => setPhase("debrief")} />
      )}
      {phase === "debrief" && <Debrief scenario={scenario} />}
    </div>
  );
}

/* ─────────────────────────── DOSSIER ─────────────────────────── */

function Dossier({ scenario, onStart }: { scenario: Scenario; onStart: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/mirror"
        className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← CASE FILES
      </Link>

      <div className="mt-6 rounded-xl border border-caution/30 bg-caution/5 p-6">
        <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-caution">
          <FileText className="h-4 w-4" /> CASE DOSSIER · CLASSIFIED
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{scenario.title}</h1>

        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            WHO IS CONTACTING YOU
          </div>
          <p className="mt-1 text-sm">{scenario.dossier.contactClaim}</p>
        </section>

        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            WHAT YOU KNOW FOR CERTAIN
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {scenario.dossier.knownFacts.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-primary shrink-0">·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            PUBLICLY FINDABLE · CAREFUL, IMPOSTERS CAN KNOW THESE
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {scenario.dossier.publicFacts.map((f, i) => (
              <li key={i} className="flex gap-2 text-muted-foreground">
                <span className="font-mono shrink-0">·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <button
        onClick={onStart}
        className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]"
      >
        I'VE MEMORIZED IT — START
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        The dossier stays available in the NOTES tab during the chat.
      </p>
    </main>
  );
}

/* ────────────────────────── SIMULATION ───────────────────────── */

const SIM_KEY = "milverse.sim.current";

interface StoredSim {
  caseId: string;
  messages: Message[];
  state: EngineState;
  ended: boolean;
  endReason?: "contact_left" | "player_called";
}

function Simulation({
  scenario,
  onCall,
}: {
  scenario: Scenario;
  onCall: () => void;
  sharedKey: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<EngineState>(() => initState(scenario));
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pins, setPins] = useState<number[]>([]);
  const [tab, setTab] = useState<"chat" | "notes">("chat");
  const [ended, setEnded] = useState(false);
  const [endReason, setEndReason] = useState<"contact_left" | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Kick off with opener.
  useEffect(() => {
    const opener: Message = {
      role: "contact",
      text: scenario.opener,
      ts: Date.now(),
    };
    setMessages([opener]);
  }, [scenario.id]);

  // Persist for verdict/debrief phase.
  useEffect(() => {
    const stored: StoredSim = {
      caseId: scenario.id,
      messages,
      state,
      ended,
      endReason: endReason ?? undefined,
    };
    sessionStorage.setItem(SIM_KEY, JSON.stringify(stored));
  }, [messages, state, ended, endReason, scenario.id]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send() {
    const text = input.trim();
    if (!text || ended || typing) return;
    const grade = gradeProbe(scenario, text);
    const playerMsg: Message = { role: "player", text, ts: Date.now(), probeQuality: grade };
    setMessages((prev) => [...prev, playerMsg]);
    setInput("");
    setTyping(true);

    // Simulate think time (500–1400ms).
    const delay = 550 + Math.random() * 850;
    await new Promise((r) => setTimeout(r, delay));

    const next = { ...state, factProbes: { ...state.factProbes } };
    const reply = respond(scenario, next, text);
    next.internalNotes.push(reply.internalNote);

    const contactMsg: Message = {
      role: "contact",
      text: reply.text,
      ts: Date.now(),
      factId: reply.factId,
    };
    setState(next);
    setMessages((prev) => [...prev, contactMsg]);
    setTyping(false);

    // Real contact walked out?
    if (scenario.truth === "REAL" && next.meter <= 0) {
      setEnded(true);
      setEndReason("contact_left");
    }
  }

  function togglePin(idx: number) {
    setPins((prev) => {
      if (prev.includes(idx)) return prev.filter((i) => i !== idx);
      if (prev.length >= 5) return prev;
      return [...prev, idx];
    });
  }

  // Persist pins in sim too.
  useEffect(() => {
    const raw = sessionStorage.getItem(SIM_KEY);
    if (!raw) return;
    try {
      const s: StoredSim = JSON.parse(raw);
      s.state.pins = pins;
      sessionStorage.setItem(SIM_KEY, JSON.stringify(s));
    } catch {}
  }, [pins]);

  const meterColor =
    state.meterType === "composure"
      ? state.meter > 60
        ? "bg-primary"
        : state.meter > 30
          ? "bg-caution"
          : "bg-destructive"
      : state.meter > 60
        ? "bg-primary"
        : state.meter > 30
          ? "bg-caution"
          : "bg-destructive";

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 flex flex-col" style={{ minHeight: "calc(100vh - 57px)" }}>
      {/* Contact header */}
      <div className="rounded-t-xl border border-border border-b-0 bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{scenario.claimedIdentity}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              CLAIMED IDENTITY · UNVERIFIED
            </div>
          </div>
          <button
            onClick={onCall}
            disabled={messages.length < 2}
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs font-mono tracking-widest text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40"
          >
            <Phone className="inline h-3 w-3 mr-1" />
            MAKE THE CALL
          </button>
        </div>
        {/* meter */}
        <div className="mt-3">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
            <span>{state.meterType === "composure" ? "COMPOSURE" : "PATIENCE"}</span>
            <span>{Math.round(state.meter)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${meterColor}`}
              style={{ width: `${state.meter}%` }}
            />
          </div>
        </div>
        {/* tabs */}
        <div className="mt-3 flex gap-1 border-t border-border pt-2">
          {(["chat", "notes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1 font-mono text-[10px] tracking-widest transition ${
                tab === t
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "chat" ? "CHAT" : `NOTES · ${pins.length}/5`}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden border-x border-border bg-background/40">
        {tab === "chat" ? (
          <div ref={scroller} className="h-full overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                m={m}
                pinned={pins.includes(i)}
                onPin={m.role === "contact" ? () => togglePin(i) : undefined}
              />
            ))}
            {typing && <TypingBubble name={scenario.claimedIdentity} />}
            {ended && endReason === "contact_left" && (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-center text-xs font-mono tracking-widest text-destructive">
                CONTACT LEFT THE CHAT — MAKE YOUR CALL
              </div>
            )}
          </div>
        ) : (
          <NotesTab scenario={scenario} messages={messages} pins={pins} onUnpin={togglePin} />
        )}
      </div>

      {/* Composer */}
      <div className="rounded-b-xl border border-border border-t-0 bg-card p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={ended ? "Chat ended." : "Type anything you want to ask…"}
            disabled={ended || typing}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={ended || typing || !input.trim()}
            className="rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
          <span>LONG-PRESS / CLICK PIN ICON TO MARK SUSPICIOUS</span>
          <span>{messages.filter((m) => m.role === "player").length} SENT</span>
        </div>
      </div>
    </main>
  );
}

function MessageBubble({
  m,
  pinned,
  onPin,
}: {
  m: Message;
  pinned: boolean;
  onPin?: () => void;
}) {
  const isPlayer = m.role === "player";
  return (
    <div className={`msg-in flex ${isPlayer ? "justify-end" : "justify-start"} gap-2`}>
      {!isPlayer && onPin && (
        <button
          onClick={onPin}
          className={`self-end mb-1 rounded p-1 transition ${
            pinned ? "bg-caution/20 text-caution" : "text-muted-foreground hover:text-caution"
          }`}
          aria-label="Pin as suspicious"
        >
          <Pin className={`h-3.5 w-3.5 ${pinned ? "fill-current" : ""}`} />
        </button>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isPlayer
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : pinned
              ? "bg-caution/15 border border-caution/40 rounded-bl-sm"
              : "bg-card border border-border rounded-bl-sm"
        }`}
      >
        {m.text}
      </div>
    </div>
  );
}

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="msg-in flex items-center gap-2">
      <div className="rounded-2xl bg-card border border-border px-4 py-3">
        <div className="flex gap-1">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
        {name} is typing…
      </span>
    </div>
  );
}

function NotesTab({
  scenario,
  messages,
  pins,
  onUnpin,
}: {
  scenario: Scenario;
  messages: Message[];
  pins: number[];
  onUnpin: (i: number) => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <section>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-caution">
          <StickyNote className="h-3 w-3" /> DOSSIER
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{scenario.dossier.contactClaim}</p>
        <div className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          KNOWN
        </div>
        <ul className="mt-1 space-y-1 text-xs">
          {scenario.dossier.knownFacts.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary shrink-0">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          PUBLIC
        </div>
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
          {scenario.dossier.publicFacts.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-caution">
          <Pin className="h-3 w-3" /> PINNED · {pins.length}/5
        </div>
        {pins.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Pin any contact message you find suspicious — they'll show up here for
            side-by-side comparison against the dossier.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pins.map((i) => (
              <li
                key={i}
                className="rounded-md border border-caution/40 bg-caution/10 p-2 text-xs whitespace-pre-wrap"
              >
                {messages[i]?.text}
                <button
                  onClick={() => onUnpin(i)}
                  className="mt-1 block font-mono text-[9px] tracking-widest text-caution/70 hover:text-caution"
                >
                  UNPIN
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── VERDICT ─────────────────────────── */

function loadSim(): StoredSim | null {
  try {
    const raw = sessionStorage.getItem(SIM_KEY);
    return raw ? (JSON.parse(raw) as StoredSim) : null;
  } catch {
    return null;
  }
}

function Verdict({ scenario, onDone }: { scenario: Scenario; onDone: () => void }) {
  const [verdict, setVerdict] = useState<"REAL" | "FAKE" | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit() {
    if (!verdict) return;
    // Persist verdict for debrief.
    sessionStorage.setItem(
      "milverse.verdict",
      JSON.stringify({ verdict, picked }),
    );
    onDone();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="font-mono text-xs tracking-[0.3em] text-caution">MAKE THE CALL</div>
      <h1 className="mt-2 text-2xl font-semibold">Real, or imposter?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Then tag <span className="text-foreground">why</span>. Some chips are
        genuine tells for this case; some are red herrings.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setVerdict("REAL")}
          className={`rounded-xl border-2 p-6 text-center font-mono tracking-widest transition ${
            verdict === "REAL"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="text-lg">REAL</div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            This is who they claim
          </div>
        </button>
        <button
          onClick={() => setVerdict("FAKE")}
          className={`rounded-xl border-2 p-6 text-center font-mono tracking-widest transition ${
            verdict === "FAKE"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border hover:border-destructive/50"
          }`}
        >
          <div className="text-lg">FAKE</div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            This is an imposter
          </div>
        </button>
      </div>

      <div className="mt-8">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
          EVIDENCE — TAG WHAT YOU OBSERVED
        </div>
        <div className="flex flex-wrap gap-2">
          {scenario.evidenceChips.map((c: EvidenceChip) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                picked.includes(c.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!verdict}
        className="mt-8 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground disabled:opacity-40"
      >
        SUBMIT VERDICT
      </button>
    </main>
  );
}

/* ─────────────────────────── DEBRIEF ─────────────────────────── */

function Debrief({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate();
  const sim = useMemo(() => loadSim(), []);
  const verdictRaw = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("milverse.verdict");
      return raw ? (JSON.parse(raw) as { verdict: "REAL" | "FAKE"; picked: string[] }) : null;
    } catch {
      return null;
    }
  }, []);

  const result = useMemo(() => {
    if (!verdictRaw) return null;
    const truthLabel: "REAL" | "FAKE" = scenario.truth === "REAL" ? "REAL" : "FAKE";
    const correctVerdict = verdictRaw.verdict === truthLabel;

    // Evidence grading
    const correctChips = scenario.evidenceChips.filter((c) => c.correct).map((c) => c.id);
    const pickedCorrect = verdictRaw.picked.filter((id) => correctChips.includes(id)).length;
    const pickedRedHerring = verdictRaw.picked.filter((id) => !correctChips.includes(id)).length;
    const totalCorrect = correctChips.length;

    // Probe grading
    const playerMsgs = (sim?.messages ?? []).filter((m) => m.role === "player");
    const strong = playerMsgs.filter((m) => m.probeQuality === "strong").length;
    const weak = playerMsgs.filter((m) => m.probeQuality === "weak").length;
    const wasted = playerMsgs.filter((m) => m.probeQuality === "wasted").length;

    // Scoring
    let points = 0;
    let resultKind: "correct" | "missed_scam" | "false_alarm" | "lucky_guess";
    if (correctVerdict) {
      const reasoningOk = pickedCorrect >= Math.min(2, totalCorrect) && pickedRedHerring <= 1;
      if (reasoningOk) {
        points = 100 + pickedCorrect * 20 - pickedRedHerring * 10;
        resultKind = "correct";
      } else {
        points = 40;
        resultKind = "lucky_guess";
      }
    } else {
      points = -50;
      resultKind = scenario.truth === "IMPOSTER" ? "missed_scam" : "false_alarm";
    }
    points += strong * 5 - wasted * 5;

    return {
      correctVerdict,
      pickedCorrect,
      pickedRedHerring,
      totalCorrect,
      strong,
      weak,
      wasted,
      points,
      resultKind,
      truthLabel,
    };
  }, [scenario, sim, verdictRaw]);

  // Persist to profile ONCE on mount.
  const savedRef = useRef(false);
  useEffect(() => {
    if (!result || savedRef.current) return;
    savedRef.current = true;
    const p = loadProfile();
    p.casesPlayed += 1;
    p.points += result.points;
    p.strongProbesTotal += result.strong;
    p.weakProbesTotal += result.weak;
    p.wastedPressureTotal += result.wasted;
    if (result.resultKind === "correct") p.correctVerdicts += 1;
    if (result.resultKind === "lucky_guess") {
      p.correctVerdicts += 1;
      p.luckyGuesses += 1;
    }
    if (result.resultKind === "missed_scam") p.missedScams += 1;
    if (result.resultKind === "false_alarm") p.falseAlarms += 1;
    p.history.push({
      caseId: scenario.id,
      verdict: verdictRaw!.verdict,
      truth: scenario.truth,
      result: result.resultKind,
      points: result.points,
      ts: Date.now(),
    });
    saveProfile(p);
    window.dispatchEvent(new Event("milverse:profile"));
  }, [result, scenario.id, verdictRaw]);

  if (!result || !verdictRaw) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">
        No verdict recorded.{" "}
        <Link to="/mirror" className="text-primary underline">Back to case files</Link>
      </main>
    );
  }

  const verdictTone =
    result.resultKind === "correct"
      ? "text-primary border-primary/40 bg-primary/5"
      : result.resultKind === "lucky_guess"
        ? "text-caution border-caution/40 bg-caution/5"
        : "text-destructive border-destructive/40 bg-destructive/5";

  const truthHeadline =
    scenario.truth === "REAL"
      ? "This person was REAL."
      : "This was an IMPOSTER.";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className={`rounded-xl border-2 p-6 ${verdictTone}`}>
        <div className="font-mono text-xs tracking-[0.3em] opacity-80">DEBRIEF</div>
        <h1 className="mt-2 text-2xl font-semibold">{truthHeadline}</h1>
        <p className="mt-1 text-sm opacity-90">
          You said <b>{verdictRaw.verdict}</b> · Result:{" "}
          <b>{result.resultKind.replace("_", " ").toUpperCase()}</b>
        </p>
        <div className="mt-3 font-mono text-2xl">
          {result.points >= 0 ? "+" : ""}
          {result.points} pts
        </div>
      </div>

      {/* Evidence breakdown */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
          YOUR EVIDENCE · {result.pickedCorrect} genuine, {result.pickedRedHerring} red herring
        </div>
        <ul className="space-y-2">
          {scenario.evidenceChips.map((c) => {
            const picked = verdictRaw.picked.includes(c.id);
            if (!picked && !c.correct) return null;
            const tone = c.correct
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-destructive/40 bg-destructive/5 text-destructive";
            return (
              <li key={c.id} className={`rounded-md border p-2.5 ${picked ? tone : "border-border/60 opacity-60"}`}>
                <div className="text-xs font-semibold">
                  {picked ? (c.correct ? "✓ " : "✗ ") : "· "}
                  {c.label}
                </div>
                <div className="mt-1 text-[11px] opacity-80">{c.explain}</div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Probe quality */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
          YOUR QUESTIONS
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <ProbeStat n={result.strong} label="STRONG" tone="good" />
          <ProbeStat n={result.weak} label="WEAK" tone="warn" />
          <ProbeStat n={result.wasted} label="WASTED" tone="bad" />
        </div>
        <ul className="space-y-1.5">
          {(sim?.messages ?? [])
            .filter((m) => m.role === "player")
            .map((m, i) => {
              const c =
                m.probeQuality === "strong"
                  ? "border-l-primary text-foreground"
                  : m.probeQuality === "wasted"
                    ? "border-l-destructive text-muted-foreground"
                    : "border-l-caution text-muted-foreground";
              return (
                <li key={i} className={`border-l-2 pl-3 py-1 text-xs ${c}`}>
                  <span className="font-mono text-[10px] tracking-widest opacity-70 mr-2">
                    {(m.probeQuality || "weak").toUpperCase()}
                  </span>
                  {m.text}
                </li>
              );
            })}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          A good question is one a liar <b>cannot</b> answer safely. You asked{" "}
          <span className="text-primary font-mono">{result.strong}</span> strong probe
          {result.strong === 1 ? "" : "s"}.
        </p>
      </section>

      {/* PAUSE framework */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
          PAUSE · HOW TO READ THIS CASE
        </div>
        <PauseRow letter="P" title="Pressure" body={pauseText(scenario, "P")} />
        <PauseRow letter="A" title="Ask an expert / call back" body={pauseText(scenario, "A")} />
        <PauseRow letter="U" title="Unverified claims" body={pauseText(scenario, "U")} />
        <PauseRow letter="S" title="Story / emotion" body={pauseText(scenario, "S")} />
        <PauseRow letter="E" title="Evidence" body={pauseText(scenario, "E")} />
      </section>

      <div className="flex gap-3">
        <Link
          to="/mirror"
          className="flex-1 rounded-md border border-border py-3 text-center font-mono text-xs tracking-widest hover:bg-accent"
        >
          MORE CASES
        </Link>
        <button
          onClick={() => navigate({ to: "/city-hall" })}
          className="flex-1 rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
        >
          VIEW CALIBRATION
        </button>
      </div>
    </main>
  );
}

function ProbeStat({ n, label, tone }: { n: number; label: string; tone: "good" | "warn" | "bad" }) {
  const c =
    tone === "good"
      ? "text-primary border-primary/40 bg-primary/10"
      : tone === "warn"
        ? "text-caution border-caution/40 bg-caution/10"
        : "text-destructive border-destructive/40 bg-destructive/10";
  return (
    <div className={`rounded-md border p-3 ${c}`}>
      <div className="text-2xl font-mono">{n}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest opacity-80">{label}</div>
    </div>
  );
}

function PauseRow({ letter, title, body }: { letter: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border/50 last:border-b-0">
      <div className="h-7 w-7 shrink-0 rounded bg-primary/15 text-primary font-mono flex items-center justify-center text-sm">
        {letter}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
      </div>
    </div>
  );
}

function pauseText(s: Scenario, k: "P" | "A" | "U" | "S" | "E"): string {
  if (s.truth === "REAL") {
    return {
      P: "There was no time pressure — that's the signature of a real conversation.",
      A: "You could have called them back on a known number to fully confirm. Verification isn't rude.",
      U: "Nothing they claimed contradicted the dossier — every fact checked out.",
      S: "The emotional tone was casual, not manufactured. No manipulation of feeling.",
      E: "Evidence pointed to REAL. Accusing them costs the relationship — that's a False Alarm.",
    }[k];
  }
  return {
    P: "Look for manufactured urgency — countdowns, deadlines, \"before EOD.\" That's the lever.",
    A: "They resisted every attempt to move out-of-band. A real contact welcomes verification.",
    U: "Claims that couldn't be checked (\"reverse OTP,\" \"temp SIM\"). Made-up policy is a red flag.",
    S: "Emotional escalation, appeals to authority, or guilt. The story is a tool, not a fact.",
    E: "The dossier is your ground truth. A contradicted fact = a catchable lie.",
  }[k];
}

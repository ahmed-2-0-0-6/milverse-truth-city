import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { VoiceNote } from "@/components/VoiceNote";
import { getScenario, type EvidenceChip, type Scenario } from "@/lib/mirror/scenarios";
import {
  initState,
  respond,
  gradeProbe,
  idleNudge,
  verifyOutOfBand,
  VOB_METHODS,
  type EngineState,
  type Message,
  type VobMethod,
} from "@/lib/mirror/engine";
import { generateContactReply } from "@/lib/mirror/ai.functions";
import { ARTIFACT_LABEL } from "@/lib/mirror/voice";
import { fakeNumberForCase } from "@/lib/chat/fakeNumber";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { computeXp } from "@/lib/ranks";
import { loadUnlocked } from "@/lib/manual/state";
import { writeXpDelta } from "@/lib/rank/xpSnapshot";
import { XpDeltaLine } from "@/components/rank/XpDeltaLine";
import { checkAndAwardBadges } from "@/lib/mirror/badges";
import { logPilotEntry } from "@/lib/pilot";
import { track } from "@/lib/telemetry";
import { tick, tensionCue } from "@/lib/mirror/audio";
import { FileText, Pin, StickyNote, Send, Phone, ShieldCheck, X, Timer } from "lucide-react";
import { RealCaseFile } from "@/components/RealCaseFile";
import { NextCaseCard } from "@/components/NextCaseCard";
import { RookieIntro } from "@/components/handler/RookieIntro";
import { SendOff } from "@/components/handler/SendOff";
import { LossBeat } from "@/components/handler/LossBeat";
import { VerdictMoment, type CalibrationOutcome } from "@/components/VerdictMoment";
import { TacticStamp } from "@/components/TacticStamp";
import { CalibrationQuadrant } from "@/components/CalibrationQuadrant";
import { CitySolved } from "@/components/CitySolved";
import { TacticFlash } from "@/components/TacticFlash";
import { tacticForMirror } from "@/lib/mirror/tactics";
import { labelForTactic } from "@/lib/handler/profile";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { skinForCase, receiptFor, type ChatSkin } from "@/lib/chat/skins";
import { ContactsSheet } from "@/components/chat/ContactsSheet";
import { useJuniorGate } from "@/components/firstPhone/JuniorGate";
import { clockFor } from "@/lib/mirror/clocks";
import { ClockChip } from "@/components/mirror/ClockChip";
import { pendingRetestForCase, scheduleRetest, resolveRetest, type RetestResolution } from "@/lib/mirror/retests";
import { bandFor } from "@/lib/mirror/meterBands";
import { MeterNote } from "@/components/chat/MeterNote";

import { CONVICTION_CHIPS, computeConviction, debriefLineFor } from "@/lib/mirror/conviction";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";
import { aftermathFor } from "@/lib/mirror/aftermath";
import { saveTape } from "@/lib/mirror/tapes";
import { TapeReview } from "@/components/mirror/TapeReview";
import { factRefsFor, findRef, GUT_REF, type FactRef } from "@/lib/mirror/factRefs";
import {
  loadSeen as loadCraftSeen,
  markSeen as markCraftSeen,
  whyFor as craftWhyFor,
  type Grade as CraftGrade,
} from "@/lib/mirror/craftMarks";
import { CraftMark } from "@/components/mirror/CraftMark";

export const Route = createFileRoute("/mirror/$caseId")({
  loader: ({ params }) => {
    const s = getScenario(params.caseId);
    if (!s) throw notFound();
    return { scenario: s };
  },
  component: function MirrorCaseGuarded() {
    const gate = useJuniorGate("The Mirror");
    return gate ?? <CasePlay />;
  },
});

type Phase = "dossier" | "sim" | "verdict" | "reveal" | "debrief";

function CasePlay() {
  const { scenario } = Route.useLoaderData();
  const [phase, setPhase] = useState<Phase>("dossier");

  // In the "sim" phase, ChatShell owns the whole viewport (phone frame).
  // Every other phase keeps the normal MILVERSE app chrome.
  if (phase === "sim") {
    return <Simulation scenario={scenario} onEnd={() => setPhase("verdict")} />;
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <RookieIntro />
      </div>
      {phase === "dossier" && <Dossier scenario={scenario} onStart={() => setPhase("sim")} />}
      {phase === "verdict" && <Verdict scenario={scenario} onDone={() => setPhase("reveal")} />}
      {phase === "reveal" && (
        <VerdictReveal scenario={scenario} onDone={() => setPhase("debrief")} />
      )}
      {phase === "debrief" && <Debrief scenario={scenario} />}
    </div>
  );
}

function VerdictReveal({ scenario, onDone }: { scenario: Scenario; onDone: () => void }) {
  const raw = useMemo(() => {
    try {
      const s = sessionStorage.getItem(VERDICT_KEY);
      return s ? (JSON.parse(s) as { verdict: "REAL" | "FAKE" }) : null;
    } catch {
      return null;
    }
  }, []);
  const truthLabel: "REAL" | "FAKE" = scenario.truth === "REAL" ? "REAL" : "FAKE";
  const correct = raw?.verdict === truthLabel;
  const outcome: CalibrationOutcome = correct
    ? "correct"
    : scenario.truth === "IMPOSTER"
      ? "missed_scam"
      : "false_alarm";
  return (
    <VerdictMoment
      caseTitle={scenario.title || `Case ${scenario.id}`}
      caseId={scenario.id}
      stampLabel={raw?.verdict ?? "UNVERIFIED"}
      outcome={outcome}
      onDone={onDone}
      register={scenario.isSurvivorStory ? "quiet" : "standard"}
    />
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
          <FileText className="h-4 w-4" /> CASE DOSSIER · TIER {scenario.tier}
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{scenario.title}</h1>

        {/* THE CLAIM — bordered claim card. */}
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            WHO IS CONTACTING YOU
          </div>
          <div className="relative mt-2 rounded-md border border-border bg-background/50 p-4">
            <span className="absolute right-2 top-1.5 font-mono text-[9px] tracking-[0.3em] text-caution">
              THE CLAIM
            </span>
            <p className="text-sm leading-relaxed">{scenario.dossier.contactClaim}</p>
          </div>
        </section>

        {/* KNOWN — numbered reference cards (K1..). */}
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            WHAT YOU KNOW FOR CERTAIN — ONLY YOU AND THE REAL ONE
          </div>
          <ul className="mt-2 space-y-1.5">
            {scenario.dossier.knownFacts.map((f, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md border border-primary/30 bg-primary/5 p-2.5"
              >
                <span className="shrink-0 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-primary">
                  K{i + 1}
                </span>
                <span className="text-sm leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* PUBLIC — numbered reference cards (P1..). */}
        <section className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
            PUBLICLY FINDABLE — AMMUNITION FOR IMPOSTERS
          </div>
          <div className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground/80">
            If they only ever prove these, they've proven nothing.
          </div>
          <ul className="mt-2 space-y-1.5">
            {scenario.dossier.publicFacts.map((f, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md border border-border bg-muted/20 p-2.5"
              >
                <span className="shrink-0 rounded-sm border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground">
                  P{i + 1}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <SendOff />

      <button
        onClick={onStart}
        className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]"
      >
        I'VE MEMORIZED IT — START
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        The brief rides along in NOTES. Pin what smells wrong and tag which fact it breaks.
      </p>
    </main>
  );
}


/* ────────────────────────── SIMULATION ───────────────────────── */

const SIM_KEY = "milverse.sim.current";
const VERDICT_KEY = "milverse.verdict";

interface StoredSim {
  caseId: string;
  messages: Message[];
  state: EngineState;
  ended: boolean;
  endReason?: "contact_left" | "vob_used";
  vobArtifact?: string | null;
  /** Message index → fact ref ("K2", "P1", "GUT"). Presentation-only. */
  pinTags?: Record<number, string>;
}

function Simulation({ scenario, onEnd }: { scenario: Scenario; onEnd: () => void }) {
  const skin = skinForCase(scenario.id);
  const refs = useMemo(() => factRefsFor(scenario), [scenario]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<EngineState>(() => initState(scenario));
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pins, setPins] = useState<number[]>([]);
  const [pinTags, setPinTags] = useState<Record<number, string>>({});
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "notes">("chat");
  const [ended, setEnded] = useState(false);
  const [endReason, setEndReason] = useState<"contact_left" | "vob_used" | null>(null);
  const [showVob, setShowVob] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const lastActivity = useRef<number>(Date.now());
  const nudged = useRef<boolean>(false);
  const criticalCued = useRef<boolean>(false);
  const prevMeter = useRef<number>(state.meter);
  const aiFailCount = useRef<number>(0);
  const [aiDown, setAiDown] = useState(false);
  const tacticFlashed = useRef<boolean>(false);
  const [tacticFlash, setTacticFlash] = useState<null | ReturnType<typeof tacticForMirror>>(null);
  const [contactsOpen, setContactsOpen] = useState(false);
  const claimedClock = useMemo(() => clockFor(scenario.id), [scenario.id]);
  const clockExpiredRef = useRef(false);
  function handleClockExpire() {
    if (clockExpiredRef.current || !claimedClock) return;
    clockExpiredRef.current = true;
    // UI-level appended row. role="system" is already excluded from the
    // player SENT counter and from contact-based read-receipt logic — do
    // NOT route through the engine or mutate EngineState.
    setMessages((prev) => [
      ...prev,
      { role: "system", kind: "system", text: claimedClock.expiredLine, ts: Date.now() },
    ]);
  }

  useEffect(() => {
    const opener: Message = {
      role: "contact",
      kind: "text",
      text: scenario.opener,
      ts: Date.now(),
    };
    setMessages([opener]);
  }, [scenario.id]);

  // Persist for verdict/debrief.
  useEffect(() => {
    const stored: StoredSim = {
      caseId: scenario.id,
      messages,
      state: { ...state, pins },
      ended,
      endReason: endReason ?? undefined,
      pinTags,
    };
    sessionStorage.setItem(SIM_KEY, JSON.stringify(stored));
  }, [messages, state, pins, pinTags, ended, endReason, scenario.id]);

  // Rehydrate pinTags if the player reloaded mid-case.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIM_KEY);
      if (!raw) return;
      const prior = JSON.parse(raw) as StoredSim;
      if (prior.caseId === scenario.id && prior.pinTags) setPinTags(prior.pinTags);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  // Escape closes the quick-brief strip.
  useEffect(() => {
    if (!openRef) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRef(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openRef]);


  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Sound design: tick on meter change; tension cue when critical (<30).
  const [meterDelta, setMeterDelta] = useState<number | null>(null);
  const [sendTick, setSendTick] = useState(0);
  const showBandOnMount = useRef(
    typeof window !== "undefined" && !localStorage.getItem("milverse.mirror.bandSeen"),
  ).current;
  useEffect(() => {
    if (showBandOnMount && typeof window !== "undefined") {
      localStorage.setItem("milverse.mirror.bandSeen", "1");
    }
  }, [showBandOnMount]);

  // Craft Marks — per-profile snapshot of grades that have auto-explained.
  // Snapshotted on mount so mid-case flips don't retrigger.
  const craftSeenRef = useRef<CraftGrade[]>([]);
  useEffect(() => {
    craftSeenRef.current = loadCraftSeen();
  }, []);
  const [openMarkIdx, setOpenMarkIdx] = useState<number | null>(null);
  const wastedCaseKey = `milverse.craftmarks.wasted:${scenario.id}`;
  const wastedFiredThisCase = () =>
    typeof window !== "undefined" && window.sessionStorage.getItem(wastedCaseKey) === "1";
  const markWastedFired = () => {
    if (typeof window !== "undefined") window.sessionStorage.setItem(wastedCaseKey, "1");
  };

  // First-occurrence indices per grade among player messages whose reply has landed.
  const firstOfGrade = useMemo(() => {
    const out: Record<CraftGrade, number | undefined> = { strong: undefined, weak: undefined, wasted: undefined };
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role !== "player" || !m.probeQuality) continue;
      const g = m.probeQuality as CraftGrade;
      const hasReply = messages.some((later, j) => j > i && later.role === "contact");
      if (!hasReply) continue;
      if (out[g] === undefined) out[g] = i;
    }
    return out;
  }, [messages]);

  // Persist first-of-grade sightings so this profile only auto-explains once.
  useEffect(() => {
    (["strong", "weak", "wasted"] as CraftGrade[]).forEach((g) => {
      if (firstOfGrade[g] !== undefined && !craftSeenRef.current.includes(g)) {
        markCraftSeen(g);
        craftSeenRef.current = [...craftSeenRef.current, g];
      }
    });
  }, [firstOfGrade]);


  const currentBand = bandFor(state.meter);

  useEffect(() => {
    let t: number | undefined;
    if (state.meter !== prevMeter.current) {
      tick();
      const d = Math.round(state.meter - prevMeter.current);
      if (d !== 0) {
        setMeterDelta(d);
        t = window.setTimeout(() => setMeterDelta(null), 1400);
      }
      prevMeter.current = state.meter;
    }
    if (state.meter < 30 && !criticalCued.current) {
      criticalCued.current = true;
      tensionCue();
    } else if (state.meter >= 50) {
      criticalCued.current = false;
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [state.meter]);

  // Case timer (Tier 3+): after 25s idle, contact nudges.
  useEffect(() => {
    if (scenario.tier < 3 || ended) return;
    const interval = setInterval(() => {
      if (ended || typing) return;
      const idle = (Date.now() - lastActivity.current) / 1000;
      if (idle >= 25 && !nudged.current) {
        nudged.current = true;
        const next = { ...state, factProbes: { ...state.factProbes } };
        const reply = idleNudge(scenario, next);
        if (reply) {
          setState(next);
          setMessages((prev) => [
            ...prev,
            { role: "contact", kind: "text", text: reply.text, ts: Date.now() },
          ]);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [scenario, state, ended, typing]);

  const aiReply = useServerFn(generateContactReply);

  async function send() {
    const text = input.trim();
    if (!text || ended || typing) return;
    lastActivity.current = Date.now();
    nudged.current = false;
    const grade = gradeProbe(scenario, text);
    const playerMsg: Message = {
      role: "player",
      kind: "text",
      text,
      ts: Date.now(),
      probeQuality: grade,
    };
    setMessages((prev) => [...prev, playerMsg]);
    setSendTick((t) => t + 1);

    setInput("");
    setTyping(true);
    if (grade === "strong" && !tacticFlashed.current) {
      tacticFlashed.current = true;
      setTacticFlash(tacticForMirror(scenario.id));
    }

    const next = { ...state, factProbes: { ...state.factProbes } };
    const reply = respond(scenario, next, text);
    next.internalNotes.push(reply.internalNote);

    // Try AI (with one silent retry + in-fiction cover) — fall back to deterministic on repeated failure.
    let replyText = reply.text;
    if (!reply.voice && reply.intent !== "left") {
      const fact = reply.factId ? scenario.facts.find((f) => f.id === reply.factId) : undefined;
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "player" | "contact", text: m.text }));
      const aiPayload = {
        scenarioTitle: scenario.title,
        tier: scenario.tier,
        truth: scenario.truth,
        claimedIdentity: scenario.claimedIdentity,
        personaVoice: scenario.persona.voice,
        personaFillers: scenario.persona.fillers,
        personaUrgencyLines: scenario.persona.urgencyLines,
        personaPushLines: scenario.persona.pushLines,
        opener: scenario.opener,
        teaser: scenario.teaser,
        agenda: scenario.agenda,
        contactClaim: scenario.dossier.contactClaim,
        knownFacts: scenario.dossier.knownFacts,
        publicFacts: scenario.dossier.publicFacts,
        factTruth: fact?.truth ?? null,
        factKnownToImposter: fact ? !!fact.isKnownToImposter : null,
        isDeflection: reply.intent === "deflection",
        isContradiction: reply.intent === "contradiction",
        isPush: reply.intent === "push",
        isUrgency: reply.intent === "escalation",
        meter: reply.meter,
        meterType: reply.meterType,
        turnCount: next.turnCount,
        history,
        playerMessage: text,
        fallback: reply.text,
      };
      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        try {
          const ai = await aiReply({ data: aiPayload });
          if (ai?.text && ai.source === "ai") {
            replyText = ai.text;
            aiFailCount.current = 0;
            ok = true;
          } else if (ai?.text) {
            // gateway fell back — treat as failure for retry accounting
            replyText = ai.text;
            ok = true;
          }
        } catch (e) {
          console.error("[mirror] ai reply attempt failed:", attempt, e);
          if (attempt === 0) {
            // In-fiction cover message: send a small placeholder before retry
            setMessages((prev) => [
              ...prev,
              { role: "contact", kind: "text", text: "signal issue, one sec", ts: Date.now() },
            ]);
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      }
      if (!ok) {
        aiFailCount.current += 1;
        if (aiFailCount.current >= 3) setAiDown(true);
      }
    }

    const contactMsg: Message = {
      role: "contact",
      kind: reply.voice ? "voice" : "text",
      text: replyText,
      ts: Date.now(),
      factId: reply.factId,
      isTell: reply.isTell,
      tellExplanation: reply.tellExplanation,
      voice: reply.voice,
    };
    setState(next);
    setMessages((prev) => [...prev, contactMsg]);
    setTyping(false);

    if (scenario.truth === "REAL" && next.meter <= 0) {
      setEnded(true);
      setEndReason("contact_left");
    }
  }

  function togglePin(idx: number) {
    setPins((prev) => {
      if (prev.includes(idx)) {
        setPinTags((tags) => {
          if (!(idx in tags)) return tags;
          const next = { ...tags };
          delete next[idx];
          return next;
        });
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= 5) return prev;
      return [...prev, idx];
    });
  }

  function setPinTag(idx: number, ref: string) {
    setPinTags((prev) => ({ ...prev, [idx]: ref }));
  }

  function useVob(method: VobMethod) {
    const next = { ...state, factProbes: { ...state.factProbes } };
    const result = verifyOutOfBand(scenario, method, next);
    setState(next);
    setMessages((prev) => [
      ...prev,
      { role: "system", kind: "system", text: result.message, ts: Date.now() },
    ]);
    setShowVob(false);
    setEnded(true);
    setEndReason("vob_used");
  }

  const meterColor =
    state.meter > 60 ? "bg-primary" : state.meter > 30 ? "bg-caution" : "bg-destructive";

  return (
    <>
      <TacticFlash tacticId={tacticFlash} onDone={() => setTacticFlash(null)} />
      <ChatShell
        header={
          <>
            <ChatHeader
              name={scenario.claimedIdentity}
              number={fakeNumberForCase(scenario.id)}
              isSaved={false}
              subtitle={
                skin.presenceLine ??
                `CLAIMED · TIER ${scenario.tier}${scenario.tier >= 3 ? " · TIMED" : ""}`
              }
              chrome={skin.headerClass}
              avatarRing={skin.avatarRing}
              presenceDot={skin.id === "instagram"}
              onContacts={() => setContactsOpen(true)}
            />
            {/* meter + tabs */}
            <div className="px-3 py-2 bg-neutral-950/80 border-b border-white/10 relative">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/50">
                <span
                  className={state.meter <= 30 ? "text-destructive hud-blink" : ""}
                  aria-label={`The Line, ${currentBand.label}, ${Math.round(state.meter)}`}
                >
                  THE LINE · {currentBand.label}
                </span>

                <span className="flex items-center gap-1.5 tabular-nums">
                  {meterDelta !== null && (
                    <span
                      key={meterDelta}
                      className={`msg-in font-bold ${meterDelta < 0 ? "text-destructive" : "text-primary"}`}
                      aria-hidden
                    >
                      {meterDelta > 0 ? `+${meterDelta}` : meterDelta}
                    </span>
                  )}
                  {Math.round(state.meter)}
                  {claimedClock && (
                    <ClockChip clock={claimedClock} onExpire={handleClockExpire} />
                  )}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-500 ${meterColor} ${state.meter <= 30 ? "animate-pulse" : ""}`}
                  style={{
                    width: `${state.meter}%`,
                    boxShadow: state.meter <= 30 ? "0 0 10px oklch(0.55 0.2 25 / 0.8)" : undefined,
                  }}
                />
              </div>
              <MeterNote
                bandKey={currentBand.key}
                label={currentBand.label}
                note={currentBand.note}
                sendTick={sendTick}
                showOnMount={showBandOnMount}
              />

              <div className="mt-2 flex gap-1">
                {(["chat", "notes"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded px-3 py-1 font-mono text-[10px] tracking-widest transition ${
                      tab === t ? "bg-primary/15 text-primary" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t === "chat" ? "CHAT" : `NOTES · ${pins.length}/5`}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={() => setShowVob(true)}
                  disabled={ended || messages.length < 2}
                  className="rounded border border-primary/50 bg-primary/10 px-2 py-1 text-[9px] font-mono tracking-widest text-primary hover:bg-primary/20 disabled:opacity-40"
                >
                  <ShieldCheck className="inline h-3 w-3 mr-1" /> VERIFY
                </button>
                <button
                  onClick={onEnd}
                  disabled={messages.length < 2}
                  className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-[9px] font-mono tracking-widest text-destructive hover:bg-destructive/20 disabled:opacity-40"
                >
                  <Phone className="inline h-3 w-3 mr-1" /> CALL IT
                </button>
              </div>
            </div>
          </>
        }
        overlay={
          <>
            <ContactsSheet
              open={contactsOpen}
              onClose={() => setContactsOpen(false)}
              mirrorNoHelp={true}
            />
            {showVob && (
              <VobModal onClose={() => setShowVob(false)} onPick={useVob} tier={scenario.tier} />
            )}
          </>
        }
        composer={
          <div className="p-3">
            {aiDown && (
              <div className="mb-2 rounded-md border border-caution/40 bg-caution/10 p-2 text-[11px]">
                <div className="font-mono text-[10px] tracking-widest text-caution mb-0.5">
                  CONNECTION UNSTABLE
                </div>
                The contact keeps freezing.{" "}
                <Link to="/quick-tour" className="text-primary underline">
                  Quick Tour →
                </Link>
              </div>
            )}
            {tab === "chat" && (
              <QuickBrief refs={refs} openRef={openRef} onToggle={(r) => setOpenRef((cur) => (cur === r ? null : r))} />
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={ended ? "Chat ended — make your call." : skin.placeholder}
                disabled={ended || typing}
                className="flex-1 rounded-full border border-white/15 bg-neutral-900 px-4 py-2 text-sm text-white outline-none focus:border-primary disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={ended || typing || !input.trim()}
                className="rounded-full bg-primary px-4 text-primary-foreground disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] tracking-widest text-white/40">
              <span>ASK FOR A "VOICE NOTE" · TAP PIN TO FLAG</span>
              <span>{messages.filter((m) => m.role === "player").length} SENT</span>
            </div>
          </div>
        }
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {tab === "chat" ? (
            <div
              ref={scroller}
              className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${skin.bodyClass}`}
              style={skin.bodyStyle}
            >
              {skin.systemNote && (
                <div className="flex justify-center">
                  <div className="max-w-[85%] rounded-md bg-black/40 border border-white/10 px-3 py-1.5 text-center text-[10px] leading-relaxed text-amber-200/80">
                    🔒 {skin.systemNote}
                  </div>
                </div>
              )}
              {messages.map((m, i) => {
                const hasReply = messages.some((later, j) => j > i && later.role === "contact");
                const grade = m.role === "player" ? (m.probeQuality as CraftGrade | undefined) : undefined;
                let autoOpen = false;
                if (grade && hasReply) {
                  const isFirstOfGrade = firstOfGrade[grade] === i;
                  if (grade === "wasted") {
                    if (isFirstOfGrade && !wastedFiredThisCase()) {
                      autoOpen = true;
                      markWastedFired();
                    } else if (isFirstOfGrade && !craftSeenRef.current.includes(grade)) {
                      autoOpen = true;
                    }
                  } else if (isFirstOfGrade && !craftSeenRef.current.includes(grade)) {
                    autoOpen = true;
                  }
                }
                return (
                  <MessageRow
                    key={i}
                    m={m}
                    pinned={pins.includes(i)}
                    onPin={m.role === "contact" ? () => togglePin(i) : undefined}
                    speakerName={scenario.claimedIdentity}
                    speakerVoiceDesc={scenario.persona.voice}
                    read={typing || hasReply}
                    skin={skin}
                    hasReply={hasReply}
                    grade={grade}
                    why={grade ? craftWhyFor(scenario, m.text, grade) : undefined}
                    markOpen={openMarkIdx === i}
                    autoOpenMark={autoOpen}
                    onOpenMark={() => setOpenMarkIdx(i)}
                    onCloseMark={() => setOpenMarkIdx((cur) => (cur === i ? null : cur))}
                  />
                );
              })}

              {typing && <TypingBubble name={scenario.claimedIdentity} skin={skin} />}
              {ended && endReason === "contact_left" && (
                <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-center text-xs font-mono tracking-widest text-destructive">
                  CONTACT LEFT THE CHAT — MAKE YOUR CALL
                </div>
              )}
              {ended && endReason === "vob_used" && (
                <div className="mt-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-center text-xs font-mono tracking-widest text-primary">
                  VERIFICATION COMPLETE — MAKE YOUR CALL
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <NotesTab
                scenario={scenario}
                messages={messages}
                pins={pins}
                pinTags={pinTags}
                refs={refs}
                onUnpin={togglePin}
                onTag={setPinTag}
              />
            </div>
          )}
        </div>
      </ChatShell>
    </>
  );
}

function MessageRow({
  m,
  pinned,
  onPin,
  speakerName,
  speakerVoiceDesc,
  read,
  skin,
  hasReply,
  grade,
  why,
  markOpen,
  autoOpenMark,
  onOpenMark,
  onCloseMark,
}: {
  m: Message;
  pinned: boolean;
  onPin?: () => void;
  speakerName?: string;
  speakerVoiceDesc?: string;
  /** Player bubbles: has the contact "seen" this yet (replied or typing)? */
  read?: boolean;
  skin: ChatSkin;
  /** True when a later contact message exists — gates craft marks. */
  hasReply?: boolean;
  grade?: CraftGrade;
  why?: string;
  markOpen?: boolean;
  autoOpenMark?: boolean;
  onOpenMark?: () => void;
  onCloseMark?: () => void;
}) {
  if (m.role === "system") {
    return (
      <div className="msg-in flex justify-center">
        <div className="max-w-[90%] rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-primary">
          <Timer className="inline h-3 w-3 mr-1" />
          {m.text}
        </div>
      </div>
    );
  }

  const isPlayer = m.role === "player";
  const showMark = isPlayer && !!grade && !!hasReply && !!why && !!onOpenMark && !!onCloseMark;
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

      {m.kind === "voice" && m.voice ? (
        <div className="flex flex-col gap-1">
          {m.text && (
            <div
              className={`max-w-[80%] px-3 py-1.5 text-xs italic shadow-sm ${
                isPlayer ? skin.outBubble : `${skin.inBubble} text-white/80`
              }`}
            >
              {m.text}
            </div>
          )}
          <VoiceNote
            voice={m.voice}
            fromPlayer={isPlayer}
            speakerName={speakerName}
            speakerVoiceDesc={speakerVoiceDesc}
          />
        </div>
      ) : (
        <div className="flex flex-col items-end gap-0.5" style={{ maxWidth: "80%" }}>
          <div
            className={`px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm ${
              isPlayer
                ? skin.outBubble
                : pinned
                  ? "bg-caution/20 border border-caution/50 text-white rounded-lg rounded-tl-none"
                  : skin.inBubble
            }`}
          >
            {m.text}
          </div>
          <MessageMeta ts={m.ts} isPlayer={isPlayer} read={!!read} skin={skin} />
          {showMark && (
            <CraftMark
              grade={grade!}
              why={why!}
              open={!!markOpen}
              onOpen={onOpenMark!}
              onClose={onCloseMark!}
              autoOpen={!!autoOpenMark}
            />
          )}
        </div>
      )}
    </div>
  );
}


/** Under-bubble meta line, rendered per the platform skin's receipt language. */
function MessageMeta({
  ts,
  isPlayer,
  read,
  skin,
}: {
  ts: number;
  isPlayer: boolean;
  read: boolean;
  skin: ChatSkin;
}) {
  const stamp = new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const r = receiptFor(skin, read, stamp);
  return (
    <div
      className={`flex items-center gap-1 px-1 font-mono text-[9px] text-white/35 ${isPlayer ? "" : "self-start"}`}
      aria-hidden
    >
      {isPlayer && !r.showTicks ? (
        <span className={read ? skin.readColor : "text-white/35"}>{r.text}</span>
      ) : (
        <span>{stamp}</span>
      )}
      {isPlayer && r.showTicks && (
        <span className={read ? skin.readColor : "text-white/35"}>{read ? "✓✓" : "✓"}</span>
      )}
    </div>
  );
}

function TypingBubble({ name, skin }: { name: string; skin: ChatSkin }) {
  return (
    <div className="msg-in flex items-center gap-2">
      <div className={`px-4 py-3 shadow-sm ${skin.inBubble}`}>
        <div className="flex gap-1">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/50" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/50" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/50" />
        </div>
      </div>
      <span className="font-mono text-[10px] text-white/50 tracking-widest">{name} is typing…</span>
    </div>
  );
}

function VobModal({
  onClose,
  onPick,
  tier,
}: {
  onClose: () => void;
  onPick: (m: VobMethod) => void;
  tier: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-primary">
              VERIFY ANOTHER WAY
            </div>
            <h2 className="mt-1 text-lg font-semibold">Out-of-band verification</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          The oldest, most reliable defence.{" "}
          {tier <= 3
            ? "Small point fee at this tier — but a real contact won't mind if you're polite."
            : "At this tier, in-band tells are unreliable. This is often the only winning move."}
        </p>
        <ul className="space-y-2">
          {VOB_METHODS.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => onPick(m.id)}
                className="w-full text-left rounded-md border border-border p-3 transition hover:border-primary/50 hover:bg-accent"
              >
                <div className="text-sm font-semibold">{m.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.blurb}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NotesTab({
  scenario,
  messages,
  pins,
  pinTags,
  refs,
  onUnpin,
  onTag,
}: {
  scenario: Scenario;
  messages: Message[];
  pins: number[];
  pinTags: Record<number, string>;
  refs: FactRef[];
  onUnpin: (i: number) => void;
  onTag: (i: number, ref: string) => void;
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
              <span className="shrink-0 font-mono text-primary">K{i + 1}</span>
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
              <span className="shrink-0 font-mono">P{i + 1}</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {(() => {
        const s = messages.filter((m) => m.role === "player" && m.probeQuality === "strong").length;
        const w = messages.filter((m) => m.role === "player" && m.probeQuality === "weak").length;
        const x = messages.filter((m) => m.role === "player" && m.probeQuality === "wasted").length;
        return (
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
            PROBES THIS CALL: {s} strong · {w} weak · {x} wasted
          </div>
        );
      })()}

      <section>

        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-caution">
          <Pin className="h-3 w-3" /> PINNED · {pins.length}/5
        </div>
        {pins.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Pin any contact message you find suspicious — then tag which brief fact it collides with.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {pins.map((i) => {
              const currentRef = pinTags[i];
              const tagged = findRef(refs, currentRef);
              const isGut = !currentRef || currentRef === "GUT";
              return (
                <li
                  key={i}
                  className="rounded-md border border-caution/40 bg-caution/10 p-2.5 text-xs"
                >
                  <div className="whitespace-pre-wrap">
                    {messages[i]?.text || "[voice note]"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Tag this pin against a brief fact">
                    {refs.map((r) => {
                      const selected = currentRef === r.ref;
                      const tone =
                        r.kind === "known"
                          ? selected
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-primary/40 text-primary/80 hover:border-primary"
                          : selected
                            ? "border-muted-foreground bg-muted/40 text-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/50";
                      return (
                        <button
                          key={r.ref}
                          type="button"
                          aria-pressed={selected}
                          aria-label={r.ariaLabel}
                          onClick={() => onTag(i, r.ref)}
                          className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-widest ${tone}`}
                        >
                          {r.ref}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-pressed={isGut}
                      aria-label="Tag as gut feeling — no fact attached yet"
                      onClick={() => onTag(i, "GUT")}
                      className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-widest ${
                        isGut
                          ? "border-caution bg-caution/20 text-caution"
                          : "border-border text-muted-foreground hover:border-caution/60"
                      }`}
                    >
                      GUT
                    </button>
                  </div>
                  {!isGut && (
                    <div className="mt-2 rounded-sm border border-border/60 bg-background/40 p-2 text-[11px] italic text-muted-foreground">
                      <span className="mr-1.5 font-mono not-italic text-primary/80">
                        {tagged.ref}
                      </span>
                      {tagged.text}
                    </div>
                  )}
                  {isGut && (
                    <div className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground/80">
                      gut feeling — no fact attached yet
                    </div>
                  )}
                  <button
                    onClick={() => onUnpin(i)}
                    className="mt-2 block font-mono text-[9px] tracking-widest text-caution/70 hover:text-caution"
                  >
                    UNPIN
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Above-composer quick-brief: horizontal ref badges + a one-line reveal strip. */
function QuickBrief({
  refs,
  openRef,
  onToggle,
}: {
  refs: FactRef[];
  openRef: string | null;
  onToggle: (ref: string) => void;
}) {
  const open = refs.find((r) => r.ref === openRef) ?? null;
  return (
    <div className="mb-2">
      <div
        aria-live="polite"
        className="min-h-0"
      >
        {open && (
          <div className="mb-1 flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-[11px] leading-relaxed text-primary">
            <span className="font-mono tracking-widest">{open.ref}</span>
            <span className="text-foreground/90">{open.text}</span>
            <button
              type="button"
              onClick={() => onToggle(open.ref)}
              aria-label="Close brief entry"
              className="ml-auto font-mono text-[10px] tracking-widest text-primary/80 hover:text-primary"
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Quick brief">
        <span className="mr-1 font-mono text-[9px] tracking-widest text-white/40 self-center">
          BRIEF
        </span>
        {refs.map((r) => {
          const selected = openRef === r.ref;
          const tone =
            r.kind === "known"
              ? selected
                ? "border-primary bg-primary/20 text-primary"
                : "border-primary/40 text-primary/80 hover:border-primary"
              : selected
                ? "border-white/60 bg-white/10 text-white"
                : "border-white/20 text-white/60 hover:border-white/50";
          return (
            <button
              key={r.ref}
              type="button"
              aria-pressed={selected}
              aria-label={r.ariaLabel}
              onClick={() => onToggle(r.ref)}
              className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-widest ${tone}`}
            >
              {r.ref}
            </button>
          );
        })}
      </div>
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
  const [confidence, setConfidence] = useState<60 | 75 | 90 | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState("");

  const sim = useMemo(() => loadSim(), []);
  const pinIdxs: number[] = (sim?.state as EngineState & { pins?: number[] })?.pins ?? [];
  const pinnedMsgs = pinIdxs.map((i) => sim?.messages[i]).filter((m): m is Message => !!m);
  const pinTags = sim?.pinTags ?? {};
  const refs = useMemo(() => factRefsFor(scenario), [scenario]);
  const voiceMsg = sim?.messages.find((m) => m.kind === "voice");
  const vobArtifact = sim?.vobArtifact;
  const usedVob = sim?.endReason === "vob_used";

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit() {
    if (!verdict || !confidence) return;
    sessionStorage.setItem(
      VERDICT_KEY,
      JSON.stringify({ verdict, confidence, picked, conclusion: conclusion.trim().slice(0, 300) }),
    );
    onDone();
  }


  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="font-mono text-xs tracking-[0.3em] text-caution">INVESTIGATION BOARD</div>
      <h1 className="mt-2 text-2xl font-semibold">Pin the evidence. Make the call.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything you flagged during the chat is here. Now assemble the picture.
      </p>

      {/* Auto-populated evidence pane */}
      <section className="mt-6 rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
          CASE FILE · AUTO-COLLECTED
        </div>

        <div>
          <div className="font-mono text-[10px] tracking-widest text-caution mb-1.5">
            WHAT YOU FLAGGED LIVE · {pinnedMsgs.length}
          </div>
          {pinnedMsgs.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              You flagged nothing live. Verdict from memory.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {pinIdxs.map((idx, i) => {
                const m = sim?.messages[idx];
                if (!m) return null;
                const tagRef = pinTags[idx];
                const tag = findRef(refs, tagRef);
                const snippet = (m.text || "[voice note]").slice(0, 80);
                const badgeTone =
                  tag.kind === "known"
                    ? "border-primary/50 text-primary bg-primary/10"
                    : tag.kind === "public"
                      ? "border-border text-muted-foreground bg-muted/30"
                      : "border-caution/40 text-caution bg-caution/10";
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-md border-l-2 border-caution bg-caution/5 pl-2.5 py-1.5 text-xs"
                  >
                    <span
                      className={`shrink-0 rounded-sm border px-1 py-0.5 font-mono text-[9px] tracking-widest ${badgeTone}`}
                    >
                      {tag.ref}
                    </span>
                    <span className="italic">"{snippet}"</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>


        {voiceMsg && (
          <div>
            <div className="font-mono text-[10px] tracking-widest text-primary mb-1.5">
              VOICE NOTE
            </div>
            <div className="text-xs text-muted-foreground">
              Artifact detected:{" "}
              <span className="text-foreground">
                {ARTIFACT_LABEL(voiceMsg.voice?.artifact ?? null)}
              </span>
            </div>
          </div>
        )}

        {usedVob && (
          <div>
            <div className="font-mono text-[10px] tracking-widest text-primary mb-1.5">
              OUT-OF-BAND VERIFICATION
            </div>
            <div className="text-xs text-muted-foreground">
              {vobArtifact ? `Result: ${vobArtifact}` : "You verified through a trusted channel."}
            </div>
          </div>
        )}

        <div>
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1.5">
            DOSSIER
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {scenario.dossier.publicFacts.slice(0, 3).map((f, i) => (
              <li key={i}>· {f}</li>
            ))}
          </ul>
        </div>
      </section>

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
          <div className="mt-1 text-[10px] text-muted-foreground">This is who they claim</div>
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
          <div className="mt-1 text-[10px] text-muted-foreground">This is an imposter</div>
        </button>
      </div>

      {/* HOW SURE? — conviction pick, radio group. Locks are gated on this. */}
      {verdict && (
        <div className="mt-6">
          <div
            id="how-sure-label"
            className="font-mono text-xs tracking-widest text-muted-foreground mb-2"
          >
            HOW SURE?
          </div>
          <div
            role="radiogroup"
            aria-labelledby="how-sure-label"
            className="flex flex-wrap gap-2"
          >
            {CONVICTION_CHIPS.map((chip) => {
              const selected = confidence === chip.value;
              return (
                <button
                  key={chip.value}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (confidence == null && chip.value === 60) ? 0 : -1}
                  onClick={() => setConfidence(chip.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                      e.preventDefault();
                      const idx = CONVICTION_CHIPS.findIndex((c) => c.value === chip.value);
                      const next = CONVICTION_CHIPS[(idx + 1) % CONVICTION_CHIPS.length];
                      setConfidence(next.value);
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                      e.preventDefault();
                      const idx = CONVICTION_CHIPS.findIndex((c) => c.value === chip.value);
                      const prev =
                        CONVICTION_CHIPS[(idx - 1 + CONVICTION_CHIPS.length) % CONVICTION_CHIPS.length];
                      setConfidence(prev.value);
                    }
                  }}
                  className={`rounded-full border px-3 py-1.5 font-mono text-xs tracking-widest transition ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {chip.label} · {chip.value}%
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Investigator's conclusion */}
      <div className="mt-8">
        <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
          INVESTIGATOR'S CONCLUSION · OPTIONAL
        </div>
        <textarea
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value.slice(0, 300))}
          placeholder="In one line: why do you believe this? (max 300 chars)"
          rows={3}
          className="w-full rounded-md border border-border bg-background p-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
        <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
          {conclusion.length}/300
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!verdict || !confidence}
        className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground disabled:opacity-40"
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
  const [profileSnap, setProfileSnap] = useState(() => loadProfile());
  const [tapeOpen, setTapeOpen] = useState(false);
  useEffect(() => {
    const on = () => setProfileSnap(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);
  const verdictRaw = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(VERDICT_KEY);
      return raw
        ? (JSON.parse(raw) as { verdict: "REAL" | "FAKE"; confidence?: number; picked: string[]; conclusion?: string })
        : null;
    } catch {
      return null;
    }
  }, []);

  const result = useMemo(() => {
    if (!verdictRaw || !sim) return null;
    const truthLabel: "REAL" | "FAKE" = scenario.truth === "REAL" ? "REAL" : "FAKE";
    const correctVerdict = verdictRaw.verdict === truthLabel;

    const correctChipIds = scenario.evidenceChips.filter((c) => c.correct).map((c) => c.id);
    const pickedCorrect = verdictRaw.picked.filter((id) => correctChipIds.includes(id)).length;
    const pickedRedHerring = verdictRaw.picked.filter((id) => !correctChipIds.includes(id)).length;

    const playerMsgs = sim.messages.filter((m) => m.role === "player");
    const strong = playerMsgs.filter((m) => m.probeQuality === "strong").length;
    const weak = playerMsgs.filter((m) => m.probeQuality === "weak").length;
    const wasted = playerMsgs.filter((m) => m.probeQuality === "wasted").length;

    // Quoted tells from the contact.
    const tells = sim.messages.filter((m) => m.role === "contact" && m.isTell).slice(0, 4);

    // Voice note (if any) — pull artifact from message
    const voiceMsg = sim.messages.find((m) => m.kind === "voice");
    const voiceArtifact = voiceMsg?.voice?.artifact ?? null;

    const usedVob = sim.state?.vobUsed === true;

    // Scoring
    let points = 0;
    let resultKind: "correct" | "missed_scam" | "false_alarm" | "lucky_guess";
    if (correctVerdict) {
      const reasoningOk = pickedCorrect >= 2 && pickedRedHerring <= 1;
      if (usedVob) {
        // VOB at low tiers = discounted. At Tier 4-5 it's the intended path.
        points = scenario.tier >= 4 ? 90 : 45;
        resultKind = reasoningOk ? "correct" : "lucky_guess";
      } else if (scenario.tier === 5) {
        // In-band verdict at Tier 5 is a lucky guess.
        points = 50;
        resultKind = "lucky_guess";
      } else if (reasoningOk) {
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

    // 4-axis stars (each 0, 0.5, or 1) → total 0-4
    const starVerdict = correctVerdict ? 1 : 0;
    const starEvidence =
      pickedCorrect >= 2 && pickedRedHerring <= 1
        ? 1
        : pickedCorrect >= 1 && pickedRedHerring <= 2
          ? 0.5
          : 0;
    const starProbing = strong >= 2 && wasted === 0 ? 1 : strong >= 1 && wasted <= 1 ? 0.5 : 0;
    // Verification axis: at Tier 4-5, VOB is the right call; at low tiers,
    // strong in-band reasoning also counts.
    const starVerification = usedVob
      ? 1
      : scenario.tier <= 2 && correctVerdict && pickedCorrect >= 2
        ? 1
        : scenario.tier === 3 && correctVerdict && pickedCorrect >= 2
          ? 0.5
          : 0;
    const stars = starVerdict + starEvidence + starProbing + starVerification;

    return {
      correctVerdict,
      pickedCorrect,
      pickedRedHerring,
      strong,
      weak,
      wasted,
      points,
      resultKind,
      truthLabel,
      tells,
      voiceArtifact,
      usedVob,
      stars,
      starVerdict,
      starEvidence,
      starProbing,
      starVerification,
    };
  }, [scenario, sim, verdictRaw]);

  // Capture BEFORE resolve so we can render the reveal in past tense.
  const pendingBefore = useMemo(() => pendingRetestForCase(scenario.id), [scenario.id]);
  const [retestResolution, setRetestResolution] = useState<RetestResolution>({ kind: "none" });

  const savedRef = useRef(false);
  useEffect(() => {
    if (!result || !verdictRaw || savedRef.current) return;
    savedRef.current = true;
    const p = loadProfile();
    const xpBefore = computeXp(p, loadUnlocked().size, p.publishedCount ?? 0);
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
    const nowTs = Date.now();
    p.history.push({
      caseId: scenario.id,
      tier: scenario.tier,
      verdict: verdictRaw.verdict,
      truth: scenario.truth,
      result: result.resultKind,
      points: result.points,
      usedVob: result.usedVob,
      confidence: verdictRaw.confidence,
      ts: nowTs,
    });
    saveProfile(p);
    // The Tape — local-only annotated transcript, keyed to the same ts the
    // wall row uses so /wall can attach a "TAPE ON FILE →" affordance.
    if (sim?.messages?.length) {
      saveTape({
        caseId: scenario.id,
        ts: nowTs,
        result: result.resultKind,
        messages: sim.messages,
      });
    }
    const xpAfter = computeXp(p, loadUnlocked().size, p.publishedCount ?? 0);
    writeXpDelta(xpBefore, xpAfter);
    logPilotEntry({
      wing: "mirror",
      caseId: scenario.id,
      tier: scenario.tier,
      result: result.resultKind,
      points: result.points,
      probeStats: { strong: result.strong, weak: result.weak, wasted: result.wasted },
      ts: nowTs,
    });
    // Anonymous telemetry — includes tactic tag for aggregate learning analytics.
    // Wrapped so a failed track never touches the case-completion path.
    try {
      track("case_complete", {
        case_id: scenario.id,
        payload: {
          district: "mirror",
          tactic: scenario.tactic ?? tacticForMirror(scenario.id),
          tier: scenario.tier,
          result: result.resultKind,
          used_vob: result.usedVob,
        },
      });
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event("milverse:profile"));
    checkAndAwardBadges(p);

    // "The City Checks Back" — spaced retests.
    // 1) Resolve any pending retest that this caseId satisfies.
    const resolution = resolveRetest(scenario.id, result.resultKind, nowTs);
    // Only reveal if the retest was actually DUE at play-time (spec: silent
    // close when player organically solves it before it surfaces).
    if (
      resolution.kind !== "none" &&
      pendingBefore &&
      pendingBefore.dueTs <= nowTs
    ) {
      setRetestResolution(resolution);
    }
    // 2) A fresh loss schedules its own retest (uses post-save profile so
    //    unlockedMaxTier + latest-history are current).
    if (result.resultKind === "missed_scam" || result.resultKind === "false_alarm") {
      scheduleRetest(scenario.id, loadProfile(), nowTs);
    }
  }, [result, scenario.id, scenario.tier, scenario.truth, scenario.tactic, verdictRaw, pendingBefore]);

  if (!result || !verdictRaw) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">
        No verdict recorded.{" "}
        <Link to="/mirror" className="text-primary underline">
          Back to case files
        </Link>
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
    scenario.truth === "REAL" ? "This person was REAL." : "This was an IMPOSTER.";

  // Pick pivotal message: last isTell for missed_scam, first player msg for false_alarm.
  const pivotal =
    result.resultKind === "missed_scam"
      ? [...(sim?.messages ?? [])].reverse().find((m) => m.role === "contact" && m.isTell)
      : result.resultKind === "false_alarm"
        ? sim?.messages.find((m) => m.role === "player")
        : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <CinematicResult kind={result.resultKind} truth={scenario.truth} pivotal={pivotal?.text} />
      <div className={`rounded-xl border-2 p-6 ${verdictTone}`}>
        <div className="font-mono text-xs tracking-[0.3em] opacity-80">
          DEBRIEF · TIER {scenario.tier}
        </div>
        <h1 className="mt-2 text-2xl font-semibold">{truthHeadline}</h1>
        <div className="mt-3">
          <XpDeltaLine />
        </div>
        <p className="mt-1 text-sm opacity-90">
          You said <b>{verdictRaw.verdict}</b> · Result:{" "}
          <b>{result.resultKind.replace("_", " ").toUpperCase()}</b>
          {result.usedVob && (
            <>
              {" "}
              · <b>OUT-OF-BAND VERIFIED</b>
            </>
          )}
        </p>
        <div className="mt-3 font-mono text-2xl">
          {result.points >= 0 ? "+" : ""}
          {result.points} pts
        </div>
        {(() => {
          const line = debriefLineFor(result.correctVerdict, verdictRaw.confidence);
          const rep = computeConviction(profileSnap.history);
          return (
            <>
              {line && (
                <p className="mt-3 font-mono text-[11px] tracking-wide opacity-90 border-t border-current/20 pt-3">
                  {line}
                </p>
              )}
              {rep.status === "ok" && (
                <p className="mt-1 font-mono text-[10px] tracking-widest opacity-70">
                  CONVICTION LEDGER: {rep.headline} · gap {rep.gap >= 0 ? "+" : ""}
                  {rep.gap}
                </p>
              )}
            </>
          );
        })()}
        {scenario.tier === 5 && !result.usedVob && result.correctVerdict && (
          <p className="mt-3 text-xs opacity-90 border-t border-current/20 pt-3">
            Correct — but at Tier 5, in-band tells are unreliable. Verifying out-of-band would have
            been the safer read. <b>Spotting is dying. Verifying is forever.</b>
          </p>
        )}
      </div>

      <RetestReveal resolution={retestResolution} />

      <TacticStamp tacticId={tacticForMirror(scenario.id)} />

      {(result.resultKind === "missed_scam" || result.resultKind === "false_alarm") && (
        <LossBeat
          result={result.resultKind}
          tacticLabel={labelForTactic(tacticForMirror(scenario.id))}
          seedKey={`mirror:${scenario.id}`}
        />
      )}

      <CalibrationQuadrant profile={profileSnap} compact caption="CALIBRATION · AFTER THIS CASE" />

      {/* 4-axis star scoring */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-xs tracking-widest text-muted-foreground">
            INVESTIGATOR RATING
          </div>
          <div className="font-mono text-lg text-primary">{result.stars.toFixed(1)} / 4.0</div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StarAxis label="Verdict" value={result.starVerdict} />
          <StarAxis label="Evidence" value={result.starEvidence} />
          <StarAxis label="Probing" value={result.starProbing} />
          <StarAxis label="Verification" value={result.starVerification} />
        </div>
      </section>

      {/* Investigator's conclusion */}
      {verdictRaw.conclusion && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
            YOUR CONCLUSION
          </div>
          <p className="text-sm italic border-l-2 border-primary pl-3">"{verdictRaw.conclusion}"</p>
        </section>
      )}

      {/* YOUR NOTES, GRADED — reads back the player's own pins and tags. */}
      {(() => {
        const pinIdxs: number[] =
          (sim?.state as EngineState & { pins?: number[] })?.pins ?? [];
        if (!sim || pinIdxs.length === 0) return null;
        const tags = sim.pinTags ?? {};
        const refs = factRefsFor(scenario);
        return (
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
              YOUR NOTES, GRADED
            </div>
            <ul className="space-y-2">
              {pinIdxs.map((idx, i) => {
                const m = sim.messages[idx];
                if (!m) return null;
                const tag = findRef(refs, tags[idx]);
                const wasTell = m.role === "contact" && m.isTell === true;
                const status = wasTell ? "TELL" : "CLEAN";
                const statusTone = wasTell
                  ? "border-caution text-caution bg-caution/10"
                  : "border-border text-muted-foreground bg-muted/20";
                const refTone =
                  tag.kind === "known"
                    ? "border-primary/50 text-primary bg-primary/10"
                    : tag.kind === "public"
                      ? "border-border text-muted-foreground bg-muted/30"
                      : "border-caution/40 text-caution bg-caution/10";
                return (
                  <li
                    key={i}
                    className="rounded-md border border-border bg-background/30 p-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-sm border px-1 py-0.5 font-mono text-[9px] tracking-widest ${refTone}`}
                      >
                        {tag.ref}
                      </span>
                      <span
                        className={`rounded-sm border px-1 py-0.5 font-mono text-[9px] tracking-widest ${statusTone}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm italic">
                      "{(m.text || "[voice note]").slice(0, 140)}"
                    </div>
                    {tag.kind !== "gut" && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        vs {tag.ref}: {tag.text}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}


      {/* Quoted tells from THIS conversation */}
      {result.tells.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
            WHAT THEY SAID · TELLS FROM YOUR CHAT
          </div>
          <ul className="space-y-3">
            {result.tells.map((t, i) => (
              <li key={i} className="rounded-md border-l-2 border-caution bg-caution/5 pl-3 py-2">
                <div className="text-sm italic">"{t.text || "[voice note]"}"</div>
                {t.tellExplanation && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] tracking-widest text-caution mr-1.5">
                      →
                    </span>
                    {t.tellExplanation}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The Tape — annotated playback of the whole exchange. */}
      {sim?.messages?.length ? (
        <div>
          <button
            type="button"
            onClick={() => setTapeOpen(true)}
            className="w-full rounded-md border border-caution/50 bg-caution/5 py-3 font-mono text-xs tracking-widest text-caution hover:bg-caution/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caution"
          >
            PLAY THE TAPE →
          </button>
        </div>
      ) : null}

      {tapeOpen && sim?.messages?.length ? (
        <TapeReview
          scenario={scenario}
          messages={sim.messages}
          result={result.resultKind}
          onClose={() => setTapeOpen(false)}
        />
      ) : null}

      {/* Voice note breakdown */}
      {result.voiceArtifact !== undefined && sim?.messages.some((m) => m.kind === "voice") && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
            VOICE NOTE ANALYSIS
          </div>
          <p className="text-sm">
            <span className="font-mono text-[11px] tracking-widest text-primary mr-2">
              ARTIFACT
            </span>
            {ARTIFACT_LABEL(result.voiceArtifact)}
          </p>
          {result.voiceArtifact === null ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Clean recording — the pacing and ambience were natural. Consistent with a real note.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Higher tiers make this artifact subtler. Careful second listens catch it — first
              listens usually don't.
            </p>
          )}
        </section>
      )}

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
              <li
                key={c.id}
                className={`rounded-md border p-2.5 ${picked ? tone : "border-border/60 opacity-60"}`}
              >
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

      {(() => {
        const dc = clockFor(scenario.id);
        if (!dc) return null;
        return (
          <section className="rounded-xl border border-caution/40 bg-caution/5 p-6">
            <div className="font-mono text-xs tracking-[0.3em] text-caution mb-2">
              THE CLOCK
            </div>
            <p className="text-sm leading-relaxed">{dc.debriefNote}</p>
          </section>
        );
      })()}

      <RealCaseFile caseId={scenario.id} inline={scenario.inspiredBy} />

      <CitySolved caseId={scenario.id} playerResult={result.resultKind === "correct" ? "correct" : result.resultKind === "missed_scam" ? "missed_scam" : result.resultKind === "false_alarm" ? "false_alarm" : "correct"} />

      <NextCaseCard wing="mirror" currentId={scenario.id} />

      {(() => {
        const am = aftermathFor(scenario.id);
        if (!am) return null;
        return (
          <section className="mt-6 border-t border-border pt-10 text-muted-foreground">
            <div className="font-mono text-[10px] tracking-[0.3em]">
              AFTER THE CASE · REPORTED PATTERN
            </div>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{am.patternName}</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/85">
              {am.reportedPattern}
            </p>
            <blockquote className="mt-5 border-l-2 border-border pl-4 text-sm italic leading-relaxed text-foreground/80">
              {am.dayAfter}
            </blockquote>
            <p className="mt-2 font-mono text-[10px] tracking-wide text-muted-foreground">
              COMPOSITE ACCOUNT, DRAWN FROM REPORTED CASES. NO REAL PERSON APPEARS IN THIS FILE.
            </p>
            <div className="mt-6 font-mono text-[11px] tracking-widest text-foreground/80">
              IF IT'S EVER REAL:
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm text-foreground/85 marker:text-muted-foreground">
              {am.steps.map((s, i) => (
                <li key={i} className="leading-relaxed">{s}</li>
              ))}
            </ol>
            <div className="mt-6">
              <Link
                to="/manual/take-it-outside"
                className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-foreground/80 underline underline-offset-4 hover:text-foreground"
              >
                TAKE IT OUTSIDE →
              </Link>
            </div>
          </section>
        );
      })()}


      <div className="flex gap-3">
        <Link
          to="/mirror"
          className="flex-1 rounded-md border border-border py-3 text-center font-mono text-xs tracking-widest hover:bg-accent"
        >
          MORE CASES
        </Link>
        <button
          onClick={() => navigate({ to: "/city-hall" })}
          className="flex-1 rounded-md border border-border py-3 font-mono text-xs tracking-widest hover:border-primary/50"
        >
          VIEW CALIBRATION
        </button>
      </div>
    </main>
  );
}

function RetestReveal({ resolution }: { resolution: RetestResolution }) {
  if (resolution.kind === "none") return null;
  const r = resolution.retest;
  const tacticLabel = labelForTactic(r.tactic);
  const shortDate = new Date(r.sourceTs).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (resolution.kind === "closed_win") {
    return (
      <section className="rounded-sm border border-primary/40 bg-primary/5 p-5">
        <div className="font-mono text-[10px] tracking-widest text-primary">FOLLOW-UP CLOSED</div>
        <p className="mt-2 text-sm text-foreground/90">
          On {shortDate} the {tacticLabel} beat you — {r.sourceCaseTitle}. Today it didn't. The file
          closes for good.
        </p>
      </section>
    );
  }

  if (resolution.kind === "reschedule") {
    return (
      <section className="rounded-sm border border-caution/40 bg-caution/5 p-5">
        <div className="font-mono text-[10px] tracking-widest text-caution">
          FOLLOW-UP REMAINS OPEN
        </div>
        <p className="mt-2 text-sm text-foreground/90">
          The {tacticLabel} took you twice now. The city will knock once more.
        </p>
      </section>
    );
  }

  // closed_final — Manual handoff.
  const hasEntry = MANUAL_ENTRIES.some((e) => e.id === r.tactic);
  return (
    <section className="rounded-sm border border-destructive/40 bg-destructive/5 p-5">
      <div className="font-mono text-[10px] tracking-widest text-destructive">
        FOLLOW-UP REMAINS OPEN
      </div>
      <p className="mt-2 text-sm text-foreground/90">
        Twice is a pattern. The file goes to the Manual — read the{" "}
        {hasEntry ? (
          <Link
            to="/manual/$entryId"
            params={{ entryId: r.tactic }}
            className="text-caution underline underline-offset-2 hover:text-foreground"
          >
            {tacticLabel}
          </Link>
        ) : (
          <span className="text-caution">{tacticLabel}</span>
        )}{" "}
        page before it finds you again.
      </p>
    </section>
  );
}

function StarAxis({ label, value }: { label: string; value: number }) {
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

function ProbeStat({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "good" | "warn" | "bad";
}) {
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
      P: "There was no manufactured urgency — the signature of a real conversation.",
      A: "Verification would have confirmed this cleanly. A real contact welcomes it.",
      U: "Every checkable claim aligned with your dossier.",
      S: "Emotional tone was casual (or genuinely stressed, at higher tiers) — not weaponised.",
      E: "Evidence pointed to REAL. Accusing them costs the relationship — a False Alarm.",
    }[k];
  }
  return {
    P: 'Look for manufactured urgency — countdowns, deadlines, "before EOD." That\'s the lever.',
    A: "They resisted every out-of-band verification. A real contact welcomes it.",
    U: 'Claims you couldn\'t check ("reverse OTP," "security app," "temp SIM") — made-up policy is a red flag.',
    S: "Emotional escalation, guilt, or authority. The story is a tool, not a fact.",
    E: "The dossier is your ground truth. Contradictions on dossier facts are catchable lies.",
  }[k];
}

function CinematicResult({
  kind,
  truth,
  pivotal,
}: {
  kind: "correct" | "missed_scam" | "false_alarm" | "lucky_guess";
  truth: "REAL" | "IMPOSTER";
  pivotal?: string;
}) {
  if (kind === "missed_scam") {
    return (
      <div className="msg-in rounded-2xl border-2 border-destructive/50 bg-destructive/10 p-8 text-center">
        <div className="font-mono text-[10px] tracking-[0.4em] text-destructive">MISSED SCAM</div>
        <div className="mt-4 text-4xl sm:text-5xl font-semibold text-destructive">
          ₨15,000 gone.
        </div>
        {pivotal && (
          <div className="mt-6 mx-auto max-w-md rounded-lg border-l-2 border-destructive bg-background/50 p-3 text-left">
            <div className="font-mono text-[10px] tracking-widest text-destructive mb-1">
              THE MESSAGE WHERE THE TRAP CLOSED
            </div>
            <div className="text-sm italic">"{pivotal}"</div>
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
          Once money leaves — especially via gift cards, wallet, or crypto — it doesn't come back.
          Verification, not spotting, is the only defence.
        </p>
      </div>
    );
  }
  if (kind === "false_alarm") {
    return (
      <div className="msg-in rounded-2xl border-2 border-caution/50 bg-caution/10 p-8 text-center">
        <div className="font-mono text-[10px] tracking-[0.4em] text-caution">FALSE ALARM</div>
        <div className="mt-4 text-3xl sm:text-4xl font-semibold text-caution leading-tight">
          {truth === "REAL" ? "She was really your cousin." : "That was really them."}
        </div>
        <p className="mt-3 text-sm">
          {truth === "REAL"
            ? "She waited at the stop for 40 minutes. Then walked home in the cold."
            : "You just accused a real person of being an imposter."}
        </p>
        <p className="mt-4 text-xs text-muted-foreground max-w-md mx-auto">
          Wrongly accusing a real person costs the relationship — that IS a loss. The skill is
          calibration, not suspicion.
        </p>
      </div>
    );
  }
  if (kind === "correct") {
    return (
      <div className="msg-in rounded-2xl border-2 border-primary/50 bg-primary/10 p-8 text-center">
        <div className="font-mono text-[10px] tracking-[0.4em] text-primary">CALIBRATED WIN</div>
        <div className="mt-4 text-3xl sm:text-4xl font-semibold text-primary leading-tight">
          You verified without insulting.
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          That's the skill. Caught the imposter OR trusted the real person — with reasoning, not
          luck.
        </p>
      </div>
    );
  }
  return (
    <div className="msg-in rounded-2xl border-2 border-caution/50 bg-caution/10 p-8 text-center">
      <div className="font-mono text-[10px] tracking-[0.4em] text-caution">LUCKY GUESS</div>
      <div className="mt-4 text-2xl font-semibold">Right verdict, thin reasoning.</div>
      <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
        You got there — but the evidence you tagged wouldn't have held up. Next time, tag the tells
        that made it click.
      </p>
    </div>
  );
}

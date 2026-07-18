import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Skull,
  KeyRound,
  Hand,
  ShieldCheck,
  ShieldOff,
  HandCoins,
  Award,
  Home,
  Search,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { DistrictLiveFX, type DistrictKey } from "@/components/DistrictLiveFX";
import { getBoss } from "@/lib/boss/scenarios";
import type { BossVerdict, ProtocolMove } from "@/lib/boss/types";
import {
  initBoss,
  pickVariant,
  runFactCheck,
  playMove,
  resolveVerdict,
  currentPressureLine,
  type BossState,
  type BossOutcome,
} from "@/lib/boss/engine";
import { attemptCount, recordBossAttempt, canRematch, loadBossProfile } from "@/lib/boss/profile";
import { ColdOpen } from "@/components/boss/ColdOpen";
import { useVisualMode } from "@/lib/visual-quality";
import { shouldReduceMotion } from "@/lib/access";
import { DOCTRINE_RULES } from "@/lib/boss/doctrine";
import { logPilotEntry } from "@/lib/pilot";
import { loadProfile } from "@/lib/mirror/profile";
import { CalibrationQuadrant } from "@/components/CalibrationQuadrant";
import { CitySolved } from "@/components/CitySolved";
import { VerdictMoment } from "@/components/VerdictMoment";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ContactsSheet } from "@/components/chat/ContactsSheet";
import { CallScreen } from "@/components/chat/CallScreen";
import { BankConfirmSheet } from "@/components/chat/BankConfirmSheet";
import { NotificationBanner, type NotificationPayload } from "@/components/chat/NotificationBanner";
import { detectAmount, type SavedContact } from "@/lib/chat/contacts";
import { CHAT_SKINS } from "@/lib/chat/skins";
import { useJuniorGate } from "@/components/firstPhone/JuniorGate";
import { TacticStamp } from "@/components/TacticStamp";
import type { TacticId } from "@/lib/manual/entries";

// Boss → canonical Field Manual tactic. Chosen by reading each boss's
// method page: the Ghost swaps channels ("new number, it's me"), the Twin
// is the Forgery Engine's flagship, the Chorus is many outlets one origin.
const BOSS_TACTIC: Record<string, TacticId> = {
  "ghost-of-bali": "impersonation",
  "the-twin": "forgery-engine",
  "the-chorus": "imposter-outlet",
};

export const Route = createFileRoute("/boss/$bossId")({
  component: function BossPlayGuarded() {
    const gate = useJuniorGate("Boss Protocol");
    return gate ?? <BossPlay />;
  },
});

interface LogItem {
  kind: "boss" | "you" | "sys" | "check" | "move";
  text: string;
  meta?: string;
}

const BOSS_NUMBERS: Record<string, string> = {
  "ghost-of-bali": "+92 3xx 887 4419",
  "the-twin": "+92 3xx 221 9047",
  "the-chorus": "unknown source",
};

function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setRm(mql.matches);
    const on = () => setRm(mql.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return rm;
}

function BossPlay() {
  const { bossId } = Route.useParams();
  const navigate = useNavigate();
  const boss = getBoss(bossId);
  const reducedMotion = useReducedMotion();

  const [stage, setStage] = useState<"intro" | "cold-open" | "play" | "cinema" | "debrief">("intro");
  const { mode: visualMode } = useVisualMode();
  const [state, setState] = useState<BossState | null>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [outcome, setOutcome] = useState<BossOutcome | null>(null);
  const [chainOpen, setChainOpen] = useState<string[] | null>(null);

  // Phone surface state
  const [contactsOpen, setContactsOpen] = useState(false);
  const [call, setCall] = useState<{ name: string; number?: string; line?: string | null } | null>(
    null,
  );
  const [bankOpen, setBankOpen] = useState(false);
  const [banner, setBanner] = useState<NotificationPayload | null>(null);

  const variant = useMemo(() => {
    if (!boss) return null;
    return pickVariant(boss, attemptCount(boss.id));
  }, [boss]);

  useEffect(() => {
    if (boss && variant && stage === "play" && !state) {
      const s = initBoss(boss, variant);
      setState(s);
      setLog([
        { kind: "sys", text: `${boss.codename} — ${boss.phases[0].label}` },
        { kind: "boss", text: variant.opener },
      ]);
    }
  }, [boss, variant, stage, state]);

  if (!boss || !variant) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <TopBar />
        <div className="max-w-lg mx-auto mt-10">
          <p>Unknown boss.</p>
          <Link to="/boss" className="text-red-400 underline">
            Back to Boss Protocol
          </Link>
        </div>
      </div>
    );
  }

  // Entry guard only. After a loss commits, recordBossAttempt creates the
  // remediation assignment immediately — guarding on every render would
  // hijack the verdict cinema and debrief of the round that just ended.
  if (stage === "intro" && !canRematch(boss.id)) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <TopBar />
        <div className="max-w-lg mx-auto mt-10 space-y-4">
          <div className="text-red-500 text-xs tracking-[0.3em]">HANDLER ASSIGNMENT PENDING</div>
          <h1 className="text-2xl font-black">Complete your training first.</h1>
          <p className="text-white/70">
            The Handler assigned remediation after your last loss. Play any wing case to complete
            it, then return.
          </p>
          <div className="flex gap-3 pt-2">
            <Link to="/mirror" className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">
              Mirror
            </Link>
            <Link to="/feed" className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">
              Feed
            </Link>
            <Link to="/boss" className="px-4 py-2 border border-white/20 rounded">
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fxDistrict: DistrictKey = boss.district === "feed" ? "feed" : "mirror";

  // Local record for THIS boss — used by intro card + cold open.
  const bossAttempts = loadBossProfile().attempts.filter((a) => a.bossId === boss.id);
  const record = {
    attempts: bossAttempts.length,
    wins: bossAttempts.filter((a) => a.outcome === "WIN").length,
  };
  const recordRow =
    record.attempts === 0
      ? "NO PRIOR CONTACT. YOU ARE THE FIRST CALL."
      : record.wins === 0
        ? `PRIOR CONTACTS: ${record.attempts}. SURVIVORS: 0.`
        : `PRIOR CONTACTS: ${record.attempts}. YOU WALKED AWAY ${record.wins} TIME(S).`;

  function enterBoss() {
    if (visualMode === "cinematic" && !shouldReduceMotion()) {
      setStage("cold-open");
    } else {
      setStage("play");
    }
  }

  /* ── COLD OPEN ───────────────────────────────────────────── */
  if (stage === "cold-open") {
    return <ColdOpen boss={boss} record={record} onDone={() => setStage("play")} />;
  }

  /* ── INTRO CINEMATIC ─────────────────────────────────────── */
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-70">
          <DistrictLiveFX district={fxDistrict} intensity="soft" />
        </div>
        <div className="max-w-lg w-full relative">
          <div className="border border-red-900/60 bg-gradient-to-br from-red-950/40 to-black rounded-lg p-6 space-y-4 animate-in fade-in duration-700">
            <div className="flex items-center gap-2 text-red-500 text-[10px] tracking-[0.4em]">
              <Skull className="w-3 h-3" /> SPECIAL CASE — BOSS PROTOCOL
            </div>
            <div className="text-3xl font-black tracking-tight">{boss.codename}</div>
            <div className="text-xs tracking-[0.3em] text-red-400">
              THREAT RATING {boss.threatRating}
            </div>
            <div className="font-mono text-[11px] tracking-wider text-white/60 border-l-2 border-white/15 pl-3">
              {recordRow}
            </div>
            <p className="text-white/80 leading-relaxed">{boss.tagline}</p>
            <div className="border-t border-red-900/40 pt-4 mt-4">
              <div className="inline-block px-3 py-1.5 bg-red-600 text-white text-[10px] font-black tracking-[0.3em] rotate-[-2deg]">
                FACT-CHECKS WILL NOT SAVE YOU
              </div>
            </div>
            <div className="text-xs text-white/50 italic">
              Doctrine reminder — {boss.doctrineRule}
            </div>
            <div className="flex gap-3 pt-3">
              <button
                onClick={enterBoss}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded font-bold tracking-wider text-sm"
              >
                ENTER
              </button>
              <Link to="/boss" className="px-4 py-3 border border-white/20 rounded text-sm">
                Abort
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAY ────────────────────────────────────────────────── */
  if (stage === "play" && state) {
    const phaseLine = currentPressureLine(state, boss);

    function push(item: LogItem) {
      setLog((l) => [...l, item]);
    }

    function fireBanner(sender: string, preview: string) {
      // pressure phases 2+ only
      const phase = currentPressureLine(state!, boss!).phase;
      const highPressure = phase !== "friendly";
      if (!highPressure) return;
      setBanner({ id: `${Date.now()}`, sender, preview, ts: Date.now() });
    }

    function doCheck(id: string) {
      const res = runFactCheck(state!, boss!, variant!, id);
      setState(res.state);
      const fc = variant!.factChecks.find((f) => f.id === id)!;
      push({ kind: "check", text: `⌕ ${fc.label}`, meta: res.text });
      if (res.provenanceChain) setChainOpen(res.provenanceChain);
      const next = currentPressureLine(res.state, boss!);
      push({ kind: "boss", text: next.line, meta: next.phase });
      fireBanner(boss!.codename, next.line);
    }

    function doMove(id: ProtocolMove) {
      const res = playMove(state!, boss!, variant!, id);
      setState(res.state);
      const label = res.move?.label ?? id;
      push({ kind: "move", text: `▶ ${label}`, meta: res.move?.response });
      return res;
    }

    function handleContactPick(c: SavedContact) {
      setContactsOpen(false);
      if (!c.protocolMove) return;
      const move = c.protocolMove as ProtocolMove;
      // Callback / outbound moves → full-screen call UI with scripted result
      const isCallShape =
        move === "callback_known" || move === "outbound_video" || move === "second_person";
      if (isCallShape) {
        // Find scripted response for that move if available
        const def = variant!.moves.find((m) => m.id === move);
        setCall({ name: c.name, number: c.number, line: null });
        // ring, then reveal
        setTimeout(
          () => {
            if (def) {
              const res = playMove(state!, boss!, variant!, move);
              setState(res.state);
              push({
                kind: "move",
                text: `▶ ${res.move?.label ?? move}`,
                meta: res.move?.response,
              });
              setCall((prev) =>
                prev ? { ...prev, line: res.move?.response ?? def.response } : prev,
              );
            } else {
              setCall((prev) =>
                prev ? { ...prev, line: "No answer. That's data — the phone isn't dead." } : prev,
              );
            }
          },
          reducedMotion ? 200 : 1800,
        );
      } else {
        doMove(move);
      }
    }

    function commit(verdict: BossVerdict) {
      const out = resolveVerdict(state!, boss!, variant!, verdict);
      setOutcome(out);
      const declassify = out.kind === "WIN" ? boss!.id : undefined;
      recordBossAttempt(
        {
          bossId: boss!.id,
          variantId: variant!.id,
          ts: Date.now(),
          outcome: out.kind,
          winningMove:
            out.kind === "WIN" ? state!.movesPlayed[state!.movesPlayed.length - 1] : undefined,
        },
        out.kind === "WIN" ? boss!.badge.label : undefined,
        declassify,
      );
      logPilotEntry({
        wing: boss!.district === "feed" ? "feed" : "mirror",
        caseId: `boss-${boss!.id}`,
        result:
          out.kind === "WIN"
            ? "correct"
            : out.kind === "LOSS_FALSE_ALARM"
              ? "false_alarm"
              : "missed_scam",
        points: out.kind === "WIN" ? 100 : 0,
        ts: Date.now(),
      });
      setStage("cinema");
    }

    function handleComply() {
      // Only meaningful when there's a transactable request — Ghost/Twin. Chorus has no transfer.
      if (boss!.id === "the-chorus") {
        commit("COMPLY_NOW");
        return;
      }
      setBankOpen(true);
    }

    const detectedAmount =
      detectAmount(variant.opener) ??
      detectAmount(boss.phases.map((p) => p.scriptedLines.join(" ")).join(" ")) ??
      "USD 340";

    return (
      <ChatShell
        header={
          <ChatHeader
            name={boss.codename}
            number={BOSS_NUMBERS[boss.id] ?? "unknown"}
            isSaved={false}
            subtitle={`PHASE · ${phaseLine.phase}`}
            accent="destructive"
            chrome={CHAT_SKINS.whatsapp.headerClass}
            onBack={() => navigate({ to: "/boss" })}
            onContacts={() => setContactsOpen(true)}
          />
        }
        overlay={
          <>
            <NotificationBanner
              banner={banner}
              onDismiss={() => setBanner(null)}
              reducedMotion={reducedMotion}
            />
            <ContactsSheet
              open={contactsOpen}
              onClose={() => setContactsOpen(false)}
              bossId={boss.id}
              onPick={handleContactPick}
            />
            <CallScreen
              open={!!call}
              contactName={call?.name ?? ""}
              contactNumber={call?.number}
              resultLine={call?.line ?? null}
              onEnd={() => setCall(null)}
              reducedMotion={reducedMotion}
            />
            <BankConfirmSheet
              open={bankOpen}
              amount={detectedAmount}
              beneficiaryName={
                variant.truth === "SCAM"
                  ? "M. Rehman (new acct)"
                  : (boss.codename.split(" ").slice(-1)[0] ?? "Beneficiary")
              }
              beneficiaryAccount="PK36 SCBL 0000 1234 5678 9012"
              mismatchNote={
                variant.truth === "SCAM" ? "Account holder name differs from claimed sender." : null
              }
              onCancel={() => setBankOpen(false)}
              onConfirm={() => {
                setBankOpen(false);
                commit("COMPLY_NOW");
              }}
              reducedMotion={reducedMotion}
            />
          </>
        }
        composer={
          <div className="p-3 space-y-3">
            {/* Fact-check chips */}
            <div>
              <div className="text-[10px] tracking-[0.3em] text-white/40 mb-1.5 font-mono">
                FACT-CHECK
              </div>
              <div className="flex flex-wrap gap-1.5">
                {variant.factChecks.map((f) => (
                  <button
                    key={f.id}
                    disabled={state.factChecksUsed.includes(f.id)}
                    onClick={() => doCheck(f.id)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-950/60 disabled:opacity-30"
                  >
                    <Search className="inline h-3 w-3 mr-1" /> {f.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Protocol move chips (smart-reply row) */}
            <div>
              <div className="text-[10px] tracking-[0.3em] text-emerald-400 mb-1.5 font-mono">
                PROTOCOL MOVES
              </div>
              <div className="flex flex-wrap gap-1.5">
                {variant.moves.map((m) => {
                  const played = state.movesPlayed.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      disabled={played}
                      onClick={() => doMove(m.id)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/60 disabled:opacity-30"
                      title={m.blurb}
                    >
                      ▶ {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Verdict row */}
            <div className="pt-1 border-t border-white/5">
              <div className="text-[10px] tracking-[0.3em] text-red-400 mb-1.5 font-mono">
                VERDICT
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={handleComply}
                  className="text-[10px] py-2 rounded border border-white/20 hover:bg-white/5"
                >
                  <HandCoins className="w-3 h-3 inline mr-1" /> COMPLY
                </button>
                <button
                  onClick={() => commit("REFUSE_REPORT")}
                  className="text-[10px] py-2 rounded border border-white/20 hover:bg-white/5"
                >
                  <ShieldOff className="w-3 h-3 inline mr-1" /> REFUSE
                </button>
                <button
                  onClick={() => commit("HOLD_UNVERIFIED")}
                  className="text-[10px] py-2 rounded border border-red-500/50 bg-red-950/30 hover:bg-red-950/60 font-bold"
                >
                  <ShieldCheck className="w-3 h-3 inline mr-1" /> HOLD
                </button>
              </div>
              <p className="text-[9px] text-white/40 mt-1.5 leading-snug">
                HOLD refuses to transact until verification completes.
              </p>
            </div>
          </div>
        }
      >
        {/* Chat log body — boss fights arrive over the messenger (skin is
            presentation only; outcome logic lives in the engine). */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2.5"
          style={CHAT_SKINS.whatsapp.bodyStyle}
        >
          <div className="flex justify-center">
            <div className="max-w-[85%] rounded-md bg-black/40 border border-white/10 px-3 py-1.5 text-center text-[10px] leading-relaxed text-amber-200/80">
              🔒 {CHAT_SKINS.whatsapp.systemNote}
            </div>
          </div>
          {log.map((m, i) => {
            if (m.kind === "boss")
              return (
                <div key={i} className="max-w-[85%]">
                  {m.meta && (
                    <div className="text-[9px] text-red-400/70 tracking-widest mb-0.5 font-mono uppercase">
                      {m.meta}
                    </div>
                  )}
                  <div
                    className={`inline-block px-3.5 py-2 text-sm shadow-sm ${CHAT_SKINS.whatsapp.inBubble}`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            if (m.kind === "sys")
              return (
                <div
                  key={i}
                  className="text-center text-[10px] tracking-[0.3em] text-white/40 font-mono"
                >
                  — {m.text} —
                </div>
              );
            if (m.kind === "check")
              return (
                <div key={i} className="flex justify-center">
                  <div className="max-w-[90%] rounded-md border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-xs">
                    <div className="text-cyan-300 font-mono mb-1">{m.text}</div>
                    <div className="text-white/85">{m.meta}</div>
                  </div>
                </div>
              );
            if (m.kind === "move")
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-md border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-xs">
                    <div className="text-emerald-300 font-mono mb-1">{m.text}</div>
                    {m.meta && <div className="text-white/85">{m.meta}</div>}
                  </div>
                </div>
              );
            return null;
          })}
          {chainOpen && (
            <div className="mx-auto max-w-[95%] border border-amber-500/40 bg-amber-950/20 rounded p-3 text-xs">
              <div className="text-amber-300 tracking-widest mb-1 font-mono">PROVENANCE CHAIN</div>
              <ol className="list-decimal list-inside space-y-0.5 text-white/80">
                {chainOpen.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
              <button className="mt-2 text-amber-400 underline" onClick={() => setChainOpen(null)}>
                Close
              </button>
            </div>
          )}
        </div>
      </ChatShell>
    );
  }

  /* ── VERDICT CINEMA — stamp slam between the chat and the debrief ── */
  if (stage === "cinema" && outcome) {
    const stamp =
      outcome.kind === "WIN"
        ? "CASE CLOSED"
        : outcome.kind === "LOSS_TRANSACTED"
          ? "TRANSACTED"
          : outcome.kind === "LOSS_FALSE_ALARM"
            ? "FALSE ALARM"
            : "PARANOIA";
    return (
      <VerdictMoment
        caseTitle={`${boss.codename} — ${variant.truth === "REAL" ? "true request" : "imposter"}`}
        caseId={`boss-${boss.id}`}
        stampLabel={stamp}
        outcome={
          outcome.kind === "WIN"
            ? "correct"
            : outcome.kind === "LOSS_TRANSACTED"
              ? "missed_scam"
              : "false_alarm"
        }
        onDone={() => setStage("debrief")}
      />
    );
  }

  /* ── DEBRIEF ─────────────────────────────────────────────── */
  if (stage === "debrief" && outcome) {
    const win = outcome.kind === "WIN";
    return (
      <div className="min-h-screen bg-black text-white">
        <TopBar />
        <div className="max-w-2xl mx-auto p-4 pt-10 space-y-6">
          <div
            className={`border rounded-lg p-6 ${win ? "border-emerald-500/60 bg-emerald-950/30" : "border-red-700/60 bg-red-950/30"}`}
          >
            <div
              className={`text-[10px] tracking-[0.4em] mb-2 ${win ? "text-emerald-400" : "text-red-400"}`}
            >
              {win ? "CASE CLOSED — WIN" : "CASE CLOSED — LOSS"}
            </div>
            <div className="text-3xl font-black mb-1">{boss.codename}</div>
            <div className="text-sm text-white/70">
              Variant: {variant.truth === "REAL" ? "TRUE REQUEST" : "IMPOSTER"}
            </div>

            {win ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Award className="w-4 h-4" /> Badge earned: <b>{boss.badge.label}</b>
                </div>
                <p className="text-white/80">{variant.debriefLine}</p>
                <div className="border-t border-emerald-500/30 pt-3 mt-3">
                  <div className="text-[10px] tracking-[0.3em] text-emerald-400 mb-1">
                    FIELD MANUAL DECLASSIFIED
                  </div>
                  <div className="font-bold">{boss.methodPage.codename} — HOW IT WORKS</div>
                  <p className="text-xs text-white/70 mt-1">{boss.methodPage.howItWorks}</p>
                  <p className="text-xs text-white/70 mt-2">
                    <b className="text-white">The trap:</b> {boss.methodPage.theTrap}
                  </p>
                  <p className="text-xs text-white/70 mt-2">
                    <b className="text-white">The counter:</b> {boss.methodPage.theCounter}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-red-200">{"reason" in outcome ? outcome.reason : ""}</p>
                <div className="border-t border-red-500/30 pt-3 mt-3">
                  <div className="text-[10px] tracking-[0.3em] text-red-400 mb-1">THE HANDLER</div>
                  <p className="text-white/80 italic">
                    "{boss.codename} is still out there. Come back when you're ready. Play any wing
                    case first — I'll know when you're trained."
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <CalibrationQuadrant
                profile={loadProfile()}
                compact
                caption="CALIBRATION · TO DATE"
              />
            </div>

            {BOSS_TACTIC[boss.id] && (
              <div className="mt-6">
                <TacticStamp tacticId={BOSS_TACTIC[boss.id]} />
              </div>
            )}

            <div className="mt-6">
              <CitySolved
                caseId={`boss-${boss.id}`}
                playerResult={
                  outcome.kind === "WIN"
                    ? "correct"
                    : outcome.kind === "LOSS_TRANSACTED"
                      ? "missed_scam"
                      : "false_alarm"
                }
              />
            </div>

            <div className="border-t border-white/10 pt-4 mt-6">
              <div className="text-[10px] tracking-[0.4em] text-white/50 mb-2">THE DOCTRINE</div>
              <ul className="space-y-1 text-sm">
                {DOCTRINE_RULES.map((r) => (
                  <li key={r.n} className="flex gap-3">
                    <span className="text-white/50 font-mono">#{r.n}</span>
                    <span>{r.rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => navigate({ to: "/boss" })}
                className="flex-1 py-2 border border-white/20 rounded text-sm"
              >
                <Home className="w-3 h-3 inline mr-1" /> Boss lobby
              </button>
              {!win && (
                <Link to="/mirror" className="flex-1 py-2 bg-white/10 rounded text-sm text-center">
                  Complete training
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

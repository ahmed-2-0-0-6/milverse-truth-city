// MILVERSE — Pilot Assessment player flow.
//
// Framed in-world as "CITIZEN BASELINE". No feedback during intake, no
// verdict animations — plain stamps only. Intake unlocks the district-first
// experience; exit unlocks players' own before/after summary.
//
// Route params: /assessment (auto-detects phase from group state + local).

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { getActiveGroup } from "@/lib/pilot";
import {
  getCodename,
  hashCodename,
  formForPhase,
  hasAttempt,
  recordAttempt,
  myOwnAttempts,
} from "@/lib/assessment/state";
import { getForm, type AssessmentItem, type Verdict } from "@/lib/assessment/items";
import type { ItemResponse } from "@/lib/assessment/scoring";
import { fetchGroupPhase } from "@/lib/assessment.functions";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Citizen Baseline — MILVERSE" },
      { name: "description", content: "Anonymous before/after measurement for classroom pilots." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssessmentPage,
});

type Stage = "loading" | "no-group" | "already-done" | "in-progress" | "done" | "exit-locked";

function AssessmentPage() {
  const navigate = useNavigate();
  const fetchPhase = useServerFn(fetchGroupPhase);
  const [stage, setStage] = useState<Stage>("loading");
  const [phase, setPhase] = useState<"intake" | "exit">("intake");
  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [hash, setHash] = useState<string>("");
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState<ItemResponse[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [confidence, setConfidence] = useState<number>(70);

  useEffect(() => {
    (async () => {
      const g = getActiveGroup();
      if (!g) {
        setStage("no-group");
        return;
      }
      setGroupCode(g);
      const h = await hashCodename(getCodename());
      setHash(h);

      let groupPhase: "intake" | "exit" = "intake";
      try {
        const res = await fetchPhase({ data: { groupCode: g } as never });
        groupPhase = (res as { phase: "intake" | "exit" }).phase;
      } catch {
        /* offline OK — default intake */
      }

      // Decide what the player should do right now.
      const doneIntake = hasAttempt(g, h, "intake");
      const doneExit = hasAttempt(g, h, "exit");

      if (groupPhase === "intake") {
        if (doneIntake) {
          setStage("already-done");
          setPhase("intake");
          return;
        }
        setPhase("intake");
      } else {
        // exit phase
        if (!doneIntake) {
          // Rare: joined after group flipped. Let them do intake for their own data.
          setPhase("intake");
        } else if (doneExit) {
          setStage("done");
          setPhase("exit");
          return;
        } else {
          setPhase("exit");
        }
      }

      const form = formForPhase(h, groupPhase === "exit" && doneIntake ? "exit" : "intake");
      setItems(getForm(form));
      setStage("in-progress");
    })();
  }, [fetchPhase]);

  const current = items[idx];
  const progress = items.length ? Math.round((idx / items.length) * 100) : 0;

  function next() {
    if (!current || !verdict) return;
    const rec: ItemResponse = { itemId: current.id, verdict, confidence };
    const nextResponses = [...responses, rec];
    setResponses(nextResponses);
    setVerdict(null);
    setConfidence(70);
    if (idx + 1 >= items.length) {
      // finalize
      if (!groupCode) return;
      const form = items[0].form;
      recordAttempt({ groupCode, codenameHash: hash, phase, form, items: nextResponses });
      setStage("done");
    } else {
      setIdx(idx + 1);
    }
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/pilot"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← PILOT
        </Link>

        {stage === "loading" && (
          <div className="mt-8 stencil text-[11px] text-muted-foreground">// LOADING BASELINE…</div>
        )}

        {stage === "no-group" && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="stencil text-[10px] text-caution">NO PILOT GROUP</div>
            <h1 className="mt-2 text-2xl font-semibold">Join a group first</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The Citizen Baseline is a classroom-only measurement. Ask your teacher for the group
              code.
            </p>
            <Link
              to="/pilot"
              className="mt-4 inline-block rounded-md border border-primary bg-primary/10 px-4 py-2 stencil text-[10px] text-primary"
            >
              GO TO PILOT
            </Link>
          </div>
        )}

        {(stage === "already-done" || stage === "done") && (
          <FinishedCard
            phase={phase}
            groupCode={groupCode!}
            hash={hash}
            onEnterCity={() => navigate({ to: "/" })}
          />
        )}

        {stage === "in-progress" && current && (
          <>
            <div className="mt-6">
              <div className="stencil text-[10px] text-primary tracking-widest">
                CITIZEN BASELINE · {phase === "intake" ? "INTAKE" : "EXIT"} · FORM {current.form}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">
                {phase === "intake"
                  ? "3 minutes. Before you train."
                  : "3 minutes. To see what changed."}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                No feedback. No score during. The city measures before it trains — and after.
              </p>
            </div>

            {/* progress dots */}
            <div className="mt-6 flex gap-1.5" aria-label={`Item ${idx + 1} of ${items.length}`}>
              {items.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < idx ? "bg-primary" : i === idx ? "bg-primary/60" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <div className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
              {idx + 1} / {items.length} · {progress}%
            </div>

            <article className="mt-6 rounded-xl border border-border bg-card p-6">
              <div className="stencil text-[10px] text-muted-foreground">ARTIFACT</div>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
                {current.artifact}
              </p>
              {current.imageDescription && (
                <div className="mt-3 rounded-md border border-dashed border-border bg-background/40 p-3 text-xs italic text-muted-foreground">
                  [image] {current.imageDescription}
                </div>
              )}
            </article>

            <div className="mt-4">
              <div className="stencil text-[10px] text-muted-foreground">YOUR VERDICT</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["LEGIT", "FALSE", "CANT_VERIFY"] as Verdict[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerdict(v)}
                    className={`rounded-md border-2 px-3 py-3 stencil text-[10px] tracking-widest transition ${
                      verdict === v
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {v === "LEGIT" ? "LEGIT" : v === "FALSE" ? "FALSE / SCAM" : "CAN'T VERIFY"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="stencil text-[10px] text-muted-foreground">CONFIDENCE</div>
                <div className="font-mono text-sm">{confidence}%</div>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
                aria-label="Confidence (50 to 100 percent)"
              />
              <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>50 · coin flip</span>
                <span>100 · certain</span>
              </div>
            </div>

            <button
              onClick={next}
              disabled={!verdict}
              className="mt-6 w-full rounded-md border-2 border-primary bg-primary py-3 stencil text-[11px] text-primary-foreground disabled:opacity-40"
            >
              {idx + 1 >= items.length ? "SUBMIT BASELINE" : "NEXT ITEM"}{" "}
              <ArrowRight className="inline h-3 w-3 ml-1" />
            </button>
          </>
        )}
      </main>
    </div>
  );
}

/* ── After-completion card ─────────────────────────────────── */

function FinishedCard({
  phase,
  groupCode,
  hash,
  onEnterCity,
}: {
  phase: "intake" | "exit";
  groupCode: string;
  hash: string;
  onEnterCity: () => void;
}) {
  const attempts = useMemo(() => myOwnAttempts(groupCode, hash), [groupCode, hash]);
  const intake = attempts.find((a) => a.phase === "intake");
  const exit = attempts.find((a) => a.phase === "exit");

  // Intake: only celebrate, no numbers (this is a measurement).
  if (phase === "intake" || !exit || !intake) {
    return (
      <div className="mt-8 rounded-xl border border-primary/40 bg-primary/5 p-6">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <h1 className="mt-3 text-2xl font-semibold">Baseline recorded.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks. Your answers are anonymous — codename only, no account. You'll see your own
          before/after after the exit measurement at the end of the week.
        </p>
        <button
          onClick={onEnterCity}
          className="mt-5 rounded-md border-2 border-primary bg-primary px-4 py-2 stencil text-[10px] text-primary-foreground"
        >
          ENTER THE CITY <ArrowRight className="inline h-3 w-3 ml-1" />
        </button>
      </div>
    );
  }

  // Exit + intake both present: show the personal before/after.
  const accPre = Math.round((intake.metrics.accuracy / 6) * 100);
  const accPost = Math.round((exit.metrics.accuracy / 6) * 100);
  const gapPre = intake.metrics.calibrationGap;
  const gapPost = exit.metrics.calibrationGap;
  const handler = pickHandlerLine(accPost - accPre, Math.abs(gapPost) - Math.abs(gapPre));

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
        <div className="stencil text-[10px] text-primary">YOUR DATA · CODENAME ONLY</div>
        <h1 className="mt-2 text-2xl font-semibold">Before → After</h1>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <MetricPair
            label="Accuracy"
            pre={`${accPre}%`}
            post={`${accPost}%`}
            good={accPost >= accPre}
          />
          <MetricPair
            label="Calibration gap"
            pre={`${gapPre}`}
            post={`${gapPost}`}
            good={Math.abs(gapPost) <= Math.abs(gapPre)}
          />
        </div>
      </div>
      <blockquote className="rounded-md border-l-2 border-primary bg-card p-4 text-sm italic text-muted-foreground">
        "{handler}" — Handler
      </blockquote>
      <button
        onClick={onEnterCity}
        className="w-full rounded-md border border-border bg-card px-4 py-3 stencil text-[10px] text-muted-foreground hover:text-foreground"
      >
        BACK TO THE CITY
      </button>
    </div>
  );
}

function MetricPair({
  label,
  pre,
  post,
  good,
}: {
  label: string;
  pre: string;
  post: string;
  good: boolean;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="stencil text-[10px] text-muted-foreground">{label.toUpperCase()}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-lg text-muted-foreground line-through">{pre}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className={`font-mono text-2xl ${good ? "text-primary" : "text-destructive"}`}>
          {post}
        </span>
      </div>
    </div>
  );
}

function pickHandlerLine(accDelta: number, gapDelta: number): string {
  if (accDelta >= 15 && gapDelta <= -5)
    return "Sharper AND more honest with yourself. That's the whole game.";
  if (accDelta >= 10)
    return "You're catching more of them. Keep the doubt tuned — not everything's a scam.";
  if (gapDelta <= -5)
    return "Same accuracy, better honesty about your certainty. That matters more than people think.";
  if (accDelta > 0) return "Small lift. Real people, real practice — the arc is long.";
  if (accDelta === 0) return "Flat this week. That's data too. Come back next module.";
  return "Off week. Rest, then rerun a few Mirror cases. Reps beat theory.";
}

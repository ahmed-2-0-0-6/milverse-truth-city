import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { registerFamilyCode, regenerateFamilyCode, fetchFamilyProgress, checkFamilyCodeJoin } from "@/lib/family.functions";
import { LESSONS, TOTAL_LESSONS, type JuniorTactic } from "@/lib/firstPhone/lessons";
import { loadFirstPhone, joinFamily } from "@/lib/firstPhone/profile";
import { manualDisplayForTactics } from "@/lib/firstPhone/tacticMap";
import { JUNIOR_COPY } from "@/lib/firstPhone/copy";
import { Users, Copy, Check, ShieldCheck, RefreshCw } from "lucide-react";

/** Threshold below which aggregated metrics are suppressed (k-anonymity). */
const K_ANON = 5;

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family Code — MILVERSE" },
      { name: "description", content: "Follow your kid's First Phone progress. You see skills, not chats." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FamilyPage,
});

const CODE_KEY = "milverse.family.parentCode";

function generateFamilyCode(): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // 5 chars so it passes the pilot code validator (4-6, alnum).
  let s = "";
  for (let i = 0; i < 5; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

type CloudEntry = { device_id: string; wing: string; case_id: string; result: string };

function FamilyPage() {
  // Hydration-safe: all localStorage reads live in useEffect.
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [kidJoinCode, setKidJoinCode] = useState("");
  const [entries, setEntries] = useState<CloudEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [kidState, setKidState] = useState(() => ({
    active: false, kidCityName: "", familyCode: null as string | null,
    lessonsCompleted: [] as number[], licenseIssuedAt: null as number | null, licenseNumber: null as string | null,
  }));
  const registerFn = useServerFn(registerFamilyCode);
  const regenerateFn = useServerFn(regenerateFamilyCode);
  const fetchProgress = useServerFn(fetchFamilyProgress);
  const joinCheckFn = useServerFn(checkFamilyCodeJoin);

  useEffect(() => {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved) setParentCode(saved);
    setKidState(loadFirstPhone());
    const on = () => setKidState(loadFirstPhone());
    window.addEventListener("milverse:firstphone", on);
    return () => window.removeEventListener("milverse:firstphone", on);
  }, []);

  const refresh = useCallback(async (code: string) => {
    setErr(null);
    try {
      const r = await fetchProgress({ data: { code } });
      setEntries((r.entries ?? []) as CloudEntry[]);
    } catch (e) {
      setErr((e as Error).message);
      setEntries([]);
    }
  }, [fetchProgress]);

  useEffect(() => {
    if (parentCode) refresh(parentCode);
  }, [parentCode, refresh]);

  async function createCode() {
    setBusy(true); setErr(null);
    try {
      const c = generateFamilyCode();
      await registerFn({ data: { code: c } });
      localStorage.setItem(CODE_KEY, c);
      setParentCode(c);
      toast.success("Family code created", { description: `Share ${c} with your kid.` });
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      toast.error("Couldn't create code", { description: msg });
    }
    setBusy(false);
  }

  async function regenerate() {
    if (!parentCode) return;
    setBusy(true); setErr(null);
    try {
      const c = generateFamilyCode();
      await regenerateFn({ data: { oldCode: parentCode, newCode: c } });
      localStorage.setItem(CODE_KEY, c);
      setParentCode(c);
      setEntries([]);
      toast.success("New family code issued", { description: `Old code retired. New code: ${c}.` });
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      toast.error("Couldn't regenerate code", { description: msg });
    }
    setBusy(false);
  }

  async function joinAsKid() {
    const code = kidJoinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,6}$/.test(code)) {
      toast.error("Enter a 4-6 character code");
      return;
    }
    setErr(null);
    try {
      await joinCheckFn({ data: { code } });
      joinFamily(code);
      setKidJoinCode("");
      toast.success(`Linked to family ${code}`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      toast.error("Couldn't join family", { description: msg });
    }
  }

  // Aggregate: only junior lesson entries count. Case IDs are like junior:L3:xxx.
  const juniorEntries = entries.filter((e) => e.case_id.startsWith("junior:L"));
  const lessonsDone = new Set<number>();
  juniorEntries.forEach((e) => {
    const m = e.case_id.match(/^junior:L(\d+)/);
    if (m) lessonsDone.add(parseInt(m[1], 10));
  });
  const lessonList = Array.from(lessonsDone).sort((a, b) => a - b);
  const licenseIssued = lessonsDone.has(10);

  // Real tactic mastery: unique tactics across the completed lessons, shown
  // with their Field Manual display names (bridge between junior + adult).
  const tacticSet = new Set<JuniorTactic>();
  lessonList.forEach((n) => {
    const lesson = LESSONS.find((l) => l.n === n);
    lesson?.cases.forEach((c) => tacticSet.add(c.tactic));
  });
  const tacticsDisplay = manualDisplayForTactics([...tacticSet]);
  const tacticsMastered = tacticsDisplay.length;

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">← CITY</Link>

        <div className="mt-6">
          <div className="font-mono text-[11px] tracking-widest text-primary">FAMILY CODE</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Skills, not chats.</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Create a code, share it with your kid, and follow their progress through the First Phone Program.
            You'll see lessons completed, skills mastered, and the license status — <strong>never message content</strong>.
          </p>
          <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-2 text-sm italic text-primary">
            "{JUNIOR_COPY.promise}"
          </div>
        </div>

        {/* Parent: create/copy code */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-4 w-4" />
            <span className="font-mono text-[10px] tracking-widest">PARENT</span>
          </div>
          {!parentCode ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Generate a family code, then share it with your kid.</p>
              <button onClick={createCode} disabled={busy} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {busy ? "Creating…" : "Create family code"}
              </button>
              {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
            </>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="rounded-md border border-primary/40 bg-primary/5 px-5 py-3 font-mono text-2xl tracking-[0.3em] text-primary">
                  {parentCode}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(parentCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm"
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={() => refresh(parentCode)} className="text-xs text-muted-foreground hover:text-foreground">
                  Refresh
                </button>
                <button
                  onClick={regenerate}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-md border border-caution/50 bg-caution/10 px-3 py-2 text-xs text-caution disabled:opacity-50"
                  title="Generate a new code. The old one immediately stops working."
                >
                  <RefreshCw className="h-3 w-3" /> Regenerate
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Have your kid paste this into the box below on their device. Regenerating invalidates the old code server-side.
              </p>
              {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
            </>
          )}
        </section>

        {/* Kid: join */}
        <section className="mt-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-mono text-[10px] tracking-widest">KID · JOIN A CODE</span>
          </div>
          {kidState.familyCode ? (
            <p className="mt-2 text-sm">Joined family code <span className="font-mono text-primary">{kidState.familyCode}</span>.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={kidJoinCode}
                onChange={(e) => setKidJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={6}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono tracking-widest w-40"
              />
              <button onClick={joinAsKid} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Join
              </button>
            </div>
          )}
        </section>

        {/* Dashboard — ONLY skills, badges, calibration arrow, license status. */}
        {parentCode && (
          <section className="mt-4 rounded-2xl border-2 border-primary/40 bg-card p-6">
            <div className="font-mono text-[10px] tracking-widest text-primary">DASHBOARD · CODE {parentCode}</div>

            {juniorEntries.length < K_ANON ? (
              <div className="mt-4 rounded-md border border-caution/40 bg-caution/5 p-4 text-sm">
                <div className="font-mono text-[10px] tracking-widest text-caution mb-1">NOT ENOUGH DATA YET</div>
                <p className="text-muted-foreground">
                  Aggregated metrics are shown when the group is larger (at least {K_ANON} completed entries).
                  Currently: {juniorEntries.length}.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox label="LESSONS" value={`${lessonList.length} / ${TOTAL_LESSONS}`} />
                  <StatBox label="TACTICS" value={String(tacticsMastered)} />
                  <StatBox label="TREND" value={lessonList.length >= 3 ? "↑ improving" : "warming up"} />
                  <StatBox label="LICENSE" value={licenseIssued ? "ISSUED" : "in progress"} tone={licenseIssued ? "good" : undefined} />
                </div>

                <div className="mt-6">
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">LESSONS COMPLETED</div>
                  <ul className="space-y-1.5">
                    {LESSONS.map((l) => {
                      const done = lessonList.includes(l.n);
                      return (
                        <li key={l.n} className={`flex items-center gap-3 text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${done ? "bg-primary text-primary-foreground" : "border border-border"}`}>
                            {done ? "✓" : l.n}
                          </span>
                          <span>{l.title}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {tacticsDisplay.length > 0 && (
                  <div className="mt-6">
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">TACTICS MASTERED · FIELD MANUAL</div>
                    <ul className="flex flex-wrap gap-2">
                      {tacticsDisplay.map((t) => (
                        <li key={t} className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <p className="mt-6 text-xs text-muted-foreground italic border-t border-border pt-4">
              What you see: lesson count, skills mastered, calibration trend, license status. Day-level activity only — no exact timestamps.<br />
              What you don't: message content, conversations, per-answer detail. By design.
            </p>
            <p className="mt-3 text-[11px] italic text-muted-foreground">
              Certifies completion of a learning pathway. Not a guarantee of online safety — the training continues in real life.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className={`rounded-md border p-3 text-center ${tone === "good" ? "border-primary bg-primary/10" : "border-border bg-background/40"}`}>
      <div className={`text-xl font-semibold ${tone === "good" ? "text-primary" : ""}`}>{value}</div>
      <div className="stencil text-[9px] tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

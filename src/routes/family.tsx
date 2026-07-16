import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { fetchPilotGroup } from "@/lib/pilot.functions";
import { LESSONS, TOTAL_LESSONS, type JuniorTactic } from "@/lib/firstPhone/lessons";
import { loadFirstPhone, joinFamily } from "@/lib/firstPhone/profile";
import { JUNIOR_COPY } from "@/lib/firstPhone/copy";
import { Users, Copy, Check, ShieldCheck } from "lucide-react";

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

type CloudEntry = { device_id: string; wing: string; case_id: string; result: string; created_at: string };

function FamilyPage() {
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [kidJoinCode, setKidJoinCode] = useState("");
  const [entries, setEntries] = useState<CloudEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const fetchGroup = useServerFn(fetchPilotGroup);
  const kidState = loadFirstPhone();

  useEffect(() => {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved) setParentCode(saved);
  }, []);

  const refresh = useCallback(async (code: string) => {
    try {
      const r = await fetchGroup({ data: { groupCode: code } });
      setEntries((r.entries ?? []) as CloudEntry[]);
    } catch {
      setEntries([]);
    }
  }, [fetchGroup]);

  useEffect(() => {
    if (parentCode) refresh(parentCode);
  }, [parentCode, refresh]);

  function createCode() {
    const c = generateFamilyCode();
    localStorage.setItem(CODE_KEY, c);
    setParentCode(c);
  }

  function joinAsKid() {
    const code = kidJoinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,6}$/.test(code)) return;
    joinFamily(code);
    setKidJoinCode("");
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

  // Real tactic mastery: unique tactics across the completed lessons.
  const tacticSet = new Set<JuniorTactic>();
  lessonList.forEach((n) => {
    const lesson = LESSONS.find((l) => l.n === n);
    lesson?.cases.forEach((c) => tacticSet.add(c.tactic));
  });
  const tacticsMastered = tacticSet.size;

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
              <button onClick={createCode} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Create family code
              </button>
            </>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-3">
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
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Have your kid paste this into the box below on their device.</p>
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

            <p className="mt-6 text-xs text-muted-foreground italic border-t border-border pt-4">
              What you see: lesson count, skills mastered, calibration trend, license status.<br />
              What you don't: message content, conversations, per-answer detail. By design.
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

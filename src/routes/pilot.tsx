import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import {
  getActiveGroup, setActiveGroup, generateGroupCode,
  loadPilotLog, summarize, type PilotEntry,
} from "@/lib/pilot";
import { Users, Copy, Check, LogOut, Plus } from "lucide-react";

export const Route = createFileRoute("/pilot")({
  head: () => ({
    meta: [
      { title: "Pilot Mode — MILVERSE" },
      { name: "description", content: "Group codes and calibration dashboard for classroom pilots." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PilotPage,
});

function PilotPage() {
  const [active, setActive] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [log, setLog] = useState<PilotEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const g = getActiveGroup();
      setActive(g);
      setLog(g ? loadPilotLog(g) : []);
    };
    refresh();
    window.addEventListener("milverse:pilot", refresh);
    window.addEventListener("milverse:profile", refresh);
    return () => {
      window.removeEventListener("milverse:pilot", refresh);
      window.removeEventListener("milverse:profile", refresh);
    };
  }, []);

  function create() {
    const c = generateGroupCode();
    setActiveGroup(c);
  }
  function join() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setActiveGroup(c);
    setCode("");
  }
  function leave() {
    setActiveGroup(null);
  }
  function copy() {
    if (!active) return;
    navigator.clipboard?.writeText(active);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const s = summarize(log);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
          ← CITY
        </Link>

        <div className="mt-4 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">PILOT MODE · FACILITATOR</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Run a classroom pilot</h1>
          <p className="mt-3 text-muted-foreground">
            Create a group code, share it with your students, and every case they play
            on this device tags their outcomes into a shared calibration view.
            No accounts, no PII, session-local — safe for schools, teachers, and
            newsroom trainings.
          </p>
        </div>

        {!active ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button
              onClick={create}
              className="rounded-xl border border-primary/40 bg-primary/10 p-6 text-left hover:border-primary transition"
            >
              <Plus className="h-5 w-5 text-primary mb-3" />
              <div className="font-semibold">Create a new group</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Generates a 5-character code you can read out loud.
              </div>
            </button>
            <div className="rounded-xl border border-border bg-card p-6">
              <Users className="h-5 w-5 text-primary mb-3" />
              <div className="font-semibold">Join an existing group</div>
              <div className="mt-3 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && join()}
                  placeholder="CODE"
                  maxLength={6}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest outline-none focus:border-primary"
                />
                <button
                  onClick={join}
                  disabled={code.trim().length < 4}
                  className="rounded-md bg-primary px-4 text-primary-foreground text-xs font-mono tracking-widest disabled:opacity-40"
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-xl border border-primary/40 bg-primary/5 p-6">
              <div className="font-mono text-[10px] tracking-widest text-primary">ACTIVE GROUP</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="font-mono text-4xl tracking-widest text-foreground">{active}</div>
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-mono tracking-widest text-primary"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "COPIED" : "COPY"}
                </button>
                <button
                  onClick={leave}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-mono tracking-widest text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3 w-3" /> LEAVE
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Every case played on this device is now anonymously counted toward
                group <span className="font-mono text-foreground">{active}</span>.
                Share the code so students can join on their own devices — each
                device sees its own tally locally.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <Stat label="CASES" value={s.total} />
              <Stat label="CORRECT" value={s.correct} accent />
              <Stat label="MISSED SCAMS" value={s.missed} bad={s.missed > 0} />
              <Stat label="FALSE ALARMS" value={s.falseAlarm} bad={s.falseAlarm > 0} />
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              <div className="font-mono text-xs tracking-widest text-muted-foreground">GROUP CALIBRATION</div>
              <div className="mt-2 text-2xl font-semibold">{s.calibration}</div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Miss rate (too trusting)</div>
                  <div className="font-mono">{(s.missRate * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">False-alarm rate (too paranoid)</div>
                  <div className="font-mono">{(s.faRate * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">RECENT OUTCOMES</div>
              {log.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No cases yet. <Link to="/mirror" className="text-primary underline">Open The Mirror</Link> or{" "}
                  <Link to="/feed" className="text-primary underline">The Feed</Link> to start.
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {log.slice().reverse().slice(0, 25).map((e, i) => (
                    <li key={i} className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">
                        <span className="text-primary">{e.wing.toUpperCase()}</span> · {e.caseId}
                      </span>
                      <span className={
                        e.result === "correct" ? "text-primary" :
                        e.result === "lucky_guess" ? "text-caution" : "text-destructive"
                      }>
                        {e.result.replace("_", " ").toUpperCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Link to="/mirror" className="flex-1 rounded-md bg-primary py-3 text-center font-mono text-xs tracking-widest text-primary-foreground">
                PLAY THE MIRROR →
              </Link>
              <Link to="/feed" className="flex-1 rounded-md border border-primary/40 bg-primary/10 py-3 text-center font-mono text-xs tracking-widest text-primary">
                PLAY THE FEED →
              </Link>
            </div>
          </>
        )}

        <p className="mt-10 text-xs font-mono tracking-widest text-muted-foreground text-center">
          NO ACCOUNTS · NO PII · SESSION-LOCAL · SAFE FOR SCHOOLS
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, accent, bad }: { label: string; value: number; accent?: boolean; bad?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${
        accent ? "text-primary" : bad ? "text-destructive" : ""
      }`}>{value}</div>
    </div>
  );
}

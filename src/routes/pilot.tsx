import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import {
  getActiveGroup, setActiveGroup, generateGroupCode,
  loadPilotLog, summarize, getDeviceId, type PilotEntry,
} from "@/lib/pilot";
import { fetchPilotGroup } from "@/lib/pilot.functions";
import { Users, Copy, Check, LogOut, Plus, Download, RefreshCw } from "lucide-react";

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

type CloudEntry = {
  device_id: string;
  wing: "mirror" | "feed";
  case_id: string;
  tier: number | null;
  result: "correct" | "missed_scam" | "false_alarm" | "lucky_guess" | "pyrrhic";
  points: number;
  probe_stats: unknown;
  created_at: string;
};

const SAMPLE_ENTRIES: CloudEntry[] = (() => {
  // Deterministic ~24-entry synthetic group showing before/after calibration lift.
  // Devices D1/D2/D3 each get 8 cases: shaky early, better late.
  const now = Date.now();
  const rows: CloudEntry[] = [];
  const devices = ["SAMPLE-D1", "SAMPLE-D2", "SAMPLE-D3"];
  const wings: ("mirror" | "feed")[] = ["mirror", "feed", "mirror", "feed", "mirror", "feed", "mirror", "feed"];
  const cases = ["survivor-bankfraud", "flood-photo", "pk-prize-sms", "bank-rumor", "pk-wrong-txn", "unbelievable-true", "recalled-medicine", "job-circular"];
  // Early results: mixed misses + false alarms. Later: mostly correct.
  const arc: CloudEntry["result"][] = ["missed_scam", "false_alarm", "missed_scam", "correct", "correct", "correct", "correct", "correct"];
  const pointsByResult: Record<CloudEntry["result"], number> = { correct: 105, missed_scam: -50, false_alarm: -30, lucky_guess: 25, pyrrhic: -10 };
  devices.forEach((d, di) => {
    for (let i = 0; i < 8; i++) {
      // Slight variation per device so D3 lags a little behind.
      const r = di === 2 && i < 4 ? (i % 2 === 0 ? "missed_scam" : "false_alarm") : arc[i];
      rows.push({
        device_id: d, wing: wings[i], case_id: cases[i],
        tier: ((i % 3) + 1) as 1 | 2 | 3,
        result: r, points: pointsByResult[r],
        probe_stats: null,
        created_at: new Date(now - (24 - (di * 8 + i)) * 60 * 60 * 1000).toISOString(),
      });
    }
  });
  return rows;
})();

function PilotPage() {
  const [active, setActive] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [log, setLog] = useState<PilotEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [cloud, setCloud] = useState<CloudEntry[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudErr, setCloudErr] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const fetchGroup = useServerFn(fetchPilotGroup);

  const refreshLocal = useCallback(() => {
    const g = getActiveGroup();
    setActive(g);
    setLog(g ? loadPilotLog(g) : []);
  }, []);

  const refreshCloud = useCallback(async () => {
    if (sample) return;
    const g = getActiveGroup();
    if (!g) { setCloud([]); return; }
    setCloudBusy(true);
    setCloudErr(null);
    try {
      const res = await fetchGroup({ data: { groupCode: g } as never });
      setCloud(((res as { entries: CloudEntry[] }).entries) ?? []);
    } catch {
      setCloudErr("Couldn't reach the pilot service — showing local data only.");
    }
    setCloudBusy(false);
  }, [fetchGroup, sample]);

  useEffect(() => {
    refreshLocal();
    void refreshCloud();
    const on = () => { refreshLocal(); void refreshCloud(); };
    window.addEventListener("milverse:pilot", on);
    window.addEventListener("milverse:profile", on);
    const t = setInterval(() => { void refreshCloud(); }, 15_000);
    return () => {
      window.removeEventListener("milverse:pilot", on);
      window.removeEventListener("milverse:profile", on);
      clearInterval(t);
    };
  }, [refreshLocal, refreshCloud]);

  function create() { setActiveGroup(generateGroupCode()); }
  function join() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setActiveGroup(c);
    setCode("");
  }
  function leave() { setActiveGroup(null); }
  function copy() {
    if (!active) return;
    navigator.clipboard?.writeText(active);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const effectiveCloud = sample ? SAMPLE_ENTRIES : cloud;

  // Prefer cloud data when it has more entries; otherwise fall back to local.
  const preferCloud = effectiveCloud.length >= log.length && effectiveCloud.length > 0;
  const merged: PilotEntry[] = useMemo(() => {
    if (preferCloud) {
      return effectiveCloud.map((c) => ({
        wing: c.wing, caseId: c.case_id,
        tier: (c.tier ?? undefined) as PilotEntry["tier"],
        result: c.result, points: c.points,
        ts: new Date(c.created_at).getTime(),
      }));
    }
    return log;
  }, [preferCloud, effectiveCloud, log]);

  const s = summarize(merged);
  const myDeviceId = getDeviceId();
  const players = useMemo(() => {
    const set = new Set<string>();
    effectiveCloud.forEach((c) => set.add(c.device_id));
    if (!sample) set.add(myDeviceId);
    return set.size;
  }, [effectiveCloud, myDeviceId, sample]);

  // Before/after per-device calibration: FIRST 3 vs LAST 3 completed cases.
  const beforeAfter = useMemo(() => {
    const byDevice = new Map<string, CloudEntry[]>();
    cloud.forEach((c) => {
      const list = byDevice.get(c.device_id) ?? [];
      list.push(c);
      byDevice.set(c.device_id, list);
    });
    const scoreOf = (list: CloudEntry[]) => {
      if (!list.length) return null;
      const n = list.length;
      const miss = list.filter((e) => e.result === "missed_scam").length / n;
      const fa = list.filter((e) => e.result === "false_alarm" || e.result === "pyrrhic").length / n;
      // Calibration score: 100 - (miss+fa)*100. Higher = better.
      return Math.max(0, Math.round(100 - (miss + fa) * 100));
    };
    let sumBefore = 0, sumAfter = 0, count = 0;
    byDevice.forEach((entries) => {
      if (entries.length < 4) return; // need enough to compare
      const first3 = entries.slice(0, 3);
      const last3 = entries.slice(-3);
      const b = scoreOf(first3);
      const a = scoreOf(last3);
      if (b == null || a == null) return;
      sumBefore += b;
      sumAfter += a;
      count += 1;
    });
    if (count === 0) return null;
    return {
      before: Math.round(sumBefore / count),
      after: Math.round(sumAfter / count),
      devices: count,
    };
  }, [cloud]);

  function exportCsv() {
    const rows = [
      ["ts_iso", "device_id", "wing", "case_id", "tier", "result", "points"].join(","),
      ...cloud.map((c) => [
        c.created_at,
        c.device_id,
        c.wing,
        c.case_id,
        c.tier ?? "",
        c.result,
        c.points,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilot-${active}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
            Create a group code, share it with your students, and every case they play — on
            any device — aggregates anonymously into this dashboard.
            No accounts, no PII. Safe for schools, teachers, and newsroom trainings.
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
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] tracking-widest text-primary">ACTIVE GROUP</div>
                <button
                  onClick={() => void refreshCloud()}
                  disabled={cloudBusy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] font-mono tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="Refresh from cloud"
                >
                  <RefreshCw className={`h-3 w-3 ${cloudBusy ? "animate-spin" : ""}`} /> REFRESH
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="font-mono text-4xl tracking-widest text-foreground">{active}</div>
                <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-mono tracking-widest text-primary">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "COPIED" : "COPY"}
                </button>
                <button onClick={leave} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-mono tracking-widest text-muted-foreground hover:text-foreground">
                  <LogOut className="h-3 w-3" /> LEAVE
                </button>
                {cloud.length > 0 && (
                  <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-mono tracking-widest text-muted-foreground hover:text-foreground">
                    <Download className="h-3 w-3" /> CSV
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Share the code so students can join on their own devices. Each device logs its
                outcomes to group <span className="font-mono text-foreground">{active}</span>.
                {cloudErr && <span className="block mt-1 text-caution text-xs">{cloudErr}</span>}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-5">
              <Stat label="PLAYERS" value={players} accent />
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

            {beforeAfter && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="font-mono text-xs tracking-widest text-primary">
                  BEFORE / AFTER · CALIBRATION SCORE
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-xs text-muted-foreground">First 3 cases</div>
                    <div className="mt-1 font-mono text-4xl">{beforeAfter.before}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs text-muted-foreground">DELTA</div>
                    <div className={`mt-1 font-mono text-2xl ${
                      beforeAfter.after > beforeAfter.before ? "text-primary" :
                      beforeAfter.after < beforeAfter.before ? "text-destructive" : ""
                    }`}>
                      {beforeAfter.after > beforeAfter.before ? "+" : ""}{beforeAfter.after - beforeAfter.before}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Most recent 3</div>
                    <div className="mt-1 font-mono text-4xl">{beforeAfter.after}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Averaged across {beforeAfter.devices} device{beforeAfter.devices === 1 ? "" : "s"} with 4+ completed cases.
                  Higher = fewer missed scams and false alarms per case.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-border bg-card p-6">
              <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
                RECENT OUTCOMES · {preferCloud ? "LIVE (cloud)" : "LOCAL"}
              </div>
              {merged.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No cases yet. <Link to="/mirror" className="text-primary underline">Open The Mirror</Link> or{" "}
                  <Link to="/feed" className="text-primary underline">The Feed</Link> to start.
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {merged.slice().reverse().slice(0, 25).map((e, i) => (
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
          NO ACCOUNTS · NO TRACKING · ANONYMOUS BY DESIGN · SAFE FOR SCHOOLS
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

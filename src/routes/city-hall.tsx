import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import {
  loadProfile,
  calibrationLabel,
  operatorRank,
  operatorCallsign,
  type TrustProfile,
} from "@/lib/mirror/profile";

export const Route = createFileRoute("/city-hall")({
  head: () => ({
    meta: [
      { title: "Operator Dossier — MILVERSE" },
      { name: "description", content: "Your Trust Calibration profile and field rank." },
    ],
  }),
  component: CityHall,
});

function CityHall() {
  const [p, setP] = useState<TrustProfile | null>(null);
  useEffect(() => setP(loadProfile()), []);

  if (!p) {
    return (
      <div>
        <TopBar />
        <div className="p-8 stencil text-xs text-muted-foreground">// LOADING DOSSIER…</div>
      </div>
    );
  }

  const cal = calibrationLabel(p);
  const rank = operatorRank(p);
  const call = operatorCallsign(p);
  const total = Math.max(1, p.casesPlayed);
  const missRate = p.missedScams / total;
  const faRate = p.falseAlarms / total;

  return (
    <div className="min-h-screen grain">
      <div className="pointer-events-none fixed inset-0 scanlines opacity-30" />
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-10 relative">
        <div className="mb-8 hud-frame border border-primary/30 bg-card/60 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="stencil text-[10px] text-primary">// OPERATOR DOSSIER · EYES ONLY</div>
            <div className="h-px flex-1 bg-primary/20" />
            <div className="stencil text-[10px] text-muted-foreground">{new Date().toISOString().slice(0, 10)}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <div className="stencil text-[10px] text-muted-foreground">CALLSIGN</div>
              <div className="text-3xl font-semibold text-primary tracking-wider">{call}</div>
            </div>
            <div>
              <div className="stencil text-[10px] text-muted-foreground">FIELD RANK</div>
              <div className="text-2xl font-semibold text-foreground">{rank.rank}</div>
              <div className="stencil text-[10px] text-muted-foreground mt-1">{rank.code}</div>
            </div>
            <div>
              <div className="stencil text-[10px] text-muted-foreground mb-1">
                {rank.next ? `PROGRESS → ${rank.next}` : "MAX RANK"}
              </div>
              <div className="h-2 w-full bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 shadow-[0_0_12px_oklch(0.82_0.16_85/0.6)]"
                  style={{ width: `${Math.round(rank.progress * 100)}%` }}
                />
              </div>
              <div className="stencil text-[10px] text-muted-foreground mt-1">
                {Math.round(rank.progress * 100)}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Stat label="CASES RUN" value={p.casesPlayed} />
          <Stat label="XP" value={p.points} accent />
          <Stat label="CALIBRATION" value={cal.label.toUpperCase()} accent={cal.tone === "good"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-sm border border-border bg-card p-6 hud-frame">
            <div className="stencil text-[10px] text-primary mb-4">
              // THREAT MATRIX · YOUR POSITION
            </div>

            <div className="mt-4 relative aspect-square max-w-xs mx-auto">
              <div className="grid grid-cols-2 gap-2 h-full">
                <Quadrant label="CALIBRATED" active={missRate < 0.2 && faRate < 0.2} tone="good" />
                <Quadrant label="TOO PARANOID" active={faRate >= 0.4 && missRate < 0.2} tone="warn" />
                <Quadrant label="TOO TRUSTING" active={missRate >= 0.4 && faRate < 0.2} tone="warn" />
                <Quadrant label="MISCALIBRATED" active={missRate >= 0.2 && faRate >= 0.2} tone="bad" />
              </div>
              {/* Player dot: x = missRate (→ too trusting), y = faRate (→ too paranoid, inverted) */}
              {p.casesPlayed > 0 && (
                <div
                  className="absolute h-4 w-4 rounded-full bg-primary shadow-[0_0_16px_oklch(0.82_0.15_210)] transition-all duration-700 -translate-x-1/2 -translate-y-1/2 ring-2 ring-background"
                  style={{
                    left: `${Math.min(0.95, Math.max(0.05, missRate * 2)) * 100}%`,
                    top: `${Math.min(0.95, Math.max(0.05, faRate * 2)) * 100}%`,
                  }}
                  title="You are here"
                />
              )}
            </div>
            <div className="mt-3 flex justify-between font-mono text-[9px] tracking-widest text-muted-foreground">
              <span>← FEWER MISSES</span>
              <span>MORE MISSES →</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">
              FAILURE MODES
            </div>
            <Row label="Missed Scams" value={p.missedScams} tone="bad" />
            <Row label="False Alarms" value={p.falseAlarms} tone="bad" />
            <Row label="Correct Verdicts" value={p.correctVerdicts} tone="good" />
            <Row label="Lucky Guesses" value={p.luckyGuesses} tone="warn" />
            <div className="mt-4 pt-4 border-t border-border">
              <Row label="Strong Probes" value={p.strongProbesTotal} tone="good" />
              <Row label="Weak Probes" value={p.weakProbesTotal} tone="warn" />
              <Row label="Wasted Pressure" value={p.wastedPressureTotal} tone="bad" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-4">
            RECENT CASES
          </div>
          {p.history.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No cases yet.{" "}
              <Link to="/mirror" className="text-primary underline-offset-4 hover:underline">
                Enter The Mirror →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {p.history.slice().reverse().slice(0, 10).map((h, i) => (
                <li key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="text-muted-foreground">{h.caseId}</span>
                  <span
                    className={
                      h.result === "correct"
                        ? "text-primary"
                        : h.result === "lucky_guess"
                          ? "text-caution"
                          : "text-destructive"
                    }
                  >
                    {h.result.replace("_", " ").toUpperCase()} · {h.points > 0 ? "+" : ""}
                    {h.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to="/"
          className="inline-flex font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← BACK TO CITY
        </Link>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-mono text-xs tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" }) {
  const c =
    tone === "good" ? "text-primary" : tone === "warn" ? "text-caution" : "text-destructive";
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${c}`}>{value}</span>
    </div>
  );
}

function Quadrant({
  label,
  active,
  tone,
}: {
  label: string;
  active: boolean;
  tone: "good" | "warn" | "bad";
}) {
  const toneBorder =
    tone === "good" ? "border-primary" : tone === "warn" ? "border-caution" : "border-destructive";
  const toneBg =
    tone === "good" ? "bg-primary/15" : tone === "warn" ? "bg-caution/15" : "bg-destructive/15";
  const toneText =
    tone === "good" ? "text-primary" : tone === "warn" ? "text-caution" : "text-destructive";
  return (
    <div
      className={`flex items-center justify-center rounded-md border p-2 text-center font-mono text-[10px] tracking-widest ${
        active ? `${toneBorder} ${toneBg} ${toneText}` : "border-border text-muted-foreground/60"
      }`}
    >
      {label}
    </div>
  );
}

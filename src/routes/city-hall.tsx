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
import { BADGES, loadEarnedBadges } from "@/lib/mirror/badges";
import { RecommendedStrip } from "@/components/RecommendedStrip";
import { fetchCityCensus, type CityCensus } from "@/lib/daily.functions";

type CensusState =
  | { kind: "loading" }
  | { kind: "loaded"; row: CityCensus }
  | { kind: "sealed" }
  | { kind: "offline" };


export const Route = createFileRoute("/city-hall")({
  head: () => ({
    meta: [
      { title: "City Hall — MILVERSE" },
      {
        name: "description",
        content: "Your record on the wall. Cases run, calls made, calibration honest.",
      },
    ],
  }),
  component: CityHall,
});

function CityHall() {
  const [p, setP] = useState<TrustProfile | null>(null);
  const [earned, setEarned] = useState<string[]>([]);
  const [census, setCensus] = useState<CensusState>({ kind: "loading" });
  useEffect(() => {
    setP(loadProfile());
    setEarned(loadEarnedBadges());
    const on = () => {
      setP(loadProfile());
      setEarned(loadEarnedBadges());
    };
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:badge", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:badge", on);
    };
  }, []);

  // Fetch once on mount. No polling. Quiet failure: cloud unreachable → offline line.
  useEffect(() => {
    let alive = true;
    fetchCityCensus()
      .then((res) => {
        if (!alive) return;
        if (res.row) setCensus({ kind: "loaded", row: res.row });
        else setCensus({ kind: "sealed" });
      })
      .catch(() => {
        if (alive) setCensus({ kind: "offline" });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!p) {
    return (
      <div>
        <TopBar />
        <div className="p-8 stencil text-xs text-muted-foreground">// LOADING PROFILE…</div>
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
        <RecommendedStrip />

        <StateOfTheCity census={census} />



        <div className="mb-8 hud-frame border border-primary/30 bg-card/60 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="stencil text-[10px] text-primary">// READER PROFILE · SESSION</div>
            <div className="h-px flex-1 bg-primary/20" />
            <div className="stencil text-[10px] text-muted-foreground">
              {new Date().toISOString().slice(0, 10)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <div className="stencil text-[10px] text-muted-foreground">HANDLE</div>
              <div className="text-3xl font-semibold text-primary tracking-wider">{call}</div>
            </div>
            <div>
              <div className="stencil text-[10px] text-muted-foreground">LITERACY LEVEL</div>
              <div className="text-2xl font-semibold text-foreground">{rank.rank}</div>
              <div className="stencil text-[10px] text-muted-foreground mt-1">{rank.code}</div>
            </div>
            <div>
              <div className="stencil text-[10px] text-muted-foreground mb-1">
                {rank.next ? `PROGRESS → ${rank.next}` : "MAX RANK"}
              </div>
              <div className="h-2 w-full bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 shadow-[0_0_12px_oklch(0.82_0.14_195/0.6)]"
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
              // CALIBRATION MATRIX · YOUR POSITION
            </div>

            <div className="mt-4 relative aspect-square max-w-xs mx-auto">
              <div className="grid grid-cols-2 gap-2 h-full">
                <Quadrant label="CALIBRATED" active={missRate < 0.2 && faRate < 0.2} tone="good" />
                <Quadrant
                  label="TOO PARANOID"
                  active={faRate >= 0.4 && missRate < 0.2}
                  tone="warn"
                />
                <Quadrant
                  label="TOO TRUSTING"
                  active={missRate >= 0.4 && faRate < 0.2}
                  tone="warn"
                />
                <Quadrant
                  label="MISCALIBRATED"
                  active={missRate >= 0.2 && faRate >= 0.2}
                  tone="bad"
                />
              </div>
              {/* Player dot: x = missRate (→ too trusting), y = faRate (→ too paranoid, inverted) */}
              {p.casesPlayed > 0 && (
                <div
                  className="absolute h-4 w-4 rounded-full bg-primary shadow-[0_0_18px_oklch(0.82_0.14_195)] transition-all duration-700 -translate-x-1/2 -translate-y-1/2 ring-2 ring-background"
                  style={{
                    left: `${Math.min(0.95, Math.max(0.05, missRate * 2)) * 100}%`,
                    top: `${Math.min(0.95, Math.max(0.05, faRate * 2)) * 100}%`,
                  }}
                  title="You are here"
                />
              )}
            </div>
            <div className="mt-3 flex justify-between stencil text-[9px] text-muted-foreground">
              <span>← FEWER MISSES</span>
              <span>MORE MISSES →</span>
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card p-6 hud-frame">
            <div className="stencil text-[10px] text-primary mb-4">
              // FAILURE MODES · POST-CASE REVIEW
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

        <div className="rounded-sm border border-border bg-card p-6 mb-6 hud-frame">
          <div className="stencil text-[10px] text-primary mb-4">
            // BADGE CASE · {earned.length}/{BADGES.length} EARNED
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGES.map((b) => {
              const has = earned.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`rounded-md border p-3 flex items-center gap-3 transition ${
                    has
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 bg-muted/30 opacity-50"
                  }`}
                  title={b.blurb}
                >
                  <div className={`text-2xl ${has ? "" : "grayscale"}`}>{b.emoji}</div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-semibold truncate ${has ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {b.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2">{b.blurb}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-6 mb-8 hud-frame">
          <div className="stencil text-[10px] text-primary mb-4">// CASE LOG · LAST 10</div>
          {p.history.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nothing logged yet.{" "}
              <Link to="/mirror" className="text-primary underline-offset-4 hover:underline">
                Open The Mirror →
              </Link>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {p.history
                .slice()
                .reverse()
                .slice(0, 10)
                .map((h, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm font-mono border-l-2 border-border pl-3 py-1 hover:border-primary transition-colors"
                  >
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
          className="inline-flex stencil text-[10px] text-muted-foreground hover:text-primary transition"
        >
          ← BACK TO HOME
        </Link>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 hud-frame">
      <div className="stencil text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "bad";
}) {
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

function StateOfTheCity({ census }: { census: CensusState }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="mb-8 hud-frame border border-primary/30 bg-card/60 rounded-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="stencil text-[10px] text-primary">
          // STATE OF THE CITY · CENSUS
        </div>
        <div className="h-px flex-1 bg-primary/20" />
        <div className="stencil text-[10px] text-muted-foreground">{today}</div>
      </div>

      {census.kind === "loading" && (
        <div className="stencil text-[10px] text-muted-foreground">
          // READING THE CENSUS…
        </div>
      )}

      {census.kind === "sealed" && (
        <div className="font-mono text-xs text-muted-foreground">
          THE CENSUS STAYS SEALED UNTIL FIVE WATCHERS ARE ON RECORD. A CITY OF FOUR IS A LINEUP.
        </div>
      )}

      {census.kind === "offline" && (
        <div className="font-mono text-xs text-muted-foreground">
          CENSUS OFFICE UNREACHABLE. THE CITY KEEPS ITS OWN BOOKS — YOURS ARE BELOW.
        </div>
      )}

      {census.kind === "loaded" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="CALLS LOGGED" value={census.row.drops_total} />
            <Stat label="CALLED RIGHT" value={`${census.row.drops_correct_pct}%`} accent />
            <Stat label="THIS WEEK" value={census.row.drops_last7} />
            <Stat label="WATCHERS ON RECORD" value={census.row.watchers} />
          </div>
          {(census.row.designer_cases >= 1 || census.row.hardest_case_id) && (
            <div className="mt-4 space-y-1 font-mono text-[11px] text-muted-foreground">
              {census.row.designer_cases >= 1 && (
                <div>
                  CITIZEN-DESIGNED CASES IN CIRCULATION: {census.row.designer_cases}.
                </div>
              )}
              {census.row.hardest_case_id && census.row.hardest_fooled_pct != null && (
                // Deliberate restraint: we do NOT print the case id. An id invites
                // targeting the case; the number is the story.
                <div>
                  HARDEST FILE ON THE STREET: a citizen design that fooled{" "}
                  {census.row.hardest_fooled_pct}% of everyone who touched it.
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-6 pt-5 border-t border-primary/15">
        <div className="stencil text-[10px] text-primary mb-3">
          // WHAT THE CITY DOES NOT COUNT
        </div>
        <ul className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
          <li>— Names. There is no field for them.</li>
          <li>— Message bodies. What you typed in a case never leaves your device.</li>
          <li>
            — Individual children. Family dashboards show skills, in groups of five or more, never
            conversations.
          </li>
          <li>
            — Faces or voices. The city records no user audio, video, or images — the microphone is
            never asked for.
          </li>
          <li>
            — Small groups. Any count under five people is suppressed at the database, not the
            screen.
          </li>
        </ul>
        <div className="mt-3 italic text-[11px] text-muted-foreground/80">
          A census that counted more would know less about trust.
        </div>
        <div className="mt-3">
          <Link
            to="/charter"
            className="stencil text-[10px] text-muted-foreground hover:text-primary transition"
          >
            THE FULL RULES → /charter
          </Link>
        </div>
      </div>
    </section>
  );
}


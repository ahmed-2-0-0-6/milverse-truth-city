// MILVERSE — /wall  The Case Wall.
// A corkboard-noir gallery of every closed case, stamped. Read-only across
// all four district profiles. Presentation only.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { CaseStampCard, type WallCard } from "@/components/wall/CaseStampCard";
import { loadProfile, type HistoryEntry, type DailyPlayEntry } from "@/lib/mirror/profile";
import { loadBossProfile, type BossAttempt } from "@/lib/boss/profile";
import { loadFeedWall, type FeedWallEntry } from "@/lib/feed/wall";
import { getScenario } from "@/lib/mirror/scenarios";
import { getFeedScenario } from "@/lib/feed/scenarios";
import { getBoss } from "@/lib/boss/scenarios";
import { caseForDate } from "@/lib/daily/rotation";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";
import { readTapes, clearTapes, type StoredTape } from "@/lib/mirror/tapes";
import { TapeReview } from "@/components/mirror/TapeReview";

export const Route = createFileRoute("/wall")({
  head: () => ({
    meta: [
      { title: "The Case Wall — MILVERSE" },
      {
        name: "description",
        content:
          "Every verdict you ever stamped. Wins are trophies. Losses stay on the wall — scar tissue teaches.",
      },
      { property: "og:title", content: "The Case Wall — MILVERSE" },
      {
        property: "og:description",
        content: "Every call you made. The city keeps receipts.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WallPage,
});

type District = "MIRROR" | "FEED" | "BOSS" | "DAILY";
type Outcome = "win" | "miss" | "false";

const DISTRICTS: District[] = ["MIRROR", "FEED", "BOSS", "DAILY"];
const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "win", label: "WINS" },
  { id: "miss", label: "MISSES" },
  { id: "false", label: "FALSE ALARMS" },
];

function tacticFor(tacticId: string | undefined): string | undefined {
  if (!tacticId) return undefined;
  const entry = MANUAL_ENTRIES.find((e) => e.id === tacticId);
  return entry ? `Tactic: ${entry.name}` : `Tactic: ${tacticId.toUpperCase()}`;
}

function fromMirror(h: HistoryEntry): WallCard | null {
  // Mirror history stores feed cases too (caseId "feed:..."). Skip — feed
  // wall log owns those.
  if (h.caseId.startsWith("feed:")) return null;
  const sc = getScenario(h.caseId);
  const title = sc?.title ?? "CASE FILE MISSING";
  const tacticId = sc?.tactic;
  let stampText = "CASE CLOSED";
  let stampTone: WallCard["stampTone"] = "green";
  let outcomeKind: WallCard["outcomeKind"] = "win";
  if (h.result === "missed_scam") {
    stampText = "TRANSACTED";
    stampTone = "red";
    outcomeKind = "miss";
  } else if (h.result === "false_alarm") {
    stampText = "FALSE ALARM";
    stampTone = "amber";
    outcomeKind = "false";
  } else if (h.result === "lucky_guess") {
    stampText = "LUCKY";
    stampTone = "white";
    outcomeKind = "lucky";
  }
  return {
    key: `mirror:${h.caseId}:${h.ts}`,
    district: "MIRROR",
    tierLabel: `T${h.tier}`,
    title,
    ts: h.ts,
    stampText,
    stampTone,
    verdictLine: `You said ${h.verdict} · Truth ${h.truth}`,
    points: h.points,
    tacticLine: outcomeKind === "miss" || outcomeKind === "false" ? tacticFor(tacticId) : undefined,
    outcomeKind,
  };
}

function fromFeed(e: FeedWallEntry): WallCard {
  const sc = getFeedScenario(e.caseId);
  const title = sc?.title ?? "CASE FILE MISSING";
  const tacticId = sc?.tacticId;
  const tierLabel = sc ? `T${sc.tier}` : "T?";
  let stampText = "CASE CLOSED";
  let stampTone: WallCard["stampTone"] = "green";
  let outcomeKind: WallCard["outcomeKind"] = "win";
  if (e.result === "missed_scam") {
    stampText = "TRANSACTED";
    stampTone = "red";
    outcomeKind = "miss";
  } else if (e.result === "false_alarm" || e.result === "pyrrhic") {
    stampText = "FALSE ALARM";
    stampTone = "amber";
    outcomeKind = "false";
  }
  const truth = sc?.verdict ?? "?";
  return {
    key: `feed:${e.caseId}:${e.ts}`,
    district: "FEED",
    tierLabel,
    title,
    ts: e.ts,
    stampText,
    stampTone,
    verdictLine: `You said ${e.verdict} · Truth ${truth}`,
    points: 0,
    tacticLine: outcomeKind !== "win" ? tacticFor(tacticId) : undefined,
    outcomeKind,
  };
}

function fromBoss(a: BossAttempt): WallCard {
  const boss = getBoss(a.bossId);
  const title = boss?.codename ?? "CASE FILE MISSING";
  const isWin = a.outcome === "WIN";
  let stampText: string;
  let stampTone: WallCard["stampTone"];
  let outcomeKind: WallCard["outcomeKind"];
  let verdictLine: string;
  if (isWin) {
    stampText = boss?.badge.id ?? "PROTOCOL WIN";
    stampTone = "gold";
    outcomeKind = "boss-win";
    verdictLine = a.winningMove
      ? `Winning move: ${a.winningMove.replace(/_/g, " ").toUpperCase()}`
      : "Protocol held.";
  } else if (a.outcome === "LOSS_TRANSACTED") {
    stampText = "TRANSACTED";
    stampTone = "red";
    outcomeKind = "miss";
    verdictLine = "You complied. The boss wins.";
  } else if (a.outcome === "LOSS_FALSE_ALARM") {
    stampText = "FALSE ALARM";
    stampTone = "amber";
    outcomeKind = "false";
    verdictLine = "Refused a real request. Bill still comes.";
  } else {
    stampText = "PARANOIA";
    stampTone = "amber";
    outcomeKind = "false";
    verdictLine = "Held too long. Damage done.";
  }
  return {
    key: `boss:${a.bossId}:${a.ts}`,
    district: "BOSS",
    tierLabel: boss?.threatRating ?? "☠",
    title,
    ts: a.ts,
    stampText,
    stampTone,
    verdictLine,
    points: 0,
    outcomeKind,
  };
}

function fromDaily(d: DailyPlayEntry): WallCard {
  let sc;
  try {
    sc = caseForDate(d.dateKey);
  } catch {
    sc = undefined;
  }
  const title = sc?.title ?? "CASE FILE MISSING";
  const tacticId = sc?.tacticId;
  let stampText = "CASE CLOSED";
  let stampTone: WallCard["stampTone"] = "green";
  let outcomeKind: WallCard["outcomeKind"] = "win";
  if (!d.correct) {
    if (d.truth === "SCAM" && d.verdict !== "SCAM") {
      stampText = "TRANSACTED";
      stampTone = "red";
      outcomeKind = "miss";
    } else {
      stampText = "FALSE ALARM";
      stampTone = "amber";
      outcomeKind = "false";
    }
  }
  return {
    key: `daily:${d.dateKey}:${d.ts}`,
    district: "DAILY",
    tierLabel: "DAILY",
    title,
    ts: d.ts,
    stampText,
    stampTone,
    verdictLine: `You said ${d.verdict} · Truth ${d.truth}`,
    points: d.delta,
    tacticLine: outcomeKind !== "win" ? tacticFor(tacticId) : undefined,
    outcomeKind,
  };
}

function WallPage() {
  const [cards, setCards] = useState<WallCard[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    winPct: 0,
    missed: 0,
    falseAlarms: 0,
    streak: 0,
  });
  const [districts, setDistricts] = useState<Set<District>>(new Set());
  const [outcomes, setOutcomes] = useState<Set<Outcome>>(new Set());
  const [announce, setAnnounce] = useState("");
  const [tapes, setTapes] = useState<StoredTape[]>([]);
  const [openTape, setOpenTape] = useState<StoredTape | null>(null);
  const [burnArmed, setBurnArmed] = useState(false);
  const burnTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const rebuild = () => {
      const p = loadProfile();
      const bp = loadBossProfile();
      const fw = loadFeedWall();
      const all: WallCard[] = [];
      for (const h of p.history) {
        const c = fromMirror(h);
        if (c) all.push(c);
      }
      for (const e of fw) all.push(fromFeed(e));
      for (const a of bp.attempts) all.push(fromBoss(a));
      for (const d of p.dailyPlays) all.push(fromDaily(d));
      all.sort((a, b) => b.ts - a.ts);
      setCards(all);
      setSummary({
        total: p.casesPlayed,
        winPct: p.casesPlayed ? Math.round((p.correctVerdicts / p.casesPlayed) * 100) : 0,
        missed: p.missedScams,
        falseAlarms: p.falseAlarms,
        streak: p.dailyStreak,
      });
      setTapes(readTapes());
    };
    rebuild();
    const on = () => rebuild();
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:boss", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:boss", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (districts.size > 0 && !districts.has(c.district)) return false;
      if (outcomes.size > 0) {
        const kind =
          c.outcomeKind === "win" || c.outcomeKind === "boss-win" || c.outcomeKind === "lucky"
            ? "win"
            : c.outcomeKind === "miss"
              ? "miss"
              : "false";
        if (!outcomes.has(kind)) return false;
      }
      return true;
    });
  }, [cards, districts, outcomes]);

  const tapeIndex = useMemo(() => {
    const m = new Map<string, StoredTape>();
    for (const t of tapes) m.set(`${t.caseId}:${t.ts}`, t);
    return m;
  }, [tapes]);

  const tapeForCard = (c: WallCard): StoredTape | null => {
    if (c.district !== "MIRROR") return null;
    // WallCard.key for Mirror is `mirror:{caseId}:{ts}`; tape keys on the raw caseId+ts.
    const caseId = c.key.split(":").slice(1, -1).join(":");
    return tapeIndex.get(`${caseId}:${c.ts}`) ?? null;
  };

  const armedTimeoutMs = 4000;
  const armBurn = () => {
    setBurnArmed(true);
    if (burnTimerRef.current) window.clearTimeout(burnTimerRef.current);
    burnTimerRef.current = window.setTimeout(() => setBurnArmed(false), armedTimeoutMs);
  };
  const doBurn = () => {
    if (burnTimerRef.current) window.clearTimeout(burnTimerRef.current);
    clearTapes();
    setTapes([]);
    setBurnArmed(false);
    setOpenTape(null);
  };
  useEffect(
    () => () => {
      if (burnTimerRef.current) window.clearTimeout(burnTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (districts.size === 0 && outcomes.size === 0) {
      setAnnounce("");
      return;
    }
    setAnnounce(`${filtered.length} cases shown.`);
  }, [filtered.length, districts, outcomes]);

  const toggleD = (d: District) =>
    setDistricts((s) => {
      const n = new Set(s);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });
  const toggleO = (o: Outcome) =>
    setOutcomes((s) => {
      const n = new Set(s);
      n.has(o) ? n.delete(o) : n.add(o);
      return n;
    });

  const chipCls = (active: boolean) =>
    `px-3 py-1.5 stencil text-[10px] tracking-widest rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active
        ? "bg-primary/15 border-primary/50 text-primary"
        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
    }`;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(2,4,10,0.94), rgba(2,4,10,0.97)), url(/src/assets/corkboard.jpg)`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <TopBar />

      <main className="mx-auto max-w-6xl px-4 py-8 relative">
        {/* red string overlay, decorative */}
        <div className="evidence-strings" aria-hidden="true" />
        <header className="mb-6 relative">
          <div className="flex items-center gap-2">
            <span className="pushpin" aria-hidden="true" />
            <div className="stencil text-[10px] tracking-widest text-muted-foreground">
              EVIDENCE ROOM
            </div>
          </div>
          <h1 className="stencil mt-1 text-2xl sm:text-3xl text-foreground">THE CASE WALL</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every call you made. The city keeps receipts.
          </p>
        </header>

        {/* Summary strip */}
        <section className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <SummaryStat label="Closed" value={summary.total} />
          <SummaryStat label="Win %" value={`${summary.winPct}%`} />
          <SummaryStat label="Missed" value={summary.missed} tone="red" />
          <SummaryStat label="False alarms" value={summary.falseAlarms} tone="amber" />
          <SummaryStat label="Streak" value={summary.streak} />
        </section>

        {/* Filters */}
        <section className="mb-4 space-y-2" aria-label="Filters">
          <div className="flex flex-wrap items-center gap-2">
            <span className="stencil text-[10px] tracking-widest text-muted-foreground mr-1">
              DISTRICT
            </span>
            <button
              type="button"
              onClick={() => setDistricts(new Set())}
              aria-pressed={districts.size === 0}
              className={chipCls(districts.size === 0)}
            >
              ALL
            </button>
            {DISTRICTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleD(d)}
                aria-pressed={districts.has(d)}
                className={chipCls(districts.has(d))}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="stencil text-[10px] tracking-widest text-muted-foreground mr-1">
              OUTCOME
            </span>
            {OUTCOMES.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => toggleO(o.id)}
                aria-pressed={outcomes.has(o.id)}
                className={chipCls(outcomes.has(o.id))}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {announce}
          </div>
        </section>

        {/* Wall */}
        {cards.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-md border border-dashed border-border p-8 text-center">
            <div className="stencil text-[10px] tracking-widest text-muted-foreground">
              EMPTY BOARD
            </div>
            <p className="mt-3 text-sm text-foreground">
              No cases closed yet. The city is waiting to find out what you are.
            </p>
            <Link
              to="/mirror"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground"
            >
              TAKE A CASE →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
            No cases match those filters.
          </div>
        ) : (
          <div
            role="list"
            aria-label="Closed cases"
            className="[column-fill:_balance] columns-1 sm:columns-2 lg:columns-3 gap-4"
          >
            {filtered.map((c, i) => {
              const t = tapeForCard(c);
              return (
                <div role="listitem" key={c.key} className="relative">
                  <CaseStampCard
                    card={c}
                    index={i}
                    onOpenTape={t ? () => setOpenTape(t) : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}

        {tapes.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={burnArmed ? doBurn : armBurn}
              className={`stencil text-[10px] tracking-widest rounded-md border px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive ${
                burnArmed
                  ? "border-destructive/60 text-destructive bg-destructive/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              aria-label={burnArmed ? `Confirm burn all ${tapes.length} tapes` : "Burn the tapes"}
            >
              {burnArmed ? `SURE? BURN ALL ${tapes.length}` : "BURN THE TAPES"}
            </button>
          </div>
        )}
      </main>

      {openTape ? (() => {
        const sc = getScenario(openTape.caseId);
        if (!sc) return null;
        return (
          <TapeReview
            scenario={sc}
            messages={openTape.messages}
            result={openTape.result}
            onClose={() => setOpenTape(null)}
          />
        );
      })() : null}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "red" | "amber";
}) {
  const toneCls =
    tone === "red" ? "text-destructive" : tone === "amber" ? "text-caution" : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="stencil text-[9px] tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

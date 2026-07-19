import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import {
  loadProfile,
  calibrationLabel,
  operatorCallsign,
  type TrustProfile,
} from "@/lib/mirror/profile";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp } from "@/lib/ranks";
import { lifetimeStolenSeconds, formatHM } from "@/lib/mirror/timeStolen";

import { HandlersReading } from "@/components/handler/HandlersReading";
import { WeeklyEval } from "@/components/handler/WeeklyEval";
import { CalibrationQuadrant } from "@/components/CalibrationQuadrant";
import { TheRoad } from "@/components/road/TheRoad";

import { Download, Share2 } from "lucide-react";
import crtImg from "@/assets/crt-terminal.jpg";
import evidenceDeskImg from "@/assets/evidence-desk.jpg";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Operator Profile — MILVERSE" },
      { name: "description", content: "Your MIL rank, calibration record, and manual completion." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [manualUnlocks, setManualUnlocks] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setManualUnlocks(loadUnlocked().size);
    const on = () => {
      setProfile(loadProfile());
      setManualUnlocks(loadUnlocked().size);
    };
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  const publishedCount = profile?.publishedCount ?? 0;
  const xp = useMemo(
    () => computeXp(profile, manualUnlocks, publishedCount),
    [profile, manualUnlocks, publishedCount],
  );
  const rankInfo = useMemo(() => rankFromXp(xp), [xp]);
  const cal = profile ? calibrationLabel(profile) : { label: "Recruit", tone: "neutral" as const };
  const callsign = profile ? operatorCallsign(profile) : "———";
  const manualPct = Math.round((manualUnlocks / MANUAL_ENTRIES.length) * 100);
  const total = profile?.casesPlayed ?? 0;
  const correct = profile?.correctVerdicts ?? 0;
  const missed = profile?.missedScams ?? 0;
  const falseAlarms = profile?.falseAlarms ?? 0;
  const timeStolen = useMemo(() => lifetimeStolenSeconds(profile?.history), [profile]);


  function downloadCard() {
    renderProfileCardPng({
      callsign,
      rank: rankInfo.current.name,
      rankCode: rankInfo.current.code,
      tagline: rankInfo.current.tagline,
      xp,
      calibration: cal.label,
      correct,
      total,
      missed,
      falseAlarms,
      manualPct,
      designed: publishedCount,
    }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `milverse-${callsign.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  return (
    <div
      className="min-h-screen grain"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(2,4,10,0.93), rgba(2,4,10,0.98)), url(${evidenceDeskImg})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
      }}
    >
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        <div className="mt-6">
          <TheRoad id="the-road" />
        </div>



        <div
          className="crt-panel mt-6 rounded-2xl p-6 sm:p-8"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,20,15,0.88), rgba(0,10,8,0.96)), url(${crtImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="crt-text text-[10px] tracking-[0.3em]">
                  &gt; OPERATOR PROFILE
                </div>
                <div className="crt-text mt-1 text-sm">CALLSIGN: {callsign}</div>
                <h1
                  className="mt-2 text-5xl sm:text-6xl font-black tracking-tight"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {rankInfo.current.name}
                </h1>
                <div className="stencil text-[10px] tracking-widest text-primary mt-1">
                  {rankInfo.current.code} · {rankInfo.current.tagline}
                </div>
              </div>
              <div className="text-right">
                <div className="crt-text text-[9px] tracking-widest">XP</div>
                <div
                  className="crt-text text-4xl font-black tabular-nums"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {xp.toString().padStart(4, "0")}
                </div>
                {rankInfo.next && (
                  <div className="stencil text-[9px] text-muted-foreground mt-1">
                    NEXT · {rankInfo.next.name}
                  </div>
                )}
              </div>
            </div>

            {rankInfo.next && (
              <div
                className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`Progress to ${rankInfo.next.name}`}
                aria-valuenow={Math.round(rankInfo.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.round(rankInfo.progress * 100)}%` }}
                />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="CASES" value={total} />
              <Stat label="TAKEDOWNS" value={correct} tone="good" />
              <Stat label="MISSED" value={missed} tone="bad" />
              <Stat label="FALSE ALARM" value={falseAlarms} tone="warn" />
            </div>
            {timeStolen > 0 && (
              <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 flex items-baseline justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.25em] text-primary">
                    TIME STOLEN FROM SCAMMERS
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Minutes they burned on you, not on a real victim.
                  </div>
                </div>
                <div className="font-mono text-2xl tabular-nums text-primary">
                  {formatHM(timeStolen)}
                </div>
              </div>
            )}


            {total === 0 && (
              <div className="mt-4 rounded-md border border-dashed border-border bg-background/50 p-4">
                <div className="text-sm text-muted-foreground">
                  No cases on record. The desk is clean — too clean.
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    to="/drop"
                    className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 stencil text-[10px] tracking-widest text-primary-foreground"
                  >
                    TODAY'S DROP
                  </Link>
                  <Link
                    to="/mirror"
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 stencil text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    THE MIRROR
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-4">
              <CalibrationQuadrant profile={profile} />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/manual"
                className="rounded-md border border-border bg-background/50 p-3 transition-colors hover:border-primary/50"
              >
                <div className="stencil text-[10px] tracking-widest text-muted-foreground">
                  FIELD MANUAL
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-lg font-semibold">
                    {manualUnlocks} / {MANUAL_ENTRIES.length}
                  </div>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${manualPct}%` }} />
                  </div>
                </div>
              </Link>
              <Link
                to="/studio"
                className="rounded-md border border-border bg-background/50 p-3 transition-colors hover:border-primary/50"
              >
                <div className="stencil text-[10px] tracking-widest text-muted-foreground">
                  CASES DESIGNED
                </div>
                <div className="mt-1 text-lg font-semibold">{publishedCount}</div>
              </Link>
              <Link
                to="/wall"
                className="rounded-md border border-border bg-background/50 p-3 transition-colors hover:border-primary/50 sm:col-span-2"
              >
                <div className="stencil text-[10px] tracking-widest text-muted-foreground">
                  THE CASE WALL
                </div>
                <div className="mt-1 text-sm text-foreground">
                  Every call you made. The city keeps receipts.
                </div>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={downloadCard}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground"
              >
                <Download className="h-3.5 w-3.5" /> SAVE CARD (PNG)
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({
                        title: "MILVERSE — Operator Profile",
                        text: `${callsign} · ${rankInfo.current.name} · ${xp} XP`,
                        url: window.location.href,
                      })
                      .catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(window.location.href).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 stencil text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-3.5 w-3.5" /> {copied ? "LINK COPIED" : "SHARE"}
              </button>
            </div>
          </div>
        </div>

        <HandlersReading />

        <WeeklyEval />

        {/* Rank ladder now lives at the top as <TheRoad />. */}

      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "bad" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-primary"
      : tone === "bad"
        ? "text-destructive"
        : tone === "warn"
          ? "text-caution"
          : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background/50 p-3 text-center">
      <div
        className={`text-2xl font-black tabular-nums ${color}`}
        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
      >
        {value}
      </div>
      <div className="stencil text-[9px] tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

interface CardData {
  callsign: string;
  rank: string;
  rankCode: string;
  tagline: string;
  xp: number;
  calibration: string;
  correct: number;
  total: number;
  missed: number;
  falseAlarms: number;
  manualPct: number;
  designed: number;
}

/** Noir ID-card, rendered client-side to a PNG blob. No external service. */
function renderProfileCardPng(d: CardData): Promise<Blob> {
  return new Promise((resolve) => {
    const W = 1200,
      H = 630;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#050813");
    bg.addColorStop(1, "#0a1424");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grain / dot grid
    ctx.fillStyle = "rgba(34,211,238,0.08)";
    for (let y = 12; y < H; y += 12) for (let x = 12; x < W; x += 12) ctx.fillRect(x, y, 1, 1);

    // Cyan border + stamp corner marks
    ctx.strokeStyle = "rgba(34,211,238,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = "rgba(34,211,238,0.7)";
    ctx.lineWidth = 3;
    [
      [20, 20],
      [W - 60, 20],
      [20, H - 60],
      [W - 60, H - 60],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 40);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 40, y);
      ctx.stroke();
    });

    // Header
    ctx.fillStyle = "#22d3ee";
    ctx.font = "600 18px ui-monospace, Menlo, monospace";
    ctx.fillText("MILVERSE · OPERATOR PROFILE", 60, 82);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px ui-monospace, Menlo, monospace";
    ctx.fillText(d.callsign, 60, 118);

    // Rank name (big)
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 128px Impact, 'Bebas Neue', sans-serif";
    ctx.fillText(d.rank, 60, 250);

    // Rank meta
    ctx.fillStyle = "#22d3ee";
    ctx.font = "500 20px ui-monospace, Menlo, monospace";
    ctx.fillText(`${d.rankCode}  ·  ${d.xp} XP`, 60, 285);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "italic 16px ui-serif, Georgia, serif";
    ctx.fillText(d.tagline, 60, 312);

    // Stat boxes
    const stats: [string, number, string][] = [
      ["CASES", d.total, "#e2e8f0"],
      ["CORRECT", d.correct, "#22d3ee"],
      ["MISSED", d.missed, "#f87171"],
      ["FALSE ALARM", d.falseAlarms, "#fbbf24"],
    ];
    stats.forEach(([label, value, color], i) => {
      const x = 60 + i * 270;
      ctx.strokeStyle = "rgba(34,211,238,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 360, 250, 120);
      ctx.fillStyle = color;
      ctx.font = "900 68px Impact, 'Bebas Neue', sans-serif";
      ctx.fillText(String(value), x + 20, 435);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 12px ui-monospace, Menlo, monospace";
      ctx.fillText(label, x + 20, 465);
    });

    // Footer meta
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 15px ui-monospace, Menlo, monospace";
    ctx.fillText(
      `CALIBRATION · ${d.calibration.toUpperCase()}    ·    MANUAL · ${d.manualPct}%    ·    DESIGNED · ${d.designed}`,
      60,
      550,
    );
    ctx.fillStyle = "#22d3ee";
    ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.fillText("TRAIN YOUR TRUST · milverse", 60, 585);

    // Rotated stamp mark, top-right
    ctx.save();
    ctx.translate(W - 160, 120);
    ctx.rotate(-0.18);
    ctx.strokeStyle = "rgba(34,211,238,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-70, -22, 140, 44);
    ctx.fillStyle = "#22d3ee";
    ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFIED", 0, 5);
    ctx.restore();
    ctx.textAlign = "start";

    canvas.toBlob((blob) => resolve(blob ?? new Blob()), "image/png");
  });
}

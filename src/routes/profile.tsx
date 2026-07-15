import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { loadProfile, calibrationLabel, operatorCallsign, type TrustProfile } from "@/lib/mirror/profile";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp, RANKS } from "@/lib/ranks";
import { Download, Share2 } from "lucide-react";

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

  useEffect(() => {
    setProfile(loadProfile());
    setManualUnlocks(loadUnlocked().size);
    const on = () => { setProfile(loadProfile()); setManualUnlocks(loadUnlocked().size); };
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  const publishedCount = profile?.publishedCount ?? 0;
  const xp = useMemo(() => computeXp(profile, manualUnlocks, publishedCount), [profile, manualUnlocks, publishedCount]);
  const rankInfo = useMemo(() => rankFromXp(xp), [xp]);
  const cal = profile ? calibrationLabel(profile) : { label: "Recruit", tone: "neutral" as const };
  const callsign = profile ? operatorCallsign(profile) : "———";
  const manualPct = Math.round((manualUnlocks / MANUAL_ENTRIES.length) * 100);
  const total = profile?.casesPlayed ?? 0;
  const correct = profile?.correctVerdicts ?? 0;
  const missed = profile?.missedScams ?? 0;
  const falseAlarms = profile?.falseAlarms ?? 0;

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
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">← CITY</Link>

        <div className="mt-6 rounded-2xl border-2 border-primary/40 bg-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "radial-gradient(rgba(34,211,238,0.6) 1px, transparent 1px)",
            backgroundSize: "6px 6px",
          }} />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="stencil text-[10px] tracking-[0.3em] text-muted-foreground">OPERATOR PROFILE</div>
                <div className="mt-1 stencil text-primary text-sm">{callsign}</div>
                <h1 className="mt-2 text-5xl sm:text-6xl font-black tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  {rankInfo.current.name}
                </h1>
                <div className="stencil text-[10px] tracking-widest text-primary mt-1">{rankInfo.current.code} · {rankInfo.current.tagline}</div>
              </div>
              <div className="text-right">
                <div className="stencil text-[9px] tracking-widest text-muted-foreground">XP</div>
                <div className="text-4xl font-black text-primary tabular-nums" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{xp}</div>
                {rankInfo.next && (
                  <div className="stencil text-[9px] text-muted-foreground mt-1">NEXT · {rankInfo.next.name}</div>
                )}
              </div>
            </div>

            {rankInfo.next && (
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(rankInfo.progress * 100)}%` }} />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="CASES" value={total} />
              <Stat label="CORRECT" value={correct} tone="good" />
              <Stat label="MISSED" value={missed} tone="bad" />
              <Stat label="FALSE ALARM" value={falseAlarms} tone="warn" />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-background/50 p-3">
                <div className="stencil text-[10px] tracking-widest text-muted-foreground">CALIBRATION</div>
                <div className="mt-1 text-lg font-semibold">{cal.label}</div>
              </div>
              <div className="rounded-md border border-border bg-background/50 p-3">
                <div className="stencil text-[10px] tracking-widest text-muted-foreground">FIELD MANUAL</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-lg font-semibold">{manualUnlocks} / {MANUAL_ENTRIES.length}</div>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${manualPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={downloadCard}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground"
              >
                <Download className="h-3.5 w-3.5" /> DOWNLOAD CARD (SVG)
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "MILVERSE — Operator Profile", text: `${callsign} · ${rankInfo.current.name} · ${xp} XP`, url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 stencil text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-3.5 w-3.5" /> SHARE
              </button>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <div className="stencil text-[10px] tracking-widest text-muted-foreground mb-2">RANK LADDER</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RANKS.map((r) => {
              const cur = r.id === rankInfo.current.id;
              const reached = xp >= r.minXp;
              return (
                <div key={r.id} className={`rounded-md border p-3 ${cur ? "border-primary bg-primary/10" : reached ? "border-border bg-card" : "border-dashed border-border bg-muted/10 opacity-70"}`}>
                  <div className="stencil text-[9px] tracking-widest text-muted-foreground">{r.code} · {r.minXp}xp</div>
                  <div className="mt-1 font-black text-lg tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{r.name}</div>
                  <div className="text-[11px] text-muted-foreground italic">{r.tagline}</div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" | "warn" }) {
  const color =
    tone === "good" ? "text-primary"
    : tone === "bad" ? "text-destructive"
    : tone === "warn" ? "text-caution"
    : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background/50 p-3 text-center">
      <div className={`text-2xl font-black tabular-nums ${color}`} style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{value}</div>
      <div className="stencil text-[9px] tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildCardSvg(d: {
  callsign: string; rank: string; rankCode: string; xp: number; calibration: string;
  correct: number; total: number; missed: number; falseAlarms: number; manualPct: number;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050813"/>
      <stop offset="1" stop-color="#0a1424"/>
    </linearGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#22d3ee" opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="20" y="20" width="1160" height="590" fill="none" stroke="#22d3ee" stroke-opacity="0.4" stroke-width="2"/>
  <text x="60" y="90" fill="#22d3ee" font-family="monospace" font-size="18" letter-spacing="6">MILVERSE · OPERATOR PROFILE</text>
  <text x="60" y="130" fill="#94a3b8" font-family="monospace" font-size="16" letter-spacing="4">${esc(d.callsign)}</text>
  <text x="60" y="260" fill="#ffffff" font-family="Impact, sans-serif" font-size="132" letter-spacing="2">${esc(d.rank)}</text>
  <text x="60" y="300" fill="#22d3ee" font-family="monospace" font-size="20" letter-spacing="4">${esc(d.rankCode)} · ${d.xp} XP</text>

  <g transform="translate(60,360)">
    ${statSvg(0, "CASES", d.total)}
    ${statSvg(1, "CORRECT", d.correct)}
    ${statSvg(2, "MISSED", d.missed)}
    ${statSvg(3, "FALSE ALARM", d.falseAlarms)}
  </g>

  <text x="60" y="560" fill="#94a3b8" font-family="monospace" font-size="16" letter-spacing="3">CALIBRATION · ${esc(d.calibration.toUpperCase())}   ·   MANUAL · ${d.manualPct}%</text>
  <text x="60" y="595" fill="#22d3ee" font-family="monospace" font-size="14" letter-spacing="4">TRAIN YOUR TRUST · milverse</text>
</svg>`;
}

function statSvg(idx: number, label: string, value: number) {
  const x = idx * 270;
  return `
    <rect x="${x}" y="0" width="250" height="120" fill="none" stroke="#22d3ee" stroke-opacity="0.3"/>
    <text x="${x + 20}" y="80" fill="#22d3ee" font-family="Impact, sans-serif" font-size="72">${value}</text>
    <text x="${x + 20}" y="108" fill="#94a3b8" font-family="monospace" font-size="12" letter-spacing="3">${label}</text>
  `;
}

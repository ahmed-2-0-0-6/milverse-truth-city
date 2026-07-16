import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";
import { loadUnlocked } from "@/lib/manual/state";
import { BOSSES } from "@/lib/boss/scenarios";
import { loadBossProfile } from "@/lib/boss/profile";
import { FileText, Lock, ExternalLink, Skull } from "lucide-react";

export const Route = createFileRoute("/manual/")({
  head: () => ({
    meta: [
      { title: "The Field Manual — MILVERSE" },
      { name: "description", content: "A detective's codex of manipulation tactics. Every entry unlocks through play." },
      { property: "og:title", content: "The Field Manual — MILVERSE" },
      { property: "og:description", content: "A living MIL codex — tactics, red flags, and counter-moves." },
    ],
  }),
  component: ManualIndex,
});

function ManualIndex() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [bossDeclassified, setBossDeclassified] = useState<string[]>([]);
  useEffect(() => {
    setUnlocked(loadUnlocked());
    setBossDeclassified(loadBossProfile().declassified);
    const on = () => setUnlocked(loadUnlocked());
    const onBoss = () => setBossDeclassified(loadBossProfile().declassified);
    window.addEventListener("milverse:manual", on);
    window.addEventListener("milverse:boss", onBoss);
    return () => {
      window.removeEventListener("milverse:manual", on);
      window.removeEventListener("milverse:boss", onBoss);
    };
  }, []);

  const unlockedCount = MANUAL_ENTRIES.filter((e) => unlocked.has(e.id)).length;
  const pct = Math.round((unlockedCount / MANUAL_ENTRIES.length) * 100);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">← CITY</Link>
        <div className="mt-4">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">THE FIELD MANUAL · MIL CODEX</div>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            NAME THE TACTIC. LEARN THE COUNTER-MOVE.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Redacted files unlock as you face each tactic in play. This is your growing dossier of how deception works —
            and how to shut it down. MILVERSE never tells you a specific claim is true. This manual teaches your hand so YOU can.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-md border border-border bg-card p-4">
          <div className="stencil text-[10px] tracking-widest text-muted-foreground">FILES DECLASSIFIED</div>
          <div className="text-2xl font-black text-primary tabular-nums" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            {unlockedCount} / {MANUAL_ENTRIES.length}
          </div>
          <div className="flex-1 min-w-[140px] h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <Link
            to="/manual/take-it-outside"
            className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 stencil text-[10px] tracking-widest text-primary hover:bg-primary/20"
          >
            <ExternalLink className="h-3.5 w-3.5" /> TAKE IT OUTSIDE — REAL TOOLS
          </Link>
          <Link
            to="/educators"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 stencil text-[10px] tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/50"
          >
            FOR EDUCATORS →
          </Link>
        </div>

        <div className="mt-6 rounded-md border border-border bg-background/50 p-4 text-xs text-muted-foreground">
          <b className="text-foreground">How MILVERSE uses AI:</b> AI role-plays the scammer, imposter, or forwarded voice so you can rehearse
          safely. AI in MILVERSE never tells you what is true. Truth verdicts come from the case dossier and from the tools you learn here.
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MANUAL_ENTRIES.map((e) => {
            const isUnlocked = unlocked.has(e.id);
            return (
              <Link
                key={e.id}
                to="/manual/$entryId"
                params={{ entryId: e.id }}
                className={`group rounded-xl border p-5 transition ${
                  isUnlocked
                    ? "border-primary/40 bg-card hover:border-primary hover:-translate-y-0.5"
                    : "border-dashed border-border bg-muted/20 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="stencil text-[10px] tracking-widest text-muted-foreground">{e.code}</div>
                  {isUnlocked ? (
                    <FileText className="h-4 w-4 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-3 text-2xl font-black tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  {isUnlocked ? e.name : "▓▓▓▓▓▓▓▓▓▓"}
                </div>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {isUnlocked ? e.oneLine : "Face this tactic in play to unlock the file."}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Boss Dossiers — declassified via Boss Protocol wins */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-2 stencil text-[10px] tracking-widest text-red-400">
            <Skull className="w-3 h-3" /> BOSS DOSSIERS · CLASSIFIED
          </div>
          <p className="text-xs text-muted-foreground mb-4 max-w-2xl">
            Method pages for the three capstone bosses. Each dossier declassifies when you win the case in Boss Protocol.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BOSSES.map((b) => {
              const dc = bossDeclassified.includes(b.id);
              return (
                <Link
                  key={b.id}
                  to="/boss/$bossId"
                  params={{ bossId: b.id }}
                  className={`block rounded-xl border p-5 transition ${
                    dc ? "border-red-500/50 bg-red-950/20 hover:border-red-500" : "border-dashed border-border bg-muted/10 hover:border-red-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="stencil text-[10px] tracking-widest text-red-400">{b.threatRating}</div>
                    {dc ? <FileText className="h-4 w-4 text-red-400" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="mt-3 text-2xl font-black tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    {dc ? b.methodPage.codename : "▓▓▓▓▓▓▓"}
                  </div>
                  {dc ? (
                    <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                      <p><b className="text-foreground">How it works:</b> {b.methodPage.howItWorks}</p>
                      <p><b className="text-foreground">The trap:</b> {b.methodPage.theTrap}</p>
                      <p><b className="text-foreground">The counter:</b> {b.methodPage.theCounter}</p>
                      <p className="italic pt-1 border-t border-red-500/20">{b.methodPage.realWorldPattern}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground italic">Beat this boss to declassify.</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

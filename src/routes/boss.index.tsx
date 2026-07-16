import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skull, Lock, Award, CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BOSSES } from "@/lib/boss/scenarios";
import { loadBossProfile, canRematch } from "@/lib/boss/profile";
import { DOCTRINE_RULES } from "@/lib/boss/doctrine";

export const Route = createFileRoute("/boss/")({
  head: () => ({
    meta: [
      { title: "Boss Protocol — MILVERSE" },
      { name: "description", content: "Capstone cases where fact-checking is the trap. Beat by protocol, not perception." },
      { property: "og:title", content: "Boss Protocol — MILVERSE" },
      { property: "og:description", content: "Fact-checks will not save you. Protocol will." },
    ],
  }),
  component: BossLobby,
});

function BossLobby() {
  const [prof, setProf] = useState<ReturnType<typeof loadBossProfile> | null>(null);
  useEffect(() => {
    setProf(loadBossProfile());
    const on = () => setProf(loadBossProfile());
    window.addEventListener("milverse:boss", on);
    return () => window.removeEventListener("milverse:boss", on);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        <div className="mb-8">
          <div className="text-xs tracking-[0.3em] text-red-500 mb-2">SPECIAL CASE FILE</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">BOSS PROTOCOL</h1>
          <p className="text-white/60 mt-2 max-w-2xl">
            Capstone cases where the scam is built from <em>true facts</em>. Every surface fact-check confirms the cover story.
            Beatable only by protocol: callback, second-person, shared-secret, or HOLD.
          </p>
        </div>

        {/* Doctrine card */}
        <div className="border border-red-900/50 bg-gradient-to-br from-red-950/40 to-black rounded-lg p-5 mb-8">
          <div className="text-[10px] tracking-[0.3em] text-red-400 mb-3">THE DOCTRINE — SHAREABLE</div>
          <ul className="space-y-2">
            {DOCTRINE_RULES.map((r) => (
              <li key={r.n} className="flex gap-3 text-sm">
                <span className="text-red-400 font-mono w-14 shrink-0">RULE #{r.n}</span>
                <span className="text-white/90">{r.rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4">
          {BOSSES.map((b) => {
            const wins = prof?.attempts.filter((a) => a.bossId === b.id && a.outcome === "WIN").length ?? 0;
            const losses = prof?.attempts.filter((a) => a.bossId === b.id && a.outcome !== "WIN").length ?? 0;
            const declassified = prof?.declassified.includes(b.id) ?? false;
            const rematchOk = canRematch(b.id);
            const districtHref = b.district === "mirror" ? "/mirror" : b.district === "feed" ? "/feed" : "/";
            const districtLabel = b.district === "mirror" ? "The Mirror" : b.district === "feed" ? "The Feed" : b.district;
            const assignmentOpen = !rematchOk && losses > 0;
            return (
              <div key={b.id} className="border border-white/10 hover:border-red-500/60 bg-black/60 rounded-lg transition">
                <Link
                  to="/boss/$bossId"
                  params={{ bossId: b.id }}
                  className="group block p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-red-400 mb-1">
                        <Skull className="w-3 h-3" />
                        <span>{b.threatRating}</span>
                        <span className="text-white/40">·</span>
                        <span className="text-white/60">{b.district.toUpperCase()}</span>
                      </div>
                      <div className="text-xl font-black">{b.codename}</div>
                      <div className="text-sm text-white/60 mt-1">{b.tagline}</div>
                      <div className="mt-3 text-[11px] tracking-widest text-red-500/80 font-mono">
                        FACT-CHECKS WILL NOT SAVE YOU
                      </div>
                    </div>
                    <div className="text-right text-xs text-white/50 space-y-1 shrink-0">
                      {wins > 0 && <div className="flex items-center gap-1 justify-end text-emerald-400"><Award className="w-3 h-3" /> {b.badge.label}</div>}
                      {losses > 0 && <div>{losses} loss{losses > 1 ? "es" : ""}</div>}
                      {declassified && <div className="flex items-center gap-1 justify-end text-white/70"><CheckCircle2 className="w-3 h-3" /> DECLASSIFIED</div>}
                      {!rematchOk && <div className="flex items-center gap-1 justify-end text-amber-500"><Lock className="w-3 h-3" /> REMATCH LOCKED</div>}
                    </div>
                  </div>
                </Link>

                {assignmentOpen && (
                  <div className="border-t border-amber-500/30 bg-amber-500/[0.05] rounded-b-lg px-5 py-3">
                    <div className="text-[10px] tracking-[0.3em] text-amber-400 mb-1">ASSIGNMENT · REMATCH GATE</div>
                    <div className="text-sm text-white/90">
                      Win 1 case in <span className="font-semibold">{districtLabel}</span> to unlock the rematch.
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-amber-300/90">
                      PROGRESS · 0 / 1 COMPLETE
                    </div>
                    <Link
                      to={districtHref}
                      className="mt-2 inline-flex items-center gap-1 rounded border border-amber-500/50 px-3 py-1.5 text-[11px] tracking-widest text-amber-200 hover:bg-amber-500/10 font-mono"
                    >
                      GO TO {districtLabel.toUpperCase()} →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

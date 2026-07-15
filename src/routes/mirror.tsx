import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, ShieldAlert, Lock, CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SCENARIOS, type TierId } from "@/lib/mirror/scenarios";
import { loadProfile, unlockedMaxTier, tierWins, type TrustProfile } from "@/lib/mirror/profile";

export const Route = createFileRoute("/mirror")({
  head: () => ({
    meta: [
      { title: "The Mirror — Case Files — MILVERSE" },
      { name: "description", content: "Live conversations. Real or imposter? You decide." },
    ],
  }),
  component: CaseFiles,
});

const TIER_NAMES: Record<TierId, string> = {
  1: "Rookie",
  2: "Street-smart",
  3: "Professional",
  4: "Ghost",
  5: "Clean Room",
};

function CaseFiles() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  const maxTier = profile ? unlockedMaxTier(profile) : 2;
  const tiers: TierId[] = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
          ← CITY
        </Link>
        <div className="mt-4 mb-8 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">THE MIRROR · TEXT CHANNEL</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Case Files</h1>
          <p className="mt-3 text-muted-foreground">
            Live, unscripted conversations. Your job is not to spot red flags — it's to{" "}
            <span className="text-foreground">verify</span>. Win two cases in a tier to unlock the next.
          </p>
        </div>

        {tiers.map((tier) => {
          const cases = SCENARIOS.filter((s) => s.tier === tier);
          const isUnlocked = tier <= maxTier;
          const wins = profile ? tierWins(profile, tier) : 0;
          return (
            <section key={tier} className="mb-10">
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                <div className="font-mono text-[11px] tracking-widest text-primary">
                  TIER {tier} · {TIER_NAMES[tier]}
                </div>
                {isUnlocked ? (
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                    {wins}/2 correct wins
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-caution">
                    <Lock className="h-3 w-3" /> LOCKED · win 2 correct at Tier {tier - 1}
                  </span>
                )}
              </div>

              {cases.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {tier === 5
                    ? "No cases at this tier yet. Prepare for the Clean Room."
                    : "Scenarios coming soon."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cases.map((s) => {
                    const done = profile?.history.some((h) => h.caseId === s.id && h.result === "correct");
                    const card = (
                      <div
                        className={`group relative overflow-hidden rounded-xl border p-6 transition-all ${
                          isUnlocked
                            ? "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_32px_oklch(0.82_0.15_210/0.15)]"
                            : "border-border/60 bg-card/40 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px] tracking-widest">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`h-1.5 w-4 rounded-sm ${i < s.tier ? "bg-primary" : "bg-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{s.teaser}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {s.isSurvivorStory && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-caution/40 bg-caution/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-caution">
                              <ShieldAlert className="h-3 w-3" /> Survivor donated
                            </span>
                          )}
                          {done && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
                              <CheckCircle2 className="h-3 w-3" /> Solved
                            </span>
                          )}
                          {!isUnlocked && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/30 bg-muted px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                        </div>

                        {isUnlocked && (
                          <div className="mt-5 font-mono text-xs tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            OPEN CASE →
                          </div>
                        )}
                      </div>
                    );
                    return isUnlocked ? (
                      <Link key={s.id} to="/mirror/$caseId" params={{ caseId: s.id }}>
                        {card}
                      </Link>
                    ) : (
                      <div key={s.id}>{card}</div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}

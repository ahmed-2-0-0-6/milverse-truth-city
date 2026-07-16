import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, ShieldAlert, Lock, CheckCircle2, Sparkles, Users, Building2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SCENARIOS, loadCitizenCases, saveCitizenCase, type TierId, type Scenario } from "@/lib/mirror/scenarios";
import { loadProfile, unlockedMaxTier, tierWins, type TrustProfile } from "@/lib/mirror/profile";
import { fetchCitizenCase } from "@/lib/citizen.functions";
import { RecommendedStrip } from "@/components/RecommendedStrip";
import { DistrictIntro } from "@/components/DistrictIntro";
import mirrorArt from "@/assets/district-mirror.jpg";
import mirrorVideo from "@/assets/mirror.mp4.asset.json";
import { useJuniorGate } from "@/components/firstPhone/JuniorGate";

export const Route = createFileRoute("/mirror/")({
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
  const gate = useJuniorGate("The Mirror");
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [citizen, setCitizen] = useState<Scenario[]>([]);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);
  const fetchByCode = useServerFn(fetchCitizenCase);
  useEffect(() => {
    setProfile(loadProfile());
    setCitizen(loadCitizenCases());
    const on = () => setProfile(loadProfile());
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
  }, []);

  async function openCode() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCodeErr(null);
    // 1) local match by shareCode field
    const localByShare = citizen.find((s) => s.shareCode === c);
    if (localByShare) {
      navigate({ to: "/mirror/$caseId", params: { caseId: localByShare.id } });
      return;
    }
    // 2) legacy local match by id prefix (older cases pre-shareCode)
    const legacyLocal = citizen.find((s) => s.id.replace("citizen-", "").toUpperCase().startsWith(c.slice(0, 6)));
    if (legacyLocal) {
      navigate({ to: "/mirror/$caseId", params: { caseId: legacyLocal.id } });
      return;
    }
    // 3) backend fetch
    if (!/^[A-Z0-9]{6}$/.test(c)) {
      setCodeErr("Codes are 6 characters (letters and numbers).");
      return;
    }
    setCodeBusy(true);
    try {
      const res = await fetchByCode({ data: { shareCode: c } as never });
      const json = (res as { scenarioJson: string | null }).scenarioJson;
      if (!json) {
        setCodeErr("No case with that code — check the code and try again.");
        setCodeBusy(false);
        return;
      }
      const scenario = JSON.parse(json) as Scenario;
      saveCitizenCase(scenario);
      navigate({ to: "/mirror/$caseId", params: { caseId: scenario.id } });
    } catch {
      setCodeErr("Couldn't reach the case service. Try again in a moment.");
    }
    setCodeBusy(false);
  }


  const maxTier = profile ? unlockedMaxTier(profile) : 2;
  const tiers: TierId[] = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
          ← CITY
        </Link>
        <DistrictIntro
          id="mirror"
          chapter="CHAPTER 01"
          title="THE MIRROR"
          art={mirrorArt}
          artVideo={mirrorVideo.url}
          district="mirror"
          lines={[
            "Someone's uncle answered a message like this last week. He's still paying for it.",
            "Your turn to answer better. Verify the person, not the vibe.",
          ]}
        />
        <div className="mt-4 mb-4 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">THE MIRROR · TEXT CHANNEL</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Case Files</h1>
          <p className="mt-3 text-muted-foreground">
            Live, unscripted conversations. Your job isn't to guess from vibes — it's to{" "}
            <span className="text-foreground">verify</span>. Win two cases in a tier to unlock the next.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-caution/30 bg-caution/10 px-3 py-1 text-[11px] font-mono tracking-widest text-caution">
            🇵🇰 SCENARIOS ROOTED IN REAL REPORTED SCAM PATTERNS FROM PAKISTAN
          </div>
        </div>

        {/* Share code entry */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setCodeErr(null); }}
            onKeyDown={(e) => e.key === "Enter" && openCode()}
            placeholder="Enter 6-char share code…"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary font-mono uppercase tracking-widest w-64"
            maxLength={6}
          />
          <button onClick={openCode} disabled={codeBusy} className="rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-mono tracking-widest text-primary hover:bg-primary/20 disabled:opacity-50">
            {codeBusy ? "LOOKING UP…" : "OPEN CASE"}
          </button>
          {codeErr && <span className="text-xs text-destructive">{codeErr}</span>}
        </div>

        <RecommendedStrip />

        {/* Boss Protocol beacon */}
        <Link
          to="/boss"
          className="mt-6 mb-4 block border border-red-900/60 bg-gradient-to-r from-red-950/40 via-black to-black rounded-lg p-4 hover:border-red-500/70 transition"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] text-red-400">☠ SPECIAL CASE — BOSS PROTOCOL</div>
              <div className="font-black text-lg mt-1">Fact-checks will not save you.</div>
              <div className="text-xs text-white/60 mt-1">Capstone cases. Beatable only by protocol.</div>
            </div>
            <div className="text-red-500 text-3xl font-black">›</div>
          </div>
        </Link>




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
                    : "No cases at this tier — clear the tier below to open more."}
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

        {/* Citizen Cases shelf */}
        <section className="mt-4 mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-x-3">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-primary">
              <Users className="h-3.5 w-3.5" /> CITIZEN CASES
            </div>
            <Link to="/studio" className="ml-auto font-mono text-[10px] tracking-widest text-primary hover:underline">
              <Sparkles className="inline h-3 w-3 mr-1" />DESIGN ONE →
            </Link>
          </div>
          {citizen.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              No citizen cases yet — be the first designer.{" "}
              <Link to="/studio" className="text-primary underline">Open The Studio →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {citizen.map((s) => (
                <Link key={s.id} to="/mirror/$caseId" params={{ caseId: s.id }} className="group rounded-xl border border-primary/30 bg-card p-6 hover:border-primary/60 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-mono tracking-widest text-primary">
                        DESIGNED BY A CITIZEN
                      </span>
                      {s.designerRank === "CITY DESIGNER" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-caution/50 bg-caution/10 px-2 py-0.5 text-[9px] font-mono tracking-widest text-caution">
                          <Building2 className="h-2.5 w-2.5" /> CITY DESIGNER
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.teaser}</p>
                  <div className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
                    {s.designerRank && <span className="mr-2 text-primary/80">BYLINE · {s.designerRank}</span>}
                    CODE: {s.id.replace("citizen-", "").toUpperCase().slice(0, 6)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}

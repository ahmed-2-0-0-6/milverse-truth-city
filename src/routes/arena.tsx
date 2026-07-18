import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skull, Lock } from "lucide-react";
import { DistrictBlueprint } from "@/components/DistrictBlueprint";
import { loadProfile } from "@/lib/mirror/profile";
import { loadRedHandsLog } from "@/lib/redhands/script";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "The Arena — MILVERSE" },
      {
        name: "description",
        content:
          "MILVERSE Arena: human-vs-human imposter duels, and the Red Hands red-team drill.",
      },
    ],
  }),
  component: ArenaRoute,
});

function ArenaRoute() {
  const [unlocked, setUnlocked] = useState(false);
  const [runs, setRuns] = useState(0);
  const [cases, setCases] = useState(0);

  useEffect(() => {
    const p = loadProfile();
    setCases(p.casesPlayed);
    setUnlocked(p.casesPlayed >= 5);
    setRuns(loadRedHandsLog().runs);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div
          className={`rounded-lg border p-5 ${
            unlocked
              ? "border-destructive/60 bg-destructive/[0.06]"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-destructive">
            <Skull className="h-3.5 w-3.5" />
            SPECIAL EXHIBIT · RED HANDS
            {!unlocked && (
              <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" /> LOCKED
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold">
            Wear the mask. Feel it die in your hand.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            You run the script tonight. Target is a graduate of the ten lessons.
            You will not win. You will map, in your own hands, every wall she
            uses — so you can build them at home.
          </p>
          <div className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">
            {unlocked ? (
              <>
                READY · SHIFTS RUN · {runs}
              </>
            ) : (
              <>
                UNLOCKS AFTER 5 CASES · PROGRESS · {Math.min(cases, 5)} / 5
              </>
            )}
          </div>
          {unlocked ? (
            <Link
              to="/red-hands"
              className="mt-4 inline-flex rounded-md bg-destructive px-4 py-2 font-mono text-xs tracking-widest text-white hover:bg-destructive/90"
            >
              CLOCK IN →
            </Link>
          ) : (
            <Link
              to="/mirror"
              className="mt-4 inline-flex rounded-md border border-border px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
            >
              PLAY CASES FIRST →
            </Link>
          )}
        </div>
      </div>

      <DistrictBlueprint
        district="arena"
        title="The Arena"
        subtitle="HUMAN VS HUMAN · PLAY THE MASK, OR SPOT IT"
        concept="The Arena flips the table: instead of the deterministic engine, another real player wears the imposter mask while you investigate — or you take the mask and try to hold it under pressure. Hot-seat duels, ranked matchmaking on calibration score, and shared-city local play modes for classrooms."
        mechanics={[
          "Hot-seat duels — two players, one phone, alternating imposter/investigator rounds.",
          "Ranked matches — calibrated by your City Hall rating; consistency wins over volume.",
          "Classroom mode — a whole room investigates one masked student in real time.",
        ]}
      />
    </div>
  );
}

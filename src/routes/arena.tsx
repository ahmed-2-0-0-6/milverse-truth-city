import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DistrictBlueprint } from "@/components/DistrictBlueprint";
import { loadProfile } from "@/lib/mirror/profile";
import { loadRuns } from "@/lib/redhands/script";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "The Arena — Blueprint — MILVERSE" },
      {
        name: "description",
        content:
          "MILVERSE district blueprint: human-vs-human imposter duels. Play the mask, or spot it. Vote on what opens next.",
      },
    ],
  }),
  component: ArenaRoute,
});

function ArenaRoute() {
  return (
    <>
      <RedHandsExhibit />
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
    </>
  );
}

function RedHandsExhibit() {
  const [unlocked, setUnlocked] = useState(false);
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    try {
      const p = loadProfile();
      setUnlocked((p?.casesPlayed ?? 0) >= 5);
      setRuns(loadRuns());
    } catch {
      /* noop */
    }
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-4 pt-8">
      <div className="rounded-lg border border-red-500/40 bg-gradient-to-br from-red-500/10 via-neutral-950 to-neutral-950 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-red-400">
              LIVE EXHIBIT · RED HANDS
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Assigned drill: you run the script.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/75">
              Red-team duty against a target who has already passed the ten
              lessons. You will lose — that's the point. Feel exactly where
              her walls sit so you can build them at home.
            </p>
          </div>
          <div className="shrink-0 text-right font-mono text-[10px] tracking-widest text-white/50">
            <div>RUNS · {runs}</div>
            <div>ETHICS · DRILL ONLY</div>
          </div>
        </div>

        {unlocked ? (
          <Link
            to="/red-hands"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-500 px-4 py-2.5 font-mono text-xs tracking-widest text-black hover:bg-red-400"
          >
            REPORT FOR THE SHIFT →
          </Link>
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] tracking-widest text-white/50">
            LOCKED · CLEAR 5 MIRROR CASES BEFORE THE HANDLER ASSIGNS THIS.
          </div>
        )}
      </div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { DistrictBlueprint } from "@/components/DistrictBlueprint";

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
  component: () => (
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
  ),
});

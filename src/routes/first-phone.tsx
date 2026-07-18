import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useJuniorMode } from "@/hooks/useJuniorMode";
import { ParentPitch } from "@/components/firstPhone/ParentPitch";
import { LessonPath } from "@/components/firstPhone/LessonPath";
import { HandoverMoment } from "@/components/firstPhone/HandoverMoment";
import { setActive } from "@/lib/firstPhone/profile";

export const Route = createFileRoute("/first-phone")({
  head: () => ({
    meta: [
      { title: "First Phone Program — MILVERSE" },
      {
        name: "description",
        content:
          "A 10-lesson program that phone-proofs the child before their first real phone. Family code, printable license, no surveillance.",
      },
      { property: "og:title", content: "First Phone Program — MILVERSE" },
      {
        property: "og:description",
        content:
          "Driver's ed for the phone. 10 lessons, a family code, and a printable First Phone License.",
      },
    ],
  }),
  component: FirstPhonePage,
});

function FirstPhonePage() {
  const state = useJuniorMode();
  const [, force] = useState(0);

  // Handover moment: once per kid, at first activation.
  // We render it as soon as they're active but haven't seen it yet.
  const needsHandover = state.ready && state.active && !state.handoverSeen;

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        {!state.active ? (
          <div className="mt-6">
            <ParentPitch onStart={() => force((n) => n + 1)} />
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[11px] tracking-widest text-primary">
                  FIRST PHONE PROGRAM · ACTIVE
                </div>
                <h1 className="mt-2 text-3xl font-semibold">Hey {state.kidCityName || "cadet"}.</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ten lessons. Take them in order. Call backup any time.
                </p>
              </div>
              <button
                onClick={() => {
                  setActive(false);
                  force((n) => n + 1);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Exit program
              </button>
            </div>
            <LessonPath />
          </div>
        )}
      </main>

      {needsHandover && (
        <HandoverMoment
          cityName={state.kidCityName || "cadet"}
          onDone={() => force((n) => n + 1)}
        />
      )}
    </div>
  );
}

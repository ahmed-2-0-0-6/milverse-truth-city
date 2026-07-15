import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, ShieldAlert } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SCENARIOS } from "@/lib/mirror/scenarios";

export const Route = createFileRoute("/mirror")({
  head: () => ({
    meta: [
      { title: "The Mirror — Case Files — MILVERSE" },
      {
        name: "description",
        content:
          "Live conversations with an anonymous contact. Real, or imposter? You decide.",
      },
    ],
  }),
  component: CaseFiles,
});

function CaseFiles() {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>
        <div className="mt-4 mb-10 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">
            THE MIRROR · TEXT CHANNEL
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Case Files</h1>
          <p className="mt-3 text-muted-foreground">
            A live, unscripted conversation is waiting. Your job is not to spot
            red flags — it's to <span className="text-foreground">verify</span>.
            Choose a case.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              to="/mirror/$caseId"
              params={{ caseId: s.id }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_32px_oklch(0.82_0.15_210/0.15)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] tracking-widest">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-4 rounded-sm ${
                        i < s.tier ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-muted-foreground">TIER {s.tier}</span>
                </div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.teaser}</p>
              {s.isSurvivorStory && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-caution/40 bg-caution/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-caution">
                  <ShieldAlert className="h-3 w-3" />
                  Based on a real reported scam
                </div>
              )}
              <div className="mt-5 font-mono text-xs tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
                OPEN CASE →
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { getManualEntry, type ManualEntry } from "@/lib/manual/entries";
import { track } from "@/lib/telemetry";
import { ArrowLeft, Shield, Flag, Compass } from "lucide-react";

export const Route = createFileRoute("/manual/$entryId")({
  loader: ({ params }) => {
    const entry = getManualEntry(params.entryId);
    if (!entry) throw notFound();
    return { entry };
  },
  head: ({ loaderData }) => {
    const e = loaderData?.entry;
    const title = e ? `${e.name} — Field Manual` : "Field Manual — MILVERSE";
    return {
      meta: [{ title }, { name: "description", content: e?.oneLine ?? "MIL codex entry." }],
    };
  },
  component: EntryPage,
  notFoundComponent: () => (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="stencil text-xs tracking-widest text-muted-foreground">FILE NOT FOUND</p>
        <Link to="/manual" className="mt-4 inline-block stencil text-xs text-primary">
          ← BACK TO MANUAL
        </Link>
      </main>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="stencil text-xs tracking-widest text-destructive">FILE CORRUPTED</p>
        <Link to="/manual" className="mt-4 inline-block stencil text-xs text-primary">
          ← BACK TO MANUAL
        </Link>
      </main>
    </div>
  ),
});

function EntryPage() {
  const { entry: e } = Route.useLoaderData() as { entry: ManualEntry };
  useEffect(() => {
    track("manual_open", { payload: { entry: e.id } });
  }, [e.id]);
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/manual"
          className="inline-flex items-center gap-1 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> FIELD MANUAL
        </Link>
        <div className="mt-6 rounded-xl border-2 border-primary/40 bg-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-6 -top-3 rotate-12 stencil text-[9px] tracking-[0.35em] text-primary/60 border border-primary/40 px-3 py-1">
            DECLASSIFIED · {e.code}
          </div>
          <div className="stencil text-[10px] tracking-[0.3em] text-primary">TACTIC FILE</div>
          <h1
            className="mt-2 text-5xl sm:text-6xl font-black tracking-tight"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {e.name}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground italic">"{e.oneLine}"</p>

          <section className="mt-8">
            <div className="stencil text-[10px] tracking-widest text-muted-foreground mb-2">
              HOW IT WORKS
            </div>
            <p className="text-sm leading-relaxed">{e.howItWorks}</p>
          </section>

          <section className="mt-6">
            <div className="stencil text-[10px] tracking-widest text-muted-foreground mb-2">
              HOW IT SHOWS UP · WORLDWIDE
            </div>
            <ul className="space-y-2">
              {e.worldwide.map((w, i) => (
                <li key={i} className="rounded-md border border-border bg-background/50 p-3">
                  <div className="stencil text-[9px] tracking-widest text-primary">{w.where}</div>
                  <div className="mt-1 text-sm">{w.pattern}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <div className="stencil text-[10px] tracking-widest text-caution mb-2 flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5" /> RED FLAGS
            </div>
            <ul className="space-y-1.5">
              {e.redFlags.map((r, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-caution">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-lg border border-primary/40 bg-primary/[0.06] p-4">
            <div className="stencil text-[10px] tracking-widest text-primary mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> THE COUNTER-MOVE
            </div>
            <p className="text-sm">{e.counterMove}</p>
          </section>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              to="/manual"
              className="stencil text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
            >
              ← ALL FILES
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              to="/manual/take-it-outside"
              className="inline-flex items-center gap-1 stencil text-[10px] tracking-widest text-primary"
            >
              <Compass className="h-3 w-3" /> TAKE IT OUTSIDE — REAL TOOLS
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

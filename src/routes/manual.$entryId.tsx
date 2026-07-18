import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { getManualEntry, type ManualEntry } from "@/lib/manual/entries";
import { loadUnlocked } from "@/lib/manual/state";
import { RedactedTitle } from "@/components/RedactedTitle";
import { track } from "@/lib/telemetry";
import { ArrowLeft, Shield, Flag, Compass, Lock } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";
import { encountersFor, type Encounter } from "@/lib/manual/encounters";


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

/** Deterministic per-entry "declassified on" stamp. Fictional but stable. */
function stampDate(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const y = 2024 + (h % 2);
  const m = 1 + (h % 12);
  const d = 1 + ((h >> 4) % 28);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

function EntryPage() {
  const { entry: e } = Route.useLoaderData() as { entry: ManualEntry };
  const [gate, setGate] = useState<"pending" | "locked" | "open">("pending");

  useEffect(() => {
    const on = () => setGate(loadUnlocked().has(e.id) ? "open" : "locked");
    on();
    window.addEventListener("milverse:manual", on);
    return () => window.removeEventListener("milverse:manual", on);
  }, [e.id]);

  useEffect(() => {
    if (gate === "open") track("manual_open", { payload: { entry: e.id } });
  }, [e.id, gate]);

  if (gate === "locked") return <RedactedEntry entry={e} />;

  // gate === "pending" or "open" — render full file (pending briefly shows content skeleton)
  const stamp = stampDate(e.id);

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

        <article className="mt-6 rounded-xl border-2 border-primary/40 bg-card relative overflow-hidden">
          {/* File-header strip */}
          <header className="border-b border-dashed border-primary/30 bg-primary/[0.04] px-6 sm:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 stencil text-[10px] tracking-[0.28em] text-muted-foreground">
            <span>
              FILE · <span className="text-primary">{e.code}</span>
            </span>
            <span>TACTIC · REFERENCE</span>
            <span>
              STATUS · <span className="text-primary">DECLASSIFIED</span>
            </span>
            <span className="ml-auto">STAMPED · {stamp}</span>
          </header>

          <div className="p-6 sm:p-8 relative">
            <div className="absolute -right-6 -top-3 rotate-12 stencil text-[9px] tracking-[0.35em] text-primary/60 border border-primary/40 px-3 py-1">
              DECLASSIFIED · {e.code}
            </div>
            <div className="stencil text-[10px] tracking-[0.3em] text-primary">TACTIC FILE</div>
            <h1
              className="mt-2 text-5xl sm:text-6xl font-black tracking-tight leading-[0.95]"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              {e.name}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground italic">"{e.oneLine}"</p>

            <SectionRule />

            <section>
              <SectionLabel>HOW IT WORKS</SectionLabel>
              <p className="text-sm leading-relaxed">{e.howItWorks}</p>
            </section>

            <SectionRule />

            <section>
              <SectionLabel>HOW IT SHOWS UP · WORLDWIDE</SectionLabel>
              <ul className="space-y-2">
                {e.worldwide.map((w, i) => (
                  <li key={i} className="rounded-md border border-border bg-background/50 p-3">
                    <div className="stencil text-[9px] tracking-widest text-primary">{w.where}</div>
                    <div className="mt-1 text-sm">{w.pattern}</div>
                  </li>
                ))}
              </ul>
            </section>

            <SectionRule />

            <section>
              <SectionLabel tone="warn">
                <Flag className="h-3.5 w-3.5" /> RED FLAGS
              </SectionLabel>
              <ol className="space-y-2">
                {e.redFlags.map((r, i) => (
                  <li key={i} className="grid grid-cols-[auto_1fr] items-start gap-3 text-sm">
                    <span className="stencil text-[10px] tracking-widest text-caution tabular-nums pt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-6 rounded-lg border border-primary/40 bg-primary/[0.06] p-4">
              <div className="stencil text-[10px] tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> THE COUNTER-MOVE
              </div>
              <p className="text-sm">{e.counterMove}</p>
            </section>

            <SectionRule />

            <SeenInTheWild entryId={e.id} />



            <div className="mt-8 border-t border-dashed border-border pt-4 flex flex-wrap items-center gap-3 stencil text-[10px] tracking-widest">
              <Link to="/manual" className="text-muted-foreground hover:text-foreground">
                ← ALL FILES
              </Link>
              <span className="text-muted-foreground/60">·</span>
              <Link
                to="/manual/take-it-outside"
                className="inline-flex items-center gap-1 text-primary"
              >
                <Compass className="h-3 w-3" /> TAKE IT OUTSIDE — REAL TOOLS
              </Link>
              <span className="ml-auto text-muted-foreground/70">END OF FILE · {e.code}</span>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

function SectionLabel({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "warn";
}) {
  const color = tone === "warn" ? "text-caution" : "text-muted-foreground";
  return (
    <div className={`stencil text-[10px] tracking-widest mb-2 flex items-center gap-1.5 ${color}`}>
      {children}
    </div>
  );
}

function SectionRule() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 border-t border-dashed border-border" />
      <span className="stencil text-[9px] tracking-[0.4em] text-muted-foreground/60">§</span>
      <div className="h-px flex-1 border-t border-dashed border-border" />
    </div>
  );
}

function RedactedEntry({ entry: e }: { entry: ManualEntry }) {
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

        <article className="mt-6 rounded-xl border-2 border-dashed border-border bg-muted/10 relative overflow-hidden">
          <header className="border-b border-dashed border-border bg-muted/20 px-6 sm:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 stencil text-[10px] tracking-[0.28em] text-muted-foreground">
            <span>
              FILE · <span className="text-foreground">{e.code}</span>
            </span>
            <span>TACTIC · REFERENCE</span>
            <span className="inline-flex items-center gap-1 text-caution">
              <Lock className="h-3 w-3" /> STATUS · REDACTED
            </span>
          </header>
          <div className="p-6 sm:p-8">
            <div className="stencil text-[10px] tracking-[0.3em] text-muted-foreground">
              TACTIC FILE
            </div>
            <div
              className="mt-2 text-5xl sm:text-6xl font-black tracking-tight leading-[0.95]"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              <RedactedTitle text={e.name} height="0.7em" />
            </div>
            <p className="mt-3 text-lg text-muted-foreground italic">
              This file is sealed. Face this tactic in a live case and it opens on its own.
            </p>

            <SectionRule />

            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-md border border-border bg-background/30 p-3">
                  <RedactedTitle text="lorem ipsum dolor sit amet" height="0.7em" />
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-dashed border-border pt-4 flex flex-wrap items-center gap-3 stencil text-[10px] tracking-widest">
              <Link to="/mirror" className="text-primary">
                → PLAY A MIRROR CASE
              </Link>
              <span className="text-muted-foreground/60">·</span>
              <Link to="/feed" className="text-primary">
                → PLAY A FEED CASE
              </Link>
              <span className="ml-auto text-muted-foreground/70">SEALED · {e.code}</span>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

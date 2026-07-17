import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { GraduationCap, Shield, BookOpen, Printer, Play, Search, Award } from "lucide-react";

export const Route = createFileRoute("/educators")({
  head: () => ({
    meta: [
      { title: "For Educators — MILVERSE" },
      { name: "description", content: "MILVERSE is a Media & Information Literacy training simulator for classrooms. No signup, works on shared devices, aligns with UNESCO MIL." },
      { property: "og:title", content: "For Educators — MILVERSE" },
      { property: "og:description", content: "Media & Information Literacy training simulator: rehearse manipulation safely, name the tactic, master real verification tools." },
      { property: "og:url", content: "https://milverse-truth-city.lovable.app/educators" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://milverse-truth-city.lovable.app/educators" }],
  }),
  component: EducatorsPage,
});

const HOW_IT_WORKS = [
  { icon: Play, label: "REHEARSE", body: "Students meet the scam in-world — a WhatsApp forward, a viral post, a doctored screenshot. No lecture, just the artifact." },
  { icon: Search, label: "VERIFY", body: "They probe the dossier and run four real tools: reverse image, source check, cross-check, date/metadata." },
  { icon: Award, label: "CALIBRATE", body: "Verdict plus confidence gets scored against ground truth. The score they chase is calibration, not certainty." },
];

const COMPETENCIES = [
  {
    label: "ACCESS",
    line: "Multi-format media cases",
    milverse: "Cases arrive as WhatsApp forwards, Instagram posts, news screenshots, viral images, and video clips — each rendered as a believable in-world artifact.",
  },
  {
    label: "EVALUATE",
    line: "Dossier probing · Toolbelt · Calibration",
    milverse: "Every case has a ground-truth dossier. Players probe evidence, run four real verification tools (reverse image, source check, cross-check, date/metadata), and get scored on how well their confidence matches reality.",
  },
  {
    label: "CREATE",
    line: "Studio case design · Community library",
    milverse: "In the Studio players design their own cases with dossiers and tactic tags. Published cases enter the community Archive — teaching by authoring is the create competency.",
  },
];

function EducatorsPage() {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">← CITY</Link>

        <div className="mt-4 flex items-start gap-3">
          <GraduationCap className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div>
            <div className="font-mono text-xs tracking-[0.3em] text-primary">FOR EDUCATORS</div>
            <h1 className="mt-1 text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              MEDIA &amp; INFORMATION LITERACY, <span className="text-primary">REHEARSED.</span>
            </h1>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-primary/50 bg-primary/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="stencil text-[10px] tracking-[0.3em] text-primary">3-MINUTE GUIDED VISIT</div>
              <p className="mt-1 text-sm">See MILVERSE in three minutes — play a scam, meet a boss, tour the city. No signup.</p>
            </div>
            <Link to="/visit" className="shrink-0 rounded-md bg-primary px-4 py-2 stencil text-[11px] tracking-[0.25em] text-primary-foreground">
              TAKE THE VISIT →
            </Link>
          </div>
        </div>


        <p className="mt-5 text-base leading-relaxed">
          MILVERSE is a <b>Media &amp; Information Literacy training simulator</b>: students rehearse manipulation attempts safely,
          learn to name the tactic, and master real verification tools.
        </p>

        <section className="mt-8" aria-labelledby="how-it-works">
          <div id="how-it-works" className="stencil text-[10px] tracking-widest text-primary mb-3">HOW IT WORKS · 3 BEATS</div>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.label} className="relative rounded-xl border border-border bg-card p-4">
                <div className="absolute -top-2 -left-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground stencil text-[10px]">
                  {i + 1}
                </div>
                <step.icon className="h-5 w-5 text-primary" />
                <div className="mt-2 stencil text-sm tracking-widest text-foreground">{step.label}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-snug">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to="/visit" className="inline-flex items-center rounded-md bg-primary px-4 py-2 stencil text-[11px] tracking-[0.25em] text-primary-foreground hover:bg-primary/90">
              TAKE THE VISIT →
            </Link>
            <Link to="/drop" className="inline-flex items-center rounded-md border border-border px-4 py-2 stencil text-[11px] tracking-[0.25em] text-foreground hover:bg-accent">
              PLAY TODAY'S DROP
            </Link>
            <Link to="/kit" className="stencil text-[11px] tracking-widest text-muted-foreground hover:text-foreground">
              PRINTABLE FIELD KIT →
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <div className="stencil text-[10px] tracking-widest text-primary mb-3">FEATURES → MIL COMPETENCIES</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETENCIES.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-3xl font-black text-primary tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{c.label}</div>
                <p className="mt-1 text-xs italic text-muted-foreground">{c.line}</p>
                <p className="mt-2 text-sm">{c.milverse}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="mt-2 stencil text-sm tracking-widest">INOCULATION THEORY</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Rehearsing weakened attacks builds resistance to real ones — the Bad News lineage.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="mt-2 stencil text-sm tracking-widest">LATERAL READING</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Verify by leaving the page — the fact-checkers' method the Toolbelt makes the default motion.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-primary/40 bg-primary/[0.05] p-5">
          <div className="stencil text-[10px] tracking-widest text-primary mb-2">CLASSROOM NOTE</div>
          <ul className="space-y-1.5 text-sm">
            <li>· Works on shared devices — profile lives in browser storage, no login required.</li>
            <li>· <b>No accounts, no tracking.</b> Nothing to set up.</li>
            <li>· <Link to="/pilot" className="text-primary underline">Pilot mode</Link> for anonymous before/after cohort measurement.</li>
            <li>· <Link to="/kit" className="text-primary underline inline-flex items-center gap-1"><Printer className="h-3 w-3" /> Printable Field Kit</Link> for offline sessions and homework.</li>
            <li>· <Link to="/first-phone" className="text-primary underline">First Phone Program</Link> — a 10-lesson path for kids (~10–14) before their first real phone.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-xl border-2 border-primary/40 bg-gradient-to-b from-neutral-900 to-neutral-950 p-5">
          <div className="stencil text-[10px] tracking-widest text-primary mb-2">CITY PLAQUE</div>
          <p className="text-sm">
            The city was built on five articles — verification, every citizen, dignity, every voice, peace.
            Read the <Link to="/charter" className="text-primary underline">City Charter</Link>.
          </p>
          <p className="mt-2 text-[11px] italic text-muted-foreground">
            MILVERSE aligns with UNESCO's vision of media and information literacy — and stands as a city in the MILtiverse.
          </p>
        </section>

        <section className="mt-6 text-xs text-muted-foreground">
          Full tactic list and counter-moves: <Link to="/manual" className="text-primary underline">The Field Manual</Link>.
        </section>
      </main>
    </div>
  );
}

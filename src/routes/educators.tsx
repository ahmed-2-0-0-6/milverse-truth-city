import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { GraduationCap, BookOpen, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/educators")({
  head: () => ({
    meta: [
      { title: "For Educators — MILVERSE" },
      { name: "description", content: "How MILVERSE maps to media & information literacy competencies." },
      { property: "og:title", content: "For Educators — MILVERSE" },
      { property: "og:description", content: "Rehearse the attack before it's real. A MIL trainer built for youth." },
    ],
  }),
  component: EducatorsPage,
});

const COMPETENCIES = [
  {
    id: "access",
    label: "ACCESS",
    line: "Recognise media formats and locate credible sources.",
    milverse: "Cases arrive as WhatsApp forwards, Instagram posts, news screenshots, viral images, and video clips — each with its own visual frame. Players learn what a real source looks like inside each channel.",
  },
  {
    id: "evaluate",
    label: "EVALUATE",
    line: "Verify claims. Distinguish mis-, dis-, and malinformation. Detect manipulation.",
    milverse: "The Verification Toolbelt teaches four real techniques: reverse image search, source checking, cross-checking, date/metadata. The Field Manual names each tactic and its counter-move. Every debrief ends by naming the tactic faced.",
  },
  {
    id: "create",
    label: "CREATE",
    line: "Author and share media responsibly. Correct without harming.",
    milverse: "The Feed grades not only the verdict but the tone of the reply — 'being right rudely' is scored as a loss. The Studio lets players design and share their own cases, teaching by authoring.",
  },
];

const THEORY = [
  {
    Icon: Shield,
    title: "INOCULATION THEORY",
    body: "Rehearsing a manipulation tactic in a safe setting builds resistance in the real world — the same way a vaccine works. MILVERSE is inoculation for the information environment: cases are the practice, the Field Manual is the antibody.",
  },
  {
    Icon: BookOpen,
    title: "LATERAL READING",
    body: "Instead of judging a claim inside the tab it arrives in, professional fact-checkers open new tabs to check sources, cross-references, and the outlet's own record. The Toolbelt makes this the default motion — every case rewards it.",
  },
  {
    Icon: Users,
    title: "SOURCE OVER SURFACE",
    body: "Generative AI has broken the 'does it look real?' test permanently. MILVERSE trains the durable skill: verify the source, not the pixels. The AI-generated cases are unwinnable by inspection and only winnable by source-checking — by design.",
  },
];

function EducatorsPage() {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">← CITY</Link>
        <div className="mt-4 flex items-start gap-3">
          <GraduationCap className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div>
            <div className="font-mono text-xs tracking-[0.3em] text-primary">FOR EDUCATORS</div>
            <h1 className="mt-1 text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              REHEARSE THE ATTACK <span className="text-primary">BEFORE IT'S REAL.</span>
            </h1>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          MILVERSE is a Media &amp; Information Literacy trainer disguised as a noir detective game.
          It maps directly to the UNESCO MIL competency framework (access · evaluate · create) and is designed to be used
          in classrooms, after-school clubs, and community media-literacy sessions.
        </p>

        <section className="mt-8">
          <div className="stencil text-[10px] tracking-widest text-primary mb-3">MIL COMPETENCY MAPPING</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETENCIES.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                <div className="text-3xl font-black text-primary tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{c.label}</div>
                <p className="mt-1 text-sm italic text-muted-foreground">{c.line}</p>
                <p className="mt-3 text-sm">{c.milverse}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="stencil text-[10px] tracking-widest text-primary mb-3">THE PEDAGOGY</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {THEORY.map((t) => (
              <div key={t.title} className="rounded-xl border border-border bg-card p-5">
                <t.Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-2 stencil text-sm tracking-widest">{t.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-primary/40 bg-primary/[0.05] p-5">
          <div className="stencil text-[10px] tracking-widest text-primary mb-2">CLASSROOM USE</div>
          <ul className="space-y-1.5 text-sm">
            <li>· Assign one Feed case per week; run the debrief tactic reveal as the discussion prompt.</li>
            <li>· Use <Link to="/manual" className="text-primary underline">the Field Manual</Link> as the syllabus — one tactic per session.</li>
            <li>· After 3 cases, have students design their own case in <Link to="/studio" className="text-primary underline">the Studio</Link> — teaching by authoring is the create competency.</li>
            <li>· Use <Link to="/pilot" className="text-primary underline">Pilot Mode</Link> to run cohorts and see before/after calibration.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-md border border-border bg-background/50 p-4 text-xs text-muted-foreground">
          <b className="text-foreground">Youth-centred by design.</b> The top rank in MILVERSE is CITY DESIGNER — a player who has learned enough to author and publish new cases for others.
          The whole arc is one sentence: <span className="text-foreground">enter as a target, leave as a designer.</span>
        </section>
      </main>
    </div>
  );
}

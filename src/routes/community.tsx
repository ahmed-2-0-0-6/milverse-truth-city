import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { MessageSquare, Users, Sparkles, Share2, BookOpen, PenTool, Shield } from "lucide-react";
import { CheckpointExam, type Question } from "@/components/CheckpointExam";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Commons & Grade Rooms — MILVERSE" },
      {
        name: "description",
        content:
          "Grade filtered discussion rooms, youth case showcases, peer reflection blogs, and collaborative learning spaces.",
      },
    ],
  }),
  component: CommunityPage,
});

const COMMUNITY_QUESTIONS: Question[] = [
  {
    id: "c1",
    prompt:
      "When sharing student authored scam cases in the Community Studio, what is the key safety principle?",
    options: [
      "All scenarios must be fictionalized and anonymized to focus on tactics rather than real individuals",
      "Using real personal details of classmates to make it realistic",
      "Posting real phone numbers for testing",
    ],
    correctIndex: 0,
    explanation:
      "Educational case creation focuses strictly on tactics and evidence patterns using anonymized fictional scenarios, protecting privacy while building literacy.",
  },
  {
    id: "c2",
    prompt:
      "What is the purpose of grade filtered discussion rooms in the MILVERSE Community Commons?",
    options: [
      "To prevent older students from ever interacting with younger ones",
      "To ensure discussions are age appropriate and allow students to share experiences with peers at similar developmental stages",
      "To rank students by intelligence",
    ],
    correctIndex: 1,
    explanation:
      "Age appropriate framing ensures that scenario complexity, language, and emotional content match the developmental readiness of each group, making the learning effective rather than overwhelming.",
  },
  {
    id: "c3",
    prompt:
      "A student writes a community post that says: 'All forwarded messages are lies, never trust anything shared.' Why is this problematic?",
    options: [
      "Because forwarded messages are always true",
      "Because total rejection of all shared content is paranoia, which is just as miscalibrated as total trust",
      "Because community posts should only contain positive messages",
    ],
    correctIndex: 1,
    explanation:
      "MILVERSE teaches calibration, not blanket rejection. Refusing all forwarded information is a false alarm problem: it burns real connections and misses genuine important messages.",
  },
];

function CommunityPage() {
  return (
    <div className="min-h-dvh grain">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← BACK TO ECOSYSTEM
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-widest text-emerald-400">
              COMMUNITY COMMONS &amp; GRADE ROOMS
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              YOUTH IDEAS &amp; REFLECTION SHOWCASE
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-2xl">
          Connect across age tailored discussion rooms, review peer designed cases from the Studio,
          publish student reflection logs on digital trust, and participate in collaborative
          exercises that build community literacy.
        </p>

        {/* Grade Rooms */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            DISCUSSION ROOMS · BY AGE &amp; GRADE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 backdrop-blur-md">
              <div className="stencil text-xs text-amber-300">
                ROOM 1 · LITTLE CITIZENS (AGES 4-8)
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">Picture Story Reflections</h3>
              <p className="mt-2 text-xs text-white/70">
                Children share drawings inspired by the Early Years stories. Parents can upload photos
                of their child's "Real vs Drawn" artwork. Discussion is moderated and gentle.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 backdrop-blur-md">
              <div className="stencil text-xs text-primary">
                ROOM 2 · FIRST PHONE CADETS (GRADES 1-8)
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">First Phone Reflections</h3>
              <p className="mt-2 text-xs text-white/70">
                Students share what surprised them during their 10 lesson First Phone program and
                discuss suspicious message patterns they encountered safely.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 backdrop-blur-md">
              <div className="stencil text-xs text-teal-300">
                ROOM 3 · SENIOR INVESTIGATORS (GRADES 9-12+)
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">
                Deepfake &amp; AI Provenance Forum
              </h3>
              <p className="mt-2 text-xs text-white/70">
                High school and college students analyze structural evidence, EXIF metadata, and
                cryptographic content credentials. Peer reviewed verification chains welcome.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-5 backdrop-blur-md">
              <div className="stencil text-xs text-violet-300">
                ROOM 4 · EDUCATOR EXCHANGE
              </div>
              <h3 className="mt-1 text-lg font-bold text-white">Teacher Resource Sharing</h3>
              <p className="mt-2 text-xs text-white/70">
                Educators share lesson plans, classroom activity adaptations, and Field Kit
                experiences. Cross pollination between government schools, private institutions, and
                NGO training programs.
              </p>
            </div>
          </div>
        </section>

        {/* Student Blog & Reflection */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            STUDENT BLOG &amp; REFLECTION SHOWCASE
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <PenTool className="h-4 w-4" /> WRITING SPACE
            </div>
            <h2 className="text-xl font-bold text-white">Share Your Verification Journey</h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Write about a time you encountered misinformation and how you handled it. What tools
              did you use? What did you learn? Your reflection helps other students recognize
              similar patterns. All posts are anonymous by default to encourage honest sharing.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                <span className="font-bold text-emerald-300">PROMPT 1:</span> "Describe a message you
                received that turned out to be a scam. What was the first clue?"
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                <span className="font-bold text-teal-300">PROMPT 2:</span> "Have you ever accused
                someone of lying when they were telling the truth? What happened to the
                relationship?"
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                <span className="font-bold text-amber-300">PROMPT 3:</span> "What verification tool
                (reverse image search, source check, etc.) has been most useful to you in real life?"
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                <span className="font-bold text-rose-300">PROMPT 4:</span> "If you could teach one
                MIL skill to your younger sibling, what would it be and why?"
              </div>
            </div>
          </div>
        </section>

        {/* Youth Studio Showcase */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            YOUTH STUDIO CASE SHOWCASE
          </div>
          <div className="rounded-2xl border border-primary/30 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
              <Shield className="h-4 w-4" /> PEER DESIGNED CASES
            </div>
            <h2 className="text-xl font-bold text-white">
              Enter as a Target, Leave as a Designer
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Students who complete at least three MILVERSE cases can enter the Youth Studio to
              design their own scam scenarios. Published cases enter the community archive for other
              students to play. Teaching by authoring is the ultimate form of learning: to build a
              convincing scam scenario, you must deeply understand the tactic. To build a fair one,
              you must ensure the evidence chain is solvable.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/studio"
                search={{ mode: undefined, handoff: undefined }}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                OPEN YOUTH STUDIO →
              </Link>
            </div>
          </div>
        </section>

        {/* Checkpoint Exam */}
        <section className="mt-10">
          <CheckpointExam
            title="Community Commons Checkpoint Exam"
            subtitle="Test your knowledge of peer case creation and community safety"
            questions={COMMUNITY_QUESTIONS}
          />
        </section>
      </main>
    </div>
  );
}

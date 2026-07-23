import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Home, Heart, ShieldCheck, Users, Clock, BookOpen, MessageSquare } from "lucide-react";
import { CheckpointExam, type Question } from "@/components/CheckpointExam";

export const Route = createFileRoute("/homeschool")({
  head: () => ({
    meta: [
      { title: "Homeschool & Family Literacy — MILVERSE" },
      {
        name: "description",
        content:
          "Homeschooling digital media literacy guides, family digital agreements, co-reading toolkits, and weekly activity plans.",
      },
    ],
  }),
  component: HomeschoolPage,
});

const HOMESCHOOL_QUESTIONS: Question[] = [
  {
    id: "hs1",
    prompt: "What is the primary goal of a household digital agreement?",
    options: [
      "Punishing children whenever they touch a device",
      "Establishing shared rules, open communication, and trusted adult channels together",
      "Blocking all internet access completely",
    ],
    correctIndex: 1,
    explanation:
      "Effective household agreements focus on mutual trust, clear boundaries, and ensuring children feel safe seeking help without fear of confiscation.",
  },
  {
    id: "hs2",
    prompt:
      "Your child encounters a suspicious link while browsing. Under your family agreement, what happens?",
    options: [
      "They click it to see what happens, then tell you afterward",
      "They close the tab, show you the link, and you investigate it together",
      "They lose device privileges for the rest of the week",
    ],
    correctIndex: 1,
    explanation:
      "The goal is building a habit of collaborative investigation rather than secrecy or fear of punishment. Children who fear losing devices will hide encounters rather than report them.",
  },
  {
    id: "hs3",
    prompt:
      "Why is 'no device confiscation for reporting' a key rule in family digital agreements?",
    options: [
      "Because devices are expensive and should not be taken away",
      "Because children who fear punishment will hide dangerous encounters instead of seeking help",
      "Because screen time is always beneficial and should never be reduced",
    ],
    correctIndex: 1,
    explanation:
      "When reporting suspicious content leads to device confiscation, children learn to conceal online risks. Protecting the reporting channel is more important than any single incident.",
  },
];

function HomeschoolPage() {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-widest text-rose-400">
              HOMESCHOOL &amp; FAMILY HUB
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              HOUSEHOLD DIGITAL TRUST
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-2xl">
          Homeschooling and family literacy programs build lifelong verification habits. Rather than
          restrictive filtering alone, parents and children collaborate on household agreements,
          shared media analysis, and weekly co-investigation sessions that make truth-seeking a
          natural part of family culture.
        </p>

        {/* The Open Door Agreement */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            FRAMEWORK 1 · THE OPEN DOOR DEVICE CONTRACT
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 mb-2">
              <ShieldCheck className="h-4 w-4" /> FAMILY AGREEMENT TEMPLATE
            </div>
            <h2 className="text-xl font-bold text-white">Three Golden Rules</h2>
            <div className="mt-3 space-y-3 text-sm text-white/80">
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-rose-300">RULE 1:</span> No device confiscation when
                a child reports a suspicious message. The reporting channel must always feel safe.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-amber-300">RULE 2:</span> Verify unknown contacts
                together. When something feels off, the response is "let's check this together," not
                "give me the phone."
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-teal-300">RULE 3:</span> Screen free family dining
                and bedroom charging stations. Devices charge in shared spaces overnight, not under
                pillows.
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Family MIL Activity */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            FRAMEWORK 2 · WEEKLY CO-INVESTIGATION RITUAL
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-2">
              <Clock className="h-4 w-4" /> WEEKLY ACTIVITY
            </div>
            <h2 className="text-xl font-bold text-white">
              "Family Fact Check Friday" (20 Minutes)
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Each Friday, one family member brings a claim they encountered during the week (a
              WhatsApp forward, a social media post, a news headline). The whole family spends 15
              minutes investigating it together using real tools: reverse image search, source
              checking, and cross referencing. The last 5 minutes are for recording findings in a
              shared family "Fact Check Journal."
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <span className="font-bold">TIP FOR PARENTS:</span> Start by bringing your own
              examples. When children see parents admitting "I almost fell for this one," it
              normalizes healthy skepticism and models the verification habit.
            </div>
          </div>
        </section>

        {/* Dinner Table Discussion Cards */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            FRAMEWORK 3 · DINNER TABLE DISCUSSION CARDS
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <MessageSquare className="h-4 w-4" /> CONVERSATION STARTERS
            </div>
            <h2 className="text-xl font-bold text-white">
              Questions That Build Critical Thinking at Mealtimes
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                "What is something you read online this week that surprised you? How did you know it
                was true?"
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                "If someone sent you a message pretending to be a family member, what three questions
                would you ask to verify?"
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                "Why do some videos get millions of views even when they are not true?"
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                "Can you think of a time when being too suspicious (not trusting) was also a
                mistake?"
              </div>
            </div>
          </div>
        </section>

        {/* Checkpoint Exam */}
        <section className="mt-10">
          <CheckpointExam
            title="Family &amp; Homeschool Checkpoint Exam"
            subtitle="Test your family digital trust knowledge"
            questions={HOMESCHOOL_QUESTIONS}
          />
        </section>
      </main>
    </div>
  );
}

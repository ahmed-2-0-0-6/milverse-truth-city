import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { GraduationCap, BookOpen, Printer, Award, Users, Target, Lightbulb } from "lucide-react";
import { CheckpointExam, type Question } from "@/components/CheckpointExam";

export const Route = createFileRoute("/teacher-academy")({
  head: () => ({
    meta: [
      { title: "Teacher Training Academy — MILVERSE" },
      {
        name: "description",
        content:
          "Professional development modules, lesson plans, and classroom facilitation guides for Media & Information Literacy educators.",
      },
    ],
  }),
  component: TeacherAcademyPage,
});

const TEACHER_QUESTIONS: Question[] = [
  {
    id: "t1",
    prompt: "Why does MILVERSE prioritize verification skills over spotting deepfakes?",
    options: [
      "Spotting relies on visual artifacts that disappear as AI improves; verification methods endure indefinitely",
      "Verification is easier to grade on paper exams",
      "Spotting requires expensive graphic cards",
    ],
    correctIndex: 0,
    explanation:
      "Generative AI visual flaws decrease rapidly. Verifying primary sources, out of band credentials, and structural evidence remains effective regardless of AI rendering fidelity.",
  },
  {
    id: "t2",
    prompt:
      "A student gets fooled by a scam scenario in MILVERSE. How should the teacher respond?",
    options: [
      "Point out their mistake publicly to teach the class a lesson",
      "Normalize the experience: getting fooled is human, the goal is calibration, and the debrief teaches more than the verdict",
      "Tell them to try harder next time without discussion",
    ],
    correctIndex: 1,
    explanation:
      "Shame shuts down learning. MILVERSE treats getting fooled as the starting point, not the failure. The debrief conversation is where the real learning happens.",
  },
  {
    id: "t3",
    prompt: "What is the 'two way loss' principle in MILVERSE calibration scoring?",
    options: [
      "Both gullibility (believing fakes) and paranoia (rejecting real people) are scored as errors",
      "Students can only lose points, never gain them",
      "Teachers and students both lose when a lesson fails",
    ],
    correctIndex: 0,
    explanation:
      "MILVERSE tracks both missed scams and false alarms. A student who calls every real person a scammer is just as miscalibrated as one who trusts every impostor.",
  },
];

function TeacherAcademyPage() {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-400/40 text-violet-300">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-widest text-violet-400">
              TEACHER TRAINING ACADEMY
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              HOW TO TEACH MEDIA &amp; INFORMATION LITERACY
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-2xl">
          Empower your classroom with active rehearsal methods. Learn to facilitate non-judgmental
          discussions, guide evidence analysis, and deploy offline paper field kits in low
          connectivity settings. This academy is designed for government school teachers, NGO
          trainers, and anyone facilitating MIL education.
        </p>

        {/* Principle 1 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            PRINCIPLE 1 · REHEARSAL OVER LECTURE
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300 mb-2">
              <BookOpen className="h-4 w-4" /> PEDAGOGICAL FOUNDATION
            </div>
            <h2 className="text-xl font-bold text-white">Why Rehearsal Works</h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Lectures on digital safety produce passive agreement but low retention. Telling
              students "don't click suspicious links" creates head-nodding, not habit formation.
              MILVERSE places students inside simulated scenarios where they must analyze raw
              artifacts, make decisions under uncertainty, and face consequences in a safe
              environment. This creates active cognitive resistance against real manipulation
              attempts. The memory of being fooled in a game is stronger than any lecture slide.
            </p>
          </div>
        </section>

        {/* Principle 2 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            PRINCIPLE 2 · THE DEBRIEF IS THE LESSON
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <Users className="h-4 w-4" /> FACILITATION GUIDE
            </div>
            <h2 className="text-xl font-bold text-white">
              Facilitating Without Judging
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              After each simulation round, the debrief conversation matters more than the verdict.
              Ask open questions: "What made you trust this message?" "What would you check
              differently next time?" Never shame a student for getting fooled. Normalize the
              experience. Professional intelligence analysts get fooled regularly. The skill is not
              perfection; the skill is calibration: improving accuracy over time.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <span className="font-bold">FACILITATION SCRIPT:</span> "This scenario tricked most
              adults when we tested it. Let's talk about why. What was the first thing that felt
              real? What was the first thing that felt off? If you got this message tomorrow, what
              would you do before responding?"
            </div>
          </div>
        </section>

        {/* Principle 3 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            PRINCIPLE 3 · OFFLINE DEPLOYMENT
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-2">
              <Printer className="h-4 w-4" /> ZERO CONNECTIVITY MODE
            </div>
            <h2 className="text-xl font-bold text-white">
              Running MILVERSE With No Internet
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Many government schools and rural NGO training centers lack reliable internet. MILVERSE
              addresses this with two systems: the PWA offline mode (works after one initial load on
              any device) and the printable Field Kit (works with zero devices, zero electricity).
              The Field Kit contains six case card pairs, a PAUSE poster, and a Trust Calibration
              scoreboard. One teacher, one printed deck, same verification training.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <span className="font-bold">PREPARATION CHECKLIST:</span> 1. Print the Field Kit at
              least one day before class. 2. Cut the case cards into individual cards. 3. Post the
              PAUSE poster where all students can see it. 4. Review the Teacher's Guide notes on
              each card before the session.
            </div>
          </div>
        </section>

        {/* 45 Minute Lesson Plan */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            READY-TO-USE · 45 MINUTE LESSON PLAN
          </div>
          <div className="rounded-2xl border border-primary/30 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
              <Target className="h-4 w-4" /> STRUCTURED SESSION
            </div>
            <h2 className="text-xl font-bold text-white">
              "Can You Trust This Message?" (Single Period Session)
            </h2>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-primary">MINUTES 0 to 5 · WARM UP:</span> Ask the
                class: "Has anyone received a suspicious message this week?" Let two or three
                students share briefly. Establish the ground rule: no shame for being fooled.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-teal-300">MINUTES 5 to 20 · PLAY:</span> Run two
                rounds of the Field Kit (or MILVERSE on devices). Students work in pairs: one plays
                the Target, one observes. After each round, the observer records the verdict on the
                Calibration Scoreboard.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-amber-300">MINUTES 20 to 35 · DEBRIEF:</span> Use
                the facilitation script above. Ask each pair what evidence they used. Highlight both
                correct catches and false alarms. Emphasize: paranoia is also a loss.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="font-bold text-rose-300">MINUTES 35 to 45 · SYNTHESIS:</span>{" "}
                Introduce the PAUSE framework (Pause, Ask who benefits, Use sources, See evidence,
                Evaluate context). Students write one personal "verification promise" on a sticky
                note for their desk.
              </div>
            </div>
          </div>
        </section>

        {/* Checkpoint Exam */}
        <section className="mt-10">
          <CheckpointExam
            title="Teacher Academy Certification Exam"
            subtitle="Verify your understanding of MIL pedagogy"
            questions={TEACHER_QUESTIONS}
          />
        </section>
      </main>
    </div>
  );
}

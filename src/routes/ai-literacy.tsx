import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Cpu, ShieldAlert, FileSearch, Binary, Lock, Eye, Mic, Globe } from "lucide-react";
import { CheckpointExam, type Question } from "@/components/CheckpointExam";

export const Route = createFileRoute("/ai-literacy")({
  head: () => ({
    meta: [
      { title: "AI & Synthetic Media Literacy — MILVERSE" },
      {
        name: "description",
        content:
          "Advanced verification techniques for deepfakes, synthetic audio, algorithmic outrage, and content provenance standards.",
      },
    ],
  }),
  component: AILiteracyPage,
});

const AI_QUESTIONS: Question[] = [
  {
    id: "ai1",
    prompt:
      "An audio note arrives from an executive claiming an emergency funds transfer is needed immediately. What is the most reliable verification method?",
    options: [
      "Trust the voice tone because it sounds authentic",
      "Verify via a known out of band secondary phone call or official channel",
      "Rely solely on an automated AI detector tool",
    ],
    correctIndex: 1,
    explanation:
      "Voice clones can replicate tone and cadence accurately. Out of band verification through established secondary channels remains the gold standard for confirmation.",
  },
  {
    id: "ai2",
    prompt: "What does C2PA content provenance metadata provide?",
    options: [
      "A cryptographically verifiable record of how and when digital content was created or edited",
      "A legal guarantee that an image is 100% truthful",
      "An automated virus scanner for video files",
    ],
    correctIndex: 0,
    explanation:
      "C2PA open standards embed secure cryptographic metadata tracking source device, editing history, and original creation details.",
  },
  {
    id: "ai3",
    prompt:
      "A viral video shows a famous politician saying something outrageous that no news outlet has covered. What is your first verification step?",
    options: [
      "Share it immediately because it looks real and people need to know",
      "Search for the original source, check if reputable outlets covered it, and inspect visual inconsistencies",
      "Trust it because the politician's face and voice look perfect",
    ],
    correctIndex: 1,
    explanation:
      "Absence from credible outlets is a strong red flag. Source tracing, cross referencing with established journalism, and careful visual inspection form the verification foundation.",
  },
  {
    id: "ai4",
    prompt:
      "Why are 'AI detector tools' alone insufficient for determining whether content is synthetic?",
    options: [
      "They are 100% accurate and always reliable",
      "They produce false positives and false negatives, and their confidence scores do not equal certainty",
      "They can only detect text, not images or video",
    ],
    correctIndex: 1,
    explanation:
      "No AI detector achieves perfect accuracy. False positives flag authentic content as synthetic, while false negatives miss generated content entirely. Structural evidence analysis must always supplement automated tools.",
  },
];

function AILiteracyPage() {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-widest text-cyan-400">
              HIGH SCHOOL &amp; UNIVERSITY (GRADES 9-12+)
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              AI &amp; SYNTHETIC MEDIA VERIFICATION
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-2xl">
          In the generative AI era, media creation is instant and democratized. Spotting visual
          artifacts is no longer sufficient. Modern verification relies on cryptographic provenance,
          out of band authentication, and structural source evaluation. This module equips you with
          the frameworks that outlast any single generation of AI models.
        </p>

        {/* Module 1 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            MODULE 1 · VOICE CLONING &amp; AUDIO VERIFICATION
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 mb-2">
              <Mic className="h-4 w-4" /> SYNTHETIC AUDIO
            </div>
            <h2 className="text-xl font-bold text-white">
              Voice Clones &amp; Out of Band Protocol
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Generative voice synthesis requires as little as three seconds of reference audio to
              clone cadence and pitch. When urgent requests arrive via audio notes, reliance on vocal
              familiarity alone creates vulnerability. The countermeasure is procedural: establish out
              of band verification channels before any high-stakes request is fulfilled. Call back on
              a known number. Verify through a second medium. Never act on urgency alone.
            </p>
            <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">
              <span className="font-bold">SCENARIO DRILL:</span> Imagine receiving a WhatsApp voice
              note from your manager's number saying: "Transfer the project funds to this new account
              immediately, I am in a meeting." Write down three verification steps you would take
              before acting.
            </div>
          </div>
        </section>

        {/* Module 2 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            MODULE 2 · CONTENT PROVENANCE &amp; C2PA
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-caution mb-2">
              <FileSearch className="h-4 w-4" /> METADATA INSPECTION
            </div>
            <h2 className="text-xl font-bold text-white">
              Content Credentials &amp; Metadata Inspection
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Open provenance standards (C2PA, developed by Adobe, Microsoft, BBC, and others) attach
              tamper evident manifests to digital media. Inspecting EXIF headers, camera signatures,
              and cryptographic chains verifies whether an image originated from a physical sensor or
              a generative model. Tools like Content Authenticity Initiative's Verify allow public
              inspection of these manifests.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <span className="font-bold">HANDS ON EXERCISE:</span> Take a photograph with your
              phone. Then download any AI generated image from the internet. Compare their EXIF
              metadata. Document what information is present in the real photograph and what is
              missing or fabricated in the AI generated image.
            </div>
          </div>
        </section>

        {/* Module 3 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            MODULE 3 · ALGORITHMIC OUTRAGE &amp; ENGAGEMENT BAIT
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 mb-2">
              <Eye className="h-4 w-4" /> ATTENTION ENGINEERING
            </div>
            <h2 className="text-xl font-bold text-white">
              How Algorithms Amplify Outrage
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Social media recommendation systems optimize for engagement, not accuracy. Content that
              triggers strong emotional reactions (anger, fear, moral outrage) generates more clicks,
              comments, and shares. This creates a feedback loop where the most inflammatory content
              receives the widest distribution, regardless of its truthfulness. Recognizing when your
              emotional response is being engineered is the first layer of defense.
            </p>
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              <span className="font-bold">REFLECTION EXERCISE:</span> Scroll through your social
              media feed for five minutes. Identify three posts that made you feel strong emotions.
              For each one, ask: "Was this designed to inform me, or to provoke a reaction?" Write
              your findings in a short journal entry.
            </div>
          </div>
        </section>

        {/* Module 4 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            MODULE 4 · VISUAL DEEPFAKES &amp; VIDEO ANALYSIS
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300 mb-2">
              <Globe className="h-4 w-4" /> STRUCTURAL VERIFICATION
            </div>
            <h2 className="text-xl font-bold text-white">
              Beyond Pixel Artifacts: Source Level Verification
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Early deepfakes had visible seams: blurry edges around faces, inconsistent lighting,
              and mismatched eye reflections. Modern generative models produce near flawless output.
              This means pixel level inspection is increasingly unreliable. Verification must shift
              to structural questions: Does this event have independent journalistic coverage? Does
              the original upload trace to a credible account? Do multiple independent sources
              confirm the same claim? Are there contemporaneous corroborating records?
            </p>
            <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-200">
              <span className="font-bold">GROUP INVESTIGATION:</span> Your teacher will present a
              video clip. Working in teams of three, attempt to verify or debunk it using only public
              sources. Document your entire evidence chain: what you searched, what you found, and
              what your final confidence level is (0% to 100%).
            </div>
          </div>
        </section>

        {/* Checkpoint Exam */}
        <section className="mt-10">
          <CheckpointExam
            title="AI &amp; Synthetic Media Checkpoint Exam"
            subtitle="Verify your mastery of generative media verification standards"
            questions={AI_QUESTIONS}
          />
        </section>
      </main>
    </div>
  );
}

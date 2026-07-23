import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Sparkles, Sun, Shield, Heart, Users, BookOpen, Ear } from "lucide-react";
import { CheckpointExam, type Question } from "@/components/CheckpointExam";

export const Route = createFileRoute("/early-years")({
  head: () => ({
    meta: [
      { title: "Early Years MIL (Ages 4-7) — MILVERSE" },
      {
        name: "description",
        content:
          "Media literacy picture stories, listening exercises, and parent co-viewing guides for early learners aged 4 to 7.",
      },
    ],
  }),
  component: EarlyYearsPage,
});

const EARLY_QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "When you see a cartoon talking bear on a screen, is it real or a drawing?",
    options: [
      "It is a real living bear in your house",
      "It is a drawing made by artists on a screen",
      "It is a magic bear that lives in phones",
    ],
    correctIndex: 1,
    explanation:
      "Cartoons and screen characters are creative drawings made by artists. They are fun to watch but not real living animals.",
  },
  {
    id: "q2",
    prompt:
      "If a stranger sends a message to your parent's phone asking for your secret code, what should you do?",
    options: [
      "Give them the code immediately",
      "Tell a trusted parent or adult right away",
      "Hide the phone under your pillow",
    ],
    correctIndex: 1,
    explanation:
      "Always inform your parent or trusted adult whenever anyone asks for private details or secret codes.",
  },
  {
    id: "q3",
    prompt: "A colorful ad on a tablet says 'FREE TOY! Click here NOW!' What should you think?",
    options: [
      "Click right away because free toys are exciting",
      "Ask a parent first, because real gifts do not pop up on screens from strangers",
      "Share the ad with all your friends so they get free toys too",
    ],
    correctIndex: 1,
    explanation:
      "Ads that promise free things and ask you to click are usually tricks. Real gifts come from people you know and trust, not random pop ups on screens.",
  },
  {
    id: "q4",
    prompt: "Your friend says they saw a video of a fish that can talk. Is the fish really talking?",
    options: [
      "Yes, some fish can talk underwater",
      "No, someone edited the video or drew the talking fish using a computer",
      "Yes, but only rare magical fish can do it",
    ],
    correctIndex: 1,
    explanation:
      "Videos can be edited to make anything look real. Fish cannot talk. Someone used computer tools to add a voice or animate the fish's mouth.",
  },
];

function EarlyYearsPage() {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
            <Sun className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-widest text-amber-400">
              PRE-SCHOOL &amp; EARLY YEARS (AGES 4 TO 7)
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              FIRST STEPS IN MEDIA LITERACY
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-2xl">
          Early media literacy begins before children own devices. Through guided picture stories,
          listening exercises, and parent co-reading, young learners develop healthy screen
          awareness, distinguish fantasy drawings from real photography, and practice open
          communication with trusted adults.
        </p>

        {/* Story Module 1 */}
        <section className="mt-8 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            STORY MODULE 1 · REAL vs DRAWN
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-2">
              <Sparkles className="h-4 w-4" /> PICTURE STORY
            </div>
            <h2 className="text-xl font-bold text-white">
              The Flying Dragon &amp; The Real Puppy
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              On screen, dragons breathe colorful fire and fly across cities. Artists draw them frame
              by frame. Real puppies bark, need water, and live in real houses. Screens show both
              imagination and reality. Learning to tell them apart keeps our minds curious and
              grounded.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <span className="font-bold">PARENT CO-READING PROMPT:</span> Ask your child: "Can a
              real puppy fit inside a phone?" Discuss how screens show pictures of things, not the
              physical objects themselves.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 mb-2">
              <Shield className="h-4 w-4" /> SAFETY STORY
            </div>
            <h2 className="text-xl font-bold text-white">
              The Secret Code &amp; Trusted Adults
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              When a doorbell rings at home, we ask a parent before opening the door. Online messages
              work the same way. If a message asks for your name, age, or photo, always show your
              parent or teacher first.
            </p>
            <div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-teal-200">
              <span className="font-bold">FAMILY ACTIVITY:</span> Practice the "Show Adult First"
              rule together using a toy phone. Take turns pretending to receive messages and deciding
              which ones need a parent's eyes first.
            </div>
          </div>
        </section>

        {/* Story Module 2 */}
        <section className="mt-10 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            STORY MODULE 2 · ADS, TRICKS &amp; SCREEN TIME
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 mb-2">
              <Heart className="h-4 w-4" /> FEELINGS STORY
            </div>
            <h2 className="text-xl font-bold text-white">
              The Pop-Up That Promised Free Toys
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Sometimes bright flashing boxes appear on screens shouting "FREE TOY! CLICK NOW!" They
              use big exciting colors and countdown timers to make your heart race. Real gifts come
              from people you know and love, not from blinking boxes on screens. When something tries
              to rush you into clicking, that is the trick itself.
            </p>
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              <span className="font-bold">PARENT DISCUSSION:</span> Show your child an example of a
              flashy banner ad (from a safe screenshot). Ask together: "Who made this? Why do they
              want us to click?" Practice the pause: "When it feels rushed, we slow down."
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-300 mb-2">
              <Ear className="h-4 w-4" /> LISTENING EXERCISE
            </div>
            <h2 className="text-xl font-bold text-white">
              The Talking Fish Video
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Your friend shows you a video where a goldfish appears to speak full sentences. The
              mouth moves perfectly with the words! But real fish do not have vocal cords or lips
              shaped for human speech. Someone used computer tools to animate the fish's mouth and
              added a human voice recording on top. Just because something looks real on screen does
              not make it real in life.
            </p>
            <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-200">
              <span className="font-bold">GROUP ACTIVITY:</span> Watch a funny animal video together
              and ask: "Is this animal really doing what we see? How could someone make a video look
              like this?" Draw pictures of "real animals" vs "screen trick animals."
            </div>
          </div>
        </section>

        {/* Story Module 3 */}
        <section className="mt-10 space-y-6">
          <div className="stencil text-[10px] tracking-widest text-primary">
            STORY MODULE 3 · KINDNESS &amp; SCREEN BALANCE
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <Users className="h-4 w-4" /> EMPATHY STORY
            </div>
            <h2 className="text-xl font-bold text-white">Words Travel Far on Screens</h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              When you whisper to a friend in the playground, only they hear you. But when you type
              words on a screen, those words can travel to hundreds of people in seconds. A kind
              message makes many people smile. A hurtful message makes many people sad. Before
              typing, imagine you are saying it out loud in front of your whole class. Would you
              still say it?
            </p>
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <span className="font-bold">CLASSROOM ACTIVITY:</span> Write a kind message on a
              paper airplane and fly it across the room. Then write the same message on a pretend
              "screen" (a whiteboard). Notice how the whiteboard message is visible to everyone at
              once. Discuss the difference.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-2">
              <BookOpen className="h-4 w-4" /> BALANCE STORY
            </div>
            <h2 className="text-xl font-bold text-white">
              The Day the Screen Got Tired
            </h2>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Imagine if your tablet could talk. After three hours of cartoons, it might say: "I need
              a rest! And so do your eyes!" Our eyes, our brains, and our bodies all need breaks from
              screens. Playing outside, drawing with crayons, and talking face to face with family
              are just as important as anything on a screen.
            </p>
            <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
              <span className="font-bold">PARENT CHILD CHALLENGE:</span> Set a "screen rest" timer
              together. When it rings, both parent and child put down all devices for 15 minutes and
              do something with hands: build blocks, draw, or cook together.
            </div>
          </div>
        </section>

        {/* Checkpoint Exam */}
        <section className="mt-10">
          <CheckpointExam
            title="Early Years Checkpoint Quiz"
            subtitle="Test what you learned from the story cards together"
            questions={EARLY_QUESTIONS}
          />
        </section>
      </main>
    </div>
  );
}

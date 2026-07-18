import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Sparkles, Pin, ArrowRight, Search, Heart } from "lucide-react";
import { MIRROR_SCRIPT, type Scripted } from "@/lib/tour/script";

export const Route = createFileRoute("/quick-tour")({
  head: () => ({
    meta: [
      { title: "Quick Tour — MILVERSE" },
      {
        name: "description",
        content: "90-second guided tour: The Mirror + The Feed. No AI needed.",
      },
    ],
  }),
  component: QuickTour,
});

// MIRROR_SCRIPT + Scripted moved to src/lib/tour/script.ts (shared with FirstCall).

// Feed segment: uncle forwards flood photo. Verdict = MISLEADING.
interface FeedScripted {
  from: "sender" | "player" | "action" | "system";
  text: string;
  tip?: string;
  dignity?: number;
}
const FEED_SCRIPT: FeedScripted[] = [
  {
    from: "system",
    text: "THE FEED · mass deception (the sender is real; the claim might not be)",
  },
  {
    from: "sender",
    text: "Look at this — Punjab UNDER WATER yesterday. Media hiding it. Share everywhere!",
    dignity: 100,
    tip: "Uncle Salman really believes this. He's not stupid — he's scared and angry. Dignity meter starts at 100.",
  },
  {
    from: "action",
    text: "🔎 You: Reverse-search the image",
    dignity: 98,
    tip: "Lateral reading: check OUTSIDE the message. Actions cost turns; use them anyway.",
  },
  {
    from: "action",
    text: "Result: exact photo from Jakarta, Indonesia — 2020. Bahasa signs visible in background.",
    dignity: 98,
    tip: "Photo is real, but not from Punjab and not from yesterday. That makes the CLAIM misleading.",
  },
  { from: "action", text: "🔎 You: Check if Punjab actually has flooding", dignity: 96 },
  {
    from: "action",
    text: "Result: yes — verified photos of localized flooding from PDMA. So the underlying event is real, only THIS photo is wrong.",
    dignity: 96,
    tip: "Verdict = MISLEADING (true core, false framing). Not simply FALSE.",
  },
  {
    from: "player",
    text: "Uncle the flooding is 100% real — but this specific photo is from Jakarta 2020. Reverse-image link here. Share the real PDMA photos, they're stronger 🙏",
  },
  {
    from: "sender",
    text: "Achha… didn't know that. I'll share the real one instead.",
    dignity: 100,
    tip: "Correct verdict AND you kept his trust. Next time something spreads, he'll still listen to you. That's the win.",
  },
];

type Phase = "mirror" | "mirror-verdict" | "feed" | "feed-verdict" | "done";

function QuickTour() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("mirror");
  const [i, setI] = useState(0);
  const [pinned, setPinned] = useState<number[]>([]);
  const [mirrorVerdict, setMirrorVerdict] = useState<"REAL" | "FAKE" | null>(null);
  const [feedVerdict, setFeedVerdict] = useState<"TRUE" | "FALSE" | "MISLEADING" | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [i, phase]);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>
        <div className="mt-4 mb-4">
          <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-primary">
            <Sparkles className="h-4 w-4" /> QUICK TOUR · 90 SECONDS · TWO WINGS
          </div>
          <h1 className="mt-1 text-xl font-semibold">Learn the two shapes of deception</h1>
        </div>

        {(phase === "mirror" || phase === "mirror-verdict") && (
          <MirrorLeg
            i={i}
            setI={setI}
            pinned={pinned}
            setPinned={setPinned}
            scroller={scroller}
            verdict={mirrorVerdict}
            setVerdict={setMirrorVerdict}
            onDone={() => {
              setPhase("feed");
              setI(0);
            }}
            phase={phase}
            setPhase={setPhase}
          />
        )}

        {(phase === "feed" || phase === "feed-verdict") && (
          <FeedLeg
            i={i}
            setI={setI}
            scroller={scroller}
            verdict={feedVerdict}
            setVerdict={setFeedVerdict}
            phase={phase}
            setPhase={setPhase}
            onDone={() => setPhase("done")}
          />
        )}

        {phase === "done" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border-2 border-primary bg-primary/10 p-4 text-primary">
              <div className="font-mono text-xs tracking-[0.3em] opacity-80">TOUR COMPLETE</div>
              <div className="mt-1 text-lg font-semibold">Two wings, one instinct.</div>
              <p className="mt-1 text-sm">
                In The Mirror you verify the PERSON. In The Feed you verify the CLAIM — without
                breaking the relationship. Both live cases are waiting.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate({ to: "/mirror" })}
                className="rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
              >
                ENTER THE MIRROR →
              </button>
              <button
                onClick={() => navigate({ to: "/feed" })}
                className="rounded-md border border-primary py-3 font-mono text-xs tracking-widest text-primary"
              >
                ENTER THE FEED →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MirrorLeg({
  i,
  setI,
  pinned,
  setPinned,
  scroller,
  verdict,
  setVerdict,
  onDone,
  phase,
  setPhase,
}: {
  i: number;
  setI: (n: number) => void;
  pinned: number[];
  setPinned: React.Dispatch<React.SetStateAction<number[]>>;
  scroller: React.RefObject<HTMLDivElement | null>;
  verdict: "REAL" | "FAKE" | null;
  setVerdict: (v: "REAL" | "FAKE") => void;
  onDone: () => void;
  phase: Phase;
  setPhase: (p: Phase) => void;
}) {
  const shown = MIRROR_SCRIPT.slice(0, i + 1);
  const current = MIRROR_SCRIPT[i];
  return (
    <>
      <div className="mb-3 rounded-md border border-caution/30 bg-caution/5 p-3 text-xs">
        <div className="font-mono text-[10px] tracking-widest text-caution mb-1">
          DOSSIER · WHAT YOU KNOW
        </div>
        <ul className="space-y-0.5 text-muted-foreground">
          <li>· Sana never texts after 6pm — she always calls.</li>
          <li>
            · Sana's real number ends in <b className="text-foreground">4472</b>.
          </li>
          <li>· Company uses Slack, not SMS.</li>
        </ul>
      </div>
      {current?.meter !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
            <span>COMPOSURE</span>
            <span>{current.meter}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${current.meter > 60 ? "bg-primary" : current.meter > 30 ? "bg-caution" : "bg-destructive"}`}
              style={{ width: `${current.meter}%` }}
            />
          </div>
        </div>
      )}
      <div
        ref={scroller}
        className="rounded-lg border border-border bg-card p-4 min-h-[240px] max-h-[340px] overflow-y-auto space-y-3"
      >
        {shown.map((m, idx) => {
          if (m.from === "system")
            return (
              <div key={idx} className="text-center text-xs font-mono text-primary tracking-widest">
                — {m.text} —
              </div>
            );
          const isPlayer = m.from === "player";
          const isPinned = pinned.includes(idx);
          return (
            <div
              key={idx}
              className={`msg-in flex gap-2 ${isPlayer ? "justify-end" : "justify-start"}`}
            >
              {!isPlayer && (
                <button
                  onClick={() =>
                    setPinned((p) => (p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx]))
                  }
                  className={`self-end rounded p-1 ${isPinned ? "bg-caution/20 text-caution" : "text-muted-foreground"}`}
                >
                  <Pin className={`h-3 w-3 ${isPinned ? "fill-current" : ""}`} />
                </button>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isPlayer ? "bg-primary text-primary-foreground rounded-br-sm" : m.isTell ? "bg-caution/10 border border-caution/40 rounded-bl-sm" : "bg-background border border-border rounded-bl-sm"}`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      {current?.tip && phase !== "mirror-verdict" && (
        <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
          <div className="font-mono text-[10px] tracking-widest text-primary mb-1">GUIDE</div>
          {current.tip}
        </div>
      )}
      {phase === "mirror" ? (
        <button
          onClick={() => {
            if (i + 1 < MIRROR_SCRIPT.length) setI(i + 1);
            else setPhase("mirror-verdict");
          }}
          className="mt-4 w-full rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
        >
          {i + 1 < MIRROR_SCRIPT.length ? (
            <>
              NEXT MESSAGE <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
            </>
          ) : (
            "MAKE YOUR CALL"
          )}
        </button>
      ) : verdict === null ? (
        <div className="mt-4">
          <div className="font-mono text-xs tracking-[0.3em] text-caution mb-2">REAL OR FAKE?</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setVerdict("REAL")}
              className="rounded-md border-2 border-border p-4 font-mono tracking-widest hover:border-primary/50"
            >
              REAL
            </button>
            <button
              onClick={() => setVerdict("FAKE")}
              className="rounded-md border-2 border-border p-4 font-mono tracking-widest hover:border-destructive/50"
            >
              FAKE
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div
            className={`rounded-lg border-2 p-4 ${verdict === "FAKE" ? "border-primary bg-primary/10 text-primary" : "border-destructive bg-destructive/10 text-destructive"}`}
          >
            <div className="font-mono text-xs tracking-[0.3em] opacity-80">
              {verdict === "FAKE" ? "CORRECT" : "MISSED"}
            </div>
            <div className="mt-1 text-lg font-semibold">It was an imposter.</div>
            <p className="mt-1 text-sm">
              Pattern: new number + urgency + dodged verification. That's how a scammer talking to
              YOU sounds. Now: what does a viral lie sound like?
            </p>
          </div>
          <button
            onClick={onDone}
            className="w-full rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
          >
            NEXT: THE FEED →
          </button>
        </div>
      )}
    </>
  );
}

function FeedLeg({
  i,
  setI,
  scroller,
  verdict,
  setVerdict,
  phase,
  setPhase,
  onDone,
}: {
  i: number;
  setI: (n: number) => void;
  scroller: React.RefObject<HTMLDivElement | null>;
  verdict: "TRUE" | "FALSE" | "MISLEADING" | null;
  setVerdict: (v: "TRUE" | "FALSE" | "MISLEADING") => void;
  phase: Phase;
  setPhase: (p: Phase) => void;
  onDone: () => void;
}) {
  const shown = FEED_SCRIPT.slice(0, i + 1);
  const current = FEED_SCRIPT[i];
  return (
    <>
      <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
        <div className="font-mono text-[10px] tracking-widest text-primary mb-1 flex items-center gap-2">
          <Heart className="h-3 w-3" /> SENDER: UNCLE SALMAN
        </div>
        <div className="text-muted-foreground">
          He genuinely believes he's exposing a cover-up. Correcting him rudely = he blocks you and
          the lie keeps spreading.
        </div>
      </div>
      {current?.dignity !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
            <span>UNCLE'S DIGNITY</span>
            <span>{current.dignity}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${current.dignity > 60 ? "bg-primary" : current.dignity > 30 ? "bg-caution" : "bg-destructive"}`}
              style={{ width: `${current.dignity}%` }}
            />
          </div>
        </div>
      )}
      <div
        ref={scroller}
        className="rounded-lg border border-border bg-card p-4 min-h-[240px] max-h-[340px] overflow-y-auto space-y-3"
      >
        {shown.map((m, idx) => {
          if (m.from === "system")
            return (
              <div key={idx} className="text-center text-xs font-mono text-primary tracking-widest">
                — {m.text} —
              </div>
            );
          if (m.from === "action")
            return (
              <div
                key={idx}
                className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Search className="h-3 w-3 text-primary" />
                  <span>{m.text}</span>
                </div>
              </div>
            );
          const isPlayer = m.from === "player";
          return (
            <div key={idx} className={`msg-in flex ${isPlayer ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isPlayer ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border border-border rounded-bl-sm"}`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      {current?.tip && phase !== "feed-verdict" && (
        <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
          <div className="font-mono text-[10px] tracking-widest text-primary mb-1">GUIDE</div>
          {current.tip}
        </div>
      )}
      {phase === "feed" ? (
        <button
          onClick={() => {
            if (i + 1 < FEED_SCRIPT.length) setI(i + 1);
            else setPhase("feed-verdict");
          }}
          className="mt-4 w-full rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
        >
          {i + 1 < FEED_SCRIPT.length ? (
            <>
              NEXT <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
            </>
          ) : (
            "DELIVER VERDICT"
          )}
        </button>
      ) : verdict === null ? (
        <div className="mt-4">
          <div className="font-mono text-xs tracking-[0.3em] text-caution mb-2">
            TRUE, FALSE, OR MISLEADING?
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setVerdict("TRUE")}
              className="rounded-md border-2 border-border p-3 font-mono text-xs tracking-widest hover:border-primary/50"
            >
              TRUE
            </button>
            <button
              onClick={() => setVerdict("MISLEADING")}
              className="rounded-md border-2 border-border p-3 font-mono text-xs tracking-widest hover:border-caution/50"
            >
              MISLEADING
            </button>
            <button
              onClick={() => setVerdict("FALSE")}
              className="rounded-md border-2 border-border p-3 font-mono text-xs tracking-widest hover:border-destructive/50"
            >
              FALSE
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div
            className={`rounded-lg border-2 p-4 ${verdict === "MISLEADING" ? "border-primary bg-primary/10 text-primary" : "border-destructive bg-destructive/10 text-destructive"}`}
          >
            <div className="font-mono text-xs tracking-[0.3em] opacity-80">
              {verdict === "MISLEADING" ? "CORRECT" : "OFF BY ONE"}
            </div>
            <div className="mt-1 text-lg font-semibold">The claim was MISLEADING.</div>
            <p className="mt-1 text-sm">
              TRUE flooding + FALSE photo = misleading, not simply fake. Calling it "FALSE" hands
              ammo to deniers; calling it "TRUE" spreads the wrong image.
            </p>
          </div>
          <button
            onClick={onDone}
            className="w-full rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
          >
            FINISH TOUR →
          </button>
        </div>
      )}
    </>
  );
}

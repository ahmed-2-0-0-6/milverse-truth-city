import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Sparkles, Pin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/quick-tour")({
  head: () => ({
    meta: [
      { title: "Quick Tour — MILVERSE" },
      { name: "description", content: "90-second guided case. No AI needed." },
    ],
  }),
  component: QuickTour,
});

interface Scripted {
  from: "contact" | "player" | "system";
  text: string;
  tip?: string;
  meter?: number;
  isTell?: boolean;
}

const SCRIPT: Scripted[] = [
  { from: "system", text: "You get a text from an unknown number." },
  { from: "contact", text: "Hi — it's Sana. Lost my phone, this is a temp number. Small urgent favor?", meter: 90, tip: "New number + urgency + a favor. Note it in the DOSSIER: your real manager Sana calls after hours, not texts." },
  { from: "player", text: "Wait — what was your old number's last 4 digits?" },
  { from: "contact", text: "temp SIM. don't call the old one, it's bricked.", meter: 78, isTell: true, tip: "She DODGED a dossier question. A real Sana would say '4472' without thinking. Composure dropped." },
  { from: "player", text: "Can I call you back through Slack?" },
  { from: "contact", text: "phone's dying, no time — sms is faster, promise.", meter: 65, isTell: true, tip: "REFUSED out-of-band verification. Real people welcome it — this is the imposter signature." },
  { from: "contact", text: "Can you grab 4x ₨5,000 Amazon gift cards? Photograph the codes and send.", meter: 55, isTell: true, tip: "GIFT CARDS. Irreversible. Combined with new-number + urgency + dodged verification = the full pattern." },
];

function QuickTour() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [pinned, setPinned] = useState<number[]>([]);
  const [ended, setEnded] = useState(false);
  const [verdict, setVerdict] = useState<"REAL" | "FAKE" | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [i]);

  const shown = SCRIPT.slice(0, i + 1);
  const current = SCRIPT[i];

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
          ← CITY
        </Link>

        <div className="mt-4 mb-4">
          <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-primary">
            <Sparkles className="h-4 w-4" /> QUICK TOUR · 90 SECONDS
          </div>
          <h1 className="mt-1 text-xl font-semibold">Watch how a case unfolds</h1>
        </div>

        {/* Dossier ribbon */}
        <div className="mb-3 rounded-md border border-caution/30 bg-caution/5 p-3 text-xs">
          <div className="font-mono text-[10px] tracking-widest text-caution mb-1">DOSSIER · WHAT YOU KNOW</div>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>· Sana never texts after 6pm — she always calls.</li>
            <li>· Sana's real number ends in <b className="text-foreground">4472</b>.</li>
            <li>· Company uses Slack, not SMS.</li>
          </ul>
        </div>

        {/* Meter */}
        {current?.meter !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground">
              <span>COMPOSURE</span>
              <span>{current.meter}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full transition-all duration-500 ${current.meter > 60 ? "bg-primary" : current.meter > 30 ? "bg-caution" : "bg-destructive"}`} style={{ width: `${current.meter}%` }} />
            </div>
          </div>
        )}

        <div ref={scroller} className="rounded-lg border border-border bg-card p-4 min-h-[280px] max-h-[380px] overflow-y-auto space-y-3">
          {shown.map((m, idx) => {
            if (m.from === "system") return <div key={idx} className="text-center text-xs font-mono text-muted-foreground tracking-widest">— {m.text} —</div>;
            const isPlayer = m.from === "player";
            const isPinned = pinned.includes(idx);
            return (
              <div key={idx} className={`msg-in flex gap-2 ${isPlayer ? "justify-end" : "justify-start"}`}>
                {!isPlayer && (
                  <button onClick={() => setPinned((p) => p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx])} className={`self-end rounded p-1 ${isPinned ? "bg-caution/20 text-caution" : "text-muted-foreground"}`}>
                    <Pin className={`h-3 w-3 ${isPinned ? "fill-current" : ""}`} />
                  </button>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isPlayer ? "bg-primary text-primary-foreground rounded-br-sm" : m.isTell ? "bg-caution/10 border border-caution/40 rounded-bl-sm" : "bg-background border border-border rounded-bl-sm"}`}>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip for current step */}
        {current?.tip && !ended && (
          <div className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
            <div className="font-mono text-[10px] tracking-widest text-primary mb-1">GUIDE</div>
            {current.tip}
          </div>
        )}

        {!ended ? (
          <button
            onClick={() => { if (i + 1 < SCRIPT.length) setI(i + 1); else setEnded(true); }}
            className="mt-4 w-full rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground"
          >
            {i + 1 < SCRIPT.length ? <>NEXT MESSAGE <ArrowRight className="inline h-3.5 w-3.5 ml-1" /></> : "MAKE YOUR CALL"}
          </button>
        ) : verdict === null ? (
          <div className="mt-4">
            <div className="font-mono text-xs tracking-[0.3em] text-caution mb-2">YOUR TURN — REAL OR FAKE?</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setVerdict("REAL")} className="rounded-md border-2 border-border p-4 font-mono tracking-widest hover:border-primary/50">REAL</button>
              <button onClick={() => setVerdict("FAKE")} className="rounded-md border-2 border-border p-4 font-mono tracking-widest hover:border-destructive/50">FAKE</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className={`rounded-lg border-2 p-4 ${verdict === "FAKE" ? "border-primary bg-primary/10 text-primary" : "border-destructive bg-destructive/10 text-destructive"}`}>
              <div className="font-mono text-xs tracking-[0.3em] opacity-80">{verdict === "FAKE" ? "CORRECT" : "MISSED"}</div>
              <div className="mt-1 text-lg font-semibold">It was an imposter.</div>
              <p className="mt-1 text-sm">The pattern: <b>new number + urgency + dodged verification + irreversible payment ask</b>. Any two of those together = stop and verify out-of-band.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate({ to: "/mirror" })} className="flex-1 rounded-md bg-primary py-3 font-mono text-xs tracking-widest text-primary-foreground">
                ENTER THE MIRROR →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// MILVERSE — "Share your story" wizard. Gentler than the Studio.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { submitStory } from "@/lib/story.functions";
import { getDeviceId } from "@/lib/pilot";

export const Route = createFileRoute("/archive/submit")({
  head: () => ({
    meta: [
      { title: "Share Your Story — The Archive — MILVERSE" },
      {
        name: "description",
        content:
          "Turn what happened to you into a training mission. No real names, numbers, or links.",
      },
    ],
  }),
  component: SubmitStory,
});

const PHONE_RE = /\+?\d[\d\s\-()]{6,}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /(https?:\/\/|www\.)[\w./?=&%-]+/i;

function localPiiCheck(...vals: string[]): string | null {
  const blob = vals.join(" \n ");
  if (PHONE_RE.test(blob)) return "phone number";
  if (EMAIL_RE.test(blob)) return "email";
  if (URL_RE.test(blob)) return "URL / link";
  return null;
}

function SubmitStory() {
  const [what, setWhat] = useState("");
  const [channel, setChannel] = useState<"text" | "call" | "forward" | "in_person" | "other">(
    "text",
  );
  const [wanted, setWanted] = useState("");
  const [tell, setTell] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [year, setYear] = useState(new Date().getFullYear());
  const [pattern, setPattern] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = useServerFn(submitStory);

  const canSubmit =
    what.trim().length >= 30 &&
    wanted.trim().length >= 3 &&
    tell.trim().length >= 3 &&
    country &&
    year;

  async function onSubmit() {
    setErr(null);
    const pii = localPiiCheck(what, wanted, tell, pattern);
    if (pii) {
      const msg = `Rewrite without the ${pii}. We publish tactics — never real identities.`;
      setErr(msg);
      toast.error("Contains identifying info.", { description: msg });
      return;
    }
    setBusy(true);
    try {
      await submit({
        data: {
          story: {
            whatHappened: what.trim(),
            channel,
            whatScammerWanted: wanted.trim(),
            whatTippedYouOff: tell.trim(),
            country: country.trim(),
            year: Number(year),
            patternGuess: pattern.trim(),
          },
          deviceId: getDeviceId(),
        } as never,
      });
      toast.success("Story received.", {
        description:
          "A human reviewer will read it and, if approved, turn it into a training mission.",
      });
      setDone(true);
    } catch (e) {
      const msg = (e as Error).message ?? "Submission failed. Try again in a moment.";
      setErr(msg);
      toast.error("Submission failed.", { description: msg });
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="min-h-screen grain">
        <TopBar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-semibold uppercase">Received.</h1>
          <p className="mt-3 text-muted-foreground">
            A human reviewer will read it and, if approved, turn it into a playable mission on the
            Community shelf. Nothing you submitted is public yet.
          </p>
          <Link
            to="/archive"
            className="mt-8 inline-block rounded-sm border border-primary bg-primary/10 px-4 py-2 stencil text-[10px] text-primary hover:bg-primary/20"
          >
            ← BACK TO THE ARCHIVE
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/archive"
          className="inline-flex items-center gap-1 stencil text-[10px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> ARCHIVE
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold uppercase">Share Your Story</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Turn what happened to you (or someone you know) into a training mission for the next
          person.
        </p>

        <div className="mt-4 rounded-sm border border-caution/50 bg-caution/5 p-3 text-xs text-caution flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <b>No real names, numbers, links, or account details.</b> If you include any, the system
            will reject the submission. We publish TACTICS — not identities.
          </div>
        </div>

        {/* Step 1 */}
        <section className="mt-6 rounded-sm border border-border bg-card p-5">
          <div className="stencil text-[10px] text-primary">STEP 1 · WHAT HAPPENED</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tell us in your own words, step by step. What did they say first? What did they say
            next?
          </p>
          <textarea
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            className="mt-3 w-full min-h-[120px] rounded-sm border border-border bg-background p-3 text-sm"
            placeholder="e.g. I got a message saying I'd won a prize from a well-known brand. The person on the other end asked me to..."
            maxLength={2000}
          />
          <div className="mt-1 text-[10px] text-muted-foreground text-right">
            {what.length}/2000
          </div>
        </section>

        {/* Step 2 */}
        <section className="mt-4 rounded-sm border border-border bg-card p-5">
          <div className="stencil text-[10px] text-primary">STEP 2 · CHANNEL</div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(["text", "call", "forward", "in_person", "other"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-sm border py-2 stencil text-[10px] ${channel === c ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
              >
                {c.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 */}
        <section className="mt-4 rounded-sm border border-border bg-card p-5">
          <div className="stencil text-[10px] text-primary">STEP 3 · WHAT THE SCAMMER WANTED</div>
          <input
            value={wanted}
            onChange={(e) => setWanted(e.target.value)}
            className="mt-3 w-full rounded-sm border border-border bg-background p-3 text-sm"
            placeholder="e.g. Send an unlocking fee via mobile wallet"
            maxLength={400}
          />
        </section>

        {/* Step 4 */}
        <section className="mt-4 rounded-sm border border-border bg-card p-5">
          <div className="stencil text-[10px] text-primary">
            STEP 4 · WHAT TIPPED YOU OFF (OR HOW YOU FOUND OUT TOO LATE)
          </div>
          <textarea
            value={tell}
            onChange={(e) => setTell(e.target.value)}
            className="mt-3 w-full min-h-[80px] rounded-sm border border-border bg-background p-3 text-sm"
            placeholder="e.g. They rushed me, wouldn't let me hang up and call the official number back."
            maxLength={600}
          />
        </section>

        {/* Step 5 */}
        <section className="mt-4 rounded-sm border border-border bg-card p-5">
          <div className="stencil text-[10px] text-primary">STEP 5 · CONTEXT</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Country</div>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-sm border border-border bg-background p-2 text-sm"
                maxLength={60}
              />
            </label>
            <label className="block">
              <div className="text-xs text-muted-foreground mb-1">Rough year</div>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-sm border border-border bg-background p-2 text-sm"
                min={1990}
                max={new Date().getFullYear()}
              />
            </label>
          </div>
          <label className="block mt-3">
            <div className="text-xs text-muted-foreground mb-1">
              Pattern name (optional — e.g. "prize SMS scam")
            </div>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full rounded-sm border border-border bg-background p-2 text-sm"
              maxLength={120}
            />
          </label>
        </section>

        {err && (
          <div className="mt-4 rounded-sm border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {err}
          </div>
        )}

        <button
          disabled={!canSubmit || busy}
          onClick={onSubmit}
          className="mt-6 w-full rounded-sm border-2 border-primary bg-primary py-3 stencil text-[11px] text-primary-foreground disabled:opacity-40"
        >
          {busy ? "SENDING…" : "SUBMIT FOR REVIEW"}
        </button>
        <p className="mt-3 text-[11px] text-muted-foreground text-center">
          A human reviewer reads every story. Nothing is public until approved.
        </p>
      </main>
    </div>
  );
}

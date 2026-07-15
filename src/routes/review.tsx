// MILVERSE — Moderation queue. Passcode-gated at the server, no auth system.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { listPendingSubmissions, rejectSubmission, approveSubmissionAndPublish } from "@/lib/story.functions";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Queue — MILVERSE" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

interface StoryRow {
  id: string;
  story: {
    whatHappened: string;
    channel: string;
    whatScammerWanted: string;
    whatTippedYouOff: string;
    country: string;
    year: number;
    patternGuess?: string;
  };
  country: string | null;
  year: number | null;
  status: string;
  created_at: string;
}

const TIERS = [1, 2, 3, 4, 5] as const;

function randomShareCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

function ReviewPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listFn = useServerFn(listPendingSubmissions);
  const rejectFn = useServerFn(rejectSubmission);
  const approveFn = useServerFn(approveSubmissionAndPublish);

  async function authenticate() {
    setErr(null);
    setBusy(true);
    try {
      const res = await listFn({ data: { passcode } as never });
      setRows((res as { rows: StoryRow[] }).rows);
      setAuthed(true);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function refresh() {
    try {
      const res = await listFn({ data: { passcode } as never });
      setRows((res as { rows: StoryRow[] }).rows);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen grain">
        <TopBar />
        <main className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center gap-2 stencil text-[10px] text-primary">
              <Lock className="h-3 w-3" /> REVIEWER ACCESS
            </div>
            <h1 className="mt-2 text-2xl font-semibold uppercase">Review Queue</h1>
            <p className="mt-2 text-xs text-muted-foreground">Enter the reviewer passcode to see pending submissions.</p>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="mt-4 w-full rounded-sm border border-border bg-background p-3 text-sm"
              placeholder="passcode"
              onKeyDown={(e) => { if (e.key === "Enter") authenticate(); }}
            />
            {err && <div className="mt-3 text-xs text-destructive">{err}</div>}
            <button
              onClick={authenticate}
              disabled={busy || !passcode}
              className="mt-4 w-full rounded-sm border-2 border-primary bg-primary py-2.5 stencil text-[10px] text-primary-foreground disabled:opacity-40"
            >
              {busy ? "CHECKING…" : "ENTER"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold uppercase">Review Queue</h1>
          <span className="stencil text-[10px] text-muted-foreground">{rows.length} PENDING</span>
          <div className="flex-1" />
          <button onClick={refresh} className="rounded-sm border border-border px-3 py-1 stencil text-[10px] hover:bg-accent">REFRESH</button>
        </div>

        {err && <div className="mb-4 text-sm text-destructive">{err}</div>}

        {rows.length === 0 && (
          <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing pending. Good work.
          </div>
        )}

        <div className="space-y-4">
          {rows.map((r) => (
            <SubmissionCard
              key={r.id}
              row={r}
              passcode={passcode}
              onReject={async (reason) => {
                await rejectFn({ data: { passcode, id: r.id, reason } as never });
                setRows((cur) => cur.filter((x) => x.id !== r.id));
              }}
              onApprove={async (scenario) => {
                const code = randomShareCode();
                await approveFn({ data: { passcode, id: r.id, shareCode: code, scenario } as never });
                setRows((cur) => cur.filter((x) => x.id !== r.id));
                alert(`Published as ${code} on the Community shelf.`);
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function SubmissionCard({
  row, passcode, onReject, onApprove,
}: {
  row: StoryRow;
  passcode: string;
  onReject: (reason: string) => Promise<void>;
  onApprove: (scenario: Record<string, unknown>) => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "reject" | "edit">("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Pre-fill Studio-like fields
  const suggestedPattern = row.story.patternGuess?.trim() || "Scam attempt";
  const [title, setTitle] = useState(suggestedPattern);
  const [teaser, setTeaser] = useState(row.story.whatHappened.slice(0, 140));
  const [tier, setTier] = useState<1|2|3|4|5>(2);
  const [truth, setTruth] = useState<"REAL" | "IMPOSTER">("IMPOSTER");
  const [claimed, setClaimed] = useState("Someone claiming an official role");
  const [contactClaim, setContactClaim] = useState(`Claims to be ${suggestedPattern.toLowerCase()}.`);
  const [opener, setOpener] = useState(row.story.whatHappened.split(/(?<=\.|\!|\?)\s/)[0] ?? row.story.whatHappened.slice(0, 200));
  const [agenda, setAgenda] = useState(row.story.whatScammerWanted);

  async function publish() {
    setBusy(true);
    const id = `community-${crypto.randomUUID().slice(0, 8)}`;
    const scenario = {
      id,
      title: title.trim(),
      teaser: teaser.trim(),
      channel: "text" as const,
      tier,
      truth,
      claimedIdentity: claimed.trim(),
      agenda: agenda.trim(),
      dossier: {
        contactClaim: contactClaim.trim(),
        knownFacts: [] as string[],
        publicFacts: [] as string[],
      },
      facts: [],
      opener: opener.trim(),
      persona: {
        voice: "generic urgent",
        fillers: ["please", "listen", "just do this"],
        urgencyLines: ["it's urgent", "no time to explain"],
        pushLines: ["do it now", "trust me"],
      },
      evidenceChips: [
        { id: "c1", label: "Rushed with urgency", correct: true, explain: "Urgency is a manipulation lever." },
        { id: "c2", label: "Asked me to send money / codes", correct: true, explain: "The ask itself is the scam." },
        { id: "c3", label: "Sounded polite", correct: false, explain: "Politeness is not evidence of legitimacy." },
      ],
      source: "community_story",
      inspiredBy: {
        patternName: suggestedPattern,
        country: row.story.country,
        year: String(row.story.year),
        whatHappened: row.story.whatHappened.slice(0, 400),
        prevention: [
          row.story.whatTippedYouOff.slice(0, 200),
          "Verify out-of-band using a number you already trust.",
          "Slow down — real institutions do not require instant decisions.",
        ],
      },
    };
    try {
      await onApprove(scenario as unknown as Record<string, unknown>);
    } catch (e) {
      alert((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <article className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center gap-2 stencil text-[9px] text-muted-foreground">
        <span>{new Date(row.created_at).toLocaleString()}</span>
        <span>·</span>
        <span>{row.story.country}, {row.story.year}</span>
        <span>·</span>
        <span>{row.story.channel.toUpperCase()}</span>
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap">{row.story.whatHappened}</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-sm border border-border p-2"><b>Wanted:</b> {row.story.whatScammerWanted}</div>
        <div className="rounded-sm border border-border p-2"><b>Tell:</b> {row.story.whatTippedYouOff}</div>
      </div>

      {mode === "view" && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => setMode("edit")} className="rounded-sm border border-primary bg-primary/10 px-3 py-1.5 stencil text-[10px] text-primary hover:bg-primary/20">
            <CheckCircle2 className="inline h-3 w-3 mr-1" /> APPROVE → EDIT & PUBLISH
          </button>
          <button onClick={() => setMode("reject")} className="rounded-sm border border-destructive/60 bg-destructive/10 px-3 py-1.5 stencil text-[10px] text-destructive hover:bg-destructive/20">
            <XCircle className="inline h-3 w-3 mr-1" /> REJECT
          </button>
        </div>
      )}

      {mode === "reject" && (
        <div className="mt-4 space-y-2">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full min-h-[70px] rounded-sm border border-border bg-background p-2 text-sm" placeholder="Why is this being rejected?" />
          <div className="flex gap-2">
            <button
              disabled={busy || reason.trim().length < 3}
              onClick={async () => { setBusy(true); await onReject(reason.trim()); setBusy(false); }}
              className="rounded-sm border-2 border-destructive bg-destructive px-3 py-1.5 stencil text-[10px] text-destructive-foreground disabled:opacity-40"
            >
              CONFIRM REJECT
            </button>
            <button onClick={() => setMode("view")} className="rounded-sm border border-border px-3 py-1.5 stencil text-[10px] hover:bg-accent">CANCEL</button>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="mt-4 rounded-sm border border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="stencil text-[10px] text-primary">PRE-FILLED FROM STORY · EDIT BEFORE PUBLISH</div>

          <label className="block">
            <div className="text-xs text-muted-foreground">Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-muted-foreground">Teaser</div>
            <input value={teaser} onChange={(e) => setTeaser(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-muted-foreground">Tier</div>
              <select value={tier} onChange={(e) => setTier(Number(e.target.value) as 1|2|3|4|5)} className="w-full rounded-sm border border-border bg-background p-2 text-sm">
                {TIERS.map((t) => <option key={t} value={t}>Tier {t}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-muted-foreground">Ground truth</div>
              <select value={truth} onChange={(e) => setTruth(e.target.value as "REAL" | "IMPOSTER")} className="w-full rounded-sm border border-border bg-background p-2 text-sm">
                <option value="IMPOSTER">IMPOSTER</option>
                <option value="REAL">REAL</option>
              </select>
            </label>
          </div>

          <label className="block">
            <div className="text-xs text-muted-foreground">Claimed identity</div>
            <input value={claimed} onChange={(e) => setClaimed(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-muted-foreground">Contact's claim (dossier)</div>
            <input value={contactClaim} onChange={(e) => setContactClaim(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-muted-foreground">Opener (first message the player receives)</div>
            <textarea value={opener} onChange={(e) => setOpener(e.target.value)} className="w-full min-h-[80px] rounded-sm border border-border bg-background p-2 text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-muted-foreground">Contact's goal / agenda</div>
            <input value={agenda} onChange={(e) => setAgenda(e.target.value)} className="w-full rounded-sm border border-border bg-background p-2 text-sm" />
          </label>

          <div className="flex gap-2 pt-2">
            <button
              disabled={busy || !title.trim() || !opener.trim()}
              onClick={publish}
              className="rounded-sm border-2 border-primary bg-primary px-4 py-2 stencil text-[10px] text-primary-foreground disabled:opacity-40"
            >
              {busy ? "PUBLISHING…" : "PUBLISH TO COMMUNITY SHELF"}
            </button>
            <button onClick={() => setMode("view")} className="rounded-sm border border-border px-3 py-1.5 stencil text-[10px] hover:bg-accent">CANCEL</button>
          </div>
        </div>
      )}
    </article>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { saveCitizenCase } from "@/lib/mirror/scenarios";
import type { Scenario, EvidenceChip } from "@/lib/mirror/scenarios";
import { publishCitizenCase } from "@/lib/citizen.functions";
import { getDeviceId } from "@/lib/pilot";
import { Clapperboard, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";


export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "The Studio — Design a Case — MILVERSE" },
      { name: "description", content: "Design your own scam simulation for others to play." },
    ],
  }),
  component: Studio,
});

type Tone = "warm" | "urgent" | "official" | "emotional";
type Lang = "english" | "roman-urdu" | "mixed";
type Agenda = "money" | "gift-cards" | "otp" | "personal-info" | "link-qr" | "custom";

interface Draft {
  personaName: string;
  relationship: string;
  truth: "REAL" | "IMPOSTER";
  agenda: Agenda;
  agendaCustom: string;
  facts: { text: string; isPublic: boolean; isGap: boolean }[];
  opener: string;
  tone: Tone;
  language: Lang;
}

const BLANK: Draft = {
  personaName: "",
  relationship: "",
  truth: "IMPOSTER",
  agenda: "money",
  agendaCustom: "",
  facts: [
    { text: "", isPublic: false, isGap: false },
    { text: "", isPublic: false, isGap: false },
    { text: "", isPublic: true, isGap: false },
    { text: "", isPublic: false, isGap: false },
    { text: "", isPublic: false, isGap: false },
  ],
  opener: "",
  tone: "warm",
  language: "english",
};

const PHONE_RE = /\+?\d[\d\s\-()]{6,}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /(https?:\/\/|www\.)[\w./?=&%-]+/i;

function validate(d: Draft): string | null {
  if (!d.personaName.trim()) return "Persona name is required.";
  if (d.personaName.trim().length < 2) return "Persona name is too short.";
  if (!d.relationship.trim()) return "Describe the relationship to the target.";
  if (!d.opener.trim()) return "Opening message is required.";
  if (d.opener.trim().length < 20) return "Opening message should be at least 20 characters — set the scene.";
  const filled = d.facts.filter((f) => f.text.trim().length >= 6);
  if (filled.length < 4) return "Add at least 4 real dossier facts (each 6+ characters).";
  if (d.truth === "IMPOSTER") {
    if (!d.agenda) return "Pick what the imposter wants (their agenda).";
    if (d.agenda === "custom" && !d.agendaCustom.trim()) return "Describe the custom agenda in one line.";
    const gaps = filled.filter((f) => f.isGap).length;
    if (gaps < 2) return "Mark at least 2 private facts as KNOWLEDGE GAPS — the imposter needs something to slip on.";
  }
  const all = [d.personaName, d.relationship, d.opener, d.agendaCustom, ...d.facts.map((f) => f.text)].join(" ");
  if (PHONE_RE.test(all)) return "No real phone numbers in any field.";
  if (EMAIL_RE.test(all)) return "No real email addresses in any field.";
  if (URL_RE.test(all)) return "No real URLs in any field.";
  const bad = ["fuck", "shit", "bitch", "randi", "chutiya", "gandu", "haramkhor"];
  const low = all.toLowerCase();
  if (bad.some((w) => low.includes(w))) return "Please keep content civil — profanity not allowed.";
  const realNames = ["imran khan", "shehbaz sharif", "asim munir", "malala", "bilawal", "maryam nawaz"];
  if (realNames.some((n) => low.includes(n))) return "No real public figures — only fictional personas.";
  return null;
}

function generateShareCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}


function buildScenario(d: Draft): Scenario {
  const id = `citizen-${Math.random().toString(36).slice(2, 8)}`;
  const publicFacts = d.facts.filter((f) => f.isPublic && f.text.trim()).map((f) => f.text.trim());
  const privateFacts = d.facts.filter((f) => !f.isPublic && f.text.trim()).map((f) => f.text.trim());
  const gaps = d.facts.filter((f) => f.isGap && !f.isPublic && f.text.trim());

  const agendaText: Record<Agenda, string> = {
    money: "Get the target to transfer money.",
    "gift-cards": "Extract gift-card codes.",
    otp: "Extract an OTP or verification code.",
    "personal-info": "Extract private personal information.",
    "link-qr": "Get the target to click a link or scan a QR.",
    custom: d.agendaCustom || "Custom agenda.",
  };

  const chips: EvidenceChip[] =
    d.truth === "IMPOSTER"
      ? [
          { id: "e1", label: "Manufactured urgency", correct: true, explain: "Time pressure is the scammer's oldest lever." },
          { id: "e2", label: `Pushed for ${d.agenda.replace("-", " ")}`, correct: true, explain: "Agenda ask matches the trap." },
          { id: "e3", label: "Dodged a verification question", correct: true, explain: "Imposters block out-of-band checks." },
          { id: "e4", label: "Contradicted a dossier fact", correct: true, explain: "Catchable lie against your ground truth." },
          { id: "e5", label: "Polite / friendly tone", correct: false, explain: "Politeness is not evidence." },
          { id: "e6", label: "Mentioned a public fact", correct: false, explain: "Public info is not identification." },
        ]
      : [
          { id: "e1", label: "Answered dossier facts correctly", correct: true, explain: "Real people recall shared history." },
          { id: "e2", label: "Welcomed verification", correct: true, explain: "Real people don't mind you checking." },
          { id: "e3", label: "No agenda / no money ask", correct: true, explain: "The absence of a pitch is signal." },
          { id: "e4", label: "Casual / stressed but human", correct: false, explain: "Style is not evidence." },
          { id: "e5", label: "From unknown number", correct: false, explain: "Real people change numbers too." },
        ];

  return {
    id,
    shareCode: generateShareCode(),
    title: `${d.personaName} — ${d.relationship}`,
    teaser: d.opener.slice(0, 80) + (d.opener.length > 80 ? "…" : ""),
    channel: "text",
    tier: 2,
    truth: d.truth,
    claimedIdentity: `${d.personaName} — ${d.relationship}`,
    agenda: d.truth === "IMPOSTER" ? agendaText[d.agenda] : undefined,
    dossier: {
      contactClaim: `Says they're ${d.personaName}, ${d.relationship}.`,
      knownFacts: privateFacts,
      publicFacts,
    },
    facts: d.facts
      .filter((f) => f.text.trim())
      .map((f, i) => ({
        id: `f${i}`,
        keywords: f.text.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 4),
        truth: f.isGap ? "" : f.text,
        isKnownToImposter: !f.isGap,
        deflection: f.isGap ? "let's come back to that, first tell me about your side." : undefined,
        contradiction: f.isGap ? "yeah of course, exactly as we discussed before." : undefined,
      })),
    opener: d.opener,
    persona: {
      voice: `${d.tone}, ${d.language === "roman-urdu" ? "Roman Urdu" : d.language === "mixed" ? "Urdu-English mix" : "clean English"}`,
      fillers:
        d.language === "english"
          ? ["hey", "of course", "totally get it", "makes sense"]
          : ["yaar", "acha", "theek hai", "haan bhai"],
      urgencyLines: d.tone === "urgent" ? ["please jaldi karo", "waqt nahin hai"] : [],
      pushLines: d.truth === "IMPOSTER" ? [`can you help me with ${agendaText[d.agenda]}?`] : [],
    },
    evidenceChips: chips,
  } as Scenario & { shareCode: string };
}

function Studio() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const publishFn = useServerFn(publishCitizenCase);

  async function publish(lane: "private" | "community") {
    const err = validate(draft);
    if (err) { setError(err); return; }
    setPublishing(true);
    setError(null);
    const s = buildScenario(draft);
    const code = (s as Scenario & { shareCode: string }).shareCode;
    saveCitizenCase(s);
    try {
      const res = await publishFn({ data: { shareCode: code, scenario: s as unknown as Record<string, unknown>, deviceId: getDeviceId(), lane } as never }) as { lane: "private" | "community"; aiChecked: boolean };
      if (res.lane === "community") {
        alert(`Submitted to the Community Library — queued for human review.\n\nShare code (playable now for you & anyone you send it to): ${code}\n\nAI safety check: ${res.aiChecked ? "passed ✓" : "unavailable — will be reviewed manually"}`);
      } else {
        alert(`Published as a PRIVATE case.\n\nShare code: ${code}\n\nAnyone with this code can play it. It never appears on public shelves.\n\nAI safety check: ${res.aiChecked ? "passed ✓" : "unavailable — will be reviewed if you submit to the community later"}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cloud sync failed.";
      setError(msg);
      setPublishing(false);
      return;
    }
    setPublishing(false);
    navigate({ to: "/mirror/$caseId", params: { caseId: s.id } });
  }

  function playtest() {
    const err = validate(draft);
    if (err) { setError(err); return; }
    const s = buildScenario(draft);
    saveCitizenCase(s);
    navigate({ to: "/mirror/$caseId", params: { caseId: s.id } });
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground">
          ← CITY
        </Link>
        <div className="mt-4 mb-8">
          <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-primary">
            <Clapperboard className="h-4 w-4" /> THE STUDIO · CASE DESIGNER
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Design a case</h1>
          <p className="mt-2 text-muted-foreground">
            5 steps. LEARN → PLAY → DESIGN. Publish and share with friends.
          </p>
          <div className="mt-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className={`h-1 flex-1 rounded ${n <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            STEP {step}/5
          </div>
        </div>

        {step === 1 && (
          <Section title="THE MASK" hint="Who is the contact pretending to be?">
            <Field label="Persona name">
              <input value={draft.personaName} onChange={(e) => setDraft({ ...draft, personaName: e.target.value })} placeholder="e.g. Uncle Aslam" className={inputCls} />
            </Field>
            <Field label="Relationship to the target">
              <input value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} placeholder="e.g. your uncle / bank fraud team / cousin" className={inputCls} />
            </Field>
          </Section>
        )}

        {step === 2 && (
          <Section title="THE TRUTH" hint="Real or imposter?">
            <div className="grid grid-cols-2 gap-3">
              {(["REAL", "IMPOSTER"] as const).map((t) => (
                <button key={t} onClick={() => setDraft({ ...draft, truth: t })} className={`rounded-lg border-2 p-4 font-mono text-sm tracking-widest transition ${draft.truth === t ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {t}
                </button>
              ))}
            </div>
            {draft.truth === "IMPOSTER" && (
              <>
                <Field label="Agenda — what they want">
                  <select value={draft.agenda} onChange={(e) => setDraft({ ...draft, agenda: e.target.value as Agenda })} className={inputCls}>
                    <option value="money">Money transfer</option>
                    <option value="gift-cards">Gift-card codes</option>
                    <option value="otp">OTP / verification code</option>
                    <option value="personal-info">Personal info</option>
                    <option value="link-qr">Click a link / scan a QR</option>
                    <option value="custom">Custom</option>
                  </select>
                </Field>
                {draft.agenda === "custom" && (
                  <Field label="Custom agenda">
                    <input value={draft.agendaCustom} onChange={(e) => setDraft({ ...draft, agendaCustom: e.target.value })} className={inputCls} />
                  </Field>
                )}
              </>
            )}
          </Section>
        )}

        {step === 3 && (
          <Section title="THE DOSSIER" hint="5 facts your character knows. Mark 1–2 as PUBLIC (findable online). If imposter: mark 2–3 private facts as knowledge GAPS.">
            <div className="space-y-2">
              {draft.facts.map((f, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <input value={f.text} onChange={(e) => {
                    const next = [...draft.facts]; next[i] = { ...f, text: e.target.value }; setDraft({ ...draft, facts: next });
                  }} placeholder={`Fact ${i + 1}`} className={inputCls} />
                  <div className="mt-2 flex gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={f.isPublic} onChange={(e) => {
                        const next = [...draft.facts]; next[i] = { ...f, isPublic: e.target.checked, isGap: e.target.checked ? false : f.isGap }; setDraft({ ...draft, facts: next });
                      }} /> PUBLIC
                    </label>
                    {draft.truth === "IMPOSTER" && !f.isPublic && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-caution">
                        <input type="checkbox" checked={f.isGap} onChange={(e) => {
                          const next = [...draft.facts]; next[i] = { ...f, isGap: e.target.checked }; setDraft({ ...draft, facts: next });
                        }} /> KNOWLEDGE GAP
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="THE VOICE" hint="How they open — and how they sound.">
            <Field label="Opening message">
              <textarea value={draft.opener} onChange={(e) => setDraft({ ...draft, opener: e.target.value })} rows={3} className={inputCls} />
            </Field>
            <Field label="Tone">
              <select value={draft.tone} onChange={(e) => setDraft({ ...draft, tone: e.target.value as Tone })} className={inputCls}>
                <option value="warm">Warm</option>
                <option value="urgent">Urgent</option>
                <option value="official">Official</option>
                <option value="emotional">Emotional</option>
              </select>
            </Field>
            <Field label="Language flavor">
              <select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value as Lang })} className={inputCls}>
                <option value="english">English</option>
                <option value="roman-urdu">Roman Urdu</option>
                <option value="mixed">Mix (natural code-switching)</option>
              </select>
            </Field>
          </Section>
        )}

        {step === 5 && (
          <Section title="PREVIEW & PUBLISH" hint="Play-test once, then pick a lane. Both lanes run an AI safety check before anything is saved.">
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <div className="font-mono text-[10px] tracking-widest text-primary">PREVIEW</div>
              <div className="mt-2"><b>{draft.personaName}</b> — {draft.relationship}</div>
              <div className="mt-1 text-muted-foreground text-xs">{draft.truth} · {draft.tone} · {draft.language}</div>
              <div className="mt-3 italic text-muted-foreground">"{draft.opener}"</div>
            </div>
            {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <button onClick={playtest} className="w-full rounded-md border border-primary/50 bg-primary/10 py-3 font-mono text-xs tracking-widest text-primary hover:bg-primary/20">
              <Sparkles className="inline h-3.5 w-3.5 mr-1.5" /> PLAY-TEST ONCE
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => void publish("private")} disabled={publishing} className="rounded-md border-2 border-primary/60 bg-card py-4 px-4 text-left disabled:opacity-50 hover:border-primary transition">
                <div className="font-mono text-[10px] tracking-widest text-primary">PRIVATE CASE</div>
                <div className="mt-1 text-sm font-semibold">Share by code only</div>
                <div className="mt-1 text-xs text-muted-foreground">Playable by anyone with the code. Never appears on any public shelf.</div>
                <div className="mt-3 font-mono text-[10px] tracking-widest text-primary">{publishing ? "…" : "PUBLISH PRIVATELY →"}</div>
              </button>
              <button onClick={() => void publish("community")} disabled={publishing} className="rounded-md border-2 border-caution/60 bg-card py-4 px-4 text-left disabled:opacity-50 hover:border-caution transition">
                <div className="font-mono text-[10px] tracking-widest text-caution">SUBMIT TO COMMUNITY LIBRARY</div>
                <div className="mt-1 text-sm font-semibold">Human review, then public</div>
                <div className="mt-1 text-xs text-muted-foreground">Sent to the moderation queue. Only human-approved cases appear on the Community shelf, marked "Human-reviewed ✓".</div>
                <div className="mt-3 font-mono text-[10px] tracking-widest text-caution">{publishing ? "…" : "SUBMIT FOR REVIEW →"}</div>
              </button>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-muted-foreground text-center">
              AI SAFETY GATE · NO HATE · NO REAL PEOPLE · NO PII · NO POLITICAL ATTACKS
            </p>
          </Section>
        )}

        <div className="mt-6 flex justify-between">
          <button disabled={step === 1} onClick={() => { setError(null); setStep(step - 1); }} className="flex items-center gap-1 font-mono text-xs tracking-widest text-muted-foreground disabled:opacity-40 hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> BACK
          </button>
          {step < 5 ? (
            <button onClick={() => { setError(null); setStep(step + 1); }} className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 font-mono text-xs tracking-widest text-primary-foreground">
              NEXT <ChevronRight className="h-4 w-4" />
            </button>
          ) : <span />}
        </div>
      </main>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[11px] tracking-[0.3em] text-primary">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] tracking-widest text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

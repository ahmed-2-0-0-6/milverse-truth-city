// MILVERSE — /pressroom  THE DAILY MIRAGE editor. Passcode-gated.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { Lock, Save, Send, Eye } from "lucide-react";
import { pressroomList, pressroomGet, pressroomSave, pressroomPublish } from "@/lib/paper.functions";
import type { EditionContent } from "@/lib/paper/types";
import { PaperFrontPage } from "@/components/paper/PaperFrontPage";
import { PaperForgeryColumn } from "@/components/paper/PaperForgeryColumn";
import { PaperSocialPage } from "@/components/paper/PaperSocialPage";
import { PaperClassifieds } from "@/components/paper/PaperClassifieds";
import { PaperPuzzle } from "@/components/paper/PaperPuzzle";
import { PaperEditorial } from "@/components/paper/PaperEditorial";
import { PaperRealWorld } from "@/components/paper/PaperRealWorld";

export const Route = createFileRoute("/pressroom")({
  head: () => ({ meta: [{ title: "Pressroom — MILVERSE" }, { name: "robots", content: "noindex" }] }),
  component: PressroomPage,
});

const TACTICS = ["impersonation","urgency-fear","out-of-context","engagement-bait","imposter-outlet","phishing","trust-farming","ai-generated","mis-dis-mal","forgery-engine"] as const;

interface Row { edition_number: number; edition_date: string; status: string; updated_at: string; published_at: string | null }

function PressroomPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [content, setContent] = useState<EditionContent | null>(null);
  const [date, setDate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const listFn = useServerFn(pressroomList);
  const getFn = useServerFn(pressroomGet);
  const saveFn = useServerFn(pressroomSave);
  const pubFn = useServerFn(pressroomPublish);

  async function auth() {
    setErr(null);
    try { const r = await listFn({ data: { passcode } }); setRows((r as { rows: Row[] }).rows); setAuthed(true); }
    catch (e) { setErr((e as Error).message); }
  }
  async function open(n: number) {
    setErr(null); setSelected(n); setPreview(false);
    const row = await getFn({ data: { passcode, number: n } });
    if (row) {
      const r = row as { content: EditionContent; edition_date: string; status: string };
      setContent(r.content); setDate(r.edition_date); setStatus(r.status);
    }
  }
  async function save() {
    if (!content || !selected) return;
    setSaving(true); setErr(null);
    try {
      await saveFn({ data: { passcode, number: selected, edition_date: date, content } });
      const r = await listFn({ data: { passcode } }); setRows((r as { rows: Row[] }).rows);
    } catch (e) { setErr((e as Error).message); }
    setSaving(false);
  }
  async function publish() {
    if (!selected) return;
    if (!confirm(`Publish edition #${selected}? This makes it live for everyone.`)) return;
    setErr(null);
    try {
      await save();
      await pubFn({ data: { passcode, number: selected } });
      const r = await listFn({ data: { passcode } }); setRows((r as { rows: Row[] }).rows);
      setStatus("published");
      alert("Published. It's the live paper now.");
    } catch (e) { setErr((e as Error).message); }
  }

  if (!authed) {
    return (
      <div className="min-h-screen grain">
        <TopBar />
        <main className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-sm border border-border bg-card p-6">
            <div className="flex items-center gap-2 stencil text-xs text-primary"><Lock className="h-4 w-4" /> PRESSROOM · TEAM ONLY</div>
            <h1 className="mt-2 text-3xl font-black" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>THE DAILY MIRAGE — PRESSROOM</h1>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="passcode" className="mt-4 w-full rounded-sm bg-background border border-border px-3 py-2" onKeyDown={(e) => e.key === "Enter" && auth()} />
            <button onClick={auth} className="mt-3 w-full rounded-sm bg-primary text-primary-foreground stencil text-xs px-3 py-2">UNLOCK</button>
            {err && <p className="mt-3 text-destructive text-xs">{err}</p>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>PRESSROOM</h1>
          <div className="stencil text-[10px] text-muted-foreground">HAND-COMPOSED. NOTHING AUTO-ROTATES.</div>
        </div>

        <div className="mt-4 grid md:grid-cols-[240px_minmax(0,1fr)] gap-6">
          {/* editions list */}
          <div className="space-y-1">
            {rows.map((r) => (
              <button key={r.edition_number} onClick={() => open(r.edition_number)} className={`w-full text-left rounded-sm border px-3 py-2 ${selected === r.edition_number ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <div className="stencil text-[10px] text-primary">#{String(r.edition_number).padStart(3, "0")} · {r.status.toUpperCase()}</div>
                <div className="text-sm">{r.edition_date}</div>
              </button>
            ))}
            <button onClick={() => { const next = (rows[0]?.edition_number ?? 0) + 1; setSelected(next); setContent(blankContent()); setDate(new Date().toISOString().slice(0,10)); setStatus("draft"); setPreview(false); }} className="w-full text-left rounded-sm border border-dashed border-primary/40 px-3 py-2 stencil text-[10px] text-primary hover:bg-primary/5">+ NEW EDITION</button>
          </div>

          {/* editor */}
          <div>
            {!content ? (
              <p className="text-sm text-muted-foreground">Pick an edition on the left, or start a new one.</p>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="stencil text-[10px] text-muted-foreground">DATE</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-sm bg-background border border-border px-2 py-1 text-sm" />
                  <div className="stencil text-[10px] text-muted-foreground">STATUS · {status.toUpperCase()}</div>
                  <div className="flex-1" />
                  <button onClick={() => setPreview((v) => !v)} className="rounded-sm border border-border px-3 py-1.5 stencil text-[10px] inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {preview ? "EDIT" : "PREVIEW"}</button>
                  <button onClick={save} disabled={saving || status === "locked"} className="rounded-sm border border-primary/60 bg-primary/10 text-primary px-3 py-1.5 stencil text-[10px] inline-flex items-center gap-1 disabled:opacity-40"><Save className="h-3 w-3" /> {saving ? "SAVING…" : "SAVE"}</button>
                  <button onClick={publish} disabled={status === "published" || status === "locked"} className="rounded-sm bg-primary text-primary-foreground px-3 py-1.5 stencil text-[10px] inline-flex items-center gap-1 disabled:opacity-40"><Send className="h-3 w-3" /> PUBLISH</button>
                </div>
                {err && <p className="text-destructive text-xs mb-2">{err}</p>}

                {preview ? (
                  <div className="paper rounded-sm border border-border p-6">
                    <PaperFrontPage lead={content.lead} editionNumber={selected!} editionDate={date} onDone={() => {}} />
                    <div className="paper-ornament my-6">PREVIEW</div>
                    <PaperForgeryColumn forgery={content.forgery} editionNumber={selected!} onDone={() => {}} />
                    <PaperSocialPage social={content.social} editionNumber={selected!} onDone={() => {}} />
                    <PaperClassifieds items={content.classifieds} editionNumber={selected!} onDone={() => {}} />
                    <PaperPuzzle puzzle={content.puzzle} editionNumber={selected!} onDone={() => {}} />
                    <PaperEditorial editorial={content.editorial} editionNumber={selected!} />
                    <PaperRealWorld realWorld={content.realWorld} />
                  </div>
                ) : (
                  <Editor content={content} setContent={setContent} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Editor({ content, setContent }: { content: EditionContent; setContent: (c: EditionContent) => void }) {
  function up<K extends keyof EditionContent>(k: K, v: EditionContent[K]) { setContent({ ...content, [k]: v }); }
  return (
    <div className="space-y-6">
      <Section title="A · LEAD (Front Page)">
        <Field label="Kicker"><Input v={content.lead.kicker} on={(v) => up("lead", { ...content.lead, kicker: v })} /></Field>
        <Field label="Headline"><Input v={content.lead.headline} on={(v) => up("lead", { ...content.lead, headline: v })} /></Field>
        <Field label="Subhead"><Input v={content.lead.subhead} on={(v) => up("lead", { ...content.lead, subhead: v })} /></Field>
        <Field label="Byline"><Input v={content.lead.byline} on={(v) => up("lead", { ...content.lead, byline: v })} /></Field>
        <Field label="Case ID (from FEED_SCENARIOS)"><Input v={content.lead.caseId} on={(v) => up("lead", { ...content.lead, caseId: v })} /></Field>
        <Field label="Columns (paragraphs, one per line)">
          <Textarea v={content.lead.columns.join("\n")} rows={5} on={(v) => up("lead", { ...content.lead, columns: v.split("\n").filter(Boolean) })} />
        </Field>
      </Section>

      <Section title="B · FORGERY">
        <Field label="Prompt"><Input v={content.forgery.prompt} on={(v) => up("forgery", { ...content.forgery, prompt: v })} /></Field>
        <Field label="Image alt"><Input v={content.forgery.imageAlt} on={(v) => up("forgery", { ...content.forgery, imageAlt: v })} /></Field>
        <Field label="Image emoji"><Input v={content.forgery.imageEmoji} on={(v) => up("forgery", { ...content.forgery, imageEmoji: v })} /></Field>
        <Field label="Truth">
          <select value={content.forgery.truth} onChange={(e) => up("forgery", { ...content.forgery, truth: e.target.value as "REAL" | "AI" })} className="bg-background border border-border rounded-sm px-2 py-1 text-sm">
            <option value="REAL">REAL</option><option value="AI">AI</option>
          </select>
        </Field>
        <Field label="Provenance"><Textarea v={content.forgery.provenance} on={(v) => up("forgery", { ...content.forgery, provenance: v })} /></Field>
        <Field label="Thesis"><Input v={content.forgery.thesis} on={(v) => up("forgery", { ...content.forgery, thesis: v })} /></Field>
        <Field label="Tactic"><TacticSelect v={content.forgery.tacticId} on={(v) => up("forgery", { ...content.forgery, tacticId: v })} /></Field>
      </Section>

      <Section title="C · SOCIAL PAGE">
        <Field label="Handle"><Input v={content.social.handle} on={(v) => up("social", { ...content.social, handle: v })} /></Field>
        <Field label="Caption"><Textarea v={content.social.caption} on={(v) => up("social", { ...content.social, caption: v })} /></Field>
        <Field label="Likes"><Input type="number" v={String(content.social.likes)} on={(v) => up("social", { ...content.social, likes: Number(v) })} /></Field>
        <Field label="Views"><Input type="number" v={String(content.social.views)} on={(v) => up("social", { ...content.social, views: Number(v) })} /></Field>
        <Field label="Image emoji"><Input v={content.social.imageEmoji} on={(v) => up("social", { ...content.social, imageEmoji: v })} /></Field>
        <Field label="Truth">
          <select value={content.social.truth} onChange={(e) => up("social", { ...content.social, truth: e.target.value as "TRUE" | "FALSE" | "MISLEADING" })} className="bg-background border border-border rounded-sm px-2 py-1 text-sm">
            <option>TRUE</option><option>FALSE</option><option>MISLEADING</option>
          </select>
        </Field>
        <Field label="Reveal"><Textarea v={content.social.reveal} on={(v) => up("social", { ...content.social, reveal: v })} /></Field>
        <Field label="Tactic"><TacticSelect v={content.social.tacticId} on={(v) => up("social", { ...content.social, tacticId: v })} /></Field>
      </Section>

      <Section title="D · CLASSIFIEDS (3–4)">
        {content.classifieds.map((c, i) => (
          <div key={i} className="border border-border rounded-sm p-3 space-y-2">
            <div className="stencil text-[10px] text-primary">AD #{i + 1}</div>
            <Field label="Title"><Input v={c.title} on={(v) => { const arr = content.classifieds.slice(); arr[i] = { ...c, title: v }; up("classifieds", arr); }} /></Field>
            <Field label="Body"><Textarea v={c.body} on={(v) => { const arr = content.classifieds.slice(); arr[i] = { ...c, body: v }; up("classifieds", arr); }} /></Field>
            <Field label="Flags (exact substrings, comma-separated)"><Input v={c.flags.join(", ")} on={(v) => { const arr = content.classifieds.slice(); arr[i] = { ...c, flags: v.split(",").map((s) => s.trim()).filter(Boolean) }; up("classifieds", arr); }} /></Field>
            <Field label="Tactic"><TacticSelect v={c.tacticId} on={(v) => { const arr = content.classifieds.slice(); arr[i] = { ...c, tacticId: v }; up("classifieds", arr); }} /></Field>
            <button onClick={() => { const arr = content.classifieds.filter((_, j) => j !== i); up("classifieds", arr); }} className="stencil text-[10px] text-destructive underline">remove</button>
          </div>
        ))}
        <button onClick={() => up("classifieds", [...content.classifieds, { title: "", body: "", flags: [], tacticId: "phishing" }])} className="stencil text-[10px] text-primary underline">+ add classified</button>
      </Section>

      <Section title="E · PUZZLE">
        <Field label="Kind">
          <select value={content.puzzle.kind} onChange={(e) => up("puzzle", { ...content.puzzle, kind: e.target.value as "headline_autopsy" | "spot_the_tell" })} className="bg-background border border-border rounded-sm px-2 py-1 text-sm">
            <option value="headline_autopsy">Headline Autopsy</option>
            <option value="spot_the_tell">Spot the Tell</option>
          </select>
        </Field>
        <Field label="Clickbait line"><Input v={content.puzzle.clickbait} on={(v) => up("puzzle", { ...content.puzzle, clickbait: v })} /></Field>
        <Field label="Honest version"><Input v={content.puzzle.honest} on={(v) => up("puzzle", { ...content.puzzle, honest: v, words: v.split(/\s+/).filter(Boolean) })} /></Field>
        <Field label="Reveal note"><Textarea v={content.puzzle.reveal} on={(v) => up("puzzle", { ...content.puzzle, reveal: v })} /></Field>
      </Section>

      <Section title="F · LEDGER">
        <Field label="Note (italic caption under stats)"><Input v={content.ledger.note ?? ""} on={(v) => up("ledger", { note: v })} /></Field>
      </Section>

      <Section title="G · EDITORIAL (Handler fallback)">
        <Field label="Fallback (used when AI slow/quiet)"><Textarea v={content.editorial.fallback} rows={4} on={(v) => up("editorial", { ...content.editorial, fallback: v })} /></Field>
        <Field label="Signoff"><Input v={content.editorial.signoff} on={(v) => up("editorial", { ...content.editorial, signoff: v })} /></Field>
      </Section>

      <Section title="H · REAL WORLD">
        <Field label="Lede (2 sentences)"><Textarea v={content.realWorld.lede} on={(v) => up("realWorld", { ...content.realWorld, lede: v })} /></Field>
        <Field label="Link label"><Input v={content.realWorld.linkLabel} on={(v) => up("realWorld", { ...content.realWorld, linkLabel: v })} /></Field>
        <Field label="Link URL"><Input v={content.realWorld.linkHref} on={(v) => up("realWorld", { ...content.realWorld, linkHref: v })} /></Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <details open className="rounded-sm border border-border p-4"><summary className="cursor-pointer stencil text-xs text-primary">{title}</summary><div className="mt-3 space-y-3">{children}</div></details>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="stencil text-[10px] text-muted-foreground mb-1">{label}</div>{children}</label>;
}
function Input({ v, on, type = "text" }: { v: string; on: (v: string) => void; type?: string }) {
  return <input type={type} value={v} onChange={(e) => on(e.target.value)} className="w-full rounded-sm bg-background border border-border px-2 py-1.5 text-sm" />;
}
function Textarea({ v, on, rows = 3 }: { v: string; on: (v: string) => void; rows?: number }) {
  return <textarea value={v} rows={rows} onChange={(e) => on(e.target.value)} className="w-full rounded-sm bg-background border border-border px-2 py-1.5 text-sm font-mono" />;
}
function TacticSelect({ v, on }: { v: string | undefined; on: (v: string) => void }) {
  return <select value={v ?? ""} onChange={(e) => on(e.target.value)} className="bg-background border border-border rounded-sm px-2 py-1 text-sm">
    <option value="">(none)</option>
    {TACTICS.map((t) => <option key={t} value={t}>{t}</option>)}
  </select>;
}

function blankContent(): EditionContent {
  return {
    lead: { kicker: "SPECIAL DISPATCH", headline: "", subhead: "", byline: "By ", dropCap: true, columns: [""], caseId: "bank-rumor", yourCallTitle: "YOUR CALL, CITIZEN" },
    forgery: { kind: "ai_or_real", prompt: "Real or engine-made?", imageAlt: "", imageEmoji: "🖼️", truth: "AI", provenance: "", thesis: "", tacticId: "ai-generated" },
    social: { handle: "@", caption: "", likes: 0, views: 0, imageEmoji: "📱", imageAlt: "", truth: "MISLEADING", reveal: "", tacticId: "engagement-bait" },
    classifieds: [],
    puzzle: { kind: "headline_autopsy", clickbait: "", honest: "", words: [], reveal: "" },
    ledger: { note: "" },
    editorial: { fallback: "", signoff: "— The Handler" },
    realWorld: { lede: "", linkLabel: "Fact-check source", linkHref: "https://sochfactcheck.com/" },
  };
}

// MILVERSE — The City Library. Three shelves: Official / Community / My Shelf.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Library, ScrollText, Users, ArrowRight, ShieldCheck, BookMarked, Stamp, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SCENARIOS, type Scenario, saveCitizenCase } from "@/lib/mirror/scenarios";
import { listCommunityCases } from "@/lib/story.functions";
import { loadProfile, type HistoryEntry, type TrustProfile } from "@/lib/mirror/profile";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "The City Library — MILVERSE" },
      { name: "description", content: "The living memory of MILVERSE. Every case the city solves is archived here — written by its players." },
    ],
  }),
  component: ArchivePage,
});

interface CommunityRow {
  share_code: string;
  scenario_config: unknown;
  created_at: string;
}
type Shelf = "official" | "community" | "mine";
type Sort = "newest" | "most-voted" | "difficulty";
type Truth = "all" | "IMPOSTER" | "REAL";

function ArchivePage() {
  const [community, setCommunity] = useState<Array<CommunityRow & { scenario: Scenario }>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [shelf, setShelf] = useState<Shelf>("official");
  const [truth, setTruth] = useState<Truth>("all");
  const [tier, setTier] = useState<number | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [openHistory, setOpenHistory] = useState<HistoryEntry | null>(null);
  const fetchCommunity = useServerFn(listCommunityCases);

  useEffect(() => {
    setProfile(loadProfile());
    fetchCommunity()
      .then((res) => {
        const rows = ((res as { rows: CommunityRow[] }).rows) ?? [];
        setCommunity(
          rows
            .map((r) => {
              try {
                const s = (typeof r.scenario_config === "string" ? JSON.parse(r.scenario_config) : r.scenario_config) as Scenario;
                return { ...r, scenario: s };
              } catch { return null; }
            })
            .filter(Boolean) as Array<CommunityRow & { scenario: Scenario }>,
        );
      })
      .catch(() => setErr("Couldn't load the community shelf right now."));
  }, [fetchCommunity]);

  const officialAll = useMemo(() => SCENARIOS.filter((s) => s.source !== "user_designed"), []);

  const applyFilters = (list: Scenario[]) => {
    let out = list;
    if (truth !== "all") out = out.filter((s) => s.truth === truth);
    if (tier !== "all") out = out.filter((s) => s.tier === tier);
    if (sort === "difficulty") out = [...out].sort((a, b) => a.tier - b.tier);
    // "newest" for officials = original order; "most-voted" — no vote data, fall back to newest
    return out;
  };

  const officials = useMemo(() => applyFilters(officialAll), [officialAll, truth, tier, sort]);
  const communityFiltered = useMemo(() => {
    let list = community;
    if (truth !== "all") list = list.filter((c) => c.scenario.truth === truth);
    if (tier !== "all") list = list.filter((c) => c.scenario.tier === tier);
    if (sort === "difficulty") list = [...list].sort((a, b) => a.scenario.tier - b.scenario.tier);
    else list = [...list].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return list;
  }, [community, truth, tier, sort]);

  const mineHistory = useMemo(() => {
    if (!profile) return [] as HistoryEntry[];
    // last entry per case wins
    const byId = new Map<string, HistoryEntry>();
    for (const h of profile.history) byId.set(h.caseId, h);
    let arr = Array.from(byId.values()).sort((a, b) => b.ts - a.ts);
    if (tier !== "all") arr = arr.filter((h) => h.tier === tier);
    return arr;
  }, [profile, tier]);

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* HEADER — library reading room */}
        <div className="mb-8 rounded-sm border border-primary/30 bg-gradient-to-b from-primary/[0.06] to-transparent p-6">
          <div className="stencil text-[10px] text-primary">THE CITY LIBRARY</div>
          <h1 className="mt-2 text-3xl sm:text-5xl font-semibold uppercase tracking-tight flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" /> Mission Archive
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/90 italic">
            "Every case the city solves is archived here. The library is written by its players."
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="stencil text-[10px]">READING ROOM · {officialAll.length} OFFICIAL · {community.length} COMMUNITY · {mineHistory.length} ON YOUR SHELF</span>
          </div>
        </div>

        {/* SHELF TABS */}
        <div className="mb-4 flex flex-wrap gap-1 rounded-sm border border-border bg-card p-1 w-fit">
          <TabBtn active={shelf === "official"} onClick={() => setShelf("official")} icon={<ScrollText className="h-3 w-3" />} label={`Official (${officialAll.length})`} />
          <TabBtn active={shelf === "community"} onClick={() => setShelf("community")} icon={<Users className="h-3 w-3" />} label={`Community (${community.length})`} />
          <TabBtn active={shelf === "mine"} onClick={() => setShelf("mine")} icon={<BookMarked className="h-3 w-3" />} label={`My Shelf (${mineHistory.length})`} />
        </div>

        {/* FILTER CHIPS */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="stencil text-[10px] text-muted-foreground mr-1">FILTER</span>
          <ChipGroup value={truth} onChange={(v) => setTruth(v as Truth)} options={[
            { v: "all", label: "All tactics" },
            { v: "IMPOSTER", label: "Deception" },
            { v: "REAL", label: "Legit contact" },
          ]} />
          <span className="text-muted-foreground text-xs mx-1">·</span>
          <ChipGroup value={String(tier)} onChange={(v) => setTier(v === "all" ? "all" : Number(v))} options={[
            { v: "all", label: "Any difficulty" },
            { v: "1", label: "T1" },
            { v: "2", label: "T2" },
            { v: "3", label: "T3" },
            { v: "4", label: "T4" },
            { v: "5", label: "T5" },
          ]} />
          <span className="text-muted-foreground text-xs mx-1">·</span>
          <ChipGroup value={sort} onChange={(v) => setSort(v as Sort)} options={[
            { v: "newest", label: "Newest" },
            { v: "most-voted", label: "Most-voted" },
            { v: "difficulty", label: "By difficulty" },
          ]} />
        </div>

        {/* SHELF BODY */}
        {shelf === "official" && (
          <ShelfSection title="MILVERSE OFFICIAL" tone="primary" note="New official missions released regularly — covering global and emerging information threats.">
            <SpineGrid>
              {officials.map((s) => (
                <SpineCard key={s.id} scenario={s} to={`/mirror/${s.id}`} />
              ))}
            </SpineGrid>
            {officials.length === 0 && <EmptyRow msg="Nothing matches those filters." />}
          </ShelfSection>
        )}

        {shelf === "community" && (
          <ShelfSection title="FROM THE COMMUNITY · HUMAN-REVIEWED" tone="caution" note={<>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Every community mission is reviewed by a human before publication.</span>
          </>} action={
            <Link to="/archive/submit" className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-3 py-1.5 stencil text-[10px] text-primary hover:bg-primary/20">
              SHARE YOUR STORY <ArrowRight className="h-3 w-3" />
            </Link>
          }>
            {err && <div className="text-sm text-destructive">{err}</div>}
            {!err && communityFiltered.length === 0 && (
              <EmptyRow msg={community.length === 0
                ? "No community missions published yet. Be the first — share a scam you experienced."
                : "Nothing matches those filters."} />
            )}
            <SpineGrid>
              {communityFiltered.map((row) => (
                <button
                  key={row.share_code}
                  onClick={() => { saveCitizenCase(row.scenario); window.location.href = `/mirror/${row.scenario.id}`; }}
                  className="group text-left folder-card border-caution/50 bg-caution/5 hover:border-caution"
                >
                  <div className="folder-tab bg-caution/20 text-caution">CASE · {row.share_code}</div>
                  <div className="folder-body">
                    <div className="text-sm font-semibold group-hover:text-caution">{row.scenario.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{row.scenario.teaser}</div>
                    <div className="mt-3 flex items-center justify-between stencil text-[9px]">
                      <span className="text-caution/80">T{row.scenario.tier} · {row.scenario.truth}</span>
                      {row.scenario.inspiredBy && <span className="text-muted-foreground">{row.scenario.inspiredBy.country} · {row.scenario.inspiredBy.year}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </SpineGrid>
          </ShelfSection>
        )}

        {shelf === "mine" && (
          <ShelfSection title="MY SHELF · PERSONAL LIBRARY" tone="primary" note="Cases you've closed. Click any stamp to reopen the file.">
            {mineHistory.length === 0 && (
              <EmptyRow msg="Solve cases in the city. They end up here." />
            )}
            <SpineGrid>
              {mineHistory.map((h) => (
                <ClosedFile key={h.caseId + h.ts} entry={h} onOpen={() => setOpenHistory(h)} />
              ))}
            </SpineGrid>
          </ShelfSection>
        )}
      </main>

      {openHistory && <RecapModal entry={openHistory} onClose={() => setOpenHistory(null)} />}

      <style>{`
        .folder-card { position: relative; display: block; border: 1px solid hsl(var(--border)); border-radius: 2px; background: hsl(var(--card)); padding-top: 22px; overflow: hidden; transition: transform .15s, border-color .15s; }
        .folder-card:hover { transform: translateY(-2px); }
        .folder-tab { position: absolute; top: 0; left: 10px; padding: 3px 8px 3px; font-family: inherit; font-size: 9px; letter-spacing: 0.12em; border-radius: 0 0 2px 2px; }
        .folder-body { padding: 14px 14px 16px; }
      `}</style>
    </div>
  );
}

/* ── UI atoms ─────────────────────────────────────────────────── */

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 stencil text-[10px] tracking-widest transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
      {icon}{label}
    </button>
  );
}

function ChipGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`rounded-full border px-2.5 py-1 stencil text-[10px] tracking-widest transition ${value === o.v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ShelfSection({ title, tone, note, action, children }: { title: string; tone: "primary" | "caution"; note?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  const cls = tone === "caution" ? "border-caution/50 bg-caution/10 text-caution" : "border-primary/50 bg-primary/10 text-primary";
  return (
    <section className="mb-14">
      <div className="mb-3 flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-sm border ${cls} px-2.5 py-1 stencil text-[10px]`}>
          {title}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {(note || action) && (
        <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {note && <div>{note}</div>}
          {action}
        </div>
      )}
      {/* library shelf plank */}
      <div className="relative">
        <div className="pointer-events-none absolute -bottom-2 left-0 right-0 h-2 rounded-sm bg-gradient-to-b from-primary/30 to-primary/5" />
        {children}
      </div>
    </section>
  );
}

function SpineGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function EmptyRow({ msg }: { msg: string }) {
  return <div className="rounded-sm border border-dashed border-border p-6 text-sm text-muted-foreground text-center">{msg}</div>;
}

function SpineCard({ scenario, to }: { scenario: Scenario; to: string }) {
  return (
    <Link to={to as "/mirror/$caseId"} className="group folder-card hover:border-primary">
      <div className="folder-tab bg-primary/15 text-primary">T{scenario.tier} · {scenario.truth === "IMPOSTER" ? "DECEPTION" : "LEGIT"}</div>
      <div className="folder-body">
        <div className="text-sm font-semibold group-hover:text-primary">{scenario.title}</div>
        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{scenario.teaser}</div>
        <div className="mt-3 stencil text-[9px] text-primary/80 opacity-0 group-hover:opacity-100 transition">OPEN CASE →</div>
      </div>
    </Link>
  );
}

function ClosedFile({ entry, onOpen }: { entry: HistoryEntry; onOpen: () => void }) {
  const scenario = SCENARIOS.find((s) => s.id === entry.caseId);
  const title = scenario?.title ?? entry.caseId;
  const stampText = entry.result === "correct" ? "CLOSED · CORRECT CALL"
    : entry.result === "missed_scam" ? "CLOSED · MISSED SCAM"
    : entry.result === "false_alarm" ? "CLOSED · FALSE ALARM"
    : "CLOSED · LUCKY GUESS";
  const stampColor =
    entry.result === "correct" ? "text-primary border-primary"
    : entry.result === "lucky_guess" ? "text-caution border-caution"
    : "text-destructive border-destructive";
  return (
    <button onClick={onOpen} className="group folder-card text-left hover:border-primary">
      <div className="folder-tab bg-primary/15 text-primary">T{entry.tier} · YOUR VERDICT: {entry.verdict}</div>
      <div className="folder-body relative">
        <div className={`absolute right-2 top-0 rotate-6 border-2 ${stampColor} bg-background/70 px-2 py-0.5 stencil text-[9px] tracking-widest`}>
          <span className="inline-flex items-center gap-1"><Stamp className="h-3 w-3" /> {stampText}</span>
        </div>
        <div className="text-sm font-semibold group-hover:text-primary pr-16">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{scenario?.teaser ?? "Case file from your city record."}</div>
        <div className="mt-3 stencil text-[9px] text-muted-foreground">
          TRUTH · {entry.truth} · {entry.points >= 0 ? "+" : ""}{entry.points} PTS
        </div>
      </div>
    </button>
  );
}

function RecapModal({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const scenario = SCENARIOS.find((s) => s.id === entry.caseId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-sm border-2 border-primary/60 bg-card p-6">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="stencil text-[10px] text-primary">FILE REOPENED</div>
        <h3 className="mt-1 text-xl font-semibold">{scenario?.title ?? entry.caseId}</h3>
        <div className="mt-2 stencil text-[10px] text-muted-foreground">
          T{entry.tier} · YOUR VERDICT: {entry.verdict} · TRUTH: {entry.truth} · {entry.result.replace("_", " ").toUpperCase()}
        </div>
        {scenario?.dossier?.knownFacts?.length ? (
          <div className="mt-4">
            <div className="stencil text-[10px] text-primary mb-2">DOSSIER FACTS YOU HAD</div>
            <ul className="space-y-1.5 text-sm">
              {scenario.dossier.knownFacts.map((f, i) => (
                <li key={i} className="flex gap-2"><span className="font-mono text-primary">▸</span><span>{f}</span></li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Case details are no longer in the local library.</p>
        )}
        <div className="mt-5 flex justify-end">
          {scenario && (
            <Link to="/mirror/$caseId" params={{ caseId: scenario.id }}
              className="rounded-sm border border-primary bg-primary/10 px-3 py-1.5 stencil text-[10px] text-primary hover:bg-primary/20">
              REPLAY CASE →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

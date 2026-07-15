// MILVERSE — The Archive district. Two shelves: Official + Community.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Library, ScrollText, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SCENARIOS, type Scenario, saveCitizenCase } from "@/lib/mirror/scenarios";
import { listCommunityCases } from "@/lib/story.functions";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "The Archive — MILVERSE" },
      { name: "description", content: "Official campaign missions and community-submitted stories, human-reviewed before publication." },
    ],
  }),
  component: ArchivePage,
});

interface CommunityRow {
  share_code: string;
  scenario_config: unknown;
  created_at: string;
}

function ArchivePage() {
  const [community, setCommunity] = useState<Array<CommunityRow & { scenario: Scenario }>>([]);
  const [err, setErr] = useState<string | null>(null);
  const fetchCommunity = useServerFn(listCommunityCases);
  useEffect(() => {
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

  // Group officials by tier for a story-like progression
  const officialsByTier = [1, 2, 3, 4, 5].map((t) => ({
    tier: t,
    items: SCENARIOS.filter((s) => s.tier === t),
  }));

  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="stencil text-[10px] text-primary">THE ARCHIVE</div>
          <h1 className="mt-2 text-3xl sm:text-5xl font-semibold uppercase tracking-tight flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" /> Mission Archive
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Every playable case, indexed. The official campaign is authored by MILVERSE.
            The community library is submitted by people who lived through the scam — and reviewed by a human before it gets published.
          </p>
        </div>

        {/* OFFICIAL */}
        <section className="mb-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-2.5 py-1 stencil text-[10px] text-primary">
              <ScrollText className="h-3 w-3" /> MILVERSE OFFICIAL
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            New official missions released regularly — covering global and emerging information threats.
          </p>
          {officialsByTier.map(({ tier, items }) => (
            items.length ? (
              <div key={tier} className="mb-6">
                <div className="mb-2 stencil text-[10px] text-muted-foreground">TIER {tier}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((s) => (
                    <Link
                      key={s.id}
                      to="/mirror/$caseId"
                      params={{ caseId: s.id }}
                      className="group rounded-sm border border-border bg-card p-4 hover:border-primary hover:-translate-y-0.5 transition"
                    >
                      <div className="text-sm font-semibold group-hover:text-primary">{s.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.teaser}</div>
                      <div className="mt-3 stencil text-[9px] text-primary/80 opacity-0 group-hover:opacity-100 transition">OPEN CASE →</div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null
          ))}
        </section>

        {/* COMMUNITY */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-caution/50 bg-caution/10 px-2.5 py-1 stencil text-[10px] text-caution">
              <Users className="h-3 w-3" /> FROM THE COMMUNITY · HUMAN-REVIEWED
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Every community mission is reviewed by a human before publication.
            </div>
            <Link
              to="/archive/submit"
              className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-3 py-1.5 stencil text-[10px] text-primary hover:bg-primary/20"
            >
              SHARE YOUR STORY <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {err && <div className="text-sm text-destructive">{err}</div>}
          {!err && community.length === 0 && (
            <div className="rounded-sm border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
              No community missions published yet. Be the first — share a scam you experienced.
            </div>
          )}
          {community.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {community.map((row) => (
                <button
                  key={row.share_code}
                  onClick={() => {
                    saveCitizenCase(row.scenario);
                    window.location.href = `/mirror/${row.scenario.id}`;
                  }}
                  className="group text-left rounded-sm border border-caution/40 bg-caution/5 p-4 hover:border-caution hover:-translate-y-0.5 transition"
                >
                  <div className="text-sm font-semibold group-hover:text-caution">{row.scenario.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{row.scenario.teaser}</div>
                  <div className="mt-3 stencil text-[9px] text-caution/80">
                    {row.scenario.inspiredBy
                      ? `INSPIRED BY REPORT · ${row.scenario.inspiredBy.country ?? ""} ${row.scenario.inspiredBy.year ?? ""}`
                      : `TIER ${row.scenario.tier} · CODE ${row.share_code}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import { FormatBadge } from "@/components/feed/FormatFrame";
import { DistrictIntro } from "@/components/DistrictIntro";
import { CaseCard } from "@/components/CaseCard";
import feedArt from "@/assets/district-feed.jpg";
import { Newspaper, Share2 } from "lucide-react";
import { useJuniorGate } from "@/components/firstPhone/JuniorGate";

export const Route = createFileRoute("/feed/")({
  head: () => ({
    meta: [
      { title: "The Feed — MILVERSE" },
      {
        name: "description",
        content:
          "Verify claims, not just people. Fight viral lies without breaking your relationships.",
      },
    ],
  }),
  component: function FeedIndexGuarded() {
    const gate = useJuniorGate("The Feed");
    return gate ?? <FeedIndex />;
  },
});

const TIER_NAMES: Record<1 | 2 | 3, string> = {
  1: "Forwarded Once",
  2: "Everyone Is Sharing",
  3: "It's Personal",
};

function FeedIndex() {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <DistrictIntro
          id="feed"
          chapter="CHAPTER 02"
          title="THE FEED"
          art={feedArt}
          district="feed"
          lines={[
            "The message arrives from someone you love. It carries a claim you'd want to be true — or dread is true.",
            "Your job is to check the claim without breaking the person. Verify the source. Correct with dignity. Both are the work.",
          ]}
        />
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        <div className="mt-4 max-w-2xl">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">
            THE FEED · MASS DECEPTION
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Claims, not con artists.</h1>
          <p className="mt-3 text-muted-foreground">
            The person sending it is real, and sincere, and probably someone you love. The{" "}
            <span className="text-foreground">claim</span> might be a viral lie. Verify the claim.
            Correct with dignity. Both are the job.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-caution/30 bg-caution/10 px-3 py-1 text-[11px] font-mono tracking-widest text-caution">
            🇵🇰 SCENARIOS ROOTED IN REAL FORWARDS THAT SPREAD IN PAKISTANI CHATS
          </div>
        </div>

        {[1, 2, 3].map((tier) => {
          const cases = FEED_SCENARIOS.filter((s) => s.tier === tier);
          if (cases.length === 0) return null;
          return (
            <section key={tier} className="mt-10">
              <div className="mb-3 font-mono text-[11px] tracking-widest text-primary">
                TIER {tier} · {TIER_NAMES[tier as 1 | 2 | 3]}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((s) => (
                  <CaseCard
                    key={s.id}
                    to="/feed/$caseId"
                    params={{ caseId: s.id }}
                    icon={<Newspaper className="h-5 w-5" />}
                    metaTopRight={
                      <>
                        <FormatBadge format={s.format ?? "whatsapp"} aiGenerated={s.aiGenerated} />
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-mono tracking-widest text-primary">
                          <Share2 className="h-2.5 w-2.5" /> T{s.tier}
                        </span>
                      </>
                    }
                    title={s.title}
                    teaser={s.teaser}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

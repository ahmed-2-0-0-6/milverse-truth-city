import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import { FormatBadge } from "@/components/feed/FormatFrame";
import { DistrictIntro } from "@/components/DistrictIntro";
import { DistrictHero } from "@/components/DistrictHero";
import { CaseCard, type CaseCardOutcome, type ArtifactChip } from "@/components/CaseCard";
import { TierRail } from "@/components/hub/TierRail";
import { loadFeedWall } from "@/lib/feed/wall";
import { loadInbox } from "@/lib/inbox/profile";
import feedArt from "@/assets/district-feed.jpg";
import { Newspaper, Share2 } from "lucide-react";
import { useJuniorGate } from "@/components/firstPhone/JuniorGate";
import { InboxManager } from "@/components/inbox/InboxManager";
import { IncomingToast } from "@/components/inbox/IncomingToast";
import { IncomingCall } from "@/components/inbox/IncomingCall";
import { SeasonAdvisory, SeasonGlyph, useSeason } from "@/components/season/SeasonAdvisory";
import { NightShiftAdvisory } from "@/components/hub/NightShiftAdvisory";


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
  const [outcomes, setOutcomes] = useState<Map<string, CaseCardOutcome>>(new Map());
  const [unread, setUnread] = useState<Set<string>>(new Set());
  const season = useSeason();


  useEffect(() => {
    const readOutcomes = () => {
      const sorted = [...loadFeedWall()].sort((a, b) => a.ts - b.ts);
      const map = new Map<string, CaseCardOutcome>();
      for (const e of sorted) {
        const oc: CaseCardOutcome | null =
          e.result === "correct"
            ? "closed"
            : e.result === "missed_scam"
              ? "transacted"
              : e.result === "false_alarm"
                ? "false_alarm"
                : e.result === "pyrrhic"
                  ? "closed"
                  : null;
        if (oc) map.set(e.caseId, oc);
      }
      setOutcomes(map);
    };
    const readInbox = () => {
      const p = loadInbox();
      const opened = new Set(p.opened);
      setUnread(new Set(p.arrived.filter((id) => !opened.has(id))));
    };
    readOutcomes();
    readInbox();
    window.addEventListener("milverse:inbox", readInbox);
    return () => window.removeEventListener("milverse:inbox", readInbox);
  }, []);

  const solvedCount = [...outcomes.values()].filter((o) => o === "closed").length;
  const lossCount = [...outcomes.values()].filter((o) => o !== "closed").length;
  const totalCases = FEED_SCENARIOS.length;
  const shelfLine =
    outcomes.size === 0
      ? "SHELF: UNTOUCHED. EVERY FILE IS WAITING."
      : `SHELF: ${solvedCount}/${totalCases} FILES CLOSED · ${lossCount} STILL OPEN ON YOUR RECORD`;

  const chipFor = (fmt: string | undefined): ArtifactChip => {
    switch (fmt) {
      case "video":
        return { label: "CLIP", tone: "video" };
      case "image":
        return { label: "PHOTO", tone: "image" };
      case "news":
        return { label: "SCREENSHOT", tone: "news" };
      case "instagram":
        return { label: "POST", tone: "dm" };
      case "whatsapp":
      default:
        return { label: "FORWARD", tone: "wa" };
    }
  };

  // Tier unlock rule for Feed: T1 always open; higher tiers unlock as prior tier has 2 wins.
  const tierWins = (t: number) =>
    [...outcomes.entries()].filter(
      ([id, oc]) =>
        oc === "closed" && FEED_SCENARIOS.find((s) => s.id === id && s.tier === t),
    ).length;
  const highestUnlocked = (() => {
    let m = 1;
    for (const t of [1, 2] as const) if (tierWins(t) >= 2) m = t + 1;
    return Math.min(3, m);
  })();

  const railNodes = ([1, 2, 3] as const).map((t) => ({
    tier: t,
    label: `T${t}`,
    unlocked: t <= highestUnlocked,
    wins: tierWins(t),
    required: 2,
    targetId: `feed-tier-${t}`,
  }));

  return (
    <div className="min-h-dvh grain">
      <InboxManager />
      <IncomingToast />
      <IncomingCall />
      <TopBar />
      <DistrictHero
        art={feedArt}
        district="feed"
        kicker="CHAPTER 02 · THE FEED · MASS DECEPTION"
        title="Claims, not con artists."
        thesis={
          <>
            The person sending it is real, and sincere, and probably someone you love. The{" "}
            <span className="text-white font-semibold">claim</span> might be a viral lie. Verify the
            claim. Correct with dignity. Both are the job.
          </>
        }
        rooted="SCENARIOS ROOTED IN REAL FORWARDS THAT SPREAD IN PAKISTANI CHATS"
      />
      <main id="main" role="main" className="mx-auto max-w-5xl px-4 sm:px-6 py-8 safe-bottom">

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
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Is that viral forward true? Prove it.
        </p>

        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>
        <SeasonAdvisory season={season} />
        <NightShiftAdvisory />

        <div className="mt-6 mb-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          {shelfLine}
        </div>


        <div className="flex gap-6">
          <TierRail nodes={railNodes} frontierTier={highestUnlocked} />
          <div className="min-w-0 flex-1">
        {[1, 2, 3].map((tier) => {
          const cases = FEED_SCENARIOS.filter((s) => s.tier === tier);
          if (cases.length === 0) return null;
          return (
            <section key={tier} id={`feed-tier-${tier}`} className="mt-10 scroll-mt-24">
              <div className="mb-3 font-mono text-[11px] tracking-widest text-primary">
                TIER {tier} · {TIER_NAMES[tier as 1 | 2 | 3]}
              </div>
              <div className="hub-grid">
                {cases.map((s) => {
                  const inSeason = !!season && !!s.tacticId && season.tactics.includes(s.tacticId);
                  return (
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
                      seasonGlyph={inSeason ? <SeasonGlyph season={season} /> : undefined}
                      inSeason={inSeason}
                      title={s.title}
                      teaser={s.teaser}
                      outcome={outcomes.get(s.id)}
                      artifactChip={chipFor(s.format)}
                      unreadThread={unread.has(s.id)}
                    />
                  );
                })}

              </div>
            </section>
          );
        })}
          </div>
        </div>
      </main>
    </div>
  );
}

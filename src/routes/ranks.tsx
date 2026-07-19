// OPERATION GRAVITY — THE LADDER.
// A dedicated screen that shows every rank, its XP threshold, and what it
// unlocks. Read-only over ranks.ts + profile. No engine mutation.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { loadProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp, RANKS, type RankId } from "@/lib/ranks";
import { Lock, Check } from "lucide-react";

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "The Ladder — MILVERSE" },
      { name: "description", content: "Solve live scam cases. Rank up. Unlock the city." },
      { property: "og:title", content: "The Ladder — MILVERSE" },
      { property: "og:description", content: "Solve live scam cases. Rank up. Unlock the city." },
      { property: "og:url", content: "https://milverse-truth-city.lovable.app/ranks" },
    ],
    links: [{ rel: "canonical", href: "https://milverse-truth-city.lovable.app/ranks" }],
  }),
  component: RanksPage,
});

const UNLOCKS: Record<RankId, string> = {
  citizen: "The Mirror, The Feed, Daily Drop, First Phone, Archive",
  spotter: "The Paper + Pressroom — earn your press pass",
  analyst: "Boss Protocol — face the city's master manipulators",
  investigator: "The Shift — five cases, three lives, one score",
  editor: "Studio — earn your DESIGNER LICENSE, build cases yourself",
  "city-designer": "Bureau Legend — the city is yours",
};

function RanksPage() {
  const [xp, setXp] = useState(0);
  useEffect(() => {
    const push = () => {
      const p = loadProfile();
      setXp(computeXp(p, loadUnlocked().size, p.publishedCount ?? 0));
    };
    push();
    const events = ["milverse:profile", "milverse:manual", "storage"];
    events.forEach((e) => window.addEventListener(e, push));
    return () => events.forEach((e) => window.removeEventListener(e, push));
  }, []);

  const current = rankFromXp(xp);
  const currentIdx = RANKS.findIndex((r) => r.id === current.current.id);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="stencil text-[10px] text-primary/80 mb-2">// THE LADDER</div>
        <h1
          className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none"
          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
        >
          RANK UP. UNLOCK THE CITY.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg">
          Every case, every takedown, every day you show up — the city notices.
          You have <span className="text-primary tabular-nums">{xp} XP</span>.
        </p>

        <ol className="mt-8 space-y-3">
          {RANKS.map((r, i) => {
            const cleared = i <= currentIdx;
            const isCurrent = i === currentIdx;
            const isNext = i === currentIdx + 1;
            const need = Math.max(0, r.minXp - xp);
            return (
              <li
                key={r.id}
                className={`relative rounded border p-4 transition-colors ${
                  isCurrent
                    ? "border-primary/70 bg-primary/5 shadow-[0_0_16px_oklch(0.82_0.14_195/0.15)]"
                    : isNext
                      ? "border-caution/50 bg-caution/5"
                      : cleared
                        ? "border-border bg-card/40"
                        : "border-border/50 bg-card/20"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid h-10 w-10 place-items-center stencil text-xs shrink-0 ${
                      cleared
                        ? "bg-primary/15 text-primary"
                        : isNext
                          ? "bg-caution/15 text-caution"
                          : "bg-muted text-muted-foreground"
                    }`}
                    style={{
                      clipPath:
                        "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    }}
                    aria-hidden
                  >
                    {cleared && !isCurrent ? <Check className="h-4 w-4" /> : r.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="stencil text-sm text-foreground">
                        LVL {i + 1} · {r.name}
                      </div>
                      <div className="stencil text-[10px] text-muted-foreground tabular-nums">
                        {r.minXp} XP
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground italic">{r.tagline}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      {!cleared && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <span className={cleared ? "text-foreground/80" : "text-muted-foreground"}>
                        UNLOCKS: {UNLOCKS[r.id]}
                      </span>
                    </div>
                    {isCurrent && current.next && (
                      <div className="mt-3">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <span
                            className="block h-full bg-primary"
                            style={{ width: `${Math.round(current.progress * 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 stencil text-[10px] text-primary/80 tabular-nums">
                          {Math.round(current.progress * 100)}% → {current.next.name}
                        </div>
                      </div>
                    )}
                    {isNext && need > 0 && (
                      <div className="mt-2 stencil text-[10px] text-caution tabular-nums">
                        NEED {need} MORE XP
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            to="/mirror"
            className="rounded bg-primary px-4 py-2 stencil text-[11px] text-primary-foreground hover:bg-primary/90"
          >
            ▶ NEXT CASE
          </Link>
          <Link
            to="/"
            className="rounded border border-border px-4 py-2 stencil text-[11px] text-foreground hover:bg-accent"
          >
            CITY MAP
          </Link>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { castDistrictVote, fetchDistrictTallies } from "@/lib/district.functions";
import { getDeviceId } from "@/lib/pilot";
import { Vote, Sparkles } from "lucide-react";

interface Props {
  district: "market" | "arena";
  title: string;
  subtitle: string;
  concept: string;
  mechanics: string[];
}

export function DistrictBlueprint({ district, title, subtitle, concept, mechanics }: Props) {
  const [market, setMarket] = useState(0);
  const [arena, setArena] = useState(0);
  const [suggestions, setSuggestions] = useState<{ district: string; suggestion: string }[]>([]);
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const castVote = useServerFn(castDistrictVote);
  const fetchTallies = useServerFn(fetchDistrictTallies);

  const voteKey = `milverse.districtVote.${district}`;

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(voteKey)) setVoted(true);
    refresh();
  }, []);

  async function refresh() {
    try {
      const r = (await fetchTallies({} as never)) as {
        market: number;
        arena: number;
        suggestions: { district: string; suggestion: string }[];
      };
      setMarket(r.market);
      setArena(r.arena);
      setSuggestions(r.suggestions);
    } catch {
      /* offline — silent */
    }
  }

  async function vote() {
    if (voted) return;
    setBusy(true);
    setMsg(null);
    try {
      await castVote({
        data: {
          district,
          suggestion: suggestion.trim() || undefined,
          deviceId: getDeviceId(),
        } as never,
      });
      localStorage.setItem(voteKey, "1");
      setVoted(true);
      setSuggestion("");
      setMsg("Thanks — vote counted.");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Vote failed.");
    }
    setBusy(false);
  }

  const total = Math.max(1, market + arena);
  const marketPct = Math.round((market / total) * 100);
  const arenaPct = Math.round((arena / total) * 100);

  return (
    <div className="min-h-screen grain">
      <div className="pointer-events-none fixed inset-0 scanlines opacity-30" />
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="stencil text-[10px] text-muted-foreground hover:text-foreground">
          ← CITY
        </Link>

        <div className="mt-4 hud-frame border-2 border-dashed border-primary/40 bg-primary/[0.02] p-6 rounded-sm relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.82 0.16 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.82 0.16 85) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 stencil text-[10px] text-primary mb-1">
              <Sparkles className="h-3 w-3" /> DISTRICT BLUEPRINT · UNDER DESIGN
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold uppercase tracking-tight">{title}</h1>
            <div className="mt-1 stencil text-[10px] text-muted-foreground">{subtitle}</div>
            <p className="mt-5 text-sm text-foreground/90 leading-relaxed">{concept}</p>
            <div className="mt-6">
              <div className="stencil text-[10px] text-primary mb-2">PLANNED MECHANICS</div>
              <ul className="space-y-2">
                {mechanics.map((m, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-primary">0{i + 1}</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-sm border border-border bg-card p-6 hud-frame">
          <div className="flex items-center gap-2 stencil text-[10px] text-primary mb-3">
            <Vote className="h-3 w-3" /> COMMUNITY VOTE · WHICH DISTRICT OPENS NEXT?
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            MILVERSE is designed <b className="text-foreground">with</b> its citizens. Cast one vote
            per district. Optional one-line suggestion for what you most want in it.
          </p>

          <div className="space-y-3">
            <TallyBar
              label="THE MARKET"
              count={market}
              pct={marketPct}
              active={district === "market"}
            />
            <TallyBar
              label="THE ARENA"
              count={arena}
              pct={arenaPct}
              active={district === "arena"}
            />
          </div>

          <div className="mt-5">
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value.slice(0, 140))}
              rows={2}
              placeholder={`One-line suggestion for ${title} (optional, max 140 chars)`}
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
              disabled={voted}
            />
            <div className="mt-1 flex items-center justify-between">
              <div className="stencil text-[10px] text-muted-foreground">
                {suggestion.length}/140 · NO REAL NAMES, NUMBERS, OR LINKS
              </div>
              <button
                onClick={vote}
                disabled={busy || voted}
                className="rounded-md bg-primary px-4 py-2 stencil text-[10px] tracking-widest text-primary-foreground disabled:opacity-40"
              >
                {voted ? "VOTED ✓" : busy ? "CASTING…" : `VOTE FOR ${title.toUpperCase()}`}
              </button>
            </div>
            {msg && <div className="mt-2 text-xs text-muted-foreground">{msg}</div>}
          </div>
        </section>

        {suggestions.length > 0 && (
          <section className="mt-4 rounded-sm border border-border bg-card p-6 hud-frame">
            <div className="stencil text-[10px] text-primary mb-3">RECENT CITIZEN SUGGESTIONS</div>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="stencil text-[9px] text-muted-foreground shrink-0 mt-0.5">
                    {s.district.toUpperCase()}
                  </span>
                  <span className="text-foreground/90 italic">"{s.suggestion}"</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function TallyBar({
  label,
  count,
  pct,
  active,
}: {
  label: string;
  count: number;
  pct: number;
  active: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between stencil text-[10px] mb-1">
        <span className={active ? "text-primary" : "text-muted-foreground"}>
          {label} {active && "·  YOU'RE HERE"}
        </span>
        <span className="text-muted-foreground">
          {count} VOTES · {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-sm bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${active ? "bg-primary" : "bg-primary/40"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

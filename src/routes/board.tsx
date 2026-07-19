// MILVERSE — /board — The City Board.
// Group-scoped pseudonymous leaderboard for the classroom pilot.
// Server enforces n<5 suppression and >=3 plays per device; the client
// only ever sees 6-char handles + a callsign derived from them.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ErrorState } from "@/components/ui/page-states";
import { getActiveGroup, setActiveGroup, getDeviceId } from "@/lib/pilot";
import { fetchCityBoard } from "@/lib/pilot.functions";
import { callsign } from "@/lib/board/callsign";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "The City Board — MILVERSE" },
      {
        name: "description",
        content: "The class board. Pseudonymous callsigns, ranked by points.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BoardPage,
});

type Row = {
  handle: string;
  plays: number;
  points: number;
  correct_count: number;
  missed: number;
  false_alarms: number;
};

const REFRESH_COOLDOWN_MS = 30_000;

function BoardPage() {
  const [active, setActive] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [myHandle, setMyHandle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [code, setCode] = useState("");
  const lastRefreshRef = useRef(0);
  const fetchBoard = useServerFn(fetchCityBoard);

  const load = useCallback(
    async (silent = false) => {
      const g = getActiveGroup();
      if (!g) {
        setRows([]);
        setMyHandle(null);
        setLoadedOnce(true);
        return;
      }
      if (!silent) setBusy(true);
      setErr(null);
      try {
        const res = (await fetchBoard({
          data: { groupCode: g, deviceId: getDeviceId() } as never,
        })) as { rows: Row[]; myHandle: string | null };
        setRows(res.rows ?? []);
        setMyHandle(res.myHandle ?? null);
      } catch {
        setErr("The board's dark. Try again in a moment.");
      }
      if (!silent) setBusy(false);
      setLoadedOnce(true);
      lastRefreshRef.current = Date.now();
    },
    [fetchBoard],
  );

  useEffect(() => {
    setActive(getActiveGroup());
    void load();
    const on = () => {
      setActive(getActiveGroup());
      void load();
    };
    window.addEventListener("milverse:pilot", on);
    return () => window.removeEventListener("milverse:pilot", on);
  }, [load]);

  function join() {
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,6}$/.test(c)) {
      toast.error("Codes are 4–6 letters and numbers.");
      return;
    }
    setActiveGroup(c);
    setCode("");
  }

  function refresh() {
    const wait = REFRESH_COOLDOWN_MS - (Date.now() - lastRefreshRef.current);
    if (wait > 0) {
      toast(`Ease off — retry in ${Math.ceil(wait / 1000)}s.`);
      return;
    }
    void load();
  }

  const myRow = useMemo(
    () => (myHandle ? rows.find((r) => r.handle === myHandle) ?? null : null),
    [rows, myHandle],
  );
  const myRank = useMemo(
    () => (myRow ? rows.findIndex((r) => r.handle === myRow.handle) + 1 : 0),
    [rows, myRow],
  );

  return (
    <div className="min-h-dvh grain">
      <TopBar />
      <main id="main" role="main" className="mx-auto max-w-3xl px-4 sm:px-6 py-10 safe-bottom">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        <header className="mt-4">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">THE CITY BOARD</div>
          <h1 className="mt-2 text-step-5 font-semibold tracking-tight">
            Your crew, ranked.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Callsigns, not names. Points, not accuracy. Both columns lose — the board already
            knows that.
          </p>
        </header>


        {!active ? (
          <section
            aria-label="Join a group"
            className="mt-8 rounded-xl border border-border bg-card p-6"
          >
            <div className="font-mono text-[10px] tracking-widest text-primary">JOIN A CREW</div>
            <p className="mt-2 text-sm text-foreground">
              The board is per crew. Ask whoever runs your room for the code.
            </p>
            <div className="mt-4 flex gap-2">
              <label htmlFor="board-code" className="sr-only">
                Group code
              </label>
              <input
                id="board-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && join()}
                placeholder="CODE"
                maxLength={6}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                onClick={join}
                disabled={code.trim().length < 4}
                className="rounded-md bg-primary px-4 text-primary-foreground text-xs font-mono tracking-widest disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                JOIN
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between">
              <div className="font-mono text-[11px] tracking-widest text-muted-foreground">
                CREW · <span className="text-foreground">{active}</span>
              </div>
              <button
                onClick={refresh}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] font-mono tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RefreshCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} /> REFRESH
              </button>
            </div>

            {err ? (
              <div className="mt-4">
                <ErrorState
                  title="Board unreachable"
                  description={err}
                  onRetry={() => void load()}
                />
              </div>
            ) : !loadedOnce || busy ? (
              <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading board">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-md border border-border bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <section
                aria-label="Board suppressed"
                className="mt-4 rounded-xl border border-border bg-card p-6"
              >
                <div className="font-mono text-[10px] tracking-widest text-caution">
                  BOARD DARK
                </div>
                <p className="mt-2 text-sm text-foreground">
                  This board stays dark until five citizens are on it. No exceptions.
                </p>
                <p className="mt-1 text-xs text-muted-foreground italic">
                  Privacy is a feature here.
                </p>
              </section>
            ) : (
              <>
                <table
                  className="mt-4 w-full border-collapse text-sm"
                  aria-label="City board ranking"
                >
                  <thead>
                    <tr className="border-b border-border font-mono text-[10px] tracking-widest text-muted-foreground">
                      <th scope="col" className="py-2 pl-2 text-left w-10">
                        RANK
                      </th>
                      <th scope="col" className="py-2 text-left">
                        CITIZEN
                      </th>
                      <th scope="col" className="py-2 text-right w-16">
                        PLAYS
                      </th>
                      <th scope="col" className="py-2 pr-2 text-right w-20">
                        POINTS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const isMe = myHandle === r.handle;
                      const topThree = i < 3;
                      return (
                        <tr
                          key={r.handle}
                          className={`border-b border-border/40 ${
                            isMe ? "bg-primary/15" : ""
                          } ${topThree ? "border-l-2 border-l-caution" : "border-l-2 border-l-transparent"}`}
                        >
                          <td className="py-2 pl-2 font-mono tabular-nums text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="py-2">
                            <span className="stencil text-xs text-foreground">
                              {callsign(r.handle)}
                            </span>{" "}
                            <span className="font-mono text-[10px] text-muted-foreground">
                              · {r.handle}
                            </span>
                            {isMe && (
                              <span className="ml-2 rounded-sm border border-primary/50 bg-primary/10 px-1.5 py-0.5 stencil text-[9px] tracking-widest text-primary">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {r.plays}
                          </td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums font-semibold text-foreground">
                            {r.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {myRow && myRank > 10 && (
                  <div className="mt-4 rounded-md border border-primary/40 bg-primary/10 p-3">
                    <div className="font-mono text-[10px] tracking-widest text-primary">
                      YOUR STANDING
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">#{myRank}</span>{" "}
                        <span className="stencil text-xs text-foreground">
                          {callsign(myRow.handle)}
                        </span>{" "}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          · {myRow.handle}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-foreground tabular-nums">
                        {myRow.points}
                      </div>
                    </div>
                  </div>
                )}

                {myRow && (
                  <div className="mt-4">
                    <div className="font-mono text-[11px] text-muted-foreground">
                      correct {myRow.correct_count} · missed {myRow.missed} · false alarms{" "}
                      {myRow.false_alarms}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground italic">
                      Both columns lose. The board already knows that.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

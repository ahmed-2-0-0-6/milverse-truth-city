
/* ─────────────────────── COLD READ · INTERSTITIAL ─────────────────────── */

function ColdInterstitial({ scenario, onStart }: { scenario: Scenario; onStart: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/mirror"
        className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← CASE FILES
      </Link>
      <div className="mt-6 rounded-xl border border-white/20 bg-black/40 p-6">
        <div className="font-mono text-xs tracking-[0.3em] text-white/60">
          COLD READ · {scenario.title}
        </div>
        <p
          data-phase-anchor="mirror"
          tabIndex={-1}
          className="mt-6 text-lg leading-relaxed text-foreground outline-none"
        >
          You've beaten this one warm. Now blind: no file, no notes, no needle. Four minutes. The
          contact hasn't changed — you have. Prove it.
        </p>
        <div className="mt-6 font-mono text-[10px] tracking-[0.3em] text-white/50">
          DRILL — NOTHING HERE TOUCHES YOUR RECORD.
        </div>
      </div>
      <button
        onClick={onStart}
        className="mt-6 w-full rounded-md bg-primary py-3 font-mono text-sm tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]"
      >
        START THE DRILL
      </button>
    </main>
  );
}

/* ────────────────────────── COLD READ · DEBRIEF ────────────────────────── */

function ColdDebrief({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate();
  const sim = useMemo(() => loadSim(), []);
  const verdictRaw = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(VERDICT_KEY);
      return raw ? (JSON.parse(raw) as { verdict: "REAL" | "FAKE" }) : null;
    } catch {
      return null;
    }
  }, []);
  const startTs = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(COLD_START_KEY);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const truthLabel: "REAL" | "FAKE" = scenario.truth === "REAL" ? "REAL" : "FAKE";
  const cleared = verdictRaw?.verdict === truthLabel;
  const elapsedRaw = startTs ? Math.round((Date.now() - startTs) / 1000) : DRILL_SECONDS;
  const elapsedSeconds = Math.min(elapsedRaw, DRILL_SECONDS);
  const expired = elapsedSeconds >= DRILL_SECONDS;

  // Warm baseline: latest CORRECT entry for this case.
  const warm = useMemo(() => {
    const p = loadProfile();
    const warmEntries = p.history
      .filter((h) => h.caseId === scenario.id && h.result === "correct")
      .sort((a, b) => a.ts - b.ts);
    return warmEntries[warmEntries.length - 1] ?? null;
  }, [scenario.id]);

  // Log ONCE. Never touches profile/points/xp/history/pilot (drill law).
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current || !verdictRaw) return;
    savedRef.current = true;
    saveColdRead({
      caseId: scenario.id,
      ts: Date.now(),
      cleared,
      seconds: elapsedSeconds,
    });
    try { sessionStorage.removeItem(COLD_START_KEY); } catch { /* noop */ }
  }, [cleared, elapsedSeconds, scenario.id, verdictRaw]);

  if (!verdictRaw || !sim) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-muted-foreground">
        No drill on record.{" "}
        <Link to="/mirror" className="text-primary underline">Back to case files</Link>
      </main>
    );
  }

  const warmDate = warm
    ? new Date(warm.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  let outcomeLine: string;
  if (cleared && elapsedSeconds < 120) {
    outcomeLine = "Faster and blinder than the first time. That's the habit forming.";
  } else if (cleared) {
    outcomeLine = "Slower without the file — as it should be. But you got there on instinct and craft.";
  } else if (expired) {
    outcomeLine = "The clock did what the scammer couldn't. Time pressure is a tactic too — it just wore a stopwatch this time.";
  } else {
    outcomeLine = "Warm you beat it; cold it beat you. The file was doing more work than you thought. That's worth knowing.";
  }

  const pinIdxs: number[] = (sim.state as EngineState & { pins?: number[] })?.pins ?? [];
  const pinMsgs = pinIdxs.map((i) => sim.messages[i]).filter((m): m is Message => !!m);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div
        className={`rounded-xl border-2 p-6 ${cleared ? "border-primary/40 bg-primary/5 text-primary" : "border-destructive/40 bg-destructive/5 text-destructive"}`}
      >
        <div className="font-mono text-xs tracking-[0.3em] opacity-80">
          COLD READ · {cleared ? "CLEARED" : "MISSED"}
        </div>
        <h1
          data-phase-anchor="mirror"
          tabIndex={-1}
          className="mt-2 text-2xl font-semibold outline-none"
        >
          {cleared ? "You cleared it blind." : "The drill beat you."}
        </h1>
        <p className="mt-3 font-mono text-[11px] tracking-widest opacity-90">
          WARM RUN: {warm ? `${warm.result.replace("_", " ").toUpperCase()}, ${warmDate}` : "—"}
          {"  ·  "}
          COLD RUN: {cleared ? "CLEARED" : "MISSED"} in{" "}
          {expired ? "time expired" : formatDrillTime(elapsedSeconds)}
        </p>
        <p className="mt-4 text-sm leading-relaxed opacity-95">{outcomeLine}</p>
      </div>

      {pinMsgs.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
            YOUR PINS · GRADED
          </div>
          <ul className="space-y-2">
            {pinIdxs.map((idx, i) => {
              const m = sim.messages[idx];
              if (!m || m.role !== "contact") return null;
              const wasTell = m.isTell === true;
              const statusTone = wasTell
                ? "border-caution text-caution bg-caution/10"
                : "border-border text-muted-foreground bg-muted/20";
              return (
                <li key={i} className="rounded-md border border-border bg-background/30 p-3">
                  <span
                    className={`inline-block rounded-sm border px-1 py-0.5 font-mono text-[9px] tracking-widest ${statusTone}`}
                  >
                    {wasTell ? "TELL" : "CLEAN"}
                  </span>
                  <div className="mt-1.5 text-sm italic">
                    "{(m.text || "[voice note]").slice(0, 160)}"
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            // Re-arm and re-enter — same case, fresh drill.
            try {
              sessionStorage.setItem("milverse.coldread.arm", scenario.id);
            } catch { /* noop */ }
            // Force a full remount by navigating to /mirror first, then back.
            navigate({ to: "/mirror" });
            setTimeout(() => {
              navigate({ to: "/mirror/$caseId", params: { caseId: scenario.id } });
            }, 0);
          }}
          className="flex-1 rounded-md border border-caution/50 bg-caution/10 py-3 font-mono text-xs tracking-widest text-caution hover:bg-caution/20"
        >
          AGAIN →
        </button>
        <Link
          to="/mirror"
          className="flex-1 rounded-md border border-border py-3 text-center font-mono text-xs tracking-widest hover:bg-accent"
        >
          BACK TO THE SHELF →
        </Link>
      </div>
    </main>
  );
}

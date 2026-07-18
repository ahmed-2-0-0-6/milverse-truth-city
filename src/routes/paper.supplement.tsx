// MILVERSE — /paper/supplement — THE CITIZEN SUPPLEMENT.
import "@/styles/paper-fonts.css";
// A personal, weekly one-page edition composed at read time from local data.
// Wholly separate from the human-published Daily Mirage editions.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { loadProfile, type TrustProfile } from "@/lib/mirror/profile";
import { loadUnlocked } from "@/lib/manual/state";
import { computeXp, rankFromXp } from "@/lib/ranks";
import { feedTacticMap } from "@/lib/handler/feedTactics";
import {
  buildSupplement,
  markSupplementSeen,
  supplementWeek,
  type Supplement,
} from "@/lib/paper/supplement";
import { useHandlerLine } from "@/lib/handler/useHandlerLine";

export const Route = createFileRoute("/paper/supplement")({
  head: () => ({
    meta: [
      { title: "Citizen Supplement — THE DAILY MIRAGE" },
      {
        name: "description",
        content:
          "A private, once-a-week one-page edition of the city's paper — printed for one citizen.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupplementPage,
});

function SupplementPage() {
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [manualUnlocks, setManualUnlocks] = useState(0);

  useEffect(() => {
    setProfile(loadProfile());
    setManualUnlocks(loadUnlocked().size);
    const on = () => {
      setProfile(loadProfile());
      setManualUnlocks(loadUnlocked().size);
    };
    window.addEventListener("milverse:profile", on);
    window.addEventListener("milverse:manual", on);
    return () => {
      window.removeEventListener("milverse:profile", on);
      window.removeEventListener("milverse:manual", on);
    };
  }, []);

  const week = useMemo(() => supplementWeek(new Date()), []);
  const xp = useMemo(
    () => computeXp(profile, manualUnlocks, profile?.publishedCount ?? 0),
    [profile, manualUnlocks],
  );
  const rankTitle = useMemo(() => rankFromXp(xp).current.name, [xp]);

  const map = feedTacticMap();
  const supplement: Supplement | null = useMemo(
    () => (profile ? buildSupplement(profile, map, rankTitle, new Date()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, rankTitle, week.weekKey],
  );

  // Mark seen once we've mounted with a supplement (thin or full).
  useEffect(() => {
    if (!supplement) return;
    markSupplementSeen(week.weekKey);
    // Notify any banner dot listeners.
    window.dispatchEvent(new Event("milverse:supplement-seen"));
  }, [supplement, week.weekKey]);

  if (!profile || !supplement) {
    return (
      <div className="paper min-h-screen">
        <div className="no-print bg-background/90 backdrop-blur border-b border-border">
          <TopBar />
        </div>
        <main className="mx-auto max-w-3xl px-4 py-24 text-center paper-mono text-xs">
          Setting type…
        </main>
      </div>
    );
  }

  return (
    <div className="paper min-h-screen">
      <div className="no-print bg-background/90 backdrop-blur border-b border-border">
        <TopBar />
      </div>

      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-8 sm:py-12">
        {/* Back to the paper */}
        <div className="no-print mb-6 flex items-center justify-between">
          <Link
            to="/paper"
            className="paper-mono text-xs inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> THE PAPER
          </Link>
          <div className="paper-mono text-[10px] tracking-[0.25em] text-[color:var(--paper-muted)]">
            PERSONAL EDITION · READ IN THE ROOM
          </div>
        </div>

        {/* Masthead */}
        <header
          className="text-center border-y-4 double border-current"
          style={{ borderColor: "var(--paper-ink)" }}
        >
          <div className="paper-mono text-[10px] tracking-[0.3em] pt-3">
            {supplement.masthead.title}
          </div>
          <h1 className="paper-blackletter text-4xl sm:text-6xl leading-none py-2 sm:py-3">
            Citizen Supplement
          </h1>
          <div className="paper-mono text-[10px] tracking-[0.25em] pb-3 text-[color:var(--paper-muted)]">
            {supplement.masthead.line}
          </div>
        </header>

        {/* Dateline */}
        <div className="paper-mono text-[10px] tracking-[0.25em] text-center mt-4 text-[color:var(--paper-muted)]">
          SUNDAY EDITION · {week.sundayLabel.toUpperCase()} · CIRCULATION: 1
        </div>

        {supplement.thin ? (
          <ThinEdition message={supplement.message} />
        ) : (
          <FullEdition supplement={supplement} />
        )}

        <footer
          className="mt-16 pt-6 border-t border-current/40 paper-mono text-[10px] tracking-[0.2em] text-center text-[color:var(--paper-muted)]"
          style={{ borderColor: "var(--paper-rule)" }}
        >
          NEXT PRINTING: SUNDAY.
        </footer>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// THIN EDITION
// ────────────────────────────────────────────────────────────────

function ThinEdition({ message }: { message: string }) {
  return (
    <section className="mt-8">
      <div className="paper-ornament mb-6">STOP-PRESSES NOTICE</div>
      <p className="paper-body no-dropcap text-center max-w-xl mx-auto">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4 paper-mono text-[11px] tracking-[0.2em]">
        <Link to="/mirror" className="underline decoration-dotted">
          THE MIRROR →
        </Link>
        <Link to="/drop" className="underline decoration-dotted">
          THE DAILY DROP →
        </Link>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────
// FULL EDITION
// ────────────────────────────────────────────────────────────────

function FullEdition({
  supplement,
}: {
  supplement: Extract<Supplement, { thin: false }>;
}) {
  return (
    <>
      {/* Headline */}
      <section className="mt-8 text-center">
        <h2
          className="paper-serif text-3xl sm:text-5xl leading-tight"
          style={{ fontWeight: 900 }}
        >
          {supplement.headline}
        </h2>
        <p className="paper-body no-dropcap italic mt-3 max-w-2xl mx-auto text-[color:var(--paper-muted)]">
          {supplement.deck}
        </p>
      </section>

      <div className="paper-ornament my-8">THE COLUMNS</div>

      {/* Columns — three side-by-side on desktop, stacked on mobile */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 sm:[&>*+*]:border-l sm:[&>*+*]:pl-6 sm:[&>*+*]:border-[color:var(--paper-rule)]">
        <ColumnBlock col={supplement.columns.record} mono />
        <ColumnBlock col={supplement.columns.sharpest} />
        <ColumnBlock col={supplement.columns.blindSpot} />
      </section>

      {/* Pull stat */}
      <section
        className="mt-10 sm:mt-14 py-8 sm:py-10 border-y-4 double border-current text-center"
        style={{ borderColor: "var(--paper-ink)" }}
      >
        <div
          className="paper-serif tabular-nums"
          style={{ fontWeight: 900, fontSize: "clamp(4.5rem, 18vw, 9rem)", lineHeight: 0.9 }}
          aria-label={`${supplement.pullStat.value} ${supplement.pullStat.label.toLowerCase()}`}
        >
          {supplement.pullStat.value}
        </div>
        <div className="paper-mono text-xs tracking-[0.35em] mt-3 text-[color:var(--paper-muted)]">
          {supplement.pullStat.label}
        </div>
      </section>

      {/* Columnist Corner */}
      {supplement.columnist && <ColumnistCorner columnist={supplement.columnist} />}
    </>
  );
}

function ColumnBlock({ col, mono }: { col: Extract<Supplement, { thin: false }>["columns"]["record"]; mono?: boolean }) {
  return (
    <article>
      <h3
        className="stencil text-[10px] tracking-[0.35em] pb-2 mb-3 border-b"
        style={{ borderColor: "var(--paper-rule)" }}
      >
        {col.head}
      </h3>
      <div
        className={mono ? "paper-mono text-[12px] whitespace-pre leading-6" : "paper-body no-dropcap text-sm"}
      >
        {col.body}
      </div>
      {col.link && (
        <Link
          to={col.link.to as "/manual/$entryId"}
          params={col.link.params as { entryId: string }}
          className="paper-mono text-[10px] tracking-[0.25em] mt-3 inline-block underline decoration-dotted"
        >
          {col.link.label}
        </Link>
      )}
    </article>
  );
}

function ColumnistCorner({
  columnist,
}: {
  columnist: NonNullable<Extract<Supplement, { thin: false }>["columnist"]>;
}) {
  const [profileKey, setProfileKey] = useState<string | undefined>(undefined);
  useEffect(() => {
    setProfileKey(loadProfile().playerId);
  }, []);

  const line = useHandlerLine({
    surface: "psych-eval",
    fallback: columnist.fallback,
    enabled: true,
    cacheKey: profileKey,
    summary: {
      ...columnist.summary,
    },
  });

  return (
    <section className="mt-12">
      <div className="paper-ornament mb-6">COLUMNIST CORNER</div>
      <blockquote
        className="paper-body no-dropcap italic text-base sm:text-lg max-w-2xl mx-auto text-center border-l-2 border-r-2 px-6 py-4"
        style={{ borderColor: "var(--paper-rule)" }}
      >
        “{line.text}”
      </blockquote>
      <div className="paper-mono text-[10px] tracking-[0.3em] mt-3 text-center text-[color:var(--paper-muted)]">
        — THE HANDLER, CITY DESK
      </div>
    </section>
  );
}

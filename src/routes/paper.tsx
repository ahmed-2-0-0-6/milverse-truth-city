// MILVERSE — /paper — THE DAILY MIRAGE.
// Human-published newspaper. The site always shows the latest published edition.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/TopBar";
import { PaperFrontPage } from "@/components/paper/PaperFrontPage";
import { PaperForgeryColumn } from "@/components/paper/PaperForgeryColumn";
import { PaperSocialPage } from "@/components/paper/PaperSocialPage";
import { PaperClassifieds } from "@/components/paper/PaperClassifieds";
import { PaperPuzzle } from "@/components/paper/PaperPuzzle";
import { PaperLedger } from "@/components/paper/PaperLedger";
import { PaperEditorial } from "@/components/paper/PaperEditorial";
import { PaperRealWorld } from "@/components/paper/PaperRealWorld";
import { getLatestEdition, listArchive, getEdition } from "@/lib/paper.functions";
import type { Edition, EditionContent } from "@/lib/paper/types";
import { dropDateKey } from "@/lib/daily/rotation";
import { readEditionRecord } from "@/lib/paper/profile";
import { Newspaper, Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/paper")({
  head: () => ({
    meta: [
      { title: "THE DAILY MIRAGE — MILVERSE" },
      {
        name: "description",
        content: "The city's only honest newspaper. Every story in it is false.",
      },
      { property: "og:title", content: "THE DAILY MIRAGE" },
      {
        property: "og:description",
        content:
          "Every story in it is false. Your job is to catch them. One edition a day, hand-published.",
      },
    ],
  }),
  component: PaperPage,
});

function PaperPage() {
  const nav = useNavigate();
  const [edition, setEdition] = useState<Edition | null>(null);
  const [viewing, setViewing] = useState<Edition | null>(null); // an older edition off the shelf
  const [pulling, setPulling] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const fetchEdition = useServerFn(getLatestEdition);
  const fetchByNumber = useServerFn(getEdition);

  useEffect(() => {
    let alive = true;
    fetchEdition()
      .then((row) => {
        if (alive) {
          setEdition(row as unknown as Edition | null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setErr((e as Error).message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [fetchEdition]);

  if (loading) {
    return (
      <div className="min-h-screen paper">
        <div className="mx-auto max-w-5xl px-4 py-24 text-center paper-mono text-xs">
          Setting type…
        </div>
      </div>
    );
  }

  if (err || !edition) {
    return (
      <div className="min-h-screen paper">
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <div className="paper-blackletter text-4xl">The Daily Mirage</div>
          <p className="mt-6 paper-body no-dropcap max-w-md mx-auto">
            Presses are cold. Nothing's gone to the compositor.
            {err && <span className="block mt-3 text-xs opacity-60">{err}</span>}
          </p>
          <button
            onClick={() => nav({ to: "/" })}
            className="mt-6 paper-mono text-xs underline decoration-dotted"
          >
            ← back to the city
          </button>
        </div>
      </div>
    );
  }

  const today = dropDateKey();
  const shown = viewing ?? edition; // older edition off the shelf, or today's
  const isToday = shown.edition_date === today && !viewing;
  const dateLabel = new Date(shown.edition_date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="paper min-h-screen">
      {/* nav strip — dark, sits above paper */}
      <div className="no-print bg-background/90 backdrop-blur border-b border-border">
        <TopBar />
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-12 paper-unfold">
        {/* Back link (dark on paper) */}
        <div className="no-print mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="paper-mono text-xs inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> CITY
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="paper-mono text-xs inline-flex items-center gap-1 border border-current/50 px-2 py-1 rounded-sm hover:bg-black/5"
              style={{ borderColor: "var(--paper-rule)" }}
            >
              <Printer className="h-3 w-3" />{" "}
              {viewing ? "PRINT THIS EDITION" : "PRINT TODAY'S EDITION"}
            </button>
            {viewing ? (
              <button
                onClick={() => setViewing(null)}
                className="paper-mono text-xs underline decoration-dotted"
              >
                BACK TO TODAY
              </button>
            ) : (
              <button
                onClick={() => setShowArchive((v) => !v)}
                className="paper-mono text-xs underline decoration-dotted"
              >
                {showArchive ? "TODAY" : "YESTERDAY'S PAPERS"}
              </button>
            )}
          </div>
        </div>

        {/* Masthead */}
        <header
          className="text-center border-y-4 double border-current"
          style={{ borderColor: "var(--paper-ink)" }}
        >
          <div className="paper-mono text-[10px] tracking-[0.3em] pt-3">
            {viewing
              ? `FROM THE SHELF — ${dateLabel.toUpperCase()} · NO STREAK CREDIT`
              : isToday
                ? "TODAY'S EDITION"
                : `LATEST EDITION — ${dateLabel.toUpperCase()}. THE PRESSES ARE WARMING FOR THE NEXT RUN.`}
          </div>
          <h1 className="paper-blackletter text-5xl sm:text-7xl md:text-8xl leading-none py-2 sm:py-3">
            The Daily Mirage
          </h1>
          <div className="paper-mono text-[10px] tracking-[0.25em] flex flex-wrap justify-center items-center gap-x-6 gap-y-1 pb-3 text-[color:var(--paper-muted)]">
            <span>VOL I · No. {String(shown.edition_number).padStart(3, "0")}</span>
            <span>{dateLabel.toUpperCase()}</span>
            <span>PRICE: YOUR ATTENTION</span>
          </div>
          <div className="italic text-sm sm:text-base paper-serif pb-3 -mt-1 text-[color:var(--paper-muted)]">
            “{shown.motto}”
          </div>
        </header>

        {showArchive ? (
          <YesterdaysPapers
            currentNumber={edition.edition_number}
            pulling={pulling}
            onOpen={(n) => {
              setPulling(true);
              fetchByNumber({ data: { number: n } })
                .then((row) => {
                  const e = row as unknown as Edition | null;
                  if (e) {
                    setViewing(e);
                    setShowArchive(false);
                    window.scrollTo({ top: 0 });
                  }
                })
                .finally(() => setPulling(false));
            }}
          />
        ) : (
          <EditionBody key={shown.edition_number} edition={shown} />
        )}

        <footer
          className="no-print mt-16 pt-6 border-t border-current/40 paper-mono text-[10px] tracking-[0.2em] text-center text-[color:var(--paper-muted)]"
          style={{ borderColor: "var(--paper-rule)" }}
        >
          THE DAILY MIRAGE · A FICTIONAL NEWSPAPER FOR MEDIA LITERACY REHEARSAL ·
          <Link to="/manual" className="ml-2 underline">
            FIELD MANUAL
          </Link>
        </footer>
      </main>
    </div>
  );
}

function EditionBody({ edition }: { edition: Edition }) {
  const c: EditionContent = edition.content;
  const [record, setRecord] = useState<ReturnType<typeof readEditionRecord> | null>(null);
  const refresh = () => setRecord(readEditionRecord(edition.edition_number));

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("milverse:profile", on);
    return () => window.removeEventListener("milverse:profile", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edition.edition_number]);

  return (
    <>
      {/* A — FRONT PAGE */}
      <PaperFrontPage
        lead={c.lead}
        editionNumber={edition.edition_number}
        editionDate={edition.edition_date}
        onDone={refresh}
      />

      <Divider label="THE FORGERY COLUMN" />

      {/* B — FORGERY COLUMN */}
      <PaperForgeryColumn
        forgery={c.forgery}
        editionNumber={edition.edition_number}
        onDone={refresh}
      />

      <Divider label="THE SOCIAL PAGE" />

      {/* C — SOCIAL PAGE */}
      <PaperSocialPage social={c.social} editionNumber={edition.edition_number} onDone={refresh} />

      <Divider label="CLASSIFIEDS" />

      {/* D — CLASSIFIEDS */}
      <PaperClassifieds
        items={c.classifieds}
        editionNumber={edition.edition_number}
        onDone={refresh}
      />

      <Divider label="THE PUZZLE CORNER" />

      {/* E — PUZZLE */}
      <PaperPuzzle puzzle={c.puzzle} editionNumber={edition.edition_number} onDone={refresh} />

      <Divider label="THE LEDGER" />

      {/* F — LEDGER */}
      <PaperLedger editionNumber={edition.edition_number} note={c.ledger.note} />

      <Divider label="EDITORIAL" />

      {/* G — HANDLER EDITORIAL */}
      <PaperEditorial editorial={c.editorial} editionNumber={edition.edition_number} />

      <Divider label="THIS WEEK IN THE REAL WORLD" />

      {/* H — REAL WORLD */}
      <PaperRealWorld realWorld={c.realWorld} />

      {/* Cover-to-cover stamp */}
      {record?.coverToCoverAt && (
        <div className="no-print mt-8 flex justify-end">
          <div
            className="paper-stamp paper-stamp-fail inline-block border-4 px-4 py-2 paper-mono text-xs tracking-[0.3em]"
            style={{ transform: "rotate(-8deg)" }}
          >
            READ COVER TO COVER · +15 TRUST
          </div>
        </div>
      )}
    </>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="paper-ornament my-8" aria-label={label}>
      {label}
    </div>
  );
}

function YesterdaysPapers({
  currentNumber,
  pulling,
  onOpen,
}: {
  currentNumber: number;
  pulling: boolean;
  onOpen: (n: number) => void;
}) {
  const fetchArchive = useServerFn(listArchive);
  const [rows, setRows] = useState<
    Array<{ edition_number: number; edition_date: string; content: EditionContent }>
  >([]);
  useEffect(() => {
    fetchArchive()
      .then((r) =>
        setRows(
          (r as { rows: typeof rows }).rows.filter((x) => x.edition_number !== currentNumber),
        ),
      )
      .catch(() => setRows([]));
  }, [fetchArchive, currentNumber]);

  return (
    <section className="mt-8">
      <div className="paper-ornament mb-6">YESTERDAY'S PAPERS · THE SHELF</div>
      {rows.length === 0 ? (
        <p className="paper-body no-dropcap text-center">
          The shelf is empty. Today is the first edition.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-6">
          {rows.map((r) => (
            <li
              key={r.edition_number}
              className="border border-current/40 p-4 rounded-sm"
              style={{ borderColor: "var(--paper-rule)" }}
            >
              <div className="paper-mono text-[10px] tracking-[0.3em] text-[color:var(--paper-muted)]">
                No. {String(r.edition_number).padStart(3, "0")} ·{" "}
                {new Date(r.edition_date + "T00:00:00Z").toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <h3 className="paper-serif text-xl mt-1" style={{ fontWeight: 900 }}>
                {r.content?.lead?.headline ?? "Untitled"}
              </h3>
              <p className="paper-body no-dropcap text-sm mt-1 line-clamp-2">
                {r.content?.lead?.subhead ?? ""}
              </p>
              <button
                onClick={() => onOpen(r.edition_number)}
                disabled={pulling}
                className="paper-mono text-[10px] tracking-[0.2em] mt-3 underline decoration-dotted disabled:opacity-50"
              >
                {pulling ? "PULLING FROM THE SHELF…" : "PULL FROM THE SHELF"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

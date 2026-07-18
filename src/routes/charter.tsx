import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { EngravedReveal } from "@/components/civic/EngravedReveal";
import { Marginalia } from "@/components/civic/Marginalia";
import { RedactedLine } from "@/components/civic/RedactedLine";
import { Countersign } from "@/components/civic/Countersign";
import type { ReactNode } from "react";

export const Route = createFileRoute("/charter")({
  head: () => ({
    meta: [
      { title: "The City Charter — MILVERSE" },
      {
        name: "description",
        content:
          "MILVERSE's five founding articles. Verification not censorship. Every citizen. Dignity. Every voice. Peace.",
      },
      { property: "og:title", content: "The City Charter — MILVERSE" },
      {
        property: "og:description",
        content:
          "Five articles the city was built on. Verification, not censorship. Every citizen. Dignity. Every voice. Peace.",
      },
      { property: "og:url", content: "https://milverse-truth-city.lovable.app/charter" },
      { property: "og:type", content: "article" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d5a6420-ffd9-4775-8625-21924b3f113e/id-preview-9a528e14--b1bda37d-f290-471e-8242-1f3cfcf0f7d7.lovable.app-1784092810821.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The City Charter — MILVERSE" },
      {
        name: "twitter:description",
        content: "Five founding articles of a city built for media & information literacy.",
      },
    ],
    links: [{ rel: "canonical", href: "https://milverse-truth-city.lovable.app/charter" }],
  }),
  component: CharterPage,
});

interface Article {
  roman: string;
  title: string;
  line: string;
  sub?: string;
  side: "left" | "right";
  note: ReactNode;
}

const ARTICLES: Article[] = [
  {
    roman: "I",
    title: "VERIFICATION, NOT CENSORSHIP",
    line: "The city never tells you what to think. It trains you to check.",
    side: "right",
    note: "Censors tell you the answer. We teach you the question.",
  },
  {
    roman: "II",
    title: "EVERY CITIZEN",
    line: "Any phone. Any budget. Any ability. Truth is not a premium feature.",
    sub: "LITE mode · transcripts · keyboard play · screen readers · printable Field Kit · First Phone",
    side: "left",
    note: "LITE mode isn't the small version. It's the same city with the lights on.",
  },
  {
    roman: "III",
    title: "DIGNITY",
    line: "We hunt tactics, not people. Getting fooled is the human condition; staying fooled is optional.",
    side: "right",
    note: (
      <>
        You'll get <RedactedLine>fooled</RedactedLine> in here. That's the point of a gym.
      </>
    ),
  },
  {
    roman: "IV",
    title: "EVERY VOICE",
    line: "A city that only hears one voice is easy to fool.",
    side: "left",
    note: "One-source cities fall for one-source lies.",
  },
  {
    roman: "V",
    title: "PEACE",
    line: "Misinformation turns neighbors into enemies. An informed city is a peaceful one.",
    side: "right",
    note: "Half the fights you've seen started with a forward.",
  },
];

function CharterPage() {
  return (
    <div className="min-h-screen grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← CITY
        </Link>

        <div className="mt-6 font-mono text-[11px] tracking-widest text-primary">
          DEPARTMENT OF DIGITAL TRUST · FOUNDING DOCUMENT
        </div>
        <h1
          className="mt-2 text-5xl sm:text-6xl font-semibold tracking-tight"
          style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.02em" }}
        >
          THE CITY CHARTER
        </h1>
        <p className="mt-2 text-sm text-muted-foreground italic">
          Engraved on the plaque outside City Hall.
        </p>

        <section className="mt-10 rounded-3xl border-4 border-primary/40 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 sm:p-12 shadow-inner relative overflow-hidden">
          <div className="dossier-texture absolute inset-0 pointer-events-none" aria-hidden />
          <ol className="relative space-y-8">
            {ARTICLES.map((a) => (
              <EngravedReveal
                key={a.roman}
                as="li"
                className="grid grid-cols-[auto_1fr] gap-5 sm:gap-8 items-start border-l-2 border-primary/40 pl-5"
              >
                <div
                  className="text-4xl sm:text-5xl font-semibold text-primary/80"
                  style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
                >
                  {a.roman}.
                </div>
                <Marginalia note={a.note as string} side={a.side}>
                  <div
                    className="text-xl sm:text-2xl font-semibold tracking-wide text-foreground"
                    style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {a.title}
                  </div>
                  <p className="mt-2 text-base sm:text-lg text-foreground/90 leading-snug italic">
                    "{a.line}"
                  </p>
                  {a.sub && (
                    <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                      {a.sub}
                    </p>
                  )}
                </Marginalia>
              </EngravedReveal>
            ))}
          </ol>

          <div className="relative mt-10 border-t border-primary/30 pt-5 text-center">
            <div className="font-mono text-[10px] tracking-widest text-primary">
              CITY SEAL · MILVERSE
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Signed and struck in the Department of Digital Trust.
            </div>
          </div>

          <div className="relative">
            <Countersign />
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground text-center max-w-xl mx-auto">
          MILVERSE aligns with UNESCO's vision of media and information literacy — and stands as a
          city in the MILtiverse.
        </p>


        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/educators" className="rounded-md border border-border px-4 py-2 text-sm">
            For educators
          </Link>
          <Link to="/first-phone" className="rounded-md border border-border px-4 py-2 text-sm">
            First Phone Program
          </Link>
          <Link to="/manual" className="rounded-md border border-border px-4 py-2 text-sm">
            Field Manual
          </Link>
        </div>
      </main>
    </div>
  );
}

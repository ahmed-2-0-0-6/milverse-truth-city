import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { ExternalLink, Image as ImageIcon, Globe2, Layers, Newspaper } from "lucide-react";

export const Route = createFileRoute("/manual/take-it-outside")({
  head: () => ({
    meta: [
      { title: "Take It Outside — Real Verification Tools" },
      { name: "description", content: "The tools live in your pocket. MILVERSE trains your hand." },
    ],
  }),
  component: TakeItOutside,
});

const TOOLS = [
  {
    Icon: ImageIcon,
    title: "REVERSE IMAGE SEARCH",
    hint: "Best when the claim rides on a photo, video frame, or infographic.",
    how: [
      "On phone: open Google, tap the camera icon in the search bar (Google Lens). Point at the image or upload it.",
      "On desktop: images.google.com → paste image URL or drag the file into the search bar.",
      "Also useful: TinEye (tineye.com) shows earliest online appearance of an image.",
    ],
    links: [
      { label: "Google Lens", url: "https://lens.google.com" },
      { label: "TinEye", url: "https://tineye.com" },
    ],
  },
  {
    Icon: Globe2,
    title: "CHECK THE SOURCE (LATERAL READING)",
    hint: "Best when the claim wears a newsroom, brand, government body, or a person's handle.",
    how: [
      "Don't judge a site by its design. Open a new tab and search the outlet's name plus 'Wikipedia' or 'about'.",
      "For a claimed public account: search the person on the platform's real verified handle — not the one in the link you got.",
      "For a government claim: go to the .gov domain directly by typing it, not clicking through.",
    ],
    links: [{ label: "Wikipedia (search any outlet)", url: "https://en.wikipedia.org" }],
  },
  {
    Icon: Layers,
    title: "CROSS-CHECK OUTLETS",
    hint: "Best when you need a second independent witness of any factual claim.",
    how: [
      "Search the claim in your own words on Google News or DuckDuckGo News. Look for at least two independent outlets, in different languages if possible.",
      "For fact-check specifically: AFP Fact Check, Reuters Fact Check, Snopes. For Pakistan: Soch Fact Check.",
      "A story only one source has is not confirmed — it is claimed.",
    ],
    links: [
      { label: "AFP Fact Check", url: "https://factcheck.afp.com/" },
      { label: "Snopes", url: "https://www.snopes.com/" },
      { label: "Soch Fact Check (Pakistan)", url: "https://sochfactcheck.com/" },
      { label: "Reuters Fact Check", url: "https://www.reuters.com/fact-check/" },
    ],
  },
  {
    Icon: Newspaper,
    title: "CHECK DATE / METADATA",
    hint: "Best when the claim depends on 'yesterday', 'now', or 'breaking'.",
    how: [
      "For a shared article: look for the actual publish date, not 'X hours ago'. Real articles show a timezone.",
      "For an image: search on Google Images and sort by date to find the earliest appearance.",
      "For a suspicious URL: paste it into web.archive.org to see when it first existed.",
    ],
    links: [{ label: "Wayback Machine", url: "https://web.archive.org" }],
  },
];

function TakeItOutside() {
  return (
    <div className="min-h-dvh grain">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/manual"
          className="font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← FIELD MANUAL
        </Link>
        <div className="mt-4">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">TAKE IT OUTSIDE</div>
          <h1
            className="mt-2 text-4xl sm:text-5xl font-black tracking-tight"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            THE TOOLS LIVE IN YOUR POCKET.{" "}
            <span className="text-primary">MILVERSE TRAINS YOUR HAND.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            These are the real verification tools the Toolbelt inside cases is teaching you to use.
            Learn one this week.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {TOOLS.map((t) => (
            <section key={t.title} className="rounded-xl border border-border bg-card p-5">
              <header className="flex items-center gap-3 mb-2">
                <t.Icon className="h-5 w-5 text-primary" />
                <h2 className="stencil text-sm tracking-widest">{t.title}</h2>
              </header>
              <p className="text-sm text-muted-foreground mb-3">{t.hint}</p>
              <ol className="space-y-1.5 text-sm">
                {t.how.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-[10px] text-primary mt-0.5">{i + 1}</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 stencil text-[10px] tracking-widest text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" /> {l.label}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
          <b>Not a truth-checker.</b> MILVERSE will never let you paste in a message and be told
          whether it's true. That's the wrong instinct to build. Instead, the site trains YOU to
          reach for these tools — every case, every time.
        </div>
      </main>
    </div>
  );
}

// LAYER-1 — Redacted title. Visual redaction whose bar widths track the real
// title letter counts, so a locked file feels like an actual blacked-out
// dossier line (not a fixed stub of ▓ blocks).
//
// Presentation only. Never renders the source text.

interface Props {
  /** The real string being redacted. Only its shape (word lengths) is exposed. */
  text: string;
  /** Line height in em — matches the surrounding heading. Default 1em. */
  height?: string;
  /** Bar tone. */
  tone?: "default" | "danger";
}

export function RedactedTitle({ text, height = "0.8em", tone = "default" }: Props) {
  const words = text
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map((w) => Math.max(2, Math.min(w.length, 12)));

  const bar =
    tone === "danger"
      ? "bg-red-500/70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.5)]"
      : "bg-foreground/85 shadow-[inset_0_0_0_1px_hsl(var(--background)/0.6)]";

  return (
    <span
      className="inline-flex flex-wrap items-center gap-[0.35em] align-middle"
      aria-label="Redacted"
      role="img"
    >
      {words.map((n, i) => (
        <span
          key={i}
          className={`inline-block rounded-[2px] ${bar}`}
          style={{ width: `${n * 0.5}em`, height }}
        />
      ))}
    </span>
  );
}

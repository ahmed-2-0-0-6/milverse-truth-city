// LAYER-1 — CaseCard. One card anatomy for The Mirror + The Feed case lists.
// Boss Protocol deliberately opts out — it has its own red-noir language.
//
// Anatomy (top → bottom):
//   1. Header row  · left: icon chip · right: meta stack (badges/tier dots)
//   2. Title       · single-source hierarchy: 18px semibold
//   3. Teaser      · muted, 2-line clamp
//   4. Tag row     · pill badges (solved, survivor, format, byline)
//   5. Footer      · "OPEN CASE →" — visible on hover for unlocked, hidden for locked
//
// Rules: no shadows beyond the shared hover glow. No per-card border colour drift
// except the citizen accent (primary/30 → primary/60). Same rounded-xl, same p-6,
// same hover -translate-y-0.5. Locked cards mute to opacity-60.

import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

type Tone = "default" | "citizen";

interface CardShellProps {
  icon: ReactNode;
  metaTopRight?: ReactNode;
  title: string;
  teaser: string;
  badges?: ReactNode;
  footer?: ReactNode;
  tone?: Tone;
  locked?: boolean;
}

function CardShell({
  icon,
  metaTopRight,
  title,
  teaser,
  badges,
  footer,
  tone = "default",
  locked = false,
}: CardShellProps) {
  const base = "group relative overflow-hidden rounded-xl border p-6 transition-all";
  const skin = locked
    ? "border-border/60 bg-card/40 opacity-60"
    : tone === "citizen"
      ? "border-primary/30 bg-card hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-[0_0_32px_oklch(0.82_0.15_210/0.15)]"
      : "border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_32px_oklch(0.82_0.15_210/0.15)]";

  return (
    <div className={`${base} ${skin}`}>
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
        {metaTopRight && (
          <div className="flex flex-col items-end gap-1 min-w-0">{metaTopRight}</div>
        )}
      </div>
      <h3 className="mt-5 text-lg font-semibold leading-snug">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{teaser}</p>
      {badges && <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>}
      {footer}
    </div>
  );
}

/** Small 5-slot tier meter — filled slots = tier. Used by Mirror cards. */
export function TierMeter({ tier, max = 5 }: { tier: number; max?: number }) {
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] tracking-widest">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`h-1.5 w-4 rounded-sm ${i < tier ? "bg-primary" : "bg-muted"}`} />
      ))}
    </div>
  );
}

interface CaseCardProps<TParams extends Record<string, string>> {
  to: string;
  params: TParams;
  icon: ReactNode;
  metaTopRight?: ReactNode;
  title: string;
  teaser: string;
  badges?: ReactNode;
  tone?: Tone;
  locked?: boolean;
  cta?: string;
}

export function CaseCard<TParams extends Record<string, string>>({
  to,
  params,
  icon,
  metaTopRight,
  title,
  teaser,
  badges,
  tone,
  locked,
  cta = "OPEN CASE →",
}: CaseCardProps<TParams>) {
  const footer = !locked ? (
    <div className="mt-5 font-mono text-xs tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
      {cta}
    </div>
  ) : null;

  const shell = (
    <CardShell
      icon={icon}
      metaTopRight={metaTopRight}
      title={title}
      teaser={teaser}
      badges={badges}
      footer={footer}
      tone={tone}
      locked={locked}
    />
  );

  if (locked) return shell;
  // Typed at call site with TanStack Link's overloads.
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={to as any} params={params as any}>
      {shell}
    </Link>
  );
}

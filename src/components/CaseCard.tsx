// LAYER-1 — CaseCard. One card anatomy for The Mirror + The Feed case lists.
// Boss Protocol deliberately opts out — it has its own red-noir language.
//
// Design: each case is a physical dossier on the night desk — manila folder
// tab, punched file number, evidence-bag texture, rubber stamps. Locked cases
// are sealed with tape. All art is CSS/SVG — no images, prints clean.
//
// Anatomy (top → bottom):
//   1. Folder tab   · angled manila tab with icon + generated file no.
//   2. Title        · single-source hierarchy: 18px semibold
//   3. Teaser       · muted, 2-line clamp
//   4. Tag row      · pill badges (solved, survivor, format, byline)
//   5. Footer       · "OPEN CASE →" — visible on hover for unlocked
//
// Rules: no per-card border colour drift except the citizen accent. Same
// rounded geometry, same hover lift. Locked cards seal, not fade.

import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

type Tone = "default" | "citizen";

/** Deterministic in-world file number from the case title (stable per case). */
function fileNo(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${String(h % 90 + 10)}-${String(h % 900 + 100)}`;
}

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
  const no = fileNo(title);
  return (
    <div className={`dossier group relative ${locked ? "dossier-locked" : "dossier-live"}`}>
      {/* Folder tab row — sits above the folder body */}
      <div className="flex items-end">
        <div
          className={`dossier-tab relative z-[1] inline-flex items-center gap-2 rounded-t-md px-3 py-1.5 ${
            tone === "citizen" ? "dossier-tab-citizen" : ""
          }`}
        >
          <span className="dossier-tab-icon">{icon}</span>
          <span className="font-mono text-[9px] tracking-[0.25em]">
            {locked ? "SEALED" : `FILE ${no}`}
          </span>
        </div>
        {/* punched holes on the tab shoulder */}
        <div className="mb-1.5 ml-3 flex gap-1.5 opacity-40" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full border border-current" />
          <span className="h-1.5 w-1.5 rounded-full border border-current" />
        </div>
      </div>

      {/* Folder body */}
      <div
        className={`dossier-body relative overflow-hidden rounded-b-xl rounded-tr-xl border p-6 transition-all ${
          locked
            ? "border-border/60"
            : tone === "citizen"
              ? "border-primary/30 group-hover:border-primary/60"
              : "border-border group-hover:border-primary/50"
        }`}
      >
        {/* evidence texture + torch sweep on hover (CSS only) */}
        <div className="dossier-texture absolute inset-0 pointer-events-none" aria-hidden="true" />
        {!locked && (
          <div className="dossier-sweep absolute inset-0 pointer-events-none" aria-hidden="true" />
        )}

        <div className="relative">
          {metaTopRight && (
            <div className="flex flex-col items-end gap-1 min-w-0 float-right ml-3">
              {metaTopRight}
            </div>
          )}
          <h3 className="text-lg font-semibold leading-snug">{title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 clear-none">{teaser}</p>
          {badges && <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>}
          {footer}
        </div>

        {/* Sealed tape across locked folders */}
        {locked && (
          <div className="dossier-seal absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="dossier-seal-tape font-mono text-[10px] tracking-[0.4em]">
              SEALED · CLEAR THE TIER BELOW
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small 5-slot tier meter — filled slots = tier. Used by Mirror cards. */
export function TierMeter({ tier, max = 5 }: { tier: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-1 font-mono text-[10px] tracking-widest"
      aria-label={`Tier ${tier} of ${max}`}
    >
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
    <Link to={to as any} params={params as any} className="block">
      {shell}
    </Link>
  );
}

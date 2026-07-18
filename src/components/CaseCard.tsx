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

export type CaseCardOutcome = "closed" | "transacted" | "false_alarm";
export type ArtifactChipTone = "sms" | "dm" | "wa" | "video" | "image" | "news";
export interface ArtifactChip {
  label: string;
  tone: ArtifactChipTone;
}

/** Deterministic in-world file number from the case title (stable per case). */
function fileNo(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${String((h % 90) + 10)}-${String((h % 900) + 100)}`;
}

const OUTCOME_STAMP: Record<CaseCardOutcome, { label: string; cls: string; aria: string }> = {
  closed: {
    label: "CASE CLOSED",
    cls: "border-primary text-primary",
    aria: "case closed",
  },
  transacted: {
    label: "TRANSACTED",
    cls: "border-destructive text-destructive",
    aria: "transacted — missed scam",
  },
  false_alarm: {
    label: "FALSE ALARM",
    cls: "border-caution text-caution",
    aria: "false alarm",
  },
};

const CHIP_TONE: Record<ArtifactChipTone, string> = {
  sms: "border-[#0a84ff] text-[#4aa3ff]",
  dm: "chip-dm-insta",
  wa: "border-[#005c4b] text-[#25d366]",
  video: "border-muted-foreground/40 text-muted-foreground",
  image: "border-muted-foreground/40 text-muted-foreground",
  news: "border-muted-foreground/40 text-muted-foreground",
};

interface CardShellProps {
  icon: ReactNode;
  metaTopRight?: ReactNode;
  title: string;
  teaser: string;
  badges?: ReactNode;
  footer?: ReactNode;
  tone?: Tone;
  locked?: boolean;
  outcome?: CaseCardOutcome;
  artifactChip?: ArtifactChip;
  unreadThread?: boolean;
  /** Show the seasonal-circulation ⛆ glyph beside the tier meter. */
  seasonGlyph?: ReactNode;
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
  outcome,
  artifactChip,
  unreadThread,
  seasonGlyph,
}: CardShellProps) {

  const no = fileNo(title);
  const stamp = outcome ? OUTCOME_STAMP[outcome] : null;
  const dim = outcome === "closed";
  return (
    <div
      className={`dossier group relative ${locked ? "dossier-locked" : "dossier-live"}`}
      data-outcome={outcome ?? undefined}
    >
      {/* Folder tab row — sits above the folder body */}
      <div className="flex items-end">
        <div
          className={`dossier-tab relative z-[1] inline-flex items-center gap-2 rounded-t-md px-3 py-1.5 ${
            tone === "citizen" ? "dossier-tab-citizen" : ""
          }`}
        >
          {unreadThread && !locked && (
            <span
              aria-hidden="true"
              className="thread-dot h-1.5 w-1.5 rounded-full bg-primary"
            />
          )}
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
        } ${dim ? "opacity-85" : ""}`}
      >
        {/* evidence texture + torch sweep on hover (CSS only) */}
        <div className="dossier-texture absolute inset-0 pointer-events-none" aria-hidden="true" />
        {!locked && (
          <div className="dossier-sweep absolute inset-0 pointer-events-none" aria-hidden="true" />
        )}

        {/* Outcome rubber-stamp — top-right, rotated. Aria-hidden; announced via card name. */}
        {stamp && (
          <div
            aria-hidden="true"
            className="absolute right-3 top-3 z-[2] pointer-events-none opacity-70"
          >
            <span
              className={`inline-block border-double border-4 px-2 py-0.5 stencil text-[9px] tracking-[0.22em] rotate-[-12deg] bg-background/40 ${stamp.cls}`}
            >
              {stamp.label}
            </span>
          </div>
        )}

        <div className="relative">
          {(metaTopRight || artifactChip || seasonGlyph) && (
            <div className="flex flex-col items-end gap-1 min-w-0 float-right ml-3">
              <div className="flex items-center gap-1.5">
                {seasonGlyph}
                {metaTopRight}
              </div>
              {artifactChip && (
                <span
                  className={`inline-flex items-center rounded-sm border bg-background/50 px-1.5 py-0.5 font-mono text-[9px] tracking-widest ${CHIP_TONE[artifactChip.tone]}`}
                  aria-label={`Arrives as ${artifactChip.label}`}
                >
                  {artifactChip.label}
                </span>
              )}
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
  outcome?: CaseCardOutcome;
  artifactChip?: ArtifactChip;
  unreadThread?: boolean;
  /** Small mono badge under the stamp — e.g. "COLD CLEARED · 1:42". */
  coldStamp?: string;
  /** Small footer affordance — e.g. "COLD READ →". Stops link propagation. */
  coldAction?: { label: string; onClick: () => void; ariaLabel?: string };
  /** Seasonal-circulation glyph (⛆). Appends ", in seasonal circulation" to aria. */
  seasonGlyph?: ReactNode;
  inSeason?: boolean;
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
  outcome,
  artifactChip,
  unreadThread,
  coldStamp,
  coldAction,
  seasonGlyph,
  inSeason,
}: CaseCardProps<TParams>) {
  const footer = !locked ? (
    <div className="mt-5 flex items-center justify-between gap-3">
      <span className="font-mono text-xs tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {cta}
      </span>
      {coldAction && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            coldAction.onClick();
          }}
          aria-label={coldAction.ariaLabel ?? coldAction.label}
          className="rounded-sm border border-white/25 bg-black/30 px-2 py-1 font-mono text-[10px] tracking-widest text-white/70 transition hover:border-caution/60 hover:text-caution"
        >
          {coldAction.label}
        </button>
      )}
    </div>
  ) : null;

  const badgesWithCold = (badges || coldStamp) ? (
    <>
      {badges}
      {coldStamp && (
        <span className="inline-flex items-center rounded-sm border border-white/20 bg-black/30 px-2 py-1 font-mono text-[10px] tracking-widest text-white/70">
          {coldStamp}
        </span>
      )}
    </>
  ) : undefined;

  const shell = (
    <CardShell
      icon={icon}
      metaTopRight={metaTopRight}
      title={title}
      teaser={teaser}
      badges={badgesWithCold}
      footer={footer}
      tone={tone}
      locked={locked}
      outcome={outcome}
      artifactChip={artifactChip}
      unreadThread={unreadThread}
      seasonGlyph={seasonGlyph}
    />
  );

  if (locked) return shell;

  const ariaParts: string[] = [title];
  if (inSeason) ariaParts.push("in seasonal circulation");
  if (outcome) ariaParts.push(OUTCOME_STAMP[outcome].aria);
  if (unreadThread) ariaParts.push("new arrival");
  const ariaLabel = ariaParts.join(", ");


  // Typed at call site with TanStack Link's overloads.
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={to as any} params={params as any} className="block" aria-label={ariaLabel}>
      {shell}
    </Link>
  );
}


// LAYER-1 — CaseCard. Neo-Noir Evidence File.
//
// Design language: physical investigation file lying on a detective's desk
// beneath a warm desk lamp. Alan Wake 2, LA Noire, True Detective, Se7en,
// Mindhunter, Control. Real FBI/CIA archive documents.
//
// Every card is a tangible paper dossier — aged ivory paper, ink stamps,
// paperclip, coffee stain, fold corners, paper grain, ruled lines, desk
// lamp lighting, deep layered shadows, barcode strip. Locked files are
// sealed with evidence tape.

import { Link } from "@tanstack/react-router";
import { useState, useMemo, type ReactNode } from "react";
import { RotateCw, ArrowRight } from "lucide-react";

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

/** Deterministic barcode bar heights from seed */
function barcodeBars(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 17 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < 28; i++) {
    h = (h * 31 + 7) >>> 0;
    bars.push(6 + (h % 10));
  }
  return bars;
}

const OUTCOME_LABEL: Record<CaseCardOutcome, string> = {
  closed: "CASE CLOSED",
  transacted: "TRANSACTED",
  false_alarm: "FALSE ALARM",
};

const FORMAT_LABEL: Record<ArtifactChipTone, string> = {
  sms: "SMS",
  dm: "DM",
  wa: "WhatsApp",
  video: "VIDEO",
  image: "IMAGE",
  news: "NEWS",
};

/** Small 5-slot tier meter — filled slots = tier. Used by Mirror cards. */
export function TierMeter({ tier, max = 5 }: { tier: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Tier ${tier} of ${max}`}
      style={{ fontFamily: "'Courier Prime', monospace" }}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 12,
            height: 5,
            borderRadius: 1,
            background: i < tier
              ? "rgba(80, 65, 40, 0.7)"
              : "rgba(180, 160, 130, 0.3)",
            transition: "background 200ms",
          }}
        />
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
  tacticName?: string;
  badges?: ReactNode;
  tone?: Tone;
  locked?: boolean;
  cta?: string;
  outcome?: CaseCardOutcome;
  artifactChip?: ArtifactChip;
  unreadThread?: boolean;
  coldStamp?: string;
  coldAction?: { label: string; onClick: () => void; ariaLabel?: string };
  seasonGlyph?: ReactNode;
  inSeason?: boolean;
  onOpenModal?: () => void;
}

export function CaseCard<TParams extends Record<string, string>>({
  to,
  params,
  icon,
  metaTopRight,
  title,
  teaser,
  tacticName,
  badges,
  tone,
  locked,
  cta = "OPEN CASE",
  outcome,
  artifactChip,
  unreadThread,
  coldStamp,
  coldAction,
  seasonGlyph,
  inSeason,
  onOpenModal,
}: CaseCardProps<TParams>) {
  const [flipped, setFlipped] = useState(false);
  const no = fileNo(title);
  const bars = useMemo(() => barcodeBars(title), [title]);

  const ariaParts: string[] = [title];
  if (inSeason) ariaParts.push("in seasonal circulation");
  if (outcome) ariaParts.push(OUTCOME_LABEL[outcome]);
  if (unreadThread) ariaParts.push("new arrival");
  const ariaLabel = ariaParts.join(", ");

  const handleCardClick = (e: React.MouseEvent) => {
    if (onOpenModal) {
      e.preventDefault();
      onOpenModal();
    }
  };

  /* ────── FRONT FACE: The Physical Evidence File ────── */
  const frontFace = (
    <div className={`evidence-file ${locked ? "evidence-file--locked" : ""}`}>
      {/* Paper stack — sheets beneath */}
      <div className="evidence-file__stack" aria-hidden="true" />

      {/* Main paper surface */}
      <div className="evidence-file__paper">
        {/* Ruled notebook lines */}
        <div className="evidence-file__rules" aria-hidden="true" />

        {/* Coffee stain ring */}
        <div className="evidence-file__stain" aria-hidden="true" />

        {/* Fold corner */}
        <div className="evidence-file__fold" aria-hidden="true" />

        {/* Paperclip */}
        {!locked && <div className="evidence-file__clip" aria-hidden="true" />}

        {/* CONFIDENTIAL rubber stamp */}
        <div className="evidence-file__stamp" aria-hidden="true">
          {locked ? "SEALED" : "CLASSIFIED"}
        </div>

        {/* Outcome rubber stamp (CASE CLOSED / TRANSACTED / FALSE ALARM) */}
        {outcome && (
          <div
            className={`evidence-file__outcome evidence-file__outcome--${outcome}`}
            aria-hidden="true"
          >
            {OUTCOME_LABEL[outcome]}
          </div>
        )}

        {/* Content */}
        <div className="evidence-file__content" style={{ position: "relative", zIndex: 3 }}>
          {/* Header: case number, tier, format */}
          <div className="evidence-file__header">
            <span className="evidence-file__caseno">
              {unreadThread && !locked && (
                <span
                  style={{
                    display: "inline-block",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(180, 50, 30, 0.7)",
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                  aria-label="new"
                />
              )}
              Case No. {no}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {seasonGlyph}
              {metaTopRight}
              {artifactChip && (
                <span className="evidence-file__tier">
                  {FORMAT_LABEL[artifactChip.tone] || artifactChip.label}
                </span>
              )}
            </div>
          </div>

          {/* Title — editorial serif */}
          <h3 className="evidence-file__title">{title}</h3>

          {/* Teaser — italic serif description */}
          <p className="evidence-file__desc">{teaser}</p>

          {/* Tags & badges row */}
          {(badges || coldStamp) && (
            <div className="evidence-file__tags">
              {badges}
              {coldStamp && (
                <span className="evidence-file__tag">{coldStamp}</span>
              )}
            </div>
          )}

          {/* Sticky note — shows tactic on unlocked files */}
          {!locked && tacticName && (
            <div className="evidence-file__sticky" aria-hidden="true">
              "{tacticName}"
            </div>
          )}

          {/* Footer: barcode + actions */}
          <div className="evidence-file__footer">
            {/* Barcode */}
            <div className="evidence-file__barcode" aria-hidden="true">
              {bars.map((h, i) => (
                <span key={i} style={{ height: h }} />
              ))}
            </div>

            {!locked ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {coldAction && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      coldAction.onClick();
                    }}
                    aria-label={coldAction.ariaLabel ?? coldAction.label}
                    className="evidence-file__action"
                  >
                    {coldAction.label}
                  </button>
                )}
                <span className="evidence-file__cta">{cta} →</span>
              </div>
            ) : (
              <span className="evidence-file__cta" style={{ opacity: 0.4 }}>
                SEALED
              </span>
            )}
          </div>
        </div>

        {/* Sealed tape across locked files */}
        {locked && (
          <div className="evidence-file__seal">
            <div className="evidence-file__seal-label">
              SEALED · CLEAR THE TIER BELOW
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ────── BACK FACE: Intel Brief (flip card) ────── */
  const backFace = (
    <div className="evidence-file__intel">
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(140, 120, 80, 0.25)",
          marginBottom: 12,
        }}>
          <span className="evidence-file__caseno" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(80, 65, 40, 0.5)", display: "inline-block" }} />
            DOSSIER INTEL · FILE {no}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFlipped(false);
            }}
            className="evidence-file__action"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}
          >
            <RotateCw style={{ width: 10, height: 10 }} /> FLIP FRONT
          </button>
        </div>

        {/* Title */}
        <h4 className="evidence-file__title" style={{ fontSize: "1.05rem" }}>{title}</h4>
        <p className="evidence-file__desc" style={{ marginBottom: 12 }}>{teaser}</p>

        {/* Intel grid: Tactic + Format */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{
            border: "1px solid rgba(140, 120, 80, 0.2)",
            padding: "8px 10px",
            background: "rgba(230, 220, 195, 0.3)",
          }}>
            <span className="evidence-file__caseno" style={{ fontSize: 8, display: "block", marginBottom: 4, letterSpacing: "0.2em" }}>
              TACTIC
            </span>
            <span style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#1a1610",
              textTransform: "uppercase" as const,
            }}>
              {tacticName || "REHEARSAL"}
            </span>
          </div>
          <div style={{
            border: "1px solid rgba(140, 120, 80, 0.2)",
            padding: "8px 10px",
            background: "rgba(230, 220, 195, 0.3)",
          }}>
            <span className="evidence-file__caseno" style={{ fontSize: 8, display: "block", marginBottom: 4, letterSpacing: "0.2em" }}>
              FORMAT
            </span>
            <span style={{
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#1a1610",
              textTransform: "uppercase" as const,
            }}>
              {artifactChip?.label || "CHAT"}
            </span>
          </div>
        </div>

        {/* Bottom action bar */}
        <div style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid rgba(140, 120, 80, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFlipped(false);
            }}
            className="evidence-file__caseno"
            style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
          >
            ← FLIP BACK
          </button>
          <Link
            to={to as any}
            params={params as any}
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#1a1610",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              border: "1px solid rgba(100, 80, 50, 0.3)",
              background: "rgba(220, 210, 185, 0.4)",
              transition: "all 200ms",
            }}
          >
            OPEN FILE <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>
    </div>
  );

  /* ────── Locked card — no link, no flip ────── */
  if (locked) {
    return frontFace;
  }

  /* ────── Unlocked card — with flip & link ────── */
  return (
    <div className="flashcard-perspective w-full">
      <div className={`flashcard-inner ${flipped ? "is-flipped" : ""}`}>
        {/* FRONT */}
        <div className="flashcard-front">
          <Link
            to={to as any}
            params={params as any}
            onClick={handleCardClick}
            className="block"
            aria-label={ariaLabel}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {frontFace}
          </Link>
          {/* Flip button — positioned over the front face */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFlipped(true);
            }}
            className="evidence-file__action"
            style={{
              position: "absolute",
              bottom: 13,
              left: 24,
              zIndex: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <RotateCw style={{ width: 10, height: 10 }} /> FLIP INTEL
          </button>
        </div>

        {/* BACK */}
        <div className="flashcard-back" style={{ borderRadius: "2px" }}>
          {backFace}
        </div>
      </div>
    </div>
  );
}

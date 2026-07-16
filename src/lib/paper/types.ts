// THE DAILY MIRAGE — edition shapes shared between server, pressroom, and paper.

export type EditionStatus = "draft" | "published" | "locked";

export interface EditionLead {
  kicker: string;
  headline: string;
  subhead: string;
  byline: string;
  dropCap?: boolean;
  columns: string[];       // paragraphs of the lead article
  caseId: string;          // references FEED_SCENARIOS[id] for the ground-truth play
  yourCallTitle?: string;
}

export interface EditionForgery {
  kind: "ai_or_real";
  prompt: string;
  imageAlt: string;
  imageEmoji: string;
  truth: "REAL" | "AI";
  provenance: string;
  thesis: string;
  tacticId?: string;
}

export interface EditionSocial {
  handle: string;
  caption: string;
  likes: number;
  views: number;
  imageEmoji: string;
  imageAlt: string;
  truth: "TRUE" | "FALSE" | "MISLEADING";
  reveal: string;
  tacticId?: string;
}

export interface EditionClassified {
  title: string;
  body: string;
  flags: string[];         // exact substrings inside body/title that are the "red flags"
  tacticId?: string;
}

export type EditionPuzzleKind = "headline_autopsy" | "spot_the_tell";

export interface EditionPuzzle {
  kind: EditionPuzzleKind;
  clickbait: string;
  honest: string;
  words: string[];         // shuffled words for autopsy; or bullet tells for spot_the_tell
  reveal: string;
}

export interface EditionLedger { note?: string }

export interface EditionEditorial { fallback: string; signoff: string }

export interface EditionRealWorld { lede: string; linkLabel: string; linkHref: string }

export interface EditionContent {
  lead: EditionLead;
  forgery: EditionForgery;
  social: EditionSocial;
  classifieds: EditionClassified[];
  puzzle: EditionPuzzle;
  ledger: EditionLedger;
  editorial: EditionEditorial;
  realWorld: EditionRealWorld;
}

export interface Edition {
  id: string;
  edition_number: number;
  edition_date: string;         // YYYY-MM-DD
  motto: string;
  status: EditionStatus;
  content: EditionContent;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

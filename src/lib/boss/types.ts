// MILVERSE — Boss Protocol types.
export type BossOutcomeKind = "WIN" | "LOSS_TRANSACTED" | "LOSS_FALSE_ALARM" | "LOSS_PARANOIA";

// Bosses extend the Scenario ground-truth model with:
//  - supportsCoverStory: fact-checks CONFIRM the scam by design
//  - winning protocol moves (channel/second-person/shared-secret/HOLD)
//  - pressure phase scripts
//  - variants (rematch shuffles surface details; protocol still wins)
//
// Two-way loss is preserved: bosses can be variants of REAL requests where
// blank refusal = FALSE ALARM. Paranoia is punishable; only PROTOCOL wins.

export type BossId = "ghost-of-bali" | "the-twin" | "the-chorus";

export type ProtocolMove =
  | "callback_known"     // Call the KNOWN number (Contacts)
  | "second_person"      // Ask a mutual / office / family member
  | "shared_secret"      // Ask a question only the real person could answer
  | "hold_unverified"    // Refuse to transact until verified
  | "outbound_video"     // For The Twin: call THEM back on your line
  | "provenance_trace"   // For The Chorus: follow source chain
  | "delay_past_window"; // For The Chorus: wait past urgency window

export type BossVerdict =
  | "COMPLY_NOW"         // Transact — loss if scam, win if real+trusted
  | "REFUSE_REPORT"      // Blank refuse — loss if REAL (False Alarm)
  | "HOLD_UNVERIFIED";   // Refuse to transact until verified — always safe

export interface PressurePhase {
  id: "friendly" | "urgent" | "guilt" | "threat" | "morning_after";
  label: string;
  scriptedLines: string[];
  /** Turns spent in phase before escalating (approx). */
  turnsBeforeEscalate: number;
}

export interface FactCheckResult {
  id: string;
  label: string;
  result: string;
  /** If true, this fact-check APPEARS to confirm the cover story — the trap. */
  supportsCoverStory: boolean;
  /** For provenance-style tools: chain that traces to a single origin. */
  provenanceChain?: string[];
}

export interface ProtocolMoveDef {
  id: ProtocolMove;
  label: string;
  blurb: string;
  /** If chosen against this variant, does it WIN, LOSE, or PROGRESS? */
  outcome: "WIN" | "LOSE" | "PROGRESS";
  /** Line the scammer / narrator returns when this move is played. */
  response: string;
  /** Optional: additional protocol move required after this one to fully win. */
  requiresFollowup?: ProtocolMove;
}

export interface BossVariant {
  id: string;
  /** REAL means it's actually your loved one — paranoia = False Alarm loss. */
  truth: "SCAM" | "REAL";
  opener: string;
  /** Short cinematic subtitle: "AI-cloned voice", "phone actually died", etc. */
  truthReveal: string;
  factChecks: FactCheckResult[];
  moves: ProtocolMoveDef[];
  /** Which final verdict wins for this variant. */
  winningVerdict: BossVerdict;
  /** Debrief close (spoiler-safe). */
  debriefLine: string;
}

export interface BossConfig {
  id: BossId;
  codename: string;
  district: "mirror" | "feed" | "citizen-os";
  threatRating: "☠" | "☠☠" | "☠☠☠";
  tagline: string;
  /** Doctrine that this boss teaches. */
  doctrineRule: string;
  /** Field Manual method page — DECLASSIFIED on first win. */
  methodPage: {
    codename: string;
    howItWorks: string;
    theTrap: string;
    theCounter: string;
    realWorldPattern: string;
  };
  badge: {
    id: "GHOSTBREAKER" | "TWINPROOF" | "CHORUS_DEAF";
    label: string;
    blurb: string;
  };
  /** Phase-scripted pressure staging. */
  phases: PressurePhase[];
  /** Two or more variants — engine shuffles which plays. */
  variants: BossVariant[];
  /** Playable? Set false for locked seed bosses awaiting Phase 2 scripting. */
  playable: boolean;
  /** Prerequisites: e.g. tier completions. */
  unlock: { district: "mirror" | "feed"; tiersRequired: number };
}

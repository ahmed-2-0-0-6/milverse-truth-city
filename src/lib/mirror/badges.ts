// MILVERSE — Badges. Awarded from City Hall / debrief; surfaced via a toast event.

import type { TrustProfile } from "./profile";
import { readStore, recoverStore, writeStore } from "@/lib/storage";


export interface BadgeDef {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  earned: (p: TrustProfile) => boolean;
}

export const BADGES: BadgeDef[] = [
  // ── ONBOARDING ──
  {
    id: "first-verify",
    name: "First Verification",
    blurb: "You ran your first case.",
    emoji: "🔍",
    earned: (p) => p.casesPlayed >= 1,
  },
  {
    id: "ten-cases",
    name: "Case Hardened",
    blurb: "10 cases filed. The desk knows your name.",
    emoji: "🗂️",
    earned: (p) => p.casesPlayed >= 10,
  },
  // ── SKILL ──
  {
    id: "imposter-spotter",
    name: "Imposter Spotter",
    blurb: "Flagged 3 imposters correctly.",
    emoji: "👁️",
    earned: (p) =>
      p.history.filter((h) => h.truth === "IMPOSTER" && h.result === "correct").length >= 3,
  },
  {
    id: "no-false-alarm",
    name: "Calibrated Reader",
    blurb: "3 correct verdicts, no false alarms.",
    emoji: "⚖️",
    earned: (p) => p.correctVerdicts >= 3 && p.falseAlarms === 0,
  },
  {
    id: "zero-drift",
    name: "Zero Drift",
    blurb: "5+ cases. No missed scams, no false alarms.",
    emoji: "🎯",
    earned: (p) => p.casesPlayed >= 5 && p.missedScams === 0 && p.falseAlarms === 0,
  },
  {
    id: "verify-another-way",
    name: "Out of Band",
    blurb: "Won a case with an out-of-band verification.",
    emoji: "📞",
    earned: (p) => p.history.some((h) => h.usedVob && h.result === "correct"),
  },
  {
    id: "strong-arm",
    name: "Strong Arm",
    blurb: "More strong probes than weak ones. You ask the right questions.",
    emoji: "💪",
    earned: (p) =>
      p.strongProbesTotal >= 8 && p.strongProbesTotal > p.weakProbesTotal,
  },
  // ── TIER PROGRESSION ──
  {
    id: "tier-3-unlock",
    name: "Clearance Level 3",
    blurb: "Unlocked Tier 3 cases.",
    emoji: "🔓",
    earned: (p) =>
      p.history.filter((h) => h.tier === 2 && h.result === "correct").length >= 2,
  },
  {
    id: "tier-4-unlock",
    name: "Clearance Level 4",
    blurb: "Unlocked Tier 4. These ones fight back.",
    emoji: "🔐",
    earned: (p) =>
      p.history.filter((h) => h.tier === 3 && h.result === "correct").length >= 2,
  },
  {
    id: "clean-room",
    name: "Clean Room",
    blurb: "Solved a Tier 5 case.",
    emoji: "🧪",
    earned: (p) =>
      p.history.some((h) => h.tier === 5 && (h.result === "correct" || h.result === "lucky_guess")),
  },
  // ── DAILY DROP ──
  {
    id: "daily-debut",
    name: "On the Beat",
    blurb: "Played your first Daily Drop.",
    emoji: "📰",
    earned: (p) => (p.dailyPlays?.length ?? 0) >= 1,
  },
  {
    id: "daily-streak-3",
    name: "Three-Day Watch",
    blurb: "3-day streak. The city noticed.",
    emoji: "🔥",
    earned: (p) => (p.dailyStreak ?? 0) >= 3,
  },
  {
    id: "daily-streak-7",
    name: "Week on Watch",
    blurb: "7-day streak. You don't miss a shift.",
    emoji: "⚡",
    earned: (p) => (p.dailyStreak ?? 0) >= 7,
  },
  {
    id: "daily-streak-14",
    name: "Fortnight Guard",
    blurb: "14-day streak. The city depends on you.",
    emoji: "🏅",
    earned: (p) => (p.dailyStreak ?? 0) >= 14,
  },
  // ── CONVICTION ──
  {
    id: "certain-correct",
    name: "Dead Certain",
    blurb: "Called CERTAIN (90%) and got it right.",
    emoji: "🎰",
    earned: (p) =>
      p.history.some((h) => h.confidence === 90 && h.result === "correct"),
  },
  // ── CREATIVE / ENDGAME ──
  {
    id: "studio-published",
    name: "City Designer",
    blurb: "Published a scenario in Studio.",
    emoji: "🏗️",
    earned: (p) => (p.publishedCount ?? 0) >= 1,
  },
  {
    id: "field-editor",
    name: "Editor",
    blurb: "Reached Editor literacy level.",
    emoji: "📰",
    earned: (p) => p.correctVerdicts >= 28,
  },
];

// Owner: mirror/badges (earned badge id list). Bump the suffix on
// breaking shape change; readStore validators are the compatibility gate.
const KEY = "milverse.badges";

function isBadgeListShape(v: unknown): v is string[] {
  return Array.isArray(v);
}

export function loadEarnedBadges(): string[] {
  if (typeof window === "undefined") return [];
  const read = readStore<string[]>(KEY, isBadgeListShape);
  if (read === "corrupt") {
    const rec = recoverStore<string[]>(KEY, isBadgeListShape);
    return rec ?? [];
  }
  return read ?? [];
}

function saveEarnedBadges(ids: string[]): boolean {
  if (typeof window === "undefined") return false;
  return writeStore(KEY, ids);
}


/** Compare profile against all badges and emit `milverse:badge` events for new ones. */
export function checkAndAwardBadges(p: TrustProfile): BadgeDef[] {
  const earned = new Set(loadEarnedBadges());
  const newly: BadgeDef[] = [];
  for (const b of BADGES) {
    if (!earned.has(b.id) && b.earned(p)) {
      earned.add(b.id);
      newly.push(b);
    }
  }
  if (newly.length) {
    saveEarnedBadges(Array.from(earned));
    if (typeof window !== "undefined") {
      for (const b of newly) {
        window.dispatchEvent(new CustomEvent("milverse:badge", { detail: b }));
      }
    }
  }
  return newly;
}

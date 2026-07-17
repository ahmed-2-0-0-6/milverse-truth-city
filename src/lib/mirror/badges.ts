// MILVERSE — Badges. Awarded from City Hall / debrief; surfaced via a toast event.

import type { TrustProfile } from "./profile";

export interface BadgeDef {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  earned: (p: TrustProfile) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-verify",
    name: "First Verification",
    blurb: "You ran your first case.",
    emoji: "🔍",
    earned: (p) => p.casesPlayed >= 1,
  },
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
    id: "verify-another-way",
    name: "Out of Band",
    blurb: "Won a case with an out-of-band verification.",
    emoji: "📞",
    earned: (p) => p.history.some((h) => h.usedVob && h.result === "correct"),
  },
  {
    id: "clean-room",
    name: "Clean Room",
    blurb: "Solved a Tier 5 case.",
    emoji: "🧪",
    earned: (p) =>
      p.history.some((h) => h.tier === 5 && (h.result === "correct" || h.result === "lucky_guess")),
  },
  {
    id: "field-editor",
    name: "Editor",
    blurb: "Reached Editor literacy level.",
    emoji: "📰",
    earned: (p) => p.correctVerdicts >= 28,
  },
];

const KEY = "milverse.badges";

export function loadEarnedBadges(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEarnedBadges(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ids));
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

// MILVERSE — THE SEASON. Pakistan's scam calendar as in-game weather.
//
// THE WEATHER LAW: a season names a TACTIC FAMILY in circulation, never a
// verdict. Seasonal surfacing includes REAL cases wherever their tactic
// matches (that is correct and required). No string in this file may say or
// imply "messages this week are scams" — they say "this SCRIPT is running."
//
// Ground truths, engine, scenarios, and daily rotation math are untouched.
// This module only re-dresses the framing around cases.
//
// EID RANGES ARE GREGORIAN APPROXIMATIONS SET BY HAND — update each year.
//
// Dev override (testing only): set localStorage key "milverse.season.force"
// to a season id to force that season. Read below in seasonFor().

import type { TacticId } from "@/lib/manual/entries";
import { dropDateKey } from "@/lib/daily/rotation";

export interface SeasonRange {
  /** "MM-DD" inclusive, evaluated in UTC+5. from > to wraps year-end. */
  from: string;
  to: string;
}

export interface Season {
  id: string;
  name: string;
  ranges: SeasonRange[];
  /** Tactic families surfaced as "in circulation" during this season. */
  tactics: TacticId[];
  /** Hub advisory strip body. Names the script AND affirms real traffic exists. */
  advisory: string;
  /** Marquee lines prepended to the ticker while the season is live. */
  marquee: string[];
  /** Framed weather box on the Paper front page. */
  paperBox: { head: string; body: string };
  /** One full-map wash tint on the city map (LITE drops this). */
  mapTint: string;
}

/** Every advisory names the script AND affirms real traffic exists — that
 *  structure is load-bearing; keep it in any future season. */
export const SEASONS: Season[] = [
  {
    id: "eid-wave",
    name: "THE EID WAVE",
    // EID RANGES ARE GREGORIAN APPROXIMATIONS SET BY HAND — update each year.
    ranges: [
      { from: "03-28", to: "04-05" },
      { from: "06-05", to: "06-12" },
    ],
    tactics: ["impersonation", "phishing"],
    advisory:
      "Eidi is moving, so the transfer scripts are out — wrong-number 'refunds', stranded relatives, gift-payment reversals. The scripts bank on generosity and haste. Real relatives are also texting more than usual. Same rule as always: verify the person, not the vibe.",
    marquee: [
      "THE EID WAVE · TRANSFER SCRIPTS IN CIRCULATION",
      "CITY ADVISORY · VERIFY THE PERSON, NOT THE VIBE",
    ],
    paperBox: {
      head: "SEASONAL FRONT: THE EID WAVE",
      body: "Money moves this week, and the scripts move with it. The desk reminds citizens: a wrong-number refund request is a script, a stranded cousin is a phone call, and generosity deserves thirty seconds of verification.",
    },
    mapTint: "rgba(245,185,66,0.05)",
  },
  {
    id: "results-season",
    name: "RESULTS SEASON",
    ranges: [{ from: "07-10", to: "08-15" }],
    tactics: ["phishing", "urgency-fear"],
    advisory:
      "Boards posted results, so the 'scholarship office' is calling — processing fees, deadline pressure, congratulations with a price tag. Real institutions also reach out this month. The difference is never the good news; it's whether they need money to deliver it.",
    marquee: [
      "RESULTS SEASON · SCHOLARSHIP SCRIPTS ACTIVE",
      "CITY ADVISORY · GOOD NEWS THAT BILLS YOU ISN'T NEWS",
    ],
    paperBox: {
      head: "SEASONAL FRONT: RESULTS SEASON",
      body: "Congratulations are in the air — some of them invoiced. The desk notes that real scholarships disburse money and fake ones collect it. That's the whole test.",
    },
    mapTint: "rgba(34,211,238,0.05)",
  },
  {
    id: "final-fog",
    name: "THE FINAL FOG",
    ranges: [{ from: "02-20", to: "03-10" }],
    tactics: ["engagement-bait", "trust-farming"],
    advisory:
      "Finals season: prediction pages, 'guaranteed' tips, betting circles dressed as fan groups. The scripts sell certainty about an uncertain game. Real fans argue; scripts guarantee.",
    marquee: [
      "THE FINAL FOG · PREDICTION SCRIPTS CIRCULATING",
      "CITY ADVISORY · CERTAINTY FOR SALE IS THE TELL",
    ],
    paperBox: {
      head: "SEASONAL FRONT: THE FINAL FOG",
      body: "The city watches the match; the scripts watch the city. Anyone selling a sure thing about an uncertain game has told you what they are.",
    },
    mapTint: "rgba(134,239,172,0.04)",
  },
];

function inRange(mmdd: string, r: SeasonRange): boolean {
  // from > to wraps year-end (e.g. 12-15 → 01-05).
  if (r.from <= r.to) return mmdd >= r.from && mmdd <= r.to;
  return mmdd >= r.from || mmdd <= r.to;
}

/** Resolve the active season for `now`, using UTC+5 via dropDateKey.
 *  First match in the SEASONS array wins on overlap. Returns null off-season.
 *  Dev override: localStorage "milverse.season.force" = season id. Testing only. */
export function seasonFor(now: Date = new Date()): Season | null {
  if (typeof window !== "undefined") {
    try {
      const forced = window.localStorage.getItem("milverse.season.force");
      if (forced) {
        const hit = SEASONS.find((s) => s.id === forced);
        if (hit) return hit;
      }
    } catch {
      /* ignore */
    }
  }
  const mmdd = dropDateKey(now).slice(5); // "MM-DD" in UTC+5
  for (const s of SEASONS) {
    if (s.ranges.some((r) => inRange(mmdd, r))) return s;
  }
  return null;
}

/** Does a case's tactic put it in the current season's circulation? */
export function isCaseInSeason(tactic: TacticId | undefined, season: Season | null): boolean {
  if (!season || !tactic) return false;
  return season.tactics.includes(tactic);
}

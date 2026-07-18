// MILVERSE — Craft Marks. Presentation-only helpers that translate a
// message's probeQuality (already assigned by the engine at send time) into a
// margin note the player can read mid-case. The grade itself is computed by
// gradeProbe in engine.ts and is truth-independent — this module never reads
// scenario.truth and never re-runs any scoring.

import type { Scenario } from "./scenarios";

export type Grade = "strong" | "weak" | "wasted";

export const MARKS_SEEN_KEY = "milverse.craftmarks.seen";

/** Same lowercase/punct-strip normalization the engine's keyword matcher uses. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Re-run the engine's keyword match presentation-side so we can name the fact
 * a "strong" question landed on. Returns the first matching Fact keyword hit,
 * or undefined if the question is generic.
 */
function matchedFactKeywords(scenario: Scenario, text: string): string[] | undefined {
  const n = normalize(text);
  for (const f of scenario.facts) {
    for (const kw of f.keywords) {
      if (n.includes(normalize(kw))) return f.keywords;
    }
  }
  return undefined;
}

/**
 * Map a matched fact back to a K-ref by scanning the dossier's knownFacts for
 * any of the fact's keywords. Returns "K{i+1}" or undefined.
 */
function knownRefFor(scenario: Scenario, factKeywords: string[]): string | undefined {
  for (let i = 0; i < scenario.dossier.knownFacts.length; i++) {
    const kf = normalize(scenario.dossier.knownFacts[i]);
    for (const kw of factKeywords) {
      if (kf.includes(normalize(kw))) return `K${i + 1}`;
    }
  }
  return undefined;
}

/**
 * The margin-note text for a given grade. Verbatim strings from the design
 * spec; the STRONG line names the K-ref when derivable, otherwise "case".
 */
export function whyFor(scenario: Scenario, text: string, grade: Grade): string {
  if (grade === "wasted") {
    return "An accusation isn't a test. They can just say no. Ask something only the real one can answer.";
  }
  if (grade === "weak") {
    return "A real question — but anyone with a search bar could answer it. It costs them nothing to get this right.";
  }
  // strong
  const kws = matchedFactKeywords(scenario, text);
  const ref = kws ? knownRefFor(scenario, kws) : undefined;
  const anchor = ref ? `the ${ref} file` : "case file";
  return `This targeted the ${anchor} — something only the real one should know.`;
}

/** localStorage flag — grades whose auto-explanation has already fired. */
export function loadSeen(): Grade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MARKS_SEEN_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((g): g is Grade => g === "strong" || g === "weak" || g === "wasted") : [];
  } catch {
    return [];
  }
}

export function markSeen(g: Grade): void {
  if (typeof window === "undefined") return;
  const seen = loadSeen();
  if (seen.includes(g)) return;
  seen.push(g);
  try {
    window.localStorage.setItem(MARKS_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // ignore
  }
}

/** Display glyph + label per grade — the mark string, verbatim. */
export function labelFor(g: Grade): string {
  if (g === "strong") return "◆ STRONG";
  if (g === "weak") return "◇ WEAK";
  return "✕ WASTED";
}

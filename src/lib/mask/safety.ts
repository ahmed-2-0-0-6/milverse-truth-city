// MILVERSE — THE MASK · safety screens.
// Extends Studio validate() with a revered/common-names screen for the
// persona identity fields. Content validation (phones, emails, URLs,
// profanity, public figures) still runs in the caller's validate().

const REVERED_NAMES = [
  "zainab",
  "ayesha",
  "aisha",
  "fatima",
  "fatimah",
  "maryam",
  "mariam",
  "bilal",
  "ali",
  "umar",
  "omar",
  "hassan",
  "hasan",
  "hussain",
  "husain",
  "usman",
  "uthman",
  "khadija",
  "khadeeja",
];

/**
 * Return an error string if the persona identity fields contain a revered
 * or highly-common everyday first name — masks travel to real kids by
 * WhatsApp and the desk won't route them under sacred names.
 */
export function screenPersonaName(personaName: string, relationship: string): string | null {
  const hay = `${personaName} ${relationship}`.toLowerCase();
  const tokens = hay.split(/[^a-z]+/).filter(Boolean);
  for (const t of tokens) {
    if (REVERED_NAMES.includes(t)) {
      return "Pick a different name for the persona — common everyday names only.";
    }
  }
  return null;
}

/**
 * Fairness gates that MUST pass before a mask leaves the desk (send).
 * Saving is still permitted; sending is not.
 */
export function fairnessGate(d: {
  truth: "REAL" | "IMPOSTER";
  facts: { text: string; isPublic: boolean; isGap: boolean }[];
}): string | null {
  const filled = d.facts.filter((f) => f.text.trim().length >= 6);
  if (d.truth === "IMPOSTER") {
    const gaps = filled.filter((f) => f.isGap).length;
    if (gaps < 2) {
      return "A mask nobody can beat proves nothing. The desk won't route it.";
    }
  } else {
    // REAL — need >= 2 answerable private facts.
    const answerable = filled.filter((f) => !f.isPublic && !f.isGap).length;
    if (answerable < 2) {
      return "A mask nobody can beat proves nothing. The desk won't route it.";
    }
  }
  return null;
}

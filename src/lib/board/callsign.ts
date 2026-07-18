// MILVERSE — Deterministic pseudonymous callsigns for The City Board.
// Pure client-side. No PII. Input is the 6-char md5 handle already
// exposed by the server RPC; the same handle always yields the same
// callsign, and the handle itself stays visible as the tiebreaker.

const ADJECTIVES = [
  "GREY", "QUIET", "SWIFT", "IRON", "MIDNIGHT", "PATIENT", "SHARP", "LUCKY",
  "SILENT", "AMBER", "COBALT", "STEADY", "PAPER", "CANDID", "NORTH", "LATE",
  "SLOW", "BRIGHT", "NEON", "DUSK", "HOLLOW", "RUSTED", "PLAIN", "LONG",
  "LEAN", "CIVIL", "BLUNT", "TIN", "GLASS", "COOL", "CLEAR", "LOW",
] as const;

const NOUNS = [
  "HERON", "ARCHIVIST", "COURIER", "LANTERN", "SENTINEL", "CARTOGRAPHER",
  "WATCHMAN", "TELESCOPE", "LEDGER", "FERRY", "SIGNAL", "TRAWLER",
  "TRAM", "SCRIBE", "AUDITOR", "COMPASS", "MAGPIE", "OWL",
  "PORTER", "BEACON", "HARBOR", "STEWARD", "PIGEON", "TYPIST",
  "MECHANIC", "OPERATOR", "LOCKSMITH", "STENOGRAPHER", "GATEKEEPER",
  "ARCHIVE", "ATLAS", "MARINER",
] as const;

/** handle: 6-char lowercase hex (matches substr(md5(device_id), 1, 6)). */
export function callsign(handle: string): string {
  const h = (handle || "").toLowerCase();
  // First three hex chars → adjective index; last three → noun index.
  const a = parseInt(h.slice(0, 3) || "0", 16);
  const n = parseInt(h.slice(3, 6) || "0", 16);
  const adj = ADJECTIVES[a % ADJECTIVES.length];
  const noun = NOUNS[n % NOUNS.length];
  return `${adj} ${noun}`;
}

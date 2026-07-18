// MILVERSE — SIGNAGE.
// PLAIN-register subtitles that sit under every noir district name.
// The fiction is the brand; the subtitle is the signage. This is the
// ONE surface where plain beats noir — a stranger has to know what
// a door does in three seconds. Never replaces the noir name; always
// adds a second line.
//
// Keyed by door id. Any new public district must land in this map;
// missing keys show the name alone, so nothing breaks — but a stranger
// stops learning. Keep entries under ~10 words.

export interface SignEntry {
  /** Plain-register, one line, no exclamation marks. */
  sub: string;
  /** Route for legend/list rendering. Optional — some ids (e.g. hub-only
   *  districts on the map) don't have a canonical route. */
  to?: string;
  /** Preferred label; falls back to the id, uppercased. */
  label?: string;
}

export const SIGNAGE: Record<string, SignEntry> = {
  mirror: {
    label: "The Mirror",
    to: "/mirror",
    sub: "Counter-scam desk. Pick up, play them, burn them",
  },

  feed: {
    label: "The Feed",
    to: "/feed",
    sub: "Is that viral forward true? Prove it",
  },
  drop: {
    label: "Daily Drop",
    to: "/drop",
    sub: "One quick case a day. Keep the streak alive",
  },
  boss: {
    label: "Boss Fights",
    to: "/boss",
    sub: "Boss fights. Con artists your fact-checks can't touch",
  },
  shift: {
    label: "The Shift",
    to: "/shift",
    sub: "Five cases, three lives, one score",
  },
  manual: {
    label: "Field Manual",
    to: "/manual",
    sub: "Every scam trick, named and dissected",
  },
  paper: {
    label: "The Paper",
    to: "/paper",
    sub: "The city's newspaper. Play the front page",
  },
  studio: {
    label: "The Studio",
    to: "/studio",
    sub: "Design your own scam case. Test your friends",
  },
  archive: {
    label: "The Archive",
    to: "/archive",
    sub: "The city's records and old cases",
  },
  arena: {
    label: "The Arena",
    to: "/arena",
    sub: "Head-to-head. You vs another citizen",
  },
  "city-hall": {
    label: "City Hall",
    to: "/city-hall",
    sub: "Your stats, your rank, the city's census",
  },
  charter: {
    label: "City Charter",
    to: "/charter",
    sub: "The rules this city is built on",
  },
  profile: {
    label: "Operator Profile",
    to: "/profile",
    sub: "Your file: rank, record, calibration",
  },
  assessment: {
    label: "Assessment",
    to: "/assessment",
    sub: "The before-and-after test. Proof you improved",
  },
  // Blueprint district — public shell, not a playable route yet.
  market: {
    label: "The Market",
    to: "/market",
    sub: "Trade cases and share receipts (blueprint)",
  },
  // Junior surface — kept in the map for parents/kids browsing.
  "first-phone": {
    label: "First Phone",
    to: "/first-phone",
    sub: "The ten lessons before a kid's first phone",
  },
};

/** All public doors, in the order the WHAT IS ALL THIS? legend uses. */
export const SIGN_ORDER: string[] = [
  "mirror",
  "feed",
  "drop",
  "shift",
  "boss",
  "paper",
  "studio",
  "archive",
  "arena",
  "manual",
  "charter",
  "city-hall",
  "profile",
  "assessment",
  "first-phone",
  "market",
];

/** Lookup by id or by route. Route lookup lets nav configs stay by-URL. */
export function signFor(idOrRoute: string): SignEntry | null {
  if (SIGNAGE[idOrRoute]) return SIGNAGE[idOrRoute];
  const byRoute = Object.values(SIGNAGE).find((s) => s.to === idOrRoute);
  return byRoute ?? null;
}

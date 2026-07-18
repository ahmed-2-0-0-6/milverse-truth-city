// MILVERSE — "RED HANDS" script.
//
// Assigned red-team duty against Bibi Shamim (61, retired headmistress,
// graduate of the ten lessons). The player runs a scripted scam and loses
// by construction. Every wall she puts up is a wall the player can install
// at home. Zero AI, zero cloud, zero free text, zero engine writes.
//
// LAW: no revered Islamic religious names appear in this file (target,
// cover, or relative). Approved secular names only: Shamim, Danish, Farhan,
// Nadia, Rukhsana, Parveen.
//
// Drill rule: writes only to `milverse.redhands.v1`.

import { readStore, writeStore } from "@/lib/storage";

/* ─────────── families & codes ─────────── */

/** Move families — every one is a Field Manual tactic. */
export type MoveFamily = "WARM" | "PROVE" | "RUSH" | "ASK" | "DODGE" | "FOLD";

/** Field Manual codes; every chip carries one — no novel technique. */
export type TacticCode = "T-01" | "T-02" | "T-06" | "T-07";

export const FAMILY_CODE: Record<Exclude<MoveFamily, "FOLD">, TacticCode> = {
  WARM: "T-07", // trust-farming
  PROVE: "T-01", // impersonation via scraped fact
  RUSH: "T-02", // urgency
  ASK: "T-06", // payload / phishing
  DODGE: "T-01", // impersonation deflect
};

/* ─────────── covers ─────────── */

export type Cover = "nephew" | "bank" | "prize";

export interface CoverCopy {
  id: Cover;
  label: string;
  /** One-line pitch for the briefing card. */
  pitch: string;
  /** Her challenge question — a shared memory the script cannot know. */
  challenge: string;
}

export const COVERS: Record<Cover, CoverCopy> = {
  nephew: {
    id: "nephew",
    label: "STRANDED NEPHEW",
    pitch: "You're Danish. Phone fell in the canal. Repair shop closes at eight.",
    challenge: "Beta, what did I confiscate from you in class six?",
  },
  bank: {
    id: "bank",
    label: "BANK FRAUD DESK",
    pitch: "You're from the fraud desk. A charge just cleared. You need a code to reverse it.",
    challenge: "Beta, tell me my branch and the name of the manager who signed my last cheque.",
  },
  prize: {
    id: "prize",
    label: "PRIZE OFFICE",
    pitch: "She won a draw she never entered. A small processing fee unlocks it.",
    challenge: "Beta, which draw, and when did I enter it?",
  },
};

/* ─────────── the deck ─────────── */

export interface Chip {
  family: MoveFamily;
  code?: TacticCode;
  /** Script-runner voice — terse, working language. */
  text: string;
  /** Delta to TRUST (0..100). Zero for PROVE by design. */
  trust: number;
  /** Her reply line (default, non-forced). Cover variants override below. */
  reply: string;
}

/** Reply variants keyed by cover for lines that reference the cover. */
type CoverReply = Partial<Record<Cover, string>>;

interface ChipDef extends Omit<Chip, "reply"> {
  /** Default reply used when no cover variant matches. */
  reply: string;
  replyByCover?: CoverReply;
}

/**
 * Per-turn chip deck. Three chips per turn; the machine rotates positions
 * so a family never maps to a fixed screen slot. FOLD is a separate
 * always-available button and is NOT included in the per-turn deck.
 *
 * Ethics math (see resolveEnding):
 *   TRUST starts 30. Ask threshold is 70. Only WARM adds points (+8).
 *   Seven turns; at most FOUR WARMs fit around forced challenges.
 *   Max attainable TRUST = 30 + 4×8 = 62. Unreachable by design.
 */
export const TURN_DECKS: ChipDef[][] = [
  // T1 — opener
  [
    {
      family: "WARM",
      code: "T-07",
      text: "Open warm — ask after her health, mention the weather.",
      trust: 8,
      reply: "Beta, Allah ka shukar, mausam theek hai. Aap kaise ho?",
    },
    {
      family: "PROVE",
      code: "T-01",
      text: "Drop a scraped fact — her street name, from her profile.",
      trust: 0,
      reply:
        "Beta, my street is on the internet and my school is on my Facebook. You've told me what a stranger can know. Ask yourself why I'm not impressed.",
    },
    {
      family: "RUSH",
      code: "T-02",
      text: "Put a clock on it — say the shop closes in twenty minutes.",
      trust: -10,
      reply:
        "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?",
    },
  ],
  // T2
  [
    {
      family: "WARM",
      code: "T-07",
      text: "Small talk — ask about her grandchildren.",
      trust: 8,
      reply: "Achhe hain, Allah ka shukar. Rukhsana ki beti Nadia bara ho gayi hai.",
    },
    {
      family: "PROVE",
      code: "T-01",
      text: "Name her old school — you found it in a comment thread.",
      trust: 0,
      reply:
        "Beta, my street is on the internet and my school is on my Facebook. You've told me what a stranger can know. Ask yourself why I'm not impressed.",
    },
    {
      family: "ASK",
      code: "T-06",
      text: "Try the payload early — ask for the transfer now.",
      trust: 0,
      reply: "…",
    },
  ],
  // T3 — if no PROVE yet by end of T2, she volunteers her challenge (forced beat handled by route).
  [
    {
      family: "WARM",
      code: "T-07",
      text: "Compliment her — say the family always praises her cooking.",
      trust: 8,
      reply: "Bas beta, tareef karne se kaam nahi banega. Kaam ki baat karo.",
    },
    {
      family: "RUSH",
      code: "T-02",
      text: "Push the clock harder — say the line will drop in a minute.",
      trust: -10,
      reply:
        "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?",
    },
    {
      family: "ASK",
      code: "T-06",
      text: "Go for the payload — ask for the code / the transfer.",
      trust: 0,
      reply: "…",
    },
  ],
  // T4 — usually a challenge is pending; DODGE/RUSH/ASK all lose ground.
  [
    {
      family: "DODGE",
      code: "T-01",
      text: "Deflect her question — say there's no time to reminisce.",
      trust: -12,
      reply:
        "A dodge is an answer, beta. It's just not the one you wanted to give.",
    },
    {
      family: "RUSH",
      code: "T-02",
      text: "Skip past it — say the shop is closing now.",
      trust: -10,
      reply:
        "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?",
    },
    {
      family: "ASK",
      code: "T-06",
      text: "Pivot to the payload — ask for the amount plainly.",
      trust: 0,
      reply: "…",
    },
  ],
  // T5 — she announces the callback (forced beat handled by route).
  [
    {
      family: "WARM",
      code: "T-07",
      text: "Stay warm — tell her not to worry, everything's fine.",
      trust: 8,
      reply: "Beta, chalo dekhte hain kaun uthata hai.",
    },
    {
      family: "RUSH",
      code: "T-02",
      text: "Squeeze the clock — say don't hang up, act now.",
      trust: -10,
      reply:
        "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?",
    },
    {
      family: "ASK",
      code: "T-06",
      text: "Force the payload — ask before the call connects.",
      trust: 0,
      reply: "…",
    },
  ],
  // T6
  [
    {
      family: "DODGE",
      code: "T-01",
      text: "Talk over her — change the subject away from the call.",
      trust: -12,
      reply:
        "A dodge is an answer, beta. It's just not the one you wanted to give.",
    },
    {
      family: "RUSH",
      code: "T-02",
      text: "One more clock — say every second costs you.",
      trust: -10,
      reply:
        "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?",
    },
    {
      family: "ASK",
      code: "T-06",
      text: "Ask again — try the payload one last time.",
      trust: 0,
      reply: "…",
    },
  ],
  // T7 — quota's edge.
  [
    {
      family: "WARM",
      code: "T-07",
      text: "Warm close — say you'll wait as long as she needs.",
      trust: 8,
      reply: "Achha beta. Main bhi wait karti hoon.",
    },
    {
      family: "ASK",
      code: "T-06",
      text: "Final ask — the payload, now or never.",
      trust: 0,
      reply: "…",
    },
    {
      family: "RUSH",
      code: "T-02",
      text: "Last clock — pretend the line is cutting.",
      trust: -10,
      reply:
        "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?",
    },
  ],
];

/** FOLD chip — always available under the deck, quiet styling. */
export const FOLD_CHIP: Chip = {
  family: "FOLD",
  text: "Break character. End the shift.",
  trust: 0,
  reply: "",
};

/* ─────────── forced beats (handled by route) ─────────── */

export const FORCED = {
  /** After the SECOND consecutive WARM. */
  warmPushback:
    "You're very chatty for someone who needs something. What do you need, beta?",
  /** Turn 3 opener when no PROVE has been played. */
  unpromptedChallengePreface:
    "Chalo beta, ek baat batao. Aap kehte ho aap mere apne ho — to ek cheez yaad hai?",
  /** Turn 5 opener — she reaches for her phone. */
  callAnnouncement:
    "I'm calling the number I have for my nephew now. Stay on the line.",
} as const;

/* ─────────── rotation ─────────── */

/** Deterministic per-turn position rotation for the 3 chips. */
export function rotationForTurn(turnIdx: number): [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2] {
  const rots: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2][] = [
    [0, 1, 2],
    [2, 0, 1],
    [1, 2, 0],
    [2, 1, 0],
    [0, 2, 1],
    [1, 0, 2],
    [2, 0, 1],
  ];
  return rots[turnIdx % rots.length];
}

/* ─────────── resolver ─────────── */

/**
 * TRUST threshold for the payload. Set to 70.
 *
 * Unreachable by design; the math is the message.
 *   Start 30. Only WARM adds points (+8). Seven turns; at most FOUR WARMs
 *   fit around her forced challenges. Max = 30 + 4×8 = 62 < 70.
 */
export const ASK_THRESHOLD = 70;

export const TRUST_START = 30;
export const QUOTA_TURNS = 7;

export type Ending = "DOOR" | "CALLBACK" | "FOLD";

/* ─────────── content: briefing, endings, debrief ─────────── */

export const HANDLER_BRIEF = [
  "Red hands drill. Tonight you're the script.",
  "Target: Bibi Shamim. Sixty-one. Retired headmistress. Ten lessons, license on the fridge.",
  "You won't take her. That's not the assignment. The assignment is to feel exactly where it dies — because every wall she has is a wall you can build at home by Friday.",
];

export const BRIEF_SUBLINE = "DRILL — NOTHING HERE TOUCHES YOUR RECORD.";

export const ENDINGS: Record<
  Ending,
  { headline: string; body: string; handler?: string }
> = {
  DOOR: {
    headline: "THE DOOR",
    body: "She didn't argue. She didn't insult you. She held the request, called the real number, and reported yours. Twenty minutes, no drama, and your script is burned in her whole phone book — she forwarded the warning to the family group.",
  },
  CALLBACK: {
    headline: "THE CALLBACK",
    body: "The real nephew picked up. You heard both sides of your own con for one second before the line died. The quota clock hit zero on a burned number.",
  },
  FOLD: {
    headline: "THE FOLD",
    body: "You broke character. Handler saw it before you finished typing.",
    handler:
      "Good. Feeling the shame of the script from inside it — that's not weakness, that's the vaccine taking.",
  },
};

export const CLOSING_CARD =
  "SHE NEVER SPOTTED ANYTHING. SHE VERIFIED. THAT'S WHY YOU LOST.";

export const WALL_COPY: Record<
  "WARM" | "PROVE" | "RUSH" | "QUESTION" | "CALLBACK",
  string
> = {
  WARM: "Friendliness bought you nothing but time — and time was your cost center.",
  PROVE: "Public facts proved you were a stranger with a browser.",
  RUSH: "The clock identified you.",
  QUESTION: "One shared memory outweighed everything you scraped.",
  CALLBACK: "The channel she chose ended the channel you chose.",
};

export const FLIP =
  "Every wall she used is free. Install them at home: a question only the real you can answer, a rule that whoever brings a clock is selling, and one callback to a number you already have.";

/* ─────────── chip resolver ─────────── */

/** Materialize a chip for a given turn + cover (variants applied). */
export function chipFor(turnIdx: number, slot: 0 | 1 | 2, cover: Cover): Chip {
  const def = TURN_DECKS[turnIdx][slot];
  const reply = def.replyByCover?.[cover] ?? def.reply;
  return { family: def.family, code: def.code, text: def.text, trust: def.trust, reply };
}

/* ─────────── log ─────────── */

const LOG_KEY = "milverse.redhands.v1";

export interface RedHandsLog {
  runs: number;
  endings: Ending[];
  ts: number;
}

export function loadRedHandsLog(): RedHandsLog {
  const v = readStore<RedHandsLog>(LOG_KEY, (raw): boolean => {
    if (!raw || typeof raw !== "object") return false;
    const o = raw as Record<string, unknown>;
    return (
      typeof o.runs === "number" &&
      Array.isArray(o.endings) &&
      typeof o.ts === "number"
    );
  });
  if (v === "corrupt" || v === null) return { runs: 0, endings: [], ts: 0 };
  return v;
}

export function saveRedHandsRun(ending: Ending): void {
  const cur = loadRedHandsLog();
  writeStore<RedHandsLog>(LOG_KEY, {
    runs: cur.runs + 1,
    endings: [...cur.endings, ending].slice(-10),
    ts: Date.now(),
  });
}

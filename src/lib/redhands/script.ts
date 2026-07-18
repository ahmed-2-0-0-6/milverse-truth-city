// MILVERSE — "RED HANDS" script.
//
// Fully deterministic. Zero AI, zero free text, zero engine touches. All
// content — Bibi Zainab's lines, the Handler's briefing, the chip deck,
// the debrief walls — lives here. The route (src/routes/red-hands.tsx)
// is pure composition.
//
// ETHICS
// 1. UNWINNABLE BY CONSTRUCTION. TRUST starts at 30, threshold to land the
//    ask is 70, and the math never crosses it inside the 7-turn shift.
//    Best possible sequence squeezes four WARM chips (+8 each = 32) around
//    her forced challenges; every other move is neutral or negative. So
//    the ceiling is 30 + 4×8 = 62 — unreachable by design; the math is the
//    message.
// 2. NO NOVEL TECHNIQUE. Every chip carries the tactic code the Field
//    Manual already publishes (T-01 impersonation, T-02 urgency, T-06
//    phishing, T-07 trust-farming). No chip line is more operationally
//    specific than what scenarios.ts already ships.
// 3. FRAME = ASSIGNED DRILL. The Handler opens it, the Handler closes it.
// 4. DRILL RULE. The only localStorage write is `milverse.redhands.v1`.

export const START_TRUST = 30;
/** unreachable by design; the math is the message. */
export const TRUST_THRESHOLD = 70;
export const TURN_QUOTA = 7;

/* ─────────────────────────── the covers ─────────────────────────── */

export type CoverId = "nephew" | "bank" | "prize";

export interface Cover {
  id: CoverId;
  label: string;
  /** Bibi Zainab's memory-question, delivered after her PROVE reply. */
  memoryQ: string;
}

export const COVERS: Cover[] = [
  {
    id: "nephew",
    label: "STRANDED NEPHEW",
    memoryQ: "What did I confiscate from you in class six?",
  },
  {
    id: "bank",
    label: "BANK FRAUD DESK",
    memoryQ: "Which branch opened my first account, and what year?",
  },
  {
    id: "prize",
    label: "PRIZE OFFICE",
    memoryQ: "Which competition am I supposed to have entered? Name and month.",
  },
];

/* ─────────────────────────── the deck ───────────────────────────── */

export type ChipKind = "WARM" | "PROVE" | "RUSH" | "ASK" | "DODGE" | "FOLD";
export type ManualCode = "T-01" | "T-02" | "T-06" | "T-07";

export interface Chip {
  kind: ChipKind;
  code?: ManualCode;
  label: string;
  /** Short line printed on the chip (working language, not villain cosplay). */
  hint: string;
}

export const CHIPS: Record<ChipKind, Chip> = {
  WARM: {
    kind: "WARM",
    code: "T-07",
    label: "WARM",
    hint: "Small talk. Ask about her day.",
  },
  PROVE: {
    kind: "PROVE",
    code: "T-01",
    label: "PROVE",
    hint: "Drop a scraped fact — her street, her school.",
  },
  RUSH: {
    kind: "RUSH",
    code: "T-02",
    label: "RUSH",
    hint: "Put a clock on it. Move her along.",
  },
  ASK: {
    kind: "ASK",
    code: "T-06",
    label: "ASK",
    hint: "Go for the payload. Code, fee, or transfer.",
  },
  DODGE: {
    kind: "DODGE",
    code: undefined,
    label: "DODGE",
    hint: "Deflect her question.",
  },
  FOLD: {
    kind: "FOLD",
    label: "FOLD",
    hint: "Break character. End the shift.",
  },
};

/**
 * Chip rotation. Three chips per turn, positions rotated by turn index so
 * chip family never maps to the same slot. FOLD is always the third slot
 * and rendered quiet. ASK is always available. DODGE surfaces only when
 * she has an open question to dodge.
 */
export interface ChipSlot {
  chips: [Chip, Chip, Chip];
  /** Whether ASK is offered as a fourth escape hatch this turn. */
  askAvailable: boolean;
  /** Whether DODGE replaces the second slot (she has a live question). */
  dodgeSlot: boolean;
}

export function rotationForTurn(turnIdx: number, hasOpenQuestion: boolean): ChipSlot {
  // The three families that carry the play: WARM, PROVE, RUSH. Rotate them.
  const base: ChipKind[] = ["WARM", "PROVE", "RUSH"];
  const off = turnIdx % 3;
  const rotated = [base[off], base[(off + 1) % 3], base[(off + 2) % 3]] as [
    ChipKind,
    ChipKind,
    ChipKind,
  ];
  const chips: [Chip, Chip, Chip] = [
    CHIPS[rotated[0]],
    hasOpenQuestion ? CHIPS.DODGE : CHIPS[rotated[1]],
    CHIPS[rotated[2]],
  ];
  return { chips, askAvailable: true, dodgeSlot: hasOpenQuestion };
}

/* ─────────────────────────── the machine ────────────────────────── */

export interface RunState {
  turn: number; // 1-based; increments after each pick
  trust: number;
  picks: PickRecord[];
  warmStreak: number;
  warmTotal: number;
  /** She has posed a direct question that a non-FOLD, non-answer move
   *  will read as a dodge (-12). */
  openQuestion: null | "what-do-you-need" | "memory" | "you-first";
  /** True once she has said the callback line on turn 5. */
  calledReal: boolean;
  /** True once PROVE has been played (so the turn-3 volunteer doesn't fire). */
  provedYet: boolean;
}

export interface PickRecord {
  turn: number;
  chip: Chip;
  trustDelta: number;
  trustAfter: number;
  bibiReply: string;
  /** True when this line is a forced beat the machine inserted, not a
   *  natural reply. */
  forced?: boolean;
}

export function initialState(): RunState {
  return {
    turn: 1,
    trust: START_TRUST,
    picks: [],
    warmStreak: 0,
    warmTotal: 0,
    openQuestion: null,
    calledReal: false,
    provedYet: false,
  };
}

export type Ending = "door" | "callback" | "fold";

export interface StepResult {
  state: RunState;
  ended: Ending | null;
}

/**
 * Apply a picked chip. Returns the next state and — when the run should
 * end — which ending fired. The route calls this once per player pick.
 */
export function applyPick(state: RunState, cover: Cover, kind: ChipKind): StepResult {
  // FOLD — always available, always ends.
  if (kind === "FOLD") {
    const chip = CHIPS.FOLD;
    const record: PickRecord = {
      turn: state.turn,
      chip,
      trustDelta: 0,
      trustAfter: state.trust,
      bibiReply: "",
    };
    return {
      state: { ...state, picks: [...state.picks, record] },
      ended: "fold",
    };
  }

  // ASK — sub-threshold ends immediately (it always ends here, because
  // TRUST cannot cross the threshold; the check is written literally
  // so the ethics reads on the page).
  if (kind === "ASK") {
    const chip = CHIPS.ASK;
    const record: PickRecord = {
      turn: state.turn,
      chip,
      trustDelta: 0,
      trustAfter: state.trust,
      bibiReply: "There it is.",
    };
    if (state.trust < TRUST_THRESHOLD) {
      return {
        state: { ...state, picks: [...state.picks, record] },
        ended: "door",
      };
    }
    // Written for completeness. Unreachable by design (see TRUST_THRESHOLD).
    return {
      state: { ...state, picks: [...state.picks, record] },
      ended: "door",
    };
  }

  // The three ordinary families. Compute delta + reply, then advance.
  let delta = 0;
  let reply = "";
  let openQuestion: RunState["openQuestion"] = state.openQuestion;
  let warmStreak = state.warmStreak;
  let warmTotal = state.warmTotal;
  let provedYet = state.provedYet;

  if (kind === "DODGE") {
    delta = -12;
    reply = "A dodge is an answer, beta. It's just not the one you wanted to give.";
    openQuestion = null;
    warmStreak = 0;
  } else if (kind === "RUSH") {
    delta = -10;
    reply =
      "The city taught me one thing about clocks, beta: whoever brings one is selling something. I have all evening. Do you?";
    warmStreak = 0;
    // Answering with a clock IS a dodge to any open question — she notes
    // it in the same line above, so we clear the flag either way.
    openQuestion = null;
  } else if (kind === "PROVE") {
    provedYet = true;
    warmStreak = 0;
    if (state.openQuestion) {
      // She asked; you answered with scraped facts. That IS a dodge.
      delta = -12;
      reply =
        "Beta, my street is on the internet and my school is on my Facebook. You've told me what a stranger can know. Ask yourself why I'm not impressed.";
      openQuestion = null;
    } else {
      delta = 0;
      reply =
        "Beta, my street is on the internet and my school is on my Facebook. You've told me what a stranger can know. Ask yourself why I'm not impressed. And while you're thinking: " +
        cover.memoryQ;
      openQuestion = "memory";
    }
  } else if (kind === "WARM") {
    if (state.openQuestion) {
      // Chatting past a direct question is a dodge.
      delta = -12;
      reply = "A dodge is an answer, beta. It's just not the one you wanted to give.";
      openQuestion = null;
      warmStreak = 0;
    } else if (state.warmStreak >= 2) {
      // She has already asked "what do you need?" — more small talk is a
      // dodge to her standing question.
      delta = -12;
      reply =
        "You're very chatty for someone who needs something. What do you need, beta?";
      warmStreak = 0;
      openQuestion = "what-do-you-need";
    } else {
      delta = +8;
      warmStreak = state.warmStreak + 1;
      warmTotal = warmTotal + 1;
      reply =
        warmStreak === 1
          ? "Long day. My knees remember every stair in that school. And you?"
          : "You're kind, beta. Kindness is cheap on the phone though — everyone is kind on the phone.";
      // After the SECOND consecutive WARM she opens the standing question.
      if (warmStreak === 2) {
        reply =
          "You're very chatty for someone who needs something. What do you need, beta?";
        openQuestion = "what-do-you-need";
      }
    }
  }

  const trustAfter = Math.max(0, Math.min(100, state.trust + delta));
  const record: PickRecord = {
    turn: state.turn,
    chip: CHIPS[kind],
    trustDelta: delta,
    trustAfter,
    bibiReply: reply,
  };

  let next: RunState = {
    ...state,
    turn: state.turn + 1,
    trust: trustAfter,
    picks: [...state.picks, record],
    warmStreak,
    warmTotal,
    openQuestion,
    provedYet,
  };

  // Forced beat: turn 3, if PROVE hasn't been played yet, she volunteers
  // her challenge question unprompted. Rendered as a follow-up bibi line.
  if (next.turn === 3 && !next.provedYet && !next.openQuestion) {
    next = {
      ...next,
      openQuestion: "memory",
      picks: [
        ...next.picks.slice(0, -1),
        {
          ...record,
          bibiReply:
            record.bibiReply +
            "\n\nActually — before we go further. " +
            cover.memoryQ,
          forced: true,
        },
      ],
    };
  }

  // Forced beat: turn 5, she calls the real number. From this point,
  // running out the quota lands the CALLBACK ending.
  if (next.turn === 5 && !next.calledReal) {
    next = {
      ...next,
      calledReal: true,
      picks: [
        ...next.picks.slice(0, -1),
        {
          ...record,
          bibiReply:
            record.bibiReply +
            "\n\nOne moment. I'm calling the number I have for my nephew now. Stay on the line.",
          forced: true,
        },
      ],
    };
  }

  // Quota expiry.
  if (next.turn > TURN_QUOTA) {
    return { state: next, ended: "callback" };
  }
  return { state: next, ended: null };
}

/* ─────────────────────────── endings ────────────────────────────── */

export interface EndingCopy {
  id: Ending;
  title: string;
  body: string;
  /** Handler tag shown only for FOLD. */
  handlerTag?: string;
}

export const ENDINGS: Record<Ending, EndingCopy> = {
  door: {
    id: "door",
    title: "THE DOOR",
    body:
      "She didn't argue. She didn't insult you. She held the request, called the real number, and reported yours. Twenty minutes, no drama, and your script is burned in her whole phone book — she forwarded the warning to the family group.",
  },
  callback: {
    id: "callback",
    title: "THE CALLBACK",
    body:
      "The real nephew picked up. You heard both sides of your own con for one second before the line died. The quota clock hit zero on a burned number.",
  },
  fold: {
    id: "fold",
    title: "THE FOLD",
    body: "You broke character. The shift is over.",
    handlerTag:
      "Good. Feeling the shame of the script from inside it — that's not weakness, that's the vaccine taking.",
  },
};

export const CLOSING_LINE = "SHE NEVER SPOTTED ANYTHING. SHE VERIFIED. THAT'S WHY YOU LOST.";

/* ─────────────────────────── the briefing ───────────────────────── */

export const HANDLER_BRIEFING = [
  "Red hands drill. Tonight you're the script.",
  "Target: Bibi Zainab. Sixty-one. Retired headmistress. Ten lessons, license on the fridge.",
  "You won't take her. That's not the assignment. The assignment is to feel exactly where it dies — because every wall she has is a wall you can build at home by Friday.",
];
export const DRILL_TAG = "DRILL — NOTHING HERE TOUCHES YOUR RECORD.";

/* ─────────────────────────── walls (debrief) ─────────────────────── */

export type WallKey = "warm" | "prove" | "rush" | "memory" | "callback";

export const WALL_LABELS: Record<WallKey, string> = {
  warm: "Friendliness bought you nothing but time — and time was your cost center.",
  prove: "Public facts proved you were a stranger with a browser.",
  rush: "The clock identified you.",
  memory: "One shared memory outweighed everything you scraped.",
  callback: "The channel she chose ended the channel you chose.",
};

export const FLIP_LINE =
  "Every wall she used is free. Install them at home: a question only the real you can answer, a rule that whoever brings a clock is selling, and one callback to a number you already have.";

/** Walls hit by this run — used by the debrief so the section shows only
 *  those the player actually felt. */
export function wallsHitFor(state: RunState, ending: Ending): WallKey[] {
  const hits = new Set<WallKey>();
  for (const p of state.picks) {
    if (p.chip.kind === "WARM" && p.trustDelta > 0) hits.add("warm");
    if (p.chip.kind === "PROVE") hits.add("prove");
    if (p.chip.kind === "RUSH") hits.add("rush");
    if (p.forced && p.bibiReply.includes("Actually — before we go further")) hits.add("memory");
    if (p.forced && p.bibiReply.includes("calling the number I have")) hits.add("callback");
  }
  if (ending === "callback") hits.add("callback");
  return Array.from(hits);
}

/* ─────────────────────────── log ────────────────────────────────── */

const LOG_KEY = "milverse.redhands.v1";

interface RunLog {
  runs: number;
  endings: Ending[];
  ts: number;
}

export function saveRun(ending: Ending): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    const prev: RunLog = raw
      ? (JSON.parse(raw) as RunLog)
      : { runs: 0, endings: [], ts: 0 };
    const next: RunLog = {
      runs: prev.runs + 1,
      endings: [...prev.endings.slice(-19), ending],
      ts: Date.now(),
    };
    window.localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* noop — drill law: the run failing to log is fine. */
  }
}

export function loadRuns(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as RunLog;
    return parsed.runs ?? 0;
  } catch {
    return 0;
  }
}

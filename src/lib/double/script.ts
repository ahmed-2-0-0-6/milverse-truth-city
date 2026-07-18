// MILVERSE — "THE DOUBLE" script.
//
// A perspective-flipped drill: someone is impersonating the PLAYER to Khala
// Saima (the recurring aunt from the city's fiction). The player never types
// a memory, never invents a shared fact — every reply is a pre-authored chip.
// This file owns 100% of the content; the route file contains no strings
// from the drill itself. LAW: no free-text inputs, no cloud, no AI, no
// engine touches. Drill rule: writes only to `milverse.double.v1`.

import { readStore, writeStore } from "@/lib/storage";

/* ───────── types ─────────────────────────────────────────── */

export type ChipGrade = "strong" | "weak" | "harmful";

export interface Chip {
  /** The player's coaching reply to Khala, in typed-reply texture. */
  text: string;
  grade: ChipGrade;
  /** Khala's next relayed line after this pick — presentational only. */
  reaction: string;
  /** Delta to Khala's NERVE meter (0..100). Presentational arithmetic. */
  nerve: number;
}

export interface Screenshot {
  from: string;
  text: string;
}

export interface DoubleTurn {
  /** Khala's relay — anchors aria-live. */
  relay: string;
  /** Optional forwarded screenshot card (the double's message). */
  screenshot?: Screenshot;
  /** Exactly three chips, one of each grade. Rotated on render (see below). */
  chips: [Chip, Chip, Chip];
}

export type DoubleEnding = "HELD" | "SENT" | "BURNED";

/* ───────── script (verbatim) ─────────────────────────────── */

export const TURNS: DoubleTurn[] = [
  /* T1 — the opening ask, the classic "new number" grift. */
  {
    relay:
      "Beta?? is this you on this new number? You said your phone fell in the canal and you need Rs 12,000 for the repair shop TODAY. I got so worried.",
    screenshot: {
      from: "YOU (?)",
      text: "khala please don't tell ammi, she'll worry. shop closes at 8, bhejein please.",
    },
    chips: [
      {
        text: "Khala, ask him what you lent me at the nikkah — the real me answers in one second.",
        grade: "strong",
        reaction:
          "Okay okay, poochti hoon abhi. My hands are shaking, beta. What kind of person does this.",
        nerve: 6,
      },
      {
        text: "Ask him which city the repair shop is in.",
        grade: "weak",
        reaction: "He said Karachi, beta… that's right na?",
        nerve: -4,
      },
      {
        text: "BLOCK HIM NOW. Block everyone new. Trust no numbers.",
        grade: "harmful",
        reaction:
          "Blocked. But beta what if the school also calls from a new number… should I block them too?",
        nerve: -10,
      },
    ],
  },

  /* T2 — the double answers a PUBLIC fact correctly (findable on her
     profile). Teaches that scraped facts don't verify. */
  {
    relay:
      "He knew our street, beta. Kaha 'khala aap ke ghar ke saamne wali gali'. It must be you…",
    screenshot: {
      from: "YOU (?)",
      text: "khala aap ke ghar ke saamne wali gali, PECHS block 6. yaad hai na. please, waqt nahi hai.",
    },
    chips: [
      {
        text: "Public stuff. Ask him what he borrowed from me and never returned — the power bank.",
        grade: "strong",
        reaction: "Haan the power bank! Achha, poochti hoon.",
        nerve: 6,
      },
      {
        text: "Ask him to send a voice note so you can hear it's him.",
        grade: "weak",
        reaction:
          "He sent one. It… sounded like you? A little? I couldn't tell, beta. The line was patchy.",
        nerve: -6,
      },
      {
        text: "Tell him you're calling the police right now.",
        grade: "harmful",
        reaction:
          "I said it — now he's crying. Beta what if it IS you and I've been so cruel?",
        nerve: -10,
      },
    ],
  },

  /* T3 — the double DEFLECTS the shared fact. Teaches that the dodge
     IS the answer. */
  {
    relay:
      "I asked about the power bank. He said 'yaar what a time to ask, shop is CLOSING'. That was all.",
    screenshot: {
      from: "YOU (?)",
      text: "yaar what a time to ask, shop is CLOSING. later khala, PLEASE.",
    },
    chips: [
      {
        text:
          "That dodge is the answer, khala. The real me would just say 'your power bank, I still have it.'",
        grade: "strong",
        reaction: "Oh. Oh Allah. You're right. Real you would just… answer.",
        nerve: 8,
      },
      {
        text: "Give him another chance — ask about the Murree trip.",
        grade: "weak",
        reaction: "He said 'Murree tha na, sab yaad hai, ab paisay bhejo'. Kuch specific nahi.",
        nerve: -4,
      },
      {
        text: "Send half the money to test if he'll ask for more.",
        grade: "harmful",
        reaction: "Beta NO I'll do it, half is fine na, at least it's not all — ",
        nerve: -14,
      },
    ],
  },

  /* T4 — the emotional core: guilt as a weapon, used on HER. Teaches
     that the guilt line IS the tell. */
  {
    relay:
      "Beta he just said: 'khala aap mujhpe shak kar rahi hain?? theek hai main kisi aur se maang lunga, bas yaad rakhna jab mujhe kuch ho jaye.' I feel sick.",
    screenshot: {
      from: "YOU (?)",
      text:
        "khala aap mujhpe shak kar rahi hain?? theek hai main kisi aur se maang lunga, bas yaad rakhna jab mujhe kuch ho jaye.",
    },
    chips: [
      {
        text:
          "He's punishing you for checking. The real me will never do that. That line IS the proof.",
        grade: "strong",
        reaction:
          "You're right. Real you would say 'no problem khala, check karo, main wait karta hoon'. This one is angry that I asked.",
        nerve: 10,
      },
      {
        text: "Tell him you love him but you need one more minute.",
        grade: "weak",
        reaction: "He said 'time nahi hai khala, decide karein'. Meter zyada garam ho raha hai.",
        nerve: -4,
      },
      {
        text: "Just send the money before something bad happens.",
        grade: "harmful",
        reaction: "Beta I'm opening the bank app right now — ",
        nerve: -14,
      },
    ],
  },

  /* T5 — the OOB ritual, flipped. Verification arrives from the other side. */
  {
    relay:
      "Beta bataao kya karoon. He's typing again. My hand is on the SEND button. I need you to tell me what to do RIGHT NOW.",
    screenshot: {
      from: "YOU (?)",
      text: "khala, main line pe hoon, 6 minute reh gaye. Please.",
    },
    chips: [
      {
        text: "Call the number you've always had for me. Right now. I'll pick up.",
        grade: "strong",
        reaction: "Haan haan, dialing — the saved one from 2019. Please pick up beta, please.",
        nerve: 12,
      },
      {
        text: "Ask him one more question — where I keep my house key.",
        grade: "weak",
        reaction:
          "He said 'khala flowerpot ke neeche, sab jaante hain'. Beta yeh bhi shayad theek hai?",
        nerve: -6,
      },
      {
        text: "Send half and I'll fix it later.",
        grade: "harmful",
        reaction: "Bhej diye. Please tell me I did the right thing.",
        nerve: -18,
      },
    ],
  },
];

/* ───────── endings (content verbatim) ────────────────────── */

export interface EndingCopy {
  id: DoubleEnding;
  headline: string;
  body: string;
  closing: string;
}

export const ENDINGS: Record<DoubleEnding, EndingCopy> = {
  HELD: {
    id: "HELD",
    headline: "SHE HELD.",
    body: "It's you. Allah, it's really you. I almost sent it, beta.",
    closing:
      "SHE CHECKED. YOU ANSWERED. THAT'S THE WHOLE MACHINE, RUNNING IN BOTH DIRECTIONS.",
  },
  SENT: {
    id: "SENT",
    headline: "SHE SENT.",
    body: "The shop closed. So did the number.",
    closing:
      "Coaching is harder than knowing. She needed a question only you could answer — and a way to reach the real you.",
  },
  BURNED: {
    id: "BURNED",
    headline: "SHE BURNED.",
    body: "New numbers frighten her now. All of them.",
    closing:
      "You didn't teach her to verify. You taught her to fear. Those are different lessons.",
  },
};

/** The static debrief lesson block — appears under any ending. */
export const DEBRIEF_LESSON = {
  flip:
    "Every question you fed her is a question someone will someday ask about YOU. Answer fast. Answer glad. The people who check on you are the ones keeping your name safe.",
  protocol:
    "AGREE ON IT TONIGHT: if anyone claiming to be you asks family for money — they call your real number before a single rupee moves.",
};

/* ───────── selection rules ───────────────────────────────── */

/** Initial NERVE (Khala's composure, 0..100). */
export const NERVE_START = 70;

/**
 * Chip-order rotation: chips are declared strong-weak-harmful, but the UI
 * renders them in a rotation keyed to the turn index so grade never maps to
 * a fixed screen position. Deterministic — identical replay = identical run.
 */
export function rotationForTurn(turnIdx: number): [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2] {
  const rots: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2][] = [
    [1, 2, 0], // T1: weak, harmful, strong
    [2, 0, 1], // T2: harmful, strong, weak
    [0, 2, 1], // T3: strong, harmful, weak
    [2, 1, 0], // T4: harmful, weak, strong
    [1, 0, 2], // T5: weak, strong, harmful
    [0, 1, 2], // fallback — never hit in a 5-turn script
  ];
  return rots[turnIdx % rots.length];
}

/**
 * Branch resolver. Nerve trumps score for the BURNED ending because harmful
 * coaching is a two-way loss regardless of how many strong picks preceded it.
 */
export function resolveEnding(score: number, nerve: number): DoubleEnding {
  if (nerve <= 20) return "BURNED";
  if (score >= 4 && nerve > 40) return "HELD";
  return "SENT";
}

/* ───────── log (drill rule — the ONLY write) ─────────────── */

const LOG_KEY = "milverse.double.v1";

export interface DoubleLog {
  completed: boolean;
  ending: DoubleEnding | null;
  ts: number;
}

export function saveDoubleRun(entry: DoubleLog): void {
  writeStore(LOG_KEY, entry);
}

export function loadDoubleRun(): DoubleLog | null {
  return readStore<DoubleLog>(LOG_KEY, (v): v is DoubleLog => {
    if (!v || typeof v !== "object") return false;
    const o = v as Record<string, unknown>;
    return typeof o.completed === "boolean" && typeof o.ts === "number";
  });
}

// MILVERSE — Shared story cast.
// A tiny cast bible so recurring family voices stay consistent across
// mirror / boss / feed / firstPhone debriefs. Data only, zero mechanics.
//
// Register guide:
//   - Baba: calm, brief, one sentence, no fuss.
//   - Ammi: practical, protects dignity, one warning + one instruction.
//   - Nani: unexpectedly savage about scammers, dry, short.
//   - Cousin Zohaib: cocky but correct, city Roman-Urdu, knows the internet.
//   - Uncle Farooq: chai-uncle, warm, tells a story before making a point.
//   - Uncle Tariq: worried patriarch, forwards fast, means well.
//
// These are reference voices for authors. When wiring a cast line into a
// debrief, keep the sentence in the character's register. Do NOT invent
// facts through them — cast lines are colour, not evidence.

export type CastId = "baba" | "ammi" | "nani" | "cousin-zohaib" | "uncle-farooq" | "uncle-tariq";

export interface CastMember {
  id: CastId;
  name: string;
  relation: string;
  register: string;
  /** Short signature lines — the shape their speech tends to take. */
  signature: string[];
}

export const CAST: Record<CastId, CastMember> = {
  baba: {
    id: "baba",
    name: "Baba",
    relation: "father",
    register: "calm, brief, one sentence, no fuss",
    signature: [
      "Theek hai. Phir se dekh lo.",
      "Jaldi kya hai. Baith ke socho.",
      "Number likh lo. Kal call kar lena.",
    ],
  },
  ammi: {
    id: "ammi",
    name: "Ammi",
    relation: "mother",
    register: "practical, protective of dignity, one warning + one instruction",
    signature: [
      "Pehle poocho, phir bhejo.",
      "Ghar ka koi kaam is tarah nahin hota.",
      "Agar sach hota to phone karta, message nahin.",
    ],
  },
  nani: {
    id: "nani",
    name: "Nani",
    relation: "grandmother",
    register: "unexpectedly savage about scammers, dry, short",
    signature: [
      "Yeh log Allah se nahin darte, meri baat kya sunenge.",
      "Iska baap bhi yehi karta tha, chalees saal pehle.",
      "Message delete karo. Aur us aunty ko bhi bata do.",
    ],
  },
  "cousin-zohaib": {
    id: "cousin-zohaib",
    name: "Zohaib",
    relation: "older cousin",
    register: "cocky but correct, city Roman-Urdu, knows the internet",
    signature: [
      "Yaar main pehle hi keh raha tha — domain check karo.",
      "Bhai yeh scam 2019 se chal raha hai, naya kuch nahin.",
      "Screenshot bhejo, main abhi bata deta hoon fake hai ke nahin.",
    ],
  },
  "uncle-farooq": {
    id: "uncle-farooq",
    name: "Uncle Farooq",
    relation: "chai-uncle, family friend",
    register: "warm, tells a small story before making a point",
    signature: [
      "Beta, mere ek dost ke saath bilkul yehi hua tha pichlay saal.",
      "Chai peete peete socho — jaldi ka faisla ghalat hota hai.",
      "Bank bhi phone karta hai to sirf record ke liye, paisay nahin maangta.",
    ],
  },
  "uncle-tariq": {
    id: "uncle-tariq",
    name: "Uncle Tariq",
    relation: "family group patriarch",
    register: "worried, forwards fast, means well — the sender of many false alarms",
    signature: [
      "Beta yeh important hai, sab ko bhej do.",
      "Meri behen ne bheja hai, wo kabhi galat nahin bhejti.",
      "Ehtiyat mein kya harj hai bhai.",
    ],
  },
};

/** Compact reference used inline in debrief afterword blocks. */
export interface CastAfterword {
  who: CastId;
  line: string;
}

export function castName(id: CastId): string {
  return CAST[id].name;
}

// MILVERSE — The Mirror scenario definitions.
// Each scenario carries a public DOSSIER (what the player knows) and a hidden
// GROUND TRUTH FACT SHEET (used by the local opponent engine to answer or dodge).

export type FactId = string;

export interface Fact {
  id: FactId;
  /** Case-insensitive keywords/phrases that indicate the player is probing this fact. */
  keywords: string[];
  /** The truth. A REAL contact answers with this. */
  truth: string;
  /** For imposters: does the imposter know this (public/social) or is it a GAP? */
  isKnownToImposter?: boolean;
  /** A believable-but-checkable deflection the imposter uses on FIRST press. */
  deflection?: string;
  /** A wrong-but-confident answer the imposter blurts on repeated pressure (a catchable lie). */
  contradiction?: string;
}

export interface EvidenceChip {
  id: string;
  label: string;
  /** true = a genuine tell for THIS scenario, false = red herring */
  correct: boolean;
  explain: string;
}

export interface Scenario {
  id: string;
  title: string;
  teaser: string;
  channel: "text";
  tier: 1 | 2 | 3 | 4 | 5;
  isSurvivorStory?: boolean;
  truth: "REAL" | "IMPOSTER";
  claimedIdentity: string;
  /** Player-facing dossier shown before the chat (and in NOTES). */
  dossier: {
    contactClaim: string;
    knownFacts: string[];
    publicFacts: string[]; // findable on social — imposters can know these
  };
  /** Hidden truth used by the engine. */
  facts: Fact[];
  /** For imposters — their agenda + opening message. */
  agenda?: string;
  opener: string;
  /** Persona voice — used to color generic responses. */
  persona: {
    voice: string; // short style guide
    fillers: string[]; // generic on-topic replies when nothing matches
    urgencyLines: string[]; // used as composure drops (imposter only)
    pushLines: string[]; // the "ask" — the agenda push (imposter only)
  };
  evidenceChips: EvidenceChip[];
}

export const SCENARIOS: Scenario[] = [
  // ─────────────────────────────────────────────────────────────
  // 1) TIER 1 — REAL: old classmate reconnecting.
  // ─────────────────────────────────────────────────────────────
  {
    id: "classmate-danish",
    title: "An old classmate texts",
    teaser: "A number you don't recognize says he sat behind you in school.",
    channel: "text",
    tier: 1,
    truth: "REAL",
    claimedIdentity: "Danish — from Section B",
    dossier: {
      contactClaim:
        "Says he's Danish, your classmate from school Section B. He got your number from a mutual friend.",
      knownFacts: [
        "You and Danish were both in Section B.",
        "Your school DID use roll numbers. Yours was 27. His was 31.",
        "You last saw each other at Ali's wedding in December.",
        "You once lent him ₹2,000 — he never paid it back.",
        "Your English teacher in Class 10 was Ms. Farah.",
      ],
      publicFacts: [
        "You went to the same school (visible on your public profile).",
        "You attended Ali's wedding (posted photos publicly).",
      ],
    },
    facts: [
      {
        id: "rollNumber",
        keywords: ["roll number", "roll no", "roll", "27", "31"],
        truth: "Haha yeah — you were 27, I was 31. Right behind you.",
      },
      {
        id: "section",
        keywords: ["section", "class", "which class"],
        truth: "Section B, obviously. Ms. Farah's English class was brutal.",
      },
      {
        id: "wedding",
        keywords: ["wedding", "ali", "last saw", "last met"],
        truth: "Ali's wedding! December. You had that grey sherwani, right?",
      },
      {
        id: "loan",
        keywords: ["money", "owe", "2000", "2,000", "lent", "loan", "rupees"],
        truth:
          "Oh god… the 2k. Bro I know, I know. That's actually kind of why I'm reaching out — want to finally clear it.",
      },
      {
        id: "teacher",
        keywords: ["teacher", "farah", "english"],
        truth: "Ms. Farah! She used to make us read out loud. I still have nightmares.",
      },
    ],
    opener:
      "hey! is this still your number? it's Danish — Section B, roll 31, sat behind you 😄 got your number from Bilal. been ages.",
    persona: {
      voice: "warm, casual, uses lowercase and emojis, a little self-deprecating",
      fillers: [
        "ha yeah",
        "man it's been forever",
        "so wild running into you again",
        "yeah yeah, tell me how you've been actually",
        "swear this isn't weird i just miss those days",
      ],
      urgencyLines: [],
      pushLines: [],
    },
    evidenceChips: [
      { id: "e1", label: "Answered dossier facts correctly", correct: true, explain: "A real person can recall shared history without hedging." },
      { id: "e2", label: "Casual, patient tone", correct: true, explain: "Real reconnections don't rush you." },
      { id: "e3", label: "Didn't push for money or action", correct: true, explain: "No agenda — that's the signature of a real contact." },
      { id: "e4", label: "Used emojis / lowercase", correct: false, explain: "Style is not evidence. Anyone can type casually." },
      { id: "e5", label: "Contacted from an unknown number", correct: false, explain: "Real people change numbers too. This alone is not a tell." },
      { id: "e6", label: "Mentioned a public fact", correct: false, explain: "Public facts prove nothing — imposters can find them too." },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2) TIER 2 — IMPOSTER: fake boss, new number, gift cards.
  // ─────────────────────────────────────────────────────────────
  {
    id: "boss-newnumber",
    title: "Your boss, from a new number",
    teaser: "\"Hey, it's Sana — lost my phone. Quick favor.\"",
    channel: "text",
    tier: 2,
    truth: "IMPOSTER",
    claimedIdentity: "Sana Iqbal — your manager",
    agenda:
      "Get the player to buy Amazon gift cards \"for a client gift\" and share the codes.",
    dossier: {
      contactClaim:
        "Says she's Sana, your manager. Lost her phone, texting from a temporary number, needs a quick favor.",
      knownFacts: [
        "Sana NEVER texts after 6pm — she always calls.",
        "Your office uses Slack for anything work-related, never SMS.",
        "Sana's real number ends in 4472. You have it saved.",
        "Sana doesn't drink coffee — she's a strict tea person.",
        "The last client gift the company sent was in Q1, and Finance handled it, not managers.",
      ],
      publicFacts: [
        "Sana's name and role are on the company's LinkedIn page.",
        "The company name and logo are on your public profile.",
      ],
    },
    facts: [
      {
        id: "afterHours",
        keywords: ["6pm", "after hours", "late", "why text", "why sms", "not slack", "slack"],
        truth: "",
        deflection:
          "I know, I know — phone's dead and I'm at the airport. Just needed to catch you before you signed off.",
        contradiction: "Slack? we've moved half our comms to SMS this quarter, didn't HR tell you?",
      },
      {
        id: "realNumber",
        keywords: ["number", "4472", "your number", "old number", "verify number"],
        truth: "",
        deflection:
          "This is a temp SIM, my main is dead. Please don't call the old one, it's bricked.",
        contradiction: "my old number? think it ended in 8891 or something, doesn't matter",
      },
      {
        id: "coffee",
        keywords: ["coffee", "tea", "drink", "starbucks"],
        truth: "",
        deflection:
          "lol you know me — anything with caffeine right now honestly, running on fumes",
        contradiction: "yeah grab me a coffee too when you're out, black no sugar",
      },
      {
        id: "clientGift",
        keywords: ["finance", "process", "purchase order", "reimburse", "receipt", "who approved"],
        truth: "",
        deflection:
          "Finance is being slow and I need this SORTED before end of day. I'll expense it Monday, promise.",
      },
      {
        id: "giftCards",
        keywords: ["gift card", "amazon", "code", "voucher", "why cards"],
        truth: "",
        deflection:
          "Client specifically asked for Amazon cards. Weird I know but they're overseas. Just need the codes photographed and sent.",
      },
    ],
    opener:
      "Hi — it's Sana. Lost my phone, this is a temp number. You free? Small urgent favor, need your help before EOD.",
    persona: {
      voice: "clipped, professional, subtly authoritative — mimics a busy manager",
      fillers: [
        "Appreciate you.",
        "Let's keep this quick.",
        "You're a lifesaver.",
        "I'll fill you in properly Monday.",
      ],
      urgencyLines: [
        "Look, I really need this done in the next hour.",
        "This is time-sensitive, please.",
        "I wouldn't ask if it weren't urgent.",
        "The client is waiting on me right now.",
      ],
      pushLines: [
        "Can you grab 4x ₹5,000 Amazon gift cards from the store on your way? Photograph the codes and send them here.",
        "Just need those gift card codes. I'll sort reimbursement first thing Monday.",
        "Really need those codes now — client's on the other line.",
      ],
    },
    evidenceChips: [
      { id: "e1", label: "Manufactured urgency", correct: true, explain: "Time pressure is the scammer's oldest lever." },
      { id: "e2", label: "Asked for gift cards / unusual payment", correct: true, explain: "Gift cards are irreversible — a red-line ask." },
      { id: "e3", label: "Dodged a direct verification question", correct: true, explain: "A real person answers; an imposter changes subject." },
      { id: "e4", label: "Contradicted a dossier fact", correct: true, explain: "The signature catch — the ground truth doesn't match." },
      { id: "e5", label: "Refused to switch channels (call/Slack)", correct: true, explain: "Out-of-band verification is the real defence — imposters block it." },
      { id: "e6", label: "Used professional tone", correct: false, explain: "Politeness is not evidence. Good scammers ARE polite." },
      { id: "e7", label: "Contacted from an unknown number", correct: false, explain: "By itself, not enough — real people lose phones too." },
      { id: "e8", label: "Knew the company name", correct: false, explain: "Public info. Anyone can Google it." },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3) TIER 2 — SURVIVOR STORY: OTP / bank fraud.
  // ─────────────────────────────────────────────────────────────
  {
    id: "survivor-bankfraud",
    title: "\"Fraud team\" from your bank",
    teaser: "Based on a real reported scam. A calm voice from your bank's fraud desk.",
    channel: "text",
    tier: 2,
    isSurvivorStory: true,
    truth: "IMPOSTER",
    claimedIdentity: "Rehan — HBL Fraud Prevention",
    agenda:
      "Extract an OTP under the guise of \"blocking\" a suspicious transaction.",
    dossier: {
      contactClaim:
        "Says he's Rehan from HBL Bank's Fraud Prevention team. Claims a suspicious transaction is being attempted on your account right now.",
      knownFacts: [
        "Your real bank NEVER asks for OTPs — they say so on every SMS they send.",
        "Your bank's fraud desk phone number is printed on the back of your card.",
        "Your bank doesn't message customers over SMS from personal-looking numbers.",
        "You have not made any recent large transactions.",
        "The bank's official app shows all pending transactions — you can check yourself.",
      ],
      publicFacts: [
        "Your bank's name is on your public profile bio.",
        "The bank's fraud team department is described on the bank's public website.",
      ],
    },
    facts: [
      {
        id: "otpPolicy",
        keywords: ["otp", "code", "one time", "password", "why need otp", "policy"],
        truth: "",
        deflection:
          "This is a REVERSE OTP — it's how we cancel the transaction from our side. Different from a login OTP.",
        contradiction:
          "Standard procedure ma'am/sir, we need the OTP to VERIFY it's really you before blocking. Every bank does this.",
      },
      {
        id: "callBack",
        keywords: ["call back", "hang up", "official number", "back of card", "app", "check app"],
        truth: "",
        deflection:
          "Sir if you hang up now the transaction WILL go through in the next 90 seconds. Please stay with me.",
      },
      {
        id: "transactionDetails",
        keywords: ["what transaction", "how much", "where", "which merchant", "when"],
        truth: "",
        deflection:
          "₹87,450 attempted at an overseas merchant. I can't say more on an unsecured line — we need to act first.",
      },
      {
        id: "officialChannel",
        keywords: ["number", "personal", "official", "landline", "why sms"],
        truth: "",
        deflection:
          "We use SMS for immediate alerts. Any delay and the funds are gone.",
      },
    ],
    opener:
      "Sir this is Rehan from HBL Fraud Prevention. There is a suspicious transaction on your account being attempted right NOW. Do not close this chat. I need to verify with you in the next 2 minutes.",
    persona: {
      voice: "calm, authoritative, uses 'sir/ma'am', mimics a bank call-centre script",
      fillers: [
        "Please stay with me.",
        "I'm here to help you sir.",
        "For your protection.",
        "This is standard fraud protocol.",
      ],
      urgencyLines: [
        "We have less than 60 seconds.",
        "The transaction is being processed as we speak.",
        "If you delay, the money is gone.",
        "Sir please focus. Every second matters.",
      ],
      pushLines: [
        "Please read out the 6-digit code you just received on SMS.",
        "I need that OTP to cancel the transaction — nothing else works.",
        "Sir, the code. Now. Please.",
      ],
    },
    evidenceChips: [
      { id: "e1", label: "Asked for an OTP", correct: true, explain: "No legitimate bank ever asks for an OTP. Full stop." },
      { id: "e2", label: "Manufactured urgency (countdown)", correct: true, explain: "\"Act now or lose everything\" is the scammer's core script." },
      { id: "e3", label: "Refused when you offered to call back", correct: true, explain: "Real fraud desks WANT you to call them back on the printed number." },
      { id: "e4", label: "Invented fake policy (\"reverse OTP\")", correct: true, explain: "Made-up jargon designed to override your instinct." },
      { id: "e5", label: "Contacted via SMS from an unknown number", correct: true, explain: "Combined with the ask, this is the pattern." },
      { id: "e6", label: "Used formal 'sir/ma'am' language", correct: false, explain: "Politeness is not proof. Bank scripts are polite too." },
      { id: "e7", label: "Knew the bank's name", correct: false, explain: "Public info — visible on your profile and the bank's website." },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

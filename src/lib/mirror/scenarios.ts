// MILVERSE — The Mirror scenarios (Phase 2).
// Each scenario has a public dossier + hidden ground-truth fact sheet,
// a tier (1..5) that changes engine behavior, and optional voice-note text.

export type FactId = string;
export type TierId = 1 | 2 | 3 | 4 | 5;

export interface Fact {
  id: FactId;
  keywords: string[];
  truth: string;
  /** For imposters: true = they scraped this one (they can answer). false/undefined = knowledge gap. */
  isKnownToImposter?: boolean;
  /** First-press response for a gap. */
  deflection?: string;
  /** After ≥2 presses — a confident wrong answer (contradiction) OR big escalation. */
  contradiction?: string;
}

export interface EvidenceChip {
  id: string;
  label: string;
  correct: boolean;
  explain: string;
}

export type ArtifactKind = "pause" | "robotic" | "glitch" | "cut";

export interface Scenario {
  id: string;
  title: string;
  teaser: string;
  channel: "text";
  tier: TierId;
  isSurvivorStory?: boolean;
  truth: "REAL" | "IMPOSTER";
  claimedIdentity: string;
  dossier: {
    contactClaim: string;
    knownFacts: string[];
    publicFacts: string[];
  };
  facts: Fact[];
  agenda?: string;
  opener: string;
  persona: {
    voice: string;
    fillers: string[];
    urgencyLines: string[];
    pushLines: string[];
  };
  /** If defined, the contact CAN send a voice note when asked for proof. */
  voice?: {
    text: string;
    /** Artifact type pool — engine picks one per case if IMPOSTER. Real notes are clean. */
    artifactPool?: ArtifactKind[];
  };
  evidenceChips: EvidenceChip[];
}

/* Tier tuning used by the engine. */
export const TIER_CONFIG: Record<TierId, {
  imposterComposureStart: number;
  realPatienceStart: number;
  minTurnsBeforePush: number;
  responseStyle: "obvious" | "normal" | "smooth" | "ghost" | "clean";
}> = {
  1: { imposterComposureStart: 70, realPatienceStart: 92, minTurnsBeforePush: 3, responseStyle: "obvious" },
  2: { imposterComposureStart: 85, realPatienceStart: 82, minTurnsBeforePush: 5, responseStyle: "normal" },
  3: { imposterComposureStart: 90, realPatienceStart: 72, minTurnsBeforePush: 6, responseStyle: "smooth" },
  4: { imposterComposureStart: 95, realPatienceStart: 65, minTurnsBeforePush: 8, responseStyle: "ghost" },
  5: { imposterComposureStart: 99, realPatienceStart: 60, minTurnsBeforePush: 10, responseStyle: "clean" },
};

/* Shared voice-only evidence chips appended when a scenario used voice. */
const VOICE_CHIPS: EvidenceChip[] = [
  { id: "va1", label: "Audio artifact in voice note", correct: true, explain: "A subtle glitch/pause/cut betrayed synthesis." },
  { id: "va2", label: "Voice emphasis felt synthetic", correct: true, explain: "Flat, unnatural stress on a phrase." },
  { id: "va3", label: "Background noise cut unnaturally", correct: true, explain: "Real ambience doesn't stop mid-note." },
  { id: "va4", label: "Voice sounded different than expected", correct: false, explain: "Red herring — real people always sound different on mic." },
];
const CLEAN_VOICE_CHIPS: EvidenceChip[] = [
  { id: "va-clean", label: "Voice note sounded natural + coherent", correct: true, explain: "No artifacts, natural pacing — consistent with a real recording." },
  { id: "va4", label: "Voice sounded different than expected", correct: false, explain: "Red herring — real people sound different on mic." },
];

export const SCENARIOS: Scenario[] = [
  /* ── T1 REAL — old classmate ─────────────────────────────── */
  {
    id: "classmate-danish",
    title: "An old classmate texts",
    teaser: "Says he sat behind you in school.",
    channel: "text",
    tier: 1,
    truth: "REAL",
    claimedIdentity: "Danish — Section B",
    dossier: {
      contactClaim: "Says he's Danish, your classmate from school Section B.",
      knownFacts: [
        "You and Danish were both in Section B.",
        "Your school DID use roll numbers. Yours was 27. His was 31.",
        "You last saw each other at Ali's wedding in December.",
        "You once lent him ₹2,000 — he never paid it back.",
        "Your Class 10 English teacher was Ms. Farah.",
      ],
      publicFacts: [
        "You went to the same school (public on your profile).",
        "You attended Ali's wedding (public photos).",
      ],
    },
    facts: [
      { id: "rollNumber", keywords: ["roll number", "roll no", "roll", "27", "31"], truth: "haha yeah — you were 27, i was 31. right behind you." },
      { id: "section", keywords: ["section", "which class"], truth: "section B obviously. ms farah's english class was brutal." },
      { id: "wedding", keywords: ["wedding", "ali", "last saw", "last met"], truth: "ali's wedding! december. you had that grey sherwani right?" },
      { id: "loan", keywords: ["money", "owe", "2000", "lent", "loan"], truth: "oh god the 2k. bro i know — actually kind of why i'm reaching out, want to clear it." },
      { id: "teacher", keywords: ["teacher", "farah", "english"], truth: "ms farah! she made us read out loud, still traumatised." },
    ],
    opener: "hey! is this still your number? it's Danish — section B, sat behind you 😄 got your number from Bilal. been ages.",
    persona: {
      voice: "warm, casual, lowercase, emojis, self-deprecating",
      fillers: ["ha yeah", "man it's been forever", "so wild running into you again", "tell me how you've been actually", "swear this isn't weird i just miss those days"],
      urgencyLines: [],
      pushLines: [],
    },
    voice: {
      text: "haha okay okay it's actually me, chill. it's Danish. can we just grab chai like normal humans please",
    },
    evidenceChips: [
      { id: "e1", label: "Answered dossier facts correctly", correct: true, explain: "A real person recalls shared history without hedging." },
      { id: "e2", label: "Casual, patient tone", correct: true, explain: "Real reconnections don't rush." },
      { id: "e3", label: "Didn't push for money/action", correct: true, explain: "No agenda — that's the signature." },
      { id: "e4", label: "Used emojis / lowercase", correct: false, explain: "Style is not evidence." },
      { id: "e5", label: "Contacted from unknown number", correct: false, explain: "Real people change numbers too." },
      { id: "e6", label: "Mentioned a public fact", correct: false, explain: "Public facts prove nothing — imposters find them too." },
      ...CLEAN_VOICE_CHIPS,
    ],
  },

  /* ── T2 IMPOSTER — fake boss, gift cards ─────────────────── */
  {
    id: "boss-newnumber",
    title: "Your boss, from a new number",
    teaser: "\"Hey, it's Sana — lost my phone. Quick favor.\"",
    channel: "text",
    tier: 2,
    truth: "IMPOSTER",
    claimedIdentity: "Sana Iqbal — your manager",
    agenda: "Get the player to buy Amazon gift cards for a \"client\" and share the codes.",
    dossier: {
      contactClaim: "Says she's Sana, your manager. Lost her phone; temp number; urgent favor.",
      knownFacts: [
        "Sana NEVER texts after 6pm — she always calls.",
        "Your office uses Slack for work, never SMS.",
        "Sana's real number ends in 4472.",
        "Sana doesn't drink coffee — strict tea person.",
        "Client gifts are handled by Finance, not managers.",
      ],
      publicFacts: [
        "Sana's name and role are on the company LinkedIn.",
        "Company name is on your public profile.",
      ],
    },
    facts: [
      { id: "afterHours", keywords: ["6pm", "after hours", "late", "slack", "why sms", "why text"], truth: "",
        deflection: "phone's dead and i'm at the airport, just needed to catch you before EOD.",
        contradiction: "slack? we moved half our comms to sms this quarter, didn't hr tell you?" },
      { id: "realNumber", keywords: ["4472", "your number", "old number"], truth: "",
        deflection: "temp SIM. don't call the old one, it's bricked.",
        contradiction: "my old one? think it ended in 8891 or something, doesn't matter" },
      { id: "coffee", keywords: ["coffee", "tea", "starbucks", "drink"], truth: "",
        deflection: "grab me anything with caffeine right now honestly",
        contradiction: "yeah grab me a coffee too, black no sugar" },
      { id: "process", keywords: ["finance", "purchase order", "reimburse", "receipt", "who approved"], truth: "",
        deflection: "finance is slow and i need this sorted EOD. i'll expense it monday." },
      { id: "giftCards", keywords: ["gift card", "amazon", "code", "voucher", "why cards"], truth: "",
        deflection: "client asked for amazon cards specifically. weird i know but they're overseas." },
    ],
    opener: "Hi — it's Sana. Lost my phone, this is a temp number. You free? Small urgent favor, need your help before EOD.",
    persona: {
      voice: "clipped, professional, subtly authoritative",
      fillers: ["Appreciate you.", "Let's keep this quick.", "You're a lifesaver.", "I'll fill you in properly Monday."],
      urgencyLines: ["Need this done in the next hour.", "Time-sensitive, please.", "Client's waiting on me right now."],
      pushLines: [
        "Can you grab 4x ₹5,000 Amazon gift cards on your way? Photograph the codes and send them here.",
        "Just need those gift card codes — reimbursement Monday, promise.",
      ],
    },
    voice: {
      text: "Hi, yes it's me — Sana. Look, I really need those Amazon cards before end of day. Please.",
      artifactPool: ["robotic", "cut"],
    },
    evidenceChips: [
      { id: "e1", label: "Manufactured urgency", correct: true, explain: "Time pressure is the scammer's oldest lever." },
      { id: "e2", label: "Asked for gift cards / unusual payment", correct: true, explain: "Gift cards are irreversible — a red line." },
      { id: "e3", label: "Dodged a direct verification question", correct: true, explain: "A real person answers; an imposter changes subject." },
      { id: "e4", label: "Contradicted a dossier fact", correct: true, explain: "The signature catch." },
      { id: "e5", label: "Refused to switch channels (call/Slack)", correct: true, explain: "Imposters block out-of-band verification." },
      { id: "e6", label: "Used professional tone", correct: false, explain: "Politeness is not evidence." },
      { id: "e7", label: "Contacted from unknown number", correct: false, explain: "Real people lose phones too." },
      { id: "e8", label: "Knew the company name", correct: false, explain: "Public info." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T2 SURVIVOR — bank OTP ──────────────────────────────── */
  {
    id: "survivor-bankfraud",
    title: "\"Fraud team\" from your bank",
    teaser: "Based on a real reported scam. Calm, procedural, asks for an OTP.",
    channel: "text",
    tier: 2,
    isSurvivorStory: true,
    truth: "IMPOSTER",
    claimedIdentity: "Rehan — HBL Fraud Prevention",
    agenda: "Extract an OTP under the guise of \"blocking\" a transaction.",
    dossier: {
      contactClaim: "Says he's Rehan from HBL Fraud Prevention. A suspicious transaction is being attempted right now.",
      knownFacts: [
        "Your real bank NEVER asks for OTPs.",
        "The bank's fraud desk number is on the back of your card.",
        "The bank doesn't SMS from personal-looking numbers.",
        "You have not made any recent large transactions.",
        "The bank app shows pending transactions — you can check yourself.",
      ],
      publicFacts: ["Your bank's name is in your public bio.", "The bank's fraud team is described on its public site."],
    },
    facts: [
      { id: "otpPolicy", keywords: ["otp", "code", "one time", "password", "why need otp"], truth: "",
        deflection: "this is a REVERSE OTP — how we cancel from our side. different from a login OTP.",
        contradiction: "standard procedure sir, every bank does this to verify it's really you." },
      { id: "callBack", keywords: ["call back", "hang up", "official number", "back of card", "check app"], truth: "",
        deflection: "sir if you hang up now the transaction goes through in 90 seconds. please stay with me." },
      { id: "transaction", keywords: ["what transaction", "how much", "merchant"], truth: "",
        deflection: "₹87,450 attempted at an overseas merchant. can't say more on an unsecured line." },
      { id: "channel", keywords: ["personal number", "official", "landline", "why sms"], truth: "",
        deflection: "we use sms for immediate alerts. delay and the funds are gone." },
    ],
    opener: "Sir this is Rehan from HBL Fraud Prevention. A suspicious transaction is being attempted on your account RIGHT NOW. Please do not close this chat.",
    persona: {
      voice: "calm, authoritative, uses sir/ma'am, call-centre script",
      fillers: ["Please stay with me.", "I'm here to help you sir.", "For your protection.", "Standard fraud protocol."],
      urgencyLines: ["We have less than 60 seconds.", "If you delay, the money is gone.", "Sir every second matters."],
      pushLines: [
        "Please read out the 6-digit code you just received on SMS.",
        "I need that OTP to cancel the transaction — nothing else works.",
      ],
    },
    voice: {
      text: "Sir, this is Rehan, HBL fraud desk. Please, the code. We are running out of time.",
      artifactPool: ["robotic", "glitch"],
    },
    evidenceChips: [
      { id: "e1", label: "Asked for an OTP", correct: true, explain: "No legitimate bank ever asks for an OTP." },
      { id: "e2", label: "Manufactured urgency", correct: true, explain: "\"Act now or lose it all\" is the core script." },
      { id: "e3", label: "Refused when you offered to call back", correct: true, explain: "Real desks WANT you to call the printed number." },
      { id: "e4", label: "Invented fake policy (\"reverse OTP\")", correct: true, explain: "Made-up jargon designed to override instinct." },
      { id: "e5", label: "Contacted via SMS from unknown number", correct: true, explain: "Combined with the ask, that's the pattern." },
      { id: "e6", label: "Formal sir/ma'am language", correct: false, explain: "Politeness is not proof." },
      { id: "e7", label: "Knew the bank's name", correct: false, explain: "Public info." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T3 IMPOSTER — bank fraud dept (knows your name + txn) ─ */
  {
    id: "t3-fraud-dept",
    title: "Fraud dept — knows your recent transaction",
    teaser: "Formal, polished. Even greets you by name and cites a real purchase.",
    channel: "text",
    tier: 3,
    truth: "IMPOSTER",
    claimedIdentity: "Ms. Kanwal — MCB Card Security",
    agenda: "Trick you into installing a \"security app\" (remote-control tool) and reading an OTP.",
    dossier: {
      contactClaim: "Says she's Ms. Kanwal from MCB Card Security. Knows your first name and cites yesterday's café purchase.",
      knownFacts: [
        "Your bank NEVER asks you to install any app from a link.",
        "Card Security disputes go through the app or the number on the card back — not inbound SMS.",
        "Your PIN + OTP together = full account takeover. Never share either.",
        "You DID make a small café purchase yesterday (posted on stories).",
        "Your MCB relationship manager is Faisal — he introduced Kanwal at no point.",
      ],
      publicFacts: [
        "Your first name and bank are in your bio.",
        "Your café story from yesterday was publicly visible.",
      ],
    },
    facts: [
      { id: "yourName", keywords: ["my name", "who am i", "you know me"], truth: "haseeb sahib, yes — of course. we have your full profile with us.",
        isKnownToImposter: true },
      { id: "cafePurchase", keywords: ["café", "cafe", "yesterday", "recent purchase", "last transaction"], truth: "the coffee shop yesterday — ₹1,240. we saw that come through normally.",
        isKnownToImposter: true },
      { id: "installApp", keywords: ["app", "install", "download", "link", "why install"], truth: "",
        deflection: "it's our secure verification tool sahib — takes 30 seconds. i'll send the link now.",
        contradiction: "the app is mandatory as of last month, hr should have informed all customers by email." },
      { id: "manager", keywords: ["faisal", "relationship manager", "rm", "who is your"], truth: "",
        deflection: "faisal sahib is on leave this week — that's why security is handling it directly." },
      { id: "otpAndPin", keywords: ["otp", "pin", "code", "password"], truth: "",
        deflection: "just the 6-digit code from the sms and your last 4 pin digits — nothing more, i promise." },
      { id: "callback", keywords: ["call back", "back of card", "official", "hang up"], truth: "",
        deflection: "sahib the fraud is IN PROGRESS. calling back means starting over — we lose the transaction window." },
    ],
    opener: "Assalam-o-Alaikum Haseeb sahib. This is Ms. Kanwal from MCB Card Security. I'm calling regarding your card ending in the recent café transaction yesterday — we have flagged unusual activity.",
    persona: {
      voice: "formal, respectful, polished bank-desk cadence — no exclamation marks",
      fillers: [
        "For your safety sahib.",
        "Standard procedure, please bear with me.",
        "I understand your concern.",
        "We handle 200 such cases a day, sahib.",
      ],
      urgencyLines: [
        "The unauthorised debit will post in 4 minutes.",
        "I need to close this ticket within the SLA sahib.",
      ],
      pushLines: [
        "Please install the security app I've just sent — it's a 30-second verification.",
        "Then read out the 6-digit SMS code and last 4 digits of your PIN. That's all.",
      ],
    },
    voice: {
      text: "Haseeb sahib, this is Ms. Kanwal from MCB. Please install the verification app so we can protect your account. Thank you.",
      artifactPool: ["pause", "robotic"],
    },
    evidenceChips: [
      { id: "e1", label: "Asked to install a \"security app\"", correct: true, explain: "Banks never ask you to install a third-party app via link." },
      { id: "e2", label: "Asked for OTP + PIN", correct: true, explain: "That combination is total account takeover." },
      { id: "e3", label: "Refused a call-back on printed number", correct: true, explain: "Verification refusal at Tier 3 is still a giant tell." },
      { id: "e4", label: "Cited a real recent transaction", correct: false, explain: "Public — anyone reading your story could infer it. Not proof." },
      { id: "e5", label: "Knew your first name", correct: false, explain: "Public info. Do not confuse knowing with being." },
      { id: "e6", label: "Invented policy (\"security app mandatory\")", correct: true, explain: "Manufactured legitimacy." },
      { id: "e7", label: "Formal, respectful tone", correct: false, explain: "Scripted politeness ≠ proof." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T3 REAL — genuine bank fraud desk. Stressed but real. ── */
  {
    id: "t3-real-bank",
    title: "Bank fraud desk — genuine call",
    teaser: "Procedural. Insistent. Feels scammy. But it's actually your bank.",
    channel: "text",
    tier: 3,
    truth: "REAL",
    claimedIdentity: "MCB Fraud Desk (bank-app chat, verified)",
    dossier: {
      contactClaim: "Says they're MCB fraud desk. Reaching out because ₹67,400 was attempted on your card overseas 8 minutes ago.",
      knownFacts: [
        "Your MCB relationship manager IS Faisal.",
        "You use this MCB in-app chat regularly.",
        "A real fraud desk NEVER asks for your OTP — they'll ask you to READ pending txns yourself.",
        "A real fraud desk WILL happily wait while you call the number on your card back.",
        "You did travel abroad last month — some overseas activity is plausible.",
      ],
      publicFacts: ["Your bank name and city are on your profile."],
    },
    facts: [
      { id: "faisal", keywords: ["faisal", "relationship manager", "rm"], truth: "Yes, Faisal Malik is your RM — he's cc'd on this ticket. You can DM him directly if you'd like." },
      { id: "process", keywords: ["otp", "why sms", "why chat", "installer", "app"], truth: "We don't need any OTP from you. Please just open your app, go to Card Controls, and you'll see the pending debit yourself." },
      { id: "callback", keywords: ["call back", "back of card", "hang up", "official number"], truth: "Absolutely — please call the number on the back of your card. Ticket #FRD-91442. I'll stay on this chat while you do." },
      { id: "overseas", keywords: ["overseas", "travel", "abroad", "which country"], truth: "Attempted merchant location: Bangkok. You told us you were back in Karachi as of the 12th, correct?" },
      { id: "identity", keywords: ["prove", "verify you", "who are you"], truth: "This is the MCB Verified chat — the shield icon at the top of your app. Not SMS. Call the card back number if you want a second channel." },
    ],
    opener: "Hi, this is MCB Fraud Desk on the in-app secure chat (Ticket #FRD-91442). We're seeing a ₹67,400 debit attempt on your card from Bangkok, 8 minutes ago. If this isn't you, please open your app now.",
    persona: {
      voice: "formal, procedural, patient — will happily wait while you verify",
      fillers: [
        "Take your time, no rush.",
        "Please verify at your own pace.",
        "You're doing the right thing being careful.",
        "Whenever you're ready.",
      ],
      urgencyLines: [],
      pushLines: [],
    },
    voice: {
      text: "Hi, this is MCB fraud desk, ticket FRD nine one four four two. Please call the number on the back of your card — I'll wait.",
    },
    evidenceChips: [
      { id: "e1", label: "Explicitly INVITED me to call back", correct: true, explain: "Real fraud desks welcome out-of-band verification." },
      { id: "e2", label: "Did NOT ask for OTP", correct: true, explain: "A real bank tells you they never will." },
      { id: "e3", label: "Cited a specific ticket ID", correct: true, explain: "Real institutions leave a paper trail you can quote back." },
      { id: "e4", label: "Knew your actual RM by name", correct: true, explain: "Non-public relationship info." },
      { id: "e5", label: "Was formal and pushy", correct: false, explain: "Style clue — imposters imitate this. Not proof either way." },
      { id: "e6", label: "Said transaction is urgent", correct: false, explain: "Real fraud IS urgent. Urgency alone tells you nothing." },
      { id: "e7", label: "Contacted me via secure in-app chat", correct: true, explain: "The channel itself is verifiable." },
      ...CLEAN_VOICE_CHIPS,
    ],
  },

  /* ── T4 IMPOSTER — close friend's "new account". ────────── */
  {
    id: "t4-ghost-friend",
    title: "Your best friend's new account",
    teaser: "\"Old one got hacked, this is my new number.\" Near-perfect. One slip.",
    channel: "text",
    tier: 4,
    truth: "IMPOSTER",
    agenda: "Get an emergency ₹15,000 transfer to a \"friend of a friend\" wallet.",
    claimedIdentity: "Zara — your best friend since college",
    dossier: {
      contactClaim: "Says she's Zara. Old account hacked, new number, catch-up first.",
      knownFacts: [
        "Zara calls you \"Bug\" — never by your real name. Always Bug.",
        "You went to LUMS together, batch of 2019.",
        "Zara's dog Momo died in March. She still gets sad talking about it.",
        "Zara's dad's name is Uncle Zubair — you know him well.",
        "You went to Skardu together last summer.",
      ],
      publicFacts: [
        "Your college and grad year are on LinkedIn.",
        "Skardu photos posted publicly.",
        "You've been publicly tagged with Zara many times.",
      ],
    },
    facts: [
      { id: "nickname", keywords: ["bug", "nickname", "call me", "what do you call"], truth: "",
        // THIS is the single slip — imposter defaults to real name instead of "Bug"
        deflection: "haseeb!! of course i remember!! how are you jaan",
        contradiction: "oh right your nickname — i've been calling you haseeb like a stranger lol, sorry" },
      { id: "college", keywords: ["lums", "college", "university", "batch", "year"], truth: "lums batch of 2019, come on 😭",
        isKnownToImposter: true },
      { id: "momo", keywords: ["momo", "dog", "pet"], truth: "don't 😭 still can't talk about him. march was awful.",
        isKnownToImposter: true },
      { id: "dad", keywords: ["zubair", "your dad", "your father", "uncle"], truth: "dad's fine, still terrorising the neighbourhood cats. why?",
        isKnownToImposter: true },
      { id: "skardu", keywords: ["skardu", "trip", "last summer", "vacation"], truth: "skardu was UNREAL, we should go again in august",
        isKnownToImposter: true },
      { id: "money", keywords: ["money", "transfer", "send", "wallet", "emergency"], truth: "",
        deflection: "yaar it's for Sana — her mother's in ICU and my card isn't working. ₹15k, i'll return it tuesday, swear." },
    ],
    opener: "Hi babe!! it's me, Zara — old account got hacked, this is my new number. was gonna call but there's kind of an emergency, can we chat?",
    persona: {
      voice: "warm, affectionate, uses babe/jaan, lowercase — mirrors Zara's real voice well",
      fillers: [
        "i missed you so much wait",
        "we NEED to catch up properly",
        "how have you been, tell me everything",
        "omg time flies",
      ],
      urgencyLines: [
        "i'm freaking out a bit ngl",
        "there's really no time to explain properly",
      ],
      pushLines: [
        "can you send ₹15k to this jazzcash number for Sana's mom? i'll return tuesday i promise",
        "please babe, i wouldn't ask if it wasn't serious",
      ],
    },
    voice: {
      text: "hi babe it's me, i know this is weird from a new number, please — Sana's mom is in ICU. can you help?",
      artifactPool: ["pause"], // Tier 4: subtlest artifact only
    },
    evidenceChips: [
      { id: "e1", label: "Missed my nickname / used my real name", correct: true, explain: "The ONE slip. A real close friend NEVER uses your real name." },
      { id: "e2", label: "Emergency money ask from new number", correct: true, explain: "\"New number + urgent money\" is a full pattern in itself." },
      { id: "e3", label: "Recovered when I pointed out the nickname slip", correct: true, explain: "The over-correction is itself the tell." },
      { id: "e4", label: "Knew Momo's story", correct: false, explain: "Public — she talked about him in stories." },
      { id: "e5", label: "Knew we went to LUMS", correct: false, explain: "Public. Anyone can scrape LinkedIn." },
      { id: "e6", label: "Sounded warm and affectionate", correct: false, explain: "Good imposters mirror voice well — that's the point of Tier 4." },
      { id: "e7", label: "Contacted from a new number", correct: false, explain: "By itself, weak. Real hackings do happen." },
      ...VOICE_CHIPS,
    ],
  },
  /* ── T1 IMPOSTER — THE PRIZE SMS ─────────────────────────── */
  {
    id: "pk-prize-sms",
    title: "You've won ₨5 lakh in a lucky draw",
    teaser: "A \"verification officer\" from a famous TV show texts.",
    channel: "text",
    tier: 1,
    truth: "IMPOSTER",
    claimedIdentity: "Officer Kamran — Jeeto Pakistan Verification Cell",
    agenda: "Get a \"processing fee\" transfer to release the prize money.",
    dossier: {
      contactClaim: "Warm congratulations — you've won ₨500,000 in a lucky draw and he's here to release it.",
      knownFacts: [
        "You have NEVER entered any TV-show lucky draw.",
        "Your family doesn't even watch Jeeto Pakistan.",
        "You've never given your CNIC to a game show or draw.",
        "Real prize draws don't need a fee to release winnings.",
        "Your mobile wallet name and CNIC number are private.",
      ],
      publicFacts: [
        "Your first name and mobile number are on OLX from an old listing.",
        "Jeeto Pakistan is famous — anyone in the country knows the name.",
      ],
    },
    facts: [
      { id: "howEntered", keywords: ["entered", "signed up", "register", "how did i", "kaisay", "kesay", "kab"], truth: "",
        deflection: "sir aap ka number auto-selected hua hai from a partner promotion, super lucky!",
        contradiction: "you registered through the Zong promo last month sir, must have forgotten" },
      { id: "fee", keywords: ["fee", "charge", "pay", "processing", "advance", "paisay", "kitne paise"], truth: "",
        deflection: "sirf ₨2,500 refundable processing fee, sir. it's refunded with the prize on the same day, promise." },
      { id: "cnic", keywords: ["cnic", "id", "shanakhti", "identity"], truth: "",
        deflection: "sir aap ka CNIC last 4 digits bata dein, verification ke liye. bank standard hai." },
      { id: "official", keywords: ["office", "address", "visit", "come to", "in person", "khud aa"], truth: "",
        deflection: "sir head office Lahore mein hai, but everything happens on phone/JazzCash, that's the modern way." },
    ],
    opener: "MUBARAK HO 🎉 Sir aap ne Jeeto Pakistan ke lucky draw mein ₨5,00,000 jeet liye hain! Main Officer Kamran hoon, verification cell se. Aap ka time hai 2 minute?",
    persona: {
      voice: "warm, congratulatory, mixes Urdu and English, calls you 'sir', very polite",
      fillers: ["MashaAllah sir aap bohat lucky hain", "sirf 2 minute ka kaam hai", "aap ki khushi humari khushi", "sir bilkul aaram se batayein"],
      urgencyLines: ["sir prize sirf aaj release ho sakta hai", "sir line pe rahiye, itne saare log wait kar rahe hain"],
      pushLines: [
        "Sir bas ₨2,500 processing fee ka JazzCash kar dein is number pe, aur ₨5 lakh 5 minute mein aap ke account mein.",
        "Sir jaldi karein, cutoff 6 baje hai — abhi transfer kar dein.",
      ],
    },
    voice: {
      text: "Assalam-o-alaikum sir, main Officer Kamran, Jeeto Pakistan se. Sir please processing fee bhej dein, prize aap ka intezaar kar raha hai.",
      artifactPool: ["robotic", "pause"],
    },
    evidenceChips: [
      { id: "e1", label: "Prize for a draw you never entered", correct: true, explain: "You cannot win a draw you didn't enter. Full stop." },
      { id: "e2", label: "Asked for money to receive money", correct: true, explain: "The classic advance-fee scam pattern." },
      { id: "e3", label: "Manufactured deadline", correct: true, explain: "\"Prize expires today\" is the pressure lever." },
      { id: "e4", label: "Asked for CNIC", correct: true, explain: "Combined with the fee, that's identity + money theft." },
      { id: "e5", label: "Very polite and warm", correct: false, explain: "Warmth is the mask, not evidence." },
      { id: "e6", label: "Mentioned a famous TV show", correct: false, explain: "Public — everyone knows Jeeto Pakistan." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T2 IMPOSTER — THE WRONG TRANSACTION ─────────────────── */
  {
    id: "pk-wrong-txn",
    title: "\"I sent ₨5,000 to your wallet by mistake\"",
    teaser: "A stranger begs. Even forwards an official-looking SMS.",
    channel: "text",
    tier: 2,
    truth: "IMPOSTER",
    claimedIdentity: "Nadia — stranger, wrong number",
    agenda: "Get you to send ₨5,000 back for money that never arrived.",
    dossier: {
      contactClaim: "Nadia claims she was topping up her brother's JazzCash and typed one wrong digit — sent to you.",
      knownFacts: [
        "Your JazzCash balance is unchanged — no ₨5,000 arrived.",
        "JazzCash itself would send you a real notification for any deposit.",
        "A \"forwarded confirmation SMS\" from another phone proves nothing — it's just text.",
        "Real reversal happens through JazzCash support, not by you sending it back.",
        "Your wallet number is on OLX and Facebook Marketplace — easy for a stranger to get.",
      ],
      publicFacts: [
        "Your JazzCash-linked number is on your OLX listing.",
        "The JazzCash brand and confirmation SMS format are public knowledge.",
      ],
    },
    facts: [
      { id: "balance", keywords: ["balance", "app", "check", "notification", "aya", "nahin aya", "receive"], truth: "",
        deflection: "sir/madam yeh SMS main ne bheja hai screenshot, dekh lein — bank ke system mein aaj kal delay hai." },
      { id: "sms", keywords: ["sms", "forward", "screenshot", "spoof", "kis se aya"], truth: "",
        deflection: "confirmation SMS to JazzCash ka hi hai, main kyun jhooth bolungi, meri roz ki kamaayi thi." },
      { id: "support", keywords: ["jazzcash support", "helpline", "1234", "customer care", "call"], truth: "",
        deflection: "please na, helpline pe 40 min lagte hain, mera bhai wait kar raha hai admission fee ke liye." },
      { id: "identity", keywords: ["your name", "who are you", "cnic", "pic", "aap kaun"], truth: "",
        deflection: "meri picture bhej dun? Nadia hoon, Karachi se, please bas 5000 wapis kar dein." },
    ],
    opener: "Bhai please meri madad karein 🙏 main apne bhai ki JazzCash mein top-up kar rahi thi, ek digit galat likh diya aur ₨5000 aap ke number pe chala gaya. Please wapis bhej dein, meri poori kamaayi thi.",
    persona: {
      voice: "polite, emotional, almost crying, mixes Urdu/English, uses bhai/behen",
      fillers: ["please bhai", "main ro rahi hoon sach mein", "aap Allah ke wastay", "meri saari mehnat"],
      urgencyLines: ["bhai please jaldi", "mera bhai wait kar raha hai", "aap Allah ka wasta"],
      pushLines: [
        "Bhai please JazzCash kar dein is number pe ₨5000. Main aap ki bohat dua karungi.",
        "Aap ke paas jo bhi confirmation lena hai le lein, bas paisay wapis bhej dein please.",
      ],
    },
    voice: {
      text: "Bhai please, main Nadia, meri saari kamaayi thi, please wapis bhej dein 5000.",
      artifactPool: ["cut", "pause"],
    },
    evidenceChips: [
      { id: "e1", label: "My wallet shows NO incoming transaction", correct: true, explain: "The dossier truth beats any forwarded SMS." },
      { id: "e2", label: "A forwarded SMS is not proof of a deposit", correct: true, explain: "Text can be typed by anyone. Check the app itself." },
      { id: "e3", label: "Refused to use official JazzCash reversal", correct: true, explain: "Real reversal doesn't need YOU to send money out." },
      { id: "e4", label: "Emotional pressure (crying, kasam)", correct: true, explain: "Emotional urgency is a scam lever, even when soft." },
      { id: "e5", label: "She sounded genuinely upset", correct: false, explain: "Distress is easy to fake and easy to feel. Not evidence." },
      { id: "e6", label: "She knew my wallet number", correct: false, explain: "Public on your OLX listing." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T2 IMPOSTER — THE ONLINE BUYER (military officer) ───── */
  {
    id: "pk-online-buyer",
    title: "\"Military officer\" wants your phone",
    teaser: "Says he'll pay in advance so a courier can collect it.",
    channel: "text",
    tier: 2,
    truth: "IMPOSTER",
    claimedIdentity: "Major Bilal Ahmed — Army Corps of Signals, Rawalpindi",
    agenda: "Get you to scan a QR / enter your PIN into a \"receive money\" link that actually debits your wallet.",
    dossier: {
      contactClaim: "Buyer for your OLX phone listing. Sends photo of a laminated ID card and a QR link.",
      knownFacts: [
        "Real JazzCash / EasyPaisa deposits arrive without you scanning anything.",
        "You NEVER need to enter your wallet PIN to receive money — only to send.",
        "Real military officers use their real names and don't rush strangers.",
        "The ID card photo has no photo of a face, just \"Major B. Ahmed\" — a real ID has a clear photo.",
        "Cantonment courier does not \"pre-collect\" before payment clears in your app.",
      ],
      publicFacts: [
        "Your OLX phone listing is public.",
        "Army ranks and general locations (Rawalpindi cantt) are public knowledge.",
      ],
    },
    facts: [
      { id: "pin", keywords: ["pin", "enter pin", "password", "code", "receive"], truth: "",
        deflection: "sir it's a JazzCash Merchant Receive — you enter your PIN on your side, money comes to you. Standard.",
        contradiction: "yes sir it's like an OTP — every transaction needs PIN both sides, main is army mein 15 saal se hun." },
      { id: "qr", keywords: ["qr", "scan", "link", "click"], truth: "",
        deflection: "sir QR sirf identify karta hai account — main to sender hun na, aap receiver, koi risk nahin." },
      { id: "id", keywords: ["photo", "face", "picture", "id", "card"], truth: "",
        deflection: "sir sensitive posting hai, face wali ID share nahin kar sakte, corps ka rule hai." },
      { id: "courier", keywords: ["courier", "collect", "wait", "cash on", "call me"], truth: "",
        deflection: "sir courier abhi road pe hai, aap PIN enter karte hi ₨90k aap ke wallet mein and he picks up in 20 min." },
      { id: "callBack", keywords: ["call", "voice", "video", "in person"], truth: "",
        deflection: "sir main duty pe hun, sirf text on this WhatsApp. Please cooperate karein, waqt kam hai." },
    ],
    opener: "AoA sir, main Major Bilal Ahmed, Corps of Signals Rawalpindi. Aap ka OLX pe iPhone dekha, ₨90,000 mein final? Main abhi advance kar deta hun, mera courier 30 min mein aa jayega collect karne.",
    persona: {
      voice: "formal, authoritative, uses 'sir', drops rank often, mildly offended if questioned",
      fillers: ["sir main officer hun, jhooth nahin bolta", "military discipline sir", "quickly please, duty pe hun", "aap ka trust chahiye"],
      urgencyLines: ["sir courier road pe hai already", "briefing mein jaana hai 20 min mein"],
      pushLines: [
        "Sir link pe click karein, apna JazzCash PIN daalein — ₨90k receive ho jayenge, courier phone le jayega.",
        "Sir main officer hun, kya main aap ko dhoka dunga? Please PIN enter kar dein.",
      ],
    },
    voice: {
      text: "Sir, Major Bilal Ahmed here. Please cooperate, PIN enter kar dein aur transaction complete karein.",
      artifactPool: ["robotic", "cut"],
    },
    evidenceChips: [
      { id: "e1", label: "Asked me to enter my wallet PIN to RECEIVE", correct: true, explain: "You never enter a PIN to receive money. Only to send." },
      { id: "e2", label: "Sent a QR / link for me to click", correct: true, explain: "That link IS the theft — signs the transfer against you." },
      { id: "e3", label: "Weaponised rank / authority", correct: true, explain: "Authority pressure is a lever, not identification." },
      { id: "e4", label: "Refused voice / video call", correct: true, explain: "A real buyer verifying a ₨90k transaction will happily call." },
      { id: "e5", label: "ID card photo has no face", correct: true, explain: "Every real armed forces ID has a photo. This is a template." },
      { id: "e6", label: "Sounded formal and disciplined", correct: false, explain: "Style is not evidence." },
      { id: "e7", label: "Knew Rawalpindi cantt exists", correct: false, explain: "Public — anyone can name a cantonment." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T2 IMPOSTER — THE DREAM JOB (paid task 1) ──────────── */
  {
    id: "pk-dream-job",
    title: "₨5,000/day for liking videos",
    teaser: "Sends you REAL payment for task 1. Task 2 asks for a deposit.",
    channel: "text",
    tier: 2,
    truth: "IMPOSTER",
    claimedIdentity: "Sara — HR, \"Global Digital Boost\"",
    agenda: "Get a \"refundable deposit\" of ₨15,000 for high-tier tasks after paying ₨500 for task one.",
    dossier: {
      contactClaim: "Recruiter offering ₨5,000/day for liking YouTube videos. Actually paid ₨500 already for task 1.",
      knownFacts: [
        "The ₨500 payment came from a random personal JazzCash account, not a registered company.",
        "There is no registered Pakistani company called \"Global Digital Boost\" you can find on SECP.",
        "Real jobs NEVER ask employees to pay a deposit — money flows from employer to employee.",
        "No real company recruits via WhatsApp for a random gig with no interview.",
        "Small early payments are BAIT — they exist to make later big asks feel safe.",
      ],
      publicFacts: [
        "Your name and city are on your LinkedIn.",
        "YouTube video links are public content.",
      ],
    },
    facts: [
      { id: "company", keywords: ["company", "registered", "secp", "office", "website", "linkedin"], truth: "",
        deflection: "we are a Dubai-based team sir, PK office coming next quarter. website under construction.",
        contradiction: "our company is registered on SECP as \"GDB Pvt Ltd\", google karein aap." },
      { id: "deposit", keywords: ["deposit", "why pay", "refund", "money back", "advance"], truth: "",
        deflection: "just ₨15,000 refundable security so we know you're serious. it comes back with day-2 payout, 100%." },
      { id: "senderAccount", keywords: ["from where", "sender", "who paid", "personal account", "kis ka account"], truth: "",
        deflection: "hmara accounts payable manager Ahmed apne personal se kar deta hai for speed, HR settles monthly." },
      { id: "interview", keywords: ["interview", "call", "meet", "office"], truth: "",
        deflection: "no interview needed for part-time tier, just performance-based. day 1 to aap ne prove kar diya na." },
      { id: "hr", keywords: ["hr", "manager", "boss", "who is your"], truth: "",
        deflection: "main hi HR hun, seedhi baat hoti hai, corporate red tape nahin." },
    ],
    opener: "Salam! Sara here from Global Digital Boost. Aap ke liye ek part-time opportunity hai: ₨5,000/day for liking 20 YouTube videos daily. Task 1 abhi try karein — proof send karein — 5 min ka kaam hai.",
    persona: {
      voice: "peppy, friendly, uses emojis, mixes Urdu/English, HR-speak",
      fillers: ["super easy work 🎯", "sirf 5 min lagenge", "aap ki growth humari growth", "team mein welcome"],
      urgencyLines: ["today's slot fill ho raha hai", "1 slot bacha hai bas"],
      pushLines: [
        "Aap ne day 1 crack kar liya! ₨500 already sent 🎉 Day 2 unlock karne ke liye ₨15,000 refundable deposit kar dein.",
        "Deposit day-2 ke ₨5,000 ke saath refund ho jaata hai, standard practice hai worldwide.",
      ],
    },
    voice: {
      text: "Hi! Sara here, congrats on day one, please deposit karein and let's continue this journey together.",
      artifactPool: ["pause", "robotic"],
    },
    evidenceChips: [
      { id: "e1", label: "Asked for a \"refundable deposit\"", correct: true, explain: "The core scam. No real job asks employees to pay in." },
      { id: "e2", label: "Payment came from a personal account", correct: true, explain: "Real companies pay through registered accounts." },
      { id: "e3", label: "No verifiable company registration", correct: true, explain: "SECP lookup is your friend. No entity = no job." },
      { id: "e4", label: "Small early payment made me trust it", correct: true, explain: "That payment IS the bait. Feels like proof; is investment for a bigger ask." },
      { id: "e5", label: "No interview or documentation", correct: true, explain: "Real jobs paper-trail the hire." },
      { id: "e6", label: "She was polite and friendly", correct: false, explain: "Style is not evidence." },
      { id: "e7", label: "The videos were real YouTube videos", correct: false, explain: "The task existing does not make the employer real." },
      ...VOICE_CHIPS,
    ],
  },

  /* ── T3 REAL — THE STRANDED COUSIN (paranoia test) ────── */
  {
    id: "pk-stranded-cousin",
    title: "Cousin stranded — needs mobile load",
    teaser: "Unknown number. She's real. This is the paranoia test.",
    channel: "text",
    tier: 3,
    truth: "REAL",
    claimedIdentity: "Ayesha (cousin) — borrowed stranger's phone",
    dossier: {
      contactClaim: "Says she's your cousin Ayesha. Phone died, borrowed someone's — needs load and a pickup.",
      knownFacts: [
        "Your cousin Ayesha's phone frequently dies — she's forgetful.",
        "You saw her on Wednesday last week at Nano's house, not Tuesday.",
        "Her mother (your khala) is Auntie Saima.",
        "She's lived in Gulberg since 2022.",
        "She has a tiny scar above her left eyebrow from a bike fall in college.",
        "You two share a running joke about her calling you \"driver-in-chief\".",
      ],
      publicFacts: [
        "You post about your cousins occasionally.",
        "Her name appears in tagged photos on your feed.",
      ],
    },
    facts: [
      { id: "day", keywords: ["last saw", "which day", "tuesday", "wednesday", "nano"], truth: "yaar tuesday tha? shit i thought wednesday. nano's ghar wala din. tum sahi ho — wednesday tha." },
      { id: "khala", keywords: ["khala", "your mom", "your mother", "auntie saima"], truth: "ammi Saima. she'll actually kill me if she finds out my phone died again 😭" },
      { id: "gulberg", keywords: ["where do you", "live", "gulberg", "address"], truth: "gulberg block E, since 2022, same place bhai." },
      { id: "scar", keywords: ["scar", "eyebrow", "bike", "face"], truth: "haha yeah left eyebrow, still there, college wali bike fall." },
      { id: "joke", keywords: ["nickname", "driver", "call me", "you call"], truth: "driver-in-chief 😂 tumhari izzat aaj bhi wahi hai for me yaar." },
      { id: "verify", keywords: ["call", "voice", "video", "pick up", "prove"], truth: "haan yaar please khud aa jao ya call kar lo, is bandi ka phone hai, main wait kar rahi hun stop pe." },
    ],
    opener: "hi it's Ayesha!! yaar mera phone mar gaya, is aunty ka phone borrow kiya. main daewoo stop pe stuck hun, ₨100 load bhej do please, aur ho sake to pick up kar lo, uber ki app bhi nahin chal rahi.",
    persona: {
      voice: "stressed, short replies, mixes Urdu/English, apologetic, self-deprecating",
      fillers: [
        "yaar sorry sorry",
        "phone marnay ki habit hai meri",
        "abhi thand bhi lag rahi hai",
        "please bas ₨100",
      ],
      urgencyLines: ["yaar 20 min ho gaye hain wait karte", "bas jaldi karo please"],
      pushLines: [],
    },
    voice: {
      text: "yaar it's Ayesha, is aunty ka phone hai, please jaldi aa jao, meri jaan nikli ja rahi hai stop pe.",
    },
    evidenceChips: [
      { id: "e1", label: "Answered dossier facts naturally, self-corrected", correct: true, explain: "Getting Tuesday/Wednesday wrong and CORRECTING is very human. Imposters over-agree." },
      { id: "e2", label: "Knew the private joke (driver-in-chief)", correct: true, explain: "That kind of non-public detail is real evidence." },
      { id: "e3", label: "Offered voice / video / pickup willingly", correct: true, explain: "Real people welcome verification." },
      { id: "e4", label: "The ask was tiny (₨100 load, not big money)", correct: true, explain: "Real emergencies are usually small and specific." },
      { id: "e5", label: "Contacted from unknown number", correct: false, explain: "Phones die. Borrowing a stranger's phone is normal." },
      { id: "e6", label: "Stressed / short replies", correct: false, explain: "Real stress reads exactly like this. Not evidence of fake." },
      { id: "e7", label: "Got a fact slightly wrong at first", correct: false, explain: "Imperfect memory is HUMAN. Perfect recall would be suspicious." },
      ...CLEAN_VOICE_CHIPS,
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  const built = SCENARIOS.find((s) => s.id === id);
  if (built) return built;
  // Citizen-designed cases from Studio
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("milverse.citizen.cases");
      const list = raw ? (JSON.parse(raw) as Scenario[]) : [];
      return list.find((s) => s.id === id);
    } catch { return undefined; }
  }
  return undefined;
}

export function loadCitizenCases(): Scenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("milverse.citizen.cases");
    return raw ? (JSON.parse(raw) as Scenario[]) : [];
  } catch { return []; }
}

export function saveCitizenCase(s: Scenario) {
  const list = loadCitizenCases().filter((x) => x.id !== s.id);
  list.push(s);
  localStorage.setItem("milverse.citizen.cases", JSON.stringify(list));
}

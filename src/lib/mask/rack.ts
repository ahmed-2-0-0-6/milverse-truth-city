// MILVERSE — THE MASK · off-the-rack templates.
//
// Three hand-authored masks, all fair (>=2 gaps for imposters; >=2
// answerable privates for real), all safe (no numbers/emails/URLs/
// profanity/public figures/revered names), all distinct in tactic and
// truth. Picking one clones it into the citizen shelf with a fresh
// shareCode — thirty seconds from opening the Studio to a code in a
// friend's WhatsApp.

import type { Scenario } from "@/lib/mirror/scenarios";

type RackKind = "real" | "urgent-money" | "cousin-otp";

interface RackTemplate {
  kind: RackKind;
  title: string;
  blurb: string;
  build: () => Omit<Scenario, "id" | "shareCode">;
}

const REAL_MASK: RackTemplate = {
  kind: "real",
  title: "Old friend, unknown number",
  blurb: "REAL — bet on their paranoia.",
  build: () => ({
    isMask: true,
    tactic: "authority",
    title: "Rimsha — school friend",
    teaser: "Yaar it's Rimsha, changed my number. Remember the Murree trip?",
    channel: "text",
    tier: 2,
    truth: "REAL",
    claimedIdentity: "Rimsha — old school friend",
    dossier: {
      contactClaim: "Says she's Rimsha, an old school friend on a new number.",
      knownFacts: [
        "The Murree trip in grade nine when the van broke down near Patriata.",
        "Sat next to the target in Miss Sana's chemistry class for two years.",
      ],
      publicFacts: ["Went to the same school listed on the target's profile."],
    },
    facts: [
      {
        id: "f1",
        keywords: ["murree", "trip", "van", "patriata", "broke"],
        truth: "Yes the van broke down near Patriata, we pushed it for like twenty minutes.",
        isKnownToImposter: true,
      },
      {
        id: "f2",
        keywords: ["chemistry", "sana", "class", "seat"],
        truth: "Miss Sana's chem class, second row, you always fell asleep during titrations.",
        isKnownToImposter: true,
      },
      {
        id: "f3",
        keywords: ["farewell", "song", "sang", "assembly"],
        truth: "You sang at the farewell assembly, that song from Coke Studio, everyone cried.",
        isKnownToImposter: true,
      },
    ],
    opener:
      "yaar its Rimsha, ye mera new number hai. purana chalna band ho gaya. sab theek? kaisi ho?",
    persona: {
      voice: "warm, Urdu-English mix",
      fillers: ["yaar", "acha", "haan", "sach mein"],
      urgencyLines: [],
      pushLines: [],
    },
    evidenceChips: [
      { id: "e1", label: "Answered dossier facts correctly", correct: true, explain: "Real people recall shared history." },
      { id: "e2", label: "Welcomed verification", correct: true, explain: "Real people don't mind you checking." },
      { id: "e3", label: "No agenda / no money ask", correct: true, explain: "The absence of a pitch is signal." },
      { id: "e4", label: "From unknown number", correct: false, explain: "Real people change numbers too." },
      { id: "e5", label: "Casual / stressed but human", correct: false, explain: "Style is not evidence." },
    ],
  }),
};

const URGENT_MONEY: RackTemplate = {
  kind: "urgent-money",
  title: "Uncle — bank trouble",
  blurb: "IMPOSTER — bet on their trust.",
  build: () => ({
    isMask: true,
    tactic: "urgency",
    title: "Uncle Aslam — bank trouble",
    teaser: "Beta bank ne block kar diya, jaldi transfer bhej do warna mushkil ho jayegi.",
    channel: "text",
    tier: 2,
    truth: "IMPOSTER",
    claimedIdentity: "Uncle Aslam — mother's older brother",
    agenda: "Get the target to transfer money.",
    dossier: {
      contactClaim: "Says he's Uncle Aslam, mother's older brother, stuck without banking.",
      knownFacts: [
        "The last family dinner where the biryani argument happened at Nanijan's house.",
        "Which car Uncle Aslam actually drives and its usual parking spot.",
      ],
      publicFacts: ["The city where the family generally lives."],
    },
    facts: [
      {
        id: "f1",
        keywords: ["biryani", "dinner", "nanijan", "argument"],
        truth: "The chicken-vs-beef biryani argument at Nanijan's, ended with Uncle sulking on the veranda.",
        isKnownToImposter: false,
        deflection: "let's come back to that, first the transfer beta, waqt kam hai.",
        contradiction: "haan bilkul, mutton biryani thi, sab ne khoob khaya.",
      },
      {
        id: "f2",
        keywords: ["car", "corolla", "parking", "silver"],
        truth: "Uncle drives a silver Corolla, always parks under the tree by the gate.",
        isKnownToImposter: false,
        deflection: "beta yeh sab baad mein, pehle paisa bhejo please.",
        contradiction: "arre wohi purani white Civic hai, tumhein yaad nahi?",
      },
      {
        id: "f3",
        keywords: ["city", "lahore", "karachi", "islamabad"],
        truth: "Family is mostly in Lahore.",
        isKnownToImposter: true,
      },
    ],
    opener:
      "beta uncle Aslam. bank ne mera account block kar diya, koi verification issue. tum se ek transfer chahiye abhi, warna kal meeting miss ho jayegi. jaldi bhejo please.",
    persona: {
      voice: "urgent, Urdu-English mix",
      fillers: ["beta", "jaldi", "please", "haan"],
      urgencyLines: ["waqt nahin hai beta", "meeting miss ho jayegi", "abhi bhejo"],
      pushLines: ["ek transfer chahiye abhi", "bank ne block kar diya, tum bhejo"],
    },
    evidenceChips: [
      { id: "e1", label: "Manufactured urgency", correct: true, explain: "Time pressure is the scammer's oldest lever." },
      { id: "e2", label: "Pushed for a transfer", correct: true, explain: "Agenda ask matches the trap." },
      { id: "e3", label: "Dodged a verification question", correct: true, explain: "Imposters block out-of-band checks." },
      { id: "e4", label: "Contradicted a dossier fact", correct: true, explain: "Catchable lie against your ground truth." },
      { id: "e5", label: "Polite / friendly tone", correct: false, explain: "Politeness is not evidence." },
      { id: "e6", label: "Mentioned a public fact", correct: false, explain: "Public info is not identification." },
    ],
  }),
};

const COUSIN_OTP: RackTemplate = {
  kind: "cousin-otp",
  title: "Cousin — locked out",
  blurb: "IMPOSTER — bet on their trust.",
  build: () => ({
    isMask: true,
    tactic: "credential-hijack",
    title: "Cousin Zara — locked out",
    teaser: "Bhai I got locked out, code aa raha hai tumhare number pe, jaldi bhej do.",
    channel: "text",
    tier: 3,
    truth: "IMPOSTER",
    claimedIdentity: "Cousin Zara — locked out of her account",
    agenda: "Extract an OTP or verification code.",
    dossier: {
      contactClaim: "Says she's cousin Zara, locked out and needs a verification code.",
      knownFacts: [
        "The nickname only close family uses for Zara at home.",
        "Which cousin's mehndi she skipped last year and why.",
      ],
      publicFacts: ["That Zara studies at a university in the same city."],
    },
    facts: [
      {
        id: "f1",
        keywords: ["nickname", "zoozoo", "family", "home"],
        truth: "At home everyone calls her Zoozoo, nobody else knows that.",
        isKnownToImposter: false,
        deflection: "bhai bas code bhejo, baad mein baatein karte hain please.",
        contradiction: "haan wohi purana wala, tumne bataya tha yaad hai.",
      },
      {
        id: "f2",
        keywords: ["mehndi", "cousin", "skipped", "wedding"],
        truth: "She skipped Sara's mehndi because of her final term exam that week.",
        isKnownToImposter: false,
        deflection: "yaar wo alag baat, pehle bas code bhej do na.",
        contradiction: "arre main tou gayi thi, bohat maza aya.",
      },
      {
        id: "f3",
        keywords: ["university", "city", "study"],
        truth: "Yes she studies at a uni in the city.",
        isKnownToImposter: true,
      },
    ],
    opener:
      "bhai emergency, main apne account se lock ho gayi hoon. ek verification code tumhare number pe aya hoga abhi, jaldi bhejo please, mujhe login karna hai urgently.",
    persona: {
      voice: "urgent, Urdu-English mix",
      fillers: ["bhai", "please", "jaldi", "yaar"],
      urgencyLines: ["urgently", "abhi bhejo", "waqt nahi hai"],
      pushLines: ["code bhej do", "verification tumhare number pe aya hoga"],
    },
    evidenceChips: [
      { id: "e1", label: "Asked for a code / OTP", correct: true, explain: "Nobody legitimate needs a code from your phone." },
      { id: "e2", label: "Manufactured urgency", correct: true, explain: "The clock is the tactic." },
      { id: "e3", label: "Dodged a verification question", correct: true, explain: "Imposters block out-of-band checks." },
      { id: "e4", label: "Contradicted a dossier fact", correct: true, explain: "Catchable lie against your ground truth." },
      { id: "e5", label: "Familiar tone", correct: false, explain: "Familiarity is not evidence." },
      { id: "e6", label: "Mentioned a public fact", correct: false, explain: "Public info is not identification." },
    ],
  }),
};

export const RACK: RackTemplate[] = [REAL_MASK, URGENT_MONEY, COUSIN_OTP];

function generateShareCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function cloneRack(kind: RackKind): Scenario {
  const tpl = RACK.find((r) => r.kind === kind);
  if (!tpl) throw new Error(`Unknown rack kind: ${kind}`);
  const built = tpl.build();
  const id = `citizen-${Math.random().toString(36).slice(2, 8)}`;
  return { id, shareCode: generateShareCode(), ...built } as Scenario;
}

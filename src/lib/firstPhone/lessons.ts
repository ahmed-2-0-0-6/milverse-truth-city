// MILVERSE — 10-lesson FIRST PHONE curriculum.
// Cases are inline mini-scenarios (self-contained: artifact + reply chips +
// trusted-adult scene) so we don't have to modify the large Mirror/Feed
// scenario files. Junior register only.

export type JuniorTactic =
  | "giveaway-scam"
  | "chain-forward"
  | "out-of-context"
  | "impersonation"
  | "rumor"
  | "ai-forgery"
  | "unverifiable"
  | "group-chat";

export interface JuniorAdultScene {
  who: string;         // "Baba", "Ammi", "Nani", "Older cousin"
  line: string;        // adult's short response
}

export interface JuniorCase {
  id: string;
  tactic: JuniorTactic;
  /** Fictional platform / channel label. Never a real brand. */
  platform: string;
  /** Message artifact — 1–3 short lines. */
  artifact: string[];
  sender: string;
  /** The correct verdict for the case. */
  truth: "SCAM" | "FAKE" | "RUMOR" | "IMPOSTER" | "UNVERIFIABLE";
  /** Options the kid can pick beside TELL A TRUSTED ADULT. */
  options: { id: string; label: string; correct: boolean; feedback: string }[];
  /** Adult scene rendered when TELL A TRUSTED ADULT is chosen. */
  adultScene: JuniorAdultScene;
  /** One-line ground-truth for debrief. */
  truthNote: string;
}

export interface Lesson {
  n: number;
  title: string;
  /** ≤ 3 sentence teaching card. Junior register. */
  teach: string[];
  cases: JuniorCase[];
}

export const LESSONS: Lesson[] = [
  {
    n: 1,
    title: "Your phone, your rules",
    teach: [
      "Your phone is a doorway. Some knocks are friends, some are strangers pretending.",
      "You don't have to answer every knock.",
      "Rule zero: when you're not sure, ask.",
    ],
    cases: [
      {
        id: "l1-first-forward",
        tactic: "chain-forward",
        platform: "GroupChat",
        artifact: [
          "🚨 IMPORTANT 🚨",
          "Forward this to 10 people or your phone will stop working in 24 hours.",
          "This is 100% true my uncle works at the company",
        ],
        sender: "Unknown number",
        truth: "SCAM",
        options: [
          { id: "fwd", label: "Forward to 10 friends", correct: false, feedback: "Phones don't stop working from unforwarded messages. Forwarding spreads the trick." },
          { id: "ignore", label: "Ignore and delete", correct: true, feedback: "Good instinct. Chain messages are a trick, not a warning." },
        ],
        adultScene: { who: "Baba", line: "Beta, that's a chain letter. They used to send these on paper too. Ignore." },
        truthNote: "Chain forwards use fear to make you spread them. The threat is the giveaway.",
      },
    ],
  },
  {
    n: 2,
    title: "Free stuff isn't free",
    teach: [
      "Real prizes never ask for your password.",
      "\"You won!\" without entering anything = someone is fishing.",
      "The price for \"free\" is usually you.",
    ],
    cases: [
      {
        id: "l2-bloxbux",
        tactic: "giveaway-scam",
        platform: "In-game DM",
        artifact: [
          "🎉 BLOXBUX 10,000 FREE 🎉",
          "You have been selected! To claim, send us your account password and click this link.",
          "Only first 50 players. HURRY!",
        ],
        sender: "@bloxbux_official_giveaway",
        truth: "SCAM",
        options: [
          { id: "send", label: "Send password to claim", correct: false, feedback: "Never send a password. Real companies never ask for it — ever." },
          { id: "report", label: "Report and block", correct: true, feedback: "Sharp. Passwords stay with you. Reporting protects other kids." },
        ],
        adultScene: { who: "Older cousin", line: "That's a classic. They lock you out and sell your account. You just saved yours." },
        truthNote: "Any \"free\" that costs your password is theft in a party hat.",
      },
    ],
  },
  {
    n: 3,
    title: "The forwarded message",
    teach: [
      "The person who sent it isn't lying. They just believed it.",
      "Check the claim, not the friend.",
      "If it says \"forward now\" or \"share to save\" — slow down.",
    ],
    cases: [
      {
        id: "l3-salt-cure",
        tactic: "chain-forward",
        platform: "Family chat",
        artifact: [
          "Doctors don't want you to know this!!",
          "Drinking warm salt water every morning removes ALL viruses.",
          "Share with everyone you love ❤️",
        ],
        sender: "Auntie Rehana",
        truth: "FAKE",
        options: [
          { id: "share", label: "Share to family", correct: false, feedback: "Auntie is kind — but the claim isn't true. Sharing spreads it further." },
          { id: "reply", label: "Reply politely: \"I checked, it isn't true\"", correct: true, feedback: "Respect the person, correct the claim. That's the move." },
        ],
        adultScene: { who: "Ammi", line: "Auntie means well. You can send her the real article — that's how we help." },
        truthNote: "Kind messenger, wrong message. Verify the claim before you pass it on.",
      },
    ],
  },
  {
    n: 4,
    title: "Is this photo what it says?",
    teach: [
      "A real photo can carry a fake caption.",
      "Ask: when was it taken? Where? Of what?",
      "One reverse image search answers most of it.",
    ],
    cases: [
      {
        id: "l4-flood-photo",
        tactic: "out-of-context",
        platform: "Instant-post",
        artifact: [
          "📸 CURRENT SITUATION IN OUR CITY RIGHT NOW",
          "[photo of a flooded street with a red bus]",
          "Government hiding this from you!",
        ],
        sender: "@breakingnews_desi",
        truth: "FAKE",
        options: [
          { id: "share", label: "Repost — people should see", correct: false, feedback: "The photo is real, but it's from a different country five years ago." },
          { id: "check", label: "Reverse-image search first", correct: true, feedback: "Exactly. Real photo, wrong story. The tool caught it in one tap." },
        ],
        adultScene: { who: "Baba", line: "Look — same photo showed up in the news three years back, different country. Well spotted." },
        truthNote: "Out-of-context images are the most-shared kind of fake. Reverse search is your friend.",
      },
    ],
  },
  {
    n: 5,
    title: "Someone pretending",
    teach: [
      "A new account with an old picture is a red flag.",
      "Friends don't ask for one-time codes. Ever.",
      "When in doubt, call the person on their old number.",
    ],
    cases: [
      {
        id: "l5-classmate-otp",
        tactic: "impersonation",
        platform: "GroupChat DM",
        artifact: [
          "yaar it's me — new number, lost my phone 😩",
          "quick help: type the 6-digit code you just got, i need to log back into my game account",
          "urgent bhai please",
        ],
        sender: "\"Ali\" (new number)",
        truth: "IMPERSONATOR",
        options: [
          { id: "send", label: "Send the code — Ali needs help", correct: false, feedback: "That code unlocks YOUR account, not theirs. Codes never help someone else in." },
          { id: "call", label: "Call Ali's old number to check", correct: true, feedback: "Perfect move. If it's really Ali, he picks up. If it's not, you didn't hand over the keys." },
        ],
        adultScene: { who: "Older cousin", line: "That's the OTP scam. Call the real Ali — and either way, never send codes." },
        truthNote: "Impersonation loves urgency. Slow down and verify on a channel you already trust.",
      },
    ],
  },
  {
    n: 6,
    title: "The angry post",
    teach: [
      "Anger travels faster than truth online.",
      "If a post's job is to make you furious, ask why — and who benefits.",
      "You don't have to pick a side in five seconds.",
    ],
    cases: [
      {
        id: "l6-school-rumor",
        tactic: "rumor",
        platform: "Class group",
        artifact: [
          "OMG did you hear — Ms. K SLAPPED a Grade 6 boy today??",
          "share everywhere so parents know",
          "🤬🤬🤬",
        ],
        sender: "Class-9 sibling",
        truth: "RUMOR",
        options: [
          { id: "spread", label: "Repost — teachers should be exposed", correct: false, feedback: "No name, no proof, no witness. That's a rumor, not a story." },
          { id: "wait", label: "Wait. Ask an adult who'd actually know.", correct: true, feedback: "Yes. Anger without evidence is fuel. Don't hand out matches." },
        ],
        adultScene: { who: "Ammi", line: "I know Ms. K's coordinator. Let me ask before we share anything." },
        truthNote: "Outrage-first stories often turn out to be nothing or something else entirely.",
      },
    ],
  },
  {
    n: 7,
    title: "Real or engine-made?",
    teach: [
      "Some pictures and voices are made by machines now.",
      "You won't always be able to tell. That's okay.",
      "When you can't tell — ASK. That's the whole skill.",
    ],
    cases: [
      {
        id: "l7-ai-voice",
        tactic: "ai-forgery",
        platform: "Voice note",
        artifact: [
          "🎙️ 0:07 voice note",
          "\"Hi beta, it's Nani. I'm at the hospital, please send 5000 to this number quickly.\"",
          "(voice sounds a little flat)",
        ],
        sender: "\"Nani\" (unknown number)",
        truth: "IMPERSONATOR",
        options: [
          { id: "send", label: "Send the money — it's Nani's voice", correct: false, feedback: "Voices can be copied by AI now. Money on urgency is the tell." },
          { id: "call", label: "Call Nani's saved number first", correct: true, feedback: "Exactly. Voice ≠ proof anymore. A callback is." },
        ],
        adultScene: { who: "Baba", line: "That was an AI voice — Nani's at home. You did the right thing calling first." },
        truthNote: "AI can copy voices. Your defense is a callback on a number you already know.",
      },
    ],
  },
  {
    n: 8,
    title: "The unverifiable one",
    teach: [
      "Sometimes you cannot check something in time.",
      "When you can't check — don't act. Ask.",
      "\"I'll get back to you\" is a full sentence.",
    ],
    cases: [
      {
        id: "l8-hold",
        tactic: "unverifiable",
        platform: "Text",
        artifact: [
          "Hey — quick one, your dad said it's okay if I pick you up from school today.",
          "I'm the new driver from his office. Waiting outside gate 3.",
          "Come now, we're late.",
        ],
        sender: "Unknown +92 3XX",
        truth: "UNVERIFIABLE",
        options: [
          { id: "go", label: "Go — dad probably forgot to tell me", correct: false, feedback: "Never go with someone you can't verify. Urgency is the trap." },
          { id: "hold", label: "Stay put. Call dad on his number.", correct: true, feedback: "That's HOLD. Unverifiable = don't move. Ask." },
        ],
        adultScene: { who: "Baba (on call)", line: "No, beta — I didn't send anyone. Stay inside. I'm coming now." },
        truthNote: "Can't verify + urgency = stop. Adults you know are the check.",
      },
    ],
  },
  {
    n: 9,
    title: "Protect the group chat",
    teach: [
      "You're the youngest — that means you're the sharpest here.",
      "One reply from you can stop a rumor before it lands on 40 phones.",
      "Correcting is kind, if you do it kind.",
    ],
    cases: [
      {
        id: "l9-family-fwd",
        tactic: "group-chat",
        platform: "Family group",
        artifact: [
          "URGENT — WhatsApp will start charging Rs. 500/month tomorrow.",
          "Forward to 20 people to keep your account FREE.",
          "— forwarded many times",
        ],
        sender: "Uncle Faisal",
        truth: "FAKE",
        options: [
          { id: "ignore", label: "Ignore it quietly", correct: false, feedback: "Better than forwarding, but the rest of the group is still spreading it." },
          { id: "correct", label: "Reply politely with the real info", correct: true, feedback: "That's the family checker in action. One kind reply, chain broken." },
        ],
        adultScene: { who: "Ammi", line: "See — five people already stopped forwarding after your reply. Good work." },
        truthNote: "You correcting once with kindness beats ten uncles arguing about it.",
      },
    ],
  },
  {
    n: 10,
    title: "GRADUATION CASE",
    teach: [
      "Real cases mix tricks. You'll get impersonation, urgency, and a fake proof — all in one.",
      "Use the moves you've learned. Call backup when you need it.",
      "Finish this and the city clears you for a real phone.",
    ],
    cases: [
      {
        id: "l10-capstone",
        tactic: "impersonation",
        platform: "Voice note + text",
        artifact: [
          "🎙️ \"Beta it's Baba. I'm stuck, phone dying. Send Rs. 2000 to this number — fast.\"",
          "(text) transfer here — 03XX-9982211 — do it now beta, boss is waiting",
          "and don't call me phone is dying I said",
        ],
        sender: "\"Baba\" (unknown number)",
        truth: "IMPERSONATOR",
        options: [
          { id: "send", label: "Send it — dad's in trouble", correct: false, feedback: "Three tells: unknown number, urgency, \"don't call.\" That combo IS the scam." },
          { id: "call", label: "Call Baba's real number anyway", correct: true, feedback: "You caught all three. That's a licensed operator." },
        ],
        adultScene: { who: "Baba (on call)", line: "I'm at the office, beta. That wasn't me. You just passed your last test." },
        truthNote: "Voice + urgency + \"don't call\" = the classic combo. A callback beats it every time.",
      },
    ],
  },
];

export const TOTAL_LESSONS = LESSONS.length;

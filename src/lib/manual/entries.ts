// MILVERSE — The Field Manual.
// A codex of manipulation tactics. Each entry is reference material —
// the manual NEVER declares a specific case true or false. That's the player's job.

export type TacticId =
  | "impersonation"
  | "urgency-fear"
  | "out-of-context"
  | "engagement-bait"
  | "imposter-outlet"
  | "phishing"
  | "trust-farming"
  | "ai-generated"
  | "mis-dis-mal"
  | "forgery-engine"
  | "outrage-machine";

export interface ManualEntry {
  id: TacticId;
  code: string; // filed like a detective's dossier — "T-04"
  name: string; // ALL CAPS name
  oneLine: string; // used in the debrief tactic stamp
  howItWorks: string; // 3–4 sentences
  worldwide: { where: string; pattern: string }[]; // 2 anonymized examples
  redFlags: string[];
  counterMove: string;
}

export const MANUAL_ENTRIES: ManualEntry[] = [
  {
    id: "impersonation",
    code: "T-01",
    name: "IMPERSONATION",
    oneLine: "A stranger wears a face you trust.",
    howItWorks:
      "The attacker copies the identity of a specific person you know — a cousin abroad, a boss, an old teacher. They use a scraped photo, a plausible new number, and a memory or two mined from public posts. The goal is to borrow your trust for one small request that opens the door.",
    worldwide: [
      {
        where: "South Asia · daily",
        pattern:
          '"Bhai I lost my phone, quick send Rs 5000 easypaisa" from a number claiming to be a close relative.',
      },
      {
        where: "Global · workplaces",
        pattern:
          '"CEO" texts a junior finance staffer asking for an urgent gift-card purchase — a "small favour, deal with it directly".',
      },
    ],
    redFlags: [
      "New number, familiar name.",
      "Urgent tiny ask before a real conversation.",
      "Refuses a voice or video call.",
    ],
    counterMove:
      "Call the person you know on the number you already have. If they can't hop on video for 30 seconds, they aren't them.",
  },
  {
    id: "urgency-fear",
    code: "T-02",
    name: "URGENCY & FEAR",
    oneLine: "A ticking clock is a thinking-clock killer.",
    howItWorks:
      "The message forces a decision inside minutes: banks closing, a scheme ending in 24 hours, a child in danger. Fear collapses the pause where verification happens. The clock is the entire attack — the underlying claim is often just filler.",
    worldwide: [
      {
        where: "Pakistan",
        pattern:
          '"All banks closing for 5 days — withdraw NOW" resurfaces during every currency wobble.',
      },
      {
        where: "Global",
        pattern:
          '"Your parcel is held at customs, pay ₹XX within 2 hours or it will be destroyed."',
      },
    ],
    redFlags: [
      "Hard deadline in hours, not days.",
      '"Do not tell anyone / do not verify."',
      "Emotional stakes — safety, money, honour.",
    ],
    counterMove:
      "The pause IS the defence. Any legit deadline survives a 20-minute delay. If it doesn't, it wasn't legit.",
  },
  {
    id: "out-of-context",
    code: "T-03",
    name: "OUT-OF-CONTEXT MEDIA",
    oneLine: "A real photo. The wrong story.",
    howItWorks:
      "The image, video, or clip is authentic — but it's from another place, another year, or a longer conversation. The false caption wraps around real footage and inherits its credibility. This is the most common misinformation form on earth today.",
    worldwide: [
      {
        where: "Global · every disaster",
        pattern: "Old flood/protest/war photos from another country recycled as 'today, here'.",
      },
      {
        where: "Global · politics",
        pattern:
          "A 30-second clip of a real speech, stitched from three different moments, reverses the speaker's actual point.",
      },
    ],
    redFlags: [
      "Dramatic image with a vague caption.",
      '"Not being shown by media" framing.',
      "Signage, plates, weather, or clothing don't match the claim.",
    ],
    counterMove:
      "Reverse-image the picture. Find the full clip. The real source of a real photo will always exist somewhere — go find it before you share.",
  },
  {
    id: "engagement-bait",
    code: "T-04",
    name: "ENGAGEMENT BAIT",
    oneLine: "Outrage travels; nuance doesn't.",
    howItWorks:
      "The claim is engineered to be shared, not read — designed for maximum anger, disgust, or awe in three seconds. Truth is optional; velocity is the metric. Once shared enough, it becomes 'everyone is saying it', which is treated as evidence.",
    worldwide: [
      {
        where: "Global · social platforms",
        pattern: "Screenshot of an outrageous 'tweet' from a made-up account that never existed.",
      },
      {
        where: "Global · health",
        pattern: "'Doctors hate this' clickbait framing on ordinary content.",
      },
    ],
    redFlags: [
      "The reaction is decided before you finish reading.",
      "The account is anonymous or newly created.",
      "Comments are a wall of the same emoji, not a conversation.",
    ],
    counterMove:
      "Ask: who benefits if I share this angry? If the answer is 'a stranger's engagement graph', don't be their algorithm.",
  },
  {
    id: "imposter-outlet",
    code: "T-05",
    name: "IMPOSTER OUTLETS & ACCOUNTS",
    oneLine: "A lookalike is not a look-through.",
    howItWorks:
      "A page, account, or website mimics a real newsroom, brand, or government body — usually with a tiny domain difference, an added dot, or a swapped letter. The visual language is copied. Then a fake story is 'published' inside it and screenshot for spread.",
    worldwide: [
      {
        where: "Global · phishing",
        pattern: '"State Bank of Pak1stan" with a numeric 1, or "gov-pk.org" instead of "gov.pk".',
      },
      {
        where: "Global · fake news",
        pattern: '"BBC-News-Updates" with a slightly different logo publishes an invented story.',
      },
    ],
    redFlags: [
      "Domain has extra hyphens, numbers, or a different top-level ending.",
      "Account is verified nowhere it should be.",
      "The story only exists on this one lookalike, not on the real outlet.",
    ],
    counterMove:
      "Open the real outlet in a new tab yourself. If the story isn't there, the story isn't real.",
  },
  {
    id: "phishing",
    code: "T-06",
    name: "PHISHING",
    oneLine: "A door that looks like your door.",
    howItWorks:
      "A link, form, or QR code impersonates a trusted service and asks for a credential, OTP, or CNIC copy. The design is close enough that you don't check the domain. Once you paste, the attacker has more than a password — they often have your identity.",
    worldwide: [
      {
        where: "Global · banking",
        pattern:
          '"Your account has been suspended, click to reactivate" pointing to a lookalike login page.',
      },
      {
        where: "South Asia",
        pattern:
          '"Free government laptop / job — send CNIC + Rs 250 processing fee to this personal wallet."',
      },
    ],
    redFlags: [
      "OTP or password requested by anyone.",
      "CNIC / ID scan requested over WhatsApp.",
      "Small fee to a personal wallet for a supposedly free benefit.",
    ],
    counterMove:
      "Real institutions never ask for OTPs, and never charge personal wallets for free benefits. Type the domain by hand — never click through.",
  },
  {
    id: "trust-farming",
    code: "T-07",
    name: "ROMANCE / TRUST FARMING",
    oneLine: "The long con is patient.",
    howItWorks:
      "The attacker invests weeks or months in a relationship — romantic, mentoring, community — before any ask. By the time money, favours, or intimate content are requested, the target's guard is fully down. The initial contact often looks like a harmless wrong-number.",
    worldwide: [
      {
        where: "Global · romance scams",
        pattern:
          "\"Wrong number\" or dating-app match escalates to a foreign 'partner' with an urgent hospital bill.",
      },
      {
        where: "Global · trafficking",
        pattern:
          "'Modelling / overseas job' relationships built over months to extract passport photos and travel consent.",
      },
    ],
    redFlags: [
      "Deep intimacy with someone you've never met in person.",
      "Refuses video, refuses to meet, always a plausible reason.",
      "A financial or intimate ask you would have refused on day one.",
    ],
    counterMove:
      "Ask yourself: what would day-one me say to this ask? Show the conversation to someone offline. Reverse-image their photos.",
  },
  {
    id: "ai-generated",
    code: "T-08",
    name: "AI-GENERATED CONTENT",
    oneLine: "The picture is perfect. That is the tell.",
    howItWorks:
      "Generative AI can now produce photorealistic images, cloned voices, and fluent text at effectively zero cost. 'Spot the AI' is a losing arms race — the models improve monthly. What does NOT improve is the source: a real event has independent witnesses, a real person has a phone number you already have.",
    worldwide: [
      {
        where: "Global",
        pattern: "AI-cloned voice of a family member asking for money over a phone call.",
      },
      {
        where: "Global",
        pattern: "AI-generated 'photo' of an event that never happened, shared as breaking news.",
      },
    ],
    redFlags: [
      "No independent second source anywhere.",
      "A shocking visual that appeared only online, from a single account.",
      "A familiar voice on an unfamiliar number.",
    ],
    counterMove:
      "Verify the source, not the pixels. Call back on the number you already have. Find the same event reported by two independent outlets.",
  },
  {
    id: "mis-dis-mal",
    code: "T-09",
    name: "MIS / DIS / MAL — INFORMATION",
    oneLine: "Naming what you're facing is half the counter-move.",
    howItWorks:
      "Misinformation is FALSE but shared without intent to harm — the aunt who forwards a rumour in good faith. Disinformation is FALSE and shared to harm — a coordinated campaign. Malinformation is TRUE but weaponised — private information leaked to damage someone. Each needs a different response.",
    worldwide: [
      {
        where: "Global",
        pattern:
          "The same false claim is misinformation in a family group and disinformation when a paid operator plants it.",
      },
      {
        where: "Global",
        pattern:
          "A real leaked screenshot used out of context to destroy a reputation is malinformation, not fake news.",
      },
    ],
    redFlags: [
      "Ask: is this FALSE, or TRUE-but-weaponised?",
      "Ask: is the sender in on it, or a victim of it?",
      "The response to each type is different — don't collapse them.",
    ],
    counterMove:
      "Name it out loud before you react. The response to a scared aunt is not the response to a paid operator.",
  },
  {
    id: "forgery-engine",
    code: "T-10",
    name: "THE FORGERY ENGINE",
    oneLine: "The tools that make lies are now free, fast, and fluent.",
    howItWorks:
      "For the first time in history, forging a person's face, voice, writing style, or an entire 'newsroom' costs less than a coffee and takes less than a minute. This is not a future problem — it is the operating environment. The old counter — 'does it look real?' — has permanently broken. The new counter is source verification and out-of-band checks.",
    worldwide: [
      {
        where: "Global · finance",
        pattern: "A deepfaked video of a CEO used to authorise a wire transfer during a live call.",
      },
      {
        where: "Global · politics",
        pattern:
          "A cloned voice of a public figure 'admitting' something they never said, released hours before a vote.",
      },
    ],
    redFlags: [
      "Any high-stakes ask that arrives only through one channel.",
      "A public figure 'saying' exactly what one side wanted them to say.",
      "You are being asked to act on the media itself, without independent confirmation.",
    ],
    counterMove:
      "Assume forgery is possible for everything. Then check the source, not the surface. This is why MILVERSE trains the pause, not the eye.",
  },
  {
    id: "outrage-machine",
    code: "T-11",
    name: "THE OUTRAGE MACHINE",
    oneLine: "Fury is the product. You are the delivery vehicle.",
    howItWorks:
      "A message is engineered so that being angry IS the point. It names an enemy group in one clean phrase, fabricates or reframes a quote, and demands you share as a moral duty. Platforms reward the anger with reach, and the anger recruits more anger in the comments — a self-feeding loop where the underlying claim never gets checked because checking feels like disloyalty. The weapon is not the claim. The weapon is what you do next.",
    worldwide: [
      {
        where: "Global · elections",
        pattern:
          "A fabricated quote-card attributes an inflammatory line to a real or thinly-fictional public figure hours before a vote. Their actual statement is mundane.",
      },
      {
        where: "Global · communal tension",
        pattern:
          "Three unrelated photos of unrest, each from a different city and year, are stitched together as 'yesterday, our neighbourhood, them' — the story is the weapon.",
      },
    ],
    redFlags: [
      "Names a whole group as the enemy in one short phrase.",
      "Demands sharing as a moral or patriotic duty.",
      "Maximum emotion, minimum source — no link, no date, no witness.",
      "Comments are already a battlefield when you arrive.",
    ],
    counterMove:
      "The 30-second cooldown. Strong emotion IS the tell — stop, breathe, verify before you amplify. Attack the claim, never the people. Anger that survives a 30-second pause and a source check is legitimate; anger that doesn't survive the pause was never yours in the first place.",
  },
];

export function getManualEntry(id: string): ManualEntry | undefined {
  return MANUAL_ENTRIES.find((e) => e.id === id);
}

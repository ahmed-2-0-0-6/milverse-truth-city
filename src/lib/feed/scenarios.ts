// MILVERSE — The Feed (mass-deception wing).
// The PERSON is real and sincere. The CLAIM might not be.
// Verdicts: TRUE / FALSE / MISLEADING / UNVERIFIED.

import type { InspiredByCase } from "@/lib/mirror/inspired";
import type { CastAfterword } from "@/lib/cast";


export type FeedTier = 1 | 2 | 3;
export type FeedVerdict = "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED";
export type FeedFormat = "whatsapp" | "instagram" | "news" | "image" | "video";
export type FeedToolKind = "reverse_image" | "check_source" | "cross_check" | "check_date";

// TacticId mirrored from src/lib/manual/entries.ts. Kept as a plain string union here
// to avoid a circular import; the Field Manual owns the canonical list.
export type FeedTacticId =
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

export interface FeedAction {
  id: string;
  label: string;
  result: string;
  decisive?: boolean;
  /** Which real-world verification tool this action simulates. */
  tool?: FeedToolKind;
}

export interface FeedForward {
  headline?: string;
  imageAlt?: string;
  imageEmoji?: string;
  bodyLines: string[];
  meta?: string;
}

export interface FeedScenario {
  id: string;
  title: string;
  teaser: string;
  tier: FeedTier;
  verdict: FeedVerdict;
  /** Native media format the artifact arrives in. Defaults to "whatsapp". */
  format?: FeedFormat;
  /** Marks cases where the artifact is (in-fiction) AI-generated. */
  aiGenerated?: boolean;
  /** The MIL tactic this case teaches. Revealed on debrief. */
  tacticId?: FeedTacticId;
  sender: {
    name: string;
    relationship: string;
    voice: string;
  };
  senderMotive: string;
  opener: string;
  forward: FeedForward;
  actions: FeedAction[];
  /** Optional dossier-truth answers for the Verification Toolbelt.
   *  Each entry is what the tool WOULD return if used on this artifact.
   *  Missing kinds render as WASTED turns with a teaching line. */
  toolbelt?: Partial<Record<FeedToolKind, string>>;
  truthNote: string;
  respectfulScript: string;
  inspiredBy?: InspiredByCase;
  /** Optional in-character aside from the recurring cast — colour only. */
  castAfterword?: CastAfterword;
}


export const FEED_SCENARIOS: FeedScenario[] = [
  /* ── T1 FALSE — the bank rumor ─────────────────────────────── */
  {
    id: "bank-rumor",
    title: "The bank rumor",
    teaser: 'Family group forward: "All banks closing for 5 days — withdraw cash NOW."',
    tier: 1,
    verdict: "FALSE",
    sender: {
      name: "Uncle Tariq",
      relationship: "Family WhatsApp group",
      voice: "worried, well-meaning, uses caps and emojis",
    },
    senderMotive: "He genuinely wants to protect the family's savings. He is scared, not stupid.",
    opener: "Beta this is IMPORTANT!! 🚨 Read fast and go to ATM. Share with everyone in family.",
    forward: {
      meta: "Forwarded many times · via WhatsApp",
      headline: "BREAKING: All banks in Pakistan closing 5 days from Monday",
      imageEmoji: "📰",
      imageAlt: "Screenshot of a news-channel ticker",
      bodyLines: [
        "SBP has quietly ordered all commercial banks to shut for 5 working days.",
        "ATMs will be OFFLINE. Withdraw at least PKR 50,000 per family TODAY.",
        "Do not wait for official announcement — by then it will be too late.",
        "Forward to every group. Save your family.",
      ],
    },
    actions: [
      {
        id: "search-headline",
        label: "Search the headline",
        result:
          "No results on Dawn, Geo, ARY, or Tribune. Only WhatsApp mirrors and one Facebook page created 3 weeks ago.",
        decisive: true,
      },
      {
        id: "check-channel",
        label: "Check the news channel's own site",
        result:
          "The channel's website has NO story matching this ticker. Real ticker font is thinner and yellow, not white bold.",
        decisive: true,
      },
      {
        id: "check-sbp",
        label: "Check State Bank's official page",
        result: "State Bank of Pakistan has issued no such circular.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-search the screenshot",
        result:
          "The ticker image appears in older 2022 posts with different text overlaid. Reused.",
      },
      {
        id: "check-date",
        label: "Check the date on the forward",
        result: "No date visible. Generic — designed to feel current whenever forwarded.",
      },
    ],
    truthNote:
      "There is no such SBP order. This is a recurring rumor that resurfaces every few months and triggers unnecessary ATM runs.",
    respectfulScript:
      "Chacha, I checked the news channel's website — they haven't run this story. And State Bank hasn't put out any circular. Looks like an old rumor doing the rounds again. I love that you're looking out for us though ❤️",
    inspiredBy: {
      patternName: "Fake Bank-Closure Panic Forward",
      country: "Pakistan / South Asia",
      year: "2019–ongoing",
      whatHappened:
        "Anonymous forwards periodically claim that a central bank has secretly ordered a multi-day banking freeze. The rumor peaks around currency shocks or elections. It has repeatedly triggered ATM queues and hoarding despite official denials.",
      prevention: [
        "Any 'quiet' order that only exists on WhatsApp is not an order.",
        "Central banks publish circulars on their own site — check there first.",
        "News-ticker screenshots are the most-doctored evidence there is.",
      ],
    },
    castAfterword: {
      who: "nani",
      line: "Nani ne aik nazar dekha aur bola: 'Yeh wohi purana rumour hai. Har election se pehle ghoomta hai. ATM par mat jao, chai banao.'",
    },
  },


  /* ── T2 MISLEADING — the flood photo ───────────────────────── */
  {
    id: "flood-photo",
    title: "The flood photo",
    teaser: '"Yesterday in Punjab — media is hiding it!"',
    tier: 2,
    verdict: "MISLEADING",
    sender: {
      name: "Uncle Salman",
      relationship: "Direct message",
      voice: "angry, activist, distrusts mainstream media",
    },
    senderMotive:
      "He genuinely believes he is exposing a cover-up. Correcting him feels like siding with the enemy.",
    opener:
      "Look at this and tell me media isn't hiding things. This is Punjab YESTERDAY. Share everywhere.",
    forward: {
      meta: "Forwarded",
      imageEmoji: "🌊",
      imageAlt: "A striking photo of a flooded street with people wading through waist-deep water",
      bodyLines: [
        "Punjab under water. Not a single channel is showing this.",
        "Government too busy with politics. People dying and nobody cares.",
      ],
    },
    actions: [
      {
        id: "reverse-image",
        label: "Reverse-search the photo",
        result:
          "The exact same image appears in international news archives from 2020 — captioned as flooding in Jakarta, Indonesia.",
        decisive: true,
      },
      {
        id: "check-signs",
        label: "Zoom into the signage in the image",
        result:
          "Shop signage in the background is in Bahasa Indonesia. Vehicles are right-hand-drive Toyotas with Indonesian plates.",
        decisive: true,
      },
      {
        id: "check-flood-status",
        label: "Check if Punjab actually has flooding right now",
        result:
          "PDMA and multiple newsrooms ARE currently reporting localized flooding in southern Punjab — but with different, verified photos.",
        decisive: true,
      },
      {
        id: "check-caption",
        label: "Search the exact caption",
        result:
          "The caption text appears on dozens of unrelated posts over the years, always with different photos. Boilerplate.",
      },
    ],
    truthNote:
      "The flooding is real. THIS PHOTO is not. It's from Indonesia, 2020. TRUE core wrapped in a FALSE image. Verdict: MISLEADING, not simply fake.",
    respectfulScript:
      "Uncle the flooding is 100% real and being covered — but this specific photo is from Jakarta in 2020. Using a wrong photo actually gives the deniers ammo. Share the real PDMA photos instead — they're more powerful.",
    inspiredBy: {
      patternName: "Recycled Disaster Photo",
      country: "Global",
      year: "2015–ongoing",
      whatHappened:
        "During every major disaster, unrelated dramatic photos from earlier events in other countries are re-captioned as 'today, here'. The underlying disaster is real, so the false photo feels emotionally 'true' — and correcting it feels like denialism.",
      prevention: [
        "Reverse-image every dramatic viral photo before sharing.",
        "Zoom into signage, license plates, and weather details.",
        "A real disaster has real photos — insist on those.",
      ],
    },
  },

  /* ── T2 TRUE — the unbelievable story (paranoia trap) ──────── */
  {
    id: "unbelievable-true",
    title: "The unbelievable story",
    teaser: "A classmate sends a wild-sounding news item. Everything actually checks out.",
    tier: 2,
    verdict: "TRUE",
    sender: {
      name: "Maryam",
      relationship: "Classmate",
      voice: "excited, curious, sends receipts",
    },
    senderMotive:
      "She's genuinely surprised and wants to fact-check with you. Dismissing her rudely will make her stop bringing you anything.",
    opener:
      "Yaar you'll never believe this — apparently there's an official announcement about it. Real or fake??",
    forward: {
      meta: "Screenshot + link",
      headline:
        "Provincial ministry announces free public wi-fi for entire metro-bus network by next quarter",
      imageEmoji: "📶",
      imageAlt: "Screenshot of a news article headline with a ministry logo",
      bodyLines: [
        "Announcement covers all metro routes.",
        "Rollout begins in stages.",
        "Free tier capped at 500 MB per user per day.",
      ],
    },
    actions: [
      {
        id: "search-headline",
        label: "Search the headline",
        result:
          "Multiple established newsrooms carry the story with independent quotes from the transport minister.",
        decisive: true,
      },
      {
        id: "check-ministry",
        label: "Check the ministry's own press page",
        result:
          "A formal press release dated last week, with attached tender documents. Matches the article.",
        decisive: true,
      },
      {
        id: "check-date",
        label: "Check the date on the article",
        result: "Published 4 days ago. Recent, not resurfaced.",
      },
      {
        id: "reverse-image",
        label: "Reverse-search the article screenshot",
        result:
          "Screenshot appears only on the original newsroom's page. Not a template, not doctored.",
      },
      {
        id: "check-critical-coverage",
        label: "Look for critical / opposition takes",
        result:
          "Opposition figures are ARGUING about feasibility. Nobody disputes the announcement happened.",
        decisive: true,
      },
    ],
    truthNote:
      "This one is genuinely TRUE. If earlier scenarios trained you to reflex-dismiss, that reflex just became the problem. Rejecting truth as fake is called a FALSE ALARM.",
    respectfulScript:
      "Actually checked it — multiple outlets and the ministry's own press page have it. Real. Nice catch bringing it to check first though 👏",
  },

  /* ── T3 FALSE — miracle cure (emotional) ───────────────────── */
  {
    id: "miracle-cure",
    title: "The miracle cure",
    teaser: 'A worried aunt shares a health remedy "doctors don\'t want you to know."',
    tier: 3,
    verdict: "FALSE",
    sender: {
      name: "Khala Nusrat",
      relationship: "Direct message",
      voice: "gentle, deeply worried, calls you 'beta'",
    },
    senderMotive:
      "Her sister-in-law is unwell. She's terrified and clinging to hope. Her dignity meter is fragile from the first message.",
    opener:
      "Beta please share this with your Ammi and forward to Naila also. Doctors won't tell you this — Allah has given us a cure in our own kitchen. Please beta, don't ignore.",
    forward: {
      meta: "Forwarded many times",
      headline: "The kitchen ingredient that CURES [serious illness] in 7 days — doctors hiding it",
      imageEmoji: "🌿",
      imageAlt: "A pastel infographic with a leaf motif and testimonial quotes",
      bodyLines: [
        "Take X boiled with Y every morning on empty stomach.",
        "Renowned foreign researcher confirmed the cure but was silenced.",
        "Hospitals lose money if this becomes known.",
        "SHARE to save one life.",
      ],
    },
    actions: [
      {
        id: "search-claim",
        label: "Search the exact medical claim",
        result:
          "AFP, Reuters Fact Check, Soch Fact Check have all debunked variants of this exact claim.",
        decisive: true,
      },
      {
        id: "check-researcher",
        label: 'Look up the "renowned researcher"',
        result:
          "Name either does not exist in any academic database, or is real but attached to a completely different field.",
        decisive: true,
      },
      {
        id: "check-medical-body",
        label: "Check what a real medical body says",
        result:
          "WHO and the national health ministry explicitly warn against this remedy and note it can DELAY real treatment.",
        decisive: true,
      },
      {
        id: "check-formatting",
        label: "Look at how the message is framed",
        result:
          '"Doctors hiding it," "share to save a life," round-number promises. Classic health-misinformation signatures.',
      },
    ],
    truthNote:
      "This kind of forward can literally kill people by making them skip real treatment. The sender isn't malicious — she's scared for someone she loves.",
    respectfulScript:
      "Khala jaan I know how worried you are for Naila — I checked properly. WHO and Aga Khan both say this specific remedy doesn't work and can actually delay real treatment. Let's not share this one. But please tell me what the doctors have said — maybe we can help her another way ❤️",
  },

  /* ── T1 FALSE — free laptop scheme ─────────────────────────── */
  {
    id: "free-laptop",
    title: "The free-laptop scheme",
    teaser: '"Government giving free laptops to all students — register in 24hrs via this link!"',
    tier: 1,
    verdict: "FALSE",
    sender: {
      name: "Cousin Bilal",
      relationship: "Family group",
      voice: "helpful, wants to look useful, forwards fast",
    },
    senderMotive: "He genuinely thinks he's helping his younger cousins get a free laptop.",
    opener:
      "Bhai jaldi register karo — sirf 24 ghante hain! Free laptop for ALL students, official scheme!",
    forward: {
      meta: "Forwarded many times",
      headline: "GOVT FREE LAPTOP SCHEME 2026 — Register within 24 hours",
      imageEmoji: "💻",
      imageAlt: "A pixelated banner with an unofficial-looking logo",
      bodyLines: [
        "All students eligible. No merit required.",
        "Register at the link below before it closes.",
        "Only Rs 250 processing fee via easypaisa.",
        "Forward to every student you know.",
      ],
    },
    actions: [
      {
        id: "check-official",
        label: "Check the official HEC / education-ministry site",
        result:
          "No such scheme announced. Their laptop programs are always merit-based and never charge fees.",
        decisive: true,
      },
      {
        id: "inspect-link",
        label: "Inspect the registration link (without clicking)",
        result:
          "Lookalike domain — hyphens and extra letters mimicking a real .gov.pk address. Real government domains end in .gov.pk exactly.",
        decisive: true,
      },
      {
        id: "search-news",
        label: "Search for news coverage of the scheme",
        result:
          "Zero mainstream coverage. Only Facebook pages and WhatsApp forwards, all created in the last 30 days.",
      },
      {
        id: "check-fee",
        label: "Check whether real govt schemes charge a fee",
        result: "Legitimate student schemes NEVER ask for personal wallet payments to register.",
        decisive: true,
      },
    ],
    truthNote:
      "Classic phishing bait: fake urgency, small 'fee', lookalike domain. The 24-hour deadline is designed to bypass careful checking.",
    respectfulScript:
      "Bhai I checked HEC's actual site — no such scheme. That link is a lookalike domain and the 'Rs 250 fee' is the scam. Please don't forward this to the younger cousins, they'll get their easypaisa drained.",
    inspiredBy: {
      patternName: "Fake Government Scheme Phishing",
      country: "Pakistan / India",
      year: "2020–ongoing",
      whatHappened:
        "Fraud rings advertise 'free' government laptops, sewing machines, or scholarships requiring a small 'processing fee' to a personal wallet. The links resolve to lookalike domains that harvest CNIC data. FIA cybercrime routinely takes down waves of these.",
      prevention: [
        "Real government schemes never charge a fee to a personal wallet.",
        "Verify domains — real ones end in .gov.pk exactly, no hyphens.",
        "A '24-hour deadline' on a life-changing benefit is the trap.",
      ],
    },
  },

  /* ── T2 FALSE — kidnap-van rumor ───────────────────────────── */
  {
    id: "kidnap-van",
    title: "The kidnap-van rumor",
    teaser: '"White van kidnapping children in your area — share to all parents NOW."',
    tier: 2,
    verdict: "FALSE",
    sender: {
      name: "Aunty Rubina",
      relationship: "Neighborhood WhatsApp group",
      voice: "panicked, motherly, everything is in caps",
    },
    senderMotive:
      "She has three young children. This is the deepest fear a parent has, and someone she trusts sent it to her.",
    opener:
      "PLEASE PLEASE forward to every parent!! White van seen in OUR area kidnapping bachay!! Don't let kids play outside!!",
    forward: {
      meta: "Voice note + text · Forwarded many times",
      headline: "URGENT — Child-kidnapper van in the area",
      imageEmoji: "🚐",
      imageAlt: "A blurry photo of a generic white van",
      bodyLines: [
        "White van, no plates, seen near schools.",
        "Men inside grabbing children in broad daylight.",
        "Police doing nothing.",
        "Forward to every parent NOW.",
      ],
    },
    actions: [
      {
        id: "check-police",
        label: "Check with the local police station / 15",
        result:
          "No FIRs registered. Police confirm the same voice note has been circulating for over a year, moving from city to city.",
        decisive: true,
      },
      {
        id: "check-news",
        label: "Check news for kidnapping reports in the area",
        result:
          "Zero credible reports match this specific claim. Newsrooms have debunked the voice note multiple times.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-search the van photo",
        result:
          "Stock photo from a used-car listing in another country. Zero connection to the area.",
        decisive: true,
      },
      {
        id: "trace-audio",
        label: "Listen to the voice note carefully",
        result:
          "Same voice, same wording used in near-identical forwards from Karachi, Lahore, and rural Punjab over 18 months. Template panic.",
      },
    ],
    truthNote:
      "These 'child-kidnapper' voice notes have circulated for years across South Asia and beyond. In several countries they've led to lynchings of innocent strangers based on nothing. Fear travels faster than truth — that's the whole design.",
    respectfulScript:
      "Aunty I called 15 to check — no reports. This same voice note has been going around for over a year in different cities. Sharing it makes real parents panic and has actually got innocent people beaten up elsewhere. Better to send them the real school pickup safety tips ❤️",
    inspiredBy: {
      patternName: "Child-Kidnapper Van Panic",
      country: "Pakistan / India / global",
      year: "2017–ongoing",
      whatHappened:
        "Anonymous voice notes claiming child kidnappers in unmarked vans cycle through WhatsApp groups. In multiple documented cases they have caused mob attacks on strangers, including delivery workers and mentally-ill wanderers, who had nothing to do with any crime.",
      prevention: [
        "Fear-forwards spread fastest — treat them with the most skepticism, not the least.",
        "Verify against a real police helpline (in Pakistan, 15) before forwarding.",
        "'Share to every parent' is the signature of a hoax, not a warning.",
      ],
    },
  },

  /* ── T2 MISLEADING — the miracle doctor clip ──────────────── */
  {
    id: "doctor-clip",
    title: "The miracle-doctor clip",
    teaser:
      'A real doctor\'s real interview, cut to make him "endorse" a home remedy for diabetes.',
    tier: 2,
    verdict: "MISLEADING",
    sender: {
      name: "Uncle Farooq",
      relationship: "Family group",
      voice: "trusting, respects credentials, 'a doctor said it so it must be true'",
    },
    senderMotive: "His wife is pre-diabetic. This clip sounds like a real doctor giving real hope.",
    opener:
      "Dekho — asli doctor keh raha hai, sugar 7 din mein theek. Ammi ke liye share kar diya group mein.",
    forward: {
      meta: "Video clip · 42 seconds",
      headline: "Renowned doctor: kitchen remedy CURES diabetes in a week",
      imageEmoji: "🩺",
      imageAlt: "A short vertical clip of a doctor speaking",
      bodyLines: [
        "Doctor is real, hospital is real.",
        "Clip clearly shows him saying the remedy works.",
        "Millions of views — must be true.",
      ],
    },
    actions: [
      {
        id: "find-full-interview",
        label: "Find the FULL interview this clip is from",
        result:
          "The full 22-minute interview is on the newsroom's YouTube. In it the doctor says the OPPOSITE — the remedy does not work and can be dangerous if used to replace medication.",
        decisive: true,
      },
      {
        id: "check-edit-points",
        label: "Look for edit cuts in the clip",
        result:
          "Three hard cuts around the key sentence. Sentence stitched from three different parts of the interview.",
        decisive: true,
      },
      {
        id: "search-doctor-position",
        label: "Check the doctor's own public statement",
        result:
          "The doctor has publicly denounced the clip on his own social channels and asked people to stop sharing it.",
        decisive: true,
      },
      {
        id: "check-medical-body",
        label: "Check what medical bodies say about the remedy",
        result:
          "Diabetes association explicitly warns against skipping medication for this remedy.",
      },
    ],
    truthNote:
      "The clip is REAL footage — the doctor really exists and was really interviewed. But the framing is false. Real person, real face, false claim. That's why MISLEADING exists as a separate verdict — it hits harder than a straight fake.",
    respectfulScript:
      "Uncle asli clip main woh doctor bilkul ULTA keh raha hai — humein iska full interview mila. Woh khud keh raha hai yeh remedy khatarnak hai. Iss clip ko doctor ne bhi mana kiya hai. Ammi ke liye asli doctor's advice best hai ❤️",
    inspiredBy: {
      patternName: "Deceptive Edit of Real Expert",
      country: "Global",
      year: "2018–ongoing",
      whatHappened:
        "Genuine interviews with doctors, scientists, or officials are edited down to a few seconds that reverse the speaker's actual point. The subject's real face and real voice make the falsehood feel credible, and denials rarely reach the same audience as the clip.",
      prevention: [
        "Always find the full interview before believing a 30-second clip.",
        "Real experts often publicly denounce clips misusing them — search their name.",
        "Real footage + false framing is the most-used misinformation form today.",
      ],
    },
  },

  /* ── T2 TRUE — recalled medicine (paranoia trap) ──────────── */
  {
    id: "recalled-medicine",
    title: "The recalled medicine",
    teaser:
      "Scary forward: a common medicine batch has been recalled. Feels like a hoax — but it's true.",
    tier: 2,
    verdict: "TRUE",
    sender: {
      name: "Apa Sana",
      relationship: "Sister-in-law, direct message",
      voice: "concerned, mother-mode, careful with facts",
    },
    senderMotive:
      "Her mother takes this exact medicine daily. She wants a second pair of eyes before she panics her mother-in-law.",
    opener:
      "Yeh forward aya hai — DRAP ne recall kiya hai. Sach hai ya rumor? Ammi yehi lete hain roz.",
    forward: {
      meta: "Forwarded · with regulator screenshot",
      headline: "DRAP RECALLS BATCH OF COMMON BLOOD-PRESSURE MEDICINE",
      imageEmoji: "💊",
      imageAlt: "A regulator-style notice with a batch number",
      bodyLines: [
        "Batch number listed on the notice.",
        "Impurity detected in the batch.",
        "Users advised to check batch and return to pharmacy.",
      ],
    },
    actions: [
      {
        id: "check-drap",
        label: "Check DRAP's own website",
        result:
          "The recall notice is real and dated. Batch numbers match. DRAP has issued similar impurity recalls for this drug class before.",
        decisive: true,
      },
      {
        id: "check-news",
        label: "Check news coverage",
        result: "Multiple newsrooms have carried the story with quotes from DRAP officials.",
        decisive: true,
      },
      {
        id: "check-batch",
        label: "Cross-check the batch number format",
        result:
          "Batch number follows the manufacturer's real format. Nothing suspicious in the notice itself.",
        decisive: true,
      },
      {
        id: "check-manufacturer",
        label: "Check the manufacturer's site",
        result:
          "The manufacturer has issued its own statement confirming the recall and offering exchanges.",
      },
    ],
    truthNote:
      "TRUE. Real forwards that sound scary do exist. If you're primed to reflex-debunk everything, you'll dismiss real safety alerts — and that gets people hurt. The right move here is verify-then-warn, not verify-then-dismiss.",
    respectfulScript:
      "Apa main ne check kiya — bilkul asli hai, DRAP ki site pe hai notice. Ammi ki dawai ka batch number check karein aur pharmacy se exchange karwa lein. Achha kiya jo pehle check ki, ab confidently forward kar sakti hain family ko.",
    inspiredBy: {
      patternName: "Real Medicine Recall — Real Regulator Notice",
      country: "Pakistan / global",
      year: "2015–ongoing",
      whatHappened:
        "Drug regulators periodically recall batches of common medicines after impurity or contamination findings. These notices are genuine and safety-critical, but because 'scary forwards about medicine' are usually hoaxes, real recalls often get dismissed as rumors — and patients keep taking the affected batch.",
      prevention: [
        "Verify on the regulator's own site — don't dismiss on reflex.",
        "'Sounds unbelievable' is not evidence something is false.",
        "For safety notices, the correct action is verify-THEN-warn, not verify-then-dismiss.",
      ],
    },
  },

  /* ── T3 MISLEADING — old protest photo ────────────────────── */
  {
    id: "old-protest",
    title: "The old protest photo",
    teaser:
      "A dramatic crowd photo, captioned as 'yesterday' — really from another country in 2019.",
    tier: 3,
    verdict: "MISLEADING",
    sender: {
      name: "Cousin Umair",
      relationship: "Direct message",
      voice: "proud, chest-out, 'I was basically there'",
    },
    senderMotive:
      "He genuinely believes he's amplifying his own community's cause. Calling him out feels like calling him a liar in public.",
    opener:
      "Yaar dekh yeh crowd — this was YESTERDAY. History bana rahi hai humari qaum. Sab share karo.",
    forward: {
      meta: "Forwarded via WhatsApp",
      imageEmoji: "🏙️",
      imageAlt: "A vast crowd photo taken from above",
      bodyLines: [
        "Yesterday's local demonstration.",
        "Millions turned out — biggest in history.",
        "Foreign media not showing it.",
      ],
    },
    actions: [
      {
        id: "reverse-image",
        label: "Reverse-search the image",
        result:
          "Same image appears in international coverage of a 2019 protest in a different country. Original photographer credited on wire services.",
        decisive: true,
      },
      {
        id: "check-weather",
        label: "Check the weather / clothing in the image",
        result: "Crowd is in winter coats; local weather right now is 34°C. Nothing matches.",
        decisive: true,
      },
      {
        id: "check-local-news",
        label: "Check local news for yesterday's demonstration",
        result:
          "Local newsrooms did cover it — actual crowd photos exist, and the crowd is real but noticeably smaller than the reused image.",
        decisive: true,
      },
      {
        id: "check-caption-history",
        label: "Search the caption text",
        result:
          "Same caption has been used with the same photo across at least four different countries in the last three years.",
      },
    ],
    truthNote:
      "The local event IS real. The photo is not. This pattern makes real causes look dishonest — the strongest ammunition for opponents is a supporter's exaggerated image.",
    respectfulScript:
      "Bhai the event is real — but this specific photo is from a 2019 protest in another country. Reverse-image confirms it. Using the real local photos is stronger, not weaker, because they can't be discredited. Let me send you the actual local coverage.",
    inspiredBy: {
      patternName: "Recycled Crowd Photo",
      country: "Global",
      year: "2011–ongoing",
      whatHappened:
        "Dramatic crowd photos from earlier protests, sports events, or religious gatherings get re-captioned as 'today, here' to inflate the apparent size of a current cause. Once debunked, they become the go-to counter-argument used to discredit the entire real movement.",
      prevention: [
        "Reverse-image before amplifying any 'biggest ever' crowd photo.",
        "Weather, clothing, and skyline are quick sanity checks.",
        "For your own cause, real photos are stronger — they can't be discredited.",
      ],
    },
  },

  /* ── T3 FALSE — job circular PDF ──────────────────────────── */
  {
    id: "job-circular",
    title: "The fake job circular",
    teaser: "Official-looking PDF: government job openings, small application fee via wallet.",
    tier: 3,
    verdict: "FALSE",
    sender: {
      name: "Uncle Kashif",
      relationship: "Extended family group",
      voice: "generous, wants to help unemployed nephews, forwards without opening PDFs",
    },
    senderMotive: "His nephew has been jobless for months. This looks like a lifeline.",
    opener:
      "Bhai jaan yeh dekho — government mein bharti khul gayi hai. Apne bhaanjay ko bhi bhej dena, Rs 500 fee hai bas.",
    forward: {
      meta: "PDF attached",
      headline: "GOVT RECRUITMENT 2026 — 5000 posts open, apply via wallet",
      imageEmoji: "📄",
      imageAlt: "A PDF with government-style header and stamps",
      bodyLines: [
        "5000 vacancies across grades 5-14.",
        "Rs 500 non-refundable application fee via personal wallet number listed on last page.",
        "Deadline in 3 days.",
        "Send CNIC copy and photo to the WhatsApp number on the form.",
      ],
    },
    actions: [
      {
        id: "check-official-site",
        label: "Check the actual department's site",
        result:
          "No such recruitment posted. Real recruitments go through FPSC / PPSC portals with fee via specific bank challans, never a personal wallet.",
        decisive: true,
      },
      {
        id: "inspect-pdf-metadata",
        label: "Inspect the PDF metadata",
        result:
          "Created three days ago in a free PDF editor. Author field contains a random name. Real government PDFs are signed and stamped digitally.",
        decisive: true,
      },
      {
        id: "check-fee-channel",
        label: "Check what fee channels real govt jobs use",
        result:
          "Real recruitments use pre-printed bank challans at specified branches — never a personal easypaisa/jazzcash number.",
        decisive: true,
      },
      {
        id: "check-cnic-ask",
        label: "Note what they're asking to be sent",
        result:
          "CNIC + photo + wallet fee = complete kit for identity fraud. Real applications never take these over WhatsApp.",
      },
    ],
    truthNote:
      "This is a compound scam: they get your fee, your CNIC copy, and your photo — enough to open fraudulent accounts in your name. Youth unemployment makes it devastating; the emotional pressure to 'help a jobless nephew' is the whole exploit.",
    respectfulScript:
      "Uncle main ne check kiya — asli site pe koi aisi bharti nahi hai. Personal wallet mein fee lene wali koi asli sarkari job nahi hoti — yeh scam hai. Aur CNIC copy WhatsApp par kabhi nahi bhejni. Bhaanjay ko FPSC/PPSC portal ka link bhejta hoon, woh asli hai.",
    inspiredBy: {
      patternName: "Fake Government Job / Recruitment PDF",
      country: "Pakistan / India",
      year: "2016–ongoing",
      whatHappened:
        "Fraudsters circulate professional-looking PDFs mimicking government recruitment notifications. Victims pay a small 'application fee' to a personal wallet and send their CNIC + photo, which are then used to open fraudulent SIM cards, wallets, and bank accounts.",
      prevention: [
        "Real government jobs use FPSC / PPSC portals and printed bank challans — never personal wallets.",
        "Never send CNIC copies over WhatsApp or Telegram.",
        "Verify recruitment on the actual department's site before paying anything.",
      ],
    },
  },

  /* ── T3 TRUE — weird-but-true rule ────────────────────────── */
  {
    id: "weird-but-true",
    title: "The weird-but-true rule",
    teaser: "A wild-sounding new regulation. Sounds fake. Turns out to be on the official gazette.",
    tier: 3,
    verdict: "TRUE",
    sender: {
      name: "Colleague Adnan",
      relationship: "Work Slack",
      voice: "dry, likes weird laws, sends the source",
    },
    senderMotive: "He's not panicking — he's genuinely curious and wants a sanity check.",
    opener:
      "This can't be real, right? But someone said it's actually gazetted. Have a look when free.",
    forward: {
      meta: "Article + linked gazette PDF",
      headline: "New rule requires unusual labeling on all X products",
      imageEmoji: "📜",
      imageAlt: "Screenshot of an official gazette notification",
      bodyLines: [
        "Rule sounds bizarre.",
        "Article claims it's official and enforced.",
        "Effective from next quarter.",
      ],
    },
    actions: [
      {
        id: "check-gazette",
        label: "Open the official gazette PDF",
        result:
          "The rule is genuinely gazetted, with signatures and date. It IS the law from next quarter.",
        decisive: true,
      },
      {
        id: "check-news",
        label: "Cross-check with mainstream news",
        result:
          "Multiple newsrooms have covered it. Analysts arguing about enforcement, none disputing the notification exists.",
        decisive: true,
      },
      {
        id: "check-ministry",
        label: "Check the ministry's own site",
        result: "Ministry page confirms and provides an FAQ for implementation.",
        decisive: true,
      },
      {
        id: "sanity-check-domain",
        label: "Sanity-check the gazette PDF's source URL",
        result: "URL is on the official gazette domain, not a lookalike. PDF is digitally signed.",
      },
    ],
    truthNote:
      'TRUE. "Unbelievable" is not evidence of "false". Real laws, real regulations, and real bureaucratic decisions can and do sound absurd. If your only test is \'does it sound plausible\', you\'ll reject the truth constantly.',
    respectfulScript:
      "Weird but yeah — it's really gazetted, I checked the PDF directly. The ministry has an FAQ page too. So it's the law from next quarter. Good instinct to check first though — most of these turn out to be hoaxes.",
  },

  /* ── T3 UNVERIFIED — earthquake prediction ─────────────────── */
  {
    id: "earthquake-prediction",
    title: "The earthquake prediction",
    teaser: '"Scientist predicts a big quake this week — share to save lives."',
    tier: 3,
    verdict: "UNVERIFIED",
    sender: {
      name: "Ammi's WhatsApp group",
      relationship: "Family broadcast",
      voice: "concerned mothers, deeply protective, 'better safe than sorry'",
    },
    senderMotive:
      "They love the family. The forward comes with a photo of a real seismologist and the phrase 'better safe than sorry'.",
    opener:
      "Beta please save this. Foreign scientist ne prediction diya hai — bara zalzala aane wala hai iss hafte. Share to all family for safety.",
    forward: {
      meta: "Forwarded · with scientist's photo",
      headline: "Renowned seismologist predicts major quake this week — take precautions",
      imageEmoji: "🌍",
      imageAlt: "A photo of a real scientist with an alarming caption",
      bodyLines: [
        "'Big quake incoming this week.'",
        "Named foreign scientist attached.",
        "Save your family — forward now.",
      ],
    },
    actions: [
      {
        id: "check-scientist",
        label: "Look up the named scientist's real work",
        result:
          "Scientist is real, but has never issued this prediction. Their institution has publicly denied the quote.",
        decisive: true,
      },
      {
        id: "check-usgs",
        label: "Check USGS / national seismology body",
        result:
          "USGS and every serious seismology body state clearly: earthquakes CANNOT be predicted to a specific week. Anyone claiming otherwise is not doing science.",
        decisive: true,
      },
      {
        id: "check-history",
        label: "Search past 'quake prediction' forwards",
        result:
          "Near-identical forwards have circulated for over a decade, always attached to a different real scientist. None have ever been accurate.",
        decisive: true,
      },
      {
        id: "check-fault-activity",
        label: "Check current fault activity in the region",
        result:
          "The region IS seismically active. A quake COULD happen — this week, next week, or in ten years. Nothing here disproves 'a quake could happen', but nothing supports 'this specific week' either.",
      },
    ],
    truthNote:
      "This one is the honest UNVERIFIED. The prediction is not verifiable because earthquakes cannot be predicted — but you also can't 'prove' a quake won't happen. The correct verdict is UNVERIFIED, and the correct action is: don't forward fear that cannot be checked. UNVERIFIED is not a cop-out — it's the honest 'we cannot know', and refusing to say it is how false certainty spreads in both directions.",
    respectfulScript:
      "Ammi jaan — main ne check kiya. Woh scientist asli hain lekin unhone yeh prediction kabhi nahi di, unke institute ne bhi mana kiya. USGS clearly kehta hai zalzale ki prediction possible hi nahi. Zalzala aa bhi sakta hai kabhi bhi — lekin iss specific hafte ki koi verified warning nahi hai. Fear forward nahi karna behtar hai. Asli disaster prep tips send karti hoon aap ke liye ❤️",
    inspiredBy: {
      patternName: "Fake Earthquake / Disaster Prediction",
      country: "Global",
      year: "2010–ongoing",
      whatHappened:
        "Forwards falsely attribute specific-week earthquake, tsunami, or eclipse-disaster predictions to real scientists (usually with their photo). The scientists have never made these claims — often their institutions issue public denials that get far less circulation than the original hoax.",
      prevention: [
        "Earthquakes cannot be predicted to a specific week — that's settled science.",
        "Real disaster prep advice comes from NDMA / PDMA / USGS, not forwards.",
        "UNVERIFIED is a legitimate verdict — don't forward fear you can't confirm.",
      ],
    },
  },
];

/* ── NEW CASES — media-format & AI-literacy expansion ─────────── */

const NEW_CASES: FeedScenario[] = [
  {
    id: "insta-brand-giveaway",
    title: "The Instagram brand giveaway",
    teaser:
      'A shiny post promises a free iPhone if you tag 3 friends and pay a small "shipping fee".',
    tier: 1,
    verdict: "FALSE",
    format: "instagram",
    tacticId: "imposter-outlet",
    sender: {
      name: "Cousin Areeba",
      relationship: "Instagram DM",
      voice: "excited, sends screenshots, uses emojis",
    },
    senderMotive: "She saw a real friend she trusts also 'won' one. It felt legit.",
    opener:
      "Yaar look at this — free iPhone giveaway, sirf tag karna hai! Main ne register kar diya, tum bhi karo 🎁📱",
    forward: {
      meta: "@apple.giftshop.official · 4h",
      headline: "🎉 iPhone 17 GIVEAWAY — 500 winners this week",
      imageEmoji: "📱",
      imageAlt: "Instagram post showing an iPhone with confetti overlays",
      bodyLines: [
        "Follow · like · tag 3 friends.",
        "Rs 950 shipping fee via easypaisa to confirm.",
        "12,438 likes · 847 comments — mostly 'thank you got mine!'",
      ],
    },
    actions: [
      {
        id: "check-handle",
        label: "Open Apple's real Instagram handle",
        tool: "check_source",
        result:
          "Real handle is @apple with a verified check. This one is @apple.giftshop.official — extra words, no check mark. Created 6 weeks ago.",
        decisive: true,
      },
      {
        id: "check-website",
        label: "Check Apple's website for the giveaway",
        tool: "check_source",
        result: "No such campaign on apple.com. Apple has never run a paid-shipping giveaway.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-search the giveaway image",
        tool: "reverse_image",
        result:
          "The 'iPhone with confetti' image is a stock render used by dozens of copycat pages.",
        decisive: true,
      },
      {
        id: "check-comments",
        label: "Read the 'winner' comments carefully",
        tool: "check_source",
        result:
          "All 'thank you got mine' comments come from accounts with zero posts, generic names, and were created in the same week.",
      },
    ],
    truthNote:
      "Legit brand giveaways never charge a shipping fee to a personal wallet. The lookalike handle + fake winner comments are the whole trap.",
    respectfulScript:
      "Areeba yeh page fake hai — asli Apple handle @apple hai (verified). Yeh ek scam page hai jo shipping fee ke naam pe paisa maang raha hai. Register mat karna, aur mujhe screenshot bhej do main isay report karta hoon.",
    inspiredBy: {
      patternName: "Fake Brand Giveaway",
      country: "Global",
      year: "2018–ongoing",
      whatHappened:
        "Copycat Instagram/Facebook pages impersonate major brands with slightly altered handles. They run 'giveaways' that require a small payment or personal data. The 'winners' in comments are bot accounts created the same week.",
      prevention: [
        "Real brand accounts are verified — always check the tick.",
        "No brand charges a personal wallet for shipping.",
        "Trace comment authors — bots have empty timelines.",
      ],
    },
  },

  {
    id: "news-screenshot-riot",
    title: "The news screenshot",
    teaser: '"BBC just reported this — riots in Karachi, government hiding it."',
    tier: 2,
    verdict: "FALSE",
    format: "news",
    tacticId: "imposter-outlet",
    sender: {
      name: "Uncle Imtiaz",
      relationship: "Family group",
      voice: "grave, cites 'foreign media', trusts BBC over local channels",
    },
    senderMotive: "He genuinely believes foreign media tells the truth local media hides.",
    opener:
      "Yeh BBC ki khabar hai — humare media ko dekho, ek word nahi kiya. Shame. Share karo sab ko.",
    forward: {
      meta: "screenshot from BBC.com",
      headline: "Major riots erupt in Karachi as protesters clash with police",
      imageEmoji: "🏛️",
      imageAlt: "A news-article screenshot with a red BBC-style logo",
      bodyLines: [
        "BBC News · 2 hours ago",
        "Thousands reported injured, army called in.",
        "Government has cut internet in affected districts.",
      ],
    },
    actions: [
      {
        id: "check-bbc",
        label: "Open BBC.com and search the headline",
        tool: "check_source",
        result:
          "No such story on bbc.com or bbc.com/urdu. The real BBC has published nothing matching this today.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Cross-check other outlets",
        tool: "cross_check",
        result:
          "Neither Dawn, Reuters, AFP, nor Al Jazeera carries this story. Zero corroboration anywhere.",
        decisive: true,
      },
      {
        id: "check-logo",
        label: "Zoom into the logo and font",
        tool: "check_source",
        result:
          "Logo is close but font weight is wrong. Real BBC uses BBC Reith — this screenshot uses generic Arial Bold.",
      },
      {
        id: "check-date",
        label: "Check the timestamp format",
        tool: "check_date",
        result:
          "'2 hours ago' with no date. Real BBC articles show a full timestamp with timezone.",
        decisive: true,
      },
    ],
    truthNote:
      "This is a fabricated news screenshot inside a lookalike BBC frame. Real journalism has a URL you can open — a screenshot alone is never a source.",
    respectfulScript:
      "Uncle main ne BBC ki website khud khol ke check ki — yeh khabar wahan bilkul nahi hai. Yeh screenshot fake hai, logo bhi thora sa off hai. Foreign media pe trust achhi cheez hai — lekin unki actual site pe ja ke confirm karna zaroori hai. Screenshot alone is not a source.",
    inspiredBy: {
      patternName: "Fabricated News Screenshot",
      country: "Global",
      year: "2015–ongoing",
      whatHappened:
        "Fake screenshots styled after major newsrooms (BBC, Reuters, Al Jazeera, CNN) circulate as 'proof' of stories those outlets never published. The visual authority of the logo does the work — most recipients never open the actual site.",
      prevention: [
        "A screenshot alone is not evidence — open the real site.",
        "Real newsrooms have URLs, timestamps with timezones, and archive.org copies.",
        "Foreign-media authority is exactly what makes forgery valuable.",
      ],
    },
  },

  {
    id: "viral-photo-flood",
    title: "The heartbreaking flood photo",
    teaser: 'A child sits on a rooftop as water rises — captioned as "today, Sindh".',
    tier: 2,
    verdict: "MISLEADING",
    format: "image",
    tacticId: "out-of-context",
    sender: {
      name: "Ammi",
      relationship: "Direct WhatsApp",
      voice: "emotional, protective, sends duas",
    },
    senderMotive:
      "She's watching real floods on TV and this photo made her cry. She wants people to donate.",
    opener:
      "Beta dekho — Sindh ke hallat. Yeh bacha subah se chhat pe akela hai. Please share, log donate karain.",
    forward: {
      meta: "shared 4× today",
      headline: "TODAY in Sindh — please pray and donate",
      imageEmoji: "🏚️",
      imageAlt: "A child on a rooftop with rising water and grey sky",
      bodyLines: ["Pakistan is drowning.", "Government sleeping.", "Share to spread awareness."],
    },
    actions: [
      {
        id: "reverse-image",
        label: "Reverse-search the photo",
        tool: "reverse_image",
        result:
          "This exact image appears in international wire services from 2013 Bangladesh floods. The child was rescued that same day.",
        decisive: true,
      },
      {
        id: "check-sindh",
        label: "Check whether Sindh floods are actually happening now",
        tool: "cross_check",
        result:
          "Yes — PDMA and multiple newsrooms confirm real, ongoing flooding in Sindh right now, with different verified photos.",
        decisive: true,
      },
      {
        id: "check-date",
        label: "Check the photo's EXIF / earliest online date",
        tool: "check_date",
        result:
          "Earliest online appearance: 2013. It has resurfaced during every South Asian flood since.",
        decisive: true,
      },
      {
        id: "check-donation",
        label: "Check the donation link if any",
        tool: "check_source",
        result:
          "No donation link at all — just an emotional caption. Legit relief campaigns always name the receiving org.",
      },
    ],
    truthNote:
      "The Sindh flood is real. This photo is not from Sindh, not from now, and not from that child today. Real disaster, wrong image — MISLEADING, not simply fake.",
    respectfulScript:
      "Ammi jaan, Sindh mein flood bilkul asli hai — lekin yeh khaas tasveer 2013 ke Bangladesh flood ki hai, aur woh bacha wahan usi din safe ho gaya tha. Agar hum ghalat photo forward karain, log kal ko asli flood pe bhi shak karain ge. Main aap ko Alkhidmat aur JDC ke asli donation links bhejta hoon — woh iss waqt zameen pe kaam kar rahe hain ❤️",
    inspiredBy: {
      patternName: "Recycled Disaster Photo (Emotional)",
      country: "Global",
      year: "2013–ongoing",
      whatHappened:
        "During every major flood, cyclone, or earthquake, emotional archive images resurface with new captions. The disaster is real, so the false image feels 'emotionally true' — and correcting it feels like denialism.",
      prevention: [
        "Reverse-image every viral disaster photo before sharing.",
        "Direct donations to named, verified relief orgs.",
        "'Real disaster, wrong photo' is the most common MIL trap in South Asia.",
      ],
    },
  },

  {
    id: "video-cure-tiktok",
    title: "The 30-second cure video",
    teaser: "A short vertical clip of a smiling 'doctor' promising a diabetes cure in a week.",
    tier: 2,
    verdict: "MISLEADING",
    format: "video",
    tacticId: "out-of-context",
    sender: {
      name: "Uncle Waseem",
      relationship: "Family group",
      voice: "trusts anything in a lab coat",
    },
    senderMotive:
      "His brother has diabetes and this clip sounds like a real doctor giving real hope.",
    opener:
      "Bhai dekho, yeh doctor sahab live keh rahe hain — cure hai. Bilal ke liye share kar do.",
    forward: {
      meta: "TikTok · 42s · reposted",
      headline: "Doctor: sugar 7 din mein khatam",
      imageEmoji: "🩺",
      imageAlt: "A doctor in a white coat mid-sentence",
      bodyLines: ["Clip clearly shows him saying the remedy works.", "1.2M views · 84K shares."],
    },
    actions: [
      {
        id: "find-full",
        label: "Find the full original interview",
        tool: "cross_check",
        result:
          "The 22-minute source interview is on the newsroom's YouTube. In it, the doctor says the OPPOSITE — the remedy does not work and can be dangerous.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-search a video frame",
        tool: "reverse_image",
        result:
          "The frame maps to a real 2023 news-channel interview about diabetes management, not any 'cure'.",
        decisive: true,
      },
      {
        id: "check-doctor",
        label: "Check the doctor's own public statement",
        tool: "check_source",
        result: "The doctor has publicly denounced the clip and asked people to stop sharing it.",
        decisive: true,
      },
      {
        id: "check-cuts",
        label: "Look for edit cuts in the clip",
        tool: "check_date",
        result:
          "Three hard cuts around the key sentence — stitched from three different parts of a longer interview.",
      },
    ],
    truthNote:
      "The doctor is real. The face is real. The framing is false. Real person + false framing is the most-used misinformation form today.",
    respectfulScript:
      "Uncle iss clip ka full interview YouTube pe hai — doctor sahab wahan bilkul ULTA keh rahe hain, yeh remedy woh khud mana kar rahe hain. Unhone khud clip disown ki hai. Bilal ke liye asli endocrinologist se milna behtar hai — main ek recommend karta hoon ❤️",
    inspiredBy: {
      patternName: "Deceptive Edit of Real Expert",
      country: "Global",
      year: "2018–ongoing",
      whatHappened:
        "Real interviews with doctors and scientists are cut to seconds that reverse the speaker's point. The real face lends real credibility. Denials rarely reach the same audience as the clip.",
      prevention: [
        "Find the full interview before believing a 30-second cut.",
        "Search the expert's name — they often publicly denounce misuse.",
        "Real footage + false framing is today's dominant misinformation form.",
      ],
    },
  },

  {
    id: "job-dubai-offer",
    title: "The Dubai job offer",
    teaser:
      '"CONGRATULATIONS — you\'ve been selected for a hotel job in Dubai. Send Rs 15,000 processing fee."',
    tier: 2,
    verdict: "FALSE",
    format: "whatsapp",
    tacticId: "phishing",
    sender: {
      name: "Neighbour Faisal",
      relationship: "Direct message",
      voice: "hopeful, unemployed for months, forwards fast",
    },
    senderMotive:
      "He's been jobless for 8 months. This message arrived at 2am and felt like an answer to prayer.",
    opener:
      "Bhai yeh dekho — mujhe Dubai job offer aya hai, hotel mein. Rs 15,000 processing fee hai bas. Kya karoon?",
    forward: {
      meta: "WhatsApp · from +971 5X XXX XXXX",
      headline: "SELECTION LETTER — DUBAI HOSPITALITY GROUP",
      imageEmoji: "🏨",
      imageAlt: "A hotel-letterhead style PDF thumbnail",
      bodyLines: [
        "You have been shortlisted based on your CV.",
        "Salary: AED 4,500 + accommodation + visa.",
        "Processing fee: PKR 15,000 to secure position (refundable on arrival).",
        "Reply with CNIC, photo, passport copy today.",
      ],
    },
    actions: [
      {
        id: "check-agency",
        label: "Check the recruitment agency on Protector of Emigrants (BEOE)",
        tool: "check_source",
        result:
          "No such licensed agency on the BEOE list. All legitimate overseas recruitment must be through licensed agencies.",
        decisive: true,
      },
      {
        id: "check-hotel",
        label: "Check the hotel's actual careers page",
        tool: "check_source",
        result:
          "No such vacancy or campaign on the hotel group's own site. Their real hiring goes through named recruiters.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Search the offer text online",
        tool: "cross_check",
        result:
          "Near-identical letter appears on FIA cybercrime alert pages as a documented scam template.",
        decisive: true,
      },
      {
        id: "check-cnic-ask",
        label: "Note what's being asked over WhatsApp",
        tool: "check_date",
        result:
          "CNIC + photo + passport + wallet fee = complete kit for identity fraud. Real employers never take this over WhatsApp.",
      },
    ],
    truthNote:
      "Legitimate overseas jobs are placed through BEOE-licensed agencies with printed challans and named employers — never via WhatsApp with a personal-wallet 'processing fee'. Youth unemployment is the whole exploit.",
    respectfulScript:
      "Bhai yeh 100% scam hai — BEOE ki list pe yeh agency hai hi nahi. Legit Dubai jobs kabhi WhatsApp pe CNIC copy nahi maangte, aur na hi personal wallet mein fee lete hain. Paisay mat bhejna. Main tumhein 2 asli BEOE-licensed agencies ke naam bhejta hoon — un se apply karo.",
    inspiredBy: {
      patternName: "Fake Overseas Job Offer",
      country: "Global",
      year: "2010–ongoing",
      whatHappened:
        "Fraudsters send fake selection letters for jobs in the Gulf, Europe, or Canada, extracting 'processing fees' and identity documents. Victims lose money and often have their CNIC used to open fraudulent accounts.",
      prevention: [
        "All legit overseas recruitment from Pakistan goes through BEOE-licensed agencies.",
        "Verify the employer on their own site — never trust a WhatsApp letter.",
        "Never send CNIC or passport copies over WhatsApp.",
      ],
    },
  },

  {
    id: "disaster-charity-scam",
    title: "The disaster charity account",
    teaser:
      "After an earthquake, a WhatsApp forward pushes a 'relief fund' account number — same day.",
    tier: 3,
    verdict: "FALSE",
    format: "whatsapp",
    tacticId: "phishing",
    sender: {
      name: "Aunty Shameem",
      relationship: "Neighbourhood group",
      voice: "generous, motherly, first to donate for any tragedy",
    },
    senderMotive: "She's genuinely moved by the earthquake and wants to help immediately.",
    opener:
      "Bacchon zalzale ke liye emergency relief fund — please jo bhi ho sake donate karain. Time short hai.",
    forward: {
      meta: "Forwarded many times",
      headline: "EARTHQUAKE RELIEF FUND — donate NOW",
      imageEmoji: "🚨",
      imageAlt: "A dark red banner with a distressed family photo",
      bodyLines: [
        "Personal easypaisa: 0300-XXXXXXX (Aslam Bhai, coordinator)",
        "100% goes to affected families.",
        "Time-critical — please forward to all groups.",
      ],
    },
    actions: [
      {
        id: "check-org",
        label: "Search for the org name behind the account",
        tool: "check_source",
        result:
          "There is no registered NGO tied to this account number. 'Aslam Bhai' is not a known relief coordinator anywhere.",
        decisive: true,
      },
      {
        id: "cross-check-orgs",
        label: "Cross-check real orgs on the ground",
        tool: "cross_check",
        result:
          "Alkhidmat, Edhi, JDC, and PRCS have all published their OFFICIAL relief accounts on their verified websites and social handles. None match this one.",
        decisive: true,
      },
      {
        id: "check-account",
        label: "Search the wallet number online",
        tool: "check_source",
        result:
          "Number appears on FIA cybercrime alerts and Twitter warnings from real relief workers as a known scam number.",
      },
      {
        id: "check-timing",
        label: "Note the timing",
        tool: "check_date",
        result:
          "Message sent within 6 hours of the disaster — genuine relief orgs need at least a day to set up channels and always publish through their official pages first.",
        decisive: true,
      },
    ],
    truthNote:
      "Disaster charity fraud is a global constant — scammers race real NGOs by hours. Personal wallet numbers for 'relief' are the giveaway. Real relief moves through registered orgs, not individuals.",
    respectfulScript:
      "Aunty aap ka dil bara hai — lekin yeh account fake hai. Real relief kabhi kisi ke personal easypaisa pe nahi jata. Alkhidmat, Edhi, JDC, aur PRCS ke official accounts un ki verified sites pe hain — main aap ko links bhejti hoon. Aap ka donation asli logon tak pahunche, yeh ehm hai ❤️",
    inspiredBy: {
      patternName: "Disaster Charity Fraud",
      country: "Global",
      year: "2004–ongoing",
      whatHappened:
        "Within hours of any earthquake, flood, or tsunami, scammers circulate fake 'relief fund' account numbers, exploiting the urgency and generosity of the moment. Real NGOs take longer to publish channels — the scammers get there first.",
      prevention: [
        "Real relief goes through registered orgs, not personal wallets.",
        "Donate only via accounts published on the NGO's own verified site.",
        "Any 'urgent, share now' donation ask within hours of a disaster is suspect.",
      ],
    },
  },

  {
    id: "ai-deepfake-pm",
    title: "The AI-cloned voice note",
    teaser: "A 12-second voice note of a well-known figure 'admitting' something explosive.",
    tier: 3,
    verdict: "FALSE",
    format: "video",
    aiGenerated: true,
    tacticId: "ai-generated",
    sender: {
      name: "Cousin Zohaib",
      relationship: "Political-debate WhatsApp group",
      voice: "chest-out, 'finally the truth is out'",
    },
    senderMotive:
      "This confirms everything he already believed. He forwarded before playing it twice.",
    opener:
      "Bhai audio sun — asli awaaz, koi shak nahi. Sab groups mein share karo, log haqeeqat jaanein.",
    forward: {
      meta: "Voice note · 12s · reposted from Telegram",
      headline: "Leaked audio — [famous figure] confesses off-record",
      imageEmoji: "🎙️",
      imageAlt: "A blurred official photo with an audio waveform overlay",
      bodyLines: [
        "Voice matches perfectly.",
        "Says exactly what critics have alleged for years.",
        "Not on any news channel yet — 'they're hiding it'.",
      ],
    },
    actions: [
      {
        id: "cross-check",
        label: "Cross-check with mainstream newsrooms",
        tool: "cross_check",
        result:
          "Zero credible outlets carry this. AFP Fact Check has flagged the audio as AI-generated with a named detection lab report.",
        decisive: true,
      },
      {
        id: "check-source",
        label: "Trace the earliest post of the audio",
        tool: "check_source",
        result:
          "First surfaced on an anonymous Telegram channel with a track record of AI-generated forgeries. No named source, no original video, no press conference context.",
        decisive: true,
      },
      {
        id: "check-listen",
        label: "Listen carefully for AI artifacts",
        tool: "reverse_image",
        result:
          "Some odd breathing rhythm and one unusual sibilance. But state-of-the-art AI voices are already smoother than this — 'sounds real' is no longer a defence.",
      },
      {
        id: "check-official",
        label: "Check the figure's own channels and press office",
        tool: "check_source",
        result:
          "Official spokesperson has publicly denied the audio and shared a verified detection lab analysis calling it synthetic.",
        decisive: true,
      },
    ],
    truthNote:
      "This is AI-generated audio. Spotting the artifact is a losing arms race — models keep improving. The winning move is SOURCE-checking: where did it come from, who confirms it, does the person's own office deny it? The Forgery Engine has arrived.",
    respectfulScript:
      "Zohaib bhai — AFP Fact Check ne iss audio ko AI-generated declare kiya hai, aur khud [figure] ke office ne bhi mana kiya hai. Main aap ko dono links bhejta hoon. Audio bilkul asli lag rahi hai, lekin AI ab yehi kaam karti hai — isi liye 'sunne mein asli lagi' ab proof nahi. Source check karna aik siyasi position se pehle zaroori hai.",
    inspiredBy: {
      patternName: "AI-Cloned Voice / Deepfake Audio",
      country: "Global",
      year: "2023–ongoing",
      whatHappened:
        "Consumer-grade voice cloning can now impersonate anyone from a minute of public audio. Fake 'confessions' and 'leaked calls' of politicians, CEOs, and even family members have been used to swing elections, authorise wire transfers, and extract ransoms.",
      prevention: [
        "Source-check, not sound-check. Where did the audio come from?",
        "The subject's own verified channels are the fastest denial route.",
        "Independent detection labs (AFP, DeepMedia, Reality Defender) publish forensic reports.",
      ],
    },
  },

  {
    id: "ai-generated-photo",
    title: "The AI-generated 'protest photo'",
    teaser: "A photorealistic image of a huge protest that never happened.",
    tier: 3,
    verdict: "FALSE",
    format: "image",
    aiGenerated: true,
    tacticId: "forgery-engine",
    sender: {
      name: "Uncle Rehan",
      relationship: "Family group",
      voice: "activist, forwards political imagery, distrusts local media",
    },
    senderMotive: "He believes this proves the cause he supports is finally getting the numbers.",
    opener: "Yeh dekho — massive protest, kal shaam. Foreign media bhi hidden. Share every group.",
    forward: {
      meta: "Photo · claimed 'yesterday'",
      headline: "Massive turnout — biggest gathering in years",
      imageEmoji: "🌆",
      imageAlt: "A crowd photo with slightly-off faces and duplicated banners",
      bodyLines: [
        "Aerial shot of a huge crowd at dusk.",
        "'Millions turned out.'",
        "No coverage on any channel.",
      ],
    },
    actions: [
      {
        id: "reverse-image",
        label: "Reverse-image search the photo",
        tool: "reverse_image",
        result:
          "No match anywhere except the WhatsApp forwards themselves. Not a real archive photo — but also not any known place.",
        decisive: true,
      },
      {
        id: "check-details",
        label: "Zoom into faces and banners",
        tool: "reverse_image",
        result:
          "Several faces have subtly warped features. Banner text is unreadable gibberish in a few places. Both are classic diffusion-model tells — but they're getting rarer.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Cross-check any coverage or witness videos",
        tool: "cross_check",
        result:
          "Zero videos, zero eyewitness posts, zero geotagged content from that time or place. A crowd of this size cannot happen without hundreds of independent phones.",
        decisive: true,
      },
      {
        id: "check-detector",
        label: "Run through an AI-image detector",
        tool: "check_source",
        result:
          "Detectors flag high probability of AI generation. Detectors are imperfect — but combined with zero independent witnesses, the case is clear.",
      },
    ],
    truthNote:
      "This image was generated by AI. The tell is not the pixels — models are almost past that already. The tell is the ABSENCE of everything a real event of this size produces: witnesses, phone videos, geotagged posts, journalists on the ground. No witnesses = no event.",
    respectfulScript:
      "Uncle main ne dhang se check kiya — reverse image se koi match nahi, koi bhi eyewitness video ya geotagged post nahi, aur AI detectors bhi flag kar rahe hain. Itna bara ijtima ho, aur ek bhi phone video nahi ho — yeh mumkin hi nahi. Kisi ne AI se yeh tasveer banayi hai. Cause aap ka asli hai — asli photos share karain, yeh nahi.",
    inspiredBy: {
      patternName: "AI-Generated 'Photojournalism'",
      country: "Global",
      year: "2023–ongoing",
      whatHappened:
        "Photorealistic AI images of events that never happened — protests, natural disasters, war scenes — spread as 'proof'. As models improve, spotting pixel artifacts fails; the defence shifts to source and witness verification.",
      prevention: [
        "No independent witnesses = no event.",
        "Real crowds produce hundreds of phone videos; AI produces one photo.",
        "Verify the source, not the surface. This is the Forgery Engine.",
      ],
    },
  },

  {
    id: "insta-celeb-invest",
    title: "The celebrity investment post",
    teaser: "A famous actor 'endorses' a crypto platform promising 40% monthly returns.",
    tier: 2,
    verdict: "FALSE",
    format: "instagram",
    tacticId: "impersonation",
    sender: {
      name: "Friend Sara",
      relationship: "Instagram DM",
      voice: "hopeful, saving for a wedding, sends screenshots",
    },
    senderMotive:
      "She saw a celebrity she loves 'personally recommending' this. It felt like insider access.",
    opener:
      "Girl look at this — [famous actor] herself is telling people about it. I'm thinking of putting in $200, want to go halves?",
    forward: {
      meta: "@wealth.circle.vip · sponsored · 6h",
      headline: '"I made $12K in 30 days" — celebrity endorsement',
      imageEmoji: "💎",
      imageAlt: "A polished post: celebrity photo, luxury car, chart going up-and-to-the-right",
      bodyLines: [
        "Verified traders. Guaranteed returns.",
        "Minimum deposit $200. Withdraw anytime.",
        "3,214 likes · celebrity 'quoted' in caption.",
      ],
    },
    actions: [
      {
        id: "check-celeb-handle",
        label: "Open the celebrity's REAL verified account",
        tool: "check_source",
        result:
          "The real verified account has never posted about this platform. Her team has posted warnings about fake endorsements using her likeness.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-search the celebrity photo used",
        tool: "reverse_image",
        result:
          "The image is a paparazzi photo from 2022, unrelated to any investment product. Reused without permission.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Search the platform name in news + regulators",
        tool: "cross_check",
        result:
          "SECP (Pakistan) and multiple foreign regulators list this platform on their public investor-alert pages. Documented Ponzi pattern.",
        decisive: true,
      },
      {
        id: "check-guarantee",
        label: "Sanity-check the 'guaranteed returns'",
        tool: "check_date",
        result:
          "No legitimate regulated investment product guarantees monthly returns. That phrase alone is a regulator red flag worldwide.",
      },
    ],
    truthNote:
      "Celebrity investment endorsements on social ads are almost always scams — the celebrity's face is stolen, not licensed. 'Guaranteed monthly returns' is not a real financial product; it is the signature of a Ponzi.",
    respectfulScript:
      "Sara ruk — main ne check kiya. Actress ke asli verified account pe iss product ka zikr tak nahi hai, aur unki team khud ne warning post ki hai ke unki tasveer misuse ho rahi hai. SECP ne bhi iss platform ko investor alert list pe rakha hua hai. Paisa mat lagana yaar — asli investing pe baat karte hain properly.",
    inspiredBy: {
      patternName: "Fake Celebrity Investment Endorsement",
      country: "Global",
      year: "2018–ongoing",
      whatHappened:
        "Scam trading platforms buy social ads featuring stolen images of celebrities, athletes, or business figures with fabricated quotes. Victims deposit and are shown a fake dashboard climbing until they try to withdraw. Regulators worldwide publish standing investor alerts for these operators.",
      prevention: [
        "Verify the endorsement on the celebrity's own verified channel.",
        "Check the platform on your national securities regulator's alert list.",
        "Guaranteed monthly returns are not a real financial product.",
      ],
    },
  },

  {
    id: "news-real-outlet-oldstory",
    title: "The recirculated old headline",
    teaser: "A real Dawn article shared as 'breaking' — actually from 2019.",
    tier: 2,
    verdict: "MISLEADING",
    format: "news",
    tacticId: "mis-dis-mal",
    sender: {
      name: "Uncle Javed",
      relationship: "Family group",
      voice: "loves 'breaking news', trusts what looks like Dawn",
    },
    senderMotive:
      "He thinks he's the first in the group to catch a huge story. The URL genuinely goes to dawn.com.",
    opener:
      "Just in — Dawn ne khud publish kiya hai. Yeh sun ke shock lag gaya. Share karo sab ko.",
    forward: {
      meta: "dawn.com · shared as 'today'",
      headline: "Major currency devaluation announced by government",
      imageEmoji: "📰",
      imageAlt: "A screenshot of a real Dawn article page",
      bodyLines: [
        "Real Dawn article, real byline, real URL.",
        "Sender's caption: 'Aaj ki khabar — abhi confirm hui hai.'",
        "No date shown in the shared preview.",
      ],
    },
    actions: [
      {
        id: "check-date",
        label: "Scroll to the article's published date",
        tool: "check_date",
        result:
          "The article is real — but published in May 2019. Nearly seven years old. The sender's 'today' caption is added on top.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Cross-check today's economy news",
        tool: "cross_check",
        result:
          "No current outlet is reporting a devaluation today. Dawn's homepage right now doesn't feature this piece.",
        decisive: true,
      },
      {
        id: "check-source",
        label: "Open dawn.com fresh and search the headline",
        tool: "check_source",
        result:
          "The story sits in Dawn's 2019 archive exactly as shown. It is Dawn's real journalism — just from a very different economic moment.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-image the shared preview card",
        tool: "reverse_image",
        result:
          "The preview image is Dawn's real thumbnail from 2019. It is not doctored — the deception is the missing date.",
      },
    ],
    truthNote:
      "The outlet is real. The reporting is real. The DATE is the whole lie. Recirculating a real old article as breaking news is one of the fastest-spreading formats — nobody thinks to fact-check a real outlet.",
    respectfulScript:
      "Uncle Dawn ki khabar bilkul asli hai — lekin yeh article May 2019 ka hai, aaj ka nahi. Aaj ki economy ki khabrein bilkul alag hain. Aksar log purani asli khabar ko naya bata ke share karte hain — asli outlet ke naam pe koi date check hi nahi karta. Group main clarification post kar dete hain, bilkul respectfully.",
    inspiredBy: {
      patternName: "Recirculated Real Article",
      country: "Global",
      year: "2015–ongoing",
      whatHappened:
        "Genuine articles from major outlets are shared years later as 'breaking' — no editing needed, just a fresh caption. Because the URL and outlet are real, most fact-checking instincts don't fire. It shapes public panic during elections, currency shocks, and health scares.",
      prevention: [
        "Always scroll to the article's actual date — not the share preview.",
        "Check the outlet's homepage: if the story isn't there, it isn't today's.",
        "Real outlet + missing date is a specific MIL trap of its own.",
      ],
    },
  },

  {
    id: "video-disaster-charity",
    title: "The disaster-relief reel",
    teaser:
      "A 20-second reel of rubble and crying children directs to a personal easypaisa — posted 4 hours after the quake.",
    tier: 3,
    verdict: "FALSE",
    format: "video",
    tacticId: "phishing",
    sender: {
      name: "Cousin Hina",
      relationship: "Instagram DM",
      voice: "emotional, tearful, first-responder-adjacent",
    },
    senderMotive:
      "She saw the reel go viral, cried, and forwarded before checking. She wants to be someone who helps immediately.",
    opener:
      "Api dekho — abhi zalzale ki footage. Account number description main hai. Please jitna ho sake donate karain, jaldi.",
    forward: {
      meta: "Reel · 20s · 84K shares",
      headline: "URGENT — earthquake relief, donate now",
      imageEmoji: "🎞️",
      imageAlt: "Shaky footage of rubble, overlaid caption with a personal wallet number",
      bodyLines: [
        "Overlay text: 'Bhai Aslam — 0300-XXXXXXX easypaisa.'",
        "Caption: '100% direct to families.'",
        "Comments: dozens of 'donated ❤️' from fresh accounts.",
      ],
    },
    actions: [
      {
        id: "reverse-image",
        label: "Reverse-image a frame of the rubble",
        tool: "reverse_image",
        result:
          "The footage is from a 2023 earthquake in another country — reused. The current disaster is real; this specific video is not from it.",
        decisive: true,
      },
      {
        id: "check-source",
        label: "Search the wallet number and 'Aslam'",
        tool: "check_source",
        result:
          "The number appears on FIA cybercrime alerts and on posts by real relief workers flagging it as a recurring disaster-scam number.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Compare with real relief orgs on the ground",
        tool: "cross_check",
        result:
          "Alkhidmat, Edhi, JDC and PRCS publish OFFICIAL relief accounts on their verified sites and handles. None match this personal wallet.",
        decisive: true,
      },
      {
        id: "check-date",
        label: "Note when the reel was posted vs the disaster",
        tool: "check_date",
        result:
          "Reel posted 4 hours after the quake. Real registered NGOs take at least a day to publish channels and always route through their official pages first.",
        decisive: true,
      },
    ],
    truthNote:
      "Video is the fastest-spreading disaster-scam format now. The footage may be from another disaster entirely, but grief overrides checking. Real relief goes through registered orgs — never a personal wallet flashed on a viral reel.",
    respectfulScript:
      "Hina yeh reel scam hai — footage kisi aur mulk ke 2023 zalzale ki hai, aur yeh number FIA ki cybercrime warnings pe hai. Aap ka jazba bara hai — Alkhidmat aur JDC ke official accounts main aap ko bhejti hoon, wahan aap ka donation asli families tak pahunche ga. Reel ko report kar dein, warna aur log fasein ge ❤️",
    inspiredBy: {
      patternName: "Disaster Relief Video Scam",
      country: "Global",
      year: "2010–ongoing",
      whatHappened:
        "Within hours of any earthquake, flood, or cyclone, viral short-video 'relief' posts use recycled rubble footage from unrelated disasters and route donations to a personal wallet. They out-race real NGOs by design.",
      prevention: [
        "Reverse-image a video frame before donating.",
        "Only donate via accounts on a registered NGO's verified site.",
        "Any 'donate NOW' account posted within hours of a disaster deserves suspicion.",
      ],
    },
  },

  /* ── AI LITERACY — deliberately flawless. Spotting fails BY DESIGN. ── */
  {
    id: "ai-flawless-boss-call",
    title: "The boss's WhatsApp voice note",
    teaser:
      'A perfect 8-second voice note from your boss: "Push through the vendor payment today." No artifacts. Nothing to spot.',
    tier: 3,
    verdict: "FALSE",
    format: "video",
    aiGenerated: true,
    tacticId: "forgery-engine",
    sender: {
      name: "'Boss' (unknown number)",
      relationship: "WhatsApp — new number",
      voice: "your actual boss's voice, exactly",
    },
    senderMotive:
      "The attacker scraped a minute of the CEO's public interviews and cloned the voice. They chose Friday 4:55pm on purpose.",
    opener:
      "Voice note from a new number claiming to be your boss. It sounds EXACTLY like him — because it is his voice, cloned.",
    forward: {
      meta: "WhatsApp voice · 8s · new number",
      headline: '"Push the Zenith vendor payment today — I\'ll explain Monday. Thanks."',
      imageEmoji: "🎧",
      imageAlt: "A voice-note bubble in a WhatsApp thread",
      bodyLines: [
        "Voice is unmistakably his — cadence, accent, the little 'thanks' he always ends with.",
        "Message signs off with his usual initials.",
        "Wire instructions attached as a PDF.",
      ],
    },
    actions: [
      {
        id: "listen-artifacts",
        label: "Listen closely for AI tells",
        tool: "reverse_image",
        result:
          "There are none. Rhythm is perfect. Breathing is natural. The little 'thanks' is exact. State-of-the-art voice cloning has already passed this test. Spotting cannot win here — do not rely on your ear.",
        decisive: false,
      },
      {
        id: "check-source",
        label: "Check the sender number against the one you already have",
        tool: "check_source",
        result:
          "This is a NEW number. Your boss's real number is saved in your contacts and has not sent this. That single fact outweighs the voice.",
        decisive: true,
      },
      {
        id: "call-back",
        label: "Call your boss BACK on his known number",
        tool: "check_source",
        result:
          "You reach him. He is at his kid's football match. He did not send anything. He asks you to forward the number to IT.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Cross-check with finance protocol",
        tool: "cross_check",
        result:
          "Company policy requires vendor payments to be approved via the finance portal — never over WhatsApp, never on voice alone. Protocol is the second independent check.",
        decisive: true,
      },
    ],
    truthNote:
      "You could not have spotted this by listening. Nobody can anymore. You VERIFIED it — you called the real number, you checked the protocol. That is the skill the Forgery Engine forces us all to learn. 'Sounds real' is no longer proof of anything.",
    respectfulScript:
      "IT — flag this number. Someone has cloned [CEO]'s voice and used a new number to request a wire transfer to 'Zenith vendors'. I verified with him directly on his real number; he did not send this. Locking the vendor payment. Suggest a company-wide reminder that voice/video alone can no longer authorise anything.",
    inspiredBy: {
      patternName: "AI Voice-Clone CFO Fraud",
      country: "Global",
      year: "2019–ongoing",
      whatHappened:
        "Attackers have used AI-cloned voices of CEOs and CFOs — sometimes on live calls — to authorise wire transfers of hundreds of thousands to millions of dollars. In documented cases the victims report the voice was indistinguishable from the real person. The winning defence has been out-of-band verification and multi-party approval, never ear-based judgement.",
      prevention: [
        "Never authorise money on voice or video alone — call back on the known number.",
        "Enforce protocol: high-stakes actions require the pre-existing channel, not a new one.",
        "Assume any high-stakes voice can now be forged. This is the operating environment.",
      ],
    },
  },

  {
    id: "ai-flawless-anchor",
    title: "The AI news anchor",
    teaser:
      "A 40-second clip of a familiar-looking news anchor reading breaking news. Nothing looks wrong. Nothing is real.",
    tier: 3,
    verdict: "FALSE",
    format: "video",
    aiGenerated: true,
    tacticId: "forgery-engine",
    sender: {
      name: "Cousin Waleed",
      relationship: "Family group",
      voice: "'saw it on the news' authority",
    },
    senderMotive:
      "He believes he's sharing a real breaking-news bulletin — the anchor and studio look completely normal.",
    opener: "Bhai breaking news — anchor khud padh rahi hai. Sab groups main bhej do jaldi.",
    forward: {
      meta: "Video · 40s · reposted",
      headline: "'Breaking' bulletin claiming a major policy reversal",
      imageEmoji: "📺",
      imageAlt: "An anchor at a professional-looking news desk reading a bulletin",
      bodyLines: [
        "Anchor's face and voice look and sound real.",
        "Lower-third graphics match a real channel's style.",
        "Bulletin runs uncut for 40 seconds without a single visible glitch.",
      ],
    },
    actions: [
      {
        id: "spot-artifacts",
        label: "Study the clip frame-by-frame for AI tells",
        tool: "reverse_image",
        result:
          "There is nothing to spot. Lip sync is exact. Blink rate is normal. The lower-third font is right. Modern face-and-voice synthesis has closed this gap — do not rely on your eyes here.",
        decisive: false,
      },
      {
        id: "check-channel",
        label: "Open the channel's real website and live stream",
        tool: "check_source",
        result:
          "The channel's real site and live stream carry no such bulletin. Their real anchors are on air discussing a completely different story right now.",
        decisive: true,
      },
      {
        id: "cross-check",
        label: "Cross-check any other outlet",
        tool: "cross_check",
        result:
          "Zero corroboration on Reuters, AFP, Dawn, Al Jazeera, or the channel's own YouTube. A real policy reversal produces dozens of independent reports within minutes.",
        decisive: true,
      },
      {
        id: "check-official",
        label: "Check the ministry's own site + social handles",
        tool: "check_source",
        result:
          "No announcement. Ministry spokesperson has posted a warning that a synthetic 'bulletin' is circulating using a familiar anchor's likeness.",
        decisive: true,
      },
    ],
    truthNote:
      "You couldn't see it. Nobody can anymore. You VERIFIED it instead — you opened the channel yourself, you looked for a second witness, you checked the ministry directly. That is the whole skill now. Spotting is dying. Verifying is forever.",
    respectfulScript:
      "Waleed bhai — main ne channel ki live stream aur website khud kholi, iss bulletin ka koi wujood nahi. Kisi aur outlet ne bhi report nahi kiya, aur ministry ne khud warning issue ki hai ke anchor ki shakal use kar ke fake bulletin bana hai. Video AI-generated hai. Group main clarification bhej deta hoon so aur log na phailain.",
    inspiredBy: {
      patternName: "AI-Synthesized News Anchor",
      country: "Global",
      year: "2023–ongoing",
      whatHappened:
        "Fully synthetic 'news bulletins' impersonating real anchors and channel branding have been used to push fake political claims, market-moving rumours, and health hoaxes. As the models close the gap, spotting collapses — the defence is source and channel verification, not visual inspection.",
      prevention: [
        "Open the actual channel's live stream or site — the bulletin either exists there or it doesn't.",
        "Real news produces multiple independent reports within minutes.",
        "Trust the source, not the surface. This is the Forgery Engine.",
      ],
    },
  },
];

/* ── T-11 OUTRAGE MACHINE — added cases (all names/places FICTIONAL) ─── */
const OUTRAGE_CASES: FeedScenario[] = [
  {
    id: "outrage-quote",
    title: "THE QUOTE",
    teaser: "A fabricated inflammatory quote-card attributed to a fictional council figure.",
    tier: 2,
    verdict: "FALSE",
    format: "image",
    tacticId: "outrage-machine",
    sender: {
      name: "Bilal (cousin)",
      relationship: "Family DM",
      voice: "furious, sends quote-cards, wants you to pick a side fast",
    },
    senderMotive:
      "He's genuinely upset. He read the card, felt the anger, forwarded it in two seconds. He is not the enemy — the card is.",
    opener:
      "Look what this Council-member from Northrun District SAID about people from the Estuary. Share EVERYWHERE. This can't stand.",
    forward: {
      meta: "Image forward · Tapscroll",
      headline:
        '"They don\'t belong in Milverse and I will personally see them removed." — Cllr. R. Aslani, Northrun District',
      imageEmoji: "🖼️",
      imageAlt:
        "A quote card with a low-res photo of a councilman, a big red inflammatory quote, and a channel-style watermark",
      bodyLines: [
        "Quote-card graphic, aggressive red type over dark photo.",
        "Watermark reads: 'CIVIC WATCH · MILVERSE' — a channel-looking logo.",
        "No source link, no date, no clip.",
      ],
    },
    actions: [
      {
        id: "search-quote",
        label: "Search the exact quote in Cllr. Aslani's public record",
        tool: "check_source",
        result:
          "The quote appears nowhere: no council transcript, no recording, no press release, no news report. Zero hits outside forwarded quote-cards.",
        decisive: true,
      },
      {
        id: "check-real",
        label: "Pull Cllr. Aslani's actual recent statement on the Estuary community",
        tool: "check_source",
        result:
          "His actual statement is procedural and mundane — a routine remark about housing timelines. Nothing inflammatory.",
        decisive: true,
      },
      {
        id: "trace-card",
        label: "Trace the quote-card graphic",
        tool: "reverse_image",
        result:
          "The card layout matches a public meme template circulating for weeks with different names swapped in — 'CIVIC WATCH · MILVERSE' is not a real outlet.",
        decisive: true,
      },
      {
        id: "check-comments",
        label: "Read the comment threads under the forwarded card",
        tool: "cross_check",
        result:
          "Comments are already at war. Nobody is asking for a source. The anger is doing the verification for people.",
      },
    ],
    truthNote:
      "The quote does not exist in any recording, transcript, or report. The card is a meme template. His real statement is boring. The card was built to make you furious enough to skip the check.",
    respectfulScript:
      "Bilal bhai I looked — there's no recording, no transcript, no news report of that quote. It only exists on forwarded cards. His actual recent statement was about housing paperwork. I know this stuff makes us angry, but this specific card was built to weaponise us. Let me send you what he actually said.",
    inspiredBy: {
      patternName: "Fabricated Quote-Card",
      country: "Global · pre-election periods",
      year: "2018–ongoing",
      whatHappened:
        "Anonymous accounts and coordinated networks produce quote-cards attributing inflammatory statements to real or lightly-fictional public figures, timed for maximum reach. The visual grammar mimics a news outlet; the goal is anger before verification.",
      prevention: [
        "Any 'quote' without a link to the recording or transcript is a claim, not a quote.",
        "Search the exact phrase — real inflammatory quotes get reported by multiple outlets within hours.",
        "Card templates get reused; a reverse-image on the graphic often surfaces older uses.",
      ],
    },
  },
  {
    id: "outrage-invasion-album",
    title: "THE INVASION ALBUM",
    teaser: "Three photos captioned as a fictional newcomer community's crimes.",
    tier: 3,
    verdict: "FALSE",
    format: "image",
    tacticId: "outrage-machine",
    sender: {
      name: "Uncle Rehan",
      relationship: "Family group",
      voice: "grave, sends 'this is what they don't tell you' albums",
    },
    senderMotive:
      "He is genuinely frightened for his neighbourhood. Frightened people forward first and check later — that is exactly what the album is designed to exploit.",
    opener:
      "This is what's actually happening in the outer wards. Media won't touch it. Wake up everyone — share to your groups.",
    forward: {
      meta: "3-photo album · Tapscroll",
      headline: "'The Estuary newcomers — a week in the outer wards'",
      imageEmoji: "🖼️🖼️🖼️",
      imageAlt:
        "Three unrelated dramatic photos: a burned-out storefront, an overturned vehicle at night, a crowd on a bridge",
      bodyLines: [
        "Photo 1 caption: 'Estuary newcomers torched this shop on 3rd Ave — last Tuesday.'",
        "Photo 2 caption: 'Their crowd overturned this bus in Northrun — nobody arrested.'",
        "Photo 3 caption: 'Bridge blockade last night. This is a coordinated takeover.'",
      ],
    },
    actions: [
      {
        id: "reverse-1",
        label: "Reverse-search photo 1 (burned storefront)",
        tool: "reverse_image",
        result:
          "Photo is from a different (fictional) city — an accidental electrical fire two years ago, unrelated community, no arson.",
        decisive: true,
      },
      {
        id: "reverse-2",
        label: "Reverse-search photo 2 (overturned vehicle)",
        tool: "reverse_image",
        result:
          "Photo is from a completely different (fictional) city and year — a road-safety protest, not an attack.",
        decisive: true,
      },
      {
        id: "reverse-3",
        label: "Reverse-search photo 3 (bridge crowd)",
        tool: "reverse_image",
        result:
          "Photo is from yet another (fictional) city — a public festival crowd, mistagged and re-captioned.",
        decisive: true,
      },
      {
        id: "check-outlets",
        label: "Check any Milverse newsroom for these 'incidents'",
        tool: "check_source",
        result:
          "None reported. There is no wire story matching any of the three captions in the outer wards this month.",
      },
      {
        id: "check-date",
        label: "Check when the three captions first appeared together",
        tool: "check_date",
        result:
          "The album first surfaced 48 hours ago on an anonymous channel that has posted similar 'invasion' albums about three other groups this year.",
      },
    ],
    truthNote:
      "The photos were real. The story was the weapon. Three unrelated images from three different cities and years, restaged as one community's coordinated crimes. This is the Outrage Machine's most dangerous form — real footage carrying a fabricated narrative.",
    respectfulScript:
      "Uncle I reverse-searched all three photos — each one is from a different city, different year, and nothing to do with the Estuary newcomers. No newsroom is reporting any of these incidents this month. The album is genuine images used to sell a story that isn't happening. Please don't forward — it puts real neighbours in real danger.",
    inspiredBy: {
      patternName: "The 'Invasion' Album",
      country: "Global · communal-tension events",
      year: "2016–ongoing",
      whatHappened:
        "Coordinated networks compile unrelated photos from disparate places and years and repackage them as a single named community's crimes, always ahead of a vote or a demonstration. The real photos carry the credibility; the false captions carry the payload.",
      prevention: [
        "Reverse-image every photo in a themed album — not just the first one.",
        "A real coordinated event produces real newsroom coverage. Silence from every outlet is the tell.",
        "Track the channel's history — the same album pattern reused against different groups is the fingerprint.",
      ],
    },
  },
];

FEED_SCENARIOS.push(...NEW_CASES);
FEED_SCENARIOS.push(...OUTRAGE_CASES);

/* ── Format + tactic defaults for existing cases ────────────────
   Additive-only: keeps original data intact, just fills the new fields.
*/
const FORMAT_OVERRIDES: Record<string, { format?: FeedFormat; tactic?: FeedTacticId }> = {
  "bank-rumor": { format: "whatsapp", tactic: "urgency-fear" },
  "flood-photo": { format: "image", tactic: "out-of-context" },
  "unbelievable-true": { format: "news", tactic: "engagement-bait" },
  "miracle-cure": { format: "whatsapp", tactic: "engagement-bait" },
  "free-laptop": { format: "whatsapp", tactic: "phishing" },
  "kidnap-van": { format: "whatsapp", tactic: "urgency-fear" },
  "doctor-clip": { format: "video", tactic: "out-of-context" },
  "recalled-medicine": { format: "news", tactic: "mis-dis-mal" },
  "old-protest": { format: "image", tactic: "out-of-context" },
  "job-circular": { format: "whatsapp", tactic: "phishing" },
  "weird-but-true": { format: "news", tactic: "mis-dis-mal" },
  "earthquake-prediction": { format: "whatsapp", tactic: "urgency-fear" },
};

for (const s of FEED_SCENARIOS) {
  const o = FORMAT_OVERRIDES[s.id];
  if (o) {
    if (!s.format) s.format = o.format;
    if (!s.tacticId) s.tacticId = o.tactic;
  }
  if (!s.format) s.format = "whatsapp";
  // default all untagged actions to check_source
  for (const a of s.actions) {
    if (!a.tool) a.tool = "check_source";
  }
  // Derive Toolbelt dossier answers from the authored actions. This is the
  // single source of truth — Toolbelt UI reads only from here (and never
  // manufactures verdicts). Missing kinds stay undefined = WASTED turn.
  if (!s.toolbelt) s.toolbelt = {};
  for (const a of s.actions) {
    const k = (a.tool ?? "check_source") as FeedToolKind;
    // Prefer decisive answers; keep first-seen otherwise.
    if (a.decisive || !s.toolbelt[k]) s.toolbelt[k] = a.result;
  }
}

export function getFeedScenario(id: string): FeedScenario | undefined {
  return FEED_SCENARIOS.find((s) => s.id === id);
}

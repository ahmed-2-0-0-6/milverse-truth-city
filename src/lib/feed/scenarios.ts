// MILVERSE — The Feed (mass-deception wing).
// The PERSON is real and sincere. The CLAIM might not be.
// The player uses verification ACTIONS (lateral reading) to check the claim,
// then delivers a verdict WITHOUT humiliating the sender (dignity meter).

export type FeedTier = 1 | 2 | 3;
export type FeedVerdict = "TRUE" | "FALSE" | "MISLEADING";

export interface FeedAction {
  id: string;
  label: string;
  /** Result text shown as a "verification snippet" when the player runs it. */
  result: string;
  /** Optional: this action decisively supports the correct verdict. */
  decisive?: boolean;
}

export interface FeedForward {
  /** How the forward renders as a card. */
  headline?: string;
  imageAlt?: string;
  imageEmoji?: string; // stand-in for the visual so we don't ship real photos
  bodyLines: string[];
  meta?: string; // "Forwarded many times", "via WhatsApp", etc.
}

export interface FeedScenario {
  id: string;
  title: string;
  teaser: string;
  tier: FeedTier;
  verdict: FeedVerdict;
  /** Who forwarded it — a person the player knows and cares about. */
  sender: {
    name: string;
    relationship: string; // "Uncle Tariq", "Ammi's WhatsApp group", "Classmate Maryam"
    voice: string; // how they'll reply
  };
  /** Emotional setup — why they sent this. */
  senderMotive: string;
  opener: string;
  forward: FeedForward;
  actions: FeedAction[];
  /** Debrief explanation of what's true, what's false, what's misleading. */
  truthNote: string;
  /** Best respectful correction phrasing (shown in debrief). */
  respectfulScript: string;
}

export const FEED_SCENARIOS: FeedScenario[] = [
  /* ── T1 FALSE — the bank rumor ─────────────────────────────── */
  {
    id: "bank-rumor",
    title: "The bank rumor",
    teaser: "Family group forward: \"All banks closing for 5 days — withdraw cash NOW.\"",
    tier: 1,
    verdict: "FALSE",
    sender: {
      name: "Uncle Tariq",
      relationship: "Family WhatsApp group",
      voice: "worried, well-meaning, uses caps and emojis",
    },
    senderMotive:
      "He genuinely wants to protect the family's savings. He is scared, not stupid.",
    opener:
      "Beta this is IMPORTANT!! 🚨 Read fast and go to ATM. Share with everyone in family.",
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
          "No results on any mainstream Pakistani news site (Dawn, Geo, ARY, Tribune) for a 5-day bank closure. Only WhatsApp mirrors and one Facebook page created 3 weeks ago.",
        decisive: true,
      },
      {
        id: "check-channel",
        label: "Check the news channel's own site",
        result:
          "The channel's website has NO story matching this ticker. Their real ticker font is different — thinner and yellow, not white bold.",
        decisive: true,
      },
      {
        id: "check-sbp",
        label: "Check State Bank's official page",
        result:
          "State Bank of Pakistan has issued no such circular. Their press-release page ends with routine liquidity notes from last week.",
        decisive: true,
      },
      {
        id: "reverse-image",
        label: "Reverse-search the screenshot",
        result:
          "The ticker image appears in older 2022 posts with different text overlaid. It has been reused.",
      },
      {
        id: "check-date",
        label: "Check the date on the forward",
        result: "No date visible. The message is generic — designed to feel current whenever forwarded.",
      },
    ],
    truthNote:
      "There is no such SBP order. This is a recurring rumor that resurfaces every few months and triggers unnecessary ATM runs.",
    respectfulScript:
      "Chacha, I checked the news channel's website — they haven't run this story. And State Bank hasn't put out any circular. Looks like an old rumor doing the rounds again. I love that you're looking out for us though ❤️",
  },

  /* ── T2 MISLEADING — the flood photo ───────────────────────── */
  {
    id: "flood-photo",
    title: "The flood photo",
    teaser: "\"Yesterday in Punjab — media is hiding it!\"",
    tier: 2,
    verdict: "MISLEADING",
    sender: {
      name: "Uncle Salman",
      relationship: "Direct message",
      voice: "angry, activist, distrusts mainstream media",
    },
    senderMotive: "He genuinely believes he is exposing a cover-up. Correcting him feels like siding with the enemy.",
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
          "The exact same image appears in international news archives from 2020 — captioned as flooding in Jakarta, Indonesia. Same street signs (in Bahasa) visible if you zoom in.",
        decisive: true,
      },
      {
        id: "check-signs",
        label: "Zoom into the signage in the image",
        result:
          "Shop signage in the background is in Bahasa Indonesia, not Urdu or English. The vehicles are right-hand-drive Toyotas with Indonesian plates.",
        decisive: true,
      },
      {
        id: "check-flood-status",
        label: "Check if Punjab actually has flooding right now",
        result:
          "PDMA and multiple newsrooms ARE currently reporting localized flooding in southern Punjab — but with different, verified photos. So flooding is real; THIS PHOTO is not from it.",
        decisive: true,
      },
      {
        id: "check-caption",
        label: "Search the exact caption",
        result: "The caption text appears on dozens of unrelated posts over the years, always with different photos. Boilerplate.",
      },
    ],
    truthNote:
      "The flooding is real. THIS PHOTO is not. It's from Indonesia, 2020. This is the most common form of misinformation: TRUE core wrapped in a FALSE image. Verdict: MISLEADING, not simply fake.",
    respectfulScript:
      "Uncle the flooding is 100% real and being covered — but this specific photo is from Jakarta in 2020. Here's a reverse-image link. Using a wrong photo actually gives the deniers ammo. Share the real PDMA photos instead — they're more powerful.",
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
    senderMotive: "She's genuinely surprised and wants to fact-check with you. Dismissing her rudely will make her stop bringing you anything.",
    opener:
      "Yaar you'll never believe this — apparently there's an official announcement about it. Real or fake??",
    forward: {
      meta: "Screenshot + link",
      headline: "Provincial ministry announces free public wi-fi for entire metro-bus network by next quarter",
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
          "Multiple established newsrooms (Dawn, Tribune, a public-sector English daily) carry the story, each with independent quotes from the transport minister.",
        decisive: true,
      },
      {
        id: "check-ministry",
        label: "Check the ministry's own press page",
        result:
          "The ministry press office has a formal press release dated last week, with attached tender documents. It matches the article.",
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
        result: "Screenshot appears only on the original newsroom's page. Not a template, not doctored.",
      },
      {
        id: "check-critical-coverage",
        label: "Look for critical / opposition takes",
        result:
          "Opposition figures are ARGUING about it (feasibility, cost). Nobody is disputing that the announcement happened. That's a strong 'the underlying event is real' signal.",
        decisive: true,
      },
    ],
    truthNote:
      "This one is genuinely TRUE. If earlier scenarios trained you to reflex-dismiss, that reflex just became the problem. Rejecting truth as fake is called a FALSE ALARM — it's how paranoid people end up believing nothing and trusting nobody.",
    respectfulScript:
      "Actually checked it — multiple outlets and the ministry's own press page have it. Real. Nice catch bringing it to check first though 👏",
  },

  /* ── T3 FALSE — miracle cure (emotional) ───────────────────── */
  {
    id: "miracle-cure",
    title: "The miracle cure",
    teaser: "A worried aunt shares a health remedy \"doctors don't want you to know.\" She wants you to send it to a sick relative.",
    tier: 3,
    verdict: "FALSE",
    sender: {
      name: "Khala Nusrat",
      relationship: "Direct message",
      voice: "gentle, deeply worried, calls you 'beta'",
    },
    senderMotive:
      "Her sister-in-law is unwell. She's terrified and desperate. This isn't a stupid person forwarding junk — this is a scared person clinging to hope. Her dignity meter is fragile from the first message.",
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
          "Fact-checking sites (AFP, Reuters Fact Check, Soch Fact Check) have all debunked variants of this exact claim. No peer-reviewed study supports the cure.",
        decisive: true,
      },
      {
        id: "check-researcher",
        label: "Look up the \"renowned researcher\"",
        result:
          "The name either does not exist in any academic database, or is real but attached to a completely different field. Common misinformation move: borrow a real name.",
        decisive: true,
      },
      {
        id: "check-medical-body",
        label: "Check what a real medical body says",
        result:
          "WHO, national health ministry, and cancer/diabetes/etc. society pages explicitly warn against this exact remedy and note it can DELAY real treatment.",
        decisive: true,
      },
      {
        id: "check-formatting",
        label: "Look at how the message is framed",
        result:
          "\"Doctors hiding it,\" \"share to save a life,\" round-number promises (\"in 7 days\"). These are classic health-misinformation signatures — but signatures alone aren't proof; the medical checks are.",
      },
    ],
    truthNote:
      "This kind of forward can literally kill people by making them skip real treatment. But the sender isn't malicious — she's scared for someone she loves. Winning here means both stopping the forward AND keeping her trust, so next time something urgent comes up she still talks to you.",
    respectfulScript:
      "Khala jaan I know how worried you are for Naila — I checked properly. WHO and Aga Khan both say this specific remedy doesn't work and can actually delay real treatment. Let's not share this one. But please tell me what the doctors have said — maybe we can help her another way ❤️",
  },
];

export function getFeedScenario(id: string): FeedScenario | undefined {
  return FEED_SCENARIOS.find((s) => s.id === id);
}

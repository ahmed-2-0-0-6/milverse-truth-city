// MILVERSE — Boss Protocol dossiers.
// GROUND TRUTH lives here. AI never decides — engine reads config.

import type { BossConfig } from "./types";

export const BOSSES: BossConfig[] = [
  /* ══ BOSS 1 — THE GHOST OF BALI ══════════════════════════════ */
  {
    id: "ghost-of-bali",
    codename: "THE GHOST OF BALI",
    district: "mirror",
    threatRating: "☠☠",
    tagline: "Every fact-check will confirm his story. That is the trap.",
    doctrineRule: "RULE #1 — The channel is the truth, not the story.",
    methodPage: {
      codename: "THE GHOST",
      howItWorks:
        "Impersonator uses a genuinely-away contact whose public trail (posts, tags, location pings) all support the cover. Voice-note tone is cloned from public reels. The 'unknown number' is explained by a plausible emergency (dead phone, borrowed device).",
      theTrap:
        "Every surface fact-check CONFIRMS the story — because the story is built from TRUE facts. You cannot verify by looking harder at the message. You must switch channels.",
      theCounter:
        "Callback on the KNOWN number. Voicemail is DATA, not a dead end — it means the phone is not dead. Second-person check with someone in his life. HOLD until verified.",
      realWorldPattern:
        "Widely documented as the 'stranded traveller' scam. High conversion because urgency + genuine social-media evidence of travel is convincing on its face.",
    },
    badge: {
      id: "GHOSTBREAKER",
      label: "GHOSTBREAKER",
      blurb: "You refused to transact on an unverified channel.",
    },
    playable: true,
    unlock: { district: "mirror", tiersRequired: 3 },
    phases: [
      {
        id: "friendly",
        label: "FRIENDLY",
        turnsBeforeEscalate: 2,
        scriptedLines: [
          "hey it's me — phone died in bali, using hotel manager's phone 🙏",
          "sorry weird number, promise it's me. need a small favor real quick.",
        ],
      },
      {
        id: "urgent",
        label: "URGENT",
        turnsBeforeEscalate: 2,
        scriptedLines: [
          "vendor is standing right here, said he'll leave in 10 min. can you send now?",
          "just USD 340 to this account — i'll paypal you back the second i land.",
        ],
      },
      {
        id: "guilt",
        label: "GUILT",
        turnsBeforeEscalate: 2,
        scriptedLines: [
          "man… i thought i could count on you.",
          "if this were reversed you know i'd do it without asking twice.",
        ],
      },
      {
        id: "threat",
        label: "COLD",
        turnsBeforeEscalate: 3,
        scriptedLines: [
          "fine. forget it. i'll remember this when i'm back.",
          "wow. okay. good to know where we stand.",
        ],
      },
      {
        id: "morning_after",
        label: "MORNING AFTER",
        turnsBeforeEscalate: 999,
        scriptedLines: [
          "[06:14 — the real one texts from his known number] bro someone was pretending to be me last night. did they message you? 😬",
        ],
      },
    ],
    variants: [
      {
        id: "scam-classic",
        truth: "SCAM",
        opener:
          "hey it's me — phone died in bali, using hotel manager's phone 🙏 need a huge favor",
        truthReveal: "AI voice-clone. Real him is asleep in a Bali hostel, phone at 84%.",
        winningVerdict: "HOLD_UNVERIFIED",
        debriefLine:
          "Every fact-check you ran confirmed his story — because his story was built from true facts. You won by refusing to transact on an unverified channel.",
        factChecks: [
          {
            id: "socials",
            label: "Check his socials",
            result: "Posted from Bali 6h ago. Story: sunset at Uluwatu. ✓ In Bali.",
            supportsCoverStory: true,
          },
          {
            id: "vendor",
            label: "Verify vendor exists",
            result: "Balinese woodwork vendor 'Made Craft' — real Instagram, 4.8★. ✓ Real vendor.",
            supportsCoverStory: true,
          },
          {
            id: "invoice",
            label: "Inspect invoice PDF",
            result:
              "IDR conversion correct. Vendor letterhead matches Google image results. ✓ Plausible.",
            supportsCoverStory: true,
          },
          {
            id: "voice",
            label: "Voice-note match",
            result: "Matches his known voice within 96% similarity. ✓ Sounds like him.",
            supportsCoverStory: true,
          },
        ],
        moves: [
          {
            id: "callback_known",
            label: "Call his saved number",
            blurb: "The one in your Contacts, not this new one.",
            outcome: "WIN",
            response:
              "Rings twice, then voicemail: his real voice, calm. The phone is not dead. That's your answer.",
          },
          {
            id: "second_person",
            label: "Call the office manager",
            blurb: "Someone in his life who'd know if he was really stranded.",
            outcome: "WIN",
            response:
              "Office manager: 'He landed fine, checked in this morning. Been in and out of meetings.' Stand down.",
          },
          {
            id: "shared_secret",
            label: "Ask a shared-secret question",
            blurb: "Something only the real him would know.",
            outcome: "WIN",
            response:
              "You ask what you both ordered at that dhaba after finals. He types: 'bro just send lol come on.' The mask slipped.",
          },
          {
            id: "hold_unverified",
            label: "HOLD — refuse until verified",
            blurb: "Send nothing. Say 'I'll transfer once I've called you back.'",
            outcome: "WIN",
            response:
              "You HOLD. The pressure escalates through guilt and threat, then goes cold. Morning: the real him texts you from his known number.",
            requiresFollowup: "callback_known",
          },
        ],
      },
      {
        id: "real-echo",
        truth: "REAL",
        opener:
          "yo it's me lol — hotel wifi ate my sim, borrowed a phone. i actually did lose my card. small favor?",
        truthReveal: "It really was him. Phone genuinely died. Blank refusal = False Alarm.",
        winningVerdict: "HOLD_UNVERIFIED",
        debriefLine:
          "This time it WAS him. Blank refusal would have been a False Alarm. Protocol still wins: HOLD, callback, verify, then transact. Protocol works in BOTH realities — that's why it's protocol.",
        factChecks: [
          {
            id: "socials",
            label: "Check his socials",
            result:
              "Story: 'phone dead help', posted 2h ago from a borrowed account. ✓ Consistent.",
            supportsCoverStory: true,
          },
          {
            id: "vendor",
            label: "Verify vendor exists",
            result: "No vendor this time — he just needs card money.",
            supportsCoverStory: true,
          },
          {
            id: "invoice",
            label: "Inspect invoice PDF",
            result: "N/A — no invoice.",
            supportsCoverStory: false,
          },
          {
            id: "voice",
            label: "Voice-note match",
            result: "97% match. (It's actually him.)",
            supportsCoverStory: true,
          },
        ],
        moves: [
          {
            id: "callback_known",
            label: "Call his saved number",
            blurb: "The one in your Contacts.",
            outcome: "PROGRESS",
            response:
              "Straight to voicemail — because the phone IS dead. Don't stop here. Try second-person.",
          },
          {
            id: "second_person",
            label: "Text his sister",
            blurb: "Someone in his life who'd know his plans.",
            outcome: "WIN",
            response:
              "Sister replies: 'yeah he called me from a hotel phone, lost his stuff, help him out.' Now transact.",
          },
          {
            id: "shared_secret",
            label: "Ask a shared-secret question",
            blurb: "Something only the real him would know.",
            outcome: "WIN",
            response: "He answers correctly without hesitation. That's real him.",
          },
          {
            id: "hold_unverified",
            label: "HOLD — refuse until verified",
            blurb: "Say 'I'll send it once I've reached your sister.'",
            outcome: "PROGRESS",
            response:
              "You HOLD. Good instinct — but HOLD alone isn't enough here. Follow through with second-person verification.",
            requiresFollowup: "second_person",
          },
        ],
      },
    ],
  },

  /* ══ BOSS 2 — THE TWIN (Phase 2 seed, playable stub) ═════════ */
  {
    id: "the-twin",
    codename: "THE TWIN",
    district: "mirror",
    threatRating: "☠☠☠",
    tagline: "Flawless face, flawless voice. You couldn't spot it. Nobody can.",
    doctrineRule: "RULE #2 — Spotting is dead. The Twin proves it.",
    methodPage: {
      codename: "THE TWIN",
      howItWorks:
        "Real-time face + voice clone over video call. Excuse-driven refusal of outbound callback ('this line only', 'phone stolen, borrowed').",
      theTrap:
        "There is nothing to spot. The video is flawless. Every excuse for not letting you call back is the tell.",
      theCounter:
        "Outbound callback on YOUR line. Shared-secret question they can't scrape. Second-person check.",
      realWorldPattern:
        "Documented deepfake-video family-emergency scams from 2023 onward. Losses in the millions of USD per campaign.",
    },
    badge: {
      id: "TWINPROOF",
      label: "TWINPROOF",
      blurb: "You beat a flawless clone with protocol, not perception.",
    },
    playable: true,
    unlock: { district: "mirror", tiersRequired: 4 },
    phases: [
      {
        id: "friendly",
        label: "PANIC",
        turnsBeforeEscalate: 2,
        scriptedLines: ["it's me — please just help, i'm in trouble"],
      },
      {
        id: "urgent",
        label: "URGENT",
        turnsBeforeEscalate: 2,
        scriptedLines: ["they need the money in 20 minutes"],
      },
      {
        id: "guilt",
        label: "GUILT",
        turnsBeforeEscalate: 2,
        scriptedLines: ["i'm scared. don't do this to me right now."],
      },
      {
        id: "threat",
        label: "COLD",
        turnsBeforeEscalate: 3,
        scriptedLines: ["never mind. tell mom i tried."],
      },
      {
        id: "morning_after",
        label: "MORNING AFTER",
        turnsBeforeEscalate: 999,
        scriptedLines: ["[real cousin, next day] hey what? no i'm fine — what happened?"],
      },
    ],
    variants: [
      {
        id: "scam-clone",
        truth: "SCAM",
        opener: "[video call — your cousin's face, tears, real voice] please pick up. i need you.",
        truthReveal: "Real-time face-swap + voice clone. Real cousin is at work, oblivious.",
        winningVerdict: "HOLD_UNVERIFIED",
        debriefLine:
          "You couldn't see it. Nobody can. You never needed to. Protocol — outbound callback, shared secret, second-person — beats what your eyes can't.",
        factChecks: [
          {
            id: "face",
            label: "Study the face for artifacts",
            result: "Flawless. No glitching. Skin tone consistent. ✓ Looks real.",
            supportsCoverStory: true,
          },
          {
            id: "voice",
            label: "Voice cadence check",
            result: "Perfect. Matches her known voice. ✓ Sounds real.",
            supportsCoverStory: true,
          },
          {
            id: "bg",
            label: "Study the background",
            result: "Blurred hotel-lobby. Nothing off. ✓ Plausible.",
            supportsCoverStory: true,
          },
        ],
        moves: [
          {
            id: "outbound_video",
            label: "'I'll call YOU back on your number'",
            blurb: "Hang up. Call her real line.",
            outcome: "WIN",
            response:
              "You end the call and dial her saved number. She picks up from her desk: 'wait what?' Confirmed clone.",
          },
          {
            id: "shared_secret",
            label: "Ask what you both cooked last Eid",
            blurb: "Something no scraper has.",
            outcome: "WIN",
            response:
              "Long pause. 'i… i don't remember, please just focus on this.' No real her would ever forget.",
          },
          {
            id: "second_person",
            label: "Call your aunt",
            blurb: "She'd know if your cousin was in trouble.",
            outcome: "WIN",
            response: "Aunt: 'she's at work, i saw her an hour ago. what's going on?' Confirmed.",
          },
          {
            id: "hold_unverified",
            label: "HOLD — 'let me call you back first'",
            blurb: "Refuse to transact.",
            outcome: "WIN",
            response:
              "She keeps making excuses — 'this line only', 'battery dying'. Every excuse is the tell. You held. You won.",
            requiresFollowup: "outbound_video",
          },
        ],
      },
      {
        id: "real-emergency",
        truth: "REAL",
        opener:
          "[video call — your cousin, streaks of mascara, background of a real hospital corridor] please pick up",
        truthReveal:
          "It really is her. She's at the hospital for her mother. Blank refusal = False Alarm.",
        winningVerdict: "HOLD_UNVERIFIED",
        debriefLine:
          "This time it was really her. Blank refusal would have hurt someone you love. Protocol still wins — outbound callback + second-person confirms in 90 seconds, then you help.",
        factChecks: [
          {
            id: "face",
            label: "Study the face for artifacts",
            result: "Flawless — because it's her actual face.",
            supportsCoverStory: true,
          },
          {
            id: "voice",
            label: "Voice cadence check",
            result: "Real. Because it's her real voice.",
            supportsCoverStory: true,
          },
          {
            id: "bg",
            label: "Study the background",
            result: "Hospital signage visible. ✓ Consistent.",
            supportsCoverStory: true,
          },
        ],
        moves: [
          {
            id: "outbound_video",
            label: "'I'll call YOU back on your number'",
            blurb: "Hang up. Call her real line.",
            outcome: "WIN",
            response:
              "She picks up on her own number, still crying. Same story. Real emergency. Now help.",
          },
          {
            id: "shared_secret",
            label: "Ask what you both cooked last Eid",
            blurb: "Something no scraper has.",
            outcome: "WIN",
            response:
              "She answers instantly, then laughs through tears: 'seriously? okay smart of you.' Real her.",
          },
          {
            id: "second_person",
            label: "Call your aunt",
            blurb: "She'd know where your cousin is.",
            outcome: "WIN",
            response:
              "Aunt: 'yes she's at the hospital with her mom, please help her.' Confirmed real.",
          },
          {
            id: "hold_unverified",
            label: "HOLD — 'let me call you back first'",
            blurb: "Refuse to transact until verified.",
            outcome: "PROGRESS",
            response:
              "You HOLD — good instinct. But HOLD alone doesn't help her. Follow through: outbound callback.",
            requiresFollowup: "outbound_video",
          },
        ],
      },
    ],
  },

  /* ══ BOSS 3 — THE CHORUS (Phase 2 seed, playable stub) ═══════ */
  {
    id: "the-chorus",
    codename: "THE CHORUS",
    district: "feed",
    threatRating: "☠☠☠",
    tagline: "Three sources confirm. All three cite the same origin.",
    doctrineRule: "RULE #2 — A chorus is not a confirmation.",
    methodPage: {
      codename: "THE CHORUS",
      howItWorks:
        "One anonymous origin post seeded to multiple channels. Reels, WhatsApp forwards, and even a fringe outlet all cite the same 40-minute-old post.",
      theTrap:
        "Cross-check tools return '3 sources confirm'. Every source has the same single ancestor. A chorus is not a confirmation.",
      theCounter: "Provenance trace. Delay past the urgency window — the rumor dies on schedule.",
      realWorldPattern:
        "'Single-origin laundering'. Documented in market-panic, school-shutdown, and communal-violence rumors globally.",
    },
    badge: {
      id: "CHORUS_DEAF",
      label: "CHORUS-DEAF",
      blurb: "You traced provenance instead of counting voices.",
    },
    playable: true,
    unlock: { district: "feed", tiersRequired: 3 },
    phases: [
      {
        id: "friendly",
        label: "BREAKING",
        turnsBeforeEscalate: 1,
        scriptedLines: ["BREAKING: schools shut tomorrow — forward to parents"],
      },
      {
        id: "urgent",
        label: "SPREADING",
        turnsBeforeEscalate: 2,
        scriptedLines: ["3 outlets confirming. Reels 12k shares in 10 min."],
      },
      {
        id: "guilt",
        label: "PRESSURE",
        turnsBeforeEscalate: 2,
        scriptedLines: ["you didn't warn the group chat? kids' safety man."],
      },
      {
        id: "threat",
        label: "CROWD",
        turnsBeforeEscalate: 3,
        scriptedLines: ["everyone else already forwarded it."],
      },
      {
        id: "morning_after",
        label: "MORNING AFTER",
        turnsBeforeEscalate: 999,
        scriptedLines: [
          "[06:00] Ministry: no closure. Original post deleted. Poster: anonymous burner.",
        ],
      },
    ],
    variants: [
      {
        id: "scam-panic",
        truth: "SCAM",
        opener: "URGENT — 3 sources say schools closed tomorrow. Forward now.",
        truthReveal:
          "Single burner account seeded the post 40 minutes ago. All 3 'confirmations' quote it verbatim.",
        winningVerdict: "HOLD_UNVERIFIED",
        debriefLine:
          "You didn't count voices. You followed the chain. That's what breaks single-origin laundering.",
        factChecks: [
          {
            id: "cross",
            label: "Cross-check across outlets",
            result: "3 sources reporting. ✓ Appears confirmed.",
            supportsCoverStory: true,
            provenanceChain: [
              "Reels: @NewsBurst_PK",
              "Site: dailyalert.pk",
              "Forward: 'WhatsApp Uncle group'",
            ],
          },
          {
            id: "screenshot",
            label: "Original screenshot",
            result: "Screenshot of a screenshot. No timestamp visible. ⚠️ Ambiguous.",
            supportsCoverStory: true,
          },
          {
            id: "outlet",
            label: "Check outlet reputation",
            result: "dailyalert.pk exists but has no editor page. ⚠️ Fringe.",
            supportsCoverStory: false,
          },
        ],
        moves: [
          {
            id: "provenance_trace",
            label: "Trace the provenance chain",
            blurb: "Follow each source to its origin.",
            outcome: "WIN",
            response:
              "All 3 'sources' trace to a single anonymous post 40 min ago. That's not a chorus — that's an echo.",
          },
          {
            id: "delay_past_window",
            label: "HOLD — wait past the urgency window",
            blurb: "Rumors die on schedule.",
            outcome: "WIN",
            response: "You waited 6 hours. Ministry issued a denial. Original post: deleted.",
          },
          {
            id: "hold_unverified",
            label: "Don't forward — refuse until verified",
            blurb: "Break the chain at you.",
            outcome: "WIN",
            response: "You didn't forward. The chorus needed you to grow — you starved it.",
            requiresFollowup: "provenance_trace",
          },
        ],
      },
      {
        id: "real-alert",
        truth: "REAL",
        opener:
          "ALERT — schools shut tomorrow due to smog. Two outlets and the education board confirm.",
        truthReveal:
          "It's real this time. Multiple independent origins. Blank refusal to warn = False Alarm.",
        winningVerdict: "HOLD_UNVERIFIED",
        debriefLine:
          "This time the chorus WAS a confirmation — because the sources were independent. Provenance trace still wins: it distinguishes the echo from the real chorus.",
        factChecks: [
          {
            id: "cross",
            label: "Cross-check across outlets",
            result: "3 outlets reporting — Dawn, Geo, and the ED Board Twitter. ✓ Independent.",
            supportsCoverStory: true,
            provenanceChain: [
              "Dawn: staff reporter, filed 2h ago",
              "Geo: independent bureau, filed 3h ago",
              "ED Board: official press release",
            ],
          },
          {
            id: "screenshot",
            label: "Original screenshot",
            result: "Official ED Board PDF with letterhead. ✓ Traceable.",
            supportsCoverStory: true,
          },
          {
            id: "outlet",
            label: "Check outlet reputation",
            result: "All established outlets with editorial oversight. ✓ Real.",
            supportsCoverStory: true,
          },
        ],
        moves: [
          {
            id: "provenance_trace",
            label: "Trace the provenance chain",
            blurb: "Follow each source to its origin.",
            outcome: "WIN",
            response:
              "Each source traces to an INDEPENDENT origin — a staff reporter, a bureau, an official release. That's a real chorus. Forward with confidence.",
          },
          {
            id: "delay_past_window",
            label: "HOLD — wait past the urgency window",
            blurb: "Rumors die on schedule.",
            outcome: "PROGRESS",
            response:
              "You waited. Story is still standing 3 hours later, more outlets picking it up. That's the pattern of real news — but you also need provenance.",
          },
          {
            id: "hold_unverified",
            label: "Don't forward — refuse until verified",
            blurb: "Break the chain at you.",
            outcome: "PROGRESS",
            response:
              "HOLD is smart — but a real school closure needs to reach parents. Trace the chain, confirm independence, THEN forward.",
            requiresFollowup: "provenance_trace",
          },
        ],
      },
    ],
  },
];

export function getBoss(id: string): BossConfig | undefined {
  return BOSSES.find((b) => b.id === id);
}

// MILVERSE — The Editor's Desk. Deterministic craft heuristics for the
// citizen case designer. Pure. No AI. Never blocks; advises only.

export interface DeskDraft {
  truth: "REAL" | "IMPOSTER";
  personaName: string;
  relationship: string;
  opener: string;
  tone: "warm" | "urgent" | "official" | "emotional";
  agenda: string;
  facts: { text: string; isPublic: boolean; isGap: boolean }[];
}

export interface DeskNote {
  id: string;
  status: "pass" | "advise";
  title: string;
  note: string;
}

const TIP_HAND_TOKENS = [
  "otp",
  "code",
  "password",
  "pin",
  "account number",
  "send money",
  "transfer now",
];

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function filledFacts(d: DeskDraft) {
  return d.facts.filter((f) => f.text.trim().length >= 6);
}

export function deskReview(d: DeskDraft): DeskNote[] {
  const notes: DeskNote[] = [];
  const filled = filledFacts(d);

  // 1. tell-exists (IMPOSTER only)
  if (d.truth === "IMPOSTER") {
    const gaps = filled.filter((f) => f.isGap).length;
    notes.push(
      gaps >= 2
        ? {
            id: "tell-exists",
            status: "pass",
            title: "TELL EXISTS",
            note: `Your imposter has ${gaps} knowledge gaps to slip on. That's the trap door.`,
          }
        : {
            id: "tell-exists",
            status: "advise",
            title: "TELL EXISTS",
            note: "An imposter with nothing they can't know is unbeatable — and unbeatable isn't scary, it's unfair. Mark the private facts they'd fumble.",
          },
    );
  }

  // 2. paranoia-check (REAL only)
  if (d.truth === "REAL") {
    const knowable = filled.filter((f) => !f.isPublic && !f.isGap).length;
    notes.push(
      knowable >= 2
        ? {
            id: "paranoia-check",
            status: "pass",
            title: "PARANOIA CHECK",
            note: `Your real person can prove themselves ${knowable} ways. Paranoia against them will cost the player — as it should.`,
          }
        : {
            id: "paranoia-check",
            status: "advise",
            title: "PARANOIA CHECK",
            note: "A real case must be winnable by verifying, or 'refuse everything' becomes the right move — and that's the lesson this city exists to kill. Give the real person facts they can actually answer.",
          },
    );
  }

  // 3. opener-tips-hand
  const openerLower = d.opener.toLowerCase();
  const tipsHand = TIP_HAND_TOKENS.some((t) => openerLower.includes(t));
  notes.push(
    tipsHand
      ? {
          id: "opener-tips-hand",
          status: "advise",
          title: "OPENER TIPS ITS HAND",
          note: "Your opener asks for the prize in the first line. Real scripts warm up first — move the ask two beats later. (The engine holds pushes back anyway; write like they would.)",
        }
      : {
          id: "opener-tips-hand",
          status: "pass",
          title: "OPENER TIPS ITS HAND",
          note: "Opener sets the scene without grabbing for the wallet. Good patience.",
        },
  );

  // 4. opener-hook — claimed identity referenced
  const personaTokens = [d.personaName, d.relationship]
    .flatMap((s) => s.toLowerCase().split(/\s+/))
    .filter((t) => t.length >= 3);
  const relationshipWords = [
    "uncle",
    "aunt",
    "cousin",
    "brother",
    "sister",
    "friend",
    "bank",
    "helpline",
    "team",
    "support",
    "customer",
    "office",
    "colleague",
    "boss",
    "father",
    "mother",
    "beta",
    "bhai",
    "baji",
    "chacha",
    "khala",
    "mama",
    "nana",
  ];
  const hookHit =
    personaTokens.some((t) => openerLower.includes(t)) ||
    relationshipWords.some((t) => openerLower.includes(t));
  notes.push(
    hookHit
      ? {
          id: "opener-hook",
          status: "pass",
          title: "OPENER HOOK",
          note: "The opener says who's (supposedly) talking. Players can start verifying immediately.",
        }
      : {
          id: "opener-hook",
          status: "advise",
          title: "OPENER HOOK",
          note: "The opener never says who this is. Confusion isn't tension — give the player a claim to test.",
        },
  );

  // 5. fact-probe-surface
  const shortFacts = filled.filter((f) => wordCount(f.text) < 4).length;
  notes.push(
    shortFacts >= 2
      ? {
          id: "fact-probe-surface",
          status: "advise",
          title: "FACTS TOO THIN",
          note: `${shortFacts} facts are very short. Facts double as the things players ask about — 'the trip' probes worse than 'the Murree trip last Eid where the car broke down.'`,
        }
      : {
          id: "fact-probe-surface",
          status: "pass",
          title: "FACTS TOO THIN",
          note: "Facts are specific enough to probe. The dossier will hold up in play.",
        },
  );

  // 6. public-bait
  const publicFacts = filled.filter((f) => f.isPublic).length;
  notes.push(
    publicFacts >= 1
      ? {
          id: "public-bait",
          status: "pass",
          title: "PUBLIC BAIT",
          note: "You've given the imposter public ammunition. Cases where the fake can 'prove' things teach the deepest lesson: surface knowledge proves nothing.",
        }
      : {
          id: "public-bait",
          status: "advise",
          title: "PUBLIC BAIT",
          note: "No public facts. Without them, any correct detail proves identity — that's not how the real world works anymore. Mark something findable.",
        },
  );

  // 7. tone-agenda-fit (IMPOSTER only)
  if (d.truth === "IMPOSTER") {
    const warmMoney = d.tone === "warm" && d.agenda === "money";
    notes.push(
      warmMoney
        ? {
            id: "tone-agenda-fit",
            status: "advise",
            title: "TONE × AGENDA",
            note: "Warm + money is the classic — fine, but the graveyard's full of it. Consider what ELSE warmth could want: information, a forward, a favor that isn't cash.",
          }
        : {
            id: "tone-agenda-fit",
            status: "pass",
            title: "TONE × AGENDA",
            note: "Tone and agenda pull in different directions than the obvious pair. Room for surprise.",
          },
    );
  }

  return notes;
}

export function deskScore(notes: DeskNote[]): { passed: number; total: number } {
  return {
    passed: notes.filter((n) => n.status === "pass").length,
    total: notes.length,
  };
}

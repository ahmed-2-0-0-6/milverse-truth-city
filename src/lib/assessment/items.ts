// MILVERSE — Pilot Assessment items.
//
// TWO matched forms (A, B). 6 items each. NEW mini-artifacts that appear in
// NO playable case anywhere in the game — this is measurement, not practice.
//
// Matched pairs: A1↔B1 same tactic + difficulty, different surface, etc.
// Item mix per form:
//   pos 1: LEGIT easy   (false-alarm detector, friend text)
//   pos 2: FALSE easy   (missed-scam detector, prize/lottery bait)
//   pos 3: LEGIT medium (false-alarm detector, sourced headline)
//   pos 4: FALSE medium (missed-scam detector, bank/wallet phish)
//   pos 5: OUT-OF-CONTEXT (correct verdict = FALSE — the CLAIM is false)
//   pos 6: UNVERIFIABLE  (correct verdict = CANT_VERIFY)

export type Verdict = "LEGIT" | "FALSE" | "CANT_VERIFY";
export type FormId = "A" | "B";

export interface AssessmentItem {
  id: string; // e.g. "A1", "B4"
  pairId: string; // "P1".."P6" — same across A/B for matched pairs
  form: FormId;
  tactic:
    | "friend-text"
    | "prize-bait"
    | "sourced-news"
    | "bank-phish"
    | "out-of-context"
    | "unverifiable-forward";
  difficulty: "easy" | "medium";
  artifact: string; // 1–3 lines — the "screenshot" text
  imageDescription?: string; // optional description of accompanying image
  truth: Verdict; // ground truth
  rationale: string; // shown ONLY after EXIT completion, never after intake
}

/* ─────────────────────────  FORM  A  ───────────────────────── */

const FORM_A: AssessmentItem[] = [
  {
    id: "A1",
    pairId: "P1",
    form: "A",
    tactic: "friend-text",
    difficulty: "easy",
    artifact:
      "hey yaar, thora late aunga aaj — traffic bilkul jam hai. tu order kar de mera bhi, mai pohanchte hi paisay de deta hoon 🙏",
    truth: "LEGIT",
    rationale:
      "Ordinary friend chat: familiar tone, no ask for money/codes/links, no urgency lever. Judging this as a scam is a false alarm.",
  },
  {
    id: "A2",
    pairId: "P2",
    form: "A",
    tactic: "prize-bait",
    difficulty: "easy",
    artifact:
      "🎉 CONGRATULATIONS! You've won a Toyota Corolla in the Ramadan Grand Draw. Claim within 24 hours: bit.ly/win-2024pk",
    truth: "FALSE",
    rationale:
      "Unsolicited prize you never entered + shortened link + 24-hour urgency. Classic lottery-bait scam.",
  },
  {
    id: "A3",
    pairId: "P3",
    form: "A",
    tactic: "sourced-news",
    difficulty: "medium",
    artifact:
      "REUTERS · May 2024 — State Bank of Pakistan holds policy rate at 22%, citing sticky inflation. Full statement on sbp.org.pk.",
    truth: "LEGIT",
    rationale:
      "Named wire agency, dated, points to primary source (sbp.org.pk). This is legitimate news reporting.",
  },
  {
    id: "A4",
    pairId: "P4",
    form: "A",
    tactic: "bank-phish",
    difficulty: "medium",
    artifact:
      "HBL ALERT: Your account will be BLOCKED in 24 hours due to suspicious activity. Verify OTP now → http://hbl-secure-verify.co",
    truth: "FALSE",
    rationale:
      "Real banks never text you an OTP link. Domain isn't hbl.com. Deadline + fear = phishing.",
  },
  {
    id: "A5",
    pairId: "P5",
    form: "A",
    tactic: "out-of-context",
    difficulty: "medium",
    artifact:
      '"BREAKING: Floods destroy entire village overnight in Sindh. Government silent." — viral WhatsApp forward, today.',
    imageDescription:
      "Attached image is a widely-shared 2010 flood photo from the same region, previously verified in news archives.",
    truth: "FALSE",
    rationale:
      "Recycled 2010 image passed off as today's event. The image is real but the CLAIM about it is false — out-of-context is a form of misinformation.",
  },
  {
    id: "A6",
    pairId: "P6",
    form: "A",
    tactic: "unverifiable-forward",
    difficulty: "medium",
    artifact:
      '"A source at the Interior Ministry told me 3,000 people were arrested in Karachi last night." — forwarded message, no journalist named, no outlet, no timestamp on original.',
    truth: "CANT_VERIFY",
    rationale:
      'Anonymous "source", no outlet, no time, no photo — literally nothing to verify. Correct call: mark as unverifiable, don\'t share.',
  },
];

/* ─────────────────────────  FORM  B  ───────────────────────── */

const FORM_B: AssessmentItem[] = [
  {
    id: "B1",
    pairId: "P1",
    form: "B",
    tactic: "friend-text",
    difficulty: "easy",
    artifact:
      "oye mai gym nhi aa raha aaj, back thori kharaab hai. tu chal jana, kal milte hain inshaAllah",
    truth: "LEGIT",
    rationale:
      "Small-talk from a friend. No link, no ask, no urgency. Reading this as a scam is a false alarm.",
  },
  {
    id: "B2",
    pairId: "P2",
    form: "B",
    tactic: "prize-bait",
    difficulty: "easy",
    artifact:
      "You are our lucky WhatsApp winner of Rs 500,000! Send CNIC number + bank account details to claim. Reply YES within 2 hours.",
    truth: "FALSE",
    rationale:
      "Unsolicited prize + demand for CNIC and bank details + 2-hour deadline. Textbook advance-fee / data-harvest scam.",
  },
  {
    id: "B3",
    pairId: "P3",
    form: "B",
    tactic: "sourced-news",
    difficulty: "medium",
    artifact:
      "AP · July 2024 — IMF board approves $7 billion Extended Fund Facility for Pakistan; first tranche expected within weeks.",
    truth: "LEGIT",
    rationale:
      "Named wire agency (AP), dated, specific verifiable facts (board approval, program size). Legitimate reporting.",
  },
  {
    id: "B4",
    pairId: "P4",
    form: "B",
    tactic: "bank-phish",
    difficulty: "medium",
    artifact:
      "JazzCash: Suspicious login detected on your wallet. Confirm your PIN within 1 hour or your wallet will be permanently FROZEN: jazzcash-verify.net",
    truth: "FALSE",
    rationale:
      "Real JazzCash never asks for your PIN via a link. Look-alike domain (jazzcash-verify.net ≠ jazzcash.com.pk) + fear + deadline = phishing.",
  },
  {
    id: "B5",
    pairId: "P5",
    form: "B",
    tactic: "out-of-context",
    difficulty: "medium",
    artifact:
      '"Devastating scenes from today\'s Balochistan earthquake — pray for our people." — forwarded post, this morning.',
    imageDescription: "Attached image is a 2015 Nepal earthquake photo indexed in Getty archives.",
    truth: "FALSE",
    rationale:
      "Real photo, wrong event, wrong country, wrong year. The CLAIM about the image is false — out-of-context misinformation.",
  },
  {
    id: "B6",
    pairId: "P6",
    form: "B",
    tactic: "unverifiable-forward",
    difficulty: "medium",
    artifact:
      '"A doctor in Lahore says a new virus is spreading faster than covid — hospitals overwhelmed." Forwarded, no doctor named, no hospital, no outlet.',
    truth: "CANT_VERIFY",
    rationale:
      "No named source, no hospital, no outlet, no data. There is nothing to verify. Correct call: unverifiable — don't share.",
  },
];

export const FORMS: Record<FormId, AssessmentItem[]> = {
  A: FORM_A,
  B: FORM_B,
};

export function getForm(form: FormId): AssessmentItem[] {
  return FORMS[form];
}

/** Matched pair index — used for per-tactic breakdown on the dashboard. */
export const PAIR_LABELS: Record<string, string> = {
  P1: "Legit friend text",
  P2: "Prize / lottery bait",
  P3: "Sourced headline",
  P4: "Bank / wallet phish",
  P5: "Out-of-context image",
  P6: "Unverifiable forward",
};

// LAYER-3 — "The Quiet File" · aftermath copy for survivor cases.
// Register split for the two Mirror scenarios that carry isSurvivorStory.
// Content is hand-authored and MUST ship verbatim: no statistics, no
// checkable numbers, no real people. Composites are labeled as such.

export interface Aftermath {
  caseId: string;
  patternName: string;
  reportedPattern: string;
  dayAfter: string;
  steps: string[];
}

export const AFTERMATHS: Aftermath[] = [
  {
    caseId: "survivor-bankfraud",
    patternName: "THE REVERSE-OTP SCRIPT",
    reportedPattern:
      "This script runs word-for-word: a calm 'fraud officer', a transaction that doesn't exist, and an invented category — the 'reverse OTP' — built to make sharing a code sound like safety. The rule the case turned on holds without exception: no bank asks for an OTP. Not the fraud desk. Not anyone.",
    dayAfter:
      "He hung up and called the number on the back of his card. The real fraud desk froze the card in minutes; the account survived, and the afternoon became a report instead of a loss. The difference wasn't cleverness. It was one habit — verify on a channel you chose.",
    steps: [
      "Hang up. Call the number printed on the back of your card — never a number the caller gave you.",
      "Check pending transactions yourself, in the app.",
      "If a code slipped out, tell the bank immediately. Minutes matter.",
      "Report the number. Every report makes the script more expensive to run.",
    ],
  },
  {
    caseId: "survivor-wa-admin",
    patternName: "THE CLONED-COUSIN SCRIPT",
    reportedPattern:
      "Account takeovers spread family to family: one hijacked account messages everyone in its groups, and each stolen code hands over another. The cover story changes — admin panels, re-verification, group cutoffs. The ask never does: read me the six digits. That code is the key to your account. No one legitimate will ever ask for it.",
    dayAfter:
      "She called Bilal's actual number before replying. He hadn't sent anything — his account was already someone else's. Because she called, the chain stopped at her. The family group got a warning that night instead of a second victim.",
    steps: [
      "Never read a six-digit code to anyone. Family included.",
      "Call the person on their real number before acting on any strange ask.",
      "If an account is taken: re-register the number in the app immediately — the new code takes it back.",
      "Warn the group. The script depends on nobody talking.",
    ],
  },
];

export function aftermathFor(caseId: string): Aftermath | null {
  return AFTERMATHS.find((a) => a.caseId === caseId) ?? null;
}

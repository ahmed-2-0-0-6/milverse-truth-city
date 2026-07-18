// MILVERSE — THE CLAIMED CLOCK
// Hand-authored presentation config. The clock belongs to the CONTACT,
// not the game: durations mirror what the dialogue itself claims. It never
// commits a verdict, never ends the chat, and behaves identically for REAL
// and IMPOSTER cases — the lesson lands in the debrief, not the timer.
//
// AI judges nothing here. This file is intentionally static config.

export interface ClaimedClock {
  caseId: string;
  seconds: number;
  label: string;
  /** When to start the countdown. "opener" = at chat mount. */
  startAt: "opener" | number;
  /** System-style line appended once when the countdown reaches 0. */
  expiredLine: string;
  /** Copy shown in the debrief under THE CLOCK. */
  debriefNote: string;
}

export const CLAIMED_CLOCKS: ClaimedClock[] = [
  {
    caseId: "pk-prize-sms",
    seconds: 120,
    label: "THEIR CLAIM · 2 MIN",
    startAt: "opener",
    expiredLine: "Their two minutes are up. They're still here.",
    debriefNote:
      "The deadline was invented. It expired and nothing happened — except he kept pushing. A clock that only exists in their message is a prop.",
  },
  {
    caseId: "t3-fraud-dept",
    seconds: 240,
    label: "THEIR CLAIM · 4 MIN",
    startAt: "opener",
    expiredLine: "Four minutes passed. The line is still open.",
    debriefNote:
      "Fraud-desk theater runs on borrowed urgency. The 'posting window' was a script beat, not a bank process.",
  },
  {
    caseId: "t3-real-bank",
    seconds: 240,
    label: "THEIR CLAIM · 4 MIN",
    startAt: "opener",
    expiredLine: "Four minutes passed. The line is still open.",
    debriefNote:
      "This one was real — and verifying still fit inside the window. Real deadlines survive a check. That is what makes them different from props.",
  },
  {
    caseId: "pk-stranded-cousin",
    seconds: 300,
    label: "THEIR CLAIM · 5 MIN",
    startAt: "opener",
    expiredLine: "The five minutes he named came and went.",
    debriefNote:
      "He said the bus leaves in five minutes. It didn't. Manufactured departure times are the cheapest pressure there is.",
  },
];

export function clockFor(caseId: string): ClaimedClock | null {
  return CLAIMED_CLOCKS.find((c) => c.caseId === caseId) ?? null;
}

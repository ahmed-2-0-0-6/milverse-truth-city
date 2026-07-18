// MILVERSE — Tier 5 "Clean Room" debrief notes. Hand-authored per case,
// rendered AFTER the verdict is out. Cases without an entry render nothing,
// so future T5 additions degrade gracefully.

export const CLEAN_ROOM_NOTES: Record<string, string> = {
  "t5-clean-room":
    "Every fact was answered. Every answer was right. It proved nothing — records get scraped, bought, and generated. The only thing he couldn't fake was a channel he didn't control. Spotting is dying. Verifying is forever.",
  "t5-unlucky-boss":
    "Every pattern screamed scam — new number, urgency, money on the line. She was real. Patterns aren't proof in either direction; they're weather. The call you made outside the room was the only fact in the building.",
};

export function roomNoteFor(caseId: string): string | null {
  return CLEAN_ROOM_NOTES[caseId] ?? null;
}

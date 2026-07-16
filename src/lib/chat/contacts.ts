// Presentation-only saved contacts. NOT engine data.
// Used by ContactsSheet for the "call saved number" surface.

export interface SavedContact {
  id: string;
  name: string;
  number: string;
  role?: string;
  /** If this contact tap should trigger a boss protocol move, name the move. */
  protocolMove?:
    | "callback_known"
    | "second_person"
    | "shared_secret"
    | "outbound_video"
    | "provenance_trace"
    | "delay_past_window"
    | "hold_unverified";
}

export const BASE_CONTACTS: SavedContact[] = [
  { id: "ammi", name: "Ammi", number: "+92 300 4412289", role: "Family" },
  { id: "boss-office", name: "Boss (Office)", number: "+92 21 3456 7890", role: "Work" },
  { id: "bank-helpline", name: "Bank Helpline (from card)", number: "111 111 111", role: "HBL — from card back" },
  { id: "cousin-zara", name: "Zara", number: "+92 333 2211447", role: "Cousin" },
  { id: "office-manager", name: "Office Manager", number: "+92 21 3456 7891", role: "Work" },
];

/** Per-boss contacts wired to protocol moves. */
export const BOSS_CONTACTS: Record<string, SavedContact[]> = {
  "ghost-of-bali": [
    { id: "ghost-known", name: "Him (saved number)", number: "+92 321 4459812", role: "Best friend", protocolMove: "callback_known" },
    { id: "ghost-sister", name: "His sister", number: "+92 333 7788221", role: "Second person", protocolMove: "second_person" },
    { id: "ghost-office", name: "His office manager", number: "+92 21 3456 7891", role: "Second person", protocolMove: "second_person" },
  ],
  "the-twin": [
    { id: "twin-known", name: "Cousin (saved number)", number: "+92 300 1129847", role: "Family", protocolMove: "outbound_video" },
    { id: "twin-aunt", name: "Aunt", number: "+92 333 4471129", role: "Family", protocolMove: "second_person" },
  ],
  "the-chorus": [
    { id: "chorus-desk", name: "Newsroom desk (verified)", number: "+92 21 111 100 100", role: "Provenance", protocolMove: "provenance_trace" },
    { id: "chorus-wait", name: "Wait past the window", number: "—", role: "Discipline", protocolMove: "delay_past_window" },
  ],
};

/** Best-effort transfer amount pulled from boss variant text — presentation only. */
export function detectAmount(text: string): string | null {
  const m = text.match(/(USD|EUR|GBP|£|\$|€|₨|PKR|Rs\.?)\s?([\d,]+(?:\.\d+)?)|(₨|Rs\.?)\s?([\d,]+)|([\d,]+)\s?(USD|EUR|GBP|PKR)/i);
  if (!m) return null;
  return m[0].replace(/\s+/g, " ").trim();
}

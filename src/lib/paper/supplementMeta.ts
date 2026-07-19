// Lightweight supplement metadata for notification surfaces.
// Keep this free of scenario/profile imports so the landing page can show the
// newspaper nudge without loading the full paper composition engine.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface SupplementWeek {
  /** YYYY-MM-DD (Karachi) of the Sunday that opens the current supplement week. */
  weekKey: string;
  /** ISO week number of that Sunday. */
  isoWeek: number;
  /** Human date label of that Sunday. */
  sundayLabel: string;
  /** UTC ms epoch of Sunday 00:00 Karachi (used for history filtering). */
  sundayStartUtcMs: number;
}

export function shiftedKarachi(now: Date): Date {
  return new Date(now.getTime() + 5 * 60 * 60 * 1000);
}

/** ISO-week number of a Date (treated as UTC clock). Deterministic. */
function isoWeekNumber(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function dateLabel(d: Date): string {
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Most recent Sunday 00:00 in Asia/Karachi (UTC+5). */
export function supplementWeek(now: Date = new Date()): SupplementWeek {
  const shifted = shiftedKarachi(now);
  const dow = shifted.getUTCDay(); // 0 = Sunday
  const sundayShifted = new Date(shifted);
  sundayShifted.setUTCDate(shifted.getUTCDate() - dow);
  sundayShifted.setUTCHours(0, 0, 0, 0);
  const weekKey = sundayShifted.toISOString().slice(0, 10);
  const isoWeek = isoWeekNumber(sundayShifted);
  const sundayLabel = dateLabel(sundayShifted);
  // Convert Karachi Sunday 00:00 back to UTC epoch (subtract 5h).
  const sundayStartUtcMs = sundayShifted.getTime() - 5 * 60 * 60 * 1000;
  return { weekKey, isoWeek, sundayLabel, sundayStartUtcMs };
}

const LAST_SEEN_KEY = "milverse.supplement.lastSeen";

export function readLastSeenWeek(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markSupplementSeen(weekKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_SEEN_KEY, weekKey);
  } catch {
    /* ignore */
  }
}
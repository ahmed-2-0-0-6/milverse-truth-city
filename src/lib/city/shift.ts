// MILVERSE — THE NIGHT SHIFT · single source of clock truth.
//
// This is the ONLY module that reads the wall clock for "what band of day is
// it?" decisions. Every night-register surface (landing kicker, marquee,
// Handler pools, inbox preview, map tint, paper dateline, hub advisory)
// imports `cityShift` from here. grep-friendly rule: no other file in
// src/ should call `new Date().getHours()` for a band-shaped branch.
// (Wall-clock READOUTS — status bars, notification stamps, lock screens —
// are exempt; they render an actual time, not a band.)
//
// The clock is LOCAL to the player's device — this is their own sky, not
// the city's calendar. The Daily Drop's rollover remains UTC+5 by design;
// the two clocks are different clocks (see `src/lib/daily/rotation.ts`).
//
// Pure function. Time enters only via `now`. Nothing else.

export type ShiftBand = "day" | "evening" | "night" | "smallHours";

export interface Shift {
  band: ShiftBand;
  /** Human-facing label (uppercase; safe to render as-is). */
  label: string;
}

const LABELS: Record<ShiftBand, string> = {
  day: "THE DAY DESK",
  evening: "THE EVENING EDITION",
  night: "THE NIGHT SHIFT",
  smallHours: "THE SMALL HOURS",
};

/**
 * Bands (LOCAL device hours):
 *   06 ≤ h < 17 → day
 *   17 ≤ h < 21 → evening
 *   21 ≤ h < 24 or 0 ≤ h < 1 → night
 *   1 ≤ h < 6  → smallHours
 */
function bandForHour(h: number): ShiftBand {
  if (h >= 6 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  if (h >= 21 || h < 1) return "night";
  return "smallHours";
}

/**
 * Pure, deterministic band resolver. `now` is required so callers must be
 * explicit about the clock they're using — no hidden time reads.
 */
export function cityShift(now: Date): Shift {
  const band = bandForHour(now.getHours());
  return { band, label: LABELS[band] };
}

/** True when the band is night or smallHours (night-register surfaces). */
export function isNightRegister(band: ShiftBand): boolean {
  return band === "night" || band === "smallHours";
}

/** Local-clock date key (YYYY-MM-DD, LOCAL). Used to seed per-day picks
 *  that are band-sensitive. NOT the same as the drop's UTC+5 key. */
export function localDateKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ─────────────── DEV-ONLY force override ───────────────
 *
 * For acceptance testing without changing the device clock. Set in devtools:
 *   localStorage.setItem("milverse.shift.force", "smallHours");
 * Valid values: "day" | "evening" | "night" | "smallHours" | "" (clear)
 *
 * `currentShift()` returns the forced band when set, otherwise `cityShift(new Date())`.
 * This is dev-tooling; production paths that must stay pure call `cityShift(now)`
 * directly with an explicit `now`.
 */
const FORCE_KEY = "milverse.shift.force";

function readForce(): ShiftBand | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(FORCE_KEY);
    if (v === "day" || v === "evening" || v === "night" || v === "smallHours") {
      return v;
    }
  } catch {
    /* localStorage unavailable */
  }
  return null;
}

/**
 * Convenience: read the current shift from the wall clock, honoring the
 * dev-only force key. Callers that need determinism should use `cityShift(now)`
 * with an explicit `now` and skip the force read.
 */
export function currentShift(now: Date = new Date()): Shift {
  const forced = readForce();
  if (forced) return { band: forced, label: LABELS[forced] };
  return cityShift(now);
}

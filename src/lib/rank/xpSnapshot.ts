// MILVERSE — XP snapshot bridge for debrief screens.
// Presentation-only: lets debriefs show "+N XP" without restructuring commit flows.
// Snapshot is written just before a profile commit; the debrief reads the delta.

const KEY = "milverse.xpDelta.last";
const FRESH_MS = 5 * 60 * 1000;

export function writeXpDelta(before: number, after: number) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ before, after, delta: after - before, ts: Date.now() }),
    );
  } catch {
    /* storage full — silent */
  }
}

export function readXpDelta(): { delta: number; before: number; after: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      before: number;
      after: number;
      delta: number;
      ts: number;
    };
    if (!parsed || Date.now() - parsed.ts > FRESH_MS) return null;
    return { delta: parsed.delta, before: parsed.before, after: parsed.after };
  } catch {
    return null;
  }
}

export function clearXpDelta() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* silent */
  }
}

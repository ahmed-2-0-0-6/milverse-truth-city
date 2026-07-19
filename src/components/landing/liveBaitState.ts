export const LIVE_BAIT_SEEN_KEY = "milverse.livebait.seen.v1";

export function hasSeenLiveBait(): boolean {
  try {
    return sessionStorage.getItem(LIVE_BAIT_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLiveBaitSeen(): void {
  try {
    sessionStorage.setItem(LIVE_BAIT_SEEN_KEY, "1");
  } catch {
    /* sessionStorage unavailable */
  }
}
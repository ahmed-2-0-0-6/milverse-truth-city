// MILVERSE — CITY IS AWAKE
// Truthful signals derived from existing local profiles only.
// Pure function: no side effects, no network, no invented activity.

import { loadInbox } from "@/lib/inbox/profile";
import { readDailyStatus } from "@/lib/daily/profile";
import { loadBossProfile, canRematch } from "@/lib/boss/profile";
import type { BossId } from "@/lib/boss/types";

export type SignalDistrict = "mirror" | "feed" | "hall" | "arena" | "market";

export interface CitySignal {
  district: SignalDistrict;
  count: number;
  label: string;
  to: string;
}

/**
 * Compose the current, real, player-local signals.
 * Returns only nonzero entries.
 *
 * Rules:
 *  - mirror/feed: Citizen Inbox arrivals that are not yet opened,
 *    counted per platform (arrival id prefix "mirror:" or "feed:").
 *  - hall: today's Daily Drop is unplayed (count 1). Route: /drop.
 *  - arena: any uncompleted Handler assignment, or an available rematch
 *    on a boss the player has attempted. Route: /boss.
 *  - market: the Morning Edition arrived today but hasn't been opened
 *    (arrived includes a "paper:" id and paperRead is null/other).
 *    Route: /paper. Skips silently when no edition ever arrived.
 */
export function readCitySignals(_now: Date = new Date()): CitySignal[] {
  const out: CitySignal[] = [];

  const inbox = loadInbox();
  const opened = new Set(inbox.opened);

  // mirror / feed — unread inbox arrivals
  let mirrorUnread = 0;
  let feedUnread = 0;
  for (const id of inbox.arrived) {
    if (opened.has(id)) continue;
    if (id.startsWith("mirror:")) mirrorUnread++;
    else if (id.startsWith("feed:")) feedUnread++;
  }
  if (mirrorUnread > 0) {
    out.push({
      district: "mirror",
      count: mirrorUnread,
      label: `${mirrorUnread} waiting`,
      to: "/",
    });
  }
  if (feedUnread > 0) {
    out.push({
      district: "feed",
      count: feedUnread,
      label: `${feedUnread} waiting`,
      to: "/",
    });
  }

  // hall — today's drop unplayed
  try {
    const daily = readDailyStatus();
    if (!daily.playedToday) {
      out.push({ district: "hall", count: 1, label: "today's drop", to: "/drop" });
    }
  } catch {
    /* daily rotation unavailable */
  }

  // arena — handler assignment or rematch
  try {
    const boss = loadBossProfile();
    const pending = boss.assignments.filter((a) => !a.completed);
    let arenaLabel: string | null = null;
    let arenaCount = 0;
    if (pending.length > 0) {
      arenaCount = pending.length;
      arenaLabel = "handler assignment";
    } else {
      const attempted = Array.from(
        new Set(boss.attempts.map((a) => a.bossId)),
      ) as BossId[];
      const rematches = attempted.filter((b) => canRematch(b));
      if (rematches.length > 0) {
        arenaCount = rematches.length;
        arenaLabel = "rematch open";
      }
    }
    if (arenaLabel) {
      out.push({ district: "arena", count: arenaCount, label: arenaLabel, to: "/boss" });
    }
  } catch {
    /* boss profile unavailable */
  }

  // market — morning edition delivered but unread
  const hasPaperArrival = inbox.arrived.some((id) => id.startsWith("paper:"));
  if (hasPaperArrival) {
    const paperArrivalId = inbox.arrived.find((id) => id.startsWith("paper:"))!;
    const editionId = paperArrivalId.slice("paper:".length);
    if (inbox.paperRead !== editionId && !opened.has(paperArrivalId)) {
      out.push({ district: "market", count: 1, label: "morning edition", to: "/paper" });
    }
  }

  return out;
}

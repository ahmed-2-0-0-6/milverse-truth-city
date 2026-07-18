// MILVERSE — THE SECOND-VISIT CITY
// Pure, local-only detection + desk-report composition. No cloud, no engine
// diffs. Every store read is wrapped in try/catch — a corrupt or missing
// source is skipped silently, never thrown. Deterministic: same profile +
// same `now` → same desk.
//
// Overlap with src/lib/city/signals.ts is intentional: this module composes
// a *player-facing report* (ordered, capped, spoken in the desk voice) and
// reuses the same underlying readers where they exist, rather than
// re-deriving them.

import { loadProfile } from "@/lib/mirror/profile";
import { loadFirstPhone } from "@/lib/firstPhone/profile";
import { readDailyStatus } from "@/lib/daily/profile";
import { secondsToNextDrop } from "@/lib/daily/rotation";
import { dueRetests } from "@/lib/mirror/retests";
import { supplementWeek, readLastSeenWeek } from "@/lib/paper/supplement";
import { loadBossProfile, canRematch } from "@/lib/boss/profile";

export type DeskUrgency = "dying" | "due" | "standing";

export interface DeskItem {
  id: string;
  urgency: DeskUrgency;
  line: string;
  to: string;
}

/** True when the visitor has any real play footprint on this device. */
export function isReturningCitizen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const p = loadProfile();
    if ((p?.casesPlayed ?? 0) > 0) return true;
    if ((p?.dailyPlays?.length ?? 0) > 0) return true;
    if ((p?.dailyStreak ?? 0) > 0) return true;
  } catch {
    /* mirror profile unavailable */
  }
  try {
    const s = loadFirstPhone();
    if (s?.active) return true;
    if ((s?.lessonsCompleted?.length ?? 0) > 0) return true;
  } catch {
    /* first-phone unavailable */
  }
  return false;
}

const URGENCY_ORDER: Record<DeskUrgency, number> = { dying: 0, due: 1, standing: 2 };

/**
 * Compose the live business on the citizen's desk.
 * Time enters ONLY through `now`; every source is guarded; the final list is
 * ordered dying > due > standing and capped at 4.
 */
export function deskReport(now: Date = new Date()): DeskItem[] {
  const items: DeskItem[] = [];

  // 1) THE STREAK — real time-to-rollover from the drop's own UTC+5 clock.
  try {
    const s = readDailyStatus();
    const secs = secondsToNextDrop(now);
    const hours = secs / 3600;
    if (s.playedToday) {
      items.push({
        id: "streak-safe",
        urgency: "standing",
        line: `Streak safe at ${s.streak}. Tomorrow's drop prints at midnight.`,
        to: "/drop",
      });
    } else if (s.streak >= 2) {
      if (hours < 4) {
        items.push({
          id: "streak-dying",
          urgency: "dying",
          line: `Your ${s.streak}-day streak dies at midnight. One call saves it.`,
          to: "/drop",
        });
      } else {
        items.push({
          id: "streak-due",
          urgency: "due",
          line: `Day ${s.streak + 1} of the streak is sitting on the desk.`,
          to: "/drop",
        });
      }
    } else {
      items.push({
        id: "drop-due",
        urgency: "due",
        line: "Today's drop is on the desk.",
        to: "/drop",
      });
    }
  } catch {
    /* daily source unavailable — skip */
  }

  // 2) RETESTS — a reopened file, if one is due.
  try {
    const p = loadProfile();
    const due = dueRetests(p, now.getTime());
    if (due.length >= 1) {
      items.push({
        id: "retest-due",
        urgency: "due",
        line: "A reopened file is waiting. The city checks if the lesson stuck.",
        to: "/mirror",
      });
    }
  } catch {
    /* retests unavailable */
  }

  // 3) THE PAPER / SUPPLEMENT — unread supplement week.
  try {
    const week = supplementWeek(now);
    const seen = readLastSeenWeek();
    if (week.weekKey && seen !== week.weekKey) {
      items.push({
        id: "supplement-unread",
        urgency: "standing",
        line: "This week's supplement printed. Circulation: 1.",
        to: "/paper/supplement",
      });
    }
  } catch {
    /* supplement unavailable */
  }

  // 4) BOSS — pending Handler assignment or an open rematch.
  try {
    const boss = loadBossProfile();
    const pending = boss.assignments.filter((a) => !a.completed);
    if (pending.length > 0) {
      items.push({
        id: "boss-assignment",
        urgency: "due",
        line: "The Handler has business for you in the arena.",
        to: "/boss",
      });
    } else {
      const attempted = Array.from(new Set(boss.attempts.map((a) => a.bossId)));
      const rematchable = attempted.filter((b) => canRematch(b));
      if (rematchable.length > 0) {
        items.push({
          id: "boss-rematch",
          urgency: "due",
          line: "A rematch you asked for is open.",
          to: "/boss",
        });
      }
    }
  } catch {
    /* boss unavailable */
  }

  // Fallback: nothing live at all → one quiet-desk standing item.
  if (items.length === 0) {
    items.push({
      id: "quiet-desk",
      urgency: "standing",
      line: "Quiet desk. The tiers are open — pick a file.",
      to: "/mirror",
    });
  }

  // Order: dying > due > standing, stable within each band, cap 4.
  items.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
  return items.slice(0, 4);
}

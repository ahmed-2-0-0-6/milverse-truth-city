// MILVERSE — resolveNextAction.
// Pure, deterministic. Given "now", returns the single next move for the
// PLAY button. Guarded imports so missing optional systems (retests,
// coldreads, boss hub) fall through cleanly. Never mutates state.

import { loadProfile, unlockedMaxTier } from "@/lib/mirror/profile";
import { SCENARIOS } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import { readDailyStatus } from "@/lib/daily/profile";
import { loadFeedWall } from "@/lib/feed/wall";
import { dueRetests } from "@/lib/mirror/retests";
import { getScenario } from "@/lib/mirror/scenarios";
import { BOSSES } from "@/lib/boss/scenarios";
import { loadBossProfile } from "@/lib/boss/profile";
import { loadColdReads } from "@/lib/mirror/coldreads";
import { getActiveShift } from "@/lib/shift/state";

export interface NextAction {
  label: string;
  sublabel: string;
  to: string;
  params?: Record<string, string>;
}

function firstT1Case() {
  return SCENARIOS.find((s) => s.tier === 1);
}

function solvedMirrorIds(): Set<string> {
  const p = loadProfile();
  const solved = new Set<string>();
  for (const h of p.history) {
    if (h.result === "correct") solved.add(h.caseId);
  }
  return solved;
}

function nextUnsolvedMirror(): { id: string; title: string; tier: number } | null {
  const p = loadProfile();
  const maxTier = unlockedMaxTier(p);
  const solved = solvedMirrorIds();
  const pool = SCENARIOS.filter((s) => s.tier <= maxTier && !solved.has(s.id));
  pool.sort((a, b) => a.tier - b.tier);
  const s = pool[0];
  return s ? { id: s.id, title: s.title, tier: s.tier } : null;
}

function nextUnsolvedFeed(): { id: string; title: string } | null {
  const wall = loadFeedWall();
  const cleared = new Set(wall.filter((w) => w.result === "correct").map((w) => w.caseId));
  const next = FEED_SCENARIOS.find((s) => !cleared.has(s.id));
  return next ? { id: next.id, title: next.title } : null;
}

function nextAvailableBoss(): { id: string; codename: string } | null {
  const p = loadProfile();
  const maxTier = unlockedMaxTier(p);
  const bp = loadBossProfile();
  const won = new Set(bp.attempts.filter((a) => a.outcome === "WIN").map((a) => a.bossId));
  for (const b of BOSSES) {
    if (!b.playable) continue;
    if (won.has(b.id)) continue;
    if (maxTier < b.unlock.tiersRequired) continue;
    return { id: b.id, codename: b.codename };
  }
  return null;
}

export function resolveNextAction(_now: Date = new Date()): NextAction {
  const profile = loadProfile();

  // 1. Brand new — start the first T1.
  if (profile.casesPlayed === 0) {
    const first = firstT1Case();
    return {
      label: "START — YOUR FIRST CASE",
      sublabel: first?.title ?? "The Mirror",
      to: "/mirror/$caseId",
      params: { caseId: first?.id ?? "classmate-danish" },
    };
  }

  // 2. Today's drop unplayed.
  const daily = readDailyStatus();
  if (!daily.playedToday) {
    return {
      label: "PLAY TODAY'S DROP",
      sublabel:
        daily.streak >= 1 ? `day ${daily.streak + 1} of your streak` : "start a streak",
      to: "/drop",
    };
  }

  // 2.5. Active shift — resume next slot before per-case retests.
  const active = getActiveShift();
  if (active && active.slot < active.caseRefs.length && active.lives > 0) {
    const ref = active.caseRefs[active.slot];
    const slotNum = active.slot + 1;
    return {
      label: `SHIFT · SLOT ${slotNum}/${active.caseRefs.length}`,
      sublabel: `resume the docket — ${active.lives} live${active.lives === 1 ? "" : "s"}`,
      to: ref.kind === "mirror" ? "/mirror/$caseId" : "/feed/$caseId",
      params: { caseId: ref.id },
    };
  }

  // 3. Due retest.
  const due = dueRetests(profile);
  if (due.length > 0) {
    const r = due[0];
    const s = getScenario(r.retestCaseId);
    return {
      label: "A FILE REOPENED",
      sublabel: s?.title ?? r.sourceCaseTitle,
      to: "/mirror/$caseId",
      params: { caseId: r.retestCaseId },
    };
  }

  // 4. Next unsolved Mirror case at unlocked tiers.
  const mirror = nextUnsolvedMirror();
  if (mirror) {
    return {
      label: `NEXT CASE — TIER ${mirror.tier}`,
      sublabel: mirror.title,
      to: "/mirror/$caseId",
      params: { caseId: mirror.id },
    };
  }

  // 5. Next unsolved Feed case.
  const feed = nextUnsolvedFeed();
  if (feed) {
    return {
      label: "NEXT CASE — THE FEED",
      sublabel: feed.title,
      to: "/feed/$caseId",
      params: { caseId: feed.id },
    };
  }

  // 6. Boss available.
  const boss = nextAvailableBoss();
  if (boss) {
    return {
      label: "BOSS PROTOCOL",
      sublabel: boss.codename,
      to: "/boss/$bossId",
      params: { bossId: boss.id },
    };
  }

  // 7. All clear. Cold reads if any prior clears exist; else replay.
  const cold = loadColdReads();
  if (cold.length > 0 || solvedMirrorIds().size > 0) {
    return {
      label: "RUN IT COLD",
      sublabel: "mastery drill — beat the clock",
      to: "/mirror",
    };
  }
  return {
    label: "REPLAY THE CITY",
    sublabel: "your beat, again",
    to: "/mirror",
  };
}

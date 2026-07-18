// MILVERSE — Citizen Inbox scheduler.
// Deterministic. Reads existing scenarios + profile. Never mutates them.

import { SCENARIOS } from "@/lib/mirror/scenarios";
import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import { loadProfile } from "@/lib/mirror/profile";
import { todaysDailyCase, dropDateKey } from "@/lib/daily/rotation";
import { platformForCase, type ChatPlatform } from "@/lib/chat/skins";
import { fakeNumberForCase } from "@/lib/chat/fakeNumber";
import { loadInbox } from "@/lib/inbox/profile";

export type InboxPlatform = ChatPlatform | "drop";
export type InboxItemType = "message" | "call";

export interface InboxItem {
  id: string;
  type: InboxItemType;
  caseId: string;
  route: string;
  platform: InboxPlatform;
  senderName: string;
  preview: string;
  arriveAfterSec: number;
  /** Present on "call" items — fake caller number, matches chat header. */
  number?: string;
  /** Present on "call" items — first sentence of the opener, ≤90 chars. */
  voicemailText?: string;
  /** Present on "call" items — passed through to VoiceNote for TTS voice. */
  speakerVoiceDesc?: string;
}

/** Stagger, in seconds, from page-load until each arrival fires. */
export const ARRIVAL_STAGGER = [4, 25, 70, 140];
/** The Missed Call fires exactly once per day, on this constant delay. */
export const CALL_ARRIVE_SEC = 100;

const MAX_ITEMS = 4;

function ellipsize(s: string, n = 60): string {
  const t = (s || "").trim().replace(/\s+/g, " ");
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…";
}

function firstSentence(s: string, cap = 90): string {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const m = t.match(/^[^.!?]+[.!?]?/);
  const one = (m ? m[0] : t).trim();
  if (one.length <= cap) return one;
  return one.slice(0, cap - 1).trimEnd() + "…";
}

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function todaysArrivals(now: Date = new Date()): InboxItem[] {
  const p = loadProfile();
  const playedMirror = new Set<string>();
  const playedFeed = new Set<string>();
  for (const h of p.history) {
    if (h.caseId.startsWith("feed:")) playedFeed.add(h.caseId.slice(5));
    else playedMirror.add(h.caseId);
  }

  const pool: InboxItem[] = [];

  for (const sc of SCENARIOS) {
    if (playedMirror.has(sc.id)) continue;
    pool.push({
      id: `mirror:${sc.id}`,
      type: "message",
      caseId: sc.id,
      route: `/mirror/${sc.id}`,
      platform: platformForCase(sc.id),
      senderName: sc.claimedIdentity || "Unknown contact",
      preview: ellipsize(sc.opener || sc.teaser),
      arriveAfterSec: 0,
    });
  }
  for (const sc of FEED_SCENARIOS) {
    if (playedFeed.has(sc.id)) continue;
    pool.push({
      id: `feed:${sc.id}`,
      type: "message",
      caseId: sc.id,
      route: `/feed/${sc.id}`,
      platform: platformForCase(sc.id),
      senderName: sc.sender?.name || "Family group",
      preview: ellipsize(sc.opener || sc.teaser),
      arriveAfterSec: 0,
    });
  }

  let drop: InboxItem | null = null;
  try {
    const { scenario, dateKey } = todaysDailyCase();
    const playedToday = p.dailyPlays.some((d) => d.dateKey === dateKey);
    if (!playedToday) {
      drop = {
        id: `drop:${dateKey}`,
        type: "message",
        caseId: scenario.id,
        route: `/drop`,
        platform: "drop",
        senderName: "Aaj ka Forward",
        preview: ellipsize(scenario.opener || scenario.teaser || "Today's drop is live."),
        arriveAfterSec: 0,
      };
    }
  } catch {
    /* daily rotation unavailable */
  }

  const dk = dropDateKey(now);
  const seed = hash(`${dk}|${p.history.length}|${p.dailyPlays.length}`);

  const picked: InboxItem[] = [];
  if (drop) picked.push(drop);

  if (pool.length > 0) {
    const start = seed % pool.length;
    // Rotate through the pool deterministically, skipping duplicates.
    for (let i = 0; picked.length < MAX_ITEMS && i < pool.length; i++) {
      const cand = pool[(start + i) % pool.length];
      if (!picked.some((x) => x.id === cand.id)) picked.push(cand);
    }
  }

  const messages = picked.slice(0, MAX_ITEMS).map((it, i) => ({
    ...it,
    arriveAfterSec: ARRIVAL_STAGGER[i] ?? ARRIVAL_STAGGER[ARRIVAL_STAGGER.length - 1],
  }));

  // ── The Missed Call ─────────────────────────────────────────
  // At most one call per day: the first unplayed Mirror scenario (in
  // canonical order) whose voice payload is defined. Deterministic.
  const callScenario = SCENARIOS.find(
    (sc) => !playedMirror.has(sc.id) && !!sc.voice?.text,
  );
  if (callScenario) {
    const call: InboxItem = {
      id: `call:${callScenario.id}`,
      type: "call",
      caseId: callScenario.id,
      route: `/mirror/${callScenario.id}`,
      platform: platformForCase(callScenario.id),
      senderName: callScenario.claimedIdentity || "Unknown caller",
      number: fakeNumberForCase(callScenario.id),
      preview: "Voicemail · tap to play",
      voicemailText: firstSentence(callScenario.opener || callScenario.teaser || "", 90),
      speakerVoiceDesc: callScenario.persona?.voice,
      arriveAfterSec: CALL_ARRIVE_SEC,
    };
    messages.push(call);
  }

  return messages;
}

/** Convenience: today's call item, or null. */
export function todaysCall(now: Date = new Date()): InboxItem | null {
  return todaysArrivals(now).find((x) => x.type === "call") ?? null;
}

/** Has The Missed Call already fired (for any case) today? */
export function callAlreadyFiredToday(): boolean {
  if (typeof window === "undefined") return false;
  return loadInbox().firedCalls.length > 0;
}

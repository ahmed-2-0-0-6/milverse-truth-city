// MILVERSE — Pilot Mode: local aggregation + fire-and-forget backend sync.
// Zero backend REQUIREMENT: everything still works offline. When a group code
// is active and the network is available, we also insert into pilot_entries
// so a real classroom on multiple devices aggregates on the dashboard.

import { readStore, recoverStore, writeStore } from "@/lib/storage";


export interface PilotEntry {
  wing: "mirror" | "feed" | "daily";
  caseId: string;
  tier?: 1 | 2 | 3 | 4 | 5;
  result: "correct" | "missed_scam" | "false_alarm" | "lucky_guess" | "pyrrhic";
  points: number;
  probeStats?: { strong: number; weak: number; wasted: number };
  ts: number;
}

const ACTIVE_KEY = "milverse.pilot.active";
const DEVICE_KEY = "milverse.pilot.device";

export function getActiveGroup(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveGroup(code: string | null) {
  if (typeof window === "undefined") return;
  if (!code) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, code.toUpperCase());
  window.dispatchEvent(new Event("milverse:pilot"));
}

/** Persistent per-device anonymous UUID for pilot aggregation. No PII. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function key(code: string) {
  return `milverse.pilot.log.${code.toUpperCase()}`;
}

function isEntryListShape(v: unknown): v is PilotEntry[] {
  return Array.isArray(v);
}

export function loadPilotLog(code: string): PilotEntry[] {
  if (typeof window === "undefined") return [];
  const read = readStore<PilotEntry[]>(key(code), isEntryListShape);
  if (read === "corrupt") {
    const rec = recoverStore<PilotEntry[]>(key(code), isEntryListShape);
    return rec ?? [];
  }
  return read ?? [];
}

/** Fire-and-forget: always write to localStorage. If a group is active, also
 *  enqueue an outbox entry and kick a flush so multi-device classrooms aggregate. */
export function logPilotEntry(entry: PilotEntry) {
  if (typeof window === "undefined") return;
  const code = getActiveGroup();
  if (!code) return;
  const list = loadPilotLog(code);
  list.push(entry);
  writeStore(key(code), list);
  window.dispatchEvent(new Event("milverse:pilot"));
  enqueueOutbox({ groupCode: code, deviceId: getDeviceId(), entry });
  void flushOutbox();
}


/* ── OUTBOX ────────────────────────────────────────────────────────────────
   DELIBERATE DECISION: NO service worker / PWA caching backs this outbox.
   Lovable's two-way sync ships commits continuously; a cached shell during
   pilot week is a worse failure than a slow load. Resilience is
   localStorage-first + this outbox. Do not "helpfully" add a service worker.
   ──────────────────────────────────────────────────────────────────────── */

interface OutboxItem {
  groupCode: string;
  deviceId: string;
  entry: PilotEntry;
  /** consecutive head-of-queue send failures — see flushOutbox */
  headFails?: number;
}

const OUTBOX_KEY = "milverse.pilot.outbox.v1";
const OUTBOX_CAP = 200;
const MAX_HEAD_FAILS = 5;

function isOutboxShape(v: unknown): v is OutboxItem[] {
  return Array.isArray(v);
}

function loadOutbox(): OutboxItem[] {
  const read = readStore<OutboxItem[]>(OUTBOX_KEY, isOutboxShape);
  if (read === "corrupt") {
    const rec = recoverStore<OutboxItem[]>(OUTBOX_KEY, isOutboxShape);
    return rec ?? [];
  }
  return read ?? [];
}
function saveOutbox(items: OutboxItem[]) {
  writeStore(OUTBOX_KEY, items);
}


function enqueueOutbox(item: OutboxItem) {
  const list = loadOutbox();
  list.push(item);
  if (list.length > OUTBOX_CAP) {
    const dropped = list.length - OUTBOX_CAP;
    list.splice(0, dropped);
    // eslint-disable-next-line no-console
    console.warn(`[pilot outbox] cap ${OUTBOX_CAP} exceeded — dropped ${dropped} oldest entries`);
  }
  saveOutbox(list);
}

let flushing = false;
export async function flushOutbox(): Promise<void> {
  if (typeof window === "undefined" || flushing) return;
  if (!navigator.onLine) return;
  flushing = true;
  try {
    // Reload each iteration in case enqueueOutbox appended concurrently.
    let list = loadOutbox();
    while (list.length > 0) {
      const head = list[0];
      try {
        const { logPilotEntryToCloud } = await import("@/lib/pilot.functions");
        await logPilotEntryToCloud({
          data: {
            groupCode: head.groupCode,
            deviceId: head.deviceId,
            wing: head.entry.wing,
            caseId: head.entry.caseId,
            tier: head.entry.tier,
            result: head.entry.result,
            points: head.entry.points,
            probeStats: head.entry.probeStats,
          },
        });
        // Success — drop head.
        list = loadOutbox();
        list.shift();
        saveOutbox(list);
      } catch (err) {
        // Bump head-fail counter. If the same head has failed MAX_HEAD_FAILS
        // times in a row (poisoned entry, e.g. schema drift the server
        // permanently rejects), drop it and continue so it can't wedge the
        // queue. Otherwise stop — order matters; retry later.
        list = loadOutbox();
        const cur = list[0];
        if (!cur) break;
        const fails = (cur.headFails ?? 0) + 1;
        if (fails >= MAX_HEAD_FAILS) {
          // eslint-disable-next-line no-console
          console.warn("[pilot outbox] dropping poisoned head entry after 5 failures", err);
          list.shift();
          saveOutbox(list);
          // continue loop — try the next head once
          continue;
        }
        cur.headFails = fails;
        saveOutbox(list);
        break;
      }
    }
  } finally {
    flushing = false;
  }
}

/** Wire up flush triggers: online event + module init (best-effort).
 *  Also piggy-backs the assessment sync on the same online event when
 *  available — assessment/state.ts keeps its own retry pattern otherwise. */
let wired = false;
export function initPilotOutbox() {
  if (typeof window === "undefined" || wired) return;
  wired = true;
  window.addEventListener("online", () => {
    void flushOutbox();
    // Assessment module owns its own synced-flag retry. Piggy-back its
    // flush on the same online event since it's trivially available.
    void import("@/lib/assessment/state")
      .then((m) => m.syncPending?.())
      .catch(() => {});
  });
  void flushOutbox();
}

if (typeof window !== "undefined") {
  // Module init flush — covers app start when this file is first imported.
  initPilotOutbox();
}


/** Random 5-char group code, avoiding ambiguous chars. */
export function generateGroupCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function summarize(log: PilotEntry[]) {
  const total = log.length;
  const correct = log.filter((e) => e.result === "correct").length;
  const missed = log.filter((e) => e.result === "missed_scam").length;
  const falseAlarm = log.filter((e) => e.result === "false_alarm" || e.result === "pyrrhic").length;
  const lucky = log.filter((e) => e.result === "lucky_guess").length;
  const missRate = total ? missed / total : 0;
  const faRate = total ? falseAlarm / total : 0;
  let calibration: "Calibrated" | "Too Trusting" | "Too Paranoid" | "Miscalibrated" | "Warming up" =
    "Warming up";
  if (total >= 3) {
    if (missRate < 0.2 && faRate < 0.2) calibration = "Calibrated";
    else if (missRate > 0.4 && faRate < 0.2) calibration = "Too Trusting";
    else if (faRate > 0.4 && missRate < 0.2) calibration = "Too Paranoid";
    else calibration = "Miscalibrated";
  }
  return { total, correct, missed, falseAlarm, lucky, missRate, faRate, calibration };
}

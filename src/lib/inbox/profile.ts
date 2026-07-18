// MILVERSE — Citizen Inbox local state. Per-day arrival / read log.
// Fully client-side, localStorage only. Resets on new UTC+5 day key.

import { dropDateKey } from "@/lib/daily/rotation";
import { readStore, recoverStore, writeStore } from "@/lib/storage";

// Owner: inbox/profile (per-day InboxProfile). Bump the suffix on
// breaking shape change; readStore validators are the compatibility gate.
const KEY = "milverse.inbox.v1";


export interface InboxProfile {
  dateKey: string;
  arrived: string[];
  opened: string[];
  /** caseIds for which "The Missed Call" ring already fired today. */
  firedCalls: string[];
  /** Edition id the player last opened via a Morning Edition delivery. */
  paperRead: string | null;
}

function fresh(dateKey = dropDateKey()): InboxProfile {
  return { dateKey, arrived: [], opened: [], firedCalls: [], paperRead: null };
}

function isInboxShape(v: unknown): v is Partial<InboxProfile> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.dateKey !== undefined && typeof o.dateKey !== "string") return false;
  return true;
}

export function loadInbox(): InboxProfile {
  if (typeof window === "undefined") return fresh();
  const today = dropDateKey();
  const read = readStore<Partial<InboxProfile>>(KEY, isInboxShape);
  const p =
    read === "corrupt"
      ? recoverStore<Partial<InboxProfile>>(KEY, isInboxShape) ?? null
      : read;
  if (!p || p.dateKey !== today) return fresh(today);
  return {
    dateKey: today,
    arrived: Array.isArray(p.arrived) ? p.arrived : [],
    opened: Array.isArray(p.opened) ? p.opened : [],
    firedCalls: Array.isArray(p.firedCalls) ? p.firedCalls : [],
    paperRead: typeof p.paperRead === "string" ? p.paperRead : null,
  };
}

export function saveInbox(p: InboxProfile) {
  if (typeof window === "undefined") return;
  writeStore(KEY, p);
  window.dispatchEvent(new Event("milverse:inbox"));
}


export function markArrived(id: string) {
  const p = loadInbox();
  if (!p.arrived.includes(id)) {
    p.arrived.push(id);
    saveInbox(p);
  }
}

export function markOpened(id: string) {
  const p = loadInbox();
  let changed = false;
  if (!p.arrived.includes(id)) {
    p.arrived.push(id);
    changed = true;
  }
  if (!p.opened.includes(id)) {
    p.opened.push(id);
    changed = true;
  }
  if (changed) saveInbox(p);
}

export function markCallFired(caseId: string) {
  const p = loadInbox();
  if (!p.firedCalls.includes(caseId)) {
    p.firedCalls.push(caseId);
    saveInbox(p);
  }
}

export function markPaperRead(editionId: string) {
  const p = loadInbox();
  if (p.paperRead !== editionId) {
    p.paperRead = editionId;
    saveInbox(p);
  }
}

export function unreadCount(): number {
  const p = loadInbox();
  const opened = new Set(p.opened);
  return p.arrived.filter((id) => !opened.has(id)).length;
}

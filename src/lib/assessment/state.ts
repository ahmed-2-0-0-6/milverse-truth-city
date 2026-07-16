// MILVERSE — Pilot Assessment client state.
// Offline-capable: local mirror is source of truth; cloud sync is best-effort.

import type { ItemResponse, Metrics, CohortAttempt } from "./scoring";
import { scoreAttempt } from "./scoring";
import type { FormId } from "./items";

const LOCAL_KEY = "milverse.assessment.local.v1";
// Distinct namespace so the codename hash is stable across dev sessions.
const CODENAME_KEY = "milverse.pilot.codename";

export interface StoredAttempt {
  groupCode: string;
  codenameHash: string;
  phase: "intake" | "exit";
  form: FormId;
  items: ItemResponse[];
  metrics: Metrics;
  ts: number;
  synced: boolean;
}

/* ── codename (never exposed to server as plaintext) ───────── */

/** Reuses the pilot device id as an anonymous "codename". No PII. */
export function getCodename(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(CODENAME_KEY);
  if (id) return id;
  // Fall back to the existing pilot device id if present.
  const devKey = "milverse.pilot.device";
  id = localStorage.getItem(devKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(devKey, id);
  }
  localStorage.setItem(CODENAME_KEY, id);
  return id;
}

/** SHA-256 (hex, first 16 chars) of the codename — deterministic anon id. */
export async function hashCodename(codename: string): Promise<string> {
  const buf = new TextEncoder().encode(codename);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic form order from the codename hash (counterbalance). */
export function formOrder(hash: string): [FormId, FormId] {
  // First hex char parity → order.
  const parity = parseInt(hash.charAt(0), 16) % 2;
  return parity === 0 ? ["A", "B"] : ["B", "A"];
}

export function formForPhase(hash: string, phase: "intake" | "exit"): FormId {
  const [first, second] = formOrder(hash);
  return phase === "intake" ? first : second;
}

/* ── local mirror ──────────────────────────────────────────── */

export function loadLocal(): StoredAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as StoredAttempt[]) : [];
  } catch { return []; }
}

function saveLocal(list: StoredAttempt[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("milverse:assessment"));
}

/** Idempotent: one intake and one exit per (group, codenameHash) locally. */
export function hasAttempt(groupCode: string, hash: string, phase: "intake" | "exit"): boolean {
  return loadLocal().some((a) => a.groupCode === groupCode && a.codenameHash === hash && a.phase === phase);
}

export function recordAttempt(input: {
  groupCode: string;
  codenameHash: string;
  phase: "intake" | "exit";
  form: FormId;
  items: ItemResponse[];
}): StoredAttempt {
  const metrics = scoreAttempt(input.form, input.items);
  const rec: StoredAttempt = {
    ...input,
    metrics,
    ts: Date.now(),
    synced: false,
  };
  const list = loadLocal().filter(
    (a) => !(a.groupCode === rec.groupCode && a.codenameHash === rec.codenameHash && a.phase === rec.phase),
  );
  list.push(rec);
  saveLocal(list);
  // Kick off best-effort cloud sync.
  void syncPending();
  return rec;
}

export function myOwnAttempts(groupCode: string, hash: string): StoredAttempt[] {
  return loadLocal().filter((a) => a.groupCode === groupCode && a.codenameHash === hash);
}

export function toCohortAttempt(s: StoredAttempt): CohortAttempt {
  return {
    codenameHash: s.codenameHash,
    phase: s.phase,
    form: s.form,
    items: s.items,
    metrics: s.metrics,
    ts: s.ts,
  };
}

/* ── best-effort cloud sync ────────────────────────────────── */

let syncing = false;
export async function syncPending(): Promise<void> {
  if (typeof window === "undefined" || syncing) return;
  syncing = true;
  try {
    const { logAssessmentToCloud } = await import("@/lib/assessment.functions");
    const list = loadLocal();
    const pending = list.filter((a) => !a.synced);
    for (const a of pending) {
      try {
        await logAssessmentToCloud({
          data: {
            groupCode: a.groupCode,
            codenameHash: a.codenameHash,
            phase: a.phase,
            form: a.form,
            items: a.items,
            metrics: a.metrics,
          },
        });
        a.synced = true;
      } catch {
        // stay local; try again next call
      }
    }
    saveLocal(list);
  } finally {
    syncing = false;
  }
}

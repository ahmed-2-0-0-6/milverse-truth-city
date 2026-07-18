// MILVERSE — Cold Storage.
// One-module discipline for localStorage integrity: quarantine on corruption
// (never overwrite a repairable original), guarded writes with a bounded
// quota-reclaim of KNOWN-SAFE caches only, and a dev-visible integrity
// probe. Player records live under this discipline; sessionStorage sim
// keys guard-save only (losing a mid-case sim is acceptable).
//
// House law: localStorage-first. No IndexedDB, no compression, no deps.

/* ── SAFE-LIST ────────────────────────────────────────────────────────────
   Keys reclaim() may delete when the disk is full.
   Add caches here, never records.
   ──────────────────────────────────────────────────────────────────────── */
const SAFE_CACHE_KEYS: readonly string[] = [
  "milverse.handler.cache.v1", // per-day AI cache, replayable
];
const TAPES_KEY = "milverse.tapes.v1"; // FIFO luxury; drop oldest half if pressed

const QUARANTINE_SUFFIX = ".corrupt";
const QUARANTINE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30d

interface QuarantineRecord {
  ts: number;
  raw: string;
}

/* ── availability ────────────────────────────────────────────────────── */

function hasLocal(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function hasSession(): boolean {
  try {
    return typeof window !== "undefined" && !!window.sessionStorage;
  } catch {
    return false;
  }
}

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  // Browsers vary — name OR legacy code 22 OR Firefox 1014.
  const name = e.name;
  const code = (e as unknown as { code?: number }).code;
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014
  );
}

/* ── QUARANTINE ──────────────────────────────────────────────────────── */

function quarantine(key: string, raw: string) {
  if (!hasLocal()) return;
  const slot = `${key}${QUARANTINE_SUFFIX}`;
  try {
    // First corruption is the most recoverable — never overwrite.
    if (localStorage.getItem(slot) !== null) return;
    const rec: QuarantineRecord = { ts: Date.now(), raw };
    localStorage.setItem(slot, JSON.stringify(rec));
  } catch {
    /* if we can't even quarantine (quota / disabled), give up quietly */
  }
}

function readQuarantine(key: string): QuarantineRecord | null {
  if (!hasLocal()) return null;
  try {
    const raw = localStorage.getItem(`${key}${QUARANTINE_SUFFIX}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as QuarantineRecord).ts === "number" &&
      typeof (parsed as QuarantineRecord).raw === "string"
    ) {
      return parsed as QuarantineRecord;
    }
  } catch {
    /* discard malformed quarantine */
  }
  return null;
}

/* ── READ ────────────────────────────────────────────────────────────── */

/**
 * Read a persistent localStorage record.
 * Returns:
 *  - null       : SSR / storage disabled / missing
 *  - "corrupt"  : parse or validator failed (quarantine written if empty)
 *  - T          : parsed value
 */
export function readStore<T>(
  key: string,
  validate?: (v: unknown) => boolean,
): T | null | "corrupt" {
  if (!hasLocal()) return null;
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    quarantine(key, raw);
    // eslint-disable-next-line no-console
    console.warn(`[storage] quarantined unparseable record: ${key}`);
    return "corrupt";
  }
  if (validate && !validate(parsed)) {
    quarantine(key, raw);
    // eslint-disable-next-line no-console
    console.warn(`[storage] quarantined record failing validator: ${key}`);
    return "corrupt";
  }
  return parsed as T;
}

/**
 * Try to recover from `${key}.corrupt`. Returns the parsed value if the
 * quarantined copy parses (and passes the validator, if given); null
 * otherwise. Does NOT clear the quarantine slot — caller decides.
 */
export function recoverStore<T>(
  key: string,
  validate?: (v: unknown) => boolean,
): T | null {
  const q = readQuarantine(key);
  if (!q) return null;
  try {
    const parsed = JSON.parse(q.raw) as unknown;
    if (validate && !validate(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

/* ── WRITE (guarded) ─────────────────────────────────────────────────── */

/**
 * Guarded save. Never throws. Returns true on success. On quota, runs
 * reclaim() once and retries.
 */
export function writeStore(key: string, value: unknown): boolean {
  if (!hasLocal()) return false;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[storage] JSON.stringify failed for ${key}`, err);
    return false;
  }
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    if (!isQuotaError(err)) {
      // eslint-disable-next-line no-console
      console.warn(`[storage] write failed for ${key}`, err);
      return false;
    }
    // Reclaim then retry once.
    reclaim();
    try {
      localStorage.setItem(key, serialized);
      return true;
    } catch (err2) {
      // eslint-disable-next-line no-console
      console.warn(`[storage] quota exceeded, retry failed for ${key}`, err2);
      return false;
    }
  }
}

/**
 * Guarded sessionStorage save — same shape as writeStore, no quarantine
 * (sim keys are transient; losing a mid-case sim is acceptable).
 */
export function writeSession(key: string, value: unknown): boolean {
  if (!hasSession()) return false;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return false;
  }
  try {
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    if (!isQuotaError(err)) return false;
    // Best-effort: clear this key's stale copy and retry once.
    try {
      sessionStorage.removeItem(key);
      sessionStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
}

/* ── RECLAIM ─────────────────────────────────────────────────────────── */

/**
 * Free space WITHOUT touching player records. Order:
 *   1. Known-safe caches (SAFE_CACHE_KEYS).
 *   2. Stale quarantine slots older than 30 days.
 *   3. Oldest half of the tapes FIFO (replayable luxury).
 * NEVER touches profile / boss / firstphone / paper / manual / assessment /
 * pilot-outbox / retests / inbox / feedwall / badges / access keys.
 */
export function reclaim(): void {
  if (!hasLocal()) return;
  // 1) safe caches
  for (const k of SAFE_CACHE_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  }
  // 2) stale quarantines
  const now = Date.now();
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.endsWith(QUARANTINE_SUFFIX)) keys.push(k);
    }
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const rec = JSON.parse(raw) as QuarantineRecord;
        if (
          !rec ||
          typeof rec.ts !== "number" ||
          now - rec.ts > QUARANTINE_MAX_AGE_MS
        ) {
          localStorage.removeItem(k);
        }
      } catch {
        // unparseable quarantine slot older than "now" — best to drop
        try {
          localStorage.removeItem(k);
        } catch {
          /* noop */
        }
      }
    }
  } catch {
    /* noop */
  }
  // 3) tapes FIFO — oldest half
  try {
    const raw = localStorage.getItem(TAPES_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as unknown[];
      if (Array.isArray(arr) && arr.length > 1) {
        const keep = arr.slice(Math.floor(arr.length / 2));
        localStorage.setItem(TAPES_KEY, JSON.stringify(keep));
      }
    }
  } catch {
    /* noop */
  }
}

/* ── HEALTH ──────────────────────────────────────────────────────────── */

/**
 * DEV-visible integrity probe. Lists the persistent-record keys that
 * currently have a `.corrupt` quarantine slot on disk. No telemetry,
 * on-device only.
 */
export function storageHealth(): { quarantined: string[] } {
  if (!hasLocal()) return { quarantined: [] };
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.endsWith(QUARANTINE_SUFFIX)) {
        out.push(k.slice(0, -QUARANTINE_SUFFIX.length));
      }
    }
  } catch {
    /* noop */
  }
  return { quarantined: out.sort() };
}

// MILVERSE — Anonymous, aggregate telemetry.
// Fire-and-forget: events queue in memory, flush every 5s / 10 events / on unload.
// Zero content, zero identity — just event counts + tiny bucketed payloads.

export type TelemetryEventType =
  | "route_visit"
  | "session_end"
  | "js_error"
  | "case_start"
  | "case_complete"
  | "case_verdict_locked"
  | "drop_play"
  | "drop_break"
  | "tool_pick"
  | "manual_open"
  | "share_copy"
  | "lite_fallback"
  | "paper_section_done"
  | "pin_flag";

export interface TelemetryEvent {
  event_type: TelemetryEventType;
  route?: string;
  case_id?: string;
  session_id?: string;
  payload?: Record<string, string | number | boolean | null>;
  ts?: string; // ISO string added at flush time
}

const FLUSH_MS = 5000;
const MAX_QUEUE = 10;
const MAX_PAYLOAD_KEYS = 8;
const TELEMETRY_ENDPOINT = "/api/public/telemetry";

const queue: TelemetryEvent[] = [];
let timer: number | null = null;
let sessionId = "";

function ensureSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === "undefined") return "";
  try {
    let s = sessionStorage.getItem("milverse.tm.sid");
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem("milverse.tm.sid", s);
    }
    sessionId = s;
    return s;
  } catch {
    sessionId = crypto.randomUUID();
    return sessionId;
  }
}

/** Strip anything oversized or non-scalar from a payload. */
function sanitize(
  payload?: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  if (!payload) return {};
  const out: Record<string, string | number | boolean | null> = {};
  let i = 0;
  for (const [k, v] of Object.entries(payload)) {
    if (i >= MAX_PAYLOAD_KEYS) break;
    if (k.length > 40) continue;
    if (typeof v === "string") out[k] = v.slice(0, 120);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else if (v === null) out[k] = null;
    else continue;
    i++;
  }
  return out;
}

function scheduleFlush() {
  if (timer != null) return;
  if (typeof window === "undefined") return;
  timer = window.setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_MS);
}

async function postOnce(batch: TelemetryEvent[]): Promise<boolean> {
  try {
    const res = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
    return !!res && res.ok;
  } catch {
    return false;
  }
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  // Attempt 1; if it fails, ONE quick retry; if that fails, drop silently.
  // A failed telemetry POST must never throw into UI code.
  try {
    const ok = await postOnce(batch);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 400));
    await postOnce(batch); // ignore result — drop on second failure
  } catch {
    // Absolute belt-and-suspenders: telemetry never surfaces to callers.
  }
}

/** Beacon-based flush for `beforeunload` — uses a raw endpoint, not server-fn RPC. */
function beaconFlush(events: TelemetryEvent[]) {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  try {
    const body = new Blob([JSON.stringify({ events })], { type: "application/json" });
    return navigator.sendBeacon(TELEMETRY_ENDPOINT, body);
  } catch {
    return false;
  }
}

/** Public: log one anonymous event. Safe to call from anywhere. */
export function track(
  event_type: TelemetryEventType,
  input: { route?: string; case_id?: string; payload?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  const ev: TelemetryEvent = {
    event_type,
    route:
      input.route?.slice(0, 200) ??
      (window.location.pathname + window.location.search).slice(0, 200),
    case_id: input.case_id?.slice(0, 120),
    session_id: ensureSessionId(),
    payload: sanitize(input.payload),
    ts: new Date().toISOString(),
  };
  queue.push(ev);
  if (queue.length >= MAX_QUEUE) {
    void flush();
    return;
  }
  scheduleFlush();
}

/** Bucketing helpers so payloads stay coarse (no fingerprinting). */
export function bucketStake(stake: number): string {
  if (stake <= 5) return "0-5";
  if (stake <= 15) return "6-15";
  if (stake <= 30) return "16-30";
  if (stake <= 60) return "31-60";
  return "60+";
}
export function bucketStreak(streak: number): string {
  if (streak === 0) return "0";
  if (streak === 1) return "1";
  if (streak <= 3) return "2-3";
  if (streak <= 7) return "4-7";
  return "8+";
}
export function bucketDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 30) return "0-30s";
  if (s < 120) return "30-120s";
  if (s < 300) return "2-5m";
  if (s < 900) return "5-15m";
  return "15m+";
}

/** Install once at boot — flushes on unload, catches JS errors. */
let installed = false;
export function installTelemetry() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  ensureSessionId();

  const sessionStart = performance.now();
  // Both pagehide and beforeunload are registered for browser coverage, but
  // most browsers fire both — guard so session_end is queued exactly once.
  let leftAlready = false;
  const onLeave = () => {
    if (leftAlready) return;
    leftAlready = true;
    const dur = performance.now() - sessionStart;
    queue.push({
      event_type: "session_end",
      route: window.location.pathname,
      session_id: ensureSessionId(),
      payload: { bucket: bucketDuration(dur) },
      ts: new Date().toISOString(),
    });
    const events = queue.splice(0, queue.length);
    if (events.length === 0) return;
    if (!beaconFlush(events)) {
      // Best-effort — put them back for the async flush.
      queue.unshift(...events);
      void flush();
    }
  };
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);

  window.addEventListener("error", (e: ErrorEvent) => {
    track("js_error", {
      payload: {
        message: (e.message ?? "").slice(0, 200),
        source: (e.filename ?? "").slice(0, 120),
      },
    });
  });
  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "");
    track("js_error", { payload: { message: msg.slice(0, 200), kind: "unhandled_rejection" } });
  });
}

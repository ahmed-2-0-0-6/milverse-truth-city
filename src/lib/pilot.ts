// MILVERSE — Pilot Mode: local aggregation + fire-and-forget backend sync.
// Zero backend REQUIREMENT: everything still works offline. When a group code
// is active and the network is available, we also insert into pilot_entries
// so a real classroom on multiple devices aggregates on the dashboard.

export interface PilotEntry {
  wing: "mirror" | "feed";
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

export function loadPilotLog(code: string): PilotEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as PilotEntry[]) : [];
  } catch { return []; }
}

/** Fire-and-forget: always write to localStorage. If a group is active, also
 *  try to sync to the cloud so multi-device classrooms aggregate. Silent on failure. */
export function logPilotEntry(entry: PilotEntry) {
  if (typeof window === "undefined") return;
  const code = getActiveGroup();
  if (!code) return;
  const list = loadPilotLog(code);
  list.push(entry);
  localStorage.setItem(key(code), JSON.stringify(list));
  window.dispatchEvent(new Event("milverse:pilot"));

  // Fire-and-forget cloud sync — offline callers get local-only behavior.
  void (async () => {
    try {
      const { logPilotEntryToCloud } = await import("@/lib/pilot.functions");
      await logPilotEntryToCloud({
        data: {
          groupCode: code,
          deviceId: getDeviceId(),
          wing: entry.wing,
          caseId: entry.caseId,
          tier: entry.tier,
          result: entry.result,
          points: entry.points,
          probeStats: entry.probeStats,
        },
      });
    } catch {
      // silent — local log is source of truth if cloud is down
    }
  })();
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
  let calibration: "Calibrated" | "Too Trusting" | "Too Paranoid" | "Miscalibrated" | "Warming up" = "Warming up";
  if (total >= 3) {
    if (missRate < 0.2 && faRate < 0.2) calibration = "Calibrated";
    else if (missRate > 0.4 && faRate < 0.2) calibration = "Too Trusting";
    else if (faRate > 0.4 && missRate < 0.2) calibration = "Too Paranoid";
    else calibration = "Miscalibrated";
  }
  return { total, correct, missed, falseAlarm, lucky, missRate, faRate, calibration };
}

// MILVERSE — Pilot Mode: session/local group aggregation.
// Zero backend. Group code lives in localStorage; cases played while a group is
// active are also appended to a per-group log so a facilitator can open the
// dashboard on the same device (or paste an exported JSON blob from students).

export interface PilotEntry {
  wing: "mirror" | "feed";
  caseId: string;
  result: "correct" | "missed_scam" | "false_alarm" | "lucky_guess" | "pyrrhic";
  points: number;
  ts: number;
}

const ACTIVE_KEY = "milverse.pilot.active";

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

export function logPilotEntry(entry: PilotEntry) {
  if (typeof window === "undefined") return;
  const code = getActiveGroup();
  if (!code) return;
  const list = loadPilotLog(code);
  list.push(entry);
  localStorage.setItem(key(code), JSON.stringify(list));
  window.dispatchEvent(new Event("milverse:pilot"));
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

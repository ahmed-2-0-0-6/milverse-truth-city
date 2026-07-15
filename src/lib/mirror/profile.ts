// Local Trust Calibration profile — persisted in localStorage.
// No backend for now.

export interface TrustProfile {
  playerId: string;
  casesPlayed: number;
  correctVerdicts: number;
  luckyGuesses: number; // right verdict, weak reasoning
  missedScams: number; // fell for imposter
  falseAlarms: number; // rejected a real person
  strongProbesTotal: number;
  weakProbesTotal: number;
  wastedPressureTotal: number;
  points: number;
  history: {
    caseId: string;
    verdict: "REAL" | "FAKE";
    truth: "REAL" | "IMPOSTER";
    result: "correct" | "missed_scam" | "false_alarm" | "lucky_guess";
    points: number;
    ts: number;
  }[];
}

const KEY = "milverse.profile.v1";

function newProfile(): TrustProfile {
  return {
    playerId: crypto.randomUUID(),
    casesPlayed: 0,
    correctVerdicts: 0,
    luckyGuesses: 0,
    missedScams: 0,
    falseAlarms: 0,
    strongProbesTotal: 0,
    weakProbesTotal: 0,
    wastedPressureTotal: 0,
    points: 0,
    history: [],
  };
}

export function loadProfile(): TrustProfile {
  if (typeof window === "undefined") return newProfile();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const p = newProfile();
      localStorage.setItem(KEY, JSON.stringify(p));
      return p;
    }
    return JSON.parse(raw) as TrustProfile;
  } catch {
    return newProfile();
  }
}

export function saveProfile(p: TrustProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function calibrationLabel(p: TrustProfile): {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
} {
  const total = p.casesPlayed;
  if (total < 2) return { label: "Recruit", tone: "neutral" };
  const miss = p.missedScams / total;
  const fa = p.falseAlarms / total;
  if (miss < 0.2 && fa < 0.2) return { label: "Calibrated", tone: "good" };
  if (miss > 0.4 && fa < 0.2) return { label: "Too Trusting", tone: "warn" };
  if (fa > 0.4 && miss < 0.2) return { label: "Too Paranoid", tone: "warn" };
  return { label: "Miscalibrated", tone: "bad" };
}

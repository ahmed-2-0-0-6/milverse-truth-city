// MILVERSE — FIRST PHONE program state.
// Additive layer; own localStorage key. Never edits the trust profile schema.

import { readStore, recoverStore, writeStore } from "@/lib/storage";

// Owner: firstPhone/profile (FirstPhoneState). Bump the suffix on
// breaking shape change; readStore validators are the compatibility gate.
const KEY = "milverse.firstphone.v1";


export interface FirstPhoneState {
  active: boolean;
  kidCityName: string;
  familyCode: string | null; // parent-created code the kid joined
  lessonsCompleted: number[]; // e.g. [1,2,3]
  licenseIssuedAt: number | null;
  licenseNumber: string | null;
  /** ADDITIVE: index into WALLPAPERS (0-3). Chosen at handover. */
  wallpaper: number;
  /** ADDITIVE: once-per-child handover beat played? */
  handoverSeen: boolean;
  /** ADDITIVE: once-per-child guided phone tour played (or skipped)? */
  tourSeen: boolean;
  /** ADDITIVE: best consecutive-correct streak in the SPOT IT mini-game. */
  spotItBest: number;
}

function fresh(): FirstPhoneState {
  return {
    active: false,
    kidCityName: "",
    familyCode: null,
    lessonsCompleted: [],
    licenseIssuedAt: null,
    licenseNumber: null,
    wallpaper: 0,
    handoverSeen: false,
    tourSeen: false,
    spotItBest: 0,
  };
}

export function setSpotItBest(n: number) {
  const s = loadFirstPhone();
  if (n > s.spotItBest) {
    s.spotItBest = n;
    saveFirstPhone(s);
  }
}

export function setWallpaper(i: number) {
  const s = loadFirstPhone();
  s.wallpaper = i;
  saveFirstPhone(s);
}

export function markHandoverSeen() {
  const s = loadFirstPhone();
  s.handoverSeen = true;
  saveFirstPhone(s);
}

export function markTourSeen() {
  const s = loadFirstPhone();
  s.tourSeen = true;
  saveFirstPhone(s);
}

function isFirstPhoneShape(v: unknown): v is Partial<FirstPhoneState> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.lessonsCompleted !== undefined && !Array.isArray(o.lessonsCompleted)) return false;
  return true;
}

function mergeFirstPhone(parsed: Partial<FirstPhoneState>): FirstPhoneState {
  const merged: FirstPhoneState = { ...fresh(), ...parsed };
  // Silent migration: pre-existing profile with any lesson progress
  // never sees the tour (feature shipped after their first boot).
  if (parsed.tourSeen === undefined && (merged.lessonsCompleted?.length ?? 0) > 0) {
    merged.tourSeen = true;
  }
  return merged;
}

export function loadFirstPhone(): FirstPhoneState {
  if (typeof window === "undefined") return fresh();
  const read = readStore<Partial<FirstPhoneState>>(KEY, isFirstPhoneShape);
  if (read === "corrupt") {
    const rec = recoverStore<Partial<FirstPhoneState>>(KEY, isFirstPhoneShape);
    if (rec) return mergeFirstPhone(rec);
    return fresh();
  }
  if (read === null) return fresh();
  return mergeFirstPhone(read);
}

export function saveFirstPhone(s: FirstPhoneState): boolean {
  if (typeof window === "undefined") return false;
  const ok = writeStore(KEY, s);
  window.dispatchEvent(new Event("milverse:firstphone"));
  return ok;
}


export function setActive(active: boolean, kidCityName?: string) {
  const s = loadFirstPhone();
  s.active = active;
  if (kidCityName !== undefined) s.kidCityName = kidCityName;
  saveFirstPhone(s);
}

export function joinFamily(code: string) {
  const s = loadFirstPhone();
  s.familyCode = code.toUpperCase();
  saveFirstPhone(s);
}

export function markLessonComplete(n: number) {
  const s = loadFirstPhone();
  if (!s.lessonsCompleted.includes(n)) {
    s.lessonsCompleted = [...s.lessonsCompleted, n].sort((a, b) => a - b);
  }
  if (n === 10 && !s.licenseIssuedAt) {
    s.licenseIssuedAt = Date.now();
    // licenseNumber intentionally left null — issue mark is per-print, never stored.
    s.licenseNumber = null;
  }
  saveFirstPhone(s);
  // Bridge: also stamp the mapped Field Manual entry so the adult manual
  // records the same skill. Junior curriculum stays first-class; the manual
  // stays reachable read-only for kids.
  try {
    // Dynamic imports avoid circular init at module load.
    void import("./lessons").then(({ LESSONS }) => {
      const lesson = LESSONS.find((l) => l.n === n);
      if (!lesson) return;
      const tactics = new Set(lesson.cases.map((c) => c.tactic));
      void Promise.all([import("./tacticMap"), import("@/lib/manual/state")]).then(
        ([{ JUNIOR_TO_MANUAL }, { unlockTactic }]) => {
          tactics.forEach((t) => {
            const id = JUNIOR_TO_MANUAL[t];
            if (id) unlockTactic(id);
          });
        },
      );
    });
  } catch {
    /* SSR / storage-off — silent */
  }
  return s;
}

// generateLicenseNumber removed — issue mark is per-print (LicenseCard),
// not persisted on the profile. Kept null in state for schema compatibility.

export function isLessonUnlocked(state: FirstPhoneState, n: number): boolean {
  if (n === 1) return true;
  return state.lessonsCompleted.includes(n - 1);
}

// MILVERSE — FIRST PHONE program state.
// Additive layer; own localStorage key. Never edits the trust profile schema.

const KEY = "milverse.firstphone.v1";

export interface FirstPhoneState {
  active: boolean;
  kidCityName: string;
  familyCode: string | null;   // parent-created code the kid joined
  lessonsCompleted: number[];  // e.g. [1,2,3]
  licenseIssuedAt: number | null;
  licenseNumber: string | null;
}

function fresh(): FirstPhoneState {
  return {
    active: false,
    kidCityName: "",
    familyCode: null,
    lessonsCompleted: [],
    licenseIssuedAt: null,
    licenseNumber: null,
  };
}

export function loadFirstPhone(): FirstPhoneState {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    return { ...fresh(), ...(JSON.parse(raw) as Partial<FirstPhoneState>) };
  } catch { return fresh(); }
}

export function saveFirstPhone(s: FirstPhoneState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("milverse:firstphone"));
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
        }
      );
    });
  } catch { /* SSR / storage-off — silent */ }
  return s;
}

// generateLicenseNumber removed — issue mark is per-print (LicenseCard),
// not persisted on the profile. Kept null in state for schema compatibility.

export function isLessonUnlocked(state: FirstPhoneState, n: number): boolean {
  if (n === 1) return true;
  return state.lessonsCompleted.includes(n - 1);
}

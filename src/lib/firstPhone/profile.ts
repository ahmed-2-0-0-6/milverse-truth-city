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
    s.licenseNumber = generateLicenseNumber();
  }
  saveFirstPhone(s);
  return s;
}

function generateLicenseNumber(): string {
  const alpha = "ABCDEFGHJKMNPQRSTVWXYZ";
  const num = () => Math.floor(Math.random() * 10);
  return `${alpha[Math.floor(Math.random() * alpha.length)]}${alpha[Math.floor(Math.random() * alpha.length)]}-${num()}${num()}${num()}${num()}`;
}

export function isLessonUnlocked(state: FirstPhoneState, n: number): boolean {
  if (n === 1) return true;
  return state.lessonsCompleted.includes(n - 1);
}

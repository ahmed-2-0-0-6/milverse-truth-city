// MILVERSE — Your City · Daily Directives (Phase 3).
// Three deterministic-per-day micro-missions that reward BRICKS on completion.
// Auto-tracked via existing events: milverse:bricks, milverse:city:built,
// milverse:case:solved (if present). Missed days don't stack. No cloud.

import { readStore, writeStore } from "@/lib/storage";
import { creditBricks, loadCity, plotsBuilt } from "./citySave";

const KEY = "milverse.directives.v1";

export type DirectiveId =
  | "solve_two"
  | "build_one"
  | "spend_bricks"
  | "reach_bricks"
  | "upgrade_lv2";

export interface Directive {
  id: DirectiveId;
  label: string;
  detail: string;
  target: number;
  reward: number; // BRICKS
}

interface DailyState {
  v: 1;
  day: string; // YYYY-MM-DD (local)
  picks: DirectiveId[];
  progress: Record<string, number>;
  claimed: Record<string, boolean>;
}

const CATALOG: Directive[] = [
  { id: "solve_two",     label: "Two takedowns.",         detail: "Close two cases today.",           target: 2,   reward: 25 },
  { id: "build_one",     label: "Break ground.",          detail: "Build or upgrade one plot.",       target: 1,   reward: 20 },
  { id: "spend_bricks",  label: "Move the treasury.",     detail: "Spend 40 bricks on the city.",     target: 40,  reward: 15 },
  { id: "reach_bricks",  label: "Fill the crate.",        detail: "Earn 50 bricks today.",            target: 50,  reward: 20 },
  { id: "upgrade_lv2",   label: "Break the ribbon.",      detail: "Any building reaches Level 2+.",   target: 1,   reward: 30 },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function seedFor(day: string) {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) h = Math.imul(h ^ day.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pickForToday(day: string): DirectiveId[] {
  const rng = mulberry32(seedFor(day));
  const pool = CATALOG.map((d) => d.id);
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isValid(v: unknown): v is DailyState {
  if (!v || typeof v !== "object") return false;
  const s = v as DailyState;
  return s.v === 1 && typeof s.day === "string" && Array.isArray(s.picks) && !!s.progress && !!s.claimed;
}

export function loadDirectives(): DailyState {
  const today = todayKey();
  const raw = readStore<DailyState>(KEY, isValid);
  if (raw && raw !== "corrupt" && raw.day === today) return raw;
  const fresh: DailyState = { v: 1, day: today, picks: pickForToday(today), progress: {}, claimed: {} };
  writeStore(KEY, fresh);
  return fresh;
}

function persist(s: DailyState) {
  writeStore(KEY, s);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("milverse:directives"));
}

export function directiveDefs(state: DailyState): Directive[] {
  return state.picks.map((id) => CATALOG.find((d) => d.id === id)!).filter(Boolean);
}

export function progressOf(state: DailyState, id: DirectiveId, def: Directive): number {
  return Math.min(def.target, state.progress[id] ?? 0);
}

export function bump(id: DirectiveId, delta = 1) {
  const s = loadDirectives();
  if (!s.picks.includes(id)) return;
  s.progress[id] = (s.progress[id] ?? 0) + delta;
  persist(s);
}

/** Called when player spends bricks on a build. */
export function trackSpend(amount: number) {
  bump("spend_bricks", amount);
  bump("build_one", 1);
  // upgrade_lv2 checked via post-hoc scan of citySave
  const save = loadCity();
  const maxLvl = Math.max(0, ...Object.values(save.buildings).map((b) => b?.level ?? 0));
  if (maxLvl >= 2) {
    const s = loadDirectives();
    if (s.picks.includes("upgrade_lv2") && (s.progress.upgrade_lv2 ?? 0) < 1) {
      s.progress.upgrade_lv2 = 1;
      persist(s);
    }
  }
}

export function trackEarn(amount: number) {
  bump("reach_bricks", amount);
}

export function trackCaseSolved() {
  bump("solve_two", 1);
}

export function claim(id: DirectiveId): { ok: boolean; reward: number } {
  const s = loadDirectives();
  const def = CATALOG.find((d) => d.id === id);
  if (!def || !s.picks.includes(id)) return { ok: false, reward: 0 };
  if (s.claimed[id]) return { ok: false, reward: 0 };
  const prog = s.progress[id] ?? 0;
  if (prog < def.target) return { ok: false, reward: 0 };
  s.claimed[id] = true;
  persist(s);
  creditBricks(def.reward);
  return { ok: true, reward: def.reward };
}

/** Wire once at app boot. Idempotent per module load. */
let wired = false;
export function wireDirectiveListeners() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("milverse:bricks", (e: Event) => {
    const detail = (e as CustomEvent).detail as { amount?: number } | undefined;
    if (detail?.amount && detail.amount > 0) trackEarn(detail.amount);
  });
  window.addEventListener("milverse:case:solved", () => trackCaseSolved());
  // build_one/spend_bricks are wired via trackSpend at call site (BuildingCard).
  // Also detect completions when the citySave changes so retro-earn works.
  window.addEventListener("milverse:city:built", () => {
    const save = loadCity();
    if (plotsBuilt(save) >= 1) bump("build_one", 0); // no-op keeper
  });
}

// MILVERSE — Your City · Journal (Phase 3 upgrade).
// Capped ring buffer of city events. Presentation only — no gameplay hooks.
// Consumers push events; CityJournal.tsx renders them.

import { readStore, writeStore } from "@/lib/storage";

const KEY = "milverse.city.journal.v1";
const MAX = 20;

export type JournalKind =
  | "built"
  | "perk"
  | "directive"
  | "combo"
  | "promotion";

export interface JournalEntry {
  ts: number;
  kind: JournalKind;
  text: string;
}

interface Store { v: 1; entries: JournalEntry[] }

function isValid(v: unknown): v is Store {
  if (!v || typeof v !== "object") return false;
  const s = v as Store;
  return s.v === 1 && Array.isArray(s.entries);
}

export function loadJournal(): JournalEntry[] {
  const raw = readStore<Store>(KEY, isValid);
  if (raw && raw !== "corrupt") return raw.entries;
  return [];
}

export function pushJournal(kind: JournalKind, text: string) {
  const cur = loadJournal();
  const entries = [{ ts: Date.now(), kind, text }, ...cur].slice(0, MAX);
  writeStore(KEY, { v: 1, entries });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("milverse:journal"));
  }
}

let wired = false;
export function wireJournalListeners() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("milverse:city:built", (e: Event) => {
    const d = (e as CustomEvent).detail as { id?: string; level?: number } | undefined;
    if (!d) return;
    pushJournal("built", `${d.id} reaches Lv${d.level}.`);
  });
  window.addEventListener("milverse:perk:online", (e: Event) => {
    const d = (e as CustomEvent).detail as { label?: string } | undefined;
    if (!d?.label) return;
    pushJournal("perk", `Perk online: ${d.label}.`);
  });
  window.addEventListener("milverse:directive:claimed", (e: Event) => {
    const d = (e as CustomEvent).detail as { label?: string; reward?: number; combo?: number; streak?: number } | undefined;
    if (!d) return;
    if (d.combo) pushJournal("combo", `Combo bonus +${d.combo}. Streak: ${d.streak ?? 1}.`);
    else pushJournal("directive", `${d.label} · +${d.reward}.`);
  });
  window.addEventListener("milverse:title:promoted", (e: Event) => {
    const d = (e as CustomEvent).detail as { rank?: string } | undefined;
    if (!d?.rank) return;
    pushJournal("promotion", `Sworn in as ${d.rank}.`);
  });
}

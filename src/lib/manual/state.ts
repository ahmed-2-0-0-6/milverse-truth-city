// MILVERSE — Field Manual unlock state (localStorage, no backend).
import type { TacticId } from "./entries";

const KEY = "milverse.manual.v1";

export function loadUnlocked(): Set<TacticId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as TacticId[]);
  } catch {
    return new Set();
  }
}

export function unlockTactic(id: TacticId): boolean {
  if (typeof window === "undefined") return false;
  const cur = loadUnlocked();
  if (cur.has(id)) return false;
  cur.add(id);
  localStorage.setItem(KEY, JSON.stringify([...cur]));
  window.dispatchEvent(new Event("milverse:manual"));
  return true;
}

export function unlockCount(): number {
  return loadUnlocked().size;
}

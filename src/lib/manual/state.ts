// MILVERSE — Field Manual unlock state (localStorage, no backend).
import type { TacticId } from "./entries";
import { readStore, recoverStore, writeStore } from "@/lib/storage";

// Owner: manual/state (unlocked TacticId set). Bump the suffix on breaking
// shape change; readStore validators are the compatibility gate.
const KEY = "milverse.manual.v1";

function isTacticListShape(v: unknown): v is TacticId[] {
  return Array.isArray(v);
}

export function loadUnlocked(): Set<TacticId> {
  if (typeof window === "undefined") return new Set();
  const read = readStore<TacticId[]>(KEY, isTacticListShape);
  if (read === "corrupt") {
    const rec = recoverStore<TacticId[]>(KEY, isTacticListShape);
    if (rec) return new Set(rec);
    return new Set();
  }
  if (read === null) return new Set();
  return new Set(read);
}

export function unlockTactic(id: TacticId): boolean {
  if (typeof window === "undefined") return false;
  const cur = loadUnlocked();
  if (cur.has(id)) return false;
  cur.add(id);
  writeStore(KEY, [...cur]);
  window.dispatchEvent(new Event("milverse:manual"));
  return true;
}

export function unlockCount(): number {
  return loadUnlocked().size;
}

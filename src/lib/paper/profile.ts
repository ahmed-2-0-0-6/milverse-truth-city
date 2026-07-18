// THE DAILY MIRAGE — local per-profile edition tracking.
// Extends TrustProfile via a small side-store so we don't rev the profile
// schema. Marks whether the user played today's front page (counts as the
// daily play), and which sections they completed for the "READ COVER TO
// COVER" stamp.

import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { dropDateKey } from "@/lib/daily/rotation";
import { readStore, recoverStore, writeStore } from "@/lib/storage";

// Owner: paper/profile (PaperStore, per-edition records). Bump the suffix
// on breaking shape change; readStore validators are the compatibility gate.
const KEY = "milverse.paper.v1";

export type PaperSection = "lead" | "forgery" | "social" | "classified" | "puzzle";

export interface PaperEditionRecord {
  editionNumber: number;
  playedLeadAt: number | null;
  correct: boolean | null;
  sectionsDone: PaperSection[];
  coverToCoverAt: number | null;
  trustDelta: number;
}

interface PaperStore {
  editions: Record<number, PaperEditionRecord>;
}

function isPaperShape(v: unknown): v is Partial<PaperStore> {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.editions !== undefined && (typeof o.editions !== "object" || o.editions === null)) {
    return false;
  }
  return true;
}

function load(): PaperStore {
  if (typeof window === "undefined") return { editions: {} };
  const read = readStore<Partial<PaperStore>>(KEY, isPaperShape);
  if (read === "corrupt") {
    const rec = recoverStore<Partial<PaperStore>>(KEY, isPaperShape);
    if (rec) return { editions: {}, ...rec };
    return { editions: {} };
  }
  if (read === null) return { editions: {} };
  return { editions: {}, ...read };
}
function save(s: PaperStore): boolean {
  if (typeof window === "undefined") return false;
  const ok = writeStore(KEY, s);
  window.dispatchEvent(new Event("milverse:profile"));
  return ok;
}


function ensure(s: PaperStore, editionNumber: number): PaperEditionRecord {
  if (!s.editions[editionNumber]) {
    s.editions[editionNumber] = {
      editionNumber,
      playedLeadAt: null,
      correct: null,
      sectionsDone: [],
      coverToCoverAt: null,
      trustDelta: 0,
    };
  }
  return s.editions[editionNumber];
}

export function readEditionRecord(editionNumber: number): PaperEditionRecord {
  return ensure(load(), editionNumber);
}

export function markSectionDone(editionNumber: number, section: PaperSection): PaperEditionRecord {
  const s = load();
  const r = ensure(s, editionNumber);
  if (!r.sectionsDone.includes(section)) r.sectionsDone.push(section);
  if (!r.coverToCoverAt && r.sectionsDone.length >= 3) {
    r.coverToCoverAt = Date.now();
    // Small trust bonus for reading cover to cover.
    const p = loadProfile();
    p.trust = (p.trust ?? 100) + 15;
    r.trustDelta += 15;
    saveProfile(p);
  }
  save(s);
  return r;
}

/** Record the front-page play, counts as today's daily. Returns updated status. */
export function commitLeadPlay(input: {
  editionNumber: number;
  editionDateKey: string;
  caseId: string;
  verdict: "LEGIT" | "SCAM" | "MISLEADING";
  truth: "LEGIT" | "SCAM" | "MISLEADING";
  stake: number;
}): {
  correct: boolean;
  delta: number;
  newTrust: number;
  newStreak: number;
  record: PaperEditionRecord;
} | null {
  const s = load();
  const r = ensure(s, input.editionNumber);
  if (r.playedLeadAt) return null;
  const p = loadProfile();
  const today = dropDateKey();

  const clampedStake = Math.max(1, Math.min(input.stake, Math.max(1, p.trust ?? 100)));
  const correct = input.verdict === input.truth;
  const delta = correct ? clampedStake : -clampedStake;
  let newTrust = (p.trust ?? 100) + delta;
  if (newTrust <= 0) newTrust = 50; // city fronts you 50 (same rule as /drop)

  // Daily streak: only advances if edition date is today AND we haven't already
  // logged a daily play (either from /drop or a prior edition today).
  let newStreak = p.dailyStreak ?? 0;
  const alreadyDailyToday = p.dailyPlays?.some((d) => d.dateKey === today);
  if (input.editionDateKey === today && !alreadyDailyToday) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    newStreak = p.lastDailyDate === yesterday ? newStreak + 1 : 1;
    p.dailyStreak = newStreak;
    p.lastDailyDate = today;
    p.dailyPlays = [
      ...(p.dailyPlays ?? []),
      {
        dateKey: today,
        caseId: input.caseId,
        verdict: input.verdict,
        truth: input.truth,
        correct,
        stake: clampedStake,
        delta,
        probesUsed: 0,
        ts: Date.now(),
      },
    ];
  }

  p.trust = newTrust;
  saveProfile(p);

  r.playedLeadAt = Date.now();
  r.correct = correct;
  r.trustDelta += delta;
  if (!r.sectionsDone.includes("lead")) r.sectionsDone.push("lead");
  save(s);

  return { correct, delta, newTrust, newStreak, record: r };
}

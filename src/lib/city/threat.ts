// MILVERSE — Your City · THE SIREN.
// A deterministic pressure event: every hour a fictional scam wave rolls at
// one of your plots. Nothing here judges truth, calls a network, or invents
// content — the wave list is hand-authored and the target is a pure hash of
// the clock plus your own city. Presentation pressure only.

import { readStore, writeStore } from "@/lib/storage";
import { BUILDINGS_BY_ID, type BuildingId } from "./buildings";
import { levelOf, type CitySave } from "./citySave";

const KEY = "milverse.city.siren.v1";

export interface Wave {
  code: string; // radio-style call sign
  name: string;
  line: string; // what the wave is doing, in city-desk voice
  to: string; // where you go to answer it
  cta: string;
}

/** Hand-authored. Fictional tactics, never real brands or people. */
const WAVES: Wave[] = [
  {
    code: "10-31",
    name: "PARCEL RUN",
    line: "Delivery texts are hitting every phone on the block. Small fee, big lie.",
    to: "/mirror",
    cta: "TAKE THE CASE",
  },
  {
    code: "10-45",
    name: "VOICE ON THE LINE",
    line: "A cloned voice is calling relatives at 2am. Same script, different number.",
    to: "/boss",
    cta: "WORK THE CALL",
  },
  {
    code: "10-19",
    name: "OUTRAGE SPIKE",
    line: "A doctored clip is climbing the feed. It's angry and it's fast.",
    to: "/feed",
    cta: "READ THE FEED",
  },
  {
    code: "10-52",
    name: "EIDI HUSTLE",
    line: "Gift-money offers are landing on kids' phones. Warm, friendly, wrong.",
    to: "/first-phone",
    cta: "COVER THE KIDS",
  },
  {
    code: "10-33",
    name: "LOAD-SHEDDING BILL",
    line: "Fake disconnection notices. Pay in ten minutes or sit in the dark.",
    to: "/mirror",
    cta: "TAKE THE CASE",
  },
  {
    code: "10-27",
    name: "SEALED OFFER",
    line: "A job letter nobody applied for, with a fee attached at the bottom.",
    to: "/shift",
    cta: "RUN A SHIFT",
  },
];

function hash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/** The hour slot this incident belongs to. */
function slotOf(now: number): number {
  return Math.floor(now / 3_600_000);
}

export interface Incident {
  slot: number;
  wave: Wave;
  target: BuildingId | null;
  targetName: string;
  /** ms left before the wave lands. */
  msLeft: number;
  /** 0..1 — how far the clock has run. */
  urgency: boolean; // under 10 minutes
  held: boolean; // you answered it
}

interface SirenSave {
  v: 1;
  slot: number;
  held: boolean;
}

function isValid(v: unknown): v is SirenSave {
  const s = v as SirenSave;
  return !!s && typeof s === "object" && s.v === 1 && typeof s.slot === "number";
}

function read(): SirenSave {
  const raw = readStore<SirenSave>(KEY, isValid);
  if (raw && raw !== "corrupt") return raw;
  return { v: 1, slot: -1, held: false };
}

/** Mark the current wave as held — called when a case pays out. */
export function holdTheLine(now = Date.now()): void {
  const slot = slotOf(now);
  const cur = read();
  if (cur.slot === slot && cur.held) return;
  writeStore(KEY, { v: 1, slot, held: true });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("milverse:city:siren"));
  }
}

/** What's coming at the city right now. Null when the city is empty. */
export function readIncident(save: CitySave, now = Date.now()): Incident | null {
  const built = (Object.keys(BUILDINGS_BY_ID) as BuildingId[]).filter(
    (id) => levelOf(save, id) > 0,
  );
  if (built.length === 0) return null;

  const slot = slotOf(now);
  const h = hash(slot);
  const wave = WAVES[h % WAVES.length];
  const target = built[hash(h) % built.length] ?? null;
  const msLeft = (slot + 1) * 3_600_000 - now;
  const s = read();

  return {
    slot,
    wave,
    target,
    targetName: target ? BUILDINGS_BY_ID[target].name : "the city",
    msLeft,
    urgency: msLeft < 10 * 60_000,
    held: s.slot === slot && s.held,
  };
}

/** mm:ss for the countdown. */
export function clockText(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

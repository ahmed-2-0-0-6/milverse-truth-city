// MILVERSE — The Tape (local-only, never synced, never logged).
// Additive record of Mirror conversations for post-verdict annotated
// playback. Message bodies never leave the device. No telemetry.

import type { Message, VoicePayload } from "./engine";
import { readStore, recoverStore, writeStore } from "@/lib/storage";


/** Fields the tape renders. Everything else is stripped on save. */
export interface TapeMessage {
  role: "player" | "contact" | "system";
  kind?: "text" | "voice" | "system";
  text: string;
  ts: number;
  factId?: string;
  probeQuality?: "strong" | "weak" | "wasted";
  isTell?: boolean;
  tellExplanation?: string;
  voice?: VoicePayload;
}

export type TapeResult = "correct" | "missed_scam" | "false_alarm" | "lucky_guess";

export interface StoredTape {
  caseId: string;
  ts: number;
  result: TapeResult;
  messages: TapeMessage[];
}

// Owner: mirror/tapes (StoredTape FIFO, cap 10). Reclaim() may drop the
// oldest half when disk is full. Bump the suffix on breaking shape change.
const KEY = "milverse.tapes.v1";
const CAP = 10;


function strip(m: Message): TapeMessage {
  const out: TapeMessage = { role: m.role, text: m.text ?? "", ts: m.ts };
  if (m.kind) out.kind = m.kind;
  if (m.factId) out.factId = m.factId;
  if (m.probeQuality) out.probeQuality = m.probeQuality;
  if (m.isTell) out.isTell = true;
  if (m.tellExplanation) out.tellExplanation = m.tellExplanation;
  if (m.voice) {
    out.voice = {
      text: m.voice.text,
      artifact: m.voice.artifact,
      artifactPos: m.voice.artifactPos,
    };
  }
  return out;
}

function isTapeListShape(v: unknown): v is StoredTape[] {
  return Array.isArray(v);
}

export function readTapes(): StoredTape[] {
  if (typeof window === "undefined") return [];
  const read = readStore<StoredTape[]>(KEY, isTapeListShape);
  if (read === "corrupt") {
    const rec = recoverStore<StoredTape[]>(KEY, isTapeListShape);
    return rec ?? [];
  }
  return read ?? [];
}

export function saveTape(entry: {
  caseId: string;
  ts: number;
  result: TapeResult;
  messages: Message[];
}): void {
  if (typeof window === "undefined") return;
  const list = readTapes();
  // Dedupe by (caseId, ts) — guards double-save on re-render.
  if (list.some((t) => t.caseId === entry.caseId && t.ts === entry.ts)) return;
  const tape: StoredTape = {
    caseId: entry.caseId,
    ts: entry.ts,
    result: entry.result,
    messages: entry.messages.map(strip),
  };
  list.push(tape);
  // FIFO cap.
  while (list.length > CAP) list.shift();
  writeStore(KEY, list);
}


export function clearTapes(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function findTape(caseId: string, ts: number): StoredTape | null {
  return readTapes().find((t) => t.caseId === caseId && t.ts === ts) ?? null;
}

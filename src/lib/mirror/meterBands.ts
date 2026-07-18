// MILVERSE — Meter bands. Pure lookup, no engine changes.
// Text is deliberately verdict-neutral: it describes BOTH a scammer cracking
// and a real person fraying, and refuses to say which the player is in.

export type MeterBandKey = "steady" | "working" | "fraying" | "breaking" | "gone";

export interface MeterBand {
  key: MeterBandKey;
  label: string;
  note: string;
}

const STEADY: MeterBand = {
  key: "steady",
  label: "STEADY",
  note: "They're comfortable. Nothing you've said has cost them.",
};
const WORKING: MeterBand = {
  key: "working",
  label: "WORKING",
  note: "Your questions are landing. Whoever they are, they feel the weight now.",
};
const FRAYING: MeterBand = {
  key: "fraying",
  label: "FRAYING",
  note: "Under 50 the mask slips — if there is one. Real people just start getting hurt.",
};
const BREAKING: MeterBand = {
  key: "breaking",
  label: "BREAKING",
  note: "They're close to walking. A scammer walking is a win. A real person walking is a false alarm you caused.",
};
const GONE: MeterBand = {
  key: "gone",
  label: "GONE",
  note: "The line is dead.",
};

export function bandFor(meter: number): MeterBand {
  const m = Math.round(meter);
  if (m <= 0) return GONE;
  if (m < 40) return BREAKING;
  if (m < 50) return FRAYING;
  if (m < 70) return WORKING;
  return STEADY;
}

/* Feed dignity bands — same mechanism, different voice. */
export type DignityBandKey = "intact" | "bruised" | "wounded" | "burned";
export interface DignityBand {
  key: DignityBandKey;
  label: string;
  note: string;
}

const INTACT: DignityBand = {
  key: "intact",
  label: "INTACT",
  note: "You're checking the claim, not the person. Keep it that way.",
};
const BRUISED: DignityBand = {
  key: "bruised",
  label: "BRUISED",
  note: "Something you sent landed on them, not the forward. Verify harder, jab softer.",
};
const WOUNDED: DignityBand = {
  key: "wounded",
  label: "WOUNDED",
  note: "They stopped hearing your evidence a while ago. Repair costs more than being right.",
};
const BURNED: DignityBand = {
  key: "burned",
  label: "BURNED",
  note: "You won an argument and lost a person.",
};

export function dignityBandFor(dignity: number): DignityBand {
  const m = Math.round(dignity);
  if (m <= 0) return BURNED;
  if (m < 31) return WOUNDED;
  if (m < 61) return BRUISED;
  return INTACT;
}

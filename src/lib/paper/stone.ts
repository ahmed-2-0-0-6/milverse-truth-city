// THE STONE — pre-flight lint for the Pressroom.
// Deterministic. Pure. No AI. No network. Same content + date → same notes.
// The trade's word: on the stone, the page is checked before the plates cast.

import type { EditionContent } from "./types";
import { getFeedScenario } from "@/lib/feed/scenarios";
import { getManualEntry } from "@/lib/manual/entries";

export type StoneSeverity = "stop" | "advise" | "pass";

export interface StoneNote {
  id: string;
  severity: StoneSeverity;
  section: string;
  note: string;
}

// Editorial-voice fields only. Artifact fields (classified bodies,
// puzzle.clickbait, social.caption) are scam-voiced by design and EXEMPT.
const VOICE_FIELDS = [
  "lead.kicker",
  "lead.headline",
  "lead.subhead",
  "lead.columns",
  "editorial.fallback",
  "editorial.signoff",
  "ledger.note",
  "realWorld.lede",
] as const;

const BANNED_WORDS = ["empower", "seamless", "journey", "unlock"];
const BANNED_PHRASES = ["in today's digital age", "welcome to"];

function norm(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function tokens(s: string): string[] {
  return s.split(/\s+/).map(norm).filter(Boolean);
}

function multisetDiff(want: string[], have: string[]): { missing: string[]; extra: string[] } {
  const w = new Map<string, number>();
  const h = new Map<string, number>();
  for (const t of want) w.set(t, (w.get(t) ?? 0) + 1);
  for (const t of have) h.set(t, (h.get(t) ?? 0) + 1);
  const missing: string[] = [];
  const extra: string[] = [];
  for (const [k, n] of w) {
    const d = n - (h.get(k) ?? 0);
    for (let i = 0; i < d; i++) missing.push(k);
  }
  for (const [k, n] of h) {
    const d = n - (w.get(k) ?? 0);
    for (let i = 0; i < d; i++) extra.push(k);
  }
  return { missing, extra };
}

function voiceHits(text: string): { hits: string[] } {
  const hits: string[] = [];
  if (!text) return { hits };
  const low = text.toLowerCase();
  for (const w of BANNED_WORDS) {
    // word-boundary check
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(low)) hits.push(w);
  }
  for (const p of BANNED_PHRASES) {
    if (low.includes(p)) hits.push(p);
  }
  if (text.includes("!")) hits.push("!");
  return { hits };
}

export function stoneCheck(c: EditionContent, today: string = ""): StoneNote[] {
  const out: StoneNote[] = [];

  // 1 · STOP — case-ref
  const scen = c.lead.caseId ? getFeedScenario(c.lead.caseId) : undefined;
  if (!scen) {
    out.push({
      id: "case-ref",
      severity: "stop",
      section: "LEAD",
      note: `The lead's YOUR CALL points at case '${c.lead.caseId}' — no such file. Readers will hit a dead verdict.`,
    });
  } else {
    out.push({ id: "case-ref", severity: "pass", section: "LEAD", note: "Case file resolves." });
  }

  // 2 · STOP — flag-anchor
  let flagOk = true;
  c.classifieds.forEach((cl, i) => {
    const hay = `${cl.title}\n${cl.body}`;
    for (const f of cl.flags) {
      if (!f) continue;
      if (!hay.includes(f)) {
        flagOk = false;
        out.push({
          id: `flag-anchor:${i}:${f}`,
          severity: "stop",
          section: `CLASSIFIED ${i + 1}`,
          note: `Classified ${i + 1}: flag '${f}' doesn't appear in the copy — tap-to-find will never find it.`,
        });
      }
    }
  });
  if (flagOk && c.classifieds.length > 0) {
    out.push({
      id: "flag-anchor",
      severity: "pass",
      section: "CLASSIFIEDS",
      note: "Every flag lands on copy.",
    });
  }

  // 3 · ADVISE — autopsy-words (only for headline_autopsy)
  if (c.puzzle.kind === "headline_autopsy") {
    const want = tokens(c.puzzle.clickbait);
    const have = c.puzzle.words.map(norm).filter(Boolean);
    const { missing, extra } = multisetDiff(want, have);
    if (missing.length || extra.length) {
      const bits: string[] = [];
      if (missing.length) bits.push(`missing ${missing.join(", ")}`);
      if (extra.length) bits.push(`extra ${extra.join(", ")}`);
      out.push({
        id: "autopsy-words",
        severity: "advise",
        section: "PUZZLE",
        note: `The autopsy can't rebuild its own headline — ${bits.join("; ")} words.`,
      });
    } else {
      out.push({ id: "autopsy-words", severity: "pass", section: "PUZZLE", note: "Autopsy words reassemble." });
    }
  }

  // 4 · ADVISE — alt-law
  const altPairs: Array<[string, string]> = [
    ["forgery.imageAlt", c.forgery.imageAlt],
    ["social.imageAlt", c.social.imageAlt],
  ];
  for (const [field, val] of altPairs) {
    const v = (val ?? "").trim();
    if (!v) {
      out.push({
        id: `alt-law:${field}`,
        severity: "advise",
        section: "ALT",
        note: `Alt text is the transcript law in print. '${field}' is empty.`,
      });
    } else if (v.length < 15) {
      out.push({
        id: `alt-law:${field}`,
        severity: "advise",
        section: "ALT",
        note: `Alt text is the transcript law in print. '${field}' is thin.`,
      });
    } else {
      out.push({ id: `alt-law:${field}`, severity: "pass", section: "ALT", note: `'${field}' reads.` });
    }
  }

  // 5 · ADVISE — dead-link (shape only)
  {
    const href = (c.realWorld.linkHref ?? "").trim();
    const label = (c.realWorld.linkLabel ?? "").trim();
    let ok = false;
    if (href.startsWith("https://")) {
      try {
        new URL(href);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok || !label) {
      out.push({
        id: "dead-link",
        severity: "advise",
        section: "REAL WORLD",
        note: !ok
          ? "Link doesn't parse. The stone can't click it — you do that before publish."
          : "Link label is blank. The stone can't click it — you do that before publish.",
      });
    } else {
      out.push({
        id: "dead-link",
        severity: "pass",
        section: "REAL WORLD",
        note: "Link parses. The stone can't click it — you do that before publish.",
      });
    }
  }

  // 6 · ADVISE — tactic-refs
  const tacticRefs: Array<{ where: string; id?: string }> = [
    { where: "forgery", id: c.forgery.tacticId },
    { where: "social", id: c.social.tacticId },
    ...c.classifieds.map((cl, i) => ({ where: `classified ${i + 1}`, id: cl.tacticId })),
  ];
  for (const t of tacticRefs) {
    if (!t.id) continue;
    if (!getManualEntry(t.id)) {
      out.push({
        id: `tactic-refs:${t.where}:${t.id}`,
        severity: "advise",
        section: "TACTICS",
        note: `'${t.id}' isn't in the Field Manual — the debrief link will 404 the lesson.`,
      });
    }
  }

  // 7 · ADVISE — empty-columns
  const filledCols = c.lead.columns.filter((p) => p && p.trim()).length;
  if (filledCols < 2) {
    out.push({
      id: "empty-columns:lead",
      severity: "advise",
      section: "LEAD",
      note: "lead.columns is running blank.",
    });
  }
  const emptyMap: Array<[string, string]> = [
    ["editorial.fallback", c.editorial.fallback],
    ["editorial.signoff", c.editorial.signoff],
    ["puzzle.reveal", c.puzzle.reveal],
    ["social.reveal", c.social.reveal],
    ["forgery.provenance", c.forgery.provenance],
  ];
  for (const [k, v] of emptyMap) {
    if (!v || !v.trim()) {
      out.push({
        id: `empty-columns:${k}`,
        severity: "advise",
        section: k.split(".")[0].toUpperCase(),
        note: `${k} is running blank.`,
      });
    }
  }

  // 8 · ADVISE — voice-desk (editorial fields only)
  const voiceMap: Record<(typeof VOICE_FIELDS)[number], string> = {
    "lead.kicker": c.lead.kicker,
    "lead.headline": c.lead.headline,
    "lead.subhead": c.lead.subhead,
    "lead.columns": c.lead.columns.join("\n"),
    "editorial.fallback": c.editorial.fallback,
    "editorial.signoff": c.editorial.signoff,
    "ledger.note": c.ledger.note ?? "",
    "realWorld.lede": c.realWorld.lede,
  };
  for (const field of VOICE_FIELDS) {
    const { hits } = voiceHits(voiceMap[field]);
    for (const h of hits) {
      out.push({
        id: `voice-desk:${field}:${h}`,
        severity: "advise",
        section: "VOICE",
        note: `'${h}' in ${field} — the desk voice doesn't say that. (Artifact copy is exempt; this is editorial voice.)`,
      });
    }
  }

  // 9 · ADVISE — truth-spread
  if (c.forgery.truth === "AI" && c.social.truth === "FALSE") {
    out.push({
      id: "truth-spread",
      severity: "advise",
      section: "SPREAD",
      note: "Everything in this edition is fake. Readers who notice the pattern stop reading and start pattern-matching — drop one real thing in.",
    });
  }

  // 10 · ADVISE — eidetic-date lives in stoneCheckWithDate (needs edition_date,
  // which is on Edition, not EditionContent). The pure core stops here.

  return out;
}


// Convenience — pass edition_date so the eidetic-date rule can fire.
export function stoneCheckWithDate(
  c: EditionContent,
  editionDate: string,
  today: string,
): StoneNote[] {
  const notes = stoneCheck(c, today);
  if (
    editionDate &&
    today &&
    /^\d{4}-\d{2}-\d{2}$/.test(editionDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(today) &&
    editionDate < today
  ) {
    notes.push({
      id: "eidetic-date",
      severity: "advise",
      section: "DATE",
      note: `Edition dated ${editionDate}. Today is ${today}. The page is looking backward.`,
    });
  }
  return notes;
}

export function countStops(notes: StoneNote[]): number {
  return notes.filter((n) => n.severity === "stop").length;
}
export function countAdvisories(notes: StoneNote[]): number {
  return notes.filter((n) => n.severity === "advise").length;
}

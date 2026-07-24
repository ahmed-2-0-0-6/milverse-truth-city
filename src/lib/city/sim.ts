// MILVERSE — Your City · THE SIMULATION.
// Pure, deterministic derivation of "how the city is actually doing" from the
// save the player already earned. No RNG, no clocks, no side effects, no AI.
// This is presentation maths: it reads levels and reports consequences.
// It never grants bricks, never changes verdicts, never touches ground truth.

import type { CitySave } from "./citySave";
import { levelOf, plotsBuilt } from "./citySave";
import type { BuildingId } from "./buildings";
import { BUILDINGS_BY_ID, nextCost } from "./buildings";

export type MeterId =
  | "population"
  | "literacy"
  | "power"
  | "press"
  | "coverage"
  | "trust";

export interface Meter {
  id: MeterId;
  label: string;
  /** 0..100 */
  value: number;
  /** Short plain reading under the bar. */
  reading: string;
  /** Which building raises it fastest. */
  lever: BuildingId;
  tone: "good" | "warn" | "bad";
}

export interface Advisory {
  id: string;
  severity: "info" | "warn" | "alert";
  who: string; // in-world desk speaking
  line: string;
  lever?: BuildingId;
}

export interface SimReport {
  meters: Meter[];
  population: number;
  jobs: number;
  /** Wattage drawn vs. generated. >100 = load-shedding. */
  loadPct: number;
  /** 0..100 composite. The one number the city argues about. */
  trust: number;
  grade: "F" | "D" | "C" | "B" | "A" | "S";
  advisories: Advisory[];
  demand: { id: BuildingId; name: string; cost: number; why: string } | null;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function tone(v: number): Meter["tone"] {
  if (v >= 66) return "good";
  if (v >= 33) return "warn";
  return "bad";
}

/** Residents per level, per building. Opinions, tunable during pilot. */
const RESIDENTS: Record<BuildingId, number> = {
  outpost: 40,
  library: 120,
  school: 260,
  newsroom: 180,
  signal_tower: 90,
  archive: 140,
  clean_room: 70,
  watchtower: 60,
};

/** Watts drawn per level. The Outpost is the only generator (for now). */
const DRAW: Record<BuildingId, number> = {
  outpost: 0,
  library: 6,
  school: 9,
  newsroom: 11,
  signal_tower: 14,
  archive: 10,
  clean_room: 18,
  watchtower: 12,
};

function totalLevels(save: CitySave): number {
  return (Object.keys(BUILDINGS_BY_ID) as BuildingId[]).reduce(
    (n, id) => n + levelOf(save, id),
    0,
  );
}

export function simulate(save: CitySave): SimReport {
  const L = (id: BuildingId) => levelOf(save, id);

  // ── Population & jobs ────────────────────────────────────────────
  let population = 0;
  let draw = 0;
  (Object.keys(RESIDENTS) as BuildingId[]).forEach((id) => {
    const lv = L(id);
    population += RESIDENTS[id] * lv;
    draw += DRAW[id] * lv;
  });
  const jobs = Math.round(population * 0.42);

  // ── Power: the Outpost's generator, plus a small base grid ───────
  const supply = 20 + L("outpost") * 22;
  const loadPct = supply <= 0 ? 999 : Math.round((draw / supply) * 100);
  const power = clamp(loadPct === 0 ? 100 : 100 - Math.max(0, loadPct - 60));

  // ── Literacy: reading rooms and classrooms ───────────────────────
  const literacy = clamp((L("library") * 11 + L("school") * 13) * 1.4);

  // ── Press: the Newsroom, helped a little by the Archive ──────────
  const press = clamp(L("newsroom") * 16 + L("archive") * 5);

  // ── Coverage: how much of the city you can actually see ──────────
  const coverage = clamp(L("signal_tower") * 13 + L("watchtower") * 17 + L("clean_room") * 6);

  // ── Trust: the composite. Load-shedding drags everything down. ───
  const raw =
    literacy * 0.34 + press * 0.22 + coverage * 0.24 + power * 0.2;
  const trust = clamp(raw);

  const popMeter = clamp(Math.log10(Math.max(1, population)) * 26);

  const meters: Meter[] = [
    {
      id: "population",
      label: "POPULATION",
      value: popMeter,
      reading:
        population === 0
          ? "Nobody lives here yet."
          : `${population.toLocaleString()} residents · ${jobs.toLocaleString()} jobs.`,
      lever: "school",
      tone: tone(popMeter),
    },
    {
      id: "literacy",
      label: "MEDIA LITERACY",
      value: literacy,
      reading:
        literacy >= 66
          ? "People check before they forward."
          : literacy >= 33
            ? "Half the city still forwards first."
            : "The city believes what it's sent.",
      lever: L("school") <= L("library") ? "school" : "library",
      tone: tone(literacy),
    },
    {
      id: "power",
      label: "GRID LOAD",
      value: power,
      reading:
        loadPct <= 60
          ? `${loadPct}% draw. Lights hold.`
          : loadPct <= 100
            ? `${loadPct}% draw. Flicker at dusk.`
            : `${loadPct}% draw. Load-shedding.`,
      lever: "outpost",
      tone: tone(power),
    },
    {
      id: "press",
      label: "PRESS",
      value: press,
      reading:
        press >= 66
          ? "Corrections run same-day."
          : press >= 33
            ? "The Paper prints, late."
            : "No desk answers the rumours.",
      lever: "newsroom",
      tone: tone(press),
    },
    {
      id: "coverage",
      label: "SIGNAL COVERAGE",
      value: coverage,
      reading:
        coverage >= 66
          ? "You see the scam before it lands."
          : coverage >= 33
            ? "Patchy. Blind spots after dark."
            : "You hear about it after the money's gone.",
      lever: L("watchtower") > 0 ? "watchtower" : "signal_tower",
      tone: tone(coverage),
    },
    {
      id: "trust",
      label: "TRUST INDEX",
      value: trust,
      reading:
        trust >= 66
          ? "People answer unknown numbers carefully."
          : trust >= 33
            ? "Half suspicion, half hope. The worst mix."
            : "Everyone's either a mark or a paranoid.",
      lever: "library",
      tone: tone(trust),
    },
  ];

  // ── Advisories: the desks talk back ──────────────────────────────
  const advisories: Advisory[] = [];
  if (loadPct > 100) {
    advisories.push({
      id: "load",
      severity: "alert",
      who: "GRID DESK",
      line: "You're drawing more than you make. Raise the Outpost or the lights go out mid-case.",
      lever: "outpost",
    });
  } else if (loadPct > 80) {
    advisories.push({
      id: "load-warn",
      severity: "warn",
      who: "GRID DESK",
      line: "Draw is close to supply. One more wing and you're on generator hours.",
      lever: "outpost",
    });
  }
  if (literacy < 30 && plotsBuilt(save) >= 2) {
    advisories.push({
      id: "literacy",
      severity: "warn",
      who: "SCHOOL DESK",
      line: "Nobody's been taught to check. Build the School before you build the towers.",
      lever: "school",
    });
  }
  if (coverage > 60 && literacy < 40) {
    advisories.push({
      id: "surveil",
      severity: "warn",
      who: "CHARTER DESK",
      line: "You can see everything and teach nobody. That's a watchtower, not a city.",
      lever: "school",
    });
  }
  if (press === 0 && population > 400) {
    advisories.push({
      id: "press",
      severity: "info",
      who: "CITY DESK",
      line: "Four hundred people and no newsroom. Rumours run unopposed.",
      lever: "newsroom",
    });
  }
  if (trust >= 70) {
    advisories.push({
      id: "good",
      severity: "info",
      who: "CITY DESK",
      line: "Trust is holding. Keep the grid honest and it stays that way.",
    });
  }
  if (advisories.length === 0) {
    advisories.push({
      id: "quiet",
      severity: "info",
      who: "CITY DESK",
      line: "Quiet shift. Nothing on fire. Take the next case.",
    });
  }

  // ── Demand: the cheapest fix for the weakest meter ───────────────
  const weakest = [...meters]
    .filter((m) => m.id !== "population")
    .sort((a, b) => a.value - b.value)[0];
  let demand: SimReport["demand"] = null;
  if (weakest) {
    const id = weakest.lever;
    const cost = nextCost(id, L(id));
    if (cost !== null) {
      demand = {
        id,
        name: BUILDINGS_BY_ID[id].name,
        cost,
        why: `${weakest.label} is the city's weakest number.`,
      };
    }
  }

  const score = trust * 0.6 + Math.min(100, totalLevels(save) * 4) * 0.4;
  const grade: SimReport["grade"] =
    score >= 90 ? "S" : score >= 75 ? "A" : score >= 58 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "F";

  return { meters, population, jobs, loadPct, trust, grade, advisories, demand };
}

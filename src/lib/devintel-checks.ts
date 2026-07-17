// MILVERSE — Deterministic pre-flight checks. Runs client-side on demand.
// No AI. No network. Pure scans against the shipped catalog.

import { FEED_SCENARIOS } from "@/lib/feed/scenarios";
import {
  SCENARIOS as MIRROR_SCENARIOS,
  type Scenario as MirrorScenario,
} from "@/lib/mirror/scenarios";
import { MANUAL_ENTRIES } from "@/lib/manual/entries";

export type HeuristicStatus = "pass" | "warn" | "fail";
export interface HeuristicResult {
  id: string;
  label: string;
  detail: string;
  status: HeuristicStatus;
}

function todayUtc5(offset = 0): string {
  const d = new Date(Date.now() + offset * 86400000 + 5 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export function runHeuristicChecks(): HeuristicResult[] {
  const out: HeuristicResult[] = [];

  // ── FEED catalog integrity ────────────────────────────────────
  {
    const total = FEED_SCENARIOS.length;
    const missingTactic = FEED_SCENARIOS.filter((s) => !s.tacticId).map((s) => s.id);
    const missingTruthNote = FEED_SCENARIOS.filter(
      (s) => !s.truthNote || s.truthNote.length < 10,
    ).map((s) => s.id);
    const missingRespectful = FEED_SCENARIOS.filter(
      (s) => !s.respectfulScript || s.respectfulScript.length < 10,
    ).map((s) => s.id);

    out.push({
      id: "feed-tactic",
      label: `Every Feed case has a tactic mapping (${total - missingTactic.length}/${total})`,
      detail:
        missingTactic.length === 0
          ? "All feed cases mapped to a manual entry."
          : `Missing: ${missingTactic.slice(0, 5).join(", ")}${missingTactic.length > 5 ? "…" : ""}`,
      status: missingTactic.length === 0 ? "pass" : "warn",
    });
    out.push({
      id: "feed-truthnote",
      label: `Every Feed case has a dossier truth-note (${total - missingTruthNote.length}/${total})`,
      detail:
        missingTruthNote.length === 0
          ? "All cases have a dossier ground-truth explanation."
          : `Missing: ${missingTruthNote.slice(0, 5).join(", ")}`,
      status: missingTruthNote.length === 0 ? "pass" : "fail",
    });
    out.push({
      id: "feed-respectful",
      label: `Every Feed case has a respectful-response fallback (${total - missingRespectful.length}/${total})`,
      detail:
        missingRespectful.length === 0
          ? "All cases include a Zubaida-safe reply line."
          : `Missing: ${missingRespectful.slice(0, 5).join(", ")}`,
      status: missingRespectful.length === 0 ? "pass" : "warn",
    });

    // Tactic mappings resolve to a real manual entry
    const manualIds = new Set(MANUAL_ENTRIES.map((m) => m.id));
    const orphans = FEED_SCENARIOS.filter((s) => s.tacticId && !manualIds.has(s.tacticId)).map(
      (s) => s.id,
    );
    out.push({
      id: "feed-tactic-resolves",
      label: "Feed tactic ids resolve to a Field Manual entry",
      detail:
        orphans.length === 0
          ? "All tactic ids exist in the manual."
          : `Orphans: ${orphans.slice(0, 5).join(", ")}`,
      status: orphans.length === 0 ? "pass" : "fail",
    });
  }

  // ── MIRROR catalog integrity ──────────────────────────────────
  {
    const mirror = MIRROR_SCENARIOS;
    const total = mirror.length;
    const missingDossier = mirror
      .filter(
        (s) =>
          !s.dossier || !Array.isArray(s.dossier.knownFacts) || s.dossier.knownFacts.length === 0,
      )
      .map((s) => s.id);
    out.push({
      id: "mirror-dossier",
      label: `Every Mirror scenario has a dossier (${total - missingDossier.length}/${total})`,
      detail:
        missingDossier.length === 0
          ? "All mirror scenarios carry ground-truth facts."
          : `Missing dossier: ${missingDossier.slice(0, 5).join(", ")}`,
      status: missingDossier.length === 0 ? "pass" : "fail",
    });

    const missingPersona = mirror
      .filter((s) => !s.persona?.voice || !Array.isArray(s.persona.fillers))
      .map((s) => s.id);
    out.push({
      id: "mirror-persona",
      label: `Every Mirror scenario has a persona voice + fillers`,
      detail:
        missingPersona.length === 0
          ? "Persona voice present on all."
          : `Missing: ${missingPersona.slice(0, 5).join(", ")}`,
      status: missingPersona.length === 0 ? "pass" : "warn",
    });
  }

  // ── Manual coverage ───────────────────────────────────────────
  {
    const missingCounter = MANUAL_ENTRIES.filter(
      (e) => !e.counterMove || e.counterMove.length < 10,
    ).map((e) => e.id);
    out.push({
      id: "manual-counter",
      label: `Every manual entry has a counter-move`,
      detail:
        missingCounter.length === 0
          ? "All entries teach a real defensive move."
          : `Missing: ${missingCounter.join(", ")}`,
      status: missingCounter.length === 0 ? "pass" : "warn",
    });
  }

  // ── Daily Drop rollover ───────────────────────────────────────
  {
    const today = todayUtc5(0);
    const tomorrow = todayUtc5(1);
    const okDate =
      /^\d{4}-\d{2}-\d{2}$/.test(today) && /^\d{4}-\d{2}-\d{2}$/.test(tomorrow) && tomorrow > today;
    out.push({
      id: "drop-rollover",
      label: "Daily Drop rollover computes tomorrow's UTC+5 date",
      detail: okDate ? `today=${today} → tomorrow=${tomorrow}` : "Date computation failed.",
      status: okDate ? "pass" : "fail",
    });
  }

  // ── LITE mode + reduced motion ────────────────────────────────
  if (typeof window !== "undefined") {
    const lite = document.documentElement.dataset.visualQuality === "lite";
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    out.push({
      id: "lite-mode",
      label: "LITE mode + prefers-reduced-motion are queryable",
      detail: `data-visual-quality=${document.documentElement.dataset.visualQuality ?? "unset"} · reduced-motion=${reduced}`,
      status: "pass",
    });
    // Force a note when LITE is active — not a fail, just visibility.
    if (lite)
      out.push({
        id: "lite-active",
        label: "LITE mode is currently active",
        detail: "Auto-fallback triggered for this session.",
        status: "warn",
      });
  }

  // ── "coming soon" scan on shipped scenario catalog ────────────
  {
    const flagRe = /coming soon|todo:|placeholder/i;
    const feedHits = FEED_SCENARIOS.filter(
      (s) => flagRe.test(s.title) || flagRe.test(s.teaser) || flagRe.test(s.opener),
    ).map((s) => s.id);
    const mirrorHits = MIRROR_SCENARIOS.filter(
      (s) => flagRe.test(s.title) || flagRe.test(s.teaser) || flagRe.test(s.opener),
    ).map((s) => s.id);
    const total = feedHits.length + mirrorHits.length;
    out.push({
      id: "no-coming-soon",
      label: `No "coming soon" text in shipped cases`,
      detail:
        total === 0 ? "Clean." : `Feed: ${feedHits.join(", ")} · Mirror: ${mirrorHits.join(", ")}`,
      status: total === 0 ? "pass" : "warn",
    });
  }

  // ── Perf snapshot (deterministic proxy — nav timing) ──────────
  if (typeof performance !== "undefined" && typeof window !== "undefined") {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav) {
      const ttfb = Math.round(nav.responseStart - nav.startTime);
      const dcl = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      const status: HeuristicStatus = dcl < 2000 ? "pass" : dcl < 4000 ? "warn" : "fail";
      out.push({
        id: "perf",
        label: "Nav-timing perf snapshot",
        detail: `TTFB ${ttfb}ms · DOMContentLoaded ${dcl}ms`,
        status,
      });
    }
  }

  return out;
}

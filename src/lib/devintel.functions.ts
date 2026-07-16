// MILVERSE — /devintel server functions.
// - logTelemetryBatch: anon, whitelist-enforced batch insert.
// - fetchIntelligence: passcode-gated aggregate queries.
// - runAnalysisBrief: passcode-gated AI brief with deterministic fallback + cache.
// - listBriefs: passcode-gated last 10 briefs.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// ── Passcode gate (matches /review) ─────────────────────────────
function checkPasscode(passcode: string) {
  const expected = process.env.MILVERSE_REVIEW_PASSCODE;
  if (!expected) throw new Error("Review passcode is not configured on the server.");
  if (passcode !== expected) throw new Error("Invalid passcode.");
}

const WHITELIST = new Set([
  "route_visit","session_end","js_error",
  "case_start","case_complete",
  "drop_play","drop_break",
  "tool_pick","manual_open","share_copy",
  "lite_fallback",
]);

const EventSchema = z.object({
  event_type: z.string().max(40),
  route: z.string().max(200).optional(),
  case_id: z.string().max(120).optional(),
  session_id: z.string().max(64).optional(),
  payload: z.record(z.string().max(40), z.union([z.string().max(120), z.number(), z.boolean(), z.null()])).optional(),
  ts: z.string().max(40).optional(),
});

// Anonymous publishable client for the anon-facing batch insert.
function anonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const logTelemetryBatch = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      events: z.array(EventSchema).min(1).max(50),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const rows = data.events
      .filter((e) => WHITELIST.has(e.event_type))
      .slice(0, 50)
      .map((e) => ({
        event_type: e.event_type,
        route: e.route ?? null,
        case_id: e.case_id ?? null,
        session_id: e.session_id ?? null,
        payload: (e.payload ?? {}) as never,
      }));
    if (rows.length === 0) return { ok: true, count: 0 };
    const supabase = anonClient();
    const { error } = await supabase.from("telemetry_events").insert(rows);
    if (error) {
      // Silent — telemetry should never crash the app.
      console.error("[telemetry] insert failed:", error.message);
      return { ok: false, count: 0 };
    }
    return { ok: true, count: rows.length };
  });

// ── Admin: aggregate intelligence ────────────────────────────────
export const fetchIntelligence = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ passcode: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Pull the last-30-day window as one page (telemetry is small and coarse).
    const { data: rows, error } = await supabaseAdmin
      .from("telemetry_events")
      .select("event_type, route, case_id, session_id, payload, ts")
      .gte("ts", sinceISO)
      .order("ts", { ascending: false })
      .limit(20000);
    if (error) throw new Error(error.message);

    return summarize((rows ?? []) as unknown as TmRow[]);
  });

interface TmRow {
  event_type: string;
  route: string | null;
  case_id: string | null;
  session_id: string | null;
  payload: Record<string, unknown> | null;
  ts: string;
}

export interface IntelSummary {
  windowDays: number;
  totalEvents: number;
  sessions: number;
  routeVisits: Array<{ route: string; count: number }>;
  funnel: { landing: number; firstCase: number; day2Return: number };
  caseFunnel: Array<{ case_id: string; starts: number; completes: number; abandonRate: number; foolRate: number | null }>;
  hardestCases: Array<{ case_id: string; foolRate: number; plays: number }>;
  mostAbandoned: Array<{ case_id: string; abandonRate: number; starts: number }>;
  wager: { buckets: Record<string, number>; correctByBucket: Record<string, number> };
  dropRetention: Array<{ day: string; players: number }>;
  toolPicks: Array<{ tool: string; picks: number; correctRate: number | null }>;
  manualOpens: Array<{ entry: string; count: number }>;
  shareCopies: number;
  liteFallbacks: number;
  errors: Array<{ message: string; count: number; sample_route: string | null }>;
  deadZones: Array<{ route: string; reason: string }>;
}

const KNOWN_ROUTES = [
  "/", "/mirror", "/feed", "/drop", "/studio", "/archive", "/manual",
  "/profile", "/kit", "/pilot", "/quick-tour", "/city-hall", "/educators",
  "/market", "/arena",
];

function summarize(rows: TmRow[]): IntelSummary {
  const sessions = new Set<string>();
  const routeVisitsMap = new Map<string, number>();
  const caseStarts = new Map<string, number>();
  const caseCompletes = new Map<string, number>();
  const caseFools = new Map<string, { plays: number; wrong: number }>();
  const wagerBuckets: Record<string, number> = {};
  const wagerCorrectByBucket: Record<string, number> = {};
  const dropDays = new Map<string, Set<string>>();
  const toolPicks = new Map<string, { picks: number; correct: number; hasCorrect: number }>();
  const manualOpens = new Map<string, number>();
  const errorMap = new Map<string, { count: number; sample_route: string | null }>();
  const firstCaseSessions = new Set<string>();
  const landingSessions = new Set<string>();
  const activeDays = new Map<string, Set<string>>();
  let shareCopies = 0;
  let liteFallbacks = 0;

  for (const r of rows) {
    if (r.session_id) sessions.add(r.session_id);
    const day = r.ts.slice(0, 10);
    if (r.session_id) {
      const set = activeDays.get(r.session_id) ?? new Set<string>();
      set.add(day);
      activeDays.set(r.session_id, set);
    }

    switch (r.event_type) {
      case "route_visit": {
        const rt = normalizeRoute(r.route);
        routeVisitsMap.set(rt, (routeVisitsMap.get(rt) ?? 0) + 1);
        if (rt === "/" && r.session_id) landingSessions.add(r.session_id);
        break;
      }
      case "case_start": {
        if (r.case_id) caseStarts.set(r.case_id, (caseStarts.get(r.case_id) ?? 0) + 1);
        if (r.session_id) firstCaseSessions.add(r.session_id);
        break;
      }
      case "case_complete": {
        if (r.case_id) {
          caseCompletes.set(r.case_id, (caseCompletes.get(r.case_id) ?? 0) + 1);
          const correct = (r.payload as { correct?: boolean } | null)?.correct;
          const bucket = caseFools.get(r.case_id) ?? { plays: 0, wrong: 0 };
          bucket.plays++;
          if (correct === false) bucket.wrong++;
          caseFools.set(r.case_id, bucket);
        }
        break;
      }
      case "drop_play": {
        const p = (r.payload ?? {}) as { stake_bucket?: string; correct?: boolean };
        if (p.stake_bucket) {
          wagerBuckets[p.stake_bucket] = (wagerBuckets[p.stake_bucket] ?? 0) + 1;
          if (p.correct) wagerCorrectByBucket[p.stake_bucket] = (wagerCorrectByBucket[p.stake_bucket] ?? 0) + 1;
        }
        if (r.session_id) {
          const set = dropDays.get(day) ?? new Set<string>();
          set.add(r.session_id);
          dropDays.set(day, set);
        }
        break;
      }
      case "tool_pick": {
        const p = (r.payload ?? {}) as { tool?: string; correct?: boolean };
        const key = p.tool ?? "unknown";
        const b = toolPicks.get(key) ?? { picks: 0, correct: 0, hasCorrect: 0 };
        b.picks++;
        if (typeof p.correct === "boolean") { b.hasCorrect++; if (p.correct) b.correct++; }
        toolPicks.set(key, b);
        break;
      }
      case "manual_open": {
        const p = (r.payload ?? {}) as { entry?: string };
        const k = p.entry ?? "unknown";
        manualOpens.set(k, (manualOpens.get(k) ?? 0) + 1);
        break;
      }
      case "share_copy": shareCopies++; break;
      case "lite_fallback": liteFallbacks++; break;
      case "js_error": {
        const p = (r.payload ?? {}) as { message?: string };
        const msg = (p.message ?? "unknown").slice(0, 160);
        const e = errorMap.get(msg) ?? { count: 0, sample_route: r.route };
        e.count++;
        errorMap.set(msg, e);
        break;
      }
    }
  }

  // Funnel
  const day2Return = Array.from(activeDays.values()).filter((s) => s.size >= 2).length;
  const funnel = { landing: landingSessions.size, firstCase: firstCaseSessions.size, day2Return };

  const routeVisits = Array.from(routeVisitsMap.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const caseFunnel = Array.from(caseStarts.entries()).map(([case_id, starts]) => {
    const completes = caseCompletes.get(case_id) ?? 0;
    const fool = caseFools.get(case_id);
    return {
      case_id,
      starts,
      completes,
      abandonRate: starts > 0 ? 1 - completes / starts : 0,
      foolRate: fool && fool.plays > 0 ? fool.wrong / fool.plays : null,
    };
  }).sort((a, b) => b.starts - a.starts);

  const hardestCases = caseFunnel
    .filter((c) => c.foolRate != null && c.completes >= 3)
    .sort((a, b) => (b.foolRate ?? 0) - (a.foolRate ?? 0))
    .slice(0, 5)
    .map((c) => ({ case_id: c.case_id, foolRate: c.foolRate ?? 0, plays: c.completes }));

  const mostAbandoned = caseFunnel
    .filter((c) => c.starts >= 5)
    .sort((a, b) => b.abandonRate - a.abandonRate)
    .slice(0, 5)
    .map((c) => ({ case_id: c.case_id, abandonRate: c.abandonRate, starts: c.starts }));

  const dropRetention = Array.from(dropDays.entries())
    .map(([day, s]) => ({ day, players: s.size }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-14);

  const toolPicksArr = Array.from(toolPicks.entries()).map(([tool, b]) => ({
    tool, picks: b.picks,
    correctRate: b.hasCorrect > 0 ? b.correct / b.hasCorrect : null,
  })).sort((a, b) => b.picks - a.picks);

  const manualOpensArr = Array.from(manualOpens.entries())
    .map(([entry, count]) => ({ entry, count }))
    .sort((a, b) => b.count - a.count).slice(0, 20);

  const errors = Array.from(errorMap.entries())
    .map(([message, v]) => ({ message, count: v.count, sample_route: v.sample_route }))
    .sort((a, b) => b.count - a.count).slice(0, 15);

  // Dead zones: known routes with 0 or very few visits.
  const routeCountLookup = new Map(routeVisits.map((r) => [r.route, r.count]));
  const totalRouteVisits = routeVisits.reduce((s, r) => s + r.count, 0) || 1;
  const deadZones: IntelSummary["deadZones"] = [];
  for (const r of KNOWN_ROUTES) {
    const c = routeCountLookup.get(r) ?? 0;
    if (c === 0) deadZones.push({ route: r, reason: "0 visits in window" });
    else if (c / totalRouteVisits < 0.005) deadZones.push({ route: r, reason: `${c} visits (<0.5% of traffic)` });
  }

  return {
    windowDays: 30,
    totalEvents: rows.length,
    sessions: sessions.size,
    routeVisits,
    funnel,
    caseFunnel: caseFunnel.slice(0, 40),
    hardestCases,
    mostAbandoned,
    wager: { buckets: wagerBuckets, correctByBucket: wagerCorrectByBucket },
    dropRetention,
    toolPicks: toolPicksArr,
    manualOpens: manualOpensArr,
    shareCopies,
    liteFallbacks,
    errors,
    deadZones,
  };
}

function normalizeRoute(r: string | null): string {
  if (!r) return "(none)";
  const path = r.split("?")[0];
  // Collapse dynamic segments: /feed/xyz → /feed/*, /manual/x → /manual/*
  return path
    .replace(/^\/feed\/[^/]+/, "/feed/*")
    .replace(/^\/mirror\/[^/]+/, "/mirror/*")
    .replace(/^\/manual\/[^/]+/, "/manual/*");
}

// ── AI improvement brief ─────────────────────────────────────────

export interface BriefItem {
  problem: string;
  evidence: string;
  hypothesis: string;
  prompt: string;
}
export interface Brief {
  headline: string;
  items: BriefItem[];
}

function deterministicBrief(sum: IntelSummary): Brief {
  const items: BriefItem[] = [];

  if (sum.mostAbandoned[0]) {
    const c = sum.mostAbandoned[0];
    items.push({
      problem: `Case '${c.case_id}' has a ${(c.abandonRate * 100).toFixed(0)}% abandon rate`,
      evidence: `${c.starts} starts, only ${Math.round(c.starts * (1 - c.abandonRate))} completes over the last 30 days.`,
      hypothesis: "Difficulty spike, unclear dossier, or brief screen too long. Players quit before verdict.",
      prompt: wrapPrompt(
        `Investigate case '${c.case_id}': ${(c.abandonRate * 100).toFixed(0)}% of players abandon it after starting. Shorten the brief screen, ` +
        `re-check dossier clarity, and verify the toolbelt evidence lines are unambiguous. Keep the tactic/format unchanged.`,
      ),
    });
  }
  if (sum.hardestCases[0]) {
    const c = sum.hardestCases[0];
    items.push({
      problem: `Case '${c.case_id}' fools ${(c.foolRate * 100).toFixed(0)}% of players`,
      evidence: `${c.plays} completions, ${(c.foolRate * 100).toFixed(0)}% wrong calls.`,
      hypothesis: "Either the case is a great teaching moment or the ground-truth is misleading. Verify dossier is unambiguous.",
      prompt: wrapPrompt(
        `Audit case '${c.case_id}'. ${(c.foolRate * 100).toFixed(0)}% of players get it wrong. ` +
        `Verify the dossier ground truth is unambiguous, that at least one toolbelt tool returns a strong probe, ` +
        `and that the tactic mapping matches the artifact. Do not weaken the case if the difficulty is intentional.`,
      ),
    });
  }
  if (sum.deadZones.length > 0) {
    const z = sum.deadZones[0];
    items.push({
      problem: `Route '${z.route}' is a dead zone`,
      evidence: z.reason,
      hypothesis: "Feature is either undiscoverable from nav, or shipped but not yet linked from key surfaces.",
      prompt: wrapPrompt(
        `Route '${z.route}' has almost no traffic (${z.reason}). Add a discovery affordance from the landing / TopBar / footer ` +
        `so players know it exists. Do not change the feature itself. If the route is a placeholder, add a clear "coming soon" beat instead of removing it.`,
      ),
    });
  }
  if (items.length === 0) {
    items.push({
      problem: "Not enough traffic yet to surface a specific problem",
      evidence: `${sum.sessions} sessions, ${sum.totalEvents} events in ${sum.windowDays} days.`,
      hypothesis: "Increase reach so telemetry can produce meaningful signal.",
      prompt: wrapPrompt("Add a share prompt after Daily Drop completion so players invite one friend to try today's case."),
    });
  }

  const headline = `Deterministic brief — ${sum.sessions} sessions over ${sum.windowDays}d.`;
  return { headline, items };
}

function wrapPrompt(inner: string): string {
  return `GUARD: Dossier ground-truth stays the source of truth. Do not break Mirror, Feed, Studio, Daily Drop, scoring, pilot mode, or share codes. Player always judges truth; AI never declares it.\n\nTASK: ${inner}\n\nSELF-AUDIT: confirm nothing above is regressed; list the exact files changed and why.`;
}

const RUN_ANALYSIS_MIN_INTERVAL_MS = 60 * 1000; // no accidental double-clicks

export const runAnalysisBrief = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ passcode: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate-limit: refuse if a brief was generated in the last minute.
    const { data: recent } = await supabaseAdmin
      .from("devintel_briefs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    const lastTs = recent?.[0]?.created_at ? new Date(recent[0].created_at).getTime() : 0;
    if (Date.now() - lastTs < RUN_ANALYSIS_MIN_INTERVAL_MS) {
      throw new Error("Wait a minute before running analysis again.");
    }

    // Pull aggregate summary via server context — same summarize() pipeline.
    const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("telemetry_events")
      .select("event_type, route, case_id, session_id, payload, ts")
      .gte("ts", sinceISO)
      .order("ts", { ascending: false })
      .limit(20000);
    const sum = summarize((rows ?? []) as unknown as TmRow[]);

    const fallback = deterministicBrief(sum);
    let brief: Brief = fallback;
    let source: "ai" | "fallback" = "fallback";

    const key = process.env.LOVABLE_API_KEY;
    if (key) {
      try {
        const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
        const { generateText } = await import("ai");
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const compact = {
          windowDays: sum.windowDays, sessions: sum.sessions, totalEvents: sum.totalEvents,
          funnel: sum.funnel,
          topRoutes: sum.routeVisits.slice(0, 12),
          hardestCases: sum.hardestCases,
          mostAbandoned: sum.mostAbandoned,
          wager: sum.wager,
          dropRetention: sum.dropRetention,
          toolPicks: sum.toolPicks,
          shareCopies: sum.shareCopies, liteFallbacks: sum.liteFallbacks,
          deadZones: sum.deadZones,
          topErrors: sum.errors.slice(0, 5),
        };
        const sys = [
          "You are the MILVERSE INTELLIGENCE DESK. You read anonymous aggregate telemetry from a media-literacy training simulator and write short improvement briefs for the developer.",
          "You NEVER see user content or identity — only counts, buckets, and case ids. Do not invent data beyond what the JSON shows.",
          "Return STRICT JSON: {\"headline\": string, \"items\": [{\"problem\": string, \"evidence\": string, \"hypothesis\": string, \"prompt\": string}]} — max 3 items.",
          "Each `prompt` must be a ready-to-paste Lovable prompt wrapped in this exact frame:",
          "GUARD: Dossier ground-truth stays the source of truth. Do not break Mirror, Feed, Studio, Daily Drop, scoring, pilot mode, or share codes. Player always judges truth; AI never declares it.\\n\\nTASK: <specific fix>\\n\\nSELF-AUDIT: confirm nothing above is regressed; list the exact files changed and why.",
          "Do not recommend adding features that make the AI judge truth. Never suggest self-modifying code.",
        ].join("\n");
        const res = await generateText({
          model,
          system: sys,
          prompt: `Aggregate stats JSON:\n${JSON.stringify(compact, null, 2)}\n\nReturn ONLY the JSON object described above. No markdown fence, no prose.`,
        });
        const parsed = safeParseBrief(res.text ?? "");
        if (parsed) { brief = parsed; source = "ai"; }
      } catch (err) {
        console.error("[devintel] AI brief failed:", err);
      }
    }

    // Cache the brief with the stats snapshot.
    const { data: inserted } = await supabaseAdmin
      .from("devintel_briefs")
      .insert({ stats: sum as never, brief: brief as never, source })
      .select("id, created_at")
      .single();

    // Trim to last 10.
    const { data: all } = await supabaseAdmin
      .from("devintel_briefs")
      .select("id, created_at")
      .order("created_at", { ascending: false });
    if (all && all.length > 10) {
      const toDelete = all.slice(10).map((r) => r.id);
      await supabaseAdmin.from("devintel_briefs").delete().in("id", toDelete);
    }

    return { brief, source, id: inserted?.id ?? null, created_at: inserted?.created_at ?? null };
  });

function safeParseBrief(text: string): Brief | null {
  try {
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first < 0 || last < 0) return null;
    const obj = JSON.parse(cleaned.slice(first, last + 1)) as Brief;
    if (!obj || typeof obj.headline !== "string" || !Array.isArray(obj.items)) return null;
    obj.items = obj.items.slice(0, 3).map((it) => ({
      problem: String(it.problem ?? "").slice(0, 200),
      evidence: String(it.evidence ?? "").slice(0, 400),
      hypothesis: String(it.hypothesis ?? "").slice(0, 400),
      prompt: String(it.prompt ?? "").slice(0, 2000),
    }));
    return obj;
  } catch { return null; }
}

export const listBriefs = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ passcode: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("devintel_briefs")
      .select("id, created_at, brief, source")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

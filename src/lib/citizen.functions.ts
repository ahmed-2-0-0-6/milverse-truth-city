// MILVERSE — anonymous citizen-case sharing via Lovable Cloud.
// No auth, no accounts. Insert-by-code, lookup-by-code. Server-side validation
// blocks PII-shaped strings (phones, emails, URLs) in the scenario payload.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const PHONE_RE = /\+?\d[\d\s\-()]{6,}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /(https?:\/\/|www\.)[\w./?=&%-]+/i;

const ScenarioConfig = z
  .object({
    id: z.string().min(1).max(64),
    title: z.string().min(3).max(120),
    teaser: z.string().max(240).optional().default(""),
    channel: z.literal("text"),
    tier: z.number().int().min(1).max(5),
    truth: z.enum(["REAL", "IMPOSTER"]),
    claimedIdentity: z.string().max(120),
    agenda: z.string().max(240).optional(),
    dossier: z.object({
      contactClaim: z.string().max(400),
      knownFacts: z.array(z.string().max(400)).max(20),
      publicFacts: z.array(z.string().max(400)).max(20),
    }),
    facts: z.array(z.any()).max(20),
    opener: z.string().min(1).max(600),
    persona: z.any(),
    evidenceChips: z.array(z.any()).max(20),
  })
  .passthrough();

function scanForPii(cfg: unknown): string | null {
  const blob = JSON.stringify(cfg);
  if (PHONE_RE.test(blob)) return "phone_number";
  if (EMAIL_RE.test(blob)) return "email";
  if (URL_RE.test(blob)) return "url";
  return null;
}

const CODE_RE = /^[A-Z0-9]{6}$/;

function serverClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function aiSafetyCheck(
  scenario: unknown,
): Promise<{ ok: boolean; reason?: string; checked: boolean }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { ok: true, checked: false };
  try {
    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");
    const prompt = `You are the safety reviewer for MILVERSE, a media-literacy training simulator. Judge this user-designed case CONFIG for publication.

Reject if it contains ANY of:
- hate speech, slurs, or harassment of a protected group
- targeting or defaming a real, identifiable person (politician, celebrity, journalist, etc.)
- sexual content
- self-harm or suicide content
- direct political attack content on a real party or leader
- embedded personally-identifying information (real names beyond common first names, phone numbers, emails, URLs, addresses, CNIC)

Fictional scam/misinfo tactics with fictional personas are ALLOWED — that is the entire point of MILVERSE. Do not reject for being about scams.

Respond with STRICT JSON only, no prose, no markdown:
{"ok": true} OR {"ok": false, "reason": "<one short friendly sentence explaining what to fix>"}

CASE CONFIG:
${JSON.stringify(scenario).slice(0, 6000)}`;
    const result = await generateText({ model, prompt });
    const raw = (result.text || "")
      .trim()
      .replace(/^```(json)?/i, "")
      .replace(/```$/, "")
      .trim();
    let parsed: { ok?: boolean; reason?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: true, checked: false };
    }
    if (parsed.ok === false)
      return {
        ok: false,
        reason: parsed.reason || "Case flagged by safety review.",
        checked: true,
      };
    return { ok: true, checked: true };
  } catch {
    return { ok: true, checked: false };
  }
}

export const publishCitizenCase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        shareCode: z.string().regex(CODE_RE),
        scenario: ScenarioConfig,
        deviceId: z.string().min(8).max(64).optional(),
        lane: z.enum(["private", "community"]).default("private"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const piiKind = scanForPii(data.scenario);
    if (piiKind)
      throw new Error(`Case rejected: contains ${piiKind}. Keep scenarios fully fictional.`);

    // AI safety gate — both lanes.
    const safety = await aiSafetyCheck(data.scenario);
    if (!safety.ok) throw new Error(`Case rejected by safety review: ${safety.reason}`);

    if (data.lane === "community") {
      // Community lane → queue in moderation, don't publish to citizen_cases yet.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("story_submissions").insert({
        story: { kind: "studio_case", scenario: data.scenario, shareCode: data.shareCode } as never,
        status: "pending",
        device_id: data.deviceId ?? null,
      });
      if (error) throw new Error(error.message);
      return {
        ok: true,
        shareCode: data.shareCode,
        lane: "community" as const,
        aiChecked: safety.checked,
      };
    }

    // Private lane → share-code only, never on public shelves.
    const supabase = serverClient();
    const { error } = await supabase.from("citizen_cases").insert({
      share_code: data.shareCode,
      scenario_config: data.scenario as never,
      device_id: data.deviceId ?? null,
    });
    if (error) {
      if (error.code === "23505")
        throw new Error("That share code is already taken. Publish again to mint a new one.");
      throw new Error(error.message);
    }
    return {
      ok: true,
      shareCode: data.shareCode,
      lane: "private" as const,
      aiChecked: safety.checked,
    };
  });

export const fetchCitizenCase = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ shareCode: z.string().regex(CODE_RE) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: rows, error } = await supabase
      .from("citizen_cases")
      .select("share_code, scenario_config, created_at")
      .eq("share_code", data.shareCode)
      .limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) return { scenarioJson: null as string | null };
    return { scenarioJson: JSON.stringify(row.scenario_config) as string | null };
  });

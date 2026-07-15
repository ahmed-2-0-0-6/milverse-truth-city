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

const ScenarioConfig = z.object({
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
}).passthrough();

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
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const publishCitizenCase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      shareCode: z.string().regex(CODE_RE),
      scenario: ScenarioConfig,
      deviceId: z.string().min(8).max(64).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const piiKind = scanForPii(data.scenario);
    if (piiKind) throw new Error(`Case rejected: contains ${piiKind}. Keep scenarios fully fictional.`);

    const supabase = serverClient();
    const { error } = await supabase.from("citizen_cases").insert({
      share_code: data.shareCode,
      scenario_config: data.scenario as never,
      device_id: data.deviceId ?? null,
    });
    if (error) {
      // Duplicate code — extremely unlikely (36^6 space) but degrade gracefully.
      if (error.code === "23505") throw new Error("That share code is already taken. Publish again to mint a new one.");
      throw new Error(error.message);
    }
    return { ok: true, shareCode: data.shareCode };
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

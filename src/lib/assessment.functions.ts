// MILVERSE — Pilot Assessment server functions.
// Follows the same pattern as pilot.functions.ts: publishable-key server
// client, opaque-sb-key fetch shim, insert-anon RLS.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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

const CODE_RE = /^[A-Z0-9]{4,6}$/;

const itemSchema = z.object({
  itemId: z.string().min(1).max(8),
  verdict: z.enum(["LEGIT", "FALSE", "CANT_VERIFY"]),
  confidence: z.number().int().min(50).max(100),
});

const metricsSchema = z.object({
  accuracy: z.number().int().min(0).max(6),
  meanConfidence: z.number().int().min(50).max(100),
  calibrationGap: z.number().int(),
  overconfidentErrors: z.number().int().min(0).max(6),
  missedScams: z.number().int().min(0).max(6),
  falseAlarms: z.number().int().min(0).max(6),
  unverifiableRecognized: z.number().int().min(0).max(6),
});

export const logAssessmentToCloud = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        groupCode: z.string().regex(CODE_RE),
        codenameHash: z.string().min(4).max(64),
        phase: z.enum(["intake", "exit"]),
        form: z.enum(["A", "B"]),
        items: z.array(itemSchema).min(1).max(12),
        metrics: metricsSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { error } = await supabase.from("assessment_entries").insert({
      group_code: data.groupCode,
      codename_hash: data.codenameHash,
      phase: data.phase,
      form: data.form,
      items: data.items as never,
      accuracy: data.metrics.accuracy,
      mean_confidence: data.metrics.meanConfidence,
      calibration_gap: data.metrics.calibrationGap,
      overconfident_errors: data.metrics.overconfidentErrors,
      missed_scams: data.metrics.missedScams,
      false_alarms: data.metrics.falseAlarms,
      unverifiable_recognized: data.metrics.unverifiableRecognized,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const fetchAssessmentGroup = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ groupCode: z.string().regex(CODE_RE) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    // Group-scoped SECURITY DEFINER read — direct SELECT on assessment_entries
    // is closed to the anon role (migration 20260717060500).
    const { data: rows, error } = await supabase.rpc("get_assessment_group_entries", {
      _code: data.groupCode,
    });
    if (error) throw new Error(error.message);
    const { data: phaseRow } = await supabase
      .from("assessment_phase")
      .select("phase, updated_at")
      .eq("group_code", data.groupCode)
      .maybeSingle();
    return { entries: rows ?? [], phase: phaseRow ?? { phase: "intake", updated_at: null } };
  });

export const fetchGroupPhase = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ groupCode: z.string().regex(CODE_RE) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: row, error } = await supabase
      .from("assessment_phase")
      .select("phase, updated_at")
      .eq("group_code", data.groupCode)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      phase: (row?.phase ?? "intake") as "intake" | "exit",
      updatedAt: row?.updated_at ?? null,
    };
  });

/** Passcode-gated: flip a group to exit phase (or back to intake). */
export const setGroupPhase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        passcode: z.string().min(1),
        groupCode: z.string().regex(CODE_RE),
        phase: z.enum(["intake", "exit"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { assertReviewPasscode } = await import("@/lib/passcode.server");
    await assertReviewPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("assessment_phase").upsert({
      group_code: data.groupCode,
      phase: data.phase,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, phase: data.phase };
  });

// MILVERSE — Daily Drop server functions.
// - logDailyPlay: writes one row to daily_plays (unique per day per device).
// - fetchDailySplit: returns the city split (total, correct_count).
// - fetchSharpestWatch / fetchMostDeviousDesigner: aggregate leaderboards.

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const logDailyPlay = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        dropDate: z.string().regex(DATE_RE),
        caseId: z.string().min(1).max(120),
        deviceId: z.string().min(8).max(64),
        verdict: z.enum(["LEGIT", "SCAM", "MISLEADING"]),
        correct: z.boolean(),
        stake: z.number().int().min(0).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { error } = await supabase.from("daily_plays").insert({
      drop_date: data.dropDate,
      case_id: data.caseId,
      device_id: data.deviceId,
      verdict: data.verdict,
      correct: data.correct,
      stake: data.stake,
    });
    // Unique index conflict = already played today; treat as success (idempotent).
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const fetchDailySplit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        dropDate: z.string().regex(DATE_RE),
        caseId: z.string().min(1).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: rows, error } = await supabase.rpc("get_daily_split", {
      _drop_date: data.dropDate,
      _case_id: data.caseId,
    });
    if (error) throw new Error(error.message);
    const row = (rows as Array<{ total: number; correct_count: number }> | null)?.[0];
    return { total: row?.total ?? 0, correct: row?.correct_count ?? 0 };
  });

export const fetchSharpestWatch = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase.rpc("get_sharpest_watch");
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as Array<{ handle: string; plays: number; correct_pct: number }> };
});

export const fetchMostDeviousDesigner = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase.rpc("get_most_devious_designer");
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as Array<{ case_id: string; plays: number; fooled_pct: number }> };
});

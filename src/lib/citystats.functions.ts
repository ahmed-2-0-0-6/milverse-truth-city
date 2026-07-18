// MILVERSE — "The City Solved This" aggregate reader.
// Returns anonymous case-level counts via the get_case_city_stats RPC.
// Suppression (n<5) lives in SQL; this fn simply returns null when the
// RPC returns zero rows OR when the call fails. No spinner, no retry.

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

export const getCityStats = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ caseId: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const supabase = serverClient();
      const { data: rows, error } = await supabase.rpc("get_case_city_stats", {
        _case_id: data.caseId,
      });
      if (error) return null;
      const row = (rows as Array<{ total: number; fooled: number; false_alarms: number }> | null)?.[0];
      if (!row || !row.total || row.total < 5) return null;
      const total = Number(row.total);
      const fooled = Number(row.fooled) || 0;
      const falseAlarms = Number(row.false_alarms) || 0;
      return {
        total,
        fooledPct: Math.round((fooled / total) * 100),
        falseAlarmPct: Math.round((falseAlarms / total) * 100),
      };
    } catch {
      return null;
    }
  });

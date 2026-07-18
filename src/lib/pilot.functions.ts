// MILVERSE — anonymous pilot aggregation via Lovable Cloud.
// Each student logs their own device's outcomes to a group code.
// Facilitator dashboard aggregates by group code.

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

export const logPilotEntryToCloud = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        groupCode: z.string().regex(CODE_RE),
        deviceId: z.string().min(8).max(64),
        wing: z.enum(["mirror", "feed", "daily"]),
        caseId: z.string().max(120),
        tier: z.number().int().min(1).max(5).optional(),
        result: z.enum(["correct", "missed_scam", "false_alarm", "lucky_guess", "pyrrhic"]),
        points: z.number().int(),
        probeStats: z
          .object({
            strong: z.number().int().min(0).default(0),
            weak: z.number().int().min(0).default(0),
            wasted: z.number().int().min(0).default(0),
          })
          .partial()
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { error } = await supabase.from("pilot_entries").insert({
      group_code: data.groupCode,
      device_id: data.deviceId,
      wing: data.wing,
      case_id: data.caseId,
      tier: data.tier ?? null,
      result: data.result,
      points: data.points,
      probe_stats: (data.probeStats ?? null) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const fetchPilotGroup = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ groupCode: z.string().regex(CODE_RE) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    // Group-scoped SECURITY DEFINER read — direct SELECT on pilot_entries is
    // closed to the anon role (migration 20260717060500).
    const { data: rows, error } = await supabase.rpc("get_pilot_group_entries", {
      _code: data.groupCode,
    });
    if (error) throw new Error(error.message);
    return { entries: rows ?? [] };
  });

// -----------------------------------------------------------------------------
// The City Board — group-scoped pseudonymous leaderboard.
// Reads via SECURITY DEFINER RPC get_city_board (SQL enforces n<5 suppression
// and >=3 plays per device). We also compute the caller's own handle server-side
// so the client can highlight "YOU" without shipping an md5 dependency.
// -----------------------------------------------------------------------------

export const fetchCityBoard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        groupCode: z.string().regex(CODE_RE),
        deviceId: z.string().min(8).max(64).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: rows, error } = await supabase.rpc("get_city_board", {
      _code: data.groupCode,
    });
    if (error) throw new Error(error.message);

    // Derive the caller's handle (first 6 chars of md5(deviceId)) so the
    // client can mark "YOU" without any md5 dependency.
    let myHandle: string | null = null;
    if (data.deviceId) {
      const { createHash } = await import("crypto");
      myHandle = createHash("md5").update(data.deviceId).digest("hex").slice(0, 6);
    }

    return { rows: rows ?? [], myHandle };
  });

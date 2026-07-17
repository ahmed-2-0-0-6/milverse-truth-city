// MILVERSE — Family code lifecycle: register / regenerate / rate-limited read.
// Wraps the SECURITY DEFINER SQL helpers defined in migration 20260716.
// Anonymous, no PII. Rate limit: 60 attempts per code per hour.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const CODE_RE = /^[A-Z0-9]{4,6}$/;

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

async function touchRateLimit(supabase: ReturnType<typeof serverClient>, code: string) {
  // Never throws for infrastructure hiccups — a missing RPC returns null and we
  // fail open (progress reads still work). Warn so it's visible in Worker logs.
  const { data, error } = await supabase.rpc("family_code_touch", { _code: code, _limit: 60 });
  if (error) {
    console.warn("[family] rate-limit RPC failed, failing open:", error.message);
    return true;
  }
  return data !== false;
}

async function isActive(supabase: ReturnType<typeof serverClient>, code: string) {
  const { data, error } = await supabase.rpc("family_code_is_active", { _code: code });
  if (error) return true; // fail open on infra error
  return data === true;
}

/** Parent creates a fresh code (server registers it as active). */
export const registerFamilyCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(CODE_RE) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { error } = await supabase.rpc("family_code_register", { _code: data.code });
    if (error) throw new Error(error.message);
    return { ok: true, code: data.code };
  });

/** Parent regenerates: revokes old, registers new. Old code stops working. */
export const regenerateFamilyCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        oldCode: z.string().regex(CODE_RE),
        newCode: z.string().regex(CODE_RE),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { error: revokeErr } = await supabase.rpc("family_code_revoke", { _code: data.oldCode });
    if (revokeErr) throw new Error(revokeErr.message);
    const { error: regErr } = await supabase.rpc("family_code_register", { _code: data.newCode });
    if (regErr) throw new Error(regErr.message);
    return { ok: true, code: data.newCode };
  });

/** Rate-limited progress read for the parent dashboard. */
export const fetchFamilyProgress = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(CODE_RE) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const allowed = await touchRateLimit(supabase, data.code);
    if (!allowed) throw new Error("Too many attempts for this code. Try again in an hour.");
    const active = await isActive(supabase, data.code);
    if (!active) throw new Error("This family code is no longer active. Generate a new one.");
    // Group-scoped SECURITY DEFINER read — direct SELECT on pilot_entries is
    // closed to the anon role (migration 20260717060500).
    const { data: rows, error } = await supabase.rpc("get_pilot_group_entries", {
      _code: data.code,
    });
    if (error) throw new Error(error.message);
    return {
      entries: (rows ?? []).map((r) => ({
        device_id: r.device_id,
        wing: r.wing,
        case_id: r.case_id,
        result: r.result,
      })),
    };
  });

/** Rate-limited check the kid runs when joining. */
export const checkFamilyCodeJoin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(CODE_RE) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const allowed = await touchRateLimit(supabase, data.code);
    if (!allowed) throw new Error("Too many attempts for this code. Try again in an hour.");
    const active = await isActive(supabase, data.code);
    if (!active)
      throw new Error("This family code is no longer active. Ask your parent for a new one.");
    return { ok: true };
  });

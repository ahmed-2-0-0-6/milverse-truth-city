// MILVERSE — district voting (Market / Arena blueprint votes).
// Anonymous. No PII. 140-char suggestion cap.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const PHONE_RE = /\+?\d[\d\s\-()]{6,}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /(https?:\/\/|www\.)[\w./?=&%-]+/i;

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

export const castDistrictVote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      district: z.enum(["market", "arena"]),
      suggestion: z.string().max(140).optional(),
      deviceId: z.string().min(8).max(64).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const s = data.suggestion?.trim();
    if (s && s.length > 0) {
      if (PHONE_RE.test(s)) throw new Error("Suggestion rejected: contains a phone number. Keep it fictional.");
      if (EMAIL_RE.test(s)) throw new Error("Suggestion rejected: contains an email.");
      if (URL_RE.test(s)) throw new Error("Suggestion rejected: contains a link.");
    }
    const supabase = serverClient();
    const { error } = await supabase.from("district_votes").insert({
      district: data.district,
      suggestion: s && s.length > 0 ? s : null,
      device_id: data.deviceId ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const fetchDistrictTallies = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = serverClient();
    const { data, error } = await supabase
      .from("district_votes")
      .select("district, suggestion, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const market = rows.filter((r) => r.district === "market").length;
    const arena = rows.filter((r) => r.district === "arena").length;
    const suggestions = rows
      .filter((r) => r.suggestion && r.suggestion.trim().length > 0)
      .slice(0, 12)
      .map((r) => ({ district: r.district, suggestion: r.suggestion!, at: r.created_at }));
    return { market, arena, suggestions };
  });

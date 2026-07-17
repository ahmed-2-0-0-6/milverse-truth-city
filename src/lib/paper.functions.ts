// THE DAILY MIRAGE — server functions for editions + interactions.
// - Public reads limited to published/locked editions via a server publishable client.
// - Draft edits + publish require passcode (same env as /review).
// - Anonymous interaction logging feeds The Ledger (aggregate only).

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { EditionContent } from "@/lib/paper/types";

function checkPass(passcode: string) {
  const expected = process.env.MILVERSE_REVIEW_PASSCODE;
  if (!expected) throw new Error("Passcode not configured on the server.");
  if (passcode !== expected) throw new Error("Invalid passcode.");
}

function pubClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
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

/** Latest published or locked edition. Returns null if none. */
export const getLatestEdition = createServerFn({ method: "GET" }).handler(async () => {
  const sb = pubClient();
  const { data, error } = await sb
    .from("editions" as never)
    .select(
      "id, edition_number, edition_date, motto, status, content, published_at, created_at, updated_at",
    )
    .in("status", ["published", "locked"])
    .order("edition_date", { ascending: false })
    .order("edition_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export const listArchive = createServerFn({ method: "GET" }).handler(async () => {
  const sb = pubClient();
  const { data, error } = await sb
    .from("editions" as never)
    .select("id, edition_number, edition_date, status, content, published_at")
    .in("status", ["published", "locked"])
    .order("edition_number", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return { rows: data ?? [] };
});

export const getEdition = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ number: z.number().int().positive() }).parse(i))
  .handler(async ({ data }) => {
    const sb = pubClient();
    const { data: row, error } = await sb
      .from("editions" as never)
      .select(
        "id, edition_number, edition_date, motto, status, content, published_at, created_at, updated_at",
      )
      .eq("edition_number", data.number)
      .in("status", ["published", "locked"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getPaperSplit = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ number: z.number().int(), section: z.string().min(1).max(40) }).parse(i),
  )
  .handler(async ({ data }) => {
    const sb = pubClient();
    const { data: rows, error } = await sb.rpc(
      "get_paper_split" as never,
      {
        _edition_number: data.number,
        _section: data.section,
      } as never,
    );
    if (error) throw new Error(error.message);
    const row =
      Array.isArray(rows) && rows.length > 0
        ? (rows[0] as { total: number; correct_count: number })
        : { total: 0, correct_count: 0 };
    return { total: row.total ?? 0, correct: row.correct_count ?? 0 };
  });

export const logPaperInteraction = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        number: z.number().int(),
        section: z.enum(["lead", "forgery", "social", "classified", "puzzle"]),
        correct: z.boolean(),
        deviceId: z.string().max(64).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("paper_interactions" as never).insert({
      edition_number: data.number,
      section: data.section,
      correct: data.correct,
      device_id: data.deviceId ?? null,
    } as never);
    return { ok: true };
  });

/* ───────────── Pressroom (passcode-gated) ───────────── */

export const pressroomList = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ passcode: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    checkPass(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("editions" as never)
      .select("id, edition_number, edition_date, status, published_at, updated_at")
      .order("edition_number", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const pressroomGet = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ passcode: z.string().min(1), number: z.number().int() }).parse(i),
  )
  .handler(async ({ data }) => {
    checkPass(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("editions" as never)
      .select("*")
      .eq("edition_number", data.number)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const pressroomSave = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        passcode: z.string().min(1),
        number: z.number().int().positive(),
        edition_date: z.string().min(10).max(10),
        content: z.any(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    checkPass(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // If exists → update (only if not locked). Else insert as draft.
    const { data: existing } = await supabaseAdmin
      .from("editions" as never)
      .select("id, status")
      .eq("edition_number", data.number)
      .maybeSingle();
    if (existing && (existing as { status: string }).status === "locked") {
      throw new Error("Edition is locked. Typo-fix mode not implemented in prototype.");
    }
    if (existing) {
      const { error } = await supabaseAdmin
        .from("editions" as never)
        .update({
          edition_date: data.edition_date,
          content: data.content as EditionContent,
        } as never)
        .eq("edition_number", data.number);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("editions" as never).insert({
        edition_number: data.number,
        edition_date: data.edition_date,
        status: "draft",
        content: data.content as EditionContent,
      } as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const pressroomPublish = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ passcode: z.string().min(1), number: z.number().int().positive() }).parse(i),
  )
  .handler(async ({ data }) => {
    checkPass(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("editions" as never)
      .update({ status: "published", published_at: new Date().toISOString() } as never)
      .eq("edition_number", data.number);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

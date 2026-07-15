// MILVERSE — Community story submissions + moderation.
// Anyone can submit (server-validated, no PII). Moderation gated by passcode
// stored in MILVERSE_REVIEW_PASSCODE env var. No user accounts.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const PHONE_RE = /\+?\d[\d\s\-()]{6,}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /(https?:\/\/|www\.)[\w./?=&%-]+/i;

function scanPii(blob: string): string | null {
  if (PHONE_RE.test(blob)) return "phone number";
  if (EMAIL_RE.test(blob)) return "email address";
  if (URL_RE.test(blob)) return "URL / link";
  return null;
}

const StorySchema = z.object({
  whatHappened: z.string().min(30).max(2000),
  channel: z.enum(["text", "call", "forward", "in_person", "other"]),
  whatScammerWanted: z.string().min(3).max(400),
  whatTippedYouOff: z.string().min(3).max(600),
  country: z.string().min(2).max(60),
  year: z.number().int().min(1990).max(new Date().getFullYear()),
  patternGuess: z.string().max(120).optional().default(""),
});

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

export const submitStory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      story: StorySchema,
      deviceId: z.string().min(8).max(64).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const blob = JSON.stringify(data.story);
    const pii = scanPii(blob);
    if (pii) {
      throw new Error(
        `Submission rejected: it contains a ${pii}. Please rewrite without real names, numbers, or links — we only publish tactics, never identities.`,
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("story_submissions").insert({
      story: data.story as never,
      country: data.story.country,
      year: data.story.year,
      status: "pending",
      device_id: data.deviceId ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Moderation (passcode-gated) ────────────────────────────────

function checkPasscode(passcode: string) {
  const expected = process.env.MILVERSE_REVIEW_PASSCODE;
  if (!expected) throw new Error("Review passcode is not configured on the server.");
  if (passcode !== expected) throw new Error("Invalid passcode.");
}

export const listPendingSubmissions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ passcode: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("story_submissions")
      .select("id, story, country, year, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const rejectSubmission = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      passcode: z.string().min(1),
      id: z.string().uuid(),
      reason: z.string().min(3).max(400),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("story_submissions")
      .update({ status: "rejected", reviewer_notes: data.reason })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveSubmissionAndPublish = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      passcode: z.string().min(1),
      id: z.string().uuid(),
      shareCode: z.string().regex(/^[A-Z0-9]{6}$/),
      scenario: z.any(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    checkPasscode(data.passcode);
    const blob = JSON.stringify(data.scenario);
    const pii = scanPii(blob);
    if (pii) throw new Error(`Published scenario still contains a ${pii}. Edit before publishing.`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: e1 } = await supabaseAdmin.from("citizen_cases").insert({
      share_code: data.shareCode,
      scenario_config: data.scenario as never,
      source: "community_story",
    });
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabaseAdmin
      .from("story_submissions")
      .update({ status: "approved", published_share_code: data.shareCode })
      .eq("id", data.id);
    if (e2) throw new Error(e2.message);
    return { ok: true, shareCode: data.shareCode };
  });

export const listCommunityCases = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = serverClient();
    const { data, error } = await supabase
      .from("citizen_cases")
      .select("share_code, scenario_config, created_at, source")
      .eq("source", "community_story")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

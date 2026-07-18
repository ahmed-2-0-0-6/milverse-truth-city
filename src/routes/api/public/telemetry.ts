import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const WHITELIST = new Set([
  "route_visit",
  "session_end",
  "js_error",
  "case_start",
  "case_complete",
  "case_verdict_locked",
  "drop_play",
  "drop_break",
  "tool_pick",
  "manual_open",
  "share_copy",
  "lite_fallback",
  "paper_section_done",
  "pin_flag",
]);

const EventSchema = z.object({
  event_type: z.string().max(40),
  route: z.string().max(200).optional(),
  case_id: z.string().max(120).optional(),
  session_id: z.string().max(64).optional(),
  payload: z
    .record(z.string().max(40), z.union([z.string().max(120), z.number(), z.boolean(), z.null()]))
    .optional(),
  ts: z.string().max(40).optional(),
});

const BodySchema = z.object({
  events: z.array(EventSchema).min(1).max(50),
});

function telemetryClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const Route = createFileRoute("/api/public/telemetry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json();
          const parsed = BodySchema.safeParse(raw);
          if (!parsed.success) return Response.json({ ok: false, count: 0 }, { status: 200 });

          const rows = parsed.data.events
            .filter((event) => WHITELIST.has(event.event_type))
            .slice(0, 50)
            .map((event) => ({
              event_type: event.event_type,
              route: event.route ?? null,
              case_id: event.case_id ?? null,
              session_id: event.session_id ?? null,
              payload: (event.payload ?? {}) as never,
            }));

          if (rows.length === 0) return Response.json({ ok: true, count: 0 });

          const { error } = await telemetryClient().from("telemetry_events").insert(rows);
          if (error) {
            console.error("[telemetry] insert failed:", error.message);
            return Response.json({ ok: false, count: 0 });
          }

          return Response.json({ ok: true, count: rows.length });
        } catch (error) {
          console.error("[telemetry] ingest failed:", error);
          return Response.json({ ok: false, count: 0 });
        }
      },
    },
  },
});

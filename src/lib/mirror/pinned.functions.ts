// MILVERSE — The Most Suspected Line.
// Fetch the top pinned line-hashes for a case. n<5 suppressed by RPC.
// Returns hashes + counts only; the RPC guarantees nothing else exists.

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

export type PinnedLine = { lineHash: string; pins: number };

export const fetchPinnedLines = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ caseId: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<PinnedLine[]> => {
    const supabase = serverClient();
    const { data: rows, error } = await supabase.rpc("get_pinned_lines", {
      _case_id: data.caseId,
    });
    if (error || !rows) return [];
    return rows
      .map((r: { line_hash: string | null; pins: number | null }) => ({
        lineHash: r.line_hash ?? "",
        pins: r.pins ?? 0,
      }))
      .filter((r) => /^[0-9a-f]{12}$/.test(r.lineHash) && r.pins >= 5);
  });

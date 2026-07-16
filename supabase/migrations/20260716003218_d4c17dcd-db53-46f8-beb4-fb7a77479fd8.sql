-- Anonymous aggregate telemetry — event counts only. No user identity, no message content.
CREATE TABLE public.telemetry_events (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  route       TEXT,
  case_id     TEXT,
  session_id  TEXT,
  payload     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX telemetry_events_ts_idx        ON public.telemetry_events (ts DESC);
CREATE INDEX telemetry_events_type_ts_idx   ON public.telemetry_events (event_type, ts DESC);
CREATE INDEX telemetry_events_case_idx      ON public.telemetry_events (case_id) WHERE case_id IS NOT NULL;

-- Whitelist enforced at insert time — prevents log-anything abuse.
GRANT INSERT ON public.telemetry_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.telemetry_events_id_seq TO anon, authenticated;
GRANT ALL ON public.telemetry_events TO service_role;

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon may insert whitelisted events"
  ON public.telemetry_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type = ANY (ARRAY[
      'route_visit','session_end','js_error',
      'case_start','case_complete',
      'drop_play','drop_break',
      'tool_pick','manual_open','share_copy',
      'lite_fallback'
    ])
    AND length(event_type)  <= 40
    AND (route    IS NULL OR length(route)    <= 200)
    AND (case_id  IS NULL OR length(case_id)  <= 120)
    AND (session_id IS NULL OR length(session_id) <= 64)
    AND octet_length(payload::text) <= 2048
  );

-- Server-only read: no anon SELECT policy is created, so PostgREST returns
-- zero rows to anon/authenticated even without RLS filtering. Reads happen
-- through service_role in devintel server functions.

-- ── AI improvement briefs cache ──────────────────────────────────
CREATE TABLE public.devintel_briefs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  stats       JSONB       NOT NULL,
  brief       JSONB       NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'ai'  -- 'ai' | 'fallback'
);

CREATE INDEX devintel_briefs_created_idx ON public.devintel_briefs (created_at DESC);

GRANT ALL ON public.devintel_briefs TO service_role;
-- No grants to anon/authenticated — server-only.

ALTER TABLE public.devintel_briefs ENABLE ROW LEVEL SECURITY;
-- No policies = locked down for anon/authenticated; service_role bypasses RLS.

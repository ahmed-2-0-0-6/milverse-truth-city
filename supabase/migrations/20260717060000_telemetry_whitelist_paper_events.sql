-- Pilot hardening (1/2): telemetry whitelist expansion.
-- The client fires `case_verdict_locked` (Paper verdicts) and declares
-- `paper_section_done`; both were missing from the insert whitelist, so
-- every Paper verdict event bounced off RLS and vanished. Recreate the
-- policy with the two events added. Caps unchanged.

DROP POLICY IF EXISTS "anon may insert whitelisted events" ON public.telemetry_events;

CREATE POLICY "anon may insert whitelisted events"
  ON public.telemetry_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type = ANY (ARRAY[
      'route_visit','session_end','js_error',
      'case_start','case_complete','case_verdict_locked',
      'drop_play','drop_break',
      'tool_pick','manual_open','share_copy',
      'lite_fallback','paper_section_done'
    ])
    AND length(event_type)  <= 40
    AND (route    IS NULL OR length(route)    <= 200)
    AND (case_id  IS NULL OR length(case_id)  <= 120)
    AND (session_id IS NULL OR length(session_id) <= 64)
    AND octet_length(payload::text) <= 2048
  );

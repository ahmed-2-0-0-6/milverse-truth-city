-- The Most Suspected Line — extend the telemetry whitelist with `pin_flag`
-- (drop-and-recreate the anon insert policy, mirroring 20260717060000), and
-- add a SECURITY DEFINER aggregate that returns only hashes + counts.

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
      'lite_fallback','paper_section_done',
      'pin_flag'
    ])
    AND length(event_type)  <= 40
    AND (route    IS NULL OR length(route)    <= 200)
    AND (case_id  IS NULL OR length(case_id)  <= 120)
    AND (session_id IS NULL OR length(session_id) <= 64)
    AND octet_length(payload::text) <= 2048
  );

-- Aggregate the top pinned line-hashes for a case. n<5 suppressed at the
-- HAVING clause (a lineup of four is not a city). Returns hashes only —
-- there is nothing to leak by design.
CREATE OR REPLACE FUNCTION public.get_pinned_lines(_case_id text)
  RETURNS TABLE(line_hash text, pins integer)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT (payload->>'line')::text AS line_hash,
         count(*)::int            AS pins
  FROM public.telemetry_events
  WHERE event_type = 'pin_flag'
    AND case_id    = _case_id
    AND length(coalesce(_case_id, '')) BETWEEN 1 AND 120
    AND payload->>'line' ~ '^[0-9a-f]{12}$'
  GROUP BY payload->>'line'
  HAVING count(*) >= 5
  ORDER BY count(*) DESC
  LIMIT 3;
$$;

GRANT EXECUTE ON FUNCTION public.get_pinned_lines(text) TO anon, authenticated;

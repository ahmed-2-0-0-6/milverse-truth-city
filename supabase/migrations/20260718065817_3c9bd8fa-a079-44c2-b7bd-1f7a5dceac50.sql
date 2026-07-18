-- The City Solved This — case-level aggregate reader.
--
-- Privacy law (locked):
--   * Returns aggregate COUNTS ONLY. No payloads, no sessions, no rows.
--   * Groups with fewer than 5 completions are SUPPRESSED here in SQL,
--     not the client — the function returns zero rows for tiny cases.
--   * telemetry_events remains insert-only for anon; anon can EXECUTE
--     this RPC but still cannot SELECT the underlying table.
--
-- Input cap: case_id is limited to 64 chars to keep the surface tight.

CREATE OR REPLACE FUNCTION public.get_case_city_stats(_case_id text)
RETURNS TABLE (total bigint, fooled bigint, false_alarms bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      count(*)                                                              AS total,
      count(*) FILTER (WHERE payload->>'result' = 'missed_scam')            AS fooled,
      count(*) FILTER (WHERE payload->>'result' = 'false_alarm')            AS false_alarms
    FROM public.telemetry_events
    WHERE event_type = 'case_complete'
      AND case_id    = _case_id
      AND length(coalesce(_case_id, '')) BETWEEN 1 AND 64
  )
  SELECT total, fooled, false_alarms
  FROM agg
  WHERE total >= 5;
$$;

GRANT EXECUTE ON FUNCTION public.get_case_city_stats(text) TO anon, authenticated;
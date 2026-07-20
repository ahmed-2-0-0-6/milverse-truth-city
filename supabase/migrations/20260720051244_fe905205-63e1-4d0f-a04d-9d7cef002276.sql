
-- 1) pilot_entries: reads are via SECURITY DEFINER RPCs (get_pilot_group_entries, get_city_board).
--    Close direct anon/authenticated SELECT so device_id can never be exposed.
DROP POLICY IF EXISTS "Anyone can read pilot entries by group code" ON public.pilot_entries;
REVOKE SELECT ON public.pilot_entries FROM anon, authenticated;

-- 2) assessment_entries: reads are via get_assessment_group_entries RPC.
DROP POLICY IF EXISTS "Anyone can read attempts for a group" ON public.assessment_entries;
REVOKE SELECT ON public.assessment_entries FROM anon, authenticated;

-- Tighten INSERT: require sensible shapes (was WITH CHECK true).
DROP POLICY IF EXISTS "Anyone can log an assessment attempt" ON public.assessment_entries;
CREATE POLICY "Anyone can log an assessment attempt"
  ON public.assessment_entries FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(group_code) BETWEEN 4 AND 6
    AND length(codename_hash) BETWEEN 4 AND 64
    AND phase IN ('intake','exit')
    AND form  IN ('A','B')
    AND jsonb_typeof(items) = 'array'
    AND pg_column_size(items) < 16000
  );

-- 3) assessment_phase: expose via SECURITY DEFINER RPC; close direct SELECT.
CREATE OR REPLACE FUNCTION public.get_group_phase(_code text)
RETURNS TABLE(phase text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT phase, updated_at FROM public.assessment_phase
  WHERE group_code = _code AND _code ~ '^[A-Z0-9]{4,6}$'
  LIMIT 1;
$$;
DROP POLICY IF EXISTS "Anyone can read group phase" ON public.assessment_phase;
REVOKE SELECT ON public.assessment_phase FROM anon, authenticated;

-- 4) district_votes: hide device_id via column-level grants; SELECT policy remains true
--    but only the safe columns are grantable.
REVOKE SELECT ON public.district_votes FROM anon, authenticated;
GRANT SELECT (district, suggestion, created_at) ON public.district_votes TO anon, authenticated;

-- 5) citizen_cases: hide device_id via column-level grants.
REVOKE SELECT ON public.citizen_cases FROM anon, authenticated;
GRANT SELECT (share_code, scenario_config, created_at) ON public.citizen_cases TO anon, authenticated;

-- Pilot hardening (2/2): close the open SELECT policies on group data.
-- pilot_entries and assessment_entries had `USING (true)` SELECT policies —
-- anyone with the anon key could dump ALL rows across ALL groups. Reads now
-- go through SECURITY DEFINER RPCs that require the group code (mirrors the
-- family_code_* helper pattern in 20260716235038). Rows are pseudonymous
-- either way; n<5 suppression stays client-side on the dashboards, which
-- now sit behind code-scoped access.

-- ── Group-scoped readers ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_pilot_group_entries(_code TEXT)
RETURNS TABLE (
  device_id text,
  wing text,
  case_id text,
  tier int,
  result text,
  points int,
  probe_stats jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT device_id, wing, case_id, tier, result, points, probe_stats, created_at
  FROM public.pilot_entries
  WHERE group_code = _code
  ORDER BY created_at ASC
  LIMIT 5000;
$$;

CREATE OR REPLACE FUNCTION public.get_assessment_group_entries(_code TEXT)
RETURNS TABLE (
  codename_hash text,
  phase text,
  form text,
  items jsonb,
  accuracy int,
  mean_confidence int,
  calibration_gap int,
  overconfident_errors int,
  missed_scams int,
  false_alarms int,
  unverifiable_recognized int,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT codename_hash, phase, form, items, accuracy, mean_confidence,
         calibration_gap, overconfident_errors, missed_scams, false_alarms,
         unverifiable_recognized, created_at
  FROM public.assessment_entries
  WHERE group_code = _code
  ORDER BY created_at ASC
  LIMIT 5000;
$$;

GRANT EXECUTE ON FUNCTION public.get_pilot_group_entries(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_group_entries(TEXT) TO anon, authenticated;

-- ── Drop the open SELECT policies ────────────────────────────────
-- Inserts are untouched. With no SELECT policy, PostgREST returns zero rows
-- to anon/authenticated; service_role (devintel) bypasses RLS as before.

DROP POLICY IF EXISTS "Anyone can read pilot entries by group code" ON public.pilot_entries;
DROP POLICY IF EXISTS "Anyone can read attempts for a group" ON public.assessment_entries;

REVOKE SELECT ON public.pilot_entries FROM anon, authenticated;
REVOKE SELECT ON public.assessment_entries FROM anon, authenticated;

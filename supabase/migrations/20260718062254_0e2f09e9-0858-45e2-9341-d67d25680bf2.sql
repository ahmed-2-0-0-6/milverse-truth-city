
CREATE OR REPLACE FUNCTION public.get_pilot_group_entries(_code text)
RETURNS TABLE(device_id text, wing text, case_id text, result text, tier integer, points integer, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT device_id, wing, case_id, result, tier, points, created_at
  FROM public.pilot_entries
  WHERE group_code = _code
  ORDER BY created_at DESC
  LIMIT 5000;
$$;

GRANT EXECUTE ON FUNCTION public.get_pilot_group_entries(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_assessment_group_entries(_code text)
RETURNS TABLE(
  codename_hash text,
  phase text,
  form text,
  items jsonb,
  accuracy integer,
  mean_confidence integer,
  calibration_gap integer,
  overconfident_errors integer,
  missed_scams integer,
  false_alarms integer,
  unverifiable_recognized integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT codename_hash, phase, form, items, accuracy, mean_confidence,
         calibration_gap, overconfident_errors, missed_scams, false_alarms,
         unverifiable_recognized, created_at
  FROM public.assessment_entries
  WHERE group_code = _code
  ORDER BY created_at DESC
  LIMIT 5000;
$$;

GRANT EXECUTE ON FUNCTION public.get_assessment_group_entries(text) TO anon, authenticated;

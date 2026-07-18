CREATE OR REPLACE FUNCTION public.get_city_board(_code text)
RETURNS TABLE(
  handle text,
  plays integer,
  points integer,
  correct_count integer,
  missed integer,
  false_alarms integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _distinct integer;
BEGIN
  -- Validate code shape (matches existing group RPCs).
  IF _code IS NULL OR _code !~ '^[A-Z0-9]{4,6}$' THEN
    RETURN;
  END IF;

  SELECT count(DISTINCT device_id) INTO _distinct
  FROM public.pilot_entries
  WHERE group_code = _code;

  -- Server-side suppression: fewer than 5 distinct devices → zero rows.
  IF _distinct < 5 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    substr(md5(pe.device_id), 1, 6) AS handle,
    count(*)::int AS plays,
    coalesce(sum(pe.points), 0)::int AS points,
    count(*) FILTER (WHERE pe.result = 'correct')::int AS correct_count,
    count(*) FILTER (WHERE pe.result = 'missed_scam')::int AS missed,
    count(*) FILTER (WHERE pe.result IN ('false_alarm', 'pyrrhic'))::int AS false_alarms
  FROM public.pilot_entries pe
  WHERE pe.group_code = _code
  GROUP BY pe.device_id
  HAVING count(*) >= 3
  ORDER BY coalesce(sum(pe.points), 0) DESC, count(*) DESC
  LIMIT 30;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_city_board(text) TO anon, authenticated;
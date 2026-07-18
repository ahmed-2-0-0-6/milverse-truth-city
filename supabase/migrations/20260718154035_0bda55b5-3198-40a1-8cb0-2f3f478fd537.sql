CREATE OR REPLACE FUNCTION public.get_city_census()
RETURNS TABLE(
  drops_total INT,
  drops_correct_pct INT,
  drops_last7 INT,
  watchers INT,
  designer_cases INT,
  hardest_case_id TEXT,
  hardest_fooled_pct INT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _watchers INT;
BEGIN
  SELECT count(DISTINCT device_id)::INT INTO _watchers FROM public.daily_plays;

  -- Whole-census suppression: a census of four is a lineup.
  IF _watchers IS NULL OR _watchers < 5 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH totals AS (
    SELECT
      count(*)::INT AS drops_total,
      CASE WHEN count(*) > 0
        THEN (100 * count(*) FILTER (WHERE correct) / count(*))::INT
        ELSE 0
      END AS drops_correct_pct,
      count(*) FILTER (WHERE drop_date >= (current_date - INTERVAL '7 days')::date)::INT AS drops_last7,
      _watchers AS watchers,
      (SELECT count(DISTINCT case_id)::INT FROM public.daily_plays WHERE case_id LIKE 'designer-%') AS designer_cases
    FROM public.daily_plays
  ),
  hardest AS (
    SELECT case_id,
           (100 * count(*) FILTER (WHERE NOT correct) / count(*))::INT AS fooled_pct
    FROM public.daily_plays
    WHERE case_id LIKE 'designer-%'
    GROUP BY case_id
    HAVING count(*) >= 5
    ORDER BY 2 DESC, count(*) DESC
    LIMIT 1
  )
  SELECT t.drops_total, t.drops_correct_pct, t.drops_last7, t.watchers,
         t.designer_cases, h.case_id, h.fooled_pct
  FROM totals t
  LEFT JOIN hardest h ON TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_city_census() TO anon, authenticated;
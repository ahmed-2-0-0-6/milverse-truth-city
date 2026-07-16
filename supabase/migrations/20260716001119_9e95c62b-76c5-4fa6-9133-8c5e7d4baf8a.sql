
CREATE TABLE public.daily_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_date date NOT NULL,
  case_id text NOT NULL,
  device_id text NOT NULL,
  verdict text NOT NULL,
  correct boolean NOT NULL,
  stake int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX daily_plays_drop_case_idx ON public.daily_plays (drop_date, case_id);
CREATE UNIQUE INDEX daily_plays_one_per_day_idx ON public.daily_plays (drop_date, device_id);

GRANT INSERT ON public.daily_plays TO anon, authenticated;
GRANT ALL ON public.daily_plays TO service_role;

ALTER TABLE public.daily_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a daily play" ON public.daily_plays
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(device_id) BETWEEN 8 AND 64
    AND length(case_id) < 128
    AND stake BETWEEN 0 AND 1000
    AND verdict IN ('LEGIT','SCAM','MISLEADING')
  );

CREATE OR REPLACE FUNCTION public.get_daily_split(_drop_date date, _case_id text)
RETURNS TABLE(total int, correct_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int, count(*) FILTER (WHERE correct)::int
  FROM public.daily_plays
  WHERE drop_date = _drop_date AND case_id = _case_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_daily_split(date, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_sharpest_watch()
RETURNS TABLE(handle text, plays int, correct_pct int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT substr(md5(device_id), 1, 6) AS handle,
         count(*)::int AS plays,
         (100 * count(*) FILTER (WHERE correct) / count(*))::int AS correct_pct
  FROM public.daily_plays
  GROUP BY device_id
  HAVING count(*) >= 7
  ORDER BY 3 DESC, 2 DESC
  LIMIT 10;
$$;
GRANT EXECUTE ON FUNCTION public.get_sharpest_watch() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_most_devious_designer()
RETURNS TABLE(case_id text, plays int, fooled_pct int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT case_id, count(*)::int,
         (100 * count(*) FILTER (WHERE NOT correct) / count(*))::int
  FROM public.daily_plays
  WHERE case_id LIKE 'designer-%'
  GROUP BY case_id
  HAVING count(*) >= 5
  ORDER BY 3 DESC, 2 DESC
  LIMIT 10;
$$;
GRANT EXECUTE ON FUNCTION public.get_most_devious_designer() TO anon, authenticated;

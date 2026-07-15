
CREATE TABLE public.district_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district text NOT NULL,
  suggestion text,
  device_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT district_votes_district_ck CHECK (district IN ('market','arena')),
  CONSTRAINT district_votes_suggestion_len_ck CHECK (suggestion IS NULL OR char_length(suggestion) <= 140)
);

GRANT SELECT, INSERT ON public.district_votes TO anon;
GRANT SELECT, INSERT ON public.district_votes TO authenticated;
GRANT ALL ON public.district_votes TO service_role;

ALTER TABLE public.district_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can cast a district vote"
  ON public.district_votes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    district IN ('market','arena')
    AND (suggestion IS NULL OR char_length(suggestion) <= 140)
  );

CREATE POLICY "Anyone can read district vote tallies"
  ON public.district_votes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX district_votes_district_idx ON public.district_votes (district);

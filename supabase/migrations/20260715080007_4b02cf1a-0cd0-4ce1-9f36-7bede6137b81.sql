
-- MILVERSE: anonymous sharing + pilot aggregation tables.
-- No auth. Read/insert by code only. No updates/deletes from clients.

-- ── citizen_cases ─────────────────────────────────────────────
CREATE TABLE public.citizen_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code text NOT NULL UNIQUE CHECK (share_code ~ '^[A-Z0-9]{6}$'),
  scenario_config jsonb NOT NULL,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.citizen_cases TO anon;
GRANT SELECT, INSERT ON public.citizen_cases TO authenticated;
GRANT ALL ON public.citizen_cases TO service_role;

ALTER TABLE public.citizen_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cases by share code"
  ON public.citizen_cases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can publish a case"
  ON public.citizen_cases FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(share_code) = 6
    AND jsonb_typeof(scenario_config) = 'object'
    AND (scenario_config->>'title') IS NOT NULL
    AND (scenario_config->>'opener') IS NOT NULL
    AND pg_column_size(scenario_config) < 32000
  );

CREATE INDEX idx_citizen_cases_share_code ON public.citizen_cases (share_code);

-- ── pilot_entries ─────────────────────────────────────────────
CREATE TABLE public.pilot_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code text NOT NULL CHECK (group_code ~ '^[A-Z0-9]{4,6}$'),
  device_id text NOT NULL,
  wing text NOT NULL CHECK (wing IN ('mirror','feed')),
  case_id text NOT NULL,
  tier int,
  result text NOT NULL CHECK (result IN ('correct','missed_scam','false_alarm','lucky_guess','pyrrhic')),
  points int NOT NULL,
  probe_stats jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pilot_entries TO anon;
GRANT SELECT, INSERT ON public.pilot_entries TO authenticated;
GRANT ALL ON public.pilot_entries TO service_role;

ALTER TABLE public.pilot_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pilot entries by group code"
  ON public.pilot_entries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can log a pilot entry"
  ON public.pilot_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(group_code) BETWEEN 4 AND 6
    AND length(device_id) BETWEEN 8 AND 64
    AND length(case_id) < 128
  );

CREATE INDEX idx_pilot_entries_group_code ON public.pilot_entries (group_code, created_at DESC);
CREATE INDEX idx_pilot_entries_device ON public.pilot_entries (group_code, device_id);

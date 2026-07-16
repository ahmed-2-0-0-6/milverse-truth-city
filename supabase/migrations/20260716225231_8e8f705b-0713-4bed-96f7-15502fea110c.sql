
CREATE TABLE public.assessment_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_code TEXT NOT NULL,
  codename_hash TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('intake','exit')),
  form TEXT NOT NULL CHECK (form IN ('A','B')),
  items JSONB NOT NULL,
  accuracy INTEGER NOT NULL,
  mean_confidence INTEGER NOT NULL,
  calibration_gap INTEGER NOT NULL,
  overconfident_errors INTEGER NOT NULL,
  missed_scams INTEGER NOT NULL,
  false_alarms INTEGER NOT NULL,
  unverifiable_recognized INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_entries_group ON public.assessment_entries(group_code, phase);

GRANT SELECT, INSERT ON public.assessment_entries TO anon;
GRANT SELECT, INSERT ON public.assessment_entries TO authenticated;
GRANT ALL ON public.assessment_entries TO service_role;

ALTER TABLE public.assessment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an assessment attempt"
  ON public.assessment_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read attempts for a group"
  ON public.assessment_entries FOR SELECT
  USING (true);


CREATE TABLE public.assessment_phase (
  group_code TEXT NOT NULL PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'intake' CHECK (phase IN ('intake','exit')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.assessment_phase TO anon;
GRANT SELECT ON public.assessment_phase TO authenticated;
GRANT ALL ON public.assessment_phase TO service_role;

ALTER TABLE public.assessment_phase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read group phase"
  ON public.assessment_phase FOR SELECT
  USING (true);
-- Writes go through server functions using the service role (passcode-gated).

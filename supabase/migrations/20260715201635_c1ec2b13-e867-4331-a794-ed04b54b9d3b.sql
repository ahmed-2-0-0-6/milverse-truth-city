
CREATE TABLE public.story_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story JSONB NOT NULL,
  country TEXT,
  year INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  device_id TEXT,
  reviewer_notes TEXT,
  published_share_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT story_submissions_status_check CHECK (status IN ('pending','approved','rejected'))
);

GRANT INSERT ON public.story_submissions TO anon, authenticated;
GRANT ALL ON public.story_submissions TO service_role;

ALTER TABLE public.story_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (server function validates content).
CREATE POLICY "Anyone can submit a story"
  ON public.story_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    jsonb_typeof(story) = 'object'
    AND pg_column_size(story) < 16000
    AND status = 'pending'
  );

-- No public reads; moderation goes through service_role only.

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_story_submissions_updated_at
  BEFORE UPDATE ON public.story_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tag origin on citizen_cases (official vs community_story).
ALTER TABLE public.citizen_cases
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'user_designed';

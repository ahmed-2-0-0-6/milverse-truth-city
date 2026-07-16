-- Family codes registry + per-code hourly rate-limit counter.
-- Anonymous, no PII. Used to gate parent<->kid family code fetches.

CREATE TABLE IF NOT EXISTS public.family_codes (
  code TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE ON public.family_codes TO authenticated;
GRANT ALL ON public.family_codes TO service_role;
-- Read is done only via server functions using the publishable client;
-- deny broad anon reads.

ALTER TABLE public.family_codes ENABLE ROW LEVEL SECURITY;

-- Nothing readable/writable directly from client role. Server fns use
-- publishable client which acts as `anon`; block direct access.
CREATE POLICY "family_codes_no_direct_client_access"
  ON public.family_codes FOR ALL
  USING (false) WITH CHECK (false);

-- Per-code, per-hour attempt bucket. Server increments on read/join.
CREATE TABLE IF NOT EXISTS public.family_code_attempts (
  code TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (code, hour_bucket)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_code_attempts TO authenticated;
GRANT ALL ON public.family_code_attempts TO service_role;

ALTER TABLE public.family_code_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_code_attempts_no_direct_client_access"
  ON public.family_code_attempts FOR ALL
  USING (false) WITH CHECK (false);

-- Helper: atomic check + increment. Returns true if allowed, false if rate-limited.
-- Limit: 60 attempts per code per hour.
CREATE OR REPLACE FUNCTION public.family_code_touch(_code TEXT, _limit INTEGER DEFAULT 60)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bucket TIMESTAMPTZ := date_trunc('hour', now());
  _count INTEGER;
BEGIN
  INSERT INTO public.family_code_attempts(code, hour_bucket, count)
  VALUES (_code, _bucket, 1)
  ON CONFLICT (code, hour_bucket) DO UPDATE
    SET count = public.family_code_attempts.count + 1
  RETURNING count INTO _count;
  RETURN _count <= _limit;
END;
$$;

-- Helper: check code active, callable by anyone via server fn.
CREATE OR REPLACE FUNCTION public.family_code_is_active(_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT active FROM public.family_codes WHERE code = _code), false);
$$;

-- Helper: register a new code (server-side).
CREATE OR REPLACE FUNCTION public.family_code_register(_code TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.family_codes(code, active) VALUES (_code, true)
  ON CONFLICT (code) DO UPDATE SET active = true, revoked_at = NULL;
$$;

-- Helper: revoke a code (parent regenerated).
CREATE OR REPLACE FUNCTION public.family_code_revoke(_code TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.family_codes SET active = false, revoked_at = now() WHERE code = _code;
$$;

-- Allow server publishable client (anon role) to call the helpers.
GRANT EXECUTE ON FUNCTION public.family_code_touch(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.family_code_is_active(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.family_code_register(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.family_code_revoke(TEXT) TO anon, authenticated;
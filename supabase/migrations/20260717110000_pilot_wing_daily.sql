-- MILVERSE — pilot_entries: allow wing='daily'.
--
-- BUG: /drop (Daily Drop) and First Phone junior lessons log pilot entries
-- with wing='daily'. The zod validator accepts it, but the table's CHECK
-- (wing IN ('mirror','feed')) rejects the insert — silently, because the
-- client sync is fire-and-forget. Every daily/junior play was missing from
-- the classroom dashboard. Local logs were unaffected.
--
-- Postgres auto-names inline CHECKs <table>_<column>_check.

ALTER TABLE public.pilot_entries
  DROP CONSTRAINT IF EXISTS pilot_entries_wing_check;

ALTER TABLE public.pilot_entries
  ADD CONSTRAINT pilot_entries_wing_check
  CHECK (wing IN ('mirror', 'feed', 'daily'));

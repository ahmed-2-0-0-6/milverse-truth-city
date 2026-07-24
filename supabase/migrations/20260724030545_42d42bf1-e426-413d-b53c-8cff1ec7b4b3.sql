DROP POLICY IF EXISTS "anon logs paper interactions" ON public.paper_interactions;

CREATE POLICY "anon logs paper interactions"
ON public.paper_interactions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  edition_number IS NOT NULL
  AND edition_number BETWEEN 0 AND 100000
  AND section IS NOT NULL
  AND length(section) BETWEEN 1 AND 64
  AND section ~ '^[a-z0-9_-]+$'
  AND correct IS NOT NULL
  AND device_id IS NOT NULL
  AND length(device_id) BETWEEN 8 AND 128
  AND device_id ~ '^[A-Za-z0-9_-]+$'
);
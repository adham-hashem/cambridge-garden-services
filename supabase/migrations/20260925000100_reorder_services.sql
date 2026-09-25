-- Keep the existing sort_order column as a unique, zero-based position.
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY sort_order) - 1 AS position
  FROM public.services
)
UPDATE public.services AS service
SET sort_order = ordered.position
FROM ordered
WHERE service.id = ordered.id
  AND service.sort_order IS DISTINCT FROM ordered.position;

CREATE OR REPLACE FUNCTION public.reorder_service(p_service_id text, p_position integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_ids text[];
  insert_at integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('public.services.sort_order'));

  IF NOT EXISTS (SELECT 1 FROM public.services WHERE id = p_service_id) THEN
    RAISE EXCEPTION 'Service not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(array_agg(id ORDER BY sort_order), ARRAY[]::text[])
    INTO service_ids
    FROM public.services
    WHERE id <> p_service_id;

  insert_at := LEAST(GREATEST(p_position, 0), cardinality(service_ids));
  service_ids := service_ids[1:insert_at] || ARRAY[p_service_id] || service_ids[insert_at + 1:];

  UPDATE public.services AS service
  SET sort_order = ordered.position - 1
  FROM unnest(service_ids) WITH ORDINALITY AS ordered(id, position)
  WHERE service.id = ordered.id
    AND service.sort_order IS DISTINCT FROM ordered.position - 1;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_service(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_service(text, integer) TO service_role;

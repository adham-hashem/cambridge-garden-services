/*
# Fix search_path on handle_projects_updated_at function

Sets a secure search_path on the trigger function to resolve the security advisor warning.
*/

CREATE OR REPLACE FUNCTION public.handle_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

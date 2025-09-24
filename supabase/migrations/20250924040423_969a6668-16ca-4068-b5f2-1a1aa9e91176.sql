-- Update the is_admin function to use the correct admin email (with CASCADE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT auth.email() = 'Humzam241@outlook.com'
$$;
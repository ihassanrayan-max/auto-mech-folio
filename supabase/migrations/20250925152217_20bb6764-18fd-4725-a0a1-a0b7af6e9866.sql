-- Temporarily update site_settings RLS policies to allow admin access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admin can upsert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admin can update site_settings" ON public.site_settings;

-- Create more permissive admin policies
CREATE POLICY "Admin can insert site_settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (auth.email() = 'Humzam241@outlook.com');

CREATE POLICY "Admin can update site_settings" 
ON public.site_settings 
FOR UPDATE 
USING (auth.email() = 'Humzam241@outlook.com')
WITH CHECK (auth.email() = 'Humzam241@outlook.com');
-- Drop all existing RLS policies on site_settings table only
DROP POLICY IF EXISTS "Admin can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can update site_settings" ON public.site_settings;  
DROP POLICY IF EXISTS "Only admin can delete site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can read full site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admin can upsert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admin can update site_settings" ON public.site_settings;

-- Recreate SELECT policy (keep reads as before)
CREATE POLICY "Admins can read full site_settings" 
ON public.site_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'::app_role
));

-- Create new INSERT policy checking profiles table for admin role
CREATE POLICY "Admins insert site_settings"
ON public.site_settings
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'::app_role
));

-- Create new UPDATE policy checking profiles table for admin role  
CREATE POLICY "Admins update site_settings"
ON public.site_settings
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'::app_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'::app_role
));

-- Recreate DELETE policy 
CREATE POLICY "Admins delete site_settings" 
ON public.site_settings 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'::app_role
));
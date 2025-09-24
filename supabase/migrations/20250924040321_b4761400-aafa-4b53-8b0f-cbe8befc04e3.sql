-- Create a security definer function to provide safe public contact info
CREATE OR REPLACE FUNCTION public.get_public_site_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', s.id,
    'homeFeaturedEnabled', s."homeFeaturedEnabled",
    'updatedAt', s."updatedAt",
    'hero', s.hero,
    'about', s.about,
    'skills', s.skills,
    'contact', jsonb_build_object(
      'email', 'contact@humzamuhammad.com',  -- Safe generic email
      'linkedinUrl', s.contact->>'linkedinUrl',
      'githubUrl', s.contact->>'githubUrl', 
      'otherLinks', s.contact->'otherLinks'
    )
  )
  FROM public.site_settings s
  WHERE s.id = 'main'
$$;

-- Update RLS policy to allow public access through the safe function
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;

-- Keep full access for admins
CREATE POLICY "Admins can read full site_settings"
ON public.site_settings
FOR SELECT
USING (is_admin());

-- Public gets masked data through function call (they can't directly query table)
-- We'll update the frontend to use the function instead
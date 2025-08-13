-- Extend site_settings with JSONB fields and add triggers; ensure singleton row
BEGIN;

-- Add JSONB columns with sane defaults
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero jsonb NOT NULL DEFAULT jsonb_build_object(
    'headline','',
    'subcopy','',
    'ctaText','',
    'ctaHref',''
  ),
  ADD COLUMN IF NOT EXISTS about jsonb NOT NULL DEFAULT jsonb_build_object(
    'markdown',''
  ),
  ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact jsonb NOT NULL DEFAULT jsonb_build_object(
    'email','',
    'linkedinUrl','',
    'githubUrl','',
    'otherLinks', '[]'::jsonb
  );

-- Ensure updatedAt auto-updates on UPDATE
DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Audit log trigger
DROP TRIGGER IF EXISTS site_settings_audit ON public.site_settings;
CREATE TRIGGER site_settings_audit
AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_audit();

-- Ensure singleton row with defaults
INSERT INTO public.site_settings (id, "homeFeaturedEnabled", hero, about, skills, contact)
VALUES ('main', false, DEFAULT, DEFAULT, DEFAULT, DEFAULT)
ON CONFLICT (id) DO NOTHING;

COMMIT;
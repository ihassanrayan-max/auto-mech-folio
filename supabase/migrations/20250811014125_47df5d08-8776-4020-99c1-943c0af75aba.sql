-- Harden set_updated_at with search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

-- Restrict sign-up: profiles.role default NULL, allow NULL
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT NULL;

-- Ensure your account is admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ihassanrayan@gmail.com')
  AND (role IS DISTINCT FROM 'admin');

-- Backups snapshot table
CREATE TABLE IF NOT EXISTS public.daily_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  projects JSONB NOT NULL,
  site_settings JSONB NOT NULL
);

ALTER TABLE public.daily_backups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read backups" ON public.daily_backups;
CREATE POLICY "Admins can read backups"
ON public.daily_backups FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Backup function (snapshots published + all settings)
CREATE OR REPLACE FUNCTION public.take_daily_backup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _projects JSONB;
  _settings JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
  INTO _projects
  FROM public.projects p
  WHERE p.published = true;

  SELECT COALESCE(jsonb_agg(s), '[]'::jsonb)
  INTO _settings
  FROM public.site_settings s;

  INSERT INTO public.daily_backups(projects, site_settings)
  VALUES (_projects, _settings);
END;
$$;

-- Enable and schedule pg_cron job at 02:00 UTC daily
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-content-backup') THEN
    PERFORM cron.schedule('daily-content-backup', '0 2 * * *', $$ select public.take_daily_backup(); $$);
  END IF;
END $$;
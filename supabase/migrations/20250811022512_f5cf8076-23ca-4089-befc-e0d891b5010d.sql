-- Retry with corrected pg_policies column name (policyname)

-- 1) Backups table and functions
CREATE TABLE IF NOT EXISTS public.daily_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  site_settings jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.daily_backups ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'daily_backups' AND policyname = 'Admins can read daily_backups'
  ) THEN
    CREATE POLICY "Admins can read daily_backups"
    ON public.daily_backups
    FOR SELECT
    USING (is_admin());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.take_daily_backup()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.daily_backups (projects, site_settings)
  VALUES (
    (
      SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
      FROM public.projects p
    ),
    (
      SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      FROM public.site_settings s
    )
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_from_backup(backup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _projects jsonb;
  _site jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can restore from backups';
  END IF;

  SELECT projects, site_settings
  INTO _projects, _site
  FROM public.daily_backups
  WHERE id = backup_id;

  IF _projects IS NULL OR _site IS NULL THEN
    RAISE EXCEPTION 'Backup not found: %', backup_id;
  END IF;

  DELETE FROM public.site_settings;
  INSERT INTO public.site_settings (id, "homeFeaturedEnabled", "updatedAt")
  SELECT 
    (s->>'id')::text,
    COALESCE((s->>'homeFeaturedEnabled')::boolean, false),
    COALESCE((s->>'updatedAt')::timestamptz, now())
  FROM jsonb_array_elements(_site) AS s;

  DELETE FROM public.projects;
  INSERT INTO public.projects (
    id, title, "shortSummary", "longDescription", category, status, 
    "dateStarted", "dateCompleted", media, tags, "githubUrl", 
    "externalLinks", slug, featured, priority, published, "createdAt", "updatedAt"
  )
  SELECT 
    (p->>'id')::uuid,
    p->>'title',
    p->>'shortSummary',
    p->>'longDescription',
    (p->>'category')::public.category_enum,
    (p->>'status')::public.status_enum,
    (p->>'dateStarted')::date,
    NULLIF(p->>'dateCompleted','')::date,
    p->'media',
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'tags')), ARRAY[]::text[]),
    NULLIF(p->>'githubUrl',''),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'externalLinks')), ARRAY[]::text[]),
    p->>'slug',
    COALESCE((p->>'featured')::boolean, false),
    COALESCE((p->>'priority')::integer, 0),
    COALESCE((p->>'published')::boolean, true),
    COALESCE((p->>'createdAt')::timestamptz, now()),
    COALESCE((p->>'updatedAt')::timestamptz, now())
  FROM jsonb_array_elements(_projects) AS p;
END;
$$;

-- 2) pg_cron schedule
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-content-backup') THEN
    PERFORM cron.schedule('daily-content-backup', '0 2 * * *', 'select public.take_daily_backup();');
  ELSE
    UPDATE cron.job
    SET schedule = '0 2 * * *', command = 'select public.take_daily_backup();'
    WHERE jobname = 'daily-content-backup' AND (schedule <> '0 2 * * *' OR command <> 'select public.take_daily_backup();');
  END IF;
END $$;

-- 3) Storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read media-projects'
  ) THEN
    CREATE POLICY "Public can read media-projects"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'media-projects');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Editors can insert media-projects'
  ) THEN
    CREATE POLICY "Editors can insert media-projects"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'media-projects' AND (has_role(auth.uid(), 'editor'::app_role) OR is_admin())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Editors can update media-projects'
  ) THEN
    CREATE POLICY "Editors can update media-projects"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'media-projects' AND (has_role(auth.uid(), 'editor'::app_role) OR is_admin())
    )
    WITH CHECK (
      bucket_id = 'media-projects' AND (has_role(auth.uid(), 'editor'::app_role) OR is_admin())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Editors can delete media-projects'
  ) THEN
    CREATE POLICY "Editors can delete media-projects"
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'media-projects' AND (has_role(auth.uid(), 'editor'::app_role) OR is_admin())
    );
  END IF;
END $$;
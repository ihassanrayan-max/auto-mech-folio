begin;

-- 0) Harden and ensure core functions exist with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.email() = 'ihassanrayan@gmail.com'
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _action TEXT;
  _record_id TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    _action := 'INSERT';
    _record_id := COALESCE(NEW.id::text, NULL);
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, action, record_id, old_data, new_data)
    VALUES (auth.uid(), auth.email(), TG_TABLE_NAME::text, _action, _record_id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    _action := 'UPDATE';
    _record_id := COALESCE(NEW.id::text, OLD.id::text);
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, action, record_id, old_data, new_data)
    VALUES (auth.uid(), auth.email(), TG_TABLE_NAME::text, _action, _record_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    _action := 'DELETE';
    _record_id := COALESCE(OLD.id::text, NULL);
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, action, record_id, old_data, new_data)
    VALUES (auth.uid(), auth.email(), TG_TABLE_NAME::text, _action, _record_id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 1) daily_backups table and RLS policy (admin read-only)
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

-- 2) Backup/restore functions
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

-- 3) Cron job schedule for daily backups at 02:00 UTC
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

-- 4) Storage policies for media-projects bucket
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

-- 5) Profile auto-creation trigger on signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

commit;
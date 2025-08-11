-- Single-pass fix: ensure public site_settings read, auth trigger for profiles, and storage policies

-- 1) Ensure RLS enabled and public read on site_settings (idempotent)
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Public can read site_settings'
  ) THEN
    EXECUTE $$CREATE POLICY "Public can read site_settings"
      ON public.site_settings
      FOR SELECT
      USING (true)$$;
  END IF;
END$$;

-- 2) Ensure profiles are auto-created on signup (auth trigger) so role defaults to 'editor'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    EXECUTE $$CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()$$;
  END IF;
END$$;

-- 3) Ensure media-projects bucket exists and policies are in place
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media-projects') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('media-projects', 'media-projects', true);
  END IF;
END$$;

-- Public read objects in media-projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read media-projects'
  ) THEN
    EXECUTE $$CREATE POLICY "Public can read media-projects"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'media-projects')$$;
  END IF;
END$$;

-- Editors/Admins can manage media-projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Editors/Admin can manage media-projects'
  ) THEN
    EXECUTE $$CREATE POLICY "Editors/Admin can manage media-projects"
      ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'media-projects'
        AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
      )
      WITH CHECK (
        bucket_id = 'media-projects'
        AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
      )$$;
  END IF;
END$$;

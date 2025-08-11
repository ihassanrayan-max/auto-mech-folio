DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-content-backup') THEN
    PERFORM cron.schedule('daily-content-backup', '0 2 * * *', 'select public.take_daily_backup();');
  END IF;
END $$;
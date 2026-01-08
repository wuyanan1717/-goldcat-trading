-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron with schema extensions;

-- Grant permissions
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Create cron job to update daily briefs every 4 hours
select cron.schedule(
  'update-daily-briefs',
  '0 */4 * * *',  -- At minute 0 past every 4th hour (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  $$
  select
    net.http_post(
      url:='https://aaimrvqgroecgqtmmkzi.supabase.co/functions/v1/update-briefs',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaW1ydnFncm9lY2dxdG1ta3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMzNzksImV4cCI6MjA3OTU2OTM3OX0.zp0DRBeQiWWpj-EQM3QMa01Fjvbcu0eL8F1-pd6UmFM"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- To unschedule the job later (uncomment if needed):
-- SELECT cron.unschedule('update-daily-briefs');

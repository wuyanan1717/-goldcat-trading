-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the job to run every 4 hours
-- NOTE: You need to replace 'YOUR_PROJECT_REF' with your actual project reference ID (found in URL: app.supabase.com/project/PROJECT_REF)
-- OR easier: Just call the function via HTTP in the cron command.
-- Ideally, use pg_net to call the edge function.

select cron.schedule(
  'update-briefs-job', -- name of the cron job
  '0 */4 * * *',       -- every 4 hours
  $$
  select
    net.http_post(
        url:='https://aaimrvqgroecgqtmmkzi.supabase.co/functions/v1/update-briefs',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Note: user needs to set app.settings.service_role_key in postgres config or hardcode the key in the query (less secure but easier for manual run)
-- Alternative: Use Supabase Dashboard -> Integrations -> Cron to set it up visually if available, OR just run the simplified version below:

/*
-- SIMPLIFIED VERSION (Run this one if the above is too complex)
select cron.schedule(
  'update-briefs-simple',
  '0 */4 * * *',
  $$
    select net.http_post(
       url:='https://aaimrvqgroecgqtmmkzi.supabase.co/functions/v1/update-briefs',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_SERVICE_ROLE_KEY]"}'::jsonb,
       body:='{}'::jsonb
    );
  $$
);
*/

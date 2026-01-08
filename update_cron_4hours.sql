-- 更新 Cron 任务：从每6小时改为每4小时
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 先删除旧的定时任务
SELECT cron.unschedule('update-daily-briefs');

-- 2. 创建新的定时任务（每4小时执行一次）
SELECT cron.schedule(
  'update-daily-briefs',
  '0 */4 * * *',  -- 每4小时: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 (UTC)
  $$
  SELECT
    net.http_post(
      url:='https://aaimrvqgroecgqtmmkzi.supabase.co/functions/v1/update-briefs',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaW1ydnFncm9lY2dxdG1ta3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMzNzksImV4cCI6MjA3OTU2OTM3OX0.zp0DRBeQiWWpj-EQM3QMa01Fjvbcu0eL8F1-pd6UmFM"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 3. 验证：查看所有定时任务
SELECT * FROM cron.job;

-- Backfill profiles for existing users who don't have one
-- This fixes the issue where old accounts (created before the trigger existed) are missing from the profiles table.

insert into public.profiles (id, full_name, avatar_url, total_capital)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', email), -- Use email as name fallback
  raw_user_meta_data->>'avatar_url', 
  0 -- Default capital
from auth.users
where id not in (select id from public.profiles);

-- Verify the result
select count(*) as new_profiles_created from public.profiles;

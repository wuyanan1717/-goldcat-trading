-- Simplified Backfill
-- Only insert ID and Total Capital to avoid "column does not exist" errors
insert into public.profiles (id, total_capital)
select 
  id, 
  0 -- Default capital
from auth.users
where id not in (select id from public.profiles);

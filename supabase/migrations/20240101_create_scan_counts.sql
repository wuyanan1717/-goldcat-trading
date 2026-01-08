
create table if not exists daily_scan_counts (
  user_id uuid references auth.users not null,
  scan_date date not null,
  count int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, scan_date)
);

-- Enable RLS
alter table daily_scan_counts enable row level security;

-- Policy: Users can view their own usage (for UI display if needed)
create policy "Users can view own scan counts" 
  on daily_scan_counts for select 
  using (auth.uid() = user_id);

-- Policy: Users CANNOT update/insert. Only Service Role (Edge Function) can.
-- No INSERT/UPDATE policy for 'public' or 'authenticated' roles.

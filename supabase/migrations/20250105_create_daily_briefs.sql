-- Create daily_briefs table for caching AI-generated content
create table if not exists daily_briefs (
  id uuid default gen_random_uuid() primary key,
  category text not null, -- e.g. 'airdrop', 'signals'
  lang text not null,     -- 'zh' or 'en'
  content jsonb not null, -- The AI-curated list of 5 items
  created_at timestamp with time zone default timezone('utc'::text, now()),
  expires_at timestamp with time zone -- Optional, for TTL purging if needed
);

-- Index for fast lookups by category/lang/time
create index daily_briefs_lookup_idx on daily_briefs (category, lang, created_at desc);

-- RLS Policies
alter table daily_briefs enable row level security;

-- Allow public read (or authenticated) - assuming frontend needs to read this
create policy "Allow public read access"
  on daily_briefs for select
  using (true);

-- Allow service role (Edge Functions) to insert/update
-- (Implicitly allowed for service_role, but explicit deny for anon/authenticated if needed)
create policy "Service role full access"
  on daily_briefs for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

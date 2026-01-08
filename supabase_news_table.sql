-- Create daily_reports table for storing crypto news summaries
create table if not exists daily_reports (
  id uuid primary key default uuid_generate_v4(),
  report_date date not null unique, -- One report per day
  
  -- Structured Data from AI Analysis
  market_sentiment jsonb not null default '{}'::jsonb, -- { score: 65, status: 'Greed', summary: '...' }
  
  -- The 4 key sectors (KOL categories)
  airdrop_alpha jsonb not null default '[]'::jsonb, -- Array of { source: '@x', content: '...', urgency: 'High' }
  trading_signals jsonb not null default '[]'::jsonb,
  onchain_data jsonb not null default '[]'::jsonb, 
  kol_gems jsonb not null default '[]'::jsonb,      -- "Treasure Bloggers" section
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table daily_reports enable row level security;

-- Policy: Allow everyone to read reports
create policy "Allow public read access"
  on daily_reports for select
  using (true);

-- Policy: Allow service_role (backend script) to insert/update
-- (Implicitly allowed for service_role, explicit for authenticated if needed)
create policy "Allow authenticated upload"
  on daily_reports for insert
  to authenticated
  with check (true);

create policy "Allow authenticated update"
  on daily_reports for update
  to authenticated
  using (true);

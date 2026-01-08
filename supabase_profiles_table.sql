-- 1. Ensure 'profiles' table exists
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text,
  full_name text,
  avatar_url text,
  website text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Safely add 'total_capital' column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'total_capital') then
    alter table public.profiles add column total_capital numeric default 0;
  end if;
end $$;

-- 3. Enable RLS (safe to run multiple times)
alter table public.profiles enable row level security;

-- 4. recreate policies (drop existing ones first to avoid conflicts)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- 5. Update/Create Trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, total_capital)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 0)
  on conflict (id) do nothing; -- Prevent error if profile already exists
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

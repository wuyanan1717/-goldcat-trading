-- Clean up the "chaotic" empty rows
-- Sync email and username from auth.users to profiles

update public.profiles
set 
  -- Determine column names based on common conventions and screenshot
  -- If your column is named 'user_email' instead of 'email', please adjust
  email = auth.users.email,
  username = coalesce(public.profiles.username, split_part(auth.users.email, '@', 1))
from auth.users
where public.profiles.id = auth.users.id
and public.profiles.email is null; -- Only fix the empty ones

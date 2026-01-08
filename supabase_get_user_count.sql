-- Create a function to count users securely
-- This function accesses the auth.users table which is usually restricted
-- So we use SECURITY DEFINER to run it with the privileges of the creator (postgres/admin)

create or replace function get_user_count()
returns integer
language plpgsql
security definer
as $$
declare
  count integer;
begin
  select count(*) into count from auth.users;
  return count;
end;
$$;

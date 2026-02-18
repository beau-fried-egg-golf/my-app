-- RPC function: returns true if the calling user's email is in admin_users
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_users
    where email = (select email from auth.users where id = auth.uid())
  );
$$;

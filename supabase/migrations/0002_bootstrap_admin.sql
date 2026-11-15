-- =============================================================================
--  First-admin bootstrap (run after 0001_init.sql — safe to re-run).
--  Lets the very first visitor create the admin account from the login page.
--  As soon as one admin exists, both functions refuse and the button disappears.
-- =============================================================================

-- Public check used by the login page to decide whether to show the button.
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where role = 'admin');
$$;

revoke execute on function public.admin_exists() from public;
grant  execute on function public.admin_exists() to anon, authenticated, service_role;

-- Atomically promotes a user to admin ONLY if no admin exists yet.
-- Callable by the service role only (from the bootstrap-admin Edge Function).
create or replace function public.bootstrap_first_admin(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Serialize concurrent attempts so two people can't both become admin.
  perform pg_advisory_xact_lock(hashtext('bootstrap_first_admin'));
  if exists (select 1 from public.profiles where role = 'admin') then
    return false;
  end if;
  update public.profiles set role = 'admin', is_active = true where id = p_user_id;
  return found;
end;
$$;

revoke execute on function public.bootstrap_first_admin(uuid) from public, anon, authenticated;
grant  execute on function public.bootstrap_first_admin(uuid) to service_role;

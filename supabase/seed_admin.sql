-- =============================================================================
--  Promote your account to admin.
--  1) Create your user first: Supabase Dashboard → Authentication → Users →
--     "Add user" → "Create new user" (tick "Auto Confirm User").
--  2) Replace the e-mail below with yours and run this in the SQL Editor.
-- =============================================================================

-- Make sure a profile row exists (in case the user was created before the trigger).
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', 'Admin')
from auth.users u
where lower(u.email) = lower('admin@example.com')
on conflict (id) do nothing;

update public.profiles
set role = 'admin',
    is_active = true
where lower(email) = lower('admin@example.com');

-- Check the result (should return one row with role = admin):
select id, email, role, is_active from public.profiles where role = 'admin';

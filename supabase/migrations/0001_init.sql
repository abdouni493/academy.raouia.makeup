-- =============================================================================
--  Raouia Makeup Academy — complete database schema
--  Run this whole file once in the Supabase SQL Editor (it is safe to re-run:
--  every statement is idempotent where PostgreSQL allows it).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUM TYPES
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.video_status as enum ('uploading', 'processing', 'ready', 'failed');
exception when duplicate_object then null; end $$;


-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- One profile per auth user (created automatically by handle_new_user()).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'client',
  is_active   boolean not null default true,
  notes       text,
  language    text not null default 'fr',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A formation = one training course.
create table if not exists public.formations (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  short_description text,
  description       text,
  cover_url         text,
  level             text not null default 'beginner'
                    check (level in ('beginner', 'intermediate', 'pro')),
  is_published      boolean not null default false,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Chapters inside a formation.
create table if not exists public.sections (
  id            uuid primary key default gen_random_uuid(),
  formation_id  uuid not null references public.formations (id) on delete cascade,
  title         text not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Videos hosted on Bunny Stream (only the Bunny GUID is stored here).
create table if not exists public.videos (
  id                uuid primary key default gen_random_uuid(),
  formation_id      uuid not null references public.formations (id) on delete cascade,
  section_id        uuid references public.sections (id) on delete set null,
  title             text not null,
  description       text,
  bunny_video_id    text unique,
  status            public.video_status not null default 'uploading',
  duration_seconds  int,
  thumbnail_url     text,
  is_free_preview   boolean not null default false,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Packs = bundles of formations sold together.
create table if not exists public.packs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  description   text,
  cover_url     text,
  price         numeric(12, 2),
  currency      text not null default 'DZD',
  is_published  boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.pack_formations (
  pack_id       uuid not null references public.packs (id) on delete cascade,
  formation_id  uuid not null references public.formations (id) on delete cascade,
  sort_order    int not null default 0,
  primary key (pack_id, formation_id)
);

-- Who can watch what. Exactly one of formation_id / pack_id is set.
create table if not exists public.access_grants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  formation_id  uuid references public.formations (id) on delete cascade,
  pack_id       uuid references public.packs (id) on delete cascade,
  starts_at     timestamptz not null default now(),
  expires_at    timestamptz,
  granted_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint access_grants_one_target check (num_nonnulls(formation_id, pack_id) = 1)
);

create unique index if not exists access_grants_user_formation_uniq
  on public.access_grants (user_id, formation_id) where formation_id is not null;
create unique index if not exists access_grants_user_pack_uniq
  on public.access_grants (user_id, pack_id) where pack_id is not null;

-- Per-user watch progress.
create table if not exists public.video_progress (
  user_id                uuid not null references public.profiles (id) on delete cascade,
  video_id               uuid not null references public.videos (id) on delete cascade,
  last_position_seconds  int not null default 0,
  completed              boolean not null default false,
  updated_at             timestamptz not null default now(),
  primary key (user_id, video_id)
);


-- -----------------------------------------------------------------------------
-- 3. INDEXES (foreign keys + sort columns)
-- -----------------------------------------------------------------------------
create index if not exists formations_sort_idx        on public.formations (sort_order);
create index if not exists sections_formation_idx     on public.sections (formation_id);
create index if not exists sections_sort_idx          on public.sections (formation_id, sort_order);
create index if not exists videos_formation_idx       on public.videos (formation_id);
create index if not exists videos_section_idx         on public.videos (section_id);
create index if not exists videos_sort_idx            on public.videos (formation_id, sort_order);
create index if not exists videos_status_idx          on public.videos (status);
create index if not exists packs_sort_idx             on public.packs (sort_order);
create index if not exists pack_formations_form_idx   on public.pack_formations (formation_id);
create index if not exists pack_formations_sort_idx   on public.pack_formations (pack_id, sort_order);
create index if not exists access_grants_user_idx     on public.access_grants (user_id);
create index if not exists access_grants_form_idx     on public.access_grants (formation_id);
create index if not exists access_grants_pack_idx     on public.access_grants (pack_id);
create index if not exists access_grants_by_idx       on public.access_grants (granted_by);
create index if not exists video_progress_video_idx   on public.video_progress (video_id);
create index if not exists video_progress_upd_idx     on public.video_progress (user_id, updated_at desc);
create index if not exists profiles_role_idx          on public.profiles (role);


-- -----------------------------------------------------------------------------
-- 4. updated_at TRIGGER
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','formations','sections','videos','packs','video_progress'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;


-- -----------------------------------------------------------------------------
-- 5. NEW USER → PROFILE
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when an admin changes a user's e-mail.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();


-- -----------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS (used by RLS and Edge Functions)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- Access check for an arbitrary user (used by Edge Functions with service role).
create or replace function public.user_has_formation_access(p_user_id uuid, p_formation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.profiles p
            where p.id = p_user_id and p.role = 'admin' and p.is_active)
    or (
      exists (select 1 from public.profiles p where p.id = p_user_id and p.is_active)
      and (
        exists (
          select 1 from public.access_grants g
          where g.user_id = p_user_id
            and g.formation_id = p_formation_id
            and g.starts_at <= now()
            and (g.expires_at is null or g.expires_at > now())
        )
        or exists (
          select 1
          from public.access_grants g
          join public.pack_formations pf on pf.pack_id = g.pack_id
          where g.user_id = p_user_id
            and pf.formation_id = p_formation_id
            and g.starts_at <= now()
            and (g.expires_at is null or g.expires_at > now())
        )
      )
    );
$$;

-- Access check for the currently logged-in user.
create or replace function public.has_formation_access(p_formation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_formation_access(auth.uid(), p_formation_id);
$$;

revoke execute on function public.user_has_formation_access(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.user_has_formation_access(uuid, uuid) to service_role;


-- -----------------------------------------------------------------------------
-- 7. PROTECT SENSITIVE PROFILE COLUMNS
--    A non-admin can never change role / is_active / email / notes, even by
--    calling the REST API directly. Service role (auth.uid() is null) and
--    admins are allowed.
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email
       or new.notes is distinct from old.notes
       or new.id is distinct from old.id then
      raise exception 'You are not allowed to modify these profile fields'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();


-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.formations      enable row level security;
alter table public.sections        enable row level security;
alter table public.videos          enable row level security;
alter table public.packs           enable row level security;
alter table public.pack_formations enable row level security;
alter table public.access_grants   enable row level security;
alter table public.video_progress  enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles: read own"        on public.profiles;
drop policy if exists "profiles: update own"      on public.profiles;
drop policy if exists "profiles: admin all"       on public.profiles;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid() and is_active) with check (id = auth.uid());
create policy "profiles: admin all" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- formations ----------
-- Published formation metadata (title, cover, description) is visible to every
-- active client so the catalog can show "locked" formations. Videos stay protected.
drop policy if exists "formations: admin all"       on public.formations;
drop policy if exists "formations: client read"     on public.formations;

create policy "formations: admin all" on public.formations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "formations: client read" on public.formations
  for select to authenticated using (is_published and public.is_active_user());

-- ---------- sections ----------
drop policy if exists "sections: admin all"   on public.sections;
drop policy if exists "sections: client read" on public.sections;

create policy "sections: admin all" on public.sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sections: client read" on public.sections
  for select to authenticated using (
    public.is_active_user()
    and exists (select 1 from public.formations f
                where f.id = sections.formation_id and f.is_published)
  );

-- ---------- videos ----------
-- Clients only get video rows (and therefore bunny_video_id) when they own the
-- formation, or when the video is a free preview of a published formation.
drop policy if exists "videos: admin all"   on public.videos;
drop policy if exists "videos: client read" on public.videos;

create policy "videos: admin all" on public.videos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "videos: client read" on public.videos
  for select to authenticated using (
    public.is_active_user()
    and exists (select 1 from public.formations f
                where f.id = videos.formation_id and f.is_published)
    and (videos.is_free_preview or public.has_formation_access(videos.formation_id))
  );

-- ---------- packs ----------
drop policy if exists "packs: admin all"   on public.packs;
drop policy if exists "packs: read published" on public.packs;

create policy "packs: admin all" on public.packs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "packs: read published" on public.packs
  for select to authenticated using (is_published and public.is_active_user());

-- ---------- pack_formations ----------
drop policy if exists "pack_formations: admin all" on public.pack_formations;
drop policy if exists "pack_formations: read published" on public.pack_formations;

create policy "pack_formations: admin all" on public.pack_formations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "pack_formations: read published" on public.pack_formations
  for select to authenticated using (
    public.is_active_user()
    and exists (select 1 from public.packs p where p.id = pack_formations.pack_id and p.is_published)
  );

-- ---------- access_grants ----------
drop policy if exists "access_grants: admin all" on public.access_grants;
drop policy if exists "access_grants: read own"  on public.access_grants;

create policy "access_grants: admin all" on public.access_grants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "access_grants: read own" on public.access_grants
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());

-- ---------- video_progress ----------
drop policy if exists "video_progress: own"        on public.video_progress;
drop policy if exists "video_progress: admin read" on public.video_progress;

create policy "video_progress: own" on public.video_progress
  for all to authenticated
  using (user_id = auth.uid() and public.is_active_user())
  with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.videos v
                where v.id = video_progress.video_id
                  and (v.is_free_preview or public.has_formation_access(v.formation_id)))
  );
create policy "video_progress: admin read" on public.video_progress
  for select to authenticated using (public.is_admin());

-- Anonymous visitors get nothing at all.
revoke all on public.profiles, public.formations, public.sections, public.videos,
              public.packs, public.pack_formations, public.access_grants,
              public.video_progress from anon;


-- -----------------------------------------------------------------------------
-- 8b. CATALOG VIEW + OUTLINE FUNCTION (safe data for locked formations)
--     Owner-run view: exposes only aggregates (never bunny_video_id) and
--     filters itself to active logged-in users.
-- -----------------------------------------------------------------------------
create or replace view public.public_catalog
with (security_barrier = true)
as
select
  f.id,
  f.title,
  f.slug,
  f.short_description,
  f.cover_url,
  f.level,
  f.sort_order,
  count(v.id) filter (where v.status = 'ready')                              as video_count,
  coalesce(sum(v.duration_seconds) filter (where v.status = 'ready'), 0)::int as total_seconds,
  public.has_formation_access(f.id)                                          as has_access
from public.formations f
left join public.videos v on v.formation_id = f.id
where f.is_published
  and public.is_active_user()
group by f.id;

revoke all on public.public_catalog from anon;
grant select on public.public_catalog to authenticated;

-- Table of contents of a published formation, with titles and durations only.
-- bunny_video_id is never returned here.
create or replace function public.formation_outline(p_formation_id uuid)
returns table (
  id uuid,
  section_id uuid,
  title text,
  duration_seconds int,
  is_free_preview boolean,
  sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select v.id, v.section_id, v.title, v.duration_seconds, v.is_free_preview, v.sort_order
  from public.videos v
  join public.formations f on f.id = v.formation_id
  where v.formation_id = p_formation_id
    and v.status = 'ready'
    and (f.is_published or public.is_admin())
    and public.is_active_user()
  order by v.sort_order, v.created_at;
$$;

revoke execute on function public.formation_outline(uuid) from public, anon;
grant  execute on function public.formation_outline(uuid) to authenticated;


-- -----------------------------------------------------------------------------
-- 9. STORAGE — public "covers" bucket (images only, 5 MB)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "covers: public read"  on storage.objects;
drop policy if exists "covers: admin insert" on storage.objects;
drop policy if exists "covers: admin update" on storage.objects;
drop policy if exists "covers: admin delete" on storage.objects;

create policy "covers: public read" on storage.objects
  for select using (bucket_id = 'covers');
create policy "covers: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'covers' and public.is_admin());
create policy "covers: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());
create policy "covers: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'covers' and public.is_admin());


-- -----------------------------------------------------------------------------
-- 10. ADMIN DASHBOARD VIEW (security_invoker → RLS applies; admins only)
-- -----------------------------------------------------------------------------
create or replace view public.admin_dashboard_stats
with (security_invoker = true)
as
select
  (select count(*) from public.profiles where role = 'client')                         as clients_count,
  (select count(*) from public.profiles where role = 'client' and is_active)           as active_clients_count,
  (select count(*) from public.formations)                                             as formations_count,
  (select count(*) from public.videos)                                                 as videos_count,
  (select count(*) from public.packs)                                                  as packs_count,
  (select coalesce(round(sum(duration_seconds) / 60.0), 0)::int
     from public.videos where status = 'ready')                                        as total_video_minutes
where public.is_admin();

revoke all on public.admin_dashboard_stats from anon;
grant select on public.admin_dashboard_stats to authenticated;


-- -----------------------------------------------------------------------------
-- 11. REALTIME — admin UI listens to video status changes
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'videos'
  ) then
    alter publication supabase_realtime add table public.videos;
  end if;
end $$;

-- =============================================================================
--  Done. Next: create your account in Authentication → Users, then run
--  supabase/seed_admin.sql to make it an admin.
-- =============================================================================

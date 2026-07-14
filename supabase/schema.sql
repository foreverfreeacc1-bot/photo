-- =====================================================================
-- Photographer site — database schema (Supabase / Postgres)
-- Run this once in Supabase -> SQL Editor.
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type photo_category as enum ('work', 'art');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_section as enum ('content', 'photos', 'users', 'roles', 'settings');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- RBAC: roles + per-section access
-- =====================================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.role_section_access (
  role_id uuid not null references public.roles(id) on delete cascade,
  section app_section not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  primary key (role_id, section)
);

-- ---------- Admin profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role_id uuid references public.roles(id) on delete set null,
  is_active boolean not null default true,
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Content: flat key/value store per (section, key, locale)
-- =====================================================================
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  key text not null,
  locale text not null check (locale in ('ru','en')),
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  unique (key, locale)
);

-- =====================================================================
-- Photos: metadata in Postgres, binary in Storage bucket "photos"
-- =====================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category photo_category not null default 'work',
  technique text,
  year int,
  alt text,
  storage_path text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists photos_category_sort_idx
  on public.photos (category, sort_order);
create index if not exists photos_published_idx
  on public.photos (published);

-- =====================================================================
-- Helper functions (SECURITY DEFINER) used by RLS policies.
-- Avoids recursive RLS lookups on profiles.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.is_owner
  );
$$;

-- Does the current user have edit rights on a given section?
create or replace function public.can_edit(target app_section)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_owner() or exists (
    select 1
    from public.profiles p
    join public.role_section_access a on a.role_id = p.role_id
    where p.id = auth.uid()
      and p.is_active
      and a.section = target
      and a.can_edit
  );
$$;

-- Does the current user have view rights on a given section?
create or replace function public.can_view(target app_section)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_owner() or exists (
    select 1
    from public.profiles p
    join public.role_section_access a on a.role_id = p.role_id
    where p.id = auth.uid()
      and p.is_active
      and a.section = target
      and (a.can_view or a.can_edit)
  );
$$;

-- Auto-create a profile row when a new auth user is created.
-- The first ever user becomes the owner automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  existing_count int;
begin
  select count(*) into existing_count from public.profiles;
  insert into public.profiles (id, email, full_name, is_owner, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    existing_count = 0,   -- first user => owner
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.roles enable row level security;
alter table public.role_section_access enable row level security;
alter table public.profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.photos enable row level security;

-- ---- site_content: public can read; editors can write ----
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select using (true);

drop policy if exists site_content_write on public.site_content;
create policy site_content_write on public.site_content
  for all using (public.can_edit('content')) with check (public.can_edit('content'));

-- ---- photos: public reads published; editors manage all ----
drop policy if exists photos_read_public on public.photos;
create policy photos_read_public on public.photos
  for select using (published or public.can_view('photos'));

drop policy if exists photos_write on public.photos;
create policy photos_write on public.photos
  for all using (public.can_edit('photos')) with check (public.can_edit('photos'));

-- ---- profiles ----
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid() or public.can_view('users'));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles
  for all using (public.can_edit('users')) with check (public.can_edit('users'));

-- ---- roles + access: viewable by users-viewers; editable by roles-editors ----
drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
  for select using (public.can_view('roles') or public.can_view('users') or public.is_admin());

drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles
  for all using (public.can_edit('roles')) with check (public.can_edit('roles'));

drop policy if exists rsa_read on public.role_section_access;
create policy rsa_read on public.role_section_access
  for select using (public.can_view('roles') or public.can_view('users') or public.is_admin());

drop policy if exists rsa_write on public.role_section_access;
create policy rsa_write on public.role_section_access
  for all using (public.can_edit('roles')) with check (public.can_edit('roles'));

-- =====================================================================
-- Storage bucket for photos + policies
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_storage_read on storage.objects;
create policy photos_storage_read on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists photos_storage_write on storage.objects;
create policy photos_storage_write on storage.objects
  for insert with check (bucket_id = 'photos' and public.can_edit('photos'));

drop policy if exists photos_storage_update on storage.objects;
create policy photos_storage_update on storage.objects
  for update using (bucket_id = 'photos' and public.can_edit('photos'));

drop policy if exists photos_storage_delete on storage.objects;
create policy photos_storage_delete on storage.objects
  for delete using (bucket_id = 'photos' and public.can_edit('photos'));

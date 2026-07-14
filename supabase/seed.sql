-- =====================================================================
-- Seed default roles + section access. Run after schema.sql.
-- Idempotent.
-- =====================================================================

-- System roles
insert into public.roles (name, is_system) values
  ('Владелец', true),
  ('Редактор', true),
  ('Редактор фото', true)
on conflict (name) do nothing;

-- "Редактор" — can edit content + photos, view users.
with r as (select id from public.roles where name = 'Редактор')
insert into public.role_section_access (role_id, section, can_view, can_edit)
select r.id, s.section, s.can_view, s.can_edit from r,
  (values
    ('content'::app_section, true, true),
    ('photos'::app_section, true, true),
    ('users'::app_section, true, false),
    ('roles'::app_section, false, false),
    ('settings'::app_section, true, false)
  ) as s(section, can_view, can_edit)
on conflict (role_id, section) do update
  set can_view = excluded.can_view, can_edit = excluded.can_edit;

-- "Редактор фото" — photos only.
with r as (select id from public.roles where name = 'Редактор фото')
insert into public.role_section_access (role_id, section, can_view, can_edit)
select r.id, s.section, s.can_view, s.can_edit from r,
  (values
    ('content'::app_section, false, false),
    ('photos'::app_section, true, true),
    ('users'::app_section, false, false),
    ('roles'::app_section, false, false),
    ('settings'::app_section, false, false)
  ) as s(section, can_view, can_edit)
on conflict (role_id, section) do update
  set can_view = excluded.can_view, can_edit = excluded.can_edit;

-- "Владелец" gets full access (owner flag also bypasses, but keep explicit).
with r as (select id from public.roles where name = 'Владелец')
insert into public.role_section_access (role_id, section, can_view, can_edit)
select r.id, s.section, true, true from r,
  (values ('content'::app_section),('photos'),('users'),('roles'),('settings')) as s(section)
on conflict (role_id, section) do update
  set can_view = true, can_edit = true;

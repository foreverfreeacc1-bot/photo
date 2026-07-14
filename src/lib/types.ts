import type { Locale } from './i18n'

// A photo record as stored in Postgres + Supabase Storage.
export type Photo = {
  id: string
  title: string
  category: 'work' | 'art'
  technique: string | null
  year: number | null
  alt: string | null
  storage_path: string
  sort_order: number
  published: boolean
  created_at: string
}

// Site content is a flat key/value store, one row per (section, key, locale).
export type SiteContentRow = {
  id: string
  section: string
  key: string
  locale: Locale
  value: string
  updated_at: string
}

// Sections the RBAC system can grant access to.
export const SECTIONS = [
  'content',
  'photos',
  'users',
  'roles',
  'settings',
] as const
export type Section = (typeof SECTIONS)[number]

export const SECTION_LABELS: Record<Section, string> = {
  content: 'Тексты сайта',
  photos: 'Фотографии',
  users: 'Администраторы',
  roles: 'Роли и доступы',
  settings: 'Настройки',
}

export type Role = {
  id: string
  name: string
  is_system: boolean
  created_at: string
}

// Per-section capability grant for a role.
export type RoleSectionAccess = {
  role_id: string
  section: Section
  can_view: boolean
  can_edit: boolean
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role_id: string | null
  is_active: boolean
  created_at: string
}

// The signed-in admin plus resolved permissions, used across the panel.
export type AdminSession = {
  profile: Profile
  roleName: string | null
  isOwner: boolean
  access: Record<Section, { can_view: boolean; can_edit: boolean }>
}

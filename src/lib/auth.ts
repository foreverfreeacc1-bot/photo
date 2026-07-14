import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SECTIONS, type Section, type AdminSession } from '@/lib/types'

// Resolve the signed-in admin + their per-section permissions.
// Returns null if not authenticated or not an active admin.
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return null

  const isOwner = !!profile.is_owner

  // Empty access map default.
  const access = Object.fromEntries(
    SECTIONS.map((s) => [s, { can_view: isOwner, can_edit: isOwner }]),
  ) as AdminSession['access']

  let roleName: string | null = null

  if (!isOwner && profile.role_id) {
    const [{ data: role }, { data: grants }] = await Promise.all([
      supabase.from('roles').select('name').eq('id', profile.role_id).single(),
      supabase
        .from('role_section_access')
        .select('section, can_view, can_edit')
        .eq('role_id', profile.role_id),
    ])
    roleName = role?.name ?? null
    for (const g of grants ?? []) {
      access[g.section as Section] = {
        can_view: g.can_view || g.can_edit,
        can_edit: g.can_edit,
      }
    }
  } else if (isOwner) {
    roleName = 'Владелец'
  }

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role_id: profile.role_id,
      is_active: profile.is_active,
      created_at: profile.created_at,
    },
    roleName,
    isOwner,
    access,
  }
}

// Guard helper for admin pages: redirects to login, or 403 if no view rights.
export async function requireSection(section: Section): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!session.access[section].can_view) redirect('/admin?denied=' + section)
  return session
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return session
}

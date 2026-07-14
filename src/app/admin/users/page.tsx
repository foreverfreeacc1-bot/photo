import { requireSection } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Role } from '@/lib/types'
import UsersManager from './UsersManager'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await requireSection('users')
  const supabase = createClient()

  const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('roles').select('*').order('created_at', { ascending: true }),
  ])

  const roles = (rolesData ?? []) as Role[]
  const profiles = (profilesData ?? []) as Profile[]
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]))

  const admins = profiles.map((p) => ({
    ...p,
    role_name: p.role_id ? roleNameById.get(p.role_id) ?? null : null,
  }))

  return (
    <UsersManager
      admins={admins}
      roles={roles}
      canEdit={session.access.users.can_edit}
      currentUserId={session.profile.id}
    />
  )
}

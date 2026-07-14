import { requireSection } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SECTIONS, type Role, type Section } from '@/lib/types'
import RolesManager from './RolesManager'

export const dynamic = 'force-dynamic'

type AccessMap = Record<Section, { can_view: boolean; can_edit: boolean }>

function emptyAccess(): AccessMap {
  return Object.fromEntries(
    SECTIONS.map((s) => [s, { can_view: false, can_edit: false }]),
  ) as AccessMap
}

export default async function RolesPage() {
  const session = await requireSection('roles')
  const supabase = createClient()

  const [{ data: rolesData }, { data: grantsData }] = await Promise.all([
    supabase.from('roles').select('*').order('created_at', { ascending: true }),
    supabase
      .from('role_section_access')
      .select('role_id, section, can_view, can_edit'),
  ])

  const roles = (rolesData ?? []) as Role[]
  const grants = (grantsData ?? []) as {
    role_id: string
    section: Section
    can_view: boolean
    can_edit: boolean
  }[]

  const accessByRole: Record<string, AccessMap> = {}
  for (const r of roles) accessByRole[r.id] = emptyAccess()
  for (const g of grants) {
    if (!accessByRole[g.role_id]) accessByRole[g.role_id] = emptyAccess()
    accessByRole[g.role_id][g.section] = {
      can_view: g.can_view || g.can_edit,
      can_edit: g.can_edit,
    }
  }

  return (
    <RolesManager
      roles={roles}
      accessByRole={accessByRole}
      canEdit={session.access.roles.can_edit}
    />
  )
}

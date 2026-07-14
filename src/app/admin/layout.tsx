import Sidebar from '@/components/admin/Sidebar'
import { getAdminSession } from '@/lib/auth'
import { SECTIONS, type Section } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  // No session -> only the login route can reach here, because middleware
  // redirects every other /admin/* request to /admin/login. Render the login
  // page (children) without the admin shell.
  if (!session) {
    return <>{children}</>
  }

  const allowed = SECTIONS.filter((s) => session.access[s].can_view) as Section[]

  return (
    <div className="flex flex-col md:flex-row min-h-[100svh] bg-[var(--background)]">
      <Sidebar
        email={session.profile.email}
        roleName={session.roleName}
        allowed={allowed}
      />
      <main className="flex-1 p-6 md:p-10 max-w-[1100px]">{children}</main>
    </div>
  )
}

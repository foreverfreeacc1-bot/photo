'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SECTION_LABELS, type Section } from '@/lib/types'

type NavItem = { href: string; label: string; section?: Section }

export default function Sidebar({
  email,
  roleName,
  allowed,
}: {
  email: string
  roleName: string | null
  allowed: Section[]
}) {
  const pathname = usePathname()
  const router = useRouter()

  const items: NavItem[] = (
    [
      { href: '/admin', label: 'Обзор' },
      { href: '/admin/content', label: SECTION_LABELS.content, section: 'content' },
      { href: '/admin/photos', label: SECTION_LABELS.photos, section: 'photos' },
      { href: '/admin/users', label: SECTION_LABELS.users, section: 'users' },
      { href: '/admin/roles', label: SECTION_LABELS.roles, section: 'roles' },
    ] as NavItem[]
  ).filter((i) => !i.section || allowed.includes(i.section))

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-full md:w-64 md:min-h-[100svh] md:sticky md:top-0 border-b md:border-b-0 md:border-r border-border bg-[var(--muted)] flex md:flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-2.5 mb-8">
          <span className="dot" />
          <span className="text-[15px] font-medium tracking-tight">CMS</span>
        </div>
        <nav className="flex md:flex-col gap-1">
          {items.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-[14px] transition-colors ${
                  active
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'hover:bg-[var(--accent)]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-6 border-t border-border">
        <p className="text-[13px] font-medium truncate">{email}</p>
        <p className="text-[12px] mb-3" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>
          {roleName ?? 'Администратор'}
        </p>
        <button
          onClick={logout}
          className="text-[13px] link-underline"
          type="button"
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}

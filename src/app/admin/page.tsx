import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SECTION_LABELS, SECTIONS, type Section } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const session = await requireAdmin()
  const supabase = createClient()

  const [{ count: photoCount }, { count: workCount }] = await Promise.all([
    supabase.from('photos').select('*', { count: 'exact', head: true }),
    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'work'),
  ])

  const cards: { section: Section; href: string; hint: string }[] = [
    { section: 'content', href: '/admin/content', hint: 'Редактировать все текстовые блоки (RU/EN)' },
    { section: 'photos', href: '/admin/photos', hint: 'Загрузка и управление галереей' },
    { section: 'users', href: '/admin/users', hint: 'Приглашение админов, роли' },
    { section: 'roles', href: '/admin/roles', hint: 'Настройка ролей и доступов' },
  ]
  const visible = cards.filter((c) => session.access[c.section].can_view)

  return (
    <div>
      <p className="section-label" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>Панель управления</p>
      <h1 className="text-[32px] font-medium tracking-tight mt-2 mb-1">
        Здравствуйте{session.profile.full_name ? `, ${session.profile.full_name}` : ''}
      </h1>
      <p className="text-[15px] mb-10" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>
        Роль: {session.roleName ?? 'Администратор'}. В библиотеке {photoCount ?? 0} фото ({workCount ?? 0} в «Услугах»).
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {visible.map((c) => (
          <Link
            key={c.section}
            href={c.href}
            className="card-hover block rounded-2xl border border-border p-6 bg-[var(--muted)]"
          >
            <h3 className="text-[20px] font-medium tracking-tight">{SECTION_LABELS[c.section]}</h3>
            <p className="text-[14px] mt-1.5" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>{c.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

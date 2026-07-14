'use client'

import { useState } from 'react'
import type { Profile, Role } from '@/lib/types'
import { inviteAdmin, updateAdmin } from '../actions'

type AdminRow = Profile & { role_name: string | null }

export default function UsersManager({
  admins,
  roles,
  canEdit,
  currentUserId,
}: {
  admins: AdminRow[]
  roles: Role[]
  canEdit: boolean
  currentUserId: string
}) {
  const [list, setList] = useState<AdminRow[]>(admins)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [roleId, setRoleId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onInvite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await inviteAdmin({
      email,
      full_name: fullName,
      role_id: roleId || null,
    })
    setBusy(false)
    if (res.ok) {
      setMsg('Приглашение отправлено на ' + email)
      setEmail('')
      setFullName('')
      setRoleId('')
      if (typeof window !== 'undefined')
        setTimeout(() => window.location.reload(), 800)
    } else {
      setMsg('Ошибка: ' + res.error)
    }
  }

  async function onRole(id: string, role_id: string) {
    setList((l) =>
      l.map((u) => (u.id === id ? { ...u, role_id: role_id || null } : u)),
    )
    const res = await updateAdmin(id, { role_id: role_id || null })
    if (!res.ok) setMsg('Ошибка: ' + res.error)
  }

  async function onActive(id: string, is_active: boolean) {
    const res = await updateAdmin(id, { is_active })
    if (res.ok) {
      setList((l) => l.map((u) => (u.id === id ? { ...u, is_active } : u)))
    } else {
      setMsg('Ошибка: ' + res.error)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="section-label" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>
          Доступ
        </p>
        <h1 className="text-[32px] font-medium tracking-tight mt-2">Администраторы</h1>
      </div>

      {msg && (
        <div className="mb-6 text-[14px] rounded-lg border border-border px-4 py-3 bg-[var(--muted)]">{msg}</div>
      )}

      {canEdit && (
        <form
          onSubmit={onInvite}
          className="rounded-2xl border border-border p-6 bg-[var(--muted)] mb-8"
        >
          <h2 className="text-[18px] font-medium tracking-tight mb-4">Пригласить администратора</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-11 px-3 rounded-lg border border-border bg-[var(--background)] text-[15px] outline-none focus:border-[var(--foreground)]"
            />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Имя"
              className="h-11 px-3 rounded-lg border border-border bg-[var(--background)] text-[15px] outline-none focus:border-[var(--foreground)]"
            />
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-border bg-[var(--background)] text-[15px] outline-none focus:border-[var(--foreground)]"
            >
              <option value="">Без роли</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary h-10 px-5 rounded-lg text-[14px] font-medium mt-4 disabled:opacity-50"
          >
            {busy ? 'Отправка…' : 'Отправить приглашение'}
          </button>
          <p className="text-[13px] mt-3" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>
            На email придёт ссылка для установки пароля.
          </p>
        </form>
      )}

      {list.length === 0 ? (
        <div className="text-[15px] rounded-2xl border border-dashed border-border px-6 py-16 text-center" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>
          Пока нет администраторов.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((u) => {
            const isSelf = u.id === currentUserId
            return (
              <div
                key={u.id}
                className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium truncate">
                    {u.full_name || u.email}
                    {isSelf && (
                      <span className="text-[12px] mono ml-2" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>это вы</span>
                    )}
                  </p>
                  <p className="text-[13px] mt-0.5 truncate" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>
                    {u.email} — {u.is_active ? 'активен' : 'отключён'}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-3 shrink-0">
                    <select
                      value={u.role_id ?? ''}
                      onChange={(e) => onRole(u.id, e.target.value)}
                      className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                    >
                      <option value="">Без роли</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onActive(u.id, !u.is_active)}
                      disabled={isSelf && u.is_active}
                      className="text-[13px] link-underline disabled:opacity-40"
                      style={u.is_active ? { color: '#e56458' } : undefined}
                    >
                      {u.is_active ? 'Отключить' : 'Включить'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

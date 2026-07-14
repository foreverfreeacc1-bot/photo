'use client'

import { useState } from 'react'
import { SECTIONS, SECTION_LABELS, type Role, type Section } from '@/lib/types'
import { saveRole, deleteRole } from '../actions'

type AccessMap = Record<Section, { can_view: boolean; can_edit: boolean }>

function emptyAccess(): AccessMap {
  return Object.fromEntries(
    SECTIONS.map((s) => [s, { can_view: false, can_edit: false }]),
  ) as AccessMap
}

export default function RolesManager({
  roles,
  accessByRole,
  canEdit,
}: {
  roles: Role[]
  accessByRole: Record<string, AccessMap>
  canEdit: boolean
}) {
  const [editing, setEditing] = useState<{
    id?: string
    name: string
    access: AccessMap
    is_system?: boolean
  } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function startNew() {
    setEditing({ name: '', access: emptyAccess() })
  }
  function startEdit(r: Role) {
    setEditing({ id: r.id, name: r.name, access: accessByRole[r.id] ?? emptyAccess(), is_system: r.is_system })
  }

  function toggle(section: Section, kind: 'can_view' | 'can_edit', val: boolean) {
    setEditing((e) => {
      if (!e) return e
      const next = { ...e.access, [section]: { ...e.access[section], [kind]: val } }
      // edit implies view
      if (kind === 'can_edit' && val) next[section].can_view = true
      if (kind === 'can_view' && !val) next[section].can_edit = false
      return { ...e, access: next }
    })
  }

  async function onSave() {
    if (!editing) return
    setBusy(true)
    setMsg(null)
    const res = await saveRole({
      id: editing.id,
      name: editing.name,
      access: SECTIONS.map((s) => ({
        section: s,
        can_view: editing.access[s].can_view,
        can_edit: editing.access[s].can_edit,
      })),
    })
    setBusy(false)
    if (res.ok) {
      setMsg('Сохранено.')
      setEditing(null)
      // Full refresh so server data reloads.
      if (typeof window !== 'undefined') window.location.reload()
    } else {
      setMsg('Ошибка: ' + res.error)
    }
  }

  async function onDelete(r: Role) {
    if (!confirm(`Удалить роль «${r.name}»?`)) return
    const res = await deleteRole(r.id)
    if (res.ok && typeof window !== 'undefined') window.location.reload()
    else setMsg('Ошибка: ' + res.error)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="section-label" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>Доступ</p>
          <h1 className="text-[32px] font-medium tracking-tight mt-2">Роли и доступы</h1>
        </div>
        {canEdit && !editing && (
          <button type="button" onClick={startNew} className="btn-primary h-10 px-5 rounded-lg text-[14px] font-medium">+ Новая роль</button>
        )}
      </div>

      {msg && (
        <div className="mb-6 text-[14px] rounded-lg border border-border px-4 py-3 bg-[var(--muted)]">{msg}</div>
      )}

      {editing ? (
        <div className="rounded-2xl border border-border p-6 bg-[var(--muted)]">
          <label className="grid gap-1.5 mb-6 max-w-sm">
            <span className="section-label">Название роли</span>
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="h-11 px-3 rounded-lg border border-border bg-[var(--background)] text-[15px] outline-none focus:border-[var(--foreground)]"
            />
          </label>

          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 font-medium">Раздел</th>
                <th className="py-2 font-medium w-28 text-center">Просмотр</th>
                <th className="py-2 font-medium w-28 text-center">Редактирование</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((s) => (
                <tr key={s} className="border-b border-border">
                  <td className="py-3">{SECTION_LABELS[s]}</td>
                  <td className="py-3 text-center">
                    <input type="checkbox" checked={editing.access[s].can_view} onChange={(e) => toggle(s, 'can_view', e.target.checked)} />
                  </td>
                  <td className="py-3 text-center">
                    <input type="checkbox" checked={editing.access[s].can_edit} onChange={(e) => toggle(s, 'can_edit', e.target.checked)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-4 mt-6">
            <button type="button" onClick={onSave} disabled={busy} className="btn-primary h-10 px-5 rounded-lg text-[14px] font-medium disabled:opacity-50">{busy ? 'Сохранение…' : 'Сохранить'}</button>
            <button type="button" onClick={() => setEditing(null)} className="text-[14px] link-underline">Отмена</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {roles.map((r) => {
            const acc = accessByRole[r.id] ?? emptyAccess()
            const granted = SECTIONS.filter((s) => acc[s].can_view || acc[s].can_edit)
            return (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[16px] font-medium">
                      {r.name}
                      {r.is_system && <span className="text-[12px] mono ml-2" style={{ color: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }}>системная</span>}
                    </p>
                    <p className="text-[13px] mt-1" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>
                      {granted.length ? granted.map((s) => SECTION_LABELS[s] + (acc[s].can_edit ? ' (ред.)' : '')).join(', ') : 'Без доступа'}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-4 shrink-0">
                      <button type="button" onClick={() => startEdit(r)} className="text-[13px] link-underline">Изменить</button>
                      {!r.is_system && (
                        <button type="button" onClick={() => onDelete(r)} className="text-[13px] link-underline" style={{ color: '#e56458' }}>Удалить</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

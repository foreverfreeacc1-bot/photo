'use client'

import { useMemo, useState } from 'react'
import { CONTENT_FIELDS } from '@/lib/content-defaults'
import { saveContent } from '../actions'

type Values = Record<string, { ru: string; en: string }>

const SECTION_TITLES: Record<string, string> = {
  identity: 'Идентичность',
  hero: 'Первый экран (Hero)',
  marquee: 'Бегущая строка',
  work: 'Услуги',
  art: 'Портфолио',
  about: 'О себе',
  contact: 'Контакты',
  footer: 'Подвал',
}

export default function ContentEditor({
  initialValues,
  canEdit,
}: {
  initialValues: Values
  canEdit: boolean
}) {
  const [values, setValues] = useState<Values>(initialValues)
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [locale, setLocale] = useState<'ru' | 'en'>('ru')

  const grouped = useMemo(() => {
    const g: Record<string, typeof CONTENT_FIELDS> = {}
    for (const f of CONTENT_FIELDS) {
      ;(g[f.section] ??= []).push(f)
    }
    return g
  }, [])

  function onChange(key: string, loc: 'ru' | 'en', value: string) {
    setValues((v) => ({ ...v, [key]: { ...v[key], [loc]: value } }))
    setDirty((d) => new Set(d).add(`${key}:${loc}`))
  }

  async function onSave() {
    setSaving(true)
    setMsg(null)
    const updates = Array.from(dirty).map((token) => {
      const [key, loc] = token.split(':') as [string, 'ru' | 'en']
      const field = CONTENT_FIELDS.find((f) => f.key === key)
      return {
        key,
        locale: loc,
        value: values[key]?.[loc] ?? '',
        section: field?.section ?? 'misc',
      }
    })
    const res = await saveContent(updates)
    setSaving(false)
    if (res.ok) {
      setDirty(new Set())
      setMsg('Сохранено. Изменения появятся на сайте в течение минуты.')
    } else {
      setMsg('Ошибка: ' + res.error)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="section-label" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>Содержимое</p>
          <h1 className="text-[32px] font-medium tracking-tight mt-2">Тексты сайта</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[13px] mono border border-border rounded-lg p-1">
            {(['ru', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`px-3 py-1.5 rounded-md transition-colors ${locale === l ? 'bg-[var(--foreground)] text-[var(--background)]' : ''}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving || dirty.size === 0}
              className="btn-primary h-10 px-5 rounded-lg text-[14px] font-medium disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : `Сохранить${dirty.size ? ` (${dirty.size})` : ''}`}
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="mb-6 text-[14px] rounded-lg border border-border px-4 py-3 bg-[var(--muted)]">{msg}</div>
      )}
      {!canEdit && (
        <div className="mb-6 text-[14px] rounded-lg border border-border px-4 py-3 bg-[var(--muted)]">
          У вас только право просмотра этого раздела.
        </div>
      )}

      <div className="flex flex-col gap-10">
        {Object.entries(grouped).map(([section, fields]) => (
          <section key={section}>
            <h2 className="text-[18px] font-medium tracking-tight mb-4 pb-2 border-b border-border">
              {SECTION_TITLES[section] ?? section}
            </h2>
            <div className="flex flex-col gap-4">
              {fields.map((f) => {
                const val = values[f.key]?.[locale] ?? ''
                return (
                  <label key={f.key} className="grid md:grid-cols-[220px_1fr] gap-2 md:gap-4 md:items-start">
                    <span className="text-[13px] pt-2" style={{ color: 'color-mix(in oklch, var(--foreground) 60%, transparent)' }}>{f.label}</span>
                    {f.multiline ? (
                      <textarea
                        value={val}
                        disabled={!canEdit}
                        onChange={(e) => onChange(f.key, locale, e.target.value)}
                        rows={3}
                        className="px-3 py-2 rounded-lg border border-border bg-[var(--background)] text-[15px] outline-none focus:border-[var(--foreground)] transition-colors resize-y disabled:opacity-60"
                      />
                    ) : (
                      <input
                        value={val}
                        disabled={!canEdit}
                        onChange={(e) => onChange(f.key, locale, e.target.value)}
                        className="h-11 px-3 rounded-lg border border-border bg-[var(--background)] text-[15px] outline-none focus:border-[var(--foreground)] transition-colors disabled:opacity-60"
                      />
                    )}
                  </label>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

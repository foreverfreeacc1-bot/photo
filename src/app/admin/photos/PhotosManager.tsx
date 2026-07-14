'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { createPhoto, updatePhoto, deletePhoto } from '../actions'
import type { Photo } from '@/lib/types'

type PhotoWithUrl = Photo & { url: string }

export default function PhotosManager({
  initialPhotos,
  canEdit,
  bucket,
}: {
  initialPhotos: PhotoWithUrl[]
  canEdit: boolean
  bucket: string
}) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>(initialPhotos)
  const [tab, setTab] = useState<'work' | 'art'>('work')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const list = photos.filter((p) => p.category === tab)

  async function refresh() {
    const supabase = createClient()
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    if (data) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
      setPhotos(
        data.map((p: Photo) => ({
          ...p,
          url: `${base}/storage/v1/object/public/${bucket}/${p.storage_path}`,
        })),
      )
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setMsg(null)
    const supabase = createClient()

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${tab}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (upErr) throw new Error(upErr.message)

        const res = await createPhoto({
          title: file.name.replace(/\.[^.]+$/, ''),
          category: tab,
          storage_path: path,
          sort_order: list.length,
          published: true,
        })
        if (!res.ok) throw new Error(res.error)
      }
      await refresh()
      setMsg('Загружено. Заполните название и описание ниже.')
    } catch (err) {
      setMsg('Ошибка загрузки: ' + (err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function onField(id: string, patch: Partial<Photo>) {
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  async function onSaveRow(p: PhotoWithUrl) {
    setMsg(null)
    const res = await updatePhoto(p.id, {
      title: p.title,
      technique: p.technique,
      year: p.year,
      alt: p.alt,
      sort_order: p.sort_order,
      published: p.published,
      category: p.category,
    })
    setMsg(res.ok ? 'Сохранено.' : 'Ошибка: ' + res.error)
  }

  async function onDelete(p: PhotoWithUrl) {
    if (!confirm(`Удалить «${p.title}»?`)) return
    const res = await deletePhoto(p.id, p.storage_path)
    if (res.ok) {
      setPhotos((ps) => ps.filter((x) => x.id !== p.id))
    } else {
      setMsg('Ошибка: ' + res.error)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="section-label" style={{ color: 'color-mix(in oklch, var(--foreground) 50%, transparent)' }}>Галерея</p>
          <h1 className="text-[32px] font-medium tracking-tight mt-2">Фотографии</h1>
        </div>
        {canEdit && (
          <label className="btn-primary h-10 px-5 rounded-lg text-[14px] font-medium inline-flex items-center cursor-pointer disabled:opacity-50">
            {uploading ? 'Загрузка…' : '+ Загрузить фото'}
            <input type="file" accept="image/*" multiple hidden onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 text-[13px] mono border border-border rounded-lg p-1 w-fit mb-6">
        {(['work', 'art'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            className={`px-4 py-1.5 rounded-md transition-colors ${tab === c ? 'bg-[var(--foreground)] text-[var(--background)]' : ''}`}
          >
            {c === 'work' ? 'Услуги' : 'Портфолио'}
          </button>
        ))}
      </div>

      {msg && (
        <div className="mb-6 text-[14px] rounded-lg border border-border px-4 py-3 bg-[var(--muted)]">{msg}</div>
      )}

      {list.length === 0 ? (
        <div className="text-[15px] rounded-2xl border border-dashed border-border px-6 py-16 text-center" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>
          Пока нет фотографий в этом разделе.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((p) => (
            <div key={p.id} className="grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-border p-4 bg-[var(--muted)]">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[var(--accent)]">
                <Image src={p.url} alt={p.alt || p.title} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={p.title}
                    disabled={!canEdit}
                    onChange={(e) => onField(p.id, { title: e.target.value })}
                    placeholder="Название"
                    className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                  />
                  <input
                    value={p.technique ?? ''}
                    disabled={!canEdit}
                    onChange={(e) => onField(p.id, { technique: e.target.value })}
                    placeholder="Жанр / техника"
                    className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    value={p.year ?? ''}
                    disabled={!canEdit}
                    onChange={(e) => onField(p.id, { year: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Год"
                    className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                  />
                  <input
                    type="number"
                    value={p.sort_order}
                    disabled={!canEdit}
                    onChange={(e) => onField(p.id, { sort_order: Number(e.target.value) })}
                    placeholder="Порядок"
                    className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                  />
                  <select
                    value={p.category}
                    disabled={!canEdit}
                    onChange={(e) => onField(p.id, { category: e.target.value as 'work' | 'art' })}
                    className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                  >
                    <option value="work">Услуги</option>
                    <option value="art">Портфолио</option>
                  </select>
                </div>
                <input
                  value={p.alt ?? ''}
                  disabled={!canEdit}
                  onChange={(e) => onField(p.id, { alt: e.target.value })}
                  placeholder="Alt-текст (для доступности)"
                  className="h-10 px-3 rounded-lg border border-border bg-[var(--background)] text-[14px] outline-none focus:border-[var(--foreground)]"
                />
                {canEdit && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={p.published}
                        onChange={(e) => onField(p.id, { published: e.target.checked })}
                      />
                      Опубликовано
                    </label>
                    <button type="button" onClick={() => onSaveRow(p)} className="btn-primary h-9 px-4 rounded-lg text-[13px] font-medium">Сохранить</button>
                    <button type="button" onClick={() => onDelete(p)} className="text-[13px] link-underline" style={{ color: '#e56458' }}>Удалить</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

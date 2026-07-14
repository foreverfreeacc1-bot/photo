import { createClient } from '@/lib/supabase/server'
import { LOCALES, type Locale } from '@/lib/i18n'
import { mergeContent, type ContentMap } from '@/lib/content-defaults'
import type { PhotoView } from '@/components/site/SiteRoot'
import type { Photo } from '@/lib/types'

// Build a public URL for a stored photo path.
export function photoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucket = process.env.NEXT_PUBLIC_PHOTOS_BUCKET || 'photos'
  if (!base) return storagePath
  return `${base}/storage/v1/object/public/${bucket}/${storagePath}`
}

function toView(p: Photo): PhotoView {
  return {
    id: p.id,
    title: p.title,
    alt: p.alt || p.title,
    technique: p.technique,
    year: p.year,
    url: photoUrl(p.storage_path),
  }
}

// Fetch all public site data. Resilient: if Supabase is unreachable or empty,
// falls back to bundled defaults so the site still renders.
export async function getSiteData(): Promise<{
  content: Record<Locale, ContentMap>
  photos: { work: PhotoView[]; art: PhotoView[] }
}> {
  const empty: Record<Locale, { key: string; value: string }[]> = {
    ru: [],
    en: [],
  }
  let contentRows = empty
  let photos: Photo[] = []

  try {
    const supabase = createClient()
    const [{ data: rows }, { data: ph }] = await Promise.all([
      supabase.from('site_content').select('key, value, locale'),
      supabase
        .from('photos')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true }),
    ])
    if (rows) {
      for (const r of rows as { key: string; value: string; locale: Locale }[]) {
        if (LOCALES.includes(r.locale)) contentRows[r.locale].push(r)
      }
    }
    if (ph) photos = ph as Photo[]
  } catch {
    // Swallow — defaults will be used.
  }

  const content = {
    ru: mergeContent('ru', contentRows.ru),
    en: mergeContent('en', contentRows.en),
  } as Record<Locale, ContentMap>

  return {
    content,
    photos: {
      work: photos.filter((p) => p.category === 'work').map(toView),
      art: photos.filter((p) => p.category === 'art').map(toView),
    },
  }
}

import { requireSection } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CONTENT_DEFAULTS } from '@/lib/content-defaults'
import ContentEditor from './ContentEditor'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const session = await requireSection('content')
  const supabase = createClient()
  const { data } = await supabase
    .from('site_content')
    .select('key, locale, value')

  // Build current values, falling back to defaults.
  const values: Record<string, { ru: string; en: string }> = {}
  for (const key of Object.keys(CONTENT_DEFAULTS.ru)) {
    values[key] = { ru: CONTENT_DEFAULTS.ru[key], en: CONTENT_DEFAULTS.en[key] ?? '' }
  }
  const rows = (data ?? []) as { key: string; locale: string; value: string }[]
  for (const row of rows) {
    if (!values[row.key]) values[row.key] = { ru: '', en: '' }
    if (row.locale === 'ru') values[row.key].ru = row.value
    else if (row.locale === 'en') values[row.key].en = row.value
  }

  return (
    <ContentEditor initialValues={values} canEdit={session.access.content.can_edit} />
  )
}

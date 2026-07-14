import { requireSection } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { photoUrl } from '@/lib/data'
import type { Photo } from '@/lib/types'
import PhotosManager from './PhotosManager'

export const dynamic = 'force-dynamic'

export default async function PhotosPage() {
  const session = await requireSection('photos')
  const supabase = createClient()
  const { data } = await supabase
    .from('photos')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  const photos = (data ?? []).map((p: Photo) => ({
    ...p,
    url: photoUrl(p.storage_path),
  }))

  return (
    <PhotosManager
      initialPhotos={photos}
      canEdit={session.access.photos.can_edit}
      bucket={process.env.NEXT_PUBLIC_PHOTOS_BUCKET || 'photos'}
    />
  )
}

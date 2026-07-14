import SplitLanding from '@/components/site/SplitLanding'
import { getSiteData } from '@/lib/data'

// The root route is always the WORK / ART chooser (no navigation menu).
export const revalidate = 60

const FALLBACK_WORK =
  'https://picsum.photos/seed/tdmitrieva-work-design/1200/1600'
const FALLBACK_ART =
  'https://picsum.photos/seed/tdmitrieva-art-painting/1200/1600'

export default async function HomePage() {
  const { content, photos } = await getSiteData()
  const siteName = content.ru['site.name'] || 'TDmitrieva'
  const workImg = photos.work[0]?.url ?? FALLBACK_WORK
  const artImg = photos.art[0]?.url ?? FALLBACK_ART

  return <SplitLanding siteName={siteName} workImg={workImg} artImg={artImg} />
}

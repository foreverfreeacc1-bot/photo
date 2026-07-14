import SiteRoot from '@/components/site/SiteRoot'
import { getSiteData } from '@/lib/data'

// Revalidate the public site every 60s so CMS edits appear without a redeploy.
export const revalidate = 60

export default async function HomePage() {
  const { content, photos } = await getSiteData()
  return <SiteRoot content={content} photos={photos} />
}

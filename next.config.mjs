/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined
  } catch {
    return undefined
  }
})()

const nextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: 'https', hostname: supabaseHost }]
        : []),
      // Fallback so any *.supabase.co storage bucket works out of the box.
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig

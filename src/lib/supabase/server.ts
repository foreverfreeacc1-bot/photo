import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSbClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side Supabase client bound to the request cookies (RLS enforced).
// Use inside Server Components, Route Handlers and Server Actions.
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component: middleware refreshes the session.
          }
        },
      },
    },
  )
}

// Service-role client. SERVER ONLY. Bypasses RLS — use only for trusted admin
// operations after you have verified the caller's permissions.
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

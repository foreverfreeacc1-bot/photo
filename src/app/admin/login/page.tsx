'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Неверный email или пароль')
      return
    }
    router.replace(next)
    router.refresh()
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-6 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <span className="dot" />
          <span className="text-[15px] font-medium tracking-tight">Панель управления</span>
        </div>
        <h1 className="text-[28px] font-medium tracking-tight mb-1">Вход</h1>
        <p className="text-[14px] mb-8" style={{ color: 'color-mix(in oklch, var(--foreground) 55%, transparent)' }}>
          Войдите, чтобы редактировать сайт.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="section-label">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-3 rounded-lg border border-border bg-[var(--muted)] text-[15px] outline-none focus:border-[var(--foreground)] transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="section-label">Пароль</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 px-3 rounded-lg border border-border bg-[var(--muted)] text-[15px] outline-none focus:border-[var(--foreground)] transition-colors"
            />
          </label>
          {error && (
            <p className="text-[13px]" style={{ color: '#e56458' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-11 rounded-lg text-[14px] font-medium disabled:opacity-60"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </main>
  )
}

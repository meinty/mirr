'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getClientLocale } from '@/lib/locale-client'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Locale } from '@/lib/translations'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locale, setLocale] = useState<Locale>('nl')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setLocale(getClientLocale())
  }, [])

  const t = translations[locale]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="text-xl font-semibold tracking-tight">Mirr</Link>
          <LanguageSwitcher current={locale} />
        </div>
        <h1 className="text-2xl font-semibold mb-2">{t.loginTitle}</h1>
        <p className="text-gray-500 text-sm mb-8">
          {t.loginNoAccount} <Link href="/auth/signup" className="text-black underline">{t.loginNoAccountLink}</Link>
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.loginEmailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.loginPasswordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? t.loginLoading : t.loginSubmit}
          </button>
        </form>
      </div>
    </main>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getClientLocale } from '@/lib/locale-client'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Locale } from '@/lib/translations'

export default function NewAuditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locale, setLocale] = useState<Locale>('nl')

  const [form, setForm] = useState({
    brand_name: '',
    category: '',
    positioning_what: '',
    positioning_who: '',
    positioning_how: '',
    competitor_1: '',
    competitor_2: '',
  })

  useEffect(() => {
    setLocale(getClientLocale())
  }, [])

  const t = translations[locale]

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < 1) {
      setError(t.errorNoCredits)
      setLoading(false)
      return
    }

    const positioningLabel = locale === 'en'
      ? `What: ${form.positioning_what}\nFor whom: ${form.positioning_who}\nCharacter: ${form.positioning_how}`
      : `Wat: ${form.positioning_what}\nVoor wie: ${form.positioning_who}\nKarakter: ${form.positioning_how}`

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        brand_name: form.brand_name,
        category: form.category,
        positioning: positioningLabel,
        competitors: [form.competitor_1, form.competitor_2].filter(Boolean),
        status: 'queued',
      })
      .select()
      .single()

    if (auditError || !audit) {
      setError(t.errorGeneric)
      setLoading(false)
      return
    }

    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)

    fetch('/api/audit/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId: audit.id, language: locale }),
    })

    router.push(`/dashboard/audits/${audit.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <span className="text-lg font-semibold tracking-tight">Mirr</span>
        <LanguageSwitcher current={locale} />
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-semibold mb-2">{t.newAuditTitle}</h1>
        <p className="text-gray-500 text-sm mb-10">{t.newAuditSub}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.brandNameLabel}</label>
            <input
              name="brand_name"
              value={form.brand_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={t.brandNamePlaceholder}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t.categoryLabel}</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={t.categoryPlaceholder}
              required
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.whatLabel} <span className="text-gray-400 font-normal">{t.whatHint}</span>
              </label>
              <input
                name="positioning_what"
                value={form.positioning_what}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.whatPlaceholder}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.whoLabel} <span className="text-gray-400 font-normal">{t.whoHint}</span>
              </label>
              <input
                name="positioning_who"
                value={form.positioning_who}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.whoPlaceholder}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.howBrandLabel} <span className="text-gray-400 font-normal">{t.howBrandHint}</span>
              </label>
              <input
                name="positioning_how"
                value={form.positioning_how}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.howBrandPlaceholder}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.competitor1Label}</label>
              <input
                name="competitor_1"
                value={form.competitor_1}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.competitor1Placeholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.competitor2Label}</label>
              <input
                name="competitor_2"
                value={form.competitor_2}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.competitor2Placeholder}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="pt-2 flex justify-between items-center">
            <p className="text-gray-400 text-xs">{t.creditCost}</p>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? t.submitAuditLoading : t.submitAudit}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

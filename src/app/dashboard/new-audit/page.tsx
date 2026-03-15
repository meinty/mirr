'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getClientLocale } from '@/lib/locale-client'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Locale } from '@/lib/translations'

const MAX_COMPETITORS = 5

export default function NewAuditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [prefilling, setPrefilling] = useState(false)
  const [error, setError] = useState('')
  const [locale, setLocale] = useState<Locale>('nl')

  const [form, setForm] = useState({
    brand_name: '',
    website_url: '',
    category: '',
    region: '',
    positioning_what: '',
    positioning_who: '',
    positioning_how: '',
  })

  const [competitors, setCompetitors] = useState(['', ''])

  useEffect(() => {
    const loc = getClientLocale()
    setLocale(loc)
    setForm(prev => ({ ...prev, region: loc === 'en' ? 'Global' : 'Nederland' }))
  }, [])

  const t = translations[locale]

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCompetitorChange(index: number, value: string) {
    setCompetitors(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function addCompetitor() {
    if (competitors.length < MAX_COMPETITORS) {
      setCompetitors(prev => [...prev, ''])
    }
  }

  function removeCompetitor(index: number) {
    if (competitors.length > 1) {
      setCompetitors(prev => prev.filter((_, i) => i !== index))
    }
  }

  async function handlePrefill() {
    if (!form.brand_name.trim()) return
    setPrefilling(true)
    try {
      const res = await fetch('/api/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: form.brand_name,
          websiteUrl: form.website_url,
          language: locale,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setForm(prev => ({
        ...prev,
        website_url: data.website_url || prev.website_url,
        category: data.category || prev.category,
        region: data.region || prev.region,
        positioning_what: data.positioning_what || prev.positioning_what,
        positioning_who: data.positioning_who || prev.positioning_who,
        positioning_how: data.positioning_how || prev.positioning_how,
      }))
      if (data.competitors && data.competitors.length > 0) {
        setCompetitors(data.competitors.slice(0, MAX_COMPETITORS))
      }
    } catch {
      setError(t.errorGeneric)
    } finally {
      setPrefilling(false)
    }
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

    const filteredCompetitors = competitors.filter(c => c.trim())

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        brand_name: form.brand_name,
        website_url: form.website_url || null,
        category: form.category,
        region: form.region || null,
        positioning: positioningLabel,
        competitors: filteredCompetitors,
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
            <div className="flex gap-2">
              <input
                name="brand_name"
                value={form.brand_name}
                onChange={handleChange}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.brandNamePlaceholder}
                required
              />
              <button
                type="button"
                onClick={handlePrefill}
                disabled={prefilling || !form.brand_name.trim()}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {prefilling ? t.prefillLoading : t.prefillButton}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t.websiteLabel} <span className="text-gray-400 font-normal">{t.websiteHint}</span>
            </label>
            <input
              name="website_url"
              value={form.website_url}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={t.websitePlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.regionLabel}</label>
              <input
                name="region"
                value={form.region}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={t.regionPlaceholder}
              />
            </div>
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

          <div>
            <label className="block text-sm font-medium mb-1.5">{t.competitorsLabel}</label>
            <div className="space-y-2">
              {competitors.map((comp, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={comp}
                    onChange={e => handleCompetitorChange(i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder={`${t.competitorPlaceholder} ${i + 1}`}
                  />
                  {competitors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompetitor(i)}
                      className="px-3 py-2.5 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              {competitors.length < MAX_COMPETITORS && (
                <button
                  type="button"
                  onClick={addCompetitor}
                  className="text-sm text-gray-500 hover:text-gray-700 py-1"
                >
                  + {t.addCompetitor}
                </button>
              )}
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

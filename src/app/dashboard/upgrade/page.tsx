'use client'

import { PLANS, CREDIT_PACKAGES } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getClientLocale } from '@/lib/locale-client'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Locale } from '@/lib/translations'

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [locale, setLocale] = useState<Locale>('nl')
  const supabase = createClient()

  useEffect(() => {
    setLocale(getClientLocale())
    supabase.from('profiles').select('plan').single().then(({ data }) => {
      if (data?.plan) setCurrentPlan(data.plan)
    })
  }, [supabase])

  const t = translations[locale]

  const pkgDescriptions: Record<string, string> = {
    single: t.pkg1Desc,
    five: t.pkg5Desc,
    ten: t.pkg10Desc,
  }

  const planDescriptions: Record<string, string> = {
    free: t.planFreeDesc,
    pro: t.planProDesc,
    agency: t.planAgencyDesc,
  }

  const planFeatures: Record<string, readonly string[]> = {
    free: t.planFreeFeatures,
    pro: t.planProFeatures,
    agency: t.planAgencyFeatures,
  }

  async function handleCheckout(payload: { planId?: string; packageId?: string }) {
    const key = payload.planId ?? payload.packageId ?? ''
    setLoading(key)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 text-sm hover:text-gray-600">Dashboard</Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium">{locale === 'nl' ? 'Credits & plannen' : 'Credits & plans'}</span>
        </div>
        <LanguageSwitcher current={locale} />
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Credits */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold mb-1">{t.upgradeCreditsTitle}</h2>
          <p className="text-gray-500 text-sm mb-6">{t.upgradeCreditsSub}</p>

          <div className="grid grid-cols-3 gap-4">
            {CREDIT_PACKAGES.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold mb-1">{pkg.name}</h3>
                <p className="text-2xl font-semibold mb-0.5">€{(pkg.price / 100).toLocaleString('nl-NL')}</p>
                <p className="text-xs text-gray-400 mb-1">€{(pkg.pricePerCredit / 100).toFixed(2).replace('.', ',')} {t.upgradePerAudit}</p>
                <p className="text-sm text-gray-400 mb-5">{pkgDescriptions[pkg.id] ?? pkg.description}</p>
                <button
                  onClick={() => handleCheckout({ packageId: pkg.id })}
                  disabled={loading === pkg.id}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading === pkg.id ? t.upgradeBuying : t.upgradeBuy}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-14">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t.upgradeOr}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Subscriptions */}
        <div>
          <h2 className="text-lg font-semibold mb-1">{t.upgradeSubTitle}</h2>
          <p className="text-gray-500 text-sm mb-6">{t.upgradeSubSub}</p>

          <div className="grid grid-cols-3 gap-4">
            {Object.values(PLANS).map(plan => {
              const isCurrent = currentPlan === plan.id
              const isPro = plan.id === 'pro'
              const pricePerCredit = plan.price > 0
                ? (plan.price / plan.creditsPerMonth / 100).toFixed(2).replace('.', ',')
                : null

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-6 flex flex-col ${isPro ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}
                >
                  {isPro && (
                    <span className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">{t.upgradeMostPopular}</span>
                  )}
                  <h3 className="font-semibold mb-1">{plan.name}</h3>
                  <p className={`text-2xl font-semibold mb-0.5 ${isPro ? 'text-white' : ''}`}>
                    {plan.price === 0 ? t.upgradeFree : `€${(plan.price / 100).toLocaleString('nl-NL')}/mo`}
                  </p>
                  {pricePerCredit && (
                    <p className="text-xs mb-1 text-gray-400">€{pricePerCredit} {t.upgradePerAudit}</p>
                  )}
                  <p className="text-sm mb-5 flex-1 text-gray-400">{planDescriptions[plan.id] ?? plan.description}</p>

                  <ul className={`space-y-1.5 mb-6 ${isPro ? 'text-gray-300' : 'text-gray-500'}`}>
                    {(planFeatures[plan.id] ?? plan.features).map((f: string) => (
                      <li key={f} className="text-xs flex gap-1.5">
                        <span className="shrink-0">·</span>{f}
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'free' ? (
                    <div className="w-full py-2 rounded-lg text-sm font-medium text-center bg-gray-100 text-gray-400">
                      {isCurrent ? t.upgradeCurrent : t.upgradeFree}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout({ planId: plan.id })}
                      disabled={loading === plan.id || isCurrent}
                      className={`w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${isPro ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      {isCurrent ? t.upgradeCurrent : loading === plan.id ? t.upgradeBuying : t.upgradeGoTo(plan.name)}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-10">{t.upgradeNote}</p>
      </div>
    </main>
  )
}

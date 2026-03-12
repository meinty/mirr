'use client'

import { PLANS, CREDIT_PACKAGES } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('plan').single().then(({ data }) => {
      if (data?.plan) setCurrentPlan(data.plan)
    })
  }, [supabase])

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
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 text-sm hover:text-gray-600">Dashboard</Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm font-medium">Credits & plannen</span>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">

        {/* Sectie 1: Losse credits */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold mb-1">Credits bijkopen</h2>
          <p className="text-gray-500 text-sm mb-6">Voor af en toe een audit. Credits verlopen niet en werken als een voucher -- gebruik ze wanneer je wilt.</p>

          <div className="grid grid-cols-3 gap-4">
            {CREDIT_PACKAGES.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold mb-1">{pkg.name}</h3>
                <p className="text-2xl font-semibold mb-0.5">€{(pkg.price / 100).toLocaleString('nl-NL')}</p>
                <p className="text-xs text-gray-400 mb-1">€{(pkg.pricePerCredit / 100).toFixed(2).replace('.', ',')} per audit</p>
                <p className="text-sm text-gray-400 mb-5">{pkg.description}</p>
                <button
                  onClick={() => handleCheckout({ packageId: pkg.id })}
                  disabled={loading === pkg.id}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading === pkg.id ? 'Bezig...' : 'Kopen'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-14">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">of abonneer voor minder per audit</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Sectie 2: Abonnementen */}
        <div>
          <h2 className="text-lg font-semibold mb-1">Maandelijks abonnement</h2>
          <p className="text-gray-500 text-sm mb-6">Credits worden elke maand aangevuld. Goedkoper per audit, altijd opzegbaar.</p>

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
                  className={`rounded-xl border p-6 flex flex-col ${
                    isPro ? 'bg-black text-white border-black' : 'bg-white border-gray-200'
                  }`}
                >
                  {isPro && (
                    <span className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Populairste keuze</span>
                  )}
                  <h3 className="font-semibold mb-1">{plan.name}</h3>
                  <p className={`text-2xl font-semibold mb-0.5 ${isPro ? 'text-white' : ''}`}>
                    {plan.price === 0 ? 'Gratis' : `€${(plan.price / 100).toLocaleString('nl-NL')}/mo`}
                  </p>
                  {pricePerCredit && (
                    <p className={`text-xs mb-1 ${isPro ? 'text-gray-400' : 'text-gray-400'}`}>€{pricePerCredit} per audit</p>
                  )}
                  <p className={`text-sm mb-5 flex-1 ${isPro ? 'text-gray-400' : 'text-gray-400'}`}>{plan.description}</p>

                  <ul className={`space-y-1.5 mb-6 ${isPro ? 'text-gray-300' : 'text-gray-500'}`}>
                    {plan.features.map(f => (
                      <li key={f} className="text-xs flex gap-1.5">
                        <span className="shrink-0">--</span>{f}
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'free' ? (
                    <div className="w-full py-2 rounded-lg text-sm font-medium text-center bg-gray-100 text-gray-400">
                      {isCurrent ? 'Huidig plan' : 'Gratis'}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout({ planId: plan.id })}
                      disabled={loading === plan.id || isCurrent}
                      className={`w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                        isPro ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {isCurrent ? 'Huidig plan' : loading === plan.id ? 'Bezig...' : `Naar ${plan.name}`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-10">
          Betaling via Stripe. Losse credits verlopen niet. Abonnementen zijn maandelijks opzegbaar.
        </p>
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/plans'
import { getLocale } from '@/lib/locale'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: audits }, { data: profile }, locale] = await Promise.all([
    supabase.from('audits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('credits, plan').eq('id', user.id).single(),
    getLocale(),
  ])

  const t = translations[locale]
  const credits = profile?.credits ?? 0
  const planId = (profile?.plan ?? 'free') as PlanId
  const plan = PLANS[planId]
  const isFree = planId === 'free'

  function statusLabel(status: string) {
    if (status === 'completed') return t.statusCompleted
    if (status === 'processing') return t.statusProcessing
    return t.statusQueued
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <span className="text-lg font-semibold tracking-tight">Mirr</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{t.dashAuditsRemaining(credits)}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isFree ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}>
            {plan.name}
          </span>
          {isFree && (
            <Link href="/dashboard/upgrade" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              Upgrade
            </Link>
          )}
          <LanguageSwitcher current={locale} />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold">{t.dashTitle}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.dashCount(audits?.length ?? 0)}</p>
          </div>
          {credits > 0 ? (
            <Link href="/dashboard/new-audit" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
              {t.dashNewAudit}
            </Link>
          ) : (
            <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
              {isFree ? t.dashUpgradeMore : t.dashGetAudits}
            </Link>
          )}
        </div>

        {isFree && credits === 0 && (audits?.length ?? 0) > 0 && (
          <div className="bg-black text-white rounded-xl p-6 mb-6 flex justify-between items-center">
            <div>
              <p className="font-semibold mb-1">{t.dashFreeUsedTitle}</p>
              <p className="text-gray-400 text-sm">{t.dashFreeUsedBody}</p>
            </div>
            <Link href="/dashboard/upgrade" className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 shrink-0 ml-6">
              {t.dashUpgradePro}
            </Link>
          </div>
        )}

        {!audits || audits.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <h2 className="font-semibold mb-2">{t.dashEmptyTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">{t.dashEmptyBody}</p>
            <Link href="/dashboard/new-audit" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
              {t.dashEmptyCta}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit: { id: string; brand_name: string; status: string; created_at: string }) => (
              <Link
                key={audit.id}
                href={`/dashboard/audits/${audit.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{audit.brand_name}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {new Date(audit.created_at).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    audit.status === 'completed' ? 'bg-green-50 text-green-700' :
                    audit.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {statusLabel(audit.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

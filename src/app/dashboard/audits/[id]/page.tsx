import { createClient } from '@/lib/supabase/server'
import { type PlanId } from '@/lib/plans'
import { getLocale } from '@/lib/locale'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import AuditStatus from './AuditStatus'

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: audit }, { data: profile }, locale] = await Promise.all([
    supabase.from('audits').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    getLocale(),
  ])

  if (!audit) notFound()

  const t = translations[locale]
  const planId = (profile?.plan ?? 'free') as PlanId
  const isPro = planId !== 'free'

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 text-sm hover:text-gray-600">Dashboard</Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium">{audit.brand_name}</span>
        </div>
        <LanguageSwitcher current={locale} />
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Status */}
        {audit.status !== 'completed' && (
          <AuditStatus auditId={audit.id} brandName={audit.brand_name} createdAt={audit.created_at} locale={locale} />
        )}

        {audit.status === 'completed' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{audit.brand_name}</h1>
                <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">{t.reportDone}</span>
                {!isPro && <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">{t.reportLite}</span>}
              </div>
              <p className="text-gray-400 text-sm">
                {audit.category} · {new Date(audit.completed_at ?? audit.created_at).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Visibility Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <h2 className="font-semibold mb-4">AI Visibility Score</h2>
              <div className="flex items-end gap-4">
                <span className="text-6xl font-semibold">{audit.report?.visibility_score ?? '--'}</span>
                <span className="text-gray-400 text-lg mb-2">/100</span>
              </div>
              <p className="text-gray-500 text-sm mt-3">{audit.report?.visibility_summary ?? t.reportNoSummary}</p>
            </div>

            {/* Key findings */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <h2 className="font-semibold mb-4">Key findings</h2>
              <ul className="space-y-3">
                {(audit.report?.key_findings?.slice(0, 3) ?? [t.reportNoFindings]).map((f: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-gray-300 shrink-0">{i + 1}.</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Identity Gap */}
            <div className="rounded-xl border p-8 mb-4 relative overflow-hidden bg-white border-gray-200">
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                  <p className="font-semibold mb-1">{t.identityGapTitle}</p>
                  <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">{t.identityGapBlurBody}</p>
                  <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                    {t.identityGapUpgrade}
                  </Link>
                </div>
              )}
              <h2 className="font-semibold mb-4">{t.identityGapTitle}</h2>
              {isPro ? (
                <div className="space-y-4">
                  {(audit.report?.identity_gaps ?? []).map((gap: { dimension: string; score: number; description: string }, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{gap.dimension}</span>
                        <span className="text-sm text-gray-400">{gap.score}/10</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-black rounded-full" style={{ width: `${gap.score * 10}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{gap.description}</p>
                    </div>
                  ))}
                  {!audit.report?.identity_gaps?.length && <p className="text-gray-400 text-sm">{t.identityGapNoData}</p>}
                </div>
              ) : (
                <div className="space-y-4 opacity-20 pointer-events-none">
                  {['Tone of Voice', 'Core Values', 'Audience'].map(d => (
                    <div key={d}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{d}</span>
                        <span className="text-sm text-gray-400">?/10</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-black rounded-full w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Competitor Benchmark */}
            <div className="rounded-xl border p-8 mb-4 relative overflow-hidden bg-white border-gray-200">
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                  <p className="font-semibold mb-1">{t.competitorTitle}</p>
                  <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">{t.competitorBlurBody}</p>
                  <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                    {t.competitorUpgrade}
                  </Link>
                </div>
              )}
              <h2 className="font-semibold mb-4">{t.competitorTitle}</h2>
              {isPro ? (
                <p className="text-gray-400 text-sm">{audit.report?.competitor_analysis ?? t.competitorNoData}</p>
              ) : (
                <div className="opacity-20 pointer-events-none space-y-2">
                  {(audit.competitors ?? []).concat(['---']).slice(0, 2).map((c: string, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{c || t.competitorLabel}</span>
                      <span className="text-gray-400">?/100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action plan */}
            <div className="rounded-xl border p-8 relative overflow-hidden bg-white border-gray-200">
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                  <p className="font-semibold mb-1">{t.actionTitle}</p>
                  <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">{t.actionBlurBody}</p>
                  <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                    {t.actionUpgrade}
                  </Link>
                </div>
              )}
              <h2 className="font-semibold mb-4">{t.actionTitle}</h2>
              {isPro ? (
                <ol className="space-y-3">
                  {(audit.report?.action_plan ?? []).map((action: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-semibold shrink-0">{i + 1}.</span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                  {!audit.report?.action_plan?.length && <p className="text-gray-400 text-sm">{t.actionNoData}</p>}
                </ol>
              ) : (
                <ol className="space-y-3 opacity-20 pointer-events-none">
                  {[1, 2, 3, 4, 5].map(i => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-semibold shrink-0">{i}.</span>
                      <span className="text-gray-700 bg-gray-200 rounded w-3/4 h-4 block" />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

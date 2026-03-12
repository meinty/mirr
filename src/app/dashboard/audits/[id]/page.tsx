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
  const isV2 = audit.report?.version === 2
  const isNl = locale === 'nl'

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
        {/* Failed */}
        {audit.status === 'failed' && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-red-500 text-lg font-semibold">!</span>
            </div>
            <h2 className="font-semibold text-lg mb-2">{locale === 'en' ? 'Audit failed' : 'Audit mislukt'}</h2>
            <p className="text-gray-500 text-sm mb-6">{locale === 'en' ? 'Something went wrong while processing this audit. Please try again with a new audit.' : 'Er ging iets mis bij het verwerken van deze audit. Probeer het opnieuw met een nieuwe audit.'}</p>
            <a href="/dashboard/new-audit" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">{locale === 'en' ? 'Start new audit' : 'Nieuwe audit starten'}</a>
          </div>
        )}

        {/* Status */}
        {(audit.status === 'queued' || audit.status === 'processing') && (
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
                {isV2 && <span> · {audit.report.prompts_tested} prompts</span>}
              </p>
            </div>

            {/* Executive Summary (v2) */}
            {isV2 && audit.report?.executive_summary && (
              <div className="bg-black text-white rounded-xl p-8 mb-4">
                <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-400">Executive Summary</h2>
                <p className="text-sm leading-relaxed text-gray-200">{audit.report.executive_summary}</p>
              </div>
            )}

            {/* Visibility Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <h2 className="font-semibold mb-4">AI Visibility Score</h2>
              <div className="flex items-end gap-4">
                <span className="text-6xl font-semibold">{audit.report?.visibility_score ?? '--'}</span>
                <span className="text-gray-400 text-lg mb-2">/100</span>
              </div>
              <p className="text-gray-500 text-sm mt-3">{audit.report?.visibility_summary ?? t.reportNoSummary}</p>

              {/* Category scores (v2) */}
              {isV2 && audit.report?.category_scores && (
                <div className="mt-6 grid grid-cols-5 gap-3">
                  {Object.entries(audit.report.category_scores as Record<string, number>).map(([cat, score]) => (
                    <div key={cat} className="text-center">
                      <div className="text-lg font-semibold">{score}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{cat}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key findings */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <h2 className="font-semibold mb-4">Key findings</h2>
              <ul className="space-y-3">
                {(audit.report?.key_findings?.slice(0, isPro ? undefined : 3) ?? [t.reportNoFindings]).map((f: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-gray-300 shrink-0">{i + 1}.</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              {!isPro && (audit.report?.key_findings?.length ?? 0) > 3 && (
                <p className="text-xs text-gray-400 mt-4 italic">
                  {isNl ? `+${(audit.report?.key_findings?.length ?? 0) - 3} findings verborgen. Upgrade naar Pro.` : `+${(audit.report?.key_findings?.length ?? 0) - 3} findings hidden. Upgrade to Pro.`}
                </p>
              )}
            </div>

            {/* AI Quotes (v2, Pro only) */}
            {isV2 && audit.report?.ai_quotes?.length > 0 && (
              <div className="rounded-xl border p-8 mb-4 relative overflow-hidden bg-white border-gray-200">
                {!isPro && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                    <p className="font-semibold mb-1">{isNl ? 'Wat AI letterlijk zegt' : 'What AI actually says'}</p>
                    <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">{isNl ? 'Exacte citaten uit AI-antwoorden over jouw merk. Alleen in Pro.' : 'Exact quotes from AI responses about your brand. Pro only.'}</p>
                    <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                      {t.identityGapUpgrade}
                    </Link>
                  </div>
                )}
                <h2 className="font-semibold mb-4">{isNl ? 'Wat AI letterlijk zegt' : 'What AI actually says'}</h2>
                {isPro ? (
                  <div className="space-y-4">
                    {audit.report.ai_quotes.map((q: { quote: string; context: string }, i: number) => (
                      <div key={i} className="border-l-2 border-gray-200 pl-4">
                        <p className="text-sm text-gray-700 italic">&ldquo;{q.quote}&rdquo;</p>
                        <p className="text-xs text-gray-400 mt-1">{q.context}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 opacity-20 pointer-events-none">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border-l-2 border-gray-200 pl-4">
                        <div className="bg-gray-200 rounded h-4 w-full mb-1" />
                        <div className="bg-gray-100 rounded h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                <div className="space-y-5">
                  {(audit.report?.identity_gaps ?? []).map((gap: { dimension: string; score: number; description?: string; what_matches?: string; what_misses?: string; recommendation?: string }, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{gap.dimension}</span>
                        <span className="text-sm text-gray-400">{gap.score}/10</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${gap.score <= 3 ? 'bg-red-500' : gap.score <= 6 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${gap.score * 10}%` }} />
                      </div>
                      {/* V2 detailed gap */}
                      {gap.what_matches && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-green-600">+ {gap.what_matches}</p>
                          <p className="text-xs text-red-500">- {gap.what_misses}</p>
                          {gap.recommendation && <p className="text-xs text-gray-500 mt-1">&#8594; {gap.recommendation}</p>}
                        </div>
                      )}
                      {/* V1 fallback */}
                      {!gap.what_matches && gap.description && (
                        <p className="text-xs text-gray-500 mt-1">{gap.description}</p>
                      )}
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

            {/* Cultural Signals (v2, Pro only) */}
            {isV2 && audit.report?.cultural_signals && (
              <div className="rounded-xl border p-8 mb-4 relative overflow-hidden bg-white border-gray-200">
                {!isPro && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                    <p className="font-semibold mb-1">{isNl ? 'Culturele signalen' : 'Cultural signals'}</p>
                    <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">{isNl ? 'Welke culturele associaties AI aan jouw merk koppelt. Alleen in Pro.' : 'Which cultural associations AI links to your brand. Pro only.'}</p>
                    <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                      {t.identityGapUpgrade}
                    </Link>
                  </div>
                )}
                <h2 className="font-semibold mb-4">{isNl ? 'Culturele signalen' : 'Cultural signals'}</h2>
                {isPro ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">{isNl ? 'Positief' : 'Positive'}</p>
                      <ul className="space-y-1.5">
                        {(audit.report.cultural_signals.positive ?? []).map((s: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-green-400 shrink-0">+</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">{isNl ? 'Negatief' : 'Negative'}</p>
                      <ul className="space-y-1.5">
                        {(audit.report.cultural_signals.negative ?? []).map((s: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-red-400 shrink-0">-</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{isNl ? 'Ontbreekt' : 'Missing'}</p>
                      <ul className="space-y-1.5">
                        {(audit.report.cultural_signals.missing ?? []).map((s: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-gray-300 shrink-0">?</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 opacity-20 pointer-events-none">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="bg-gray-200 rounded h-3 w-1/2" />
                        <div className="bg-gray-100 rounded h-3 w-full" />
                        <div className="bg-gray-100 rounded h-3 w-3/4" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                <>
                  {/* V2 structured competitor data */}
                  {isV2 && audit.report?.competitor_benchmark?.competitors?.length > 0 ? (
                    <div>
                      {audit.report.competitor_benchmark.summary && (
                        <p className="text-sm text-gray-500 mb-5">{audit.report.competitor_benchmark.summary}</p>
                      )}
                      <div className="space-y-4">
                        {audit.report.competitor_benchmark.competitors.map((comp: { name: string; visibility_score: number; strengths: string[]; weaknesses: string[] }, i: number) => (
                          <div key={i} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium text-sm">{comp.name}</span>
                              <span className="text-sm text-gray-400">{comp.visibility_score}/100</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full mb-3">
                              <div className="h-1.5 bg-black rounded-full" style={{ width: `${comp.visibility_score}%` }} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-1">{isNl ? 'Sterker dan jij' : 'Stronger than you'}</p>
                                <ul className="space-y-1">
                                  {comp.strengths?.map((s: string, j: number) => (
                                    <li key={j} className="text-xs text-gray-600">+ {s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-1">{isNl ? 'Zwakker dan jij' : 'Weaker than you'}</p>
                                <ul className="space-y-1">
                                  {comp.weaknesses?.map((w: string, j: number) => (
                                    <li key={j} className="text-xs text-gray-600">- {w}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Score comparison bar */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">{isNl ? 'AI Visibility vergelijking' : 'AI Visibility comparison'}</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium w-24 shrink-0">{audit.brand_name}</span>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full">
                                <div className="h-2 bg-black rounded-full" style={{ width: `${audit.report.visibility_score}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{audit.report.visibility_score}</span>
                            </div>
                            {audit.report.competitor_benchmark.competitors.map((comp: { name: string; visibility_score: number }, i: number) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-medium w-24 shrink-0 text-gray-500">{comp.name}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                                  <div className="h-2 bg-gray-400 rounded-full" style={{ width: `${comp.visibility_score}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{comp.visibility_score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* V1 fallback: plain text */
                    <p className="text-gray-500 text-sm whitespace-pre-line">{audit.report?.competitor_analysis ?? audit.report?.competitor_benchmark?.summary ?? t.competitorNoData}</p>
                  )}
                </>
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
              <h2 className="font-semibold mb-4">{isNl ? 'Actieplan' : 'Action plan'}</h2>
              {isPro ? (
                <div className="space-y-4">
                  {(audit.report?.action_plan ?? []).map((item: string | { action: string; priority: string; impact: string; effort: string }, i: number) => {
                    const isStructured = typeof item === 'object'
                    const action = isStructured ? item.action : item
                    const priority = isStructured ? item.priority : null
                    const impact = isStructured ? item.impact : null
                    const effort = isStructured ? item.effort : null

                    return (
                      <div key={i} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex gap-3 items-start">
                          <span className="font-semibold text-sm shrink-0 text-gray-300">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 font-medium">{action}</p>
                            {isStructured && (
                              <div className="flex gap-4 mt-2">
                                {priority && (
                                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                                    priority === 'high' ? 'bg-red-50 text-red-600' :
                                    priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-gray-50 text-gray-500'
                                  }`}>
                                    {priority}
                                  </span>
                                )}
                                {impact && <span className="text-xs text-gray-400">{isNl ? 'Impact' : 'Impact'}: {impact}</span>}
                              </div>
                            )}
                            {effort && <p className="text-xs text-gray-400 mt-1">{isNl ? 'Inspanning' : 'Effort'}: {effort}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!audit.report?.action_plan?.length && <p className="text-gray-400 text-sm">{t.actionNoData}</p>}
                </div>
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

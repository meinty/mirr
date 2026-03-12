import { createClient } from '@/lib/supabase/server'
import { type PlanId } from '@/lib/stripe'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: audit } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!audit) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const planId = (profile?.plan ?? 'free') as PlanId
  const isPro = planId !== 'free'

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 text-sm hover:text-gray-600">Dashboard</Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm font-medium">{audit.brand_name}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Status */}
        {audit.status !== 'completed' && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-8">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="font-semibold mb-1">
              {audit.status === 'processing' ? 'Audit wordt uitgevoerd' : 'In de wachtrij'}
            </h2>
            <p className="text-gray-400 text-sm">
              {audit.status === 'processing'
                ? 'De agents zijn bezig. Dit duurt meestal 2-4 minuten.'
                : 'Je audit staat in de rij. Start verwacht over enkele momenten.'}
            </p>
          </div>
        )}

        {audit.status === 'completed' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{audit.brand_name}</h1>
                <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">Klaar</span>
                {!isPro && <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">Lite rapport</span>}
              </div>
              <p className="text-gray-400 text-sm">{audit.category} -- {new Date(audit.completed_at ?? audit.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Visibility Score -- altijd zichtbaar */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <h2 className="font-semibold mb-4">AI Visibility Score</h2>
              <div className="flex items-end gap-4">
                <span className="text-6xl font-semibold">{audit.report?.visibility_score ?? '--'}</span>
                <span className="text-gray-400 text-lg mb-2">/100</span>
              </div>
              <p className="text-gray-500 text-sm mt-3">{audit.report?.visibility_summary ?? 'Geen samenvatting beschikbaar.'}</p>
            </div>

            {/* Key findings -- altijd zichtbaar (max 3) */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <h2 className="font-semibold mb-4">Key findings</h2>
              <ul className="space-y-3">
                {(audit.report?.key_findings?.slice(0, 3) ?? ['Geen findings beschikbaar']).map((f: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-gray-300 shrink-0">{i + 1}.</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Identity Gap -- gebluurd voor free */}
            <div className={`rounded-xl border p-8 mb-4 relative overflow-hidden ${isPro ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                  <p className="font-semibold mb-1">Identity Gap Analyse</p>
                  <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">Zie hoe AI jouw merk begrijpt versus hoe jij het positioneert. Alleen beschikbaar in Pro.</p>
                  <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                    Upgrade naar Pro
                  </Link>
                </div>
              )}
              <h2 className="font-semibold mb-4">Identity Gap Analyse</h2>
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
                  {!audit.report?.identity_gaps?.length && <p className="text-gray-400 text-sm">Geen gap data beschikbaar.</p>}
                </div>
              ) : (
                <div className="space-y-4 opacity-20 pointer-events-none">
                  {['Tone of Voice', 'Kernwaarden', 'Doelgroep'].map(d => (
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

            {/* Competitor Benchmark -- gebluurd voor free */}
            <div className={`rounded-xl border p-8 mb-4 relative overflow-hidden bg-white border-gray-200`}>
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                  <p className="font-semibold mb-1">Competitor Benchmark</p>
                  <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">Zie hoe jij scoort ten opzichte van je concurrenten in AI. Alleen in Pro.</p>
                  <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                    Upgrade naar Pro
                  </Link>
                </div>
              )}
              <h2 className="font-semibold mb-4">Competitor Benchmark</h2>
              {isPro ? (
                <p className="text-gray-400 text-sm">{audit.report?.competitor_analysis ?? 'Geen benchmark beschikbaar.'}</p>
              ) : (
                <div className="opacity-20 pointer-events-none space-y-2">
                  {(audit.competitors ?? []).concat(['---']).slice(0, 2).map((c: string, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{c || 'Concurrent'}</span>
                      <span className="text-gray-400">?/100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actieplan -- gebluurd voor free */}
            <div className="rounded-xl border p-8 relative overflow-hidden bg-white border-gray-200">
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 z-10 flex flex-col items-center justify-center">
                  <p className="font-semibold mb-1">5 Prioritaire acties</p>
                  <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">Concrete aanbevelingen om jouw AI-perceptie te verbeteren. Alleen in Pro.</p>
                  <Link href="/dashboard/upgrade" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                    Upgrade naar Pro
                  </Link>
                </div>
              )}
              <h2 className="font-semibold mb-4">5 Prioritaire acties</h2>
              {isPro ? (
                <ol className="space-y-3">
                  {(audit.report?.action_plan ?? []).map((action: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-semibold shrink-0">{i + 1}.</span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                  {!audit.report?.action_plan?.length && <p className="text-gray-400 text-sm">Geen acties beschikbaar.</p>}
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

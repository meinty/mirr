import Link from 'next/link'
import { getLocale } from '@/lib/locale'
import { translations } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default async function Home() {
  const locale = await getLocale()
  const t = translations[locale]

  const packages = [
    { name: '1 credit', price: '€39', per: '€39 per audit', desc: t.pkg1Desc },
    { name: '5 credits', price: '€169', per: '€33,80 per audit', desc: t.pkg5Desc, highlight: true },
    { name: '10 credits', price: '€279', per: '€27,90 per audit', desc: t.pkg10Desc },
  ]

  const plans = [
    { name: 'Pro', price: '€79/mo', per: '€26 per audit', credits: t.planProDesc, features: t.planProFeatures, highlight: true },
    { name: 'Agency', price: '€199/mo', per: '€20 per audit', credits: t.planAgencyDesc, features: t.planAgencyFeatures, highlight: false },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-gray-100">
        <span className="text-xl font-semibold tracking-tight">Mirr</span>
        <div className="flex gap-6 items-center">
          <LanguageSwitcher current={locale} />
          <Link href="/about" className="text-sm text-gray-600 hover:text-black">{t.about}</Link>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-black">{t.login}</Link>
          <Link href="/auth/signup" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            {t.signup}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20">
        <p className="text-sm text-gray-400 mb-6 uppercase tracking-widest">{t.heroTag}</p>
        <h1 className="text-5xl font-semibold leading-tight mb-6 tracking-tight whitespace-pre-line">
          {t.heroHeadline}
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl">{t.heroSub}</p>
        <div className="flex gap-4">
          <Link href="/auth/signup" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium">
            {t.heroCta}
          </Link>
          <Link href="#how-it-works" className="text-gray-600 px-6 py-3 hover:text-black font-medium">
            {t.heroHow}
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-12">
          <div>
            <p className="text-4xl font-semibold mb-2">{t.stat1Value}</p>
            <p className="text-gray-500 text-sm">{t.stat1Label}</p>
          </div>
          <div>
            <p className="text-4xl font-semibold mb-2">{t.stat2Value}</p>
            <p className="text-gray-500 text-sm">{t.stat2Label}</p>
          </div>
          <div>
            <p className="text-4xl font-semibold mb-2">{t.stat3Value}</p>
            <p className="text-gray-500 text-sm">{t.stat3Label}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-8 py-24">
        <h2 className="text-3xl font-semibold mb-16 tracking-tight">{t.howTitle}</h2>
        <div className="grid grid-cols-3 gap-12">
          <div>
            <p className="text-sm text-gray-300 mb-3 font-medium">01</p>
            <h3 className="font-semibold mb-2">{t.how1Title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t.how1Body}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300 mb-3 font-medium">02</p>
            <h3 className="font-semibold mb-2">{t.how2Title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t.how2Body}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300 mb-3 font-medium">03</p>
            <h3 className="font-semibold mb-2">{t.how3Title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{t.how3Body}</p>
          </div>
        </div>
      </section>

      {/* Example report */}
      <section className="bg-gray-50 px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold mb-3 tracking-tight">{t.exampleTitle}</h2>
          <p className="text-gray-500 mb-12">{t.exampleSub}</p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.exampleBrand}</p>
            </div>

            {/* Visibility score */}
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold mb-3">{t.exampleVisLabel}</h3>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-semibold">64</span>
                <span className="text-gray-400 text-lg mb-1">/100</span>
              </div>
              <p className="text-gray-500 text-sm">{t.exampleVisSummary}</p>
            </div>

            {/* Key findings */}
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold mb-3">Key findings</h3>
              <ul className="space-y-2.5">
                {[t.exampleFinding1, t.exampleFinding2, t.exampleFinding3].map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-gray-300 shrink-0">{i + 1}.</span>
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro sections (blurred) */}
            <div className="px-8 py-6 relative">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 z-10 flex flex-col items-center justify-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{t.exampleProLabel}</p>
                <Link href="/auth/signup" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                  {t.heroCta}
                </Link>
              </div>
              <div className="space-y-5 opacity-40">
                <div>
                  <p className="text-sm font-semibold mb-1">{t.exampleGapLabel}</p>
                  <p className="text-xs text-gray-500">{t.exampleGapDesc}</p>
                  <div className="mt-2 space-y-2">
                    {['Tone of Voice', 'Core Values', 'Audience', 'Market Position'].map((d, i) => (
                      <div key={d} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28 shrink-0">{d}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-black rounded-full" style={{ width: `${[45, 60, 70, 35][i]}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{[4.5, 6, 7, 3.5][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{t.exampleCompLabel}</p>
                  <p className="text-xs text-gray-500">{t.exampleCompDesc}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{t.exampleActionsLabel}</p>
                  <p className="text-xs text-gray-500">{t.exampleActionsDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4 tracking-tight">{t.pricingTitle}</h2>
          <p className="text-gray-500 mb-6">{t.pricingSub}</p>

          {/* Free tier */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-10 flex justify-between items-center">
            <div>
              <p className="font-semibold mb-0.5">{t.pricingFreeTitle}</p>
              <p className="text-gray-500 text-sm">{t.pricingFreeSub}</p>
            </div>
            <Link href="/auth/signup" className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 shrink-0 ml-8">
              {t.pricingFreeCta}
            </Link>
          </div>

          {/* Credits */}
          <h3 className="text-base font-semibold mb-1">{t.pricingCreditsTitle}</h3>
          <p className="text-gray-400 text-sm mb-5">{t.pricingCreditsSub}</p>
          <div className="grid grid-cols-3 gap-4 mb-12">
            {packages.map(pkg => (
              <div key={pkg.name} className={`rounded-xl p-6 border ${pkg.highlight ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}>
                <p className="font-semibold mb-1">{pkg.name}</p>
                <p className="text-2xl font-semibold mb-0.5">{pkg.price}</p>
                <p className="text-xs mb-1 text-gray-400">{pkg.per}</p>
                <p className="text-sm mb-5 text-gray-400">{pkg.desc}</p>
                <Link href="/auth/signup" className={`block text-center py-2 rounded-lg text-sm font-medium ${pkg.highlight ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}>
                  {t.pricingCreditsBuy}
                </Link>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">{t.pricingOr}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Subscriptions */}
          <h3 className="text-base font-semibold mb-1">{t.pricingSubTitle}</h3>
          <p className="text-gray-400 text-sm mb-5">{t.pricingSubSub}</p>
          <div className="grid grid-cols-2 gap-4">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-xl p-6 border ${plan.highlight ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}>
                <p className="font-semibold mb-1">{plan.name}</p>
                <p className="text-2xl font-semibold mb-0.5">{plan.price}</p>
                <p className="text-xs mb-1 text-gray-400">{plan.per}</p>
                <p className="text-sm mb-5 font-medium text-gray-400">{plan.credits}</p>
                <ul className={`space-y-1.5 mb-6 ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                  {plan.features.map((f: string) => (
                    <li key={f} className="text-xs flex gap-1.5"><span>·</span>{f}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block text-center py-2 rounded-lg text-sm font-medium ${plan.highlight ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}>
                  {t.pricingSubCta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="font-semibold">Mirr</span>
          <a href="https://jackandai.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-gray-700">{t.footerBy}</a>
        </div>
      </footer>
    </main>
  )
}

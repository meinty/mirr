import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-gray-100">
        <span className="text-xl font-semibold tracking-tight">Mirr</span>
        <div className="flex gap-6 items-center">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-black">Inloggen</Link>
          <Link href="/auth/signup" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            Start een audit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20">
        <p className="text-sm text-gray-400 mb-6 uppercase tracking-widest">Brand Perception Audit</p>
        <h1 className="text-5xl font-semibold leading-tight mb-6 tracking-tight">
          We meten niet alleen of AI<br />je kent. We meten of AI<br />je begrijpt.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl">
          ChatGPT, Perplexity, Claude en Gemini vormen een beeld van jouw merk.
          Weet jij wat dat beeld is — en klopt het met wie je bent?
        </p>
        <div className="flex gap-4">
          <Link href="/auth/signup" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium">
            Start een audit
          </Link>
          <Link href="#hoe-het-werkt" className="text-gray-600 px-6 py-3 hover:text-black font-medium">
            Hoe het werkt
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-12">
          <div>
            <p className="text-4xl font-semibold mb-2">92%</p>
            <p className="text-gray-500 text-sm">van merken scoort slecht op AI-zichtbaarheid</p>
          </div>
          <div>
            <p className="text-4xl font-semibold mb-2">4</p>
            <p className="text-gray-500 text-sm">AI-platforms getest: ChatGPT, Perplexity, Claude, Gemini</p>
          </div>
          <div>
            <p className="text-4xl font-semibold mb-2">2 wk</p>
            <p className="text-gray-500 text-sm">van briefing tot volledig rapport</p>
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section id="hoe-het-werkt" className="max-w-4xl mx-auto px-8 py-24">
        <h2 className="text-3xl font-semibold mb-16 tracking-tight">Hoe het werkt</h2>
        <div className="grid grid-cols-3 gap-12">
          <div>
            <p className="text-sm text-gray-300 mb-3 font-medium">01</p>
            <h3 className="font-semibold mb-2">Visibility</h3>
            <p className="text-gray-500 text-sm leading-relaxed">We testen jouw merk op 50+ prompts over vier AI-platforms en meten hoe vaak, waar en hoe je gevonden wordt.</p>
          </div>
          <div>
            <p className="text-sm text-gray-300 mb-3 font-medium">02</p>
            <h3 className="font-semibold mb-2">Identity Gap</h3>
            <p className="text-gray-500 text-sm leading-relaxed">We vergelijken wat AI zegt met wie jij wil zijn. Welke waarden komen door? Welke niet? Wat draag je onbedoeld mee?</p>
          </div>
          <div>
            <p className="text-sm text-gray-300 mb-3 font-medium">03</p>
            <h3 className="font-semibold mb-2">Cultural Signals</h3>
            <p className="text-gray-500 text-sm leading-relaxed">We brengen in kaart welke bronnen de AI-perceptie van jouw merk vormen en welke culturele verhalen eraan kleven.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4 tracking-tight">Credits</h2>
          <p className="text-gray-500 mb-16">Koop credits, gebruik ze wanneer je wil. Geen abonnement, geen verrassingen.</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="font-semibold mb-1">Starter</h3>
              <p className="text-3xl font-semibold mb-1">€4.500</p>
              <p className="text-gray-400 text-sm mb-6">1 credit — 1 Snapshot</p>
              <Link href="/auth/signup" className="block text-center bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 text-sm font-medium">
                Kopen
              </Link>
            </div>
            <div className="bg-black rounded-xl p-8 text-white">
              <h3 className="font-semibold mb-1">Growth</h3>
              <p className="text-3xl font-semibold mb-1">€12.000</p>
              <p className="text-gray-400 text-sm mb-6">3 credits — 10% korting</p>
              <Link href="/auth/signup" className="block text-center bg-white text-black px-4 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                Kopen
              </Link>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="font-semibold mb-1">Pro</h3>
              <p className="text-3xl font-semibold mb-1">€22.500</p>
              <p className="text-gray-400 text-sm mb-6">6 credits — 17% korting</p>
              <Link href="/auth/signup" className="block text-center bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 text-sm font-medium">
                Kopen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="font-semibold">Mirr</span>
          <p className="text-sm text-gray-400">by Meinte Stinstra</p>
        </div>
      </footer>
    </main>
  )
}

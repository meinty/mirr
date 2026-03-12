import Link from 'next/link'
import { getLocale } from '@/lib/locale'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default async function AboutPage() {
  const locale = await getLocale()
  const isEn = locale === 'en'

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-gray-100">
        <Link href="/" className="text-xl font-semibold tracking-tight">Mirr</Link>
        <div className="flex gap-6 items-center">
          <LanguageSwitcher current={locale} />
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-black">
            {isEn ? 'Log in' : 'Inloggen'}
          </Link>
          <Link href="/auth/signup" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            {isEn ? 'Start an audit' : 'Start een audit'}
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-24">
        <p className="text-sm text-gray-400 mb-6 uppercase tracking-widest">
          {isEn ? 'About' : 'Over Mirr'}
        </p>

        <h1 className="text-4xl font-semibold leading-tight mb-10 tracking-tight">
          {isEn
            ? 'AI has an opinion about your brand. We help you understand it.'
            : 'AI heeft een mening over jouw merk. Wij helpen je die begrijpen.'}
        </h1>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <p>
            {isEn
              ? 'Every day, millions of people turn to ChatGPT, Perplexity, Claude, and Gemini with questions about brands, products, and services. The answers these systems give shape perception at scale. Most brands have no idea what AI is saying about them.'
              : 'Elke dag stellen miljoenen mensen vragen over merken, producten en diensten aan ChatGPT, Perplexity, Claude en Gemini. De antwoorden die die systemen geven, vormen perceptie op grote schaal. De meeste merken hebben geen idee wat AI over hen zegt.'}
          </p>

          <p>
            {isEn
              ? 'Mirr was built to change that. We run your brand through 50+ structured prompts across AI platforms, analyse the responses, and compare what AI says with who you actually are. The result is a clear picture of your AI visibility and the gap between your intended identity and how AI perceives you.'
              : 'Mirr is gebouwd om dat te veranderen. We testen jouw merk op 50+ gestructureerde prompts over AI-platforms, analyseren de antwoorden en vergelijken wat AI zegt met wie jij werkelijk bent. Het resultaat is een helder beeld van jouw AI-zichtbaarheid en de kloof tussen jouw beoogde identiteit en hoe AI jou ziet.'}
          </p>

          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              {isEn ? 'The methodology' : 'De methodologie'}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  {isEn ? '01 Visibility' : '01 Visibility'}
                </p>
                <p className="text-sm">
                  {isEn
                    ? 'We query AI platforms with prompts across five categories: awareness, consideration, decision, sentiment, and cultural positioning. We measure how often your brand appears, in what context, and with what tone.'
                    : 'We bevragen AI-platforms met prompts over vijf categorieën: awareness, consideration, decision, sentiment en culturele positionering. We meten hoe vaak jouw merk voorkomt, in welke context en met welke toon.'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  {isEn ? '02 Identity Gap' : '02 Identity Gap'}
                </p>
                <p className="text-sm">
                  {isEn
                    ? 'We compare AI responses with your intended positioning. The gap analysis covers tone of voice, core values, audience recognition, and market position. Each dimension is scored and explained.'
                    : 'We vergelijken AI-antwoorden met jouw beoogde positionering. De gap-analyse beslaat tone of voice, kernwaarden, doelgroepherkenning en marktpositie. Elke dimensie wordt gescoord en toegelicht.'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  {isEn ? '03 Cultural Signals' : '03 Cultural Signals'}
                </p>
                <p className="text-sm">
                  {isEn
                    ? 'We map which sources and narratives shape AI perception of your brand. What are the cultural associations that AI has learned? Which ones serve your brand, and which ones work against it?'
                    : 'We brengen in kaart welke bronnen en verhalen de AI-perceptie van jouw merk vormen. Welke culturele associaties heeft AI geleerd? Welke werken voor jouw merk, en welke werken ertegen?'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              {isEn ? 'Built by Jack&AI' : 'Gebouwd door Jack&AI'}
            </h2>
            <p className="text-sm">
              {isEn
                ? 'Mirr is a product by '
                : 'Mirr is een product van '}
              <a href="https://jackandai.com" target="_blank" rel="noopener noreferrer" className="text-black underline">Jack&AI</a>
              {isEn
                ? ', an AI agency that helps brands operate faster and smarter using artificial intelligence. We build tools that turn AI complexity into clarity.'
                : ', een AI-agency die merken helpt sneller en slimmer te opereren met kunstmatige intelligentie. Wij bouwen tools die AI-complexiteit omzetten in helderheid.'}
            </p>
          </div>
        </div>

        <div className="mt-16">
          <Link href="/auth/signup" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium text-sm">
            {isEn ? 'Start your first audit' : 'Start je eerste audit'}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="font-semibold">Mirr</span>
          <a href="https://jackandai.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-gray-700">
            powered by Jack&AI
          </a>
        </div>
      </footer>
    </main>
  )
}

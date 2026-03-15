import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { brandName, language = 'nl' } = await req.json()
  if (!brandName) return NextResponse.json({ error: 'No brand name' }, { status: 400 })

  const isEn = language === 'en'

  const prompt = isEn
    ? `You are a brand analyst. Given only a brand name, research what you know and return structured brand information.

Brand name: "${brandName}"

Return a JSON object with these fields:
{
  "category": "<the market/industry category this brand operates in, e.g. 'plant-based dairy', 'discount retail', 'sportswear'>",
  "positioning_what": "<what the brand does, in one sentence>",
  "positioning_who": "<target audience, in one sentence>",
  "positioning_how": "<brand tone and character, 3-5 adjectives>",
  "competitor_1": "<main competitor brand name>",
  "competitor_2": "<second competitor brand name>"
}

Be specific and concise. If you're unsure about the brand, make your best guess based on the name. Return ONLY the JSON.`
    : `Je bent een merkanalist. Geef op basis van alleen een merknaam gestructureerde merkinformatie terug.

Merknaam: "${brandName}"

Geef een JSON-object met deze velden:
{
  "category": "<de markt/sector waarin dit merk opereert, bijv. 'plant-based zuivel', 'discount retail', 'sportkleding'>",
  "positioning_what": "<wat het merk doet, in één zin>",
  "positioning_who": "<doelgroep, in één zin>",
  "positioning_how": "<toon en karakter van het merk, 3-5 bijvoeglijke naamwoorden>",
  "competitor_1": "<belangrijkste concurrent>",
  "competitor_2": "<tweede concurrent>"
}

Wees specifiek en beknopt. Als je niet zeker bent over het merk, doe je beste inschatting op basis van de naam. Geef ALLEEN de JSON terug.`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { text: string }).text
    const match = raw.match(/\{[\s\S]*\}/)
    const data = JSON.parse(match?.[0] ?? raw)

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Prefill failed' }, { status: 500 })
  }
}

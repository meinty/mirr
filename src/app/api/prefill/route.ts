import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { brandName, websiteUrl, language = 'nl' } = await req.json()
  if (!brandName) return NextResponse.json({ error: 'No brand name' }, { status: 400 })

  const isEn = language === 'en'
  const urlContext = websiteUrl ? (isEn ? `\nTheir website is: ${websiteUrl}` : `\nHun website is: ${websiteUrl}`) : ''

  const prompt = isEn
    ? `You are a brand analyst. Given a brand name, return structured brand information.

Brand name: "${brandName}"${urlContext}

Return a JSON object:
{
  "website_url": "<the brand's main website URL, e.g. https://www.action.com>",
  "category": "<market/industry category, e.g. 'discount retail', 'plant-based dairy'>",
  "region": "<primary market/region, e.g. 'Europe', 'Netherlands', 'United States'>",
  "positioning_what": "<what the brand does, one sentence>",
  "positioning_who": "<target audience, one sentence>",
  "positioning_how": "<brand tone and character, 3-5 adjectives>",
  "competitors": ["<competitor 1>", "<competitor 2>", "<competitor 3>"]
}

Return 3 competitors that directly compete in the same category and market. Be specific and concise. Return ONLY the JSON.`
    : `Je bent een merkanalist. Geef op basis van een merknaam gestructureerde merkinformatie terug.

Merknaam: "${brandName}"${urlContext}

Geef een JSON-object:
{
  "website_url": "<de hoofdwebsite van het merk, bijv. https://www.action.com>",
  "category": "<markt/sector, bijv. 'discount retail', 'plant-based zuivel'>",
  "region": "<primaire markt/regio, bijv. 'Europa', 'Nederland', 'Wereldwijd'>",
  "positioning_what": "<wat het merk doet, in een zin>",
  "positioning_who": "<doelgroep, in een zin>",
  "positioning_how": "<toon en karakter van het merk, 3-5 bijvoeglijke naamwoorden>",
  "competitors": ["<concurrent 1>", "<concurrent 2>", "<concurrent 3>"]
}

Geef 3 concurrenten die direct concurreren in dezelfde categorie en markt. Wees specifiek en beknopt. Geef ALLEEN de JSON terug.`

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

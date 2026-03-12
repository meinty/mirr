import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function queryPerplexity(prompt: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function askClaude(prompt: string, maxTokens = 2000): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return (msg.content[0] as { text: string }).text
}

function parseJSON(raw: string): Record<string, unknown> | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(match?.[0] ?? raw)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { auditId, language = 'nl' } = await req.json()
  const isEn = language === 'en'
  if (!auditId) return NextResponse.json({ error: 'Geen auditId' }, { status: 400 })

  const { data: audit } = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .single()

  if (!audit) return NextResponse.json({ error: 'Audit niet gevonden' }, { status: 404 })

  await supabaseAdmin
    .from('audits')
    .update({ status: 'processing' })
    .eq('id', auditId)

  try {
    const { brand_name, category, positioning, competitors } = audit

    // ========================================
    // STAP 1: 15 Perplexity prompts over 5 categorieen
    // ========================================
    const promptCategories = {
      awareness: [
        `What do you know about the brand ${brand_name}? Describe it in detail: what they do, their history, their market position.`,
        `Is ${brand_name} a well-known brand in the ${category} market? How would you rank its brand awareness compared to competitors?`,
        `If someone searches for "${category}" products or services, would ${brand_name} come up? Why or why not?`,
      ],
      consideration: [
        `Would you recommend ${brand_name} to someone looking for ${category}? What are the pros and cons?`,
        `What do reviews and customer opinions say about ${brand_name}? What is the general sentiment?`,
        `How does ${brand_name} differentiate itself from other brands in ${category}?`,
      ],
      decision: [
        `If I had to choose between ${brand_name} and its top competitors in ${category}, what would be the deciding factors?`,
        `What is ${brand_name}'s pricing strategy? Is it seen as affordable, premium, or somewhere in between?`,
        `What are the most common reasons people choose ${brand_name} over alternatives?`,
      ],
      sentiment: [
        `What is the overall reputation of ${brand_name}? Are there any controversies or particularly positive associations?`,
        `How is ${brand_name} perceived in terms of sustainability, ethics, and corporate responsibility?`,
        `What emotions or associations come to mind when you think of ${brand_name}?`,
      ],
      cultural: [
        `What cultural narratives or trends is ${brand_name} associated with?`,
        `What sources of information shape the perception of ${brand_name}? (media, social media, reviews, etc.)`,
        `How has the perception of ${brand_name} evolved in recent years?`,
      ],
    }

    const allResults: { category: string; prompt: string; response: string }[] = []

    for (const [cat, prompts] of Object.entries(promptCategories)) {
      for (const prompt of prompts) {
        const response = await queryPerplexity(prompt)
        allResults.push({ category: cat, prompt, response })
      }
    }

    const fullResearchText = allResults
      .map(r => `[${r.category.toUpperCase()}]\nQ: ${r.prompt}\nA: ${r.response}`)
      .join('\n\n---\n\n')

    // ========================================
    // STAP 2: Diepgaande visibility analyse via Claude Sonnet
    // ========================================
    const visibilityPrompt = isEn
      ? `You are a senior brand perception analyst. You have received 15 AI responses about the brand "${brand_name}" in the ${category} market, organized across 5 categories: awareness, consideration, decision, sentiment, and cultural positioning.

AI RESPONSES:
${fullResearchText}

INTENDED BRAND POSITIONING:
${positioning}

Analyse everything thoroughly. Return your analysis as JSON:
{
  "visibility_score": <0-100, be critical and precise>,
  "visibility_summary": "<3-4 sentence executive summary of how AI perceives this brand>",
  "key_findings": [
    "<detailed finding 1 with specific evidence from the AI responses>",
    "<detailed finding 2>",
    "<detailed finding 3>",
    "<detailed finding 4>",
    "<detailed finding 5>",
    "<detailed finding 6>",
    "<detailed finding 7>"
  ],
  "ai_quotes": [
    { "quote": "<exact quote from an AI response that is revealing>", "context": "<why this quote matters>" },
    { "quote": "<another revealing quote>", "context": "<why this matters>" },
    { "quote": "<third quote>", "context": "<why this matters>" }
  ],
  "category_scores": {
    "awareness": <0-100>,
    "consideration": <0-100>,
    "decision": <0-100>,
    "sentiment": <0-100>,
    "cultural": <0-100>
  }
}

Return ONLY the JSON.`
      : `Je bent een senior brand perception analyst. Je hebt 15 AI-antwoorden ontvangen over het merk "${brand_name}" in de ${category} markt, verdeeld over 5 categorieen: awareness, consideration, decision, sentiment en culturele positionering.

AI-ANTWOORDEN:
${fullResearchText}

BEOOGDE MERKPOSITIONERING:
${positioning}

Analyseer alles grondig. Geef je analyse als JSON:
{
  "visibility_score": <0-100, wees kritisch en precies>,
  "visibility_summary": "<3-4 zinnen executive summary van hoe AI dit merk ziet>",
  "key_findings": [
    "<gedetailleerde finding 1 met specifiek bewijs uit de AI-antwoorden>",
    "<gedetailleerde finding 2>",
    "<gedetailleerde finding 3>",
    "<gedetailleerde finding 4>",
    "<gedetailleerde finding 5>",
    "<gedetailleerde finding 6>",
    "<gedetailleerde finding 7>"
  ],
  "ai_quotes": [
    { "quote": "<exact citaat uit een AI-antwoord dat veelzeggend is>", "context": "<waarom dit citaat relevant is>" },
    { "quote": "<nog een veelzeggend citaat>", "context": "<waarom dit relevant is>" },
    { "quote": "<derde citaat>", "context": "<waarom dit relevant is>" }
  ],
  "category_scores": {
    "awareness": <0-100>,
    "consideration": <0-100>,
    "decision": <0-100>,
    "sentiment": <0-100>,
    "cultural": <0-100>
  }
}

Geef ALLEEN de JSON terug.`

    const visRaw = await askClaude(visibilityPrompt, 2500)
    const visData = parseJSON(visRaw) as {
      visibility_score: number
      visibility_summary: string
      key_findings: string[]
      ai_quotes: { quote: string; context: string }[]
      category_scores: Record<string, number>
    } | null

    const visibility = visData ?? {
      visibility_score: 50,
      visibility_summary: 'Analyse kon niet worden verwerkt.',
      key_findings: ['Geen findings beschikbaar'],
      ai_quotes: [],
      category_scores: { awareness: 50, consideration: 50, decision: 50, sentiment: 50, cultural: 50 },
    }

    // ========================================
    // STAP 3: Identity gap + cultural signals via Claude Sonnet
    // ========================================
    const gapPrompt = isEn
      ? `You are a senior brand strategist. Compare how AI perceives the brand "${brand_name}" with its intended identity.

AI PERCEPTION:
${visibility.visibility_summary}

KEY FINDINGS:
${visibility.key_findings.join('\n')}

FULL AI RESPONSES (first 4000 chars):
${fullResearchText.slice(0, 4000)}

INTENDED POSITIONING:
${positioning}

Analyse the gap deeply across 6 dimensions. Also identify cultural signals. Return as JSON:
{
  "identity_gaps": [
    { "dimension": "Tone of Voice", "score": <0-10>, "what_matches": "<what AI gets right>", "what_misses": "<what AI gets wrong or misses>", "recommendation": "<specific action to close this gap>" },
    { "dimension": "Core Values", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Audience Recognition", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Market Position", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Brand Promise", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Emotional Association", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" }
  ],
  "cultural_signals": {
    "positive": ["<cultural association that helps the brand>", "<another>"],
    "negative": ["<cultural association that hurts the brand>", "<another>"],
    "missing": ["<cultural association the brand wants but AI doesn't see>", "<another>"]
  },
  "action_plan": [
    { "action": "<specific, concrete action>", "priority": "high|medium|low", "impact": "<what this will improve>", "effort": "<what it takes to implement>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" }
  ]
}

Return ONLY the JSON.`
      : `Je bent een senior brand strategist. Vergelijk hoe AI het merk "${brand_name}" ziet met de beoogde identiteit.

AI-PERCEPTIE:
${visibility.visibility_summary}

KEY FINDINGS:
${visibility.key_findings.join('\n')}

VOLLEDIGE AI-ANTWOORDEN (eerste 4000 tekens):
${fullResearchText.slice(0, 4000)}

BEOOGDE POSITIONERING:
${positioning}

Analyseer de kloof grondig op 6 dimensies. Identificeer ook culturele signalen. Geef als JSON:
{
  "identity_gaps": [
    { "dimension": "Tone of Voice", "score": <0-10>, "what_matches": "<wat AI goed ziet>", "what_misses": "<wat AI mist of verkeerd ziet>", "recommendation": "<concrete actie om deze kloof te dichten>" },
    { "dimension": "Kernwaarden", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Doelgroep herkenning", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Marktpositie", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Merkbelofte", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" },
    { "dimension": "Emotionele associatie", "score": <0-10>, "what_matches": "<>", "what_misses": "<>", "recommendation": "<>" }
  ],
  "cultural_signals": {
    "positive": ["<culturele associatie die het merk helpt>", "<nog een>"],
    "negative": ["<culturele associatie die het merk schaadt>", "<nog een>"],
    "missing": ["<culturele associatie die het merk wil maar AI niet ziet>", "<nog een>"]
  },
  "action_plan": [
    { "action": "<specifieke, concrete actie>", "priority": "high|medium|low", "impact": "<wat dit verbetert>", "effort": "<wat ervoor nodig is>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" },
    { "action": "<>", "priority": "<>", "impact": "<>", "effort": "<>" }
  ]
}

Geef ALLEEN de JSON terug.`

    const gapRaw = await askClaude(gapPrompt, 3500)
    const gapData = parseJSON(gapRaw) as {
      identity_gaps: { dimension: string; score: number; what_matches: string; what_misses: string; recommendation: string }[]
      cultural_signals: { positive: string[]; negative: string[]; missing: string[] }
      action_plan: { action: string; priority: string; impact: string; effort: string }[]
    } | null

    const gaps = gapData ?? {
      identity_gaps: [],
      cultural_signals: { positive: [], negative: [], missing: [] },
      action_plan: [],
    }

    // ========================================
    // STAP 4: Gestructureerde competitor analyse
    // ========================================
    let competitorData: { summary: string; competitors: { name: string; visibility_score: number; strengths: string[]; weaknesses: string[] }[] } = {
      summary: '',
      competitors: [],
    }

    if (competitors && competitors.length > 0) {
      // Perplexity research per concurrent
      const compResults: string[] = []
      for (const comp of competitors) {
        const r = await queryPerplexity(
          `Compare ${brand_name} with ${comp} in the ${category} market. How do they differ in brand perception, market position, pricing, target audience, and reputation?`
        )
        compResults.push(`${comp}:\n${r}`)
      }

      const compPrompt = isEn
        ? `You are a competitive analyst. Based on AI research, compare ${brand_name} with its competitors.

RESEARCH:
${compResults.join('\n\n---\n\n')}

${brand_name}'s positioning: ${positioning}

Return structured JSON:
{
  "summary": "<2-3 sentence overview of competitive landscape>",
  "competitors": [
    {
      "name": "<competitor name>",
      "visibility_score": <estimated 0-100 AI visibility>,
      "strengths": ["<strength vs ${brand_name}>", "<another>"],
      "weaknesses": ["<weakness vs ${brand_name}>", "<another>"]
    }
  ]
}

Return ONLY the JSON.`
        : `Je bent een competitive analyst. Vergelijk ${brand_name} met concurrenten op basis van AI-onderzoek.

ONDERZOEK:
${compResults.join('\n\n---\n\n')}

Positionering van ${brand_name}: ${positioning}

Geef gestructureerde JSON:
{
  "summary": "<2-3 zinnen overzicht van het competitieve landschap>",
  "competitors": [
    {
      "name": "<naam concurrent>",
      "visibility_score": <geschatte 0-100 AI visibility>,
      "strengths": ["<sterkte ten opzichte van ${brand_name}>", "<nog een>"],
      "weaknesses": ["<zwakte ten opzichte van ${brand_name}>", "<nog een>"]
    }
  ]
}

Geef ALLEEN de JSON terug.`

      const compRaw = await askClaude(compPrompt, 1500)
      const parsed = parseJSON(compRaw) as typeof competitorData | null
      if (parsed) competitorData = parsed
    }

    // ========================================
    // STAP 5: Executive summary
    // ========================================
    const summaryPrompt = isEn
      ? `Write a 4-5 sentence executive summary for a brand perception audit of "${brand_name}" (${category}).

Visibility score: ${visibility.visibility_score}/100
Key gap: ${gaps.identity_gaps?.[0]?.dimension ?? 'unknown'} (${gaps.identity_gaps?.[0]?.score ?? '?'}/10)
Top finding: ${visibility.key_findings?.[0] ?? ''}
Competitive position: ${competitorData.summary || 'No competitor data'}

Write a compelling, analytical summary that a CMO would find valuable. Be direct and specific. ${isEn ? 'Write in English.' : ''}
Return ONLY the summary text, no JSON.`
      : `Schrijf een executive summary van 4-5 zinnen voor een brand perception audit van "${brand_name}" (${category}).

Visibility score: ${visibility.visibility_score}/100
Grootste kloof: ${gaps.identity_gaps?.[0]?.dimension ?? 'onbekend'} (${gaps.identity_gaps?.[0]?.score ?? '?'}/10)
Belangrijkste finding: ${visibility.key_findings?.[0] ?? ''}
Competitieve positie: ${competitorData.summary || 'Geen competitor data'}

Schrijf een overtuigende, analytische samenvatting die een CMO waardevol zou vinden. Wees direct en specifiek. Schrijf in het Nederlands.
Geef ALLEEN de samenvatting, geen JSON.`

    const executiveSummary = await askClaude(summaryPrompt, 500)

    // ========================================
    // Rapport samenstellen
    // ========================================
    const report = {
      version: 2,
      executive_summary: executiveSummary.replace(/^["']|["']$/g, '').trim(),
      visibility_score: visibility.visibility_score,
      visibility_summary: visibility.visibility_summary,
      category_scores: visibility.category_scores,
      key_findings: visibility.key_findings,
      ai_quotes: visibility.ai_quotes,
      identity_gaps: gaps.identity_gaps,
      cultural_signals: gaps.cultural_signals,
      action_plan: gaps.action_plan,
      competitor_benchmark: competitorData,
      prompts_tested: allResults.length,
      platforms_tested: ['Perplexity'],
    }

    await supabaseAdmin
      .from('audits')
      .update({
        status: 'completed',
        report,
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditId)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Pipeline error:', err)
    await supabaseAdmin
      .from('audits')
      .update({ status: 'failed' })
      .eq('id', auditId)

    return NextResponse.json({ error: 'Pipeline mislukt' }, { status: 500 })
  }
}

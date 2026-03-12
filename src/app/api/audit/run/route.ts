import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Perplexity query
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
      max_tokens: 400,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// Claude tekst genereren
async function askClaude(prompt: string, maxTokens = 1500): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return (msg.content[0] as { text: string }).text
}

export async function POST(req: NextRequest) {
  const { auditId, language = 'nl' } = await req.json()
  const isEn = language === 'en'
  if (!auditId) return NextResponse.json({ error: 'Geen auditId' }, { status: 400 })

  // Haal audit op
  const { data: audit } = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('id', auditId)
    .single()

  if (!audit) return NextResponse.json({ error: 'Audit niet gevonden' }, { status: 404 })

  // Zet op processing
  await supabaseAdmin
    .from('audits')
    .update({ status: 'processing' })
    .eq('id', auditId)

  try {
    const { brand_name, category, positioning, competitors } = audit

    // --- STAP 1: Visibility testen via Perplexity ---
    const visibilityPrompts = [
      `What do you know about the brand ${brand_name} in the ${category} market?`,
      `How would you describe ${brand_name} to someone who doesn't know it?`,
      `What are ${brand_name}'s core values and brand identity?`,
      `Who is the target audience of ${brand_name}?`,
      `How does ${brand_name} compare to its competitors in ${category}?`,
    ]

    const visibilityResults: string[] = []
    for (const prompt of visibilityPrompts) {
      const result = await queryPerplexity(prompt)
      visibilityResults.push(result)
    }

    const visibilityText = visibilityResults.join('\n\n---\n\n')

    // --- STAP 2: Visibility score + key findings via Claude ---
    const analysisPrompt = isEn
      ? `You are a brand perception analyst. Analyse how AI (Perplexity) describes the brand ${brand_name} based on the following AI responses:

${visibilityText}

The actual brand positioning is:
${positioning}

Return your analysis as JSON in this exact format:
{
  "visibility_score": <number 0-100>,
  "visibility_summary": "<2-3 sentence summary of how AI sees the brand>",
  "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"]
}

Return ONLY the JSON, no other text.`
      : `Je bent een brand perception analyst. Analyseer hoe AI (Perplexity) het merk ${brand_name} beschrijft op basis van de volgende AI-antwoorden:

${visibilityText}

De werkelijke merkpositionering is:
${positioning}

Geef je analyse als JSON met dit exacte formaat:
{
  "visibility_score": <getal 0-100>,
  "visibility_summary": "<2-3 zinnen samenvatting van hoe AI het merk ziet>",
  "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"]
}

Geef ALLEEN de JSON terug, geen andere tekst.`

    const analysisRaw = await askClaude(analysisPrompt, 800)
    let analysis: { visibility_score: number; visibility_summary: string; key_findings: string[] }

    try {
      const jsonMatch = analysisRaw.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch?.[0] ?? analysisRaw)
    } catch {
      analysis = {
        visibility_score: 50,
        visibility_summary: 'Analyse kon niet worden verwerkt.',
        key_findings: ['Geen findings beschikbaar'],
      }
    }

    // --- STAP 3: Identity gap analyse via Claude ---
    const gapPrompt = isEn
      ? `You are a brand strategist. Compare how AI sees the brand ${brand_name} with its intended brand identity.

AI perception (summary):
${analysis.visibility_summary}

AI responses to brand prompts:
${visibilityText.slice(0, 2000)}

Intended brand positioning:
${positioning}

Analyse the gap across 4 dimensions. Return as JSON:
{
  "identity_gaps": [
    { "dimension": "Tone of Voice", "score": <0-10 how strongly present>, "description": "<what matches and what doesn't>" },
    { "dimension": "Core Values", "score": <0-10>, "description": "<what matches and what doesn't>" },
    { "dimension": "Audience Recognition", "score": <0-10>, "description": "<what matches and what doesn't>" },
    { "dimension": "Market Position", "score": <0-10>, "description": "<what matches and what doesn't>" }
  ],
  "action_plan": [
    "<concrete action 1>",
    "<concrete action 2>",
    "<concrete action 3>",
    "<concrete action 4>",
    "<concrete action 5>"
  ]
}

Return ONLY the JSON.`
      : `Je bent een brand strategist. Vergelijk hoe AI het merk ${brand_name} ziet met de beoogde merkidentiteit.

AI-perceptie (samenvatting):
${analysis.visibility_summary}

AI-antwoorden op merkprompts:
${visibilityText.slice(0, 2000)}

Beoogde merkpositionering:
${positioning}

Analyseer de kloof op 4 dimensies. Geef als JSON:
{
  "identity_gaps": [
    { "dimension": "Tone of Voice", "score": <0-10 hoe sterk aanwezig>, "description": "<wat klopt en wat niet>" },
    { "dimension": "Kernwaarden", "score": <0-10>, "description": "<wat klopt en wat niet>" },
    { "dimension": "Doelgroep herkenning", "score": <0-10>, "description": "<wat klopt en wat niet>" },
    { "dimension": "Marktpositie", "score": <0-10>, "description": "<wat klopt en wat niet>" }
  ],
  "action_plan": [
    "<concrete actie 1>",
    "<concrete actie 2>",
    "<concrete actie 3>",
    "<concrete actie 4>",
    "<concrete actie 5>"
  ]
}

Geef ALLEEN de JSON terug.`

    const gapRaw = await askClaude(gapPrompt, 1200)
    let gapAnalysis: { identity_gaps: { dimension: string; score: number; description: string }[]; action_plan: string[] }

    try {
      const jsonMatch = gapRaw.match(/\{[\s\S]*\}/)
      gapAnalysis = JSON.parse(jsonMatch?.[0] ?? gapRaw)
    } catch {
      gapAnalysis = {
        identity_gaps: [],
        action_plan: [],
      }
    }

    // --- STAP 4: Competitor benchmark (als competitors opgegeven) ---
    let competitorAnalysis = ''
    if (competitors && competitors.length > 0) {
      const competitorNames = competitors.join(' en ')
      const compResult = await queryPerplexity(
        `How does ${brand_name} compare to ${competitorNames} in the ${category} market? What are the key differences in brand perception?`
      )
      competitorAnalysis = compResult
    }

    // --- Rapport samenstellen ---
    const report = {
      visibility_score: analysis.visibility_score,
      visibility_summary: analysis.visibility_summary,
      key_findings: analysis.key_findings,
      identity_gaps: gapAnalysis.identity_gaps,
      action_plan: gapAnalysis.action_plan,
      competitor_analysis: competitorAnalysis,
    }

    // Schrijf rapport naar database
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function fallbackInsight(reason: string) {
  return {
    summary: `AI insight generation is unavailable because ${reason} Review the dashboard charts for the operator-led 30-day assessment.`,
    trends: [],
    recommendations: ['Review high-priority community reports', 'Compare this week with the previous week before reallocating resources'],
    fallback: true
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reports_summary } = await req.json()

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify(fallbackInsight('Gemini is not configured in this Edge Function environment.')), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const systemPrompt = `You are an analytics AI for the Santa Rosa City CDRRMO Community Insight Dashboard. Analyze community report data and generate a concise, actionable 30-day summary for disaster response operators.

Focus on:
- Patterns in report types and locations
- Emerging trends that may indicate developing situations
- Actionable recommendations for resource allocation
- Notable week-over-week changes

Keep language professional, concise, and data-driven. Respond with valid JSON only.`

    const userPrompt = `Analyze this 30-day community report summary and generate insights:

${JSON.stringify(reports_summary, null, 2)}

Respond with this exact JSON structure:
{
  "summary": "A 2-3 paragraph natural language summary of the 30-day data",
  "trends": ["trend 1", "trend 2", "trend 3"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      })
    })

    if (!geminiResponse.ok) {
      return new Response(JSON.stringify(fallbackInsight('the Gemini service returned an error.')), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const geminiData = await geminiResponse.json()
    const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    let parsed
    try {
      parsed = JSON.parse(textContent)
    } catch {
      parsed = {
        summary: 'Unable to parse AI response. Raw data is available in the dashboard charts.',
        trends: [],
        recommendations: []
      }
    }

    return new Response(JSON.stringify({
      summary: parsed.summary || 'No summary generated.',
      trends: Array.isArray(parsed.trends) ? parsed.trends : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('generate-insight error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

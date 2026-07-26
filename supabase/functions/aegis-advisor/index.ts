import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function fallbackAdvisory(rawInputs: Record<string, unknown>, barangay: string, reason: string) {
  return {
    recommended_action: `Deploy nearest available rescue team to ${barangay || 'the affected area'}`,
    target_barangay: barangay || 'Unknown',
    reasoning: `Step 1: ${reason}\nStep 2: Review the reported SOS cluster and current hazard level.\nStep 3: Apply the standard CDRRMO dispatch protocol.\nStep 4: Human operator approval is required before any action.`,
    confidence: 'low',
    raw_inputs: rawInputs,
    fallback: true
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sos_ids, cluster_barangay, cluster_count, flood_zone_severity, weather_alert } = await req.json()

    const rawInputs = {
      sos_cluster: { ids: sos_ids || [], barangay: cluster_barangay, count: cluster_count || 0 },
      flood_zone: { severity: flood_zone_severity || 'none' },
      weather: { alert: weather_alert || 'No active weather alert' }
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify(fallbackAdvisory(rawInputs, cluster_barangay || '', 'Gemini is not configured in this Edge Function environment.')), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const systemPrompt = `You are Aegis, the AI advisory engine for Santa Rosa City CDRRMO (City Disaster Risk Reduction and Management Office). You provide disaster response recommendations that are ADVISORY ONLY — you never make decisions, only suggest actions for human operators to approve, modify, or reject.

Your role:
- Analyze active SOS clusters, flood zone severity, and weather alerts
- Recommend specific response actions (e.g., deploy rescue teams, pre-position boats, evacuate barangays)
- Provide step-by-step reasoning that operators can verify against the raw data
- Be specific about target barangays and resource allocation
- Always err on the side of caution for life-safety situations

You must respond with valid JSON only, no markdown or extra text.`

    const userPrompt = `Analyze the following situation and provide a response recommendation:

SOS Cluster: ${cluster_count || 0} active SOS reports in Barangay ${cluster_barangay || 'Unknown'}
SOS IDs: ${JSON.stringify(sos_ids || [])}
Flood Zone Severity: ${flood_zone_severity || 'None active'}
Active Weather Alert: ${weather_alert || 'No active weather alert'}

Respond with this exact JSON structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
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
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      })
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error:', errText)
      return new Response(JSON.stringify(fallbackAdvisory(rawInputs, cluster_barangay || '', 'Gemini is temporarily unavailable.')), {
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
        recommended_action: 'Review SOS cluster and deploy response team',
        target_barangay: cluster_barangay || 'Unknown',
        reasoning: 'AI response parsing failed. Raw output available for manual review.',
        confidence: 'low'
      }
    }

    // Validate enum values
    const validConfidence = ['high', 'medium', 'low']
    if (!validConfidence.includes(parsed.confidence)) {
      parsed.confidence = 'medium'
    }

    const result = {
      recommended_action: parsed.recommended_action || 'Assess and respond',
      target_barangay: parsed.target_barangay || cluster_barangay || 'Unknown',
      reasoning: parsed.reasoning || 'No detailed reasoning available.',
      confidence: parsed.confidence,
      raw_inputs: rawInputs
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('aegis-advisor error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

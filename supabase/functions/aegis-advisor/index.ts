import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

function formatReasoning(text: string): string {
  return text.replace(/\bStep (\d+):/gi, '\nStep $1:').replace(/^\n/, '').trim()
}

function fallbackAdvisory(rawInputs: Record<string, unknown>, barangay: string, reason: string, scenarioType: string, debugInfo?: string) {
  return {
    recommended_action: `Deploy nearest available rescue team to ${barangay || 'the affected area'}`,
    target_barangay: barangay || 'Unknown',
    reasoning: formatReasoning(`Step 1: ${reason}\nStep 2: Review the reported SOS cluster and current hazard level.\nStep 3: Apply the standard CDRRMO dispatch protocol.\nStep 4: Human operator approval is required before any action.`),
    confidence: 'low',
    scenario_type: scenarioType,
    raw_inputs: rawInputs,
    fallback: true,
    ...(debugInfo ? { _debug: debugInfo } : {}),
  }
}

async function callGemini(model: string, prompt: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `${model} returned ${res.status}: ${errText.slice(0, 500)}` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: `${model} fetch failed: ${String(err)}` }
  }
}

function extractJsonFromText(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try { return JSON.parse(text) } catch { /* fall through */ }
  // Try extracting a JSON block from markdown
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]) } catch { /* fall through */ }
  }
  // Try finding any { ... } block
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]) } catch { /* fall through */ }
  }
  return null
}

function buildFloodPrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, the AI advisory engine for Santa Rosa City CDRRMO (City Disaster Risk Reduction and Management Office). You provide disaster response recommendations that are ADVISORY ONLY — you never make decisions, only suggest actions for human operators to approve, modify, or reject.

Your role:
- You are an AI water rescue and flood response advisor
- Focus on water rescue operations, boat deployment, evacuation center activation, sandbag placement
- Context: Rising flood waters, current-driven rescues, flood-prone areas
- Recommend specific response actions (e.g., deploy rescue teams, pre-position boats, evacuate barangays)
- Provide step-by-step reasoning that operators can verify against the raw data
- Be specific about target barangays and resource allocation
- Always err on the side of caution for life-safety situations

Example recommendation: "Deploy 2 rubber boats to Barangay Tagapo for flood rescue operations. Activate Barangay Hall as evacuation center."

Analyze the following situation:

SOS Cluster: ${count} active SOS reports in Barangay ${barangay || 'Unknown'}
SOS IDs: ${JSON.stringify(sosIds || [])}
Flood Zone Severity: ${floodSeverity || 'None active'}
Active Weather Alert: ${weatherAlert || 'No active weather alert'}

Respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
}
IMPORTANT: In the reasoning field, be sure to separate each step with the actual newline character (\n).`
}

function buildEarthquakePrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, the AI advisory engine for Santa Rosa City CDRRMO (City Disaster Risk Reduction and Management Office). You provide disaster response recommendations that are ADVISORY ONLY — you never make decisions, only suggest actions for human operators to approve, modify, or reject.

Your role:
- You are an AI urban search & rescue and structural assessment advisor
- Focus on building collapse, casualty triage, structural inspection priorities, aftershock safety
- Context: Potential trapped victims, damaged infrastructure, gas leaks, aftershock risks
- Recommend specific response actions (e.g., dispatch USAR teams, establish triage areas, inspect structures)
- Provide step-by-step reasoning that operators can verify against the raw data
- Be specific about target barangays and resource allocation
- Always err on the side of caution for life-safety situations

Example recommendation: "Dispatch USAR team to Barangay Malitlit for structural assessment. Establish medical triage at Barangay Plaza."

Analyze the following situation:

SOS Cluster: ${count} active SOS reports in Barangay ${barangay || 'Unknown'}
SOS IDs: ${JSON.stringify(sosIds || [])}
Flood Zone Severity: ${floodSeverity || 'None active'}
Active Weather Alert: ${weatherAlert || 'No active weather alert'}

Respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
}
IMPORTANT: In the reasoning field, be sure to separate each step with the actual newline character (\n).`
}

function buildTyphoonPrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, the AI advisory engine for Santa Rosa City CDRRMO (City Disaster Risk Reduction and Management Office). You provide disaster response recommendations that are ADVISORY ONLY — you never make decisions, only suggest actions for human operators to approve, modify, or reject.

Your role:
- You are an AI pre-emptive evacuation and shelter management advisor
- Focus on pre-emptive evacuation orders, shelter capacity management, power line hazards, tree clearing
- Context: Strong winds, flying debris, power outages, coastal storm surge
- Recommend specific response actions (e.g., evacuate coastal zones, open shelters, deploy clearing crews)
- Provide step-by-step reasoning that operators can verify against the raw data
- Be specific about target barangays and resource allocation
- Always err on the side of caution for life-safety situations

Example recommendation: "Pre-emptively evacuate Barangay Dila coastal zone. Open 2 additional evacuation centers. Deploy line clearing crew."

Analyze the following situation:

SOS Cluster: ${count} active SOS reports in Barangay ${barangay || 'Unknown'}
SOS IDs: ${JSON.stringify(sosIds || [])}
Flood Zone Severity: ${floodSeverity || 'None active'}
Active Weather Alert: ${weatherAlert || 'No active weather alert'}

Respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
}
IMPORTANT: In the reasoning field, be sure to separate each step with the actual newline character (\n).`
}

function buildFirePrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, the AI advisory engine for Santa Rosa City CDRRMO (City Disaster Risk Reduction and Management Office). You provide disaster response recommendations that are ADVISORY ONLY — you never make decisions, only suggest actions for human operators to approve, modify, or reject.

Your role:
- You are an AI fire suppression and urban fire response advisor
- Focus on fire containment strategy, adjacent building evacuation, medical support for burn victims, water supply
- Context: Structural fire, fire spread risk, hazardous materials, crowd control
- Recommend specific response actions (e.g., deploy fire trucks, evacuate perimeter, establish triage)
- Provide step-by-step reasoning that operators can verify against the raw data
- Be specific about target barangays and resource allocation
- Always err on the side of caution for life-safety situations

Example recommendation: "Deploy BFP fire trucks to Barangay Market Area. Evacuate 50m perimeter. Establish medical triage for burn victims."

Analyze the following situation:

SOS Cluster: ${count} active SOS reports in Barangay ${barangay || 'Unknown'}
SOS IDs: ${JSON.stringify(sosIds || [])}
Flood Zone Severity: ${floodSeverity || 'None active'}
Active Weather Alert: ${weatherAlert || 'No active weather alert'}

Respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
}
IMPORTANT: In the reasoning field, be sure to separate each step with the actual newline character (\n).`
}

function buildLandslidePrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, the AI advisory engine for Santa Rosa City CDRRMO (City Disaster Risk Reduction and Management Office). You provide disaster response recommendations that are ADVISORY ONLY — you never make decisions, only suggest actions for human operators to approve, modify, or reject.

Your role:
- You are an AI geohazard assessment and landslide response advisor
- Focus on slope stability monitoring, route closure decisions, pre-emptive evacuation of hillside communities, geotechnical assessment
- Context: Continuous rain, saturated soil, tension cracks, blocked roads
- Recommend specific response actions (e.g., close access roads, evacuate hillside areas, deploy geohazard teams)
- Provide step-by-step reasoning that operators can verify against the raw data
- Be specific about target barangays and resource allocation
- Always err on the side of caution for life-safety situations

Example recommendation: "Close Barangay Sinalhan access road. Pre-emptively evacuate hillside households. Deploy geohazard assessment team."

Analyze the following situation:

SOS Cluster: ${count} active SOS reports in Barangay ${barangay || 'Unknown'}
SOS IDs: ${JSON.stringify(sosIds || [])}
Flood Zone Severity: ${floodSeverity || 'None active'}
Active Weather Alert: ${weatherAlert || 'No active weather alert'}

Respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
}
IMPORTANT: In the reasoning field, be sure to separate each step with the actual newline character (\n).`
}

function buildPrompt(scenarioType: string, sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  const builders: Record<string, (sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string) => string> = {
    flood: buildFloodPrompt,
    earthquake: buildEarthquakePrompt,
    typhoon: buildTyphoonPrompt,
    fire: buildFirePrompt,
    landslide: buildLandslidePrompt,
  }
  if (!builders[scenarioType]) {
    console.warn(`Aegis: Unknown scenario_type "${scenarioType}", defaulting to flood`)
  }
  const builder = builders[scenarioType] || buildFloodPrompt
  return builder(sosIds, barangay, count, floodSeverity, weatherAlert)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let rawInputs: Record<string, unknown> = {}
  let scenarioType = 'flood'
  let clusterBarangay = ''

  try {
    const { sos_ids, cluster_barangay, cluster_count, flood_zone_severity, weather_alert, scenario_type } = await req.json()

    scenarioType = scenario_type || 'flood'
    clusterBarangay = cluster_barangay || ''

    rawInputs = {
      sos_cluster: { ids: sos_ids || [], barangay: clusterBarangay, count: cluster_count || 0 },
      flood_zone: { severity: flood_zone_severity || 'none' },
      weather: { alert: weather_alert || 'No active weather alert' },
      scenario_type: scenarioType
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify(fallbackAdvisory(rawInputs, clusterBarangay, 'Gemini is not configured in this Edge Function environment.', scenarioType)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const prompt = buildPrompt(
      scenarioType, sos_ids || [], clusterBarangay || 'Tagapo', cluster_count || 0,
      flood_zone_severity || 'none', weather_alert
    )

    // Try each model in order, stop at first success
    const errors: string[] = []
    for (const model of MODELS) {
      const result = await callGemini(model, prompt)
      if (result.ok && result.data) {
        const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = extractJsonFromText(text)
          if (parsed) {
            const validConfidence = ['high', 'medium', 'low']
            if (!validConfidence.includes(parsed.confidence as string)) {
              parsed.confidence = 'medium'
            }
            const response = {
              recommended_action: parsed.recommended_action || 'Assess and respond',
              target_barangay: parsed.target_barangay || clusterBarangay || 'Unknown',
              reasoning: formatReasoning((parsed.reasoning as string) || 'No detailed reasoning available.'),
              confidence: parsed.confidence,
              scenario_type: scenarioType,
              raw_inputs: rawInputs,
            }
            return new Response(JSON.stringify(response), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          errors.push(`${model}: response wasn't valid JSON — "${text.slice(0, 200)}"`)
        } else {
          errors.push(`${model}: empty response text`)
        }
      } else {
        errors.push(result.error || `${model}: unknown error`)
      }
    }

    // All models failed
    const debugInfo = errors.join(' | ')
    console.error('All Gemini models failed:', debugInfo)
    return new Response(JSON.stringify(fallbackAdvisory(rawInputs, clusterBarangay, 'AI service unavailable after retry.', scenarioType, debugInfo)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('aegis-advisor error:', err)
    return new Response(JSON.stringify(fallbackAdvisory(rawInputs, clusterBarangay, `Unhandled exception: ${err.message}`, scenarioType, 'unhandled-exception')), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

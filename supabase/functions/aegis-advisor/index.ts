import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
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
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024, stopSequences: ["\n\n\n"] },
      }),
    })
    if (!res.ok) {
      if (res.status === 429) {
        return { ok: false, error: "QUOTA_EXCEEDED" }
      }
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
  return `You are Aegis, AI advisor for Santa Rosa CDRRMO. Provide advisory recommendations only — never decisions, only suggestions for human operators to approve or modify.

Focus: water rescue, boat deployment, evacuation center activation, sandbag placement.
Context: rising flood waters, current-driven rescues, flood-prone areas.

Example: "Deploy 2 rubber boats to Barangay Tagapo for flood rescue. Activate Barangay Hall as evacuation center."

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
Confidence: HIGH = specific actionable data (confirmed cluster, known hazard, clear alert). MEDIUM = data present but incomplete. LOW = data minimal or vague. Default HIGH with 3+ SOS reports and defined hazard.
IMPORTANT: In the reasoning field, separate each step with actual newline character (\n).`
}

function buildEarthquakePrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, AI advisor for Santa Rosa CDRRMO. Provide advisory recommendations only — never decisions, only suggestions for human operators to approve or modify.

Focus: urban search & rescue, structural assessment, casualty triage, aftershock safety.
Context: building collapse, trapped victims, damaged infrastructure, gas leaks.

Example: "Dispatch USAR team to Barangay Malitlit for structural assessment. Establish medical triage at Barangay Plaza."

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
Confidence: HIGH = specific actionable data (confirmed cluster, known hazard, clear alert). MEDIUM = data present but incomplete. LOW = data minimal or vague. Default HIGH with 3+ SOS reports and defined hazard.
IMPORTANT: In the reasoning field, separate each step with actual newline character (\n).`
}

function buildTyphoonPrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, AI advisor for Santa Rosa CDRRMO. Provide advisory recommendations only — never decisions, only suggestions for human operators to approve or modify.

Focus: pre-emptive evacuation, shelter management, power line hazards, tree clearing.
Context: strong winds, flying debris, power outages, coastal storm surge.

Example: "Pre-emptively evacuate Barangay Dila coastal zone. Open 2 additional evacuation centers. Deploy line clearing crew."

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
Confidence: HIGH = specific actionable data (confirmed cluster, known hazard, clear alert). MEDIUM = data present but incomplete. LOW = data minimal or vague. Default HIGH with 3+ SOS reports and defined hazard.
IMPORTANT: In the reasoning field, separate each step with actual newline character (\n).`
}

function buildFirePrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, AI advisor for Santa Rosa CDRRMO. Provide advisory recommendations only — never decisions, only suggestions for human operators to approve or modify.

Focus: fire containment, building evacuation, burn victim medical support, water supply.
Context: structural fire, fire spread risk, hazardous materials, crowd control.

Example: "Deploy BFP fire trucks to Barangay Market Area. Evacuate 50m perimeter. Establish medical triage for burn victims."

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
Confidence: HIGH = specific actionable data (confirmed cluster, known hazard, clear alert). MEDIUM = data present but incomplete. LOW = data minimal or vague. Default HIGH with 3+ SOS reports and defined hazard.
IMPORTANT: In the reasoning field, separate each step with actual newline character (\n).`
}

function buildLandslidePrompt(sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string): string {
  return `You are Aegis, AI advisor for Santa Rosa CDRRMO. Provide advisory recommendations only — never decisions, only suggestions for human operators to approve or modify.

Focus: slope stability monitoring, route closures, hillside evacuation, geotechnical assessment.
Context: continuous rain, saturated soil, tension cracks, blocked roads.

Example: "Close Barangay Sinalhan access road. Pre-emptively evacuate hillside households. Deploy geohazard assessment team."

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
Confidence: HIGH = specific actionable data (confirmed cluster, known hazard, clear alert). MEDIUM = data present but incomplete. LOW = data minimal or vague. Default HIGH with 3+ SOS reports and defined hazard.
IMPORTANT: In the reasoning field, separate each step with actual newline character (\n).`
}

function buildReportPrompt(communityReport: Record<string, unknown>, barangay: string): string {
  const description = (communityReport.description as string) || 'No description provided'
  const category = (communityReport.category as string) || 'general'
  const priority = (communityReport.priority as string) || 'unknown'
  const plausibility = (communityReport.plausibility as string) || 'unverified'
  const reasoning = (communityReport.reasoning as string) || 'No AI reasoning available'

  return `You are Aegis, AI advisor for Santa Rosa CDRRMO. Provide advisory recommendations only — never decisions, only suggestions for human operators to approve or modify.

Focus: community incident response, department referral, targeted dispatch based on AI triage.
Context: AI-triaged community report with category, priority and plausibility classification.

Example: "Dispatch barangay health workers to verify the mental health concern at Barangay Tagapo and refer the case to the City Social Welfare Office."

Analyze the following situation:

Community Report: ${description}
AI Category: ${category}
AI Priority: ${priority}
AI Plausibility: ${plausibility}
AI Reasoning: ${reasoning}
Barangay: ${barangay || 'Unknown'}

Respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "recommended_action": "specific action to take",
  "target_barangay": "primary target barangay",
  "reasoning": "Step 1: [observation]\\nStep 2: [analysis]\\nStep 3: [conclusion]\\nStep 4: [recommended action rationale]",
  "confidence": "high|medium|low"
}
Confidence: HIGH = plausible, high/critical priority report with clear category and context. MEDIUM = data present but incomplete or priority uncertain. LOW = data minimal, vague, or plausibility unverified. Only default HIGH for high/critical priority with verified plausibility.
IMPORTANT: In the reasoning field, separate each step with actual newline character (\n).`
}

function buildPrompt(scenarioType: string, sosIds: string[], barangay: string, count: number, floodSeverity: string, weatherAlert: string, communityReport?: Record<string, unknown>): string {
  if (scenarioType === 'report') {
    if (communityReport) {
      return buildReportPrompt(communityReport, barangay)
    }
    console.warn(`Aegis: scenario_type "report" received without community_report, defaulting to flood`)
  }
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
    const { sos_ids, cluster_barangay, cluster_count, flood_zone_severity, weather_alert, scenario_type, community_report } = await req.json()

    scenarioType = scenario_type || 'flood'
    clusterBarangay = cluster_barangay || ''

    rawInputs = {
      sos_cluster: { ids: sos_ids || [], barangay: clusterBarangay, count: cluster_count || 0 },
      flood_zone: { severity: flood_zone_severity || 'none' },
      weather: { alert: weather_alert || 'No active weather alert' },
      scenario_type: scenarioType,
      ...(community_report ? { community_report } : {})
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify(fallbackAdvisory(rawInputs, clusterBarangay, 'Gemini is not configured in this Edge Function environment.', scenarioType)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const prompt = buildPrompt(
      scenarioType, sos_ids || [], clusterBarangay || 'Tagapo', cluster_count || 0,
      flood_zone_severity || 'none', weather_alert, community_report
    )

    // Try each model in order, stop at first success
    const errors: string[] = []
    for (const model of MODELS) {
      const result = await callGemini(model, prompt)
      if (result.error === "QUOTA_EXCEEDED") {
        errors.push(result.error)
        break
      }
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

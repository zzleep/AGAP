import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_CATEGORIES = ['bullying', 'infrastructure', 'environment', 'mental_health']
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical']
const VALID_PLAUSIBILITIES = ['plausible', 'uncertain', 'implausible']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { report_id, raw_description, barangay } = await req.json()

    if (!raw_description) {
      return new Response(JSON.stringify({ error: "raw_description is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const systemPrompt = `You are AGAP emergency classifier for Santa Rosa City, Laguna.
Analyze the following community report and return strictly valid JSON matching this schema:
{
  "ai_category": "bullying" | "infrastructure" | "environment" | "mental_health",
  "ai_priority": "low" | "medium" | "high" | "critical",
  "ai_department": "string department name (e.g. CDRRMO, DPWH, BFP, MERALCO, City Health Office, CSWDO)",
  "ai_reasoning": "brief concise rationale",
  "ai_plausibility": "plausible" | "uncertain" | "implausible"
}

Category Guidelines:
- infrastructure: road damage, submerged roads, fallen bridges, powerline damage, clogged canals
- environment: fallen trees, river overflow, garbage accumulation, chemical spills
- mental_health: distress call, suicide concern, severe anxiety/helplessness
- bullying: harassment, community conflict, school/neighborhood violence

Report Barangay: ${barangay || 'Unknown'}
Report Description: "${raw_description}"`

    let aiResult = {
      ai_category: "infrastructure",
      ai_priority: "medium",
      ai_department: "CDRRMO",
      ai_reasoning: "Automated baseline triage applied.",
      ai_plausibility: "plausible"
    }

    if (GEMINI_API_KEY) {
      try {
        const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
        )

        if (response.ok) {
          const geminiData = await response.json()
          const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
          if (textOutput) {
            try {
              const parsed = JSON.parse(textOutput)
              if (
                parsed &&
                VALID_CATEGORIES.includes(parsed.ai_category) &&
                VALID_PRIORITIES.includes(parsed.ai_priority) &&
                VALID_PLAUSIBILITIES.includes(parsed.ai_plausibility)
              ) {
                aiResult = parsed
              }
            } catch (e) {
              console.error("Failed to parse Gemini JSON:", e)
            }
          }
        }
      } catch (e) {
        console.warn("Gemini classification unavailable; using baseline triage:", e)
      }
    }

    // Update database row using service role key if SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL exist
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && report_id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      await supabase
        .from('community_reports')
        .update(aiResult)
        .eq('id', report_id)
    }

    return new Response(JSON.stringify(aiResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

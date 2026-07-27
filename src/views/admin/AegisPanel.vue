<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">Aegis AI Advisory Command Panel</h2>
        <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider mt-0.5">Gemini 2.0 Flash operational recommendations — advisory only, human-gated</p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          @click="simulateScenario"
          :disabled="isLoading"
          class="px-4 py-2 rounded-full bg-[#1F3A4B]/10 hover:bg-[#1F3A4B]/20 text-[#1F3A4B] text-xs font-black transition-all border border-[#1F3A4B]/20 disabled:opacity-50 flex items-center space-x-2 active:scale-95"
        >
          <svg class="w-4 h-4 text-[#1F3A4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Simulate Scenario</span>
        </button>
        <button
          v-if="!activeRecommendation && !isLoading"
          @click="askAegis"
          class="px-5 py-2.5 rounded-full bg-[#1F3A4B] hover:bg-[#152733] text-white text-xs font-black transition-all shadow-md active:scale-95 flex items-center space-x-2 uppercase tracking-wider"
        >
          <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Ask Aegis</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-10 rounded-[2.5rem] bg-white border border-[#1F3A4B]/10 text-center space-y-4 shadow-sm">
      <div class="w-10 h-10 mx-auto border-3 border-[#1F3A4B] border-t-transparent rounded-full animate-spin"></div>
      <p class="text-base text-[#1F3A4B] font-black">Aegis is analyzing the situation...</p>
      <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider">Consulting Gemini 2.0 Flash for operational recommendation</p>
    </div>

    <div v-if="outcomeError" class="p-4 rounded-2xl bg-[#FDE8E5] border border-[#D14D3E]/30 text-xs text-[#D14D3E] font-black">
      {{ outcomeError }} The advisory remains uncommitted; restore connectivity and retry.
    </div>

    <!-- Active Recommendation Panel -->
    <div v-if="activeRecommendation && !isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-5">
        <!-- Recommendation Card -->
        <div class="p-7 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-white border border-[#1F3A4B]/15 space-y-5 shadow-md admin-card">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-black tracking-wider text-[#1F3A4B]">Active AI Recommendation</span>
            <span
              :class="[
                'px-3.5 py-1.5 text-[10px] uppercase font-black rounded-full shadow-sm',
                activeRecommendation.confidence === 'high' ? 'bg-[#556B2F] text-white' :
                activeRecommendation.confidence === 'medium' ? 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]' :
                'bg-[#1F3A4B] text-white'
              ]"
            >
              {{ activeRecommendation.confidence }} Confidence
            </span>
          </div>

          <h3 class="font-black text-[#1F3A4B] text-2xl leading-snug">{{ activeRecommendation.recommended_action }}</h3>
          <div class="text-xs font-bold text-[#717171]">
            <span class="font-black text-[#902715] uppercase tracking-wider">Target Barangay:</span>
            <span class="text-[#1F3A4B] font-black text-sm ml-1">Barangay {{ activeRecommendation.target_barangay }}</span>
          </div>

          <!-- Solid Canary Yellow Reasoning Box -->
          <div class="p-5 rounded-2xl bg-[#F7FB41] border border-[#8a7e00] space-y-2 shadow-sm">
            <span class="text-[10px] uppercase font-black text-[#0A0A0A] tracking-wider">Step-by-Step Reasoning</span>
            <div class="text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-line font-black">{{ activeRecommendation.reasoning }}</div>
          </div>

          <!-- Expandable Raw Inputs -->
          <details class="group">
            <summary class="text-[10px] uppercase font-black text-[#717171] tracking-wider cursor-pointer hover:text-[#902715] transition-colors">
              Raw Inputs (click to expand)
            </summary>
            <div class="mt-2 p-4 rounded-2xl bg-[#1F3A4B] border border-[#1F3A4B]">
              <pre class="text-[10px] text-[#F7FB41] font-mono overflow-x-auto font-bold">{{ JSON.stringify(activeRecommendation.raw_inputs, null, 2) }}</pre>
            </div>
          </details>

          <!-- Action Buttons — NO DEFAULT SELECTION -->
          <div class="flex items-center space-x-3 pt-4 border-t border-[#1F3A4B]/15">
            <span class="text-[10px] font-black text-[#717171] uppercase tracking-wider mr-1">Operator Action:</span>
            <button
              @click="submitOutcome('approved')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-5 py-2.5 rounded-full font-black text-xs shadow-md transition-all active:scale-95',
                selectedOutcome === 'approved'
                  ? 'bg-[#556B2F] text-white ring-2 ring-[#556B2F]/40'
                  : 'bg-[#556B2F] hover:bg-[#435525] text-white'
              ]"
            >
              ✓ Approve Advisory
            </button>
            <button
              @click="submitOutcome('modified')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-5 py-2.5 rounded-full font-black text-xs transition-all active:scale-95',
                selectedOutcome === 'modified'
                  ? 'bg-[#1F3A4B] text-white ring-2 ring-[#1F3A4B]/40'
                  : 'bg-[#1F3A4B] hover:bg-[#152733] text-white'
              ]"
            >
              ✎ Modify Action
            </button>
            <button
              @click="submitOutcome('rejected')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-5 py-2.5 rounded-full font-black text-xs transition-all active:scale-95',
                selectedOutcome === 'rejected'
                  ? 'bg-[#902715] text-white ring-2 ring-[#902715]/40'
                  : 'bg-[#902715] hover:bg-[#a82e1a] text-white'
              ]"
            >
              ✕ Reject
            </button>
          </div>

          <!-- Outcome confirmation -->
          <div v-if="selectedOutcome" class="p-4 rounded-2xl bg-[#556B2F] text-white text-xs font-black shadow-sm">
            ✓ Logged as <span class="font-black uppercase text-[#F7FB41]">{{ selectedOutcome }}</span> to aegis_suggestions table.
            <button @click="resetPanel" class="ml-2 underline hover:text-[#F7FB41] font-black">Dismiss & request new advisory</button>
          </div>
        </div>
      </div>

      <!-- Raw Inputs Sidebar with Solid Color Cards -->
      <div class="p-6 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-white border border-[#1F3A4B]/15 space-y-4 shadow-sm admin-card">
        <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Situational Inputs</h3>
        <div class="space-y-3 text-xs">
          <!-- Solid Brandy Red SOS Cluster Card -->
          <div class="p-4 rounded-2xl bg-[#902715] text-white shadow-sm">
            <span class="text-[10px] text-white/80 font-black uppercase block tracking-wider">SOS Cluster</span>
            <span class="text-white font-black text-lg block">{{ activeRecommendation.raw_inputs?.sos_cluster?.count || 0 }} reports</span>
            <span class="text-[#F7FB41] font-black block text-xs">Barangay {{ activeRecommendation.raw_inputs?.sos_cluster?.barangay }}</span>
          </div>

          <!-- Solid Earthy Slate Blue Flood Zone Card -->
          <div class="p-4 rounded-2xl bg-[#1F3A4B] text-white shadow-sm">
            <span class="text-[10px] text-white/80 font-black uppercase block tracking-wider">Flood Zone Severity</span>
            <span :class="[
              'font-black capitalize text-base block',
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'danger' ? 'text-[#F7FB41]' :
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'warning' ? 'text-[#F7FB41]' :
              'text-white'
            ]">
              {{ activeRecommendation.raw_inputs?.flood_zone?.severity || 'None' }}
            </span>
          </div>

          <!-- Solid Canary Yellow Weather Card -->
          <div class="p-4 rounded-2xl bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00] shadow-sm">
            <span class="text-[10px] text-[#0A0A0A]/80 font-black uppercase block tracking-wider">Weather Alert</span>
            <span class="text-[#0A0A0A] font-black text-sm block">{{ activeRecommendation.raw_inputs?.weather?.alert || 'None' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Active Recommendation Standby Banner -->
    <div v-if="!activeRecommendation && !isLoading" class="p-12 rounded-3xl bg-white border border-[#1F3A4B]/15 text-center space-y-4 shadow-sm admin-card">
      <div class="w-16 h-16 mx-auto rounded-3xl bg-[#1F3A4B] text-[#F7FB41] flex items-center justify-center shadow-md">
        <svg class="w-8 h-8 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h4 class="text-xl font-black text-[#1F3A4B]">Aegis Advisory Engine Standby</h4>
      <p class="text-xs text-[#717171] max-w-md mx-auto font-bold leading-relaxed">
        Aegis auto-surfaces when an incident cluster forms (3+ SOS in same barangay within 30 min).
        For single SOS incidents, use the "Ask Aegis" button above.
      </p>
    </div>

    <!-- Advisory History Log Card -->
    <div class="p-7 rounded-[1rem_3.5rem_1rem_3.5rem] bg-white border-2 border-[#1F3A4B]/20 space-y-5 shadow-sm admin-card">
      <div class="flex items-center justify-between border-b-2 border-[#1F3A4B]/15 pb-3">
        <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Advisory History Log</h3>
        <button @click="fetchHistory" class="text-xs text-[#902715] hover:underline font-black uppercase tracking-wider">
          Refresh Log
        </button>
      </div>
      <div v-if="historyLog.length === 0" class="text-xs text-[#717171] p-6 text-center font-bold">
        No advisory history yet. Aegis suggestions will appear here after operator action.
      </div>
      <div v-else class="space-y-3 max-h-64 overflow-y-auto pr-1">
        <div
          v-for="entry in historyLog"
          :key="entry.id"
          class="p-4 rounded-2xl bg-white border-2 border-[#1F3A4B]/15 border-l-4 border-l-[#902715] flex items-center justify-between transition-colors hover:bg-[#1F3A4B]/5 shadow-sm"
        >
          <div>
            <p class="font-black text-[#1F3A4B] text-xs leading-snug">{{ entry.recommended_action }}</p>
            <p class="text-[10px] text-[#717171] font-bold mt-0.5">Barangay {{ entry.target_barangay }} · {{ formatTimeAgo(entry.created_at) }}</p>
          </div>
          <span
            :class="[
              'px-3.5 py-1.5 text-[10px] font-black rounded-full uppercase shadow-sm shrink-0 ml-2',
              entry.outcome === 'approved' ? 'bg-[#556B2F] text-white' :
              entry.outcome === 'modified' ? 'bg-[#1F3A4B] text-white' :
              'bg-[#902715] text-white'
            ]"
          >
            {{ entry.outcome }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSOSStore } from '@/stores/sosStore'
import { useAuthStore } from '@/stores/authStore'
import { useFlowStore } from '@/stores/flowStore'
import { supabase } from '@/lib/supabase'

const sosStore = useSOSStore()
const authStore = useAuthStore()
const flowStore = useFlowStore()

const isLoading = ref(false)
const activeRecommendation = ref(null)
const selectedOutcome = ref(null)
const outcomeSubmitting = ref(false)
const outcomeError = ref('')
const historyLog = ref([])

// Auto-surface when cluster forms
watch(() => sosStore.activeClusters, (clusters) => {
  if (clusters.length > 0 && !activeRecommendation.value && !isLoading.value) {
    const cluster = clusters[0]
    invokeAegis(
      cluster.reports.map(r => r.id),
      cluster.barangay,
      cluster.count,
      flowStore.zoneSeverity,
      null
    )
  }
}, { deep: true })

onMounted(() => {
  fetchHistory()
})

async function askAegis() {
  // Use current cluster if available, otherwise use first pending SOS
  const clusters = sosStore.activeClusters
  if (clusters.length > 0) {
    const cluster = clusters[0]
    await invokeAegis(
      cluster.reports.map(r => r.id),
      cluster.barangay,
      cluster.count,
      flowStore.zoneSeverity,
      null
    )
  } else {
    const pending = sosStore.activeReports.filter(r => r.status === 'pending')
    if (pending.length > 0) {
      const first = pending[0]
      await invokeAegis(
        [first.id],
        first.barangay,
        1,
        flowStore.zoneSeverity,
        null
      )
    } else {
      await invokeAegis([], 'Tagapo', 0, 'watch', 'No active alerts')
    }
  }
}

async function simulateScenario() {
  // Pre-scripted scenario: 3-SOS cluster in Tagapo + heavy rain
  await invokeAegis(
    ['sim_sos_001', 'sim_sos_002', 'sim_sos_003'],
    'Tagapo',
    3,
    'danger',
    'Heavy rainfall warning: 18.5mm/hr sustained. Typhoon signal #2 raised over Santa Rosa City.'
  )
}

async function invokeAegis(sosIds, barangay, count, floodSeverity, weatherAlert) {
  isLoading.value = true
  selectedOutcome.value = null
  outcomeError.value = ''
  activeRecommendation.value = null

  try {
    const { data, error } = await supabase.functions.invoke('aegis-advisor', {
      body: {
        sos_ids: sosIds,
        cluster_barangay: barangay,
        cluster_count: count,
        flood_zone_severity: floodSeverity,
        weather_alert: weatherAlert
      }
    })

    if (error) {
      console.warn('Aegis Edge Function error:', error)
      activeRecommendation.value = {
        recommended_action: `Deploy nearest available rescue team to Barangay ${barangay}`,
        target_barangay: barangay,
        reasoning: 'Step 1: Edge Function unavailable — defaulting to standard dispatch.\nStep 2: SOS cluster density suggests immediate response.\nStep 3: Manual operator assessment required.\nStep 4: Pre-position resources based on local knowledge.',
        confidence: 'low',
        raw_inputs: {
          sos_cluster: { ids: sosIds, barangay, count },
          flood_zone: { severity: floodSeverity || 'none' },
          weather: { alert: weatherAlert || 'No active alert' }
        }
      }
    } else {
      activeRecommendation.value = data
    }
  } catch (err) {
    console.error('Aegis invocation error:', err)
    activeRecommendation.value = {
      recommended_action: 'Manual assessment required — AI service unavailable',
      target_barangay: barangay,
      reasoning: 'AI service error. Please assess the situation manually.',
      confidence: 'low',
      raw_inputs: { error: err.message }
    }
  } finally {
    isLoading.value = false
  }
}

async function submitOutcome(outcome) {
  if (!activeRecommendation.value || outcomeSubmitting.value) return
  outcomeSubmitting.value = true
  outcomeError.value = ''

  try {
    const operatorId = authStore.profile?.id || authStore.user?.id || null

    const { error } = await supabase.from('aegis_suggestions').insert([{
      related_sos_ids: activeRecommendation.value.raw_inputs?.sos_cluster?.ids || [],
      recommended_action: activeRecommendation.value.recommended_action,
      target_barangay: activeRecommendation.value.target_barangay,
      reasoning: activeRecommendation.value.reasoning,
      raw_inputs: activeRecommendation.value.raw_inputs,
      outcome: outcome,
      operator_id: operatorId,
      resolved_at: new Date().toISOString()
    }])

    if (error) {
      outcomeError.value = error.message || 'Unable to log operator outcome.'
      return
    }

    selectedOutcome.value = outcome
    await fetchHistory()
  } catch (err) {
    console.warn('Failed to log Aegis outcome:', err)
    outcomeError.value = err.message || 'Unable to log operator outcome.'
  } finally {
    outcomeSubmitting.value = false
  }
}

function resetPanel() {
  activeRecommendation.value = null
  selectedOutcome.value = null
  outcomeError.value = ''
}

async function fetchHistory() {
  try {
    const { data, error } = await supabase
      .from('aegis_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      historyLog.value = data
    }
  } catch (err) {
    console.warn('Failed to fetch Aegis history:', err)
  }
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}
</script>

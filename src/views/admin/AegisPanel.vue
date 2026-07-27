<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">Aegis AI Advisory Command Panel</h2>
        <p class="text-xs text-slate-400">Gemini 2.5 Flash operational recommendations — advisory only, never autonomous</p>
      </div>
      <div class="flex items-center space-x-2">
        <div class="relative">
          <button
            @click="showScenarioSelector = !showScenarioSelector"
            :disabled="isLoading"
            class="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-700 transition-colors disabled:opacity-50"
          >
            🎬 Simulate Scenario
          </button>
          <!-- Scenario Selector Dropdown -->
          <div
            v-if="showScenarioSelector"
            class="absolute right-0 mt-2 w-80 p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 space-y-2"
          >
            <div class="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Select Scenario</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="(s, key) in scenarios"
                :key="key"
                @click="simulateScenario(key)"
                class="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-600 hover:bg-purple-950/40 cursor-pointer transition-all"
              >
                <div class="text-xs font-bold text-white">{{ s.icon }} {{ s.label }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5 leading-tight">{{ s.description }}</div>
              </div>
            </div>
          </div>
        </div>
        <button
          v-if="!activeRecommendation && !isLoading"
          @click="askAegis"
          class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md"
        >
          🤖 Ask Aegis
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-6 rounded-xl bg-purple-950/40 border border-purple-800/60 text-center space-y-3">
      <div class="w-8 h-8 mx-auto border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-purple-300 font-semibold">Aegis is analyzing the situation...</p>
      <p class="text-xs text-slate-400">Consulting Gemini 2.5 Flash for operational recommendation</p>
    </div>

    <div v-if="outcomeError" class="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
      {{ outcomeError }} The advisory remains uncommitted; restore connectivity and retry.
    </div>

    <!-- Active Recommendation Panel -->
    <div v-if="activeRecommendation && !isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 space-y-3">
        <!-- Recommendation Card -->
        <div class="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-extrabold tracking-wider text-purple-300">Active AI Recommendation</span>
            <span
              :class="[
                'px-2 py-0.5 text-[10px] uppercase font-bold rounded',
                activeRecommendation.confidence === 'high' ? 'bg-emerald-900 text-emerald-200' :
                activeRecommendation.confidence === 'medium' ? 'bg-amber-900 text-amber-200' :
                'bg-slate-800 text-slate-300'
              ]"
            >
              {{ activeRecommendation.confidence || 'unknown' }} Confidence
            </span>
            <span v-if="activeRecommendation.scenario_type" class="px-2 py-0.5 text-[10px] uppercase font-bold rounded"
              :class="scenarioBadgeClass(activeRecommendation.scenario_type)">
              {{ scenarioIcon(activeRecommendation.scenario_type) }} {{ activeRecommendation.scenario_type }}
            </span>
          </div>

          <h3 class="font-bold text-white text-base">{{ activeRecommendation.recommended_action }}</h3>
          <div class="text-xs text-slate-400">
            <span class="font-semibold text-purple-300">Target:</span> Barangay {{ activeRecommendation.target_barangay }}
          </div>

          <!-- Inline Reasoning (always visible, per spec) -->
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step-by-Step Reasoning</span>
            <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{{ activeRecommendation.reasoning }}</div>
          </div>

          <!-- Expandable Raw Inputs -->
          <details class="group">
            <summary class="text-[10px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer hover:text-slate-300 transition-colors">
              ▶ Raw Inputs (click to expand)
            </summary>
            <div class="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <pre class="text-[10px] text-slate-400 font-mono overflow-x-auto">{{ JSON.stringify(activeRecommendation.raw_inputs, null, 2) }}</pre>
            </div>
          </details>

          <!-- Action Buttons — NO DEFAULT SELECTION (critical spec requirement) -->
          <div class="flex items-center space-x-2 pt-2 border-t border-purple-800/40">
            <span class="text-[10px] text-slate-500 mr-2">Operator Action:</span>
            <button
              @click="submitOutcome('approved')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-colors',
                selectedOutcome === 'approved'
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              ]"
            >
              ✓ Approve Advisory
            </button>
            <button
              @click="submitOutcome('modified')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-4 py-2 rounded-lg font-semibold text-xs border transition-colors',
                selectedOutcome === 'modified'
                  ? 'bg-slate-600 text-white ring-2 ring-slate-400 border-slate-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              ]"
            >
              ✎ Modify Action
            </button>
            <button
              @click="submitOutcome('rejected')"
              :disabled="outcomeSubmitting"
              :class="[
                'px-4 py-2 rounded-lg font-semibold text-xs border transition-colors',
                selectedOutcome === 'rejected'
                  ? 'bg-rose-700 text-white ring-2 ring-rose-400 border-rose-500'
                  : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-800/60'
              ]"
            >
              ✗ Reject
            </button>
          </div>

          <!-- Outcome confirmation -->
          <div v-if="selectedOutcome" class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
            ✓ Logged as <span class="font-bold uppercase">{{ selectedOutcome }}</span> to aegis_suggestions table.
            <button @click="resetPanel" class="ml-2 underline hover:text-white">Dismiss & request new advisory</button>
          </div>
        </div>
      </div>

      <!-- Raw Inputs Sidebar -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Situational Inputs</h3>
        <div class="space-y-2 text-xs">
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span class="text-[10px] text-slate-500 block">SOS Cluster</span>
            <span class="text-white font-semibold">{{ activeRecommendation.raw_inputs?.sos_cluster?.count || 0 }} reports</span>
            <span class="text-slate-400 block">{{ activeRecommendation.raw_inputs?.sos_cluster?.barangay }}</span>
          </div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span class="text-[10px] text-slate-500 block">Flood Zone</span>
            <span :class="[
              'font-semibold capitalize',
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'danger' ? 'text-red-400' :
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'warning' ? 'text-orange-400' :
              activeRecommendation.raw_inputs?.flood_zone?.severity === 'watch' ? 'text-yellow-400' : 'text-slate-300'
            ]">
              {{ activeRecommendation.raw_inputs?.flood_zone?.severity || 'None' }}
            </span>
          </div>
          <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
            <span class="text-[10px] text-slate-500 block">Weather Alert</span>
            <span class="text-slate-300">{{ activeRecommendation.raw_inputs?.weather?.alert || 'None' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Active Recommendation -->
    <div v-if="!activeRecommendation && !isLoading" class="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
      <div class="w-12 h-12 mx-auto rounded-full bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 text-xl">
        🤖
      </div>
      <h4 class="text-sm font-bold text-white">Aegis Advisory Engine Standby</h4>
      <p class="text-xs text-slate-400 max-w-md mx-auto">
        Aegis auto-surfaces when an incident cluster forms (3+ SOS in same barangay within 30 min).
        For single SOS incidents, use the "Ask Aegis" button above.
      </p>
    </div>

    <!-- Advisory History Log -->
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Advisory History Log</h3>
        <button @click="fetchHistory" class="text-[10px] text-purple-400 hover:text-purple-300 font-semibold">
          Refresh
        </button>
      </div>
      <div v-if="historyLog.length === 0" class="text-xs text-slate-500 p-3 text-center">
        No advisory history yet. Aegis suggestions will appear here after operator action.
      </div>
      <div v-else class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="entry in historyLog"
          :key="entry.id"
          class="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
        >
          <div>
            <p class="font-semibold text-slate-200 text-xs">{{ entry.recommended_action }}</p>
            <p class="text-[10px] text-slate-500">{{ entry.target_barangay }} · {{ formatTimeAgo(entry.created_at) }}</p>
          </div>
          <span
            :class="[
              'px-2 py-0.5 text-[10px] font-bold rounded uppercase',
              entry.outcome === 'approved' ? 'bg-emerald-900 text-emerald-300' :
              entry.outcome === 'modified' ? 'bg-amber-900 text-amber-300' :
              'bg-rose-900 text-rose-300'
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
const showScenarioSelector = ref(false)

const scenarios = {
  flood: {
    label: 'Flood',
    icon: '🌊',
    sos_ids: ['sim_flood_001', 'sim_flood_002', 'sim_flood_003'],
    barangay: 'Tagapo',
    count: 3,
    floodSeverity: 'danger',
    weatherAlert: 'Heavy rainfall warning: 18.5mm/hr sustained. Typhoon signal #2 raised over Santa Rosa City.',
    description: 'Rising flood waters, water rescue needed'
  },
  earthquake: {
    label: 'Earthquake',
    icon: '🏚️',
    sos_ids: ['sim_eq_001', 'sim_eq_002', 'sim_eq_003', 'sim_eq_004', 'sim_eq_005'],
    barangay: 'Malitlit',
    count: 5,
    floodSeverity: 'none',
    weatherAlert: 'Aftershock warning: M5.2 earthquake detected 15km east of Santa Rosa. Possible structural damage.',
    description: 'Building collapse, search & rescue needed'
  },
  typhoon: {
    label: 'Typhoon',
    icon: '🌀',
    sos_ids: ['sim_ty_001', 'sim_ty_002', 'sim_ty_003', 'sim_ty_004'],
    barangay: 'Dila',
    count: 4,
    floodSeverity: 'warning',
    weatherAlert: 'Typhoon Signal #3. Maximum sustained winds 120km/h. Coastal storm surge expected. Widespread power outages.',
    description: 'Pre-emptive evacuation, shelter management'
  },
  fire: {
    label: 'Fire',
    icon: '🔥',
    sos_ids: ['sim_fire_001', 'sim_fire_002'],
    barangay: 'Market Area',
    count: 2,
    floodSeverity: 'none',
    weatherAlert: 'Structural fire reported in commercial district. Fire spreading risk due to nearby buildings. Dense urban area.',
    description: 'Fire suppression, perimeter evacuation'
  },
  landslide: {
    label: 'Landslide',
    icon: '⛰️',
    sos_ids: ['sim_ls_001', 'sim_ls_002', 'sim_ls_003'],
    barangay: 'Sinalhan',
    count: 3,
    floodSeverity: 'watch',
    weatherAlert: 'Continuous heavy rain for 48 hours. Soil saturation critical. Tension cracks reported on hillside slope.',
    description: 'Geohazard assessment, route closure'
  }
}

// Auto-surface when cluster forms
watch(() => sosStore.activeClusters, (clusters) => {
  if (clusters.length > 0 && !activeRecommendation.value && !isLoading.value) {
    const cluster = clusters[0]
    invokeAegis(
      cluster.reports.map(r => r.id),
      cluster.barangay,
      cluster.count,
      flowStore.zoneSeverity,
      null,
      'flood'
    )
  }
}, { deep: true })

onMounted(async () => {
  fetchHistory()
  // Ensure SOS data is loaded if navigated here directly
  if (sosStore.activeReports.length === 0) {
    await sosStore.fetchActiveReports()
    sosStore.subscribeToRealtimeSOS()
  }
  // Check for already-existing clusters on mount
  if (sosStore.activeClusters.length > 0 && !activeRecommendation.value && !isLoading.value) {
    const cluster = sosStore.activeClusters[0]
    invokeAegis(
      cluster.reports.map(r => r.id),
      cluster.barangay,
      cluster.count,
      flowStore.zoneSeverity,
      null,
      'flood'
    )
  }
})

onUnmounted(() => {
  // Keep SOS subscription alive for other admin pages — don't unsubscribe here
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
      null,
      'flood'
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
        null,
        'flood'
      )
    } else {
      await invokeAegis([], 'Tagapo', 0, 'watch', 'No active alerts', 'flood')
    }
  }
}

async function simulateScenario(key) {
  const s = scenarios[key]
  if (!s) return
  showScenarioSelector.value = false
  await invokeAegis(s.sos_ids, s.barangay, s.count, s.floodSeverity, s.weatherAlert, key)
}

async function invokeAegis(sosIds, barangay, count, floodSeverity, weatherAlert, scenarioType = 'flood') {
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
        weather_alert: weatherAlert,
        scenario_type: scenarioType
      }
    })

    if (error) {
      console.warn('Aegis Edge Function error:', error)
      activeRecommendation.value = {
        recommended_action: `Deploy nearest available rescue team to Barangay ${barangay}`,
        target_barangay: barangay,
        reasoning: 'Step 1: Edge Function unavailable — defaulting to standard dispatch.\nStep 2: SOS cluster density suggests immediate response.\nStep 3: Manual operator assessment required.\nStep 4: Pre-position resources based on local knowledge.',
        confidence: 'low',
        scenario_type: scenarioType,
        raw_inputs: {
          sos_cluster: { ids: sosIds, barangay, count },
          flood_zone: { severity: floodSeverity || 'none' },
          weather: { alert: weatherAlert || 'No active alert' },
          scenario_type: scenarioType
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
      scenario_type: scenarioType,
      raw_inputs: { error: err.message, scenario_type: scenarioType }
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
    // Disable further submissions for this advisory
    outcomeSubmitting.value = true
  } catch (err) {
    console.warn('Failed to log Aegis outcome:', err)
    outcomeError.value = err.message || 'Unable to log operator outcome.'
    outcomeSubmitting.value = false
  }
}

function resetPanel() {
  activeRecommendation.value = null
  selectedOutcome.value = null
  outcomeError.value = ''
  outcomeSubmitting.value = false
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

function scenarioBadgeClass(type) {
  const map = {
    flood: 'bg-blue-900 text-blue-200',
    earthquake: 'bg-orange-900 text-orange-200',
    typhoon: 'bg-cyan-900 text-cyan-200',
    fire: 'bg-red-900 text-red-200',
    landslide: 'bg-amber-900 text-amber-200'
  }
  return map[type] || 'bg-slate-800 text-slate-300'
}

function scenarioIcon(type) {
  const map = {
    flood: '🌊', earthquake: '🏚️', typhoon: '🌀', fire: '🔥', landslide: '⛰️'
  }
  return map[type] || '🤖'
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'
  const ts = new Date(dateStr).getTime()
  if (!Number.isFinite(ts)) return 'Just now'
  const diffMs = Date.now() - ts
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}
</script>

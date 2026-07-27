<template>
  <div class="space-y-4">
    <!-- Header Title & Chime Toggle -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold text-white">Community Incident Reports</h2>
        <p class="text-xs text-slate-400">AI Triage Classification, Plausibility Verification & Dispatch Triage</p>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="toggleMute"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors border shadow',
            isMuted ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' : 'bg-red-950 text-red-400 border-red-800 animate-pulse'
          ]"
        >
          <span>{{ isMuted ? '🔇 Audio Chime Muted' : '🔔 Emergency Audio Chime Active' }}</span>
        </button>
      </div>
    </div>

    <!-- High Priority Unread Alert Banner -->
    <div v-if="reportStore.unreadHighPriorityCount > 0" class="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-white flex items-center justify-between shadow-lg">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-base shrink-0 animate-bounce">
          🚨
        </div>
        <div>
          <h4 class="font-bold text-xs text-red-200 uppercase tracking-wide">
            High Priority Triage Notice ({{ reportStore.unreadHighPriorityCount }} Unhandled Alert{{ reportStore.unreadHighPriorityCount > 1 ? 's' : '' }})
          </h4>
          <p class="text-[11px] text-red-300">
            One or more community reports are flagged as High/Critical urgency. Please review immediately.
          </p>
        </div>
      </div>
      <button
        @click="filterHighPriority"
        class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-lg shadow transition-colors shrink-0"
      >
        View High Priority
      </button>
    </div>

    <!-- Stat Metric Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] text-slate-500 uppercase font-semibold block">Total Submissions</span>
        <span class="text-xl font-black text-white">{{ reportStore.reports.length }}</span>
      </div>
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] text-slate-500 uppercase font-semibold block">Open Triage</span>
        <span class="text-xl font-black text-blue-400">
          {{ reportStore.reports.filter(r => r.status === 'open').length }}
        </span>
      </div>
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] text-slate-500 uppercase font-semibold block">In Review</span>
        <span class="text-xl font-black text-amber-400">
          {{ reportStore.reports.filter(r => r.status === 'in_review').length }}
        </span>
      </div>
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] text-slate-500 uppercase font-semibold block">Suspected Spam</span>
        <span class="text-xl font-black text-rose-400">
          {{ reportStore.reports.filter(r => r.ai_plausibility === 'suspected_spam').length }}
        </span>
      </div>
    </div>

    <!-- Multi-Attribute Filter Bar -->
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Search</label>
          <input
            v-model="reportStore.filters.searchQuery"
            type="text"
            placeholder="Search description, ID..."
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
          <select
            v-model="reportStore.filters.category"
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="environment">Environment</option>
            <option value="bullying">Bullying / Safety</option>
            <option value="mental_health">Mental Health</option>
            <option value="flood">Flood Hazard</option>
            <option value="fire">Fire Hazard</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
          <select
            v-model="reportStore.filters.priority"
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
          <select
            v-model="reportStore.filters.status"
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Plausibility</label>
          <select
            v-model="reportStore.filters.plausibility"
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
          >
            <option value="all">All Plausibility</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="suspected_spam">Suspected Spam</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Barangay</label>
          <select
            v-model="reportStore.filters.barangay"
            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Barangays</option>
            <option v-for="bgy in santaRosaBarangays" :key="bgy" :value="bgy">{{ bgy }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Community Reports Table -->
    <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-md">
      <table class="w-full text-left text-xs text-slate-300">
        <thead class="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
          <tr>
            <th class="p-3">ID / Time</th>
            <th class="p-3">Barangay</th>
            <th class="p-3">Description</th>
            <th class="p-3">AI Triage / Dept</th>
            <th class="p-3">Priority</th>
            <th class="p-3">Plausibility</th>
            <th class="p-3">Status</th>
            <th class="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr v-if="reportStore.filteredReports.length === 0">
            <td colspan="8" class="p-8 text-center text-slate-500">
              No incident reports match the current filter criteria.
            </td>
          </tr>

          <tr
            v-for="item in reportStore.filteredReports"
            :key="item.id"
            :class="[
              'transition-colors hover:bg-slate-800/50',
              (item.ai_priority === 'high' || item.ai_priority === 'critical') && item.status === 'open'
                ? 'bg-red-950/20 border-l-4 border-red-500 animate-pulse' : ''
            ]"
          >
            <td class="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
              <div>{{ item.id.substring(0, 10) }}</div>
              <div class="text-[10px] text-slate-500">{{ formatTimeAgo(item.created_at) }}</div>
            </td>

            <td class="p-3 font-semibold text-white whitespace-nowrap">{{ item.barangay }}</td>

            <td class="p-3 max-w-xs truncate" :title="item.raw_description">
              {{ item.raw_description }}
            </td>

            <td class="p-3 whitespace-nowrap">
              <span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50 uppercase text-[10px] font-bold block w-fit mb-0.5">
                {{ item.ai_category || 'general' }}
              </span>
              <span class="text-[10px] text-slate-400 block">{{ item.ai_department || 'CDRRMO' }}</span>
            </td>

            <td class="p-3 whitespace-nowrap">
              <span
                :class="[
                  'px-2 py-0.5 rounded text-[10px] uppercase font-bold border',
                  item.ai_priority === 'critical' ? 'bg-red-950 text-red-400 border-red-800' :
                  item.ai_priority === 'high' ? 'bg-orange-950 text-orange-400 border-orange-800' :
                  item.ai_priority === 'medium' ? 'bg-yellow-950 text-yellow-400 border-yellow-800' :
                  'bg-blue-950 text-blue-300 border-blue-800'
                ]"
              >
                {{ item.ai_priority || 'medium' }}
              </span>
            </td>

            <!-- Plausibility Badge & Toggle -->
            <td class="p-3 whitespace-nowrap">
              <select
                :value="reportStore.normalizePlausibility(item.ai_plausibility)"
                @change="onPlausibilityChange(item.id, $event.target.value)"
                :class="[
                  'px-2 py-1 rounded text-[10px] font-bold border focus:outline-none cursor-pointer',
                  reportStore.normalizePlausibility(item.ai_plausibility) === 'verified' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                  reportStore.normalizePlausibility(item.ai_plausibility) === 'suspected_spam' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                  'bg-amber-950 text-amber-300 border-amber-800'
                ]"
              >
                <option value="verified">✓ Verified</option>
                <option value="unverified">? Unverified</option>
                <option value="suspected_spam">⚠ Spam</option>
              </select>
            </td>

            <!-- Status Lifecycle Badge & Transition -->
            <td class="p-3 whitespace-nowrap">
              <select
                :value="item.status || 'open'"
                @change="onStatusChange(item.id, $event.target.value)"
                :class="[
                  'px-2 py-1 rounded text-[10px] font-bold uppercase border focus:outline-none cursor-pointer',
                  item.status === 'open' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                  item.status === 'in_review' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  item.status === 'resolved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                ]"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </td>

            <td class="p-3 text-right whitespace-nowrap">
              <button
                @click="selectedReport = item"
                class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition-colors"
              >
                Inspect AI
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- AI Reasoning Detail Modal -->
    <div
      v-if="selectedReport"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-white">AI Incident Inspection</h3>
            <p class="text-xs text-slate-400">Report ID: {{ selectedReport.id }}</p>
          </div>
          <button
            @click="selectedReport = null"
            class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Barangay</span>
            <span class="text-white font-bold text-sm">{{ selectedReport.barangay }}</span>
          </div>

          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">Citizen Description</span>
            <p class="p-3 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-xs">
              "{{ selectedReport.raw_description }}"
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">AI Category</span>
              <span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800 uppercase inline-block">
                {{ selectedReport.ai_category || 'general' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Assigned Department</span>
              <span class="text-amber-300 font-bold">{{ selectedReport.ai_department || 'CDRRMO' }}</span>
            </div>
          </div>

          <div>
            <span class="text-slate-400 font-semibold block text-[10px] uppercase">AI Reasoning & Logic</span>
            <p class="p-3 rounded-lg bg-slate-950/80 text-slate-300 border border-slate-800 italic">
              {{ selectedReport.ai_reasoning || 'No AI reasoning metadata available for this report.' }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Set Status</span>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="st in ['open', 'in_review', 'resolved', 'dismissed']"
                  :key="st"
                  @click="onStatusChange(selectedReport.id, st); selectedReport.status = st"
                  :class="[
                    'px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors',
                    selectedReport.status === st ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  ]"
                >
                  {{ st }}
                </button>
              </div>
            </div>

            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Set Plausibility</span>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="pl in ['verified', 'unverified', 'suspected_spam']"
                  :key="pl"
                  @click="onPlausibilityChange(selectedReport.id, pl); selectedReport.ai_plausibility = pl"
                  :class="[
                    'px-2 py-1 rounded text-[10px] font-bold transition-colors capitalize',
                    selectedReport.ai_plausibility === pl ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  ]"
                >
                  {{ pl }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800 flex justify-end">
          <button
            @click="selectedReport = null"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const isMuted = ref(localStorage.getItem('agap_chime_muted') === 'true')
const selectedReport = ref(null)

const santaRosaBarangays = [
  'Aplaya', 'Balibago', 'Caingins', 'Dila', 'Dita', 'Don Jose',
  'Ibaba', 'Kanluran (Poblacion Ward 1)', 'Labas', 'Macabling',
  'Malitlit', 'Malusak (Poblacion Ward 2)', 'Market Area (Poblacion Ward 8)',
  'Pooc', 'Pulong Santa Cruz', 'Santo Domingo', 'Sinalhan', 'Tagapo'
]

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function playEmergencyChime() {
  if (isMuted.value) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'

    osc1.frequency.setValueAtTime(880, now) // A5
    osc1.frequency.setValueAtTime(587.33, now + 0.25) // D5

    osc2.frequency.setValueAtTime(440, now)
    osc2.frequency.setValueAtTime(293.66, now + 0.25)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.6)
    osc2.stop(now + 0.6)
  } catch (e) {
    console.warn('Audio chime synthesize error:', e)
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  localStorage.setItem('agap_chime_muted', isMuted.value)
  if (!isMuted.value) {
    playEmergencyChime()
  }
}

function filterHighPriority() {
  reportStore.filters.priority = 'high'
  reportStore.filters.status = 'open'
}

async function onStatusChange(id, newStatus) {
  await reportStore.updateReportStatus(id, newStatus)
}

async function onPlausibilityChange(id, newPlausibility) {
  await reportStore.updatePlausibility(id, newPlausibility)
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins === 1) return '1 min ago'
  if (diffMins < 60) return `${diffMins} mins ago`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours} hrs ago`
}

watch(() => reportStore.unreadHighPriorityCount, (newCount, oldCount) => {
  if (newCount > (oldCount || 0)) {
    playEmergencyChime()
  }
})

onMounted(async () => {
  if (reportStore.fetchReports) {
    await reportStore.fetchReports()
  }
  reportStore.subscribeRealtimeReports()
  if (reportStore.unreadHighPriorityCount > 0) {
    playEmergencyChime()
  }
})

onUnmounted(() => {
  reportStore.unsubscribeRealtimeReports()
})
</script>


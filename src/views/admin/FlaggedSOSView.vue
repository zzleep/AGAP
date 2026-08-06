<template>
  <div class="space-y-5">
    <!-- Top Command Center Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#1F3A4B]/15 shadow-sm admin-card">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="font-expressive text-2xl font-black text-[#1F3A4B] tracking-tight">Flagged SOS Emergency Reports</h2>
          <span class="px-3 py-1 text-xs font-black rounded-full bg-[#902715] text-white flex items-center shadow-m3-xs">
            SPAM / PRANK QUEUE
          </span>
        </div>
        <p class="text-xs text-[#717171] font-bold mt-0.5">
          Reports from active flagged devices &middot; Hidden from Live Dispatch Feed
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Return to Live SOS Feed -->
        <router-link
          to="/admin/sos-feed"
          class="px-4 py-2.5 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95"
        >
          <span>← Back to Live SOS Feed</span>
        </router-link>

        <!-- Refresh Button -->
        <button
          @click="fetchFlagged"
          :disabled="isLoading"
          class="px-4 py-2.5 rounded-full bg-white border border-[#1F3A4B]/20 hover:bg-[#EEF4FB] text-[#1F3A4B] font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ isLoading ? 'Refreshing...' : 'Refresh List' }}</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="p-4 rounded-2xl bg-[#EEF4FB] text-[#1F3A4B] border border-[#1F3A4B]/20 text-xs font-black flex items-center justify-between shadow-md"
    >
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5 text-[#902715] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="toastMessage = ''" class="text-[#902715] underline hover:opacity-75 text-xs font-black px-2 py-0.5">
        Dismiss
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="p-5 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-3 shadow-sm admin-card">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- 1. Search Query -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Search Flagged SOS</label>
          <input
            v-model="filters.searchQuery"
            type="text"
            placeholder="Search ID, Barangay or Device Hash..."
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] placeholder-[#717171] focus:outline-none focus:border-[#902715] font-bold transition-all"
          />
        </div>

        <!-- 2. Barangay Filter -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Barangay</label>
          <select
            v-model="filters.barangay"
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option value="all">All Barangays</option>
            <option v-for="b in BARANGAY_LIST" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>

        <!-- 3. Signal Mode Filter -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Signal Mode</label>
          <select
            v-model="filters.mode"
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option value="all">All Modes</option>
            <option value="online">Online</option>
            <option value="degraded_signal">Degraded Signal</option>
          </select>
        </div>

        <!-- 4. Reset Button -->
        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full py-2 px-3 rounded-2xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#717171] hover:text-[#0A0A0A] text-xs font-bold transition-all border border-[#E0E0E0]"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="space-y-2 w-full">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center space-x-2">
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Flagged Reports Queue</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-[#902715] text-white text-[11px] font-black">
            {{ paginatedQueue.length }} Showing / {{ filteredQueue.length }} Filtered / {{ flaggedReports.length }} Total
          </span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] uppercase font-black text-[#1F3A4B] tracking-wider">Rows</label>
          <select
            v-model.number="rowsPerPage"
            class="px-2.5 py-1 rounded-xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>

      <div class="bg-white border border-[#1F3A4B]/15 rounded-3xl overflow-hidden shadow-sm w-full">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[768px]">
            <thead>
              <tr class="bg-[#1F3A4B] text-white text-[11px] uppercase font-black tracking-wider border-b border-[#1F3A4B]/20">
                <th class="py-3.5 px-5">Status</th>
                <th class="py-3.5 px-5">Alert ID</th>
                <th class="py-3.5 px-5">Barangay</th>
                <th class="py-3.5 px-5">GPS Coordinates</th>
                <th class="py-3.5 px-5">Contact Number</th>
                <th class="py-3.5 px-5">Signal Mode</th>
                <th class="py-3.5 px-5">Submitted</th>
                <th class="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E0E0E0] text-xs">
              <tr v-if="paginatedQueue.length === 0">
                <td colspan="8" class="py-12 text-center text-[#717171] font-bold">
                  No flagged SOS reports found matching active filters.
                </td>
              </tr>

              <tr
                v-for="item in paginatedQueue"
                :key="item.id"
                class="transition-colors hover:bg-[#EEF4FB] bg-white"
              >
                <!-- Status Indicator -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full shrink-0 shadow-sm bg-[#902715]"></span>
                    <span class="capitalize font-black text-xs text-[#902715]">
                      Flagged ({{ item.status }})
                    </span>
                  </div>
                </td>

                <!-- Alert ID & Device Hash -->
                <td class="py-3.5 px-5 whitespace-nowrap font-mono text-[#1F3A4B]">
                  <div>
                    <span class="font-bold text-xs">#{{ item.id.substring(0, 8) }}</span>
                    <p v-if="item.sos_device_hash" class="text-[10px] text-[#717171] font-normal truncate max-w-[120px]">
                      Hash: {{ item.sos_device_hash.substring(0, 10) }}...
                    </p>
                    <p
                      v-if="autoFlagInfo(item)"
                      class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F7FB41] border border-[#8a7e00] text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]"
                    >
                      Auto-flagged · {{ autoFlagInfo(item).label }}
                    </p>
                  </div>
                </td>

                <!-- Barangay -->
                <td class="py-3.5 px-5 whitespace-nowrap font-black text-[#1F3A4B] text-xs">
                  {{ item.barangay }}
                </td>

                <!-- GPS Coordinates -->
                <td class="py-3.5 px-5 whitespace-nowrap font-mono font-bold text-[#902715] text-xs">
                  {{ typeof item.latitude === 'number' ? item.latitude.toFixed(4) : item.latitude }},
                  {{ typeof item.longitude === 'number' ? item.longitude.toFixed(4) : item.longitude }}
                </td>

                <!-- Contact Number -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <div v-if="item.callback_number" class="inline-flex items-center gap-1.5 font-mono font-bold text-[#1F3A4B]">
                    <a
                      :href="'tel:' + item.callback_number"
                      class="inline-flex items-center gap-1.5 hover:text-[#902715] hover:underline"
                      title="Click to call"
                    >
                      <svg class="w-3.5 h-3.5 text-[#902715] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{{ formatCallbackNumber(item.callback_number) }}</span>
                    </a>
                    <button
                      @click.stop="copyToClipboard(item.callback_number)"
                      class="p-1 text-[#717171] hover:text-[#1F3A4B] rounded transition-colors"
                      title="Copy number"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  </div>
                  <span v-else class="text-[#717171] italic font-normal">No callback number provided</span>
                </td>

                <!-- Signal Mode -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-m3-xs',
                      item.mode === 'online' ? 'bg-[#1F3A4B] text-white' : 'bg-[#B45309] text-white'
                    ]"
                  >
                    {{ item.mode }}
                  </span>
                </td>

                <!-- Timestamp -->
                <td class="py-3.5 px-5 whitespace-nowrap text-[#717171] font-semibold text-xs">
                  {{ formatTimeAgo(item.created_at) }}
                </td>

                <!-- Action Button: Un-flag Device -->
                <td class="py-3.5 px-5 whitespace-nowrap text-right">
                  <button
                    @click="handleUnflagDevice(item)"
                    :disabled="unflaggingMap[item.sos_device_hash]"
                    class="px-4 py-1.5 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] text-white font-black text-xs shadow-m3-xs transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    <span>{{ unflaggingMap[item.sos_device_hash] ? 'Un-flagging...' : 'Un-flag Device' }}</span>
                  </button>
                </td>

                <!-- Aegis Advisory — per-flagged-report recommendation -->
                <td colspan="8" class="px-5 pt-0 pb-4">
                  <AegisAdvisoryCard
                    variant="card"
                    :suggestion="suggestionForReport(item)"
                    :loading="aegisStore.generating && !suggestionForReport(item)"
                    :error="aegisErrorForReport(item)"
                    @ask="askAegisForReport(item)"
                    @outcome="(payload) => handleAegisOutcome(item, payload)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E0E0E0]">
          <p class="text-[11px] text-[#717171] font-bold">
            Page <span class="text-[#1F3A4B] font-black">{{ currentPage }}</span> of <span class="text-[#1F3A4B] font-black">{{ totalPages }}</span>
            &middot; Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredQueue.length }}
          </p>
          <div class="flex items-center gap-1.5">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === 1 ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              First
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === 1 ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              ← Prev
            </button>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === totalPages ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              Next →
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              :class="currentPage === totalPages ? 'bg-[#F5F5F5] text-[#717171] border-[#E0E0E0]' : 'bg-white text-[#1F3A4B] border-[#1F3A4B]/20 hover:bg-[#EEF4FB] active:scale-95'"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSOSStore } from '@/stores/sosStore'
import { useAegisStore } from '@/stores/aegisStore'
import { BARANGAY_LIST } from '@/data/barangay_coords'
import AegisAdvisoryCard from '@/components/admin/AegisAdvisoryCard.vue'

const sosStore = useSOSStore()
const aegisStore = useAegisStore()

const flaggedReports = ref([])
const isLoading = ref(false)
const toastMessage = ref('')
const unflaggingMap = ref({})

// Pagination State
const currentPage = ref(1)
const rowsPerPage = ref(10)

// Filters
const filters = ref({
  searchQuery: '',
  barangay: 'all',
  mode: 'all'
})

watch(filters, () => { currentPage.value = 1 }, { deep: true })
watch(rowsPerPage, () => { currentPage.value = 1 })

async function fetchFlagged() {
  isLoading.value = true
  try {
    const data = await sosStore.fetchFlaggedReports()
    flaggedReports.value = data || []
  } catch (err) {
    console.warn('Error fetching flagged reports:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredQueue = computed(() => {
  return flaggedReports.value.filter(item => {
    const q = filters.value.searchQuery.toLowerCase().trim()
    if (q) {
      const matchId = item.id.toLowerCase().includes(q)
      const matchBarangay = item.barangay.toLowerCase().includes(q)
      const matchHash = item.sos_device_hash ? item.sos_device_hash.toLowerCase().includes(q) : false
      if (!matchId && !matchBarangay && !matchHash) return false
    }

    if (filters.value.barangay !== 'all' && item.barangay !== filters.value.barangay) {
      return false
    }

    if (filters.value.mode !== 'all' && item.mode !== filters.value.mode) {
      return false
    }

    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredQueue.value.length / rowsPerPage.value)))
const paginationStart = computed(() => filteredQueue.value.length === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1)
const paginationEnd = computed(() => Math.min(currentPage.value * rowsPerPage.value, filteredQueue.value.length))
const paginatedQueue = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredQueue.value.slice(start, start + rowsPerPage.value)
})

function formatCallbackNumber(num) {
  if (!num) return ''
  const str = String(num).trim()
  if (/^09\d{9}$/.test(str)) {
    return `${str.slice(0, 4)} ${str.slice(4, 7)} ${str.slice(7)}`
  }
  return str
}

// Flag metadata attached by sosStore.fetchFlaggedReports (_flag_meta). Renders
// the 'Auto-flagged' chip when the device was flagged by rules (flagged_by ===
// 'auto' or reason starts with 'auto:'), stripping the 'auto:' prefix and
// underscores for display ('auto:repeat_burst' -> 'repeat burst').
function autoFlagInfo(item) {
  const meta = item?._flag_meta
  if (!meta) return null
  const isAuto = meta.flagged_by === 'auto' || (meta.reason && String(meta.reason).startsWith('auto:'))
  if (!isAuto) return null
  const reason = meta.reason ? String(meta.reason).replace(/^auto:/, '').replace(/_/g, ' ') : ''
  return { label: reason || 'auto-flagged' }
}

async function copyToClipboard(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toastMessage.value = `Copied ${text} to clipboard`
  } catch (err) {
    console.warn('Clipboard copy failed:', err)
  }
}

function resetFilters() {
  filters.value = {
    searchQuery: '',
    barangay: 'all',
    mode: 'all'
  }
  currentPage.value = 1
}

async function handleUnflagDevice(item) {
  const hash = item.sos_device_hash
  if (!hash) return

  unflaggingMap.value[hash] = true
  toastMessage.value = ''

  try {
    const res = await sosStore.unflagDevice(hash)
    if (res.success) {
      toastMessage.value = `Device un-flagged successfully. Future reports restored to main feed.`
      await fetchFlagged()
    } else {
      toastMessage.value = `Failed to un-flag device: ${res.error?.message || 'Unknown error'}`
    }
  } catch (err) {
    console.error('Error un-flagging device:', err)
    toastMessage.value = 'Unexpected error occurred while un-flagging device.'
  } finally {
    unflaggingMap.value[hash] = false
  }
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'

  const date = new Date(dateStr)

  return date.toLocaleDateString('en-PH', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  })
}

// ── Aegis Advisory Integration ──
const AEGIS_OUTCOME_TOAST = {
  approved: 'Advisory approved',
  modified: 'Advisory modified',
  rejected: 'Advisory rejected'
}

function suggestionForReport(report) {
  return aegisStore.suggestionsForSos(report.id)[0] ?? null
}

function aegisErrorForReport(report) {
  // Store-level error only surfaces while no suggestion exists for this
  // report yet, so a displayed suggestion is never masked by stale errors.
  return aegisStore.lastError && !suggestionForReport(report) ? aegisStore.lastError : null
}

async function askAegisForReport(report) {
  await aegisStore.generateSuggestion({
    sos_ids: [report.id],
    cluster_barangay: report.barangay ?? null,
    cluster_count: null,
    scenario_type: 'flood',
    flood_zone_severity: null
  })
}

async function handleAegisOutcome(report, { outcome, modifiedAction }) {
  const suggestion = suggestionForReport(report)
  if (!suggestion) return
  try {
    await aegisStore.setOutcome(suggestion.id, { outcome, modifiedAction })
    toastMessage.value = AEGIS_OUTCOME_TOAST[outcome] || 'Advisory outcome recorded'
  } catch (err) {
    console.error('Aegis outcome failed:', err)
    toastMessage.value = 'Failed to record advisory outcome.'
  }
}

onMounted(() => {
  aegisStore.init()
  fetchFlagged()
})
</script>

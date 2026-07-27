<template>
  <div class="space-y-5">
    <!-- Top Command Center Bar & Quick GIS Launcher -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#1F3A4B]/15 shadow-sm admin-card">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="font-expressive text-2xl font-black text-[#1F3A4B] tracking-tight">Live SOS Emergency Queue</h2>
          <span class="px-3 py-1 text-xs font-black rounded-full bg-[#902715] text-white flex items-center shadow-m3-xs">
            <span class="w-2 h-2 rounded-full bg-[#F7FB41] animate-ping mr-1.5"></span>
            REALTIME LIVE
          </span>
        </div>
        <p class="text-xs text-[#717171] font-bold mt-0.5">
          Realtime WebSocket Feed · Assigned Area: <span class="text-[#902715] font-black uppercase">{{ authStore.assignedArea }}</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Tactical GIS Quick Access Button -->
        <router-link
          to="/admin/hotspot-map"
          class="px-4 py-2.5 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] text-[#F7FB41] font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95 border border-[#F7FB41]/30"
        >
          <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.782V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          <span>Tactical GIS Density Map →</span>
        </router-link>

        <!-- Refresh Queue Button -->
        <button
          @click="manualRefresh"
          :disabled="sosStore.isLoading"
          class="px-4 py-2.5 rounded-full bg-white border border-[#1F3A4B]/20 hover:bg-[#EEF4FB] text-[#1F3A4B] font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ sosStore.isLoading ? 'Refreshing...' : 'Refresh Queue' }}</span>
        </button>
      </div>
    </div>

    <!-- Cluster Alert Banner -->
    <div v-if="sosStore.activeClusters.length > 0" class="space-y-3">
      <div
        v-for="cluster in sosStore.activeClusters"
        :key="cluster.barangay"
        class="p-5 rounded-[2rem] bg-[#902715] text-white flex items-center justify-between shadow-[0_10px_28px_rgba(144,39,21,0.35)] border border-white/20 transition-all duration-300"
      >
        <div class="flex items-center space-x-4">
          <div class="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0 shadow-inner">
            <svg class="w-6 h-6 text-[#F7FB41] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="font-black text-sm text-white uppercase tracking-wider">
              BARANGAY INCIDENT CLUSTER ALERT — {{ cluster.barangay }}
            </h3>
            <p class="text-xs text-white/90 mt-0.5 font-medium">
              High density emergency activity detected: {{ cluster.count }} active SOS reports in the past 30 minutes. Priority dispatch recommended.
            </p>
          </div>
        </div>
        <span class="px-4 py-2 bg-[#F7FB41] text-[#0A0A0A] text-xs font-black rounded-full shrink-0 shadow-md">
          {{ cluster.count }} ALERTS
        </span>
      </div>
    </div>

    <!-- Conflict Warning Toast Notification -->
    <div
      v-if="toastMessage"
      class="p-4 rounded-2xl bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00] text-xs font-black flex items-center justify-between shadow-md"
    >
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5 text-[#0A0A0A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="toastMessage = ''" class="text-[#0A0A0A] underline hover:opacity-75 text-xs font-black px-2 py-0.5">
        Dismiss
      </button>
    </div>

    <!-- Multi-Attribute SOS Filter Bar (Matching Reports Page Pattern) -->
    <div class="p-5 bg-white border border-[#1F3A4B]/15 rounded-3xl space-y-3 shadow-sm admin-card">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- 1. Search Query -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Search SOS</label>
          <input
            v-model="filters.searchQuery"
            type="text"
            placeholder="Search ID or Barangay..."
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

        <!-- 3. Status Filter -->
        <div>
          <label class="block text-[10px] uppercase font-black text-[#1F3A4B] mb-1 tracking-wider">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#1F3A4B]/20 text-xs text-[#1F3A4B] font-bold focus:outline-none focus:border-[#902715] transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="responding">Responding</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <!-- 4. Signal Mode Filter -->
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

        <!-- 5. Assigned Area Toggle & Reset -->
        <div class="flex items-end gap-2">
          <button
            @click="toggleAssignedAreaOnly"
            :class="[
              'flex-1 py-2 px-3 rounded-2xl text-xs font-black transition-all shadow-m3-xs whitespace-nowrap',
              filters.assignedAreaOnly
                ? 'bg-[#902715] text-[#F7FB41] border border-[#902715]'
                : 'bg-[#EEF4FB] text-[#1F3A4B] border border-[#1F3A4B]/20 hover:bg-[#1F3A4B]/10'
            ]"
          >
            {{ filters.assignedAreaOnly ? 'Area Match Only' : 'Filter My Area' }}
          </button>
          <button
            @click="resetFilters"
            class="px-3.5 py-2 rounded-2xl bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#717171] hover:text-[#0A0A0A] text-xs font-bold transition-all border border-[#E0E0E0]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- 100% Full-Width High-Density Operator Data Table -->
    <div class="space-y-2 w-full">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center space-x-2">
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Incoming Emergency Alerts</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-[#1F3A4B] text-white text-[11px] font-black">
            {{ filteredQueue.length }} Showing / {{ sosStore.sortedQueue.length }} Total
          </span>
        </div>
      </div>

      <!-- High-Density Operator Table Container -->
      <div class="bg-white border border-[#1F3A4B]/15 rounded-3xl overflow-hidden shadow-sm admin-card w-full">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[768px]">
            <thead>
              <tr class="bg-[#1F3A4B] text-white text-[11px] uppercase font-black tracking-wider border-b border-[#1F3A4B]/20">
                <th class="py-3.5 px-5">Status</th>
                <th class="py-3.5 px-5">Alert ID</th>
                <th class="py-3.5 px-5">Barangay</th>
                <th class="py-3.5 px-5">GPS Coordinates</th>
                <th class="py-3.5 px-5">Signal Mode</th>
                <th class="py-3.5 px-5">Submitted</th>
                <th class="py-3.5 px-5 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E0E0E0] text-xs">
              <tr v-if="filteredQueue.length === 0">
                <td colspan="7" class="py-12 text-center text-[#717171] font-bold">
                  No matching SOS alerts found for active filters.
                </td>
              </tr>

              <tr
                v-for="item in filteredQueue"
                :key="item.id"
                :class="[
                  'transition-colors hover:bg-[#EEF4FB]',
                  item.barangay === authStore.assignedArea ? 'bg-[#FFFBEB] font-semibold' : 'bg-white'
                ]"
              >
                <!-- Status Indicator -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <span
                      :class="[
                        'w-3 h-3 rounded-full shrink-0 shadow-sm',
                        item.status === 'pending' ? 'bg-[#902715] animate-ping' :
                        item.status === 'responding' ? 'bg-[#8a7e00]' : 'bg-[#556B2F]'
                      ]"
                    ></span>
                    <span class="capitalize font-black text-xs" :class="item.status === 'pending' ? 'text-[#902715]' : item.status === 'responding' ? 'text-[#8a7e00]' : 'text-[#556B2F]'">
                      {{ item.status }}
                    </span>
                  </div>
                </td>

                <!-- Alert ID & Area Match Badge -->
                <td class="py-3.5 px-5 whitespace-nowrap font-mono font-bold text-[#1F3A4B]">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs">#{{ item.id.substring(0, 8) }}</span>
                    <span v-if="item.barangay === authStore.assignedArea" class="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]">
                      Match
                    </span>
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

                <!-- Dispatch Action Button -->
                <td class="py-3.5 px-5 whitespace-nowrap text-right">
                  <button
                    v-if="item.status === 'pending'"
                    @click="claimAlert(item.id)"
                    class="px-5 py-2 rounded-full bg-[#902715] hover:bg-[#7a2012] text-white font-black text-xs shadow-m3-xs active:scale-95 transition-all"
                  >
                    Claim & Dispatch
                  </button>

                  <div v-else-if="item.status === 'responding'" class="inline-flex items-center space-x-2">
                    <span class="text-xs font-bold text-[#1F3A4B]">
                      Responding
                    </span>
                    <button
                      @click="markResolved(item.id)"
                      class="px-4 py-1.5 rounded-full bg-[#183F07] hover:bg-[#122E06] text-white font-black text-xs shadow-m3-xs active:scale-95 transition-all"
                    >
                      Mark Resolved
                    </button>
                  </div>

                  <span v-else-if="item.status === 'resolved'" class="text-xs font-black text-[#183F07] inline-flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Resolved</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSOSStore } from '@/stores/sosStore'
import { useAuthStore } from '@/stores/authStore'
import { BARANGAY_LIST } from '@/data/barangay_coords'

const sosStore = useSOSStore()
const authStore = useAuthStore()

const toastMessage = ref('')
let staleTimer = null
let pollTimer = null

// ── Multi-Attribute SOS Filters State ──
const filters = ref({
  searchQuery: '',
  barangay: 'all',
  status: 'all',
  mode: 'all',
  assignedAreaOnly: false
})

const filteredQueue = computed(() => {
  return sosStore.sortedQueue.filter(item => {
    // 1. Search Query (ID or Barangay)
    const q = filters.value.searchQuery.toLowerCase().trim()
    if (q) {
      const matchId = item.id.toLowerCase().includes(q)
      const matchBarangay = item.barangay.toLowerCase().includes(q)
      if (!matchId && !matchBarangay) return false
    }

    // 2. Barangay Filter
    if (filters.value.barangay !== 'all' && item.barangay !== filters.value.barangay) {
      return false
    }

    // 3. Status Filter
    if (filters.value.status !== 'all' && item.status !== filters.value.status) {
      return false
    }

    // 4. Mode Filter
    if (filters.value.mode !== 'all' && item.mode !== filters.value.mode) {
      return false
    }

    // 5. Assigned Area Filter
    if (filters.value.assignedAreaOnly && authStore.assignedArea && authStore.assignedArea !== 'all') {
      if (item.barangay !== authStore.assignedArea) return false
    }

    return true
  })
})

function toggleAssignedAreaOnly() {
  filters.value.assignedAreaOnly = !filters.value.assignedAreaOnly
}

function resetFilters() {
  filters.value = {
    searchQuery: '',
    barangay: 'all',
    status: 'all',
    mode: 'all',
    assignedAreaOnly: false
  }
}

async function manualRefresh() {
  if (sosStore.fetchActiveReports) {
    await sosStore.fetchActiveReports()
  }
}

onMounted(async () => {
  if (sosStore.fetchActiveReports) {
    await sosStore.fetchActiveReports()
  }
  sosStore.subscribeToRealtimeSOS()
  await sosStore.checkStaleClaims()

  staleTimer = setInterval(() => {
    sosStore.checkStaleClaims()
  }, 30000)

  pollTimer = setInterval(() => {
    sosStore.fetchActiveReports()
  }, 10000)
})

onUnmounted(() => {
  sosStore.unsubscribeRealtimeSOS()
  if (staleTimer) {
    clearInterval(staleTimer)
  }
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

async function claimAlert(id) {
  toastMessage.value = ''
  const operatorId = authStore.profile?.id || authStore.user?.id
  const result = await sosStore.claimReport(id, operatorId)

  if (!result.success && result.reason === 'already_claimed') {
    toastMessage.value = 'Already claimed by another operator! Queue state updated.'
  } else if (!result.success) {
    toastMessage.value = 'Failed to claim report. Please try again.'
  }
}

async function markResolved(id) {
  await sosStore.resolveReport(id)
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins === 1) return '1 min ago'
  return `${diffMins} mins ago`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-expressive text-3xl font-black text-[#1F3A4B] tracking-tight">Live SOS Emergency Queue</h2>
        <p class="text-xs text-[#902715] font-extrabold uppercase tracking-wider mt-0.5">Realtime WebSocket feed from citizen PWA submissions</p>
      </div>
      <div class="flex items-center space-x-3">
        <span class="px-4 py-1.5 text-xs font-black rounded-full bg-[#902715] text-white flex items-center shadow-[0_4px_12px_rgba(144,39,21,0.25)]">
          <span class="w-2.5 h-2.5 rounded-full bg-[#F7FB41] animate-ping mr-2"></span>
          REALTIME LIVE
        </span>
        <button
          @click="manualRefresh"
          :disabled="sosStore.isLoading"
          class="px-4 py-2 rounded-full bg-[#1F3A4B] hover:bg-[#152a37] text-white font-black text-xs transition-all duration-200 flex items-center space-x-2 shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        class="p-6 rounded-[2.5rem_1.25rem_2.5rem_1.25rem] bg-[#902715] text-white flex items-center justify-between shadow-[0_10px_28px_rgba(144,39,21,0.35)] border border-white/20 transition-all duration-300"
      >
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0 shadow-inner">
            <svg class="w-7 h-7 text-[#F7FB41] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="font-black text-base text-white uppercase tracking-wider">
              BARANGAY INCIDENT CLUSTER ALERT — {{ cluster.barangay }}
            </h3>
            <p class="text-xs text-white/90 mt-1 font-medium">
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

    <!-- Active SOS Queue Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Queue Items Column (2 Cols wide on large screen) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Incoming Alerts</h3>
          <span class="text-xs text-[#717171] font-semibold">
            Assigned Area: <span class="text-[#902715] font-black uppercase tracking-wider">{{ authStore.assignedArea }}</span>
          </span>
        </div>

        <div v-if="sosStore.sortedQueue.length === 0" class="p-12 text-center bg-white rounded-[2.5rem] border border-[#1F3A4B]/15 text-[#717171] text-sm font-bold shadow-sm">
          No pending SOS alerts at this moment.
        </div>

        <div
          v-for="item in sosStore.sortedQueue"
          :key="item.id"
          :class="[
            'p-6 rounded-[2.25rem_1.25rem_2.25rem_1.25rem] bg-white border transition-all duration-200 shadow-[0_8px_24px_rgba(31,58,75,0.06)] space-y-4 admin-card',
            item.barangay === authStore.assignedArea ? 'border-l-4 border-l-[#902715] border-[#1F3A4B]/15' : 'border-[#1F3A4B]/15 hover:border-[#1F3A4B]/30'
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <span
                :class="[
                  'w-3.5 h-3.5 rounded-full shrink-0 shadow-sm',
                  item.status === 'pending' ? 'bg-[#902715] animate-ping' :
                  item.status === 'responding' ? 'bg-[#8a7e00]' : 'bg-[#556B2F]'
                ]"
              ></span>
              <h4 class="font-black text-base text-[#1F3A4B]">SOS Alert #{{ item.id.substring(0, 8) }}</h4>
              <span v-if="item.barangay === authStore.assignedArea" class="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00] shadow-sm">
                Area Match
              </span>
            </div>
            <span class="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#1F3A4B] text-white shadow-sm">
              {{ item.mode }}
            </span>
          </div>

          <div class="text-xs text-[#0A0A0A] grid grid-cols-2 gap-4 bg-[#EEF4FB] p-4 rounded-2xl border border-[#1F3A4B]/15 font-medium">
            <div>
              <span class="text-[#717171] block text-[10px] uppercase font-black tracking-wider">Barangay</span>
              <span class="font-black text-base text-[#1F3A4B]">{{ item.barangay }}</span>
            </div>
            <div>
              <span class="text-[#717171] block text-[10px] uppercase font-black tracking-wider">GPS Position</span>
              <span class="font-mono font-black text-[#902715] text-sm">
                {{ typeof item.latitude === 'number' ? item.latitude.toFixed(4) : item.latitude }},
                {{ typeof item.longitude === 'number' ? item.longitude.toFixed(4) : item.longitude }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] text-[#717171] font-semibold">Submitted: {{ formatTimeAgo(item.created_at) }}</span>

            <div class="flex items-center space-x-2">
              <button
                v-if="item.status === 'pending'"
                @click="claimAlert(item.id)"
                class="px-5 py-2 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white font-black text-xs shadow-[0_4px_14px_rgba(144,39,21,0.35)] active:scale-95 transition-all duration-150"
              >
                Atomic Claim
              </button>

              <template v-else-if="item.status === 'responding'">
                <span class="text-xs font-black text-[#1F3A4B] mr-2">
                  Responding ({{ item.assigned_operator_id || 'Unclaimed' }})
                </span>
                <button
                  @click="markResolved(item.id)"
                  class="px-4 py-2 rounded-full bg-[#556B2F] hover:bg-[#435525] text-white font-black text-xs shadow-md active:scale-95 transition-all duration-150"
                >
                  Mark Resolved
                </button>
              </template>

              <span v-else-if="item.status === 'resolved'" class="text-xs font-black text-[#556B2F] flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Resolved</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tactical GIS Preview Sidebar Card (FIXED PROPORTIONED HEIGHT!) -->
      <div class="lg:col-span-1 self-start h-auto bg-[#1F3A4B] rounded-[2.5rem_1.5rem_2.5rem_1.5rem] text-white p-6 shadow-[0_12px_32px_rgba(31,58,75,0.25)] border border-white/15 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase tracking-wider text-white/80">Tactical GIS Preview</h3>
          <router-link to="/admin/hotspot-map" class="text-xs text-[#F7FB41] hover:underline font-black">
            Open Map →
          </router-link>
        </div>

        <div class="bg-white/10 rounded-[2rem] border border-white/15 p-6 flex flex-col items-center justify-center text-center space-y-3 backdrop-blur-sm">
          <div class="w-14 h-14 rounded-2xl bg-[#F7FB41] text-[#0A0A0A] flex items-center justify-center shrink-0 shadow-md">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h4 class="text-base font-black text-white mb-1">Santa Rosa Incident Grid</h4>
            <p class="text-xs text-white/90 font-medium leading-relaxed">
              View real-time spatial density clusters and barangay risk markers on the Hotspot Density Map.
            </p>
          </div>
          <router-link
            to="/admin/hotspot-map"
            class="px-5 py-2.5 rounded-full bg-[#F7FB41] text-[#0A0A0A] hover:bg-[#eae035] text-xs font-black transition-all shadow-md active:scale-95 uppercase tracking-wider mt-1"
          >
            Launch Density Map
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSOSStore } from '@/stores/sosStore'
import { useAuthStore } from '@/stores/authStore'

const sosStore = useSOSStore()
const authStore = useAuthStore()

const toastMessage = ref('')
let staleTimer = null
let pollTimer = null

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


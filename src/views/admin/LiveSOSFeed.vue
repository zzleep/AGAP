<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">Live SOS Emergency Queue</h2>
        <p class="text-xs text-slate-400">Realtime WebSocket feed from citizen PWA submissions</p>
      </div>
      <div class="flex items-center space-x-2">
        <span class="px-2.5 py-1 text-xs font-bold rounded bg-red-950 text-red-400 border border-red-800/60 flex items-center shadow">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1.5"></span>
          REALTIME LIVE
        </span>
        <button
          @click="manualRefresh"
          :disabled="sosStore.isLoading"
          class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 transition-colors disabled:opacity-50"
        >
          {{ sosStore.isLoading ? 'Refreshing...' : '↻ Refresh' }}
        </button>
      </div>
    </div>

    <!-- Cluster Alert Banner -->
    <div v-if="sosStore.activeClusters.length > 0" class="space-y-2">
      <div
        v-for="cluster in sosStore.activeClusters"
        :key="cluster.barangay"
        class="p-4 rounded-xl bg-red-950/80 border-2 border-red-600 text-white flex items-center justify-between shadow-xl animate-pulse"
      >
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-bold text-lg text-white shrink-0">
            ⚠️
          </div>
          <div>
            <h3 class="font-extrabold text-sm text-red-200 uppercase tracking-wide">
              BARANGAY INCIDENT CLUSTER ALERT — {{ cluster.barangay }}
            </h3>
            <p class="text-xs text-red-300">
              High density emergency activity detected: {{ cluster.count }} active SOS reports in the past 30 minutes. Priority dispatch recommended.
            </p>
          </div>
        </div>
        <span class="px-3 py-1 bg-red-600 text-white text-xs font-extrabold rounded-full shrink-0">
          {{ cluster.count }} ALERTS
        </span>
      </div>
    </div>

    <!-- Conflict Warning Toast Notification -->
    <div
      v-if="toastMessage"
      class="p-3 rounded-lg bg-amber-950 border border-amber-600 text-amber-200 text-xs font-semibold flex items-center justify-between shadow-lg"
    >
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
      <button @click="toastMessage = ''" class="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5">
        Dismiss
      </button>
    </div>

    <!-- Active SOS Queue Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Incoming Alerts</h3>
          <span class="text-[11px] text-slate-500 font-medium">
            Assigned Area: <span class="text-amber-400 font-bold capitalize">{{ authStore.assignedArea }}</span>
          </span>
        </div>

        <div v-if="sosStore.sortedQueue.length === 0" class="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500 text-sm">
          No pending SOS alerts at this moment.
        </div>

        <div
          v-for="item in sosStore.sortedQueue"
          :key="item.id"
          :class="[
            'p-4 rounded-xl bg-slate-900 border transition-colors shadow-md space-y-3',
            item.barangay === authStore.assignedArea ? 'border-amber-500/80 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'w-3 h-3 rounded-full',
                  item.status === 'pending' ? 'bg-red-500 animate-ping' :
                  item.status === 'responding' ? 'bg-amber-500' : 'bg-emerald-500'
                ]"
              ></span>
              <h4 class="font-bold text-sm text-white">SOS Alert #{{ item.id.substring(0, 8) }}</h4>
              <span v-if="item.barangay === authStore.assignedArea" class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-950 text-amber-300 border border-amber-800">
                Area Match
              </span>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
              {{ item.mode }}
            </span>
          </div>

          <div class="text-xs text-slate-300 grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
            <div>
              <span class="text-slate-500 block text-[10px]">Barangay</span>
              <span class="font-semibold text-white">{{ item.barangay }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">GPS Position</span>
              <span class="font-mono text-amber-300">
                {{ typeof item.latitude === 'number' ? item.latitude.toFixed(4) : item.latitude }},
                {{ typeof item.longitude === 'number' ? item.longitude.toFixed(4) : item.longitude }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] text-slate-500">Submitted: {{ formatTimeAgo(item.created_at) }}</span>

            <div class="flex items-center space-x-2">
              <button
                v-if="item.status === 'pending'"
                @click="claimAlert(item.id)"
                class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Atomic Claim
              </button>

              <template v-else-if="item.status === 'responding'">
                <span class="text-xs font-bold text-amber-400 mr-1">
                  Responding ({{ item.assigned_operator_id || 'Unclaimed' }})
                </span>
                <button
                  @click="markResolved(item.id)"
                  class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors"
                >
                  Mark Resolved
                </button>
              </template>

              <span v-else-if="item.status === 'resolved'" class="text-xs font-bold text-emerald-400">
                ✓ Resolved
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Quick Preview Card -->
      <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 min-h-[350px] flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Tactical GIS Preview</h3>
          <router-link to="/admin/hotspot-map" class="text-xs text-blue-400 hover:underline font-semibold">
            Open Hotspot Map →
          </router-link>
        </div>
        <div class="flex-1 bg-slate-950 rounded-lg border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-800 flex items-center justify-center text-blue-400 text-xl font-bold">
            🗺️
          </div>
          <div>
            <h4 class="text-sm font-bold text-white mb-1">Santa Rosa Incident Grid</h4>
            <p class="text-xs text-slate-400 max-w-xs">
              View real-time spatial density clusters and barangay risk markers on the Hotspot Density Map.
            </p>
          </div>
          <router-link
            to="/admin/hotspot-map"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow"
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


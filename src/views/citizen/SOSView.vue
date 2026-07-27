<template>
  <div class="space-y-4">
    <div class="p-4 rounded-xl bg-slate-800 border border-slate-700">
      <h2 class="text-xl font-bold text-white mb-1">One-Touch SOS Emergency</h2>
      <p class="text-xs text-slate-400">
        Dispatches your current GPS coordinates directly to Santa Rosa CDRRMO operators.
      </p>
    </div>

    <!-- Cached GPS Info Display -->
    <div v-if="cachedLocation" class="p-3 rounded-lg bg-slate-800/70 border border-slate-700/70 flex items-center justify-between text-xs">
      <div>
        <span class="text-slate-400 block text-[10px] uppercase font-semibold">Cached GPS Position</span>
        <span class="font-mono text-slate-200">
          {{ cachedLocation.latitude.toFixed(5) }}, {{ cachedLocation.longitude.toFixed(5) }}
        </span>
        <span class="text-slate-400 ml-2">({{ cachedLocation.barangay }})</span>
      </div>
      <button
        @click="refreshLocation(true)"
        :disabled="isLocating"
        class="px-2.5 py-1 text-[11px] rounded bg-slate-700 hover:bg-slate-600 text-blue-300 border border-slate-600 transition-colors disabled:opacity-50"
      >
        {{ isLocating ? 'Locating...' : 'Refresh GPS' }}
      </button>
    </div>

    <!-- Status Ticker Card -->
    <div v-if="sos.currentSOS" class="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400">Dispatch Status</span>
        <span
          :class="[
            'px-2.5 py-0.5 text-xs font-bold rounded-full uppercase',
            sos.deliveryState === 'sent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
            sos.deliveryState === 'queued' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
          ]"
        >
          <template v-if="sos.deliveryState === 'sent'">Sent ✓</template>
          <template v-else-if="sos.deliveryState === 'queued'">Queued (Background Sync)</template>
          <template v-else-if="sos.deliveryState === 'sending'">Sending...</template>
          <template v-else>{{ sos.deliveryState }}</template>
        </span>
      </div>
      <div class="text-xs text-slate-300 space-y-1">
        <p><strong>Coordinates:</strong> {{ sos.currentSOS.latitude.toFixed(5) }}, {{ sos.currentSOS.longitude.toFixed(5) }}</p>
        <p><strong>Barangay:</strong> {{ sos.currentSOS.barangay }}</p>
        <p><strong>User ID Hash:</strong> <code class="text-[10px] bg-slate-900 px-1 py-0.5 rounded text-amber-300">{{ sos.currentSOS.user_hash }}</code></p>
        <p><strong>Timestamp:</strong> {{ new Date(sos.currentSOS.created_at).toLocaleTimeString() }}</p>
      </div>
    </div>

    <!-- Dispatch Action Button -->
    <div class="space-y-3">
      <button
        @click="handleSOSDispatch"
        :disabled="isLocating || sos.isPending"
        class="w-full py-5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-lg tracking-wider shadow-xl shadow-red-950/60 flex items-center justify-center transition-all active:scale-95"
      >
        <span v-if="isLocating">Acquiring GPS Signal...</span>
        <span v-else-if="sos.isPending">Transmitting Signal...</span>
        <span v-else-if="sos.deliveryState === 'queued'">RE-SEND EMERGENCY SOS</span>
        <span v-else>SEND EMERGENCY SOS NOW</span>
      </button>

      <div class="p-3 rounded-lg bg-slate-800/60 text-[11px] text-slate-400 text-center border border-slate-700/50">
        Signal Mode: <span class="font-bold text-slate-200 uppercase">{{ connectivity.mode }}</span> — Pre-warmed REST / sendBeacon enabled.
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSOSStore } from '@/stores/sosStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { useSOS } from '@/composables/useSOS'
import { useGPS } from '@/composables/useGPS'

const sos = useSOSStore()
const connectivity = useConnectivityStore()
const { dispatchSOS } = useSOS()
const { cachedLocation, isLocating, refreshLocation } = useGPS()

async function handleSOSDispatch() {
  let coords = cachedLocation.value
  if (!coords) {
    coords = await refreshLocation(false)
  }

  if (!coords) {
    coords = {
      latitude: 14.3123,
      longitude: 121.1114,
      barangay: 'Tagapo'
    }
  }

  await dispatchSOS(coords)
}
</script>

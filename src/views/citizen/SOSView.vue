<template>
  <section class="sos-screen space-y-4" aria-labelledby="sos-heading">
    <!-- Header -->
    <div class="text-center">
      <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-[#902715]">AGAP SOS</p>
      <h2 id="sos-heading" class="font-expressive mt-2 text-3xl font-black tracking-tight text-[#0A0A0A]">{{ $t('sos.title') }}</h2>
      <p class="mx-auto mt-2 max-w-[18rem] text-sm font-medium leading-relaxed text-[#717171]">{{ $t('sos.description') }}</p>
    </div>

    <!-- Delivery Message Banner (Dark Olive Background with White Text for High Readability) -->
    <div v-if="deliveryMessage" class="sos-delivery-status" :class="deliveryTone" role="status" aria-live="polite">
      <span class="font-expressive text-base font-extrabold block text-white">{{ deliveryMessage }}</span>
      <span class="mt-1 block text-xs font-medium text-white/90 leading-relaxed">{{ deliveryDetail }}</span>
    </div>

    <!-- GPS Disabled / Fallback Warning Pill -->
    <div
      v-if="isLocationFallback"
      class="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 max-w-sm mx-auto shadow-m3-sm"
    >
      <div class="flex items-center space-x-2 font-bold text-amber-950">
        <svg class="w-5 h-5 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span class="text-xs">Location Required for Emergency SOS</span>
      </div>
      <p class="text-[11px] text-amber-900 leading-relaxed font-medium">
        CDRRMO dispatchers need your live GPS position to send emergency responders to your location.
      </p>
      <button
        type="button"
        @click="handleEnableGPS"
        :disabled="isLocating"
        class="w-full py-2.5 px-4 rounded-xl bg-[#902715] text-[#F7FB41] font-black text-xs uppercase tracking-wider hover:bg-[#781f11] active:scale-95 transition-all shadow-m3-xs flex items-center justify-center space-x-1.5 cursor-pointer"
      >
        <svg class="w-4 h-4 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>Enable Location Access</span>
      </button>
    </div>

    <!-- Clean Modern M3 Expressive Tactile SOS Button -->
    <div class="flex flex-1 items-center justify-center py-5">
      <button
        type="button"
        class="sos-hold-button"
        :class="{ 'is-holding': isHolding, 'is-busy': isBusy, 'opacity-65 grayscale cursor-pointer': isLocationFallback }"
        :disabled="isBusy"
        :aria-label="$t('sos.holdSosAria')"
        @pointerdown="startHold"
        @pointerup="cancelHold"
        @pointercancel="cancelHold"
        @pointerleave="cancelHold"
        @lostpointercapture="cancelHold"
        @keydown.space.prevent="startKeyboardHold"
        @keyup.space.prevent="cancelHold"
        @keydown.enter.prevent="startKeyboardHold"
        @keyup.enter.prevent="cancelHold"
      >
        <!-- Outer Progress Track Ring -->
        <svg class="sos-hold-button__progress" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="sos-hold-button__progress-track" cx="50" cy="50" r="46" pathLength="100" />
          <circle class="sos-hold-button__progress-value" cx="50" cy="50" r="46" pathLength="100" :style="{ strokeDashoffset: 100 - holdProgress }" />
        </svg>

        <!-- Clean Surface Content -->
        <span class="sos-hold-button__surface space-y-1">
          <svg class="h-8 w-8 text-[#F7FB41]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-expressive text-5xl font-black tracking-tight text-white leading-none">SOS</span>
          <span class="font-expressive text-xs font-bold uppercase tracking-wider text-[#F7FB41] pt-1 block">{{ holdLabel }}</span>
          <span class="text-[11px] font-semibold text-white/70 block">{{ holdTimeLabel }}</span>
        </span>
      </button>
    </div>

    <!-- Instruction Indicator Pill -->
    <p v-if="isHolding || isBusy" class="min-h-5 text-center text-xs font-bold text-[#902715] bg-[#f9ebe8] px-4 py-2 rounded-full border border-[#f3d3cd] max-w-xs mx-auto" aria-live="polite">
      {{ holdInstruction }}
    </p>

    <!-- GPS Settings Guide Modal -->
    <GpsGuideModal
      :show="showGpsGuideModal"
      @close="showGpsGuideModal = false"
      @retry="handleEnableGPS"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSOSStore } from '@/stores/sosStore'
import { useSOS } from '@/composables/useSOS'
import { useGPS } from '@/composables/useGPS'
import { findNearestBarangay } from '@/data/barangay_coords'
import GpsGuideModal from '@/components/common/GpsGuideModal.vue'

const HOLD_DURATION_MS = 2000
const sos = useSOSStore()
const { t } = useI18n()
const { dispatchSOS, warmConnection } = useSOS()
const { isLocating, refreshLocation, cachedLocation, initGPS } = useGPS()

const showGpsGuideModal = ref(false)
const holdProgress = ref(0)
const isHolding = ref(false)
const isDispatching = ref(false)
let holdFrame = null
let holdStartedAt = 0
let activePointerId = null

const isLocationFallback = computed(() => !cachedLocation.value || cachedLocation.value.isFallback)

async function handleEnableGPS() {
  const res = await initGPS()
  if (res?.denied) {
    showGpsGuideModal.value = true
    return
  }
  if (res && res.success) {
    localStorage.setItem('agap_location_pref', 'granted')
  }
  const loc = await refreshLocation(true)
  if (loc && loc.isFallback) {
    showGpsGuideModal.value = true
  }
}

onMounted(() => {
  warmConnection()
})

const isBusy = computed(() => isLocating.value || sos.isPending || isDispatching.value)
const holdLabel = computed(() => {
  if (isLocationFallback.value) return 'Location Required'
  if (isLocating.value) return t('sos.findingLocation')
  if (sos.isPending || isDispatching.value) return t('sos.sendingRequest')
  return isHolding.value ? t('sos.keepHolding') : t('sos.holdToSend')
})
const holdTimeLabel = computed(() => {
  if (isLocationFallback.value) return 'Tap to Enable GPS'
  return isHolding.value ? `${Math.ceil((100 - holdProgress.value) / 50) || 1}s` : 'Press & Hold 2s'
})
const holdInstruction = computed(() => {
  if (isLocationFallback.value) return 'Enable location to send Emergency SOS'
  if (isLocating.value) return t('sos.findingLocation')
  if (sos.isPending || isDispatching.value) return t('sos.sendingRequest')
  return isHolding.value ? t('sos.keepHolding') : t('sos.description')
})
const deliveryMessage = computed(() => {
  if (sos.deliveryState === 'sent') return t('sos.sentMessage')
  if (sos.deliveryState === 'queued') return t('sos.queuedMessage')
  return ''
})
const deliveryDetail = computed(() => sos.deliveryState === 'sent' ? t('sos.sentDetail') : t('sos.queuedDetail'))
const deliveryTone = computed(() => sos.deliveryState === 'sent'
  ? 'bg-[#556B2F] border-[#425324] text-white shadow-m3-md'
  : 'bg-[#902715] border-[#781f11] text-white shadow-m3-md')

function startHold(event) {
  if (isLocationFallback.value) {
    handleEnableGPS()
    return
  }
  if (isBusy.value || isHolding.value) return
  if (event?.button !== undefined && event.button !== 0) return

  // Asynchronously trigger pre-warm right at t=0.0s of hold start
  warmConnection(true)

  event?.preventDefault?.()
  activePointerId = event?.pointerId ?? null
  event?.currentTarget?.setPointerCapture?.(activePointerId)
  isHolding.value = true
  holdStartedAt = performance.now()
  animateHold(holdStartedAt)
}

function startKeyboardHold() {
  startHold()
}

function animateHold(now) {
  holdProgress.value = Math.min(100, ((now - holdStartedAt) / HOLD_DURATION_MS) * 100)
  if (holdProgress.value >= 100) {
    finishHold()
    return
  }
  holdFrame = requestAnimationFrame(animateHold)
}

function cancelHold(event) {
  if (activePointerId !== null && event?.pointerId !== undefined && event.pointerId !== activePointerId) return
  if (isDispatching.value) return
  clearHold()
}

function clearHold() {
  if (holdFrame) cancelAnimationFrame(holdFrame)
  holdFrame = null
  activePointerId = null
  isHolding.value = false
  holdProgress.value = 0
}

async function finishHold() {
  if (!isHolding.value || isDispatching.value) return
  if (holdFrame) cancelAnimationFrame(holdFrame)
  holdFrame = null
  activePointerId = null
  isHolding.value = false
  holdProgress.value = 100
  isDispatching.value = true

  try {
    let coords = await refreshLocation(true)
    if (!coords) {
      const fallbackLat = 14.3123
      const fallbackLng = 121.1114
      coords = {
        latitude: fallbackLat,
        longitude: fallbackLng,
        accuracy: 0,
        barangay: findNearestBarangay(fallbackLat, fallbackLng),
        isFallback: true
      }
    }
    await dispatchSOS(coords)
  } finally {
    isDispatching.value = false
    holdProgress.value = 0
  }
}

onBeforeUnmount(clearHold)
</script>


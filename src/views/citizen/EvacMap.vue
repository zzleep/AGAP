<template>
  <div class="space-y-3 h-full flex flex-col">
    <!-- Streamlined M3 Expressive Evacuation Card -->
    <EvacHeaderCard
      :nearest-evac-center="nearestEvacCenter"
      :user-location="userLocation"
      :nearest-evac-distance="nearestEvacDistance"
      :nearest-evac-route-info="nearestEvacRouteInfo"
      :safety-score="safetyScore"
      :safety-meter-color="safetyMeterColor"
      :safety-meter-label="safetyMeterLabel"
      :nearby-incident-count="nearbyIncidentCount"
      :risk-level="flow.mappedRiskLevel"
      :is-locating="isLocating"
      :stuck-alert="stuckAlert"
      @refresh="refreshLocationAndSafety"
    />

    <!-- Map Canvas Container with Floating M3 Controls -->
    <div
      ref="mapWrapperEl"
      class="relative flex-1 min-h-[62vh] md:min-h-[76vh] rounded-3xl overflow-hidden border border-[#E0E0E0] bg-[#e5e7eb] transition-all duration-200 shadow-m3-md"
      :class="isExpanded ? 'fixed inset-0 z-[9999] m-0 rounded-none border-0 min-h-0' : ''"
    >
      <div ref="mapContainerEl" class="absolute inset-0 z-10"></div>

      <!-- Loading overlay: shown while mapbox-gl (750KB) downloads on slow networks -->
      <div v-if="mapLoading && !mapError" class="absolute inset-0 z-20 flex items-center justify-center bg-[#e5e7eb]/80 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-2">
          <div class="w-6 h-6 border-2 border-[#902715] border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-[#717171]">Loading map…</p>
        </div>
      </div>

      <div
        v-if="userLocation && nearestEvacCenter"
        class="absolute left-3 top-3 z-30 max-w-[calc(100%-8rem)] rounded-2xl border border-black/10 bg-white/90 p-3 text-xs shadow-m3-lg backdrop-blur-md"
      >
        <p class="text-[9px] font-extrabold uppercase tracking-wider text-[#717171] leading-tight break-words">{{ $t('evacMap.routeGuide') }}</p>
        <p class="mt-0.5 font-expressive text-sm font-black text-[#0A0A0A] leading-tight break-words">{{ nearestEvacCenter.name }}</p>
        <p class="mt-0.5 text-[#717171] text-[11px] leading-tight">
          {{ formatDistanceToKm(nearestEvacDistance) }} km {{ $t('evacMap.straightLine') }} {{ $t('evacMap.fromYou') }}
        </p>
      </div>

      <div v-if="mapError" class="absolute inset-0 z-20 flex items-center justify-center p-6 bg-white/95 text-center">
        <div class="max-w-sm space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-[#902715]/10 text-[#902715] mx-auto flex items-center justify-center font-bold">
            !
          </div>
          <p class="text-base font-expressive font-extrabold text-[#0A0A0A]">Map unavailable</p>
          <p class="text-xs text-[#717171] font-medium leading-relaxed">{{ mapError }}</p>
        </div>
      </div>

      <!-- Top Control Floating Pill Stack -->
      <div class="absolute top-3 right-3 z-30 flex flex-col gap-1.5">
        <!-- Expand Toggle -->
        <button
          @click="toggleExpand"
          class="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#0A0A0A] font-bold text-[11px] border border-black/10 shadow-m3-md transition-transform active:scale-95 flex items-center space-x-1.5"
        >
          <svg v-if="isExpanded" class="w-3.5 h-3.5 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4l5 5m0 0H5m4 0V5m10-1l-5 5m0 0h4m-4 0V5M4 20l5-5m0 0H5m4 0v4m10 0l-5-5m0 0h4m-4 0v4"/></svg>
          <svg v-else class="w-3.5 h-3.5 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          <span>{{ isExpanded ? 'Exit' : 'Expand' }}</span>
        </button>

        <!-- Flood Zones Toggle -->
        <button
          @click="toggleFloodZones"
          class="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#0A0A0A] font-bold text-[11px] border border-black/10 shadow-m3-md transition-transform active:scale-95 flex items-center space-x-1.5"
          :class="showFloodZones ? '' : 'opacity-50'"
        >
          <svg class="w-3.5 h-3.5" :class="showFloodZones ? 'text-[#1F3A4B]' : 'text-[#717171]'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          </svg>
          <span>{{ showFloodZones ? 'Hide Flood' : 'Show Flood' }}</span>
        </button>
      </div>

      <!-- Bottom Status & Recenter Floating Glass Dock -->
      <div class="absolute bottom-24 left-3 right-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-black/10 text-xs flex justify-between items-center z-[60] shadow-m3-lg">
        <div class="space-y-0.5">
          <span class="text-[#717171] block text-[9px] font-extrabold uppercase tracking-wider">{{ $t('evacMap.activeRiskFilter') }}</span>
          <span
            class="font-expressive font-black text-sm uppercase tracking-wide"
            :class="{
              'text-[#556B2F]': flow.mappedRiskLevel === 'low',
              'text-[#D14D3E]': flow.mappedRiskLevel === 'moderate',
              'text-[#902715]': flow.mappedRiskLevel === 'high'
            }"
          >
            {{ $t('evacMap.riskRoutes', { risk: $t('evacMap.' + flow.mappedRiskLevel) }) }}
          </span>
        </div>
        <button
          @click="recenterMap(userLocation || cachedLocation)"
          class="px-3.5 py-1.5 rounded-full bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] font-bold text-[11px] transition-colors shadow-m3-sm active:scale-95"
        >
          {{ $t('evacMap.recenter') }}
        </button>
      </div>
    </div>

    <!-- GPS Settings Guide Modal -->
    <GpsGuideModal
      :show="showGpsGuideModal"
      @close="showGpsGuideModal = false"
      @retry="refreshLocationAndSafety"
    />
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted, nextTick, computed } from 'vue'
// mapbox-gl is dynamically imported inside useMapboxMap to avoid blocking render with
// its 750KB download on 3G/slow 4G. Static imports would block the entire component.
import 'mapbox-gl/dist/mapbox-gl.css'

import { useFlowStore } from '@/stores/flowStore'
import { useGPS } from '@/composables/useGPS'
import { EVAC_CENTERS } from '@/data/evac_deets.vue'
import { getDistanceKm, formatDistanceToKm } from '@/utils/geo'
import { getSafetyMeterColor, getSafetyMeterLabel } from '@/utils/risk'
import GpsGuideModal from '@/components/common/GpsGuideModal.vue'
import EvacHeaderCard from '@/components/EvacHeaderCard.vue'

import { useMapboxMap } from '@/composables/useMapboxMap'
import { useRiskZones } from '@/composables/useRiskZones'
import { useEvacRoutes } from '@/composables/useEvacRoutes'
import { useEvacMarkers } from '@/composables/useEvacMarkers'
import { useEvacRouteLine } from '@/composables/useEvacRouteLine'
import { useIncidents } from '@/composables/useIncidents'
import { useAutopilot } from '@/composables/useAutopilot'

const flow = useFlowStore()
const { cachedLocation, isLocating, initGPS, refreshLocation, startLiveTracking, stopLiveTracking } = useGPS()

const showGpsGuideModal = ref(false)
const userLocation = ref(null)
const nearestEvacCenter = ref(null)
const nearestEvacDistance = ref(null)
const routeReason = ref('')

// ── Composable wiring ──
// onMapReady is invoked by useMapboxMap once the map style finishes loading and
// dispatches the render passes from the other composables onto the live map.
const { map, mapboxgl, mapLoading, mapError, isExpanded, mapWrapperEl, mapContainerEl, mapboxToken, initMap, handleViewportResize, recenterMap, toggleExpand, mount, cleanup } = useMapboxMap({ onMapReady })

const { showFloodZones, addBoundaryLayer, renderRiskZones, toggleFloodZones } = useRiskZones({ map, mapboxgl })
const { routesData, loadEvacRoutes, renderRoutes } = useEvacRoutes({ map, mapboxgl })
const { renderEvacMarkers, clearEvacMarkers } = useEvacMarkers({ map, mapboxgl })

// Circular refs between autopilot ↔ route line ↔ incidents are resolved through
// a mutable deps object that is populated once every composable exists.
const autopilotDeps = { renderEvacRouteLine: null, getNearbyIncidentSummary: null, nearestEvacRouteInfo: null }
const autopilot = useAutopilot({ userLocation, nearestEvacCenter, deps: autopilotDeps })
const { safetyScore, stuckAlert, startAutopilot, stopAutopilot, runAutopilotCycle } = autopilot
const routeLine = useEvacRouteLine({ map, mapboxgl, mapboxToken, userLocation, nearestEvacCenter, lastAutopilotReason: autopilot.lastAutopilotReason, routeReason })
const { nearestEvacRouteInfo, renderEvacRouteLine, dispose } = routeLine
const incidents = useIncidents({ map, mapboxgl, userLocation, activeRouteCoordinates: routeLine.activeRouteCoordinates })
const { nearbyIncidentCount, clearIncidentMarkers, getNearbyIncidentSummary } = incidents
autopilotDeps.renderEvacRouteLine = routeLine.renderEvacRouteLine
autopilotDeps.getNearbyIncidentSummary = incidents.getNearbyIncidentSummary
autopilotDeps.nearestEvacRouteInfo = routeLine.nearestEvacRouteInfo

function onMapReady() {
  addBoundaryLayer()
  renderRiskZones()
  renderEvacMarkers()
  renderEvacRouteLine()
  runAutopilotCycle(true)
  renderRoutes()
  handleViewportResize()
}

// ── Safety Meter computed properties ──
const safetyMeterColor = computed(() => getSafetyMeterColor(safetyScore.value))
const safetyMeterLabel = computed(() => getSafetyMeterLabel(safetyScore.value))

async function refreshLocationAndSafety() {
  const res = await initGPS(true)
  if (res?.denied) {
    showGpsGuideModal.value = true
    return
  }
  const loc = await refreshLocation(true)
  if (loc && loc.isFallback) {
    showGpsGuideModal.value = true
  } else {
    syncUserLocation()
  }
}

function findNearestEvacCenter(lat, lng) {
  let nearestCenter = null
  let nearestDistance = Infinity

  EVAC_CENTERS.forEach(center => {
    const distance = getDistanceKm(lat, lng, center.coords.latitude, center.coords.longitude)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestCenter = center
    }
  })

  return {
    center: nearestCenter,
    distanceKm: nearestDistance
  }
}

function syncUserLocation() {
  if (!cachedLocation.value) return

  const previousCenterId = nearestEvacCenter.value?.id || null
  userLocation.value = cachedLocation.value
  const result = findNearestEvacCenter(cachedLocation.value.latitude, cachedLocation.value.longitude)
  nearestEvacCenter.value = result.center
  nearestEvacDistance.value = result.distanceKm
  if (previousCenterId !== (result.center?.id || null)) {
    routeReason.value = `Nearest center changed to ${result.center?.name || 'new center'} based on your movement.`
  }
  renderEvacRouteLine()
  runAutopilotCycle(false)
}

onMounted(async () => {
  mount()
  startAutopilot()

  await nextTick()
  loadEvacRoutes() // non-blocking: renders bundled data instantly, refreshes from Supabase in background
  initMap()

  initGPS().then((res) => {
    syncUserLocation()
    if (!res || !res.skipped) {
      startLiveTracking()
    }
  }).catch(err => {
    console.warn('Non-fatal GPS acquisition delay:', err)
  })
})

onUnmounted(() => {
  dispose()
  clearEvacMarkers()
  clearIncidentMarkers()
  stopAutopilot()
  stopLiveTracking()
  cleanup()
  document.body.classList.remove('overflow-hidden')
})

watch(() => flow.mappedRiskLevel, () => {
  renderRoutes()
  runAutopilotCycle(true)
})

watch(routesData, () => {
  renderRoutes()
})

watch(cachedLocation, () => {
  syncUserLocation()
})
</script>

<style scoped>
:deep(.mapboxgl-map) {
  position: absolute !important;
  top: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.mapboxgl-canvas-container),
:deep(.mapboxgl-canvas) {
  width: 100% !important;
  height: 100% !important;
}
</style>

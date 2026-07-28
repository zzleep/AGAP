<template>
  <div class="space-y-3 h-full flex flex-col">
    <!-- Streamlined M3 Expressive Evacuation Card -->
    <div class="rounded-3xl border border-[#E0E0E0] bg-white p-4 shadow-m3-sm space-y-3">
      <!-- Line 1: Title + Location Refresh Action -->
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-[#717171] block">
            {{ $t('evacMap.nearestLabel') }}
          </span>
          <h2 class="font-expressive font-black text-xl text-[#0A0A0A] tracking-tight leading-tight truncate mt-0.5">
            {{ nearestEvacCenter?.name || $t('evacMap.locating') }}
          </h2>
        </div>

        <!-- Single Purposeful Refresh Icon Button -->
        <button
          type="button"
          class="p-2.5 rounded-full border border-[#E0E0E0] bg-white text-[#0A0A0A] shadow-m3-sm transition-transform active:scale-95 hover:bg-[#F5F5F5] hover:border-[#902715]/40 shrink-0"
          :disabled="isLocating"
          title="Refresh location and safety score"
          @click="refreshLocationAndSafety"
        >
          <svg class="w-4 h-4 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>

      <!-- Line 2: Location Subtitle & Walk Time -->
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#717171]">
        <span v-if="userLocation">
          {{ userLocation.barangay || $t('home.currentLocation') }} · {{ formatDistanceToKm(nearestEvacDistance) }} km away
        </span>
        <span v-else>{{ $t('evacMap.locationHint') }}</span>
        <span v-if="nearestEvacRouteInfo" class="px-2.5 py-0.5 rounded-full bg-[#902715]/10 text-[#902715] font-extrabold text-[11px]">
          {{ formatDistanceToKm(nearestEvacRouteInfo.distanceKm) }} km route · {{ formatDurationToMinutes(nearestEvacRouteInfo.durationMinutes) }} min walk
        </span>
      </div>

      <p v-if="stuckAlert" class="text-[11px] font-extrabold text-[#902715] flex items-center gap-1.5 pt-0.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Potentially stuck in risk zone. Alert sent.
      </p>

      <!-- Line 3: Integrated Horizontal M3 Safety Bar & Context Chips -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0F0F0]">
        <!-- Left: Integrated Safety Bar -->
        <div class="flex items-center gap-2.5">
          <div class="flex items-baseline gap-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-[#717171]">Safety</span>
            <span class="font-expressive font-black text-lg leading-none" :style="{ color: safetyMeterColor }">{{ safetyScore }}</span>
          </div>

          <!-- M3 5-Segment Progress Bar -->
          <div class="flex items-center gap-1 w-20">
            <div
              v-for="seg in 5"
              :key="seg"
              class="h-1.5 flex-1 rounded-full transition-all duration-500"
              :style="{ backgroundColor: seg * 20 <= safetyScore ? safetyMeterColor : '#E0E0E0' }"
            ></div>
          </div>

          <span
            class="px-2 py-0.5 text-[9px] font-black uppercase rounded-full text-white shadow-xs"
            :style="{ backgroundColor: safetyMeterColor }"
          >
            {{ safetyMeterLabel }}
          </span>
        </div>

        <!-- Right: Risk Context Badges (No Emojis) -->
        <div class="flex items-center gap-1.5 text-[10px] font-extrabold text-[#1F3A4B]">
          <span class="px-2.5 py-1 rounded-full bg-[#1F3A4B]/5 border border-[#1F3A4B]/15">
            {{ nearbyIncidentCount }} Incidents
          </span>
          <span class="px-2.5 py-1 rounded-full bg-[#1F3A4B]/5 border border-[#1F3A4B]/15 capitalize">
            {{ flow.mappedRiskLevel }} Risk
          </span>
        </div>
      </div>
    </div>

    <!-- Map Canvas Container with Floating M3 Controls -->
    <div
      ref="mapWrapperEl"
      class="relative flex-1 min-h-[62vh] md:min-h-[76vh] rounded-3xl overflow-hidden border border-[#E0E0E0] bg-[#e5e7eb] transition-all duration-200 shadow-m3-md"
      :class="isExpanded ? 'fixed inset-0 z-[9999] m-0 rounded-none border-0 min-h-0' : ''"
    >
      <div ref="mapContainerEl" class="absolute inset-0 z-10"></div>

      <div
        v-if="userLocation && nearestEvacCenter"
        class="absolute left-3 top-3 z-30 max-w-[calc(100%-8rem)] rounded-2xl border border-black/10 bg-white/90 p-3 text-xs shadow-m3-lg backdrop-blur-md"
      >
        <p class="text-[9px] font-extrabold uppercase tracking-wider text-[#717171] leading-tight break-words">{{ $t('evacMap.routeGuide') }}</p>
        <p class="mt-0.5 font-expressive text-sm font-black text-[#0A0A0A] leading-tight break-words">{{ nearestEvacCenter.name }}</p>
        <p class="mt-0.5 text-[#717171] text-[11px] leading-tight">
          {{ $t('evacMap.fromYou') }} {{ formatDistanceToKm(nearestEvacDistance) }} km
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

      <!-- Top Control Floating Pill -->
      <div class="absolute top-3 right-3 z-30">
        <button
          @click="toggleExpand"
          class="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-[#0A0A0A] font-bold text-[11px] border border-black/10 shadow-m3-md transition-transform active:scale-95 flex items-center space-x-1.5"
        >
          <!-- Minimize screen icon when expanded, Expand screen icon when collapsed -->
          <svg v-if="isExpanded" class="w-3.5 h-3.5 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4l5 5m0 0H5m4 0V5m10-1l-5 5m0 0h4m-4 0V5M4 20l5-5m0 0H5m4 0v4m10 0l-5-5m0 0h4m-4 0v4"/></svg>
          <svg v-else class="w-3.5 h-3.5 text-[#902715]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          <span>{{ isExpanded ? 'Exit' : 'Expand' }}</span>
        </button>
      </div>

      <!-- Bottom Status & Recenter Floating Glass Dock -->
      <div class="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-black/10 text-xs flex justify-between items-center z-20 shadow-m3-lg">
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
          @click="recenterMap"
          class="px-3.5 py-1.5 rounded-full bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] font-bold text-[11px] transition-colors shadow-m3-sm active:scale-95"
        >
          {{ $t('evacMap.recenter') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import mapboxgl from 'mapbox-gl'
import MapboxWorker from 'mapbox-gl/dist/mapbox-gl-csp-worker?worker'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.workerClass = MapboxWorker
import { useFlowStore } from '@/stores/flowStore'
import { supabase } from '@/lib/supabase'
import { useGPS } from '@/composables/useGPS'
import { EVAC_CENTERS } from '@/data/evac_deets.vue'
import { BARANGAY_COORDS } from '@/data/barangay_coords'
import santaRosaBoundaries from '@/data/santa_rosa_boundaries.json'
import fallbackRoutes from '@/data/evac_routes.json'

const { t } = useI18n()
const flow = useFlowStore()
const { cachedLocation, isLocating, initGPS, refreshLocation, startLiveTracking, stopLiveTracking } = useGPS()
let map = null

const osmRasterStyle = {
  version: 8,
  sources: {
    'osm-raster-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

const SANTA_ROSA_CENTER = [121.1114, 14.3123]
const routesData = ref([])
const isExpanded = ref(false)
const mapWrapperEl = ref(null)
const mapContainerEl = ref(null)
const mapError = ref('')
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || ''
const routeSourceIds = []
const routeLayerIds = []
const evacMarkers = []
const incidentMarkers = []
const evacRouteSourceId = 'evac-user-route'
const evacRouteLayerId = 'evac-user-route-line'
const evacRouteFallbackLayerId = 'evac-user-route-fallback'
const routeIncidentCorridorKm = 0.6
const userLocation = ref(null)
const nearestEvacCenter = ref(null)
const nearestEvacDistance = ref(null)
const nearestEvacRouteInfo = ref(null)
const activeRouteCoordinates = ref([])
const safetyScore = ref(100)
const nearbyIncidentCount = ref(0)
const routeReason = ref('')
const stuckAlert = ref(false)
const lastAutopilotReason = ref('')
let evacRouteAbortController = null
let autopilotIntervalId = null
let lastAutopilotRunAt = 0
let lastMovementSnapshot = null
let lastStuckSignalAt = 0

// ── Safety Meter computed properties ──
const safetyMeterColor = computed(() => {
  const s = safetyScore.value
  if (s >= 70) return '#556B2F'   // Dark Olive green — safe
  if (s >= 40) return '#D14D3E'   // Rosy Copper amber — caution
  return '#902715'                // Brandy Red — danger
})

const safetyMeterLabel = computed(() => {
  const s = safetyScore.value
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Good'
  if (s >= 40) return 'Caution'
  if (s >= 20) return 'Warning'
  return 'Danger'
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleViewportResize)
  window.addEventListener('orientationchange', handleViewportResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  autopilotIntervalId = setInterval(() => {
    runAutopilotCycle(false)
  }, 15000)

  await nextTick()
  await loadEvacRoutes()
  initMapboxMap()

  initGPS().then(() => {
    syncUserLocation()
    startLiveTracking()
  }).catch(err => {
    console.warn('Non-fatal GPS acquisition delay:', err)
  })
})

onUnmounted(() => {
  clearEvacRouteLine()
  clearEvacMarkers()
  clearIncidentMarkers()
  if (evacRouteAbortController) evacRouteAbortController.abort()
  if (autopilotIntervalId) clearInterval(autopilotIntervalId)
  stopLiveTracking()
  if (map && typeof map.remove === 'function') map.remove()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleViewportResize)
  window.removeEventListener('orientationchange', handleViewportResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.body.classList.remove('overflow-hidden')
})

function initMapboxMap() {
  if (!mapContainerEl.value) return

  if (!mapboxToken) {
    mapError.value = 'Set VITE_MAPBOX_ACCESS_TOKEN in your environment to load this map.'
    return
  }

  if (typeof mapboxgl.setTelemetryEnabled === 'function') {
    mapboxgl.setTelemetryEnabled(false)
  }

  mapboxgl.accessToken = mapboxToken

  try {
    map = new mapboxgl.Map({
      container: mapContainerEl.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: SANTA_ROSA_CENTER,
      zoom: 15,
      minZoom: 12,
      maxZoom: 16
    })

    let styleFailedOver = false

    map.on('error', (e) => {
      console.warn('Mapbox GL runtime notice:', e)
      if (!styleFailedOver && e?.error?.message?.includes('style')) {
        styleFailedOver = true
        console.warn('Mapbox GL: Vector style unreachable, applying Mapbox GL raster failover style.')
        map.setStyle(osmRasterStyle)
      }
    })

    map.on('load', async () => {
      addBoundaryLayer()
      renderEvacMarkers()
      await renderEvacRouteLine()
      await runAutopilotCycle(true)
      renderRoutes()
      handleViewportResize()
      mapError.value = ''
    })

    requestAnimationFrame(() => { if (map) map.resize() })
    setTimeout(() => { if (map) map.resize() }, 50)
    setTimeout(() => { if (map) map.resize() }, 200)
    setTimeout(() => { if (map) map.resize() }, 500)
  } catch (err) {
    console.error('Mapbox GL initialization error:', err)
    mapError.value = 'Failed to initialize Mapbox GL: ' + (err.message || String(err))
  }
}

function handleViewportResize() {
  nextTick(() => {
    if (map) {
      map.resize()
      setTimeout(() => { if (map) map.resize() }, 50)
      setTimeout(() => { if (map) map.resize() }, 150)
      setTimeout(() => { if (map) map.resize() }, 300)
      setTimeout(() => { if (map) map.resize() }, 500)
    }
  })
}

async function loadEvacRoutes() {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const { data, error } = await supabase.from('evac_routes').select('*')
      if (!error && data && data.length > 0) {
        routesData.value = data
        return
      }
    }
  } catch (err) {
    console.warn('Using offline evacuation routes fallback:', err.message)
  }
  routesData.value = fallbackRoutes
}

function renderRoutes() {
  if (!map || !map.isStyleLoaded()) return

  clearRouteLayers()
  const activeLevel = flow.mappedRiskLevel
  const filtered = routesData.value.filter(r => r.risk_level === activeLevel)

  filtered.forEach(route => {
    const sourceId = `route-source-${route.id || route.name || route.barangay || routeLayerIds.length}`
    const layerId = `route-layer-${route.id || route.name || route.barangay || routeLayerIds.length}`
    const color = getRiskColor(route.risk_level)
    const featureCollection = normalizeRouteGeojson(route.geojson, route)

    map.addSource(sourceId, {
      type: 'geojson',
      data: featureCollection
    })

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': color,
        'line-width': 5,
        'line-opacity': 0.9
      }
    })

    map.on('click', layerId, event => {
      const centerName = route.geojson?.properties?.center || t('evacMap.designatedEvacHub')
      const popupHtml = `
        <div class="p-1 text-slate-900">
          <h4 class="font-bold text-xs text-blue-900">${route.name}</h4>
          <p class="text-[11px] text-slate-700">${t('evacMap.barangay')} <strong>${route.barangay}</strong></p>
          <p class="text-[11px] text-slate-700">${t('evacMap.evacHub')} <strong>${centerName}</strong></p>
          <span class="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded text-white ${getBadgeBg(route.risk_level)}">
            ${t('evacMap.riskRoute', { risk: t('evacMap.' + route.risk_level) })}
          </span>
        </div>
      `

      new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(event.lngLat)
        .setHTML(popupHtml)
        .addTo(map)
    })

    routeSourceIds.push(sourceId)
    routeLayerIds.push(layerId)
  })
}

function addBoundaryLayer() {
  if (!map || !map.isStyleLoaded() || map.getSource('santa-rosa-boundary')) return

  map.addSource('santa-rosa-boundary', {
    type: 'geojson',
    data: santaRosaBoundaries
  })

  map.addLayer({
    id: 'santa-rosa-boundary-fill',
    type: 'fill',
    source: 'santa-rosa-boundary',
    paint: {
      'fill-color': '#94a3b8',
      'fill-opacity': 0.16
    }
  })

  map.addLayer({
    id: 'santa-rosa-boundary-line',
    type: 'line',
    source: 'santa-rosa-boundary',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 2,
      'line-dasharray': [4, 4]
    }
  })
}

function renderEvacMarkers() {
  if (!map) return

  clearEvacMarkers()

  EVAC_CENTERS.forEach(center => {
    const popupHtml = `
      <div class="p-1 text-slate-900 min-w-[180px]">
        <h4 class="font-bold text-xs text-blue-900">${center.name}</h4>
        <p class="text-[11px] text-slate-700 mt-0.5">${center.description || ''}</p>
        <div class="mt-2 space-y-1 text-[11px] text-slate-700">
          <p><strong>Floor area (in sqm):</strong> ${center.floorArea} </p>
          <p><strong>Family size:</strong> ${center.FamilySize}</p>
          <p><strong>Individual size:</strong> ${center.indivSize}</p>
          <p><strong>CRs:</strong> F ${center.femaleCR} / M ${center.maleCR} / C ${center.commonCR}</p>
        </div>
      </div>
    `

    const marker = new mapboxgl.Marker({ color: '#902715' })
      .setLngLat([center.coords.longitude, center.coords.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml))
      .addTo(map)

    evacMarkers.push(marker)
  })
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

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371
  const toRadians = degrees => (degrees * Math.PI) / 180
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

function getDistancePointToSegmentKm(point, start, end) {
  const referenceLatRad = (point[1] * Math.PI) / 180
  const kmPerLng = 111.32 * Math.cos(referenceLatRad)
  const kmPerLat = 110.574

  const px = point[0] * kmPerLng
  const py = point[1] * kmPerLat
  const sx = start[0] * kmPerLng
  const sy = start[1] * kmPerLat
  const ex = end[0] * kmPerLng
  const ey = end[1] * kmPerLat

  const dx = ex - sx
  const dy = ey - sy
  const lengthSquared = (dx * dx) + (dy * dy)

  if (lengthSquared === 0) {
    return Math.hypot(px - sx, py - sy)
  }

  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / lengthSquared))
  const projectionX = sx + (t * dx)
  const projectionY = sy + (t * dy)
  return Math.hypot(px - projectionX, py - projectionY)
}

function getDistanceToRouteKm(latitude, longitude, routeCoordinates) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
    return Infinity
  }

  const point = [longitude, latitude]
  let minimumDistanceKm = Infinity

  for (let i = 0; i < routeCoordinates.length - 1; i += 1) {
    const start = routeCoordinates[i]
    const end = routeCoordinates[i + 1]
    const segmentDistanceKm = getDistancePointToSegmentKm(point, start, end)
    if (segmentDistanceKm < minimumDistanceKm) {
      minimumDistanceKm = segmentDistanceKm
    }
  }

  return minimumDistanceKm
}

function formatDistanceToKm(distanceKm) {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) return '0.0'
  return distanceKm < 1 ? distanceKm.toFixed(2) : distanceKm.toFixed(1)
}

function formatDurationToMinutes(durationMinutes) {
  if (typeof durationMinutes !== 'number' || Number.isNaN(durationMinutes)) return '0'
  return Math.max(1, Math.round(durationMinutes)).toString()
}

async function renderEvacRouteLine() {
  if (!userLocation.value || !nearestEvacCenter.value) return

  clearEvacRouteLine()
  addUserLocationPoint()

  if (evacRouteAbortController) evacRouteAbortController.abort()
  evacRouteAbortController = new AbortController()

  const origin = `${userLocation.value.longitude},${userLocation.value.latitude}`
  const destination = `${nearestEvacCenter.value.coords.longitude},${nearestEvacCenter.value.coords.latitude}`
  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin};${destination}?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(mapboxToken)}`

  try {
    const response = await fetch(directionsUrl, { signal: evacRouteAbortController.signal })
    if (!response.ok) throw new Error(`Directions request failed (${response.status})`)

    const payload = await response.json()
    const route = payload?.routes?.[0]
    if (!route?.geometry?.coordinates?.length) throw new Error('No route returned by Mapbox Directions')

    nearestEvacRouteInfo.value = {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60
    }

    if (lastAutopilotReason.value === 'reports') {
      routeReason.value = `Route updated: nearby community incidents increased in ${userLocation.value.barangay || 'your area'}.`
    } else if (lastAutopilotReason.value === 'weather') {
      routeReason.value = `Route updated for ${flow.mappedRiskLevel} weather risk.`
    }

    addRouteLine({
      type: 'Feature',
      properties: {
        name: nearestEvacCenter.value.name,
        kind: 'nearest-evac-route'
      },
      geometry: route.geometry
    })
  } catch (err) {
    if (err?.name === 'AbortError') return

    console.warn('Using fallback evacuation route line:', err)
    nearestEvacRouteInfo.value = null
    routeReason.value = 'Road route unavailable; using direct fallback path.'
    addRouteLine({
      type: 'Feature',
      properties: {
        name: nearestEvacCenter.value.name,
        kind: 'nearest-evac-route-fallback'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [userLocation.value.longitude, userLocation.value.latitude],
          [nearestEvacCenter.value.coords.longitude, nearestEvacCenter.value.coords.latitude]
        ]
      }
    }, true)
  }
}

function getWeatherPenalty() {
  if (flow.mappedRiskLevel === 'high') return 38
  if (flow.mappedRiskLevel === 'moderate') return 20
  return 8
}

function normalizeBarangayName(name) {
  return String(name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9\s]/g, '').trim()
}

function resolveIncidentCoordinates(report) {
  const directLat = typeof report.latitude === 'number' ? report.latitude : null
  const directLng = typeof report.longitude === 'number' ? report.longitude : null
  if (directLat !== null && directLng !== null) {
    return { latitude: directLat, longitude: directLng }
  }

  const matchByBarangay = BARANGAY_COORDS[report.barangay]
  if (matchByBarangay) {
    return { latitude: matchByBarangay.lat, longitude: matchByBarangay.lng }
  }

  const normalizedTarget = normalizeBarangayName(report.barangay)
  if (!normalizedTarget) return null

  for (const [name, coords] of Object.entries(BARANGAY_COORDS)) {
    const normalizedName = normalizeBarangayName(name)
    if (normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName)) {
      return { latitude: coords.lat, longitude: coords.lng }
    }
  }

  return null
}

function getIncidentMarkerColor(priority) {
  if (priority === 'critical') return '#b91c1c'
  if (priority === 'high') return '#dc2626'
  if (priority === 'medium') return '#f97316'
  if (priority === 'low') return '#eab308'
  return '#f97316'
}

function clearIncidentMarkers() {
  while (incidentMarkers.length) {
    const marker = incidentMarkers.pop()
    marker.remove()
  }
}

function renderIncidentMarkers(reports) {
  clearIncidentMarkers()

  reports.forEach(report => {
    const coords = resolveIncidentCoordinates(report)
    if (!coords) return

    const popupHtml = `
      <div class="p-1 text-slate-900 min-w-[200px]">
        <h4 class="font-bold text-xs text-[#902715]">Unresolved Incident</h4>
        <p class="text-[11px] text-slate-700 mt-0.5"><strong>Barangay:</strong> ${report.barangay || 'Unknown'}</p>
        <p class="text-[11px] text-slate-700"><strong>Priority:</strong> ${report.ai_priority || 'unknown'}</p>
        <p class="text-[11px] text-slate-700"><strong>Status:</strong> ${report.status || 'open'}</p>
        <p class="text-[11px] text-slate-700 mt-1">${report.raw_description || 'No description provided.'}</p>
      </div>
    `

    if (map && map.isStyleLoaded()) {
      const marker = new mapboxgl.Marker({ color: getIncidentMarkerColor(report.ai_priority) })
        .setLngLat([coords.longitude, coords.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 14 }).setHTML(popupHtml))
        .addTo(map)

      incidentMarkers.push(marker)
    }
  })
}

async function getNearbyIncidentSummary() {
  if (!userLocation.value) {
    nearbyIncidentCount.value = 0
    clearIncidentMarkers()
    return { count: 0, criticalLike: 0 }
  }

  try {
    const { data, error } = await supabase
      .from('community_reports')
      .select('id, ai_priority, status, barangay, created_at, raw_description')
      .in('status', ['open', 'in_review'])
      .order('created_at', { ascending: false })
      .limit(120)

    if (error) throw error

    const reports = (data || []).map(report => {
      const coords = resolveIncidentCoordinates(report)
      if (!coords) return null

      const distanceKm = getDistanceKm(
        userLocation.value.latitude,
        userLocation.value.longitude,
        coords.latitude,
        coords.longitude
      )

      return {
        ...report,
        latitude: coords.latitude,
        longitude: coords.longitude,
        distanceKm,
        distanceToRouteKm: getDistanceToRouteKm(
          coords.latitude,
          coords.longitude,
          activeRouteCoordinates.value
        )
      }
    }).filter(Boolean)

    const routeBasedFilteringReady = activeRouteCoordinates.value.length >= 2
    const nearbyReports = reports.filter(report => {
      if (routeBasedFilteringReady) {
        return report.distanceToRouteKm <= routeIncidentCorridorKm
      }
      return report.distanceKm <= 3.5
    })
    nearbyIncidentCount.value = nearbyReports.length
    renderIncidentMarkers(nearbyReports)

    const criticalLike = nearbyReports.filter(r => r.ai_priority === 'high' || r.ai_priority === 'critical').length
    return { count: nearbyReports.length, criticalLike }
  } catch (err) {
    console.warn('Autopilot incident scan fallback:', err)
    nearbyIncidentCount.value = 0
    clearIncidentMarkers()
    return { count: 0, criticalLike: 0 }
  }
}

function updateMovementSnapshot() {
  if (!userLocation.value) return

  if (!lastMovementSnapshot) {
    lastMovementSnapshot = {
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      timestamp: Date.now()
    }
    return
  }

  const movedKm = getDistanceKm(
    lastMovementSnapshot.latitude,
    lastMovementSnapshot.longitude,
    userLocation.value.latitude,
    userLocation.value.longitude
  )

  const elapsedMs = Date.now() - lastMovementSnapshot.timestamp
  const highRisk = flow.mappedRiskLevel === 'high'

  if (highRisk && elapsedMs >= 120000 && movedKm < 0.03) {
    stuckAlert.value = true
    sendStuckSignal()
  } else if (movedKm >= 0.03) {
    stuckAlert.value = false
    lastMovementSnapshot = {
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      timestamp: Date.now()
    }
  }
}

async function sendStuckSignal() {
  if (!userLocation.value) return

  const now = Date.now()
  if (now - lastStuckSignalAt < 10 * 60 * 1000) return

  lastStuckSignalAt = now
  const userHash = localStorage.getItem('agap_user_hash') || `usr_${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem('agap_user_hash', userHash)

  try {
    await supabase.from('sos_reports').insert([{
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      barangay: userLocation.value.barangay || 'Unknown',
      user_hash: userHash,
      mode: 'autopilot_stuck'
    }])
  } catch (err) {
    console.warn('Autopilot stuck signal failed:', err)
  }
}

async function runAutopilotCycle(forceReroute) {
  if (!userLocation.value || !nearestEvacCenter.value) return

  const now = Date.now()
  if (!forceReroute && now - lastAutopilotRunAt < 8000) return
  lastAutopilotRunAt = now

  const weatherPenalty = getWeatherPenalty()
  const reportSummary = await getNearbyIncidentSummary()
  const incidentPenalty = Math.min(42, (reportSummary.count * 4) + (reportSummary.criticalLike * 8))
  const routePenalty = nearestEvacRouteInfo.value ? 0 : 10

  safetyScore.value = Math.max(0, 100 - weatherPenalty - incidentPenalty - routePenalty)

  if (reportSummary.criticalLike >= 2) {
    lastAutopilotReason.value = 'reports'
  } else if (flow.mappedRiskLevel === 'high') {
    lastAutopilotReason.value = 'weather'
  } else {
    lastAutopilotReason.value = ''
  }

  if (forceReroute || lastAutopilotReason.value) {
    await renderEvacRouteLine()
  }

  updateMovementSnapshot()
}

function addRouteLine(feature, useFallback = false) {
  activeRouteCoordinates.value = feature?.geometry?.type === 'LineString'
    ? (feature.geometry.coordinates || [])
    : []

  if (map && map.isStyleLoaded()) {
    if (map.getLayer(evacRouteLayerId)) map.removeLayer(evacRouteLayerId)
    if (map.getLayer(evacRouteFallbackLayerId)) map.removeLayer(evacRouteFallbackLayerId)
    if (map.getSource(evacRouteSourceId)) map.removeSource(evacRouteSourceId)

    map.addSource(evacRouteSourceId, {
      type: 'geojson',
      data: feature
    })

    map.addLayer({
      id: useFallback ? evacRouteFallbackLayerId : evacRouteLayerId,
      type: 'line',
      source: evacRouteSourceId,
      paint: {
        'line-color': '#902715',
        'line-width': useFallback ? 3 : 5,
        'line-opacity': 0.95,
        ...(useFallback ? { 'line-dasharray': [2, 2] } : {})
      }
    })
  }
}

function addUserLocationPoint() {
  if (!userLocation.value) return

  if (map && map.isStyleLoaded()) {
    if (map.getLayer('user-location-point')) map.removeLayer('user-location-point')
    if (map.getSource('user-location-point')) map.removeSource('user-location-point')

    map.addSource('user-location-point', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { name: 'Current Location' },
        geometry: {
          type: 'Point',
          coordinates: [userLocation.value.longitude, userLocation.value.latitude]
        }
      }
    })

    map.addLayer({
      id: 'user-location-point',
      type: 'circle',
      source: 'user-location-point',
      paint: {
        'circle-color': '#1d4ed8',
        'circle-radius': 7,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    })
  }
}

function clearEvacRouteLine() {
  activeRouteCoordinates.value = []

  if (map && map.isStyleLoaded()) {
    if (map.getLayer('user-location-point')) map.removeLayer('user-location-point')
    if (map.getSource('user-location-point')) map.removeSource('user-location-point')

    if (map.getLayer(evacRouteLayerId)) map.removeLayer(evacRouteLayerId)
    if (map.getLayer(evacRouteFallbackLayerId)) map.removeLayer(evacRouteFallbackLayerId)
    if (map.getSource(evacRouteSourceId)) map.removeSource(evacRouteSourceId)
  }
}

async function refreshLocationAndSafety() {
  await refreshLocation(true)
  await runAutopilotCycle(true)
}

async function refreshCurrentLocation() {
  await refreshLocation(true)
}

function focusNearestEvacCenter() {
  if (!userLocation.value || !nearestEvacCenter.value) return

  if (map && map.isStyleLoaded()) {
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([userLocation.value.longitude, userLocation.value.latitude])
    bounds.extend([nearestEvacCenter.value.coords.longitude, nearestEvacCenter.value.coords.latitude])
    map.fitBounds(bounds, {
      padding: 80,
      duration: 800,
      maxZoom: 15
    })
  }
}

function clearEvacMarkers() {
  while (evacMarkers.length) {
    const marker = evacMarkers.pop()
    marker.remove()
  }
}

function clearRouteLayers() {
  if (map && map.isStyleLoaded()) {
    while (routeLayerIds.length) {
      const layerId = routeLayerIds.pop()
      if (map.getLayer(layerId)) map.removeLayer(layerId)
    }

    while (routeSourceIds.length) {
      const sourceId = routeSourceIds.pop()
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  }
}

function normalizeRouteGeojson(geojson, route) {
  if (!geojson) {
    return {
      type: 'FeatureCollection',
      features: []
    }
  }

  if (geojson.type === 'FeatureCollection') {
    return geojson
  }

  if (geojson.type === 'Feature') {
    return geojson
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: route.name,
          barangay: route.barangay,
          center: route.geojson?.properties?.center
        },
        geometry: geojson
      }
    ]
  }
}

function getRiskColor(level) {
  switch (level) {
    case 'low': return '#22c55e'
    case 'moderate': return '#f97316'
    case 'high': return '#ef4444'
    default: return '#3b82f6'
  }
}

function getBadgeBg(level) {
  switch (level) {
    case 'low': return 'bg-emerald-600'
    case 'moderate': return 'bg-amber-600'
    case 'high': return 'bg-red-600'
    default: return 'bg-blue-600'
  }
}

function recenterMap() {
  if (!map) return
  const loc = userLocation.value || cachedLocation.value
  if (loc && typeof loc.longitude === 'number' && typeof loc.latitude === 'number') {
    map.easeTo({
      center: [loc.longitude, loc.latitude],
      zoom: 15,
      duration: 700
    })
  } else {
    map.easeTo({ center: SANTA_ROSA_CENTER, zoom: 13, duration: 700 })
  }
}

async function toggleExpand() {
  const wrapper = mapWrapperEl.value

  if (document.fullscreenElement) {
    await document.exitFullscreen()
    return
  }

  if (wrapper && typeof wrapper.requestFullscreen === 'function') {
    try {
      await wrapper.requestFullscreen()
      document.body.classList.add('overflow-hidden')
      return
    } catch (err) {
      console.warn('Fullscreen request failed, using overlay fallback:', err)
    }
  }

  isExpanded.value = !isExpanded.value
  document.body.classList.toggle('overflow-hidden', isExpanded.value)
  await nextTick()
  handleViewportResize()
}

function handleKeydown(event) {
  if (event.key !== 'Escape' || !isExpanded.value) return

  isExpanded.value = false
  document.body.classList.remove('overflow-hidden')
  nextTick(() => {
    handleViewportResize()
  })
}

function handleFullscreenChange() {
  const wrapper = mapWrapperEl.value
  isExpanded.value = document.fullscreenElement === wrapper
  document.body.classList.toggle('overflow-hidden', isExpanded.value)
  nextTick(() => {
    handleViewportResize()
  })
}

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

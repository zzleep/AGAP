<template>
  <div class="space-y-3 h-full flex flex-col">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-white">{{ $t('evacMap.title') }}</h2>
        <p class="text-xs text-slate-400">{{ $t('evacMap.description') }}</p>
      </div>
      <span class="px-2 py-1 text-[11px] font-bold rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
        {{ $t('evacMap.cityLabel') }}
      </span>
    </div>

    <!-- Map Canvas Container -->
    <div
      ref="mapWrapperEl"
      class="relative flex-1 min-h-[360px] rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center transition-all duration-200"
      :class="isExpanded ? 'fixed inset-0 z-[9999] m-0 rounded-none border-0 min-h-0' : ''"
    >
      <div ref="mapContainerEl" class="w-full h-full min-h-[360px] z-10"></div>

      <div v-if="mapError" class="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/90 text-center">
        <div class="max-w-sm space-y-2">
          <p class="text-sm font-semibold text-white">Map unavailable</p>
          <p class="text-xs text-slate-300">{{ mapError }}</p>
        </div>
      </div>

      <div class="absolute top-3 right-3 z-30">
        <button
          @click="toggleExpand"
          class="px-3 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-600 shadow"
        >
          {{ isExpanded ? 'Exit Fullscreen' : 'Expand Map' }}
        </button>
      </div>

      <div class="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 text-xs flex justify-between items-center z-20">
        <div>
          <span class="text-slate-400 block text-[10px]">{{ $t('evacMap.activeRiskFilter') }}</span>
          <span
            class="font-bold uppercase"
            :class="{
              'text-emerald-400': flow.mappedRiskLevel === 'low',
              'text-amber-400': flow.mappedRiskLevel === 'moderate',
              'text-red-400': flow.mappedRiskLevel === 'high'
            }"
          >
            {{ $t('evacMap.riskRoutes', { risk: $t('evacMap.' + flow.mappedRiskLevel) }) }}
          </span>
        </div>
        <button
          @click="recenterMap"
          class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow"
        >
          {{ $t('evacMap.recenter') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useFlowStore } from '@/stores/flowStore'
import { supabase } from '@/lib/supabase'
import santaRosaBoundaries from '@/data/santa_rosa_boundaries.json'
import fallbackRoutes from '@/data/evac_routes.json'

const { t } = useI18n()
const flow = useFlowStore()
let map = null
const SANTA_ROSA_CENTER = [121.1114, 14.3123]
const routesData = ref([])
const isExpanded = ref(false)
const mapWrapperEl = ref(null)
const mapContainerEl = ref(null)
const mapError = ref('')
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || ''
const routeSourceIds = []
const routeLayerIds = []

onMounted(async () => {
  initMapboxMap()
  await loadEvacRoutes()
  renderRoutes()
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  if (map) map.remove()
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.body.classList.remove('overflow-hidden')
})

function initMapboxMap() {
  if (!mapboxToken) {
    mapError.value = 'Set VITE_MAPBOX_ACCESS_TOKEN in your environment to load this map.'
    return
  }

  if (typeof mapboxgl.setTelemetryEnabled === 'function') {
    mapboxgl.setTelemetryEnabled(false)
  }

  mapboxgl.accessToken = mapboxToken

  map = new mapboxgl.Map({
    container: mapContainerEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: SANTA_ROSA_CENTER,
    zoom: 13,
    minZoom: 12,
    maxZoom: 16
  })

  map.on('load', () => {
    addBoundaryLayer()
    renderRoutes()
    mapError.value = ''
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
  if (!map) return

  clearRouteLayers()
  if (!map.isStyleLoaded()) return

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
  if (!map || map.getSource('santa-rosa-boundary')) return

  map.addSource('santa-rosa-boundary', {
    type: 'geojson',
    data: santaRosaBoundaries
  })

  map.addLayer({
    id: 'santa-rosa-boundary-fill',
    type: 'fill',
    source: 'santa-rosa-boundary',
    paint: {
      'fill-color': '#1e293b',
      'fill-opacity': 0.25
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

function clearRouteLayers() {
  if (!map) return

  while (routeLayerIds.length) {
    const layerId = routeLayerIds.pop()
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }

  while (routeSourceIds.length) {
    const sourceId = routeSourceIds.pop()
    if (map.getSource(sourceId)) map.removeSource(sourceId)
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
  if (map) {
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
  if (map) map.resize()
}

function handleKeydown(event) {
  if (event.key !== 'Escape' || !isExpanded.value) return

  isExpanded.value = false
  document.body.classList.remove('overflow-hidden')
  nextTick(() => {
    if (map) {
      map.resize()
    }
  })
}

function handleFullscreenChange() {
  const wrapper = mapWrapperEl.value
  isExpanded.value = document.fullscreenElement === wrapper
  document.body.classList.toggle('overflow-hidden', isExpanded.value)
  nextTick(() => {
    if (map) map.resize()
  })
}

watch(() => flow.mappedRiskLevel, () => {
  renderRoutes()
})

watch(routesData, () => {
  renderRoutes()
})
</script>

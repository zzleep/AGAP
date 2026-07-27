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
    <div class="relative flex-1 min-h-[360px] rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
      <div id="citizen-map-container" class="w-full h-full min-h-[360px] z-10"></div>

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
import { onMounted, watch, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useFlowStore } from '@/stores/flowStore'
import { supabase } from '@/lib/supabase'
import santaRosaBoundaries from '@/data/santa_rosa_boundaries.json'
import fallbackRoutes from '@/data/evac_routes.json'

const { t } = useI18n()
const flow = useFlowStore()
let map = null
let routeLayerGroup = null
const SANTA_ROSA_CENTER = [14.3123, 121.1114]
const routesData = ref([])

onMounted(async () => {
  initLeafletMap()
  await loadEvacRoutes()
  renderRoutes()
})

onUnmounted(() => {
  if (map) map.remove()
})

function initLeafletMap() {
  map = L.map('citizen-map-container', {
    center: SANTA_ROSA_CENTER,
    zoom: 13,
    minZoom: 12,
    maxZoom: 16
  })

  // OpenStreetMap Tile Layer (cached by Workbox PWA service worker)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  // Santa Rosa Boundary GeoJSON Layer
  L.geoJSON(santaRosaBoundaries, {
    style: {
      color: '#3b82f6',
      weight: 2,
      fillColor: '#1e293b',
      fillOpacity: 0.25,
      dashArray: '4, 4'
    }
  }).addTo(map)

  routeLayerGroup = L.layerGroup().addTo(map)
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
  if (!routeLayerGroup) return
  routeLayerGroup.clearLayers()

  const activeLevel = flow.mappedRiskLevel
  const filtered = routesData.value.filter(r => r.risk_level === activeLevel)

  filtered.forEach(route => {
    const color = getRiskColor(route.risk_level)
    const layer = L.geoJSON(route.geojson, {
      style: { color, weight: 5, opacity: 0.85 }
    })

    const centerName = route.geojson?.properties?.center || t('evacMap.designatedEvacHub')
    layer.bindPopup(`
      <div class="p-1 text-slate-900">
        <h4 class="font-bold text-xs text-blue-900">${route.name}</h4>
        <p class="text-[11px] text-slate-700">${t('evacMap.barangay')} <strong>${route.barangay}</strong></p>
        <p class="text-[11px] text-slate-700">${t('evacMap.evacHub')} <strong>${centerName}</strong></p>
        <span class="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded text-white ${getBadgeBg(route.risk_level)}">
          ${t('evacMap.riskRoute', { risk: t('evacMap.' + route.risk_level) })}
        </span>
      </div>
    `)

    routeLayerGroup.addLayer(layer)
  })
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
    map.setView(SANTA_ROSA_CENTER, 13)
  }
}

watch(() => flow.mappedRiskLevel, () => {
  renderRoutes()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">Flow Engine — Predictive Routing</h2>
        <p class="text-xs text-slate-400">Rainfall-threshold flood proxy with evacuation route overlays</p>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="refreshWeather"
          :disabled="isRefreshing"
          class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md"
        >
          {{ isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh Weather Data' }}
        </button>
      </div>
    </div>

    <!-- Status Panel -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Rainfall Rate</span>
        <p class="text-xl font-black text-white mt-1">{{ flowStore.rainfallRate.toFixed(1) }} <span class="text-xs text-slate-400">mm/hr</span></p>
      </div>
      <div class="p-3 rounded-xl border"
        :class="severityCardClass"
      >
        <span class="text-[10px] uppercase font-bold" :class="severityTextClass">Zone Severity</span>
        <p class="text-xl font-black mt-1 capitalize" :class="severityValueClass">{{ flowStore.zoneSeverity }}</p>
      </div>
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Active Route Risk</span>
        <p class="text-xl font-black text-white mt-1 capitalize">{{ flowStore.mappedRiskLevel }}</p>
      </div>
      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span class="text-[10px] uppercase font-bold text-slate-400">Last Updated</span>
        <p class="text-xl font-black text-white mt-1">{{ secondsAgo }}s <span class="text-xs text-slate-400">ago</span></p>
      </div>
    </div>

    <!-- Threshold Reference -->
    <div class="flex items-center space-x-3 text-[10px] text-slate-400">
      <span class="flex items-center space-x-1">
        <span class="w-3 h-3 rounded bg-yellow-500"></span>
        <span>Watch (&lt;7.5 mm/hr)</span>
      </span>
      <span class="flex items-center space-x-1">
        <span class="w-3 h-3 rounded bg-orange-500"></span>
        <span>Warning (7.5–15 mm/hr)</span>
      </span>
      <span class="flex items-center space-x-1">
        <span class="w-3 h-3 rounded bg-red-500"></span>
        <span>Danger (&gt;15 mm/hr)</span>
      </span>
    </div>

    <!-- Leaflet Map -->
    <div class="rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      <div ref="mapContainer" class="h-[500px] w-full bg-slate-950"></div>
    </div>

    <!-- Demo Controls -->
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Demo: Adjust Rainfall Rate</h3>
      <div class="flex items-center space-x-4">
        <input
          type="range"
          :value="flowStore.rainfallRate"
          @input="onSliderChange"
          min="0"
          max="30"
          step="0.5"
          class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span class="text-sm font-mono text-white w-20 text-right">{{ flowStore.rainfallRate.toFixed(1) }} mm/hr</span>
      </div>
      <div class="flex space-x-2">
        <button @click="setRainfall(3)" class="px-3 py-1 rounded bg-yellow-900/60 text-yellow-300 text-xs font-bold border border-yellow-800/40 hover:bg-yellow-800/60">Watch (3 mm/hr)</button>
        <button @click="setRainfall(10)" class="px-3 py-1 rounded bg-orange-900/60 text-orange-300 text-xs font-bold border border-orange-800/40 hover:bg-orange-800/60">Warning (10 mm/hr)</button>
        <button @click="setRainfall(20)" class="px-3 py-1 rounded bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/40 hover:bg-red-800/60">Danger (20 mm/hr)</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFlowStore } from '@/stores/flowStore'
import { useWeatherStore } from '@/stores/weatherStore'
import { supabase } from '@/lib/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import floodZonesData from '@/data/flood_zones.json'
import evacRoutesData from '@/data/evac_routes.json'

const flowStore = useFlowStore()
const weatherStore = useWeatherStore()

const mapContainer = ref(null)
const isRefreshing = ref(false)
const secondsAgo = ref(0)
const floodZones = ref([])
const evacRoutes = ref([])

let map = null
let floodZoneLayer = null
let evacRouteLayer = null
let tickerInterval = null

// Severity card styling
const severityCardClass = computed(() => {
  switch (flowStore.zoneSeverity) {
    case 'danger': return 'bg-red-950/60 border-red-700'
    case 'warning': return 'bg-orange-950/60 border-orange-700'
    default: return 'bg-yellow-950/60 border-yellow-700'
  }
})
const severityTextClass = computed(() => {
  switch (flowStore.zoneSeverity) {
    case 'danger': return 'text-red-400'
    case 'warning': return 'text-orange-400'
    default: return 'text-yellow-400'
  }
})
const severityValueClass = computed(() => {
  switch (flowStore.zoneSeverity) {
    case 'danger': return 'text-red-400'
    case 'warning': return 'text-orange-400'
    default: return 'text-yellow-400'
  }
})

const severityColors = {
  danger: '#EF4444',
  warning: '#F97316',
  watch: '#EAB308'
}

const riskColors = {
  low: '#22C55E',
  moderate: '#EAB308',
  high: '#EF4444'
}

onMounted(async () => {
  initMap()
  await loadFloodZones()
  await loadEvacRoutes()
  await weatherStore.fetchWeather()
  renderFloodZones()
  renderEvacRoutes()

  // Start ticker
  tickerInterval = setInterval(() => {
    secondsAgo.value = Math.floor((Date.now() - flowStore.lastUpdated) / 1000)
  }, 1000)
})

onUnmounted(() => {
  if (tickerInterval) clearInterval(tickerInterval)
  if (map) map.remove()
})

// Re-render when severity changes
watch(() => flowStore.zoneSeverity, () => {
  renderFloodZones()
  renderEvacRoutes()
})

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: [14.31, 121.11],
    zoom: 13,
    zoomControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map)
}

function renderFloodZones() {
  if (!map) return
  if (floodZoneLayer) map.removeLayer(floodZoneLayer)

  const geojson = {
    type: 'FeatureCollection',
    features: floodZones.value
  }

  floodZoneLayer = L.geoJSON(geojson, {
    style: (feature) => {
      const severity = flowStore.zoneSeverity || feature.properties.severity || 'watch'
      return {
        fillColor: severityColors[severity] || severityColors.watch,
        fillOpacity: 0.3,
        color: severityColors[severity] || severityColors.watch,
        weight: 2,
        dashArray: severity === 'watch' ? '5, 5' : null
      }
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties
      const activeSeverity = flowStore.zoneSeverity || props.severity || 'watch'
      layer.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>${props.name || props.zone_name}</strong><br/>
          <span style="color: ${severityColors[props.severity]}; font-weight: bold; text-transform: uppercase;">
            ${activeSeverity}
          </span>
        </div>
      `)
    }
  }).addTo(map)
}

function renderEvacRoutes() {
  if (!map) return
  if (evacRouteLayer) map.removeLayer(evacRouteLayer)

  const riskLevel = flowStore.mappedRiskLevel

  // Filter routes by current risk level
  const filteredRoutes = evacRoutes.value.filter(f => {
        const routeRisk = f.properties?.risk_level || 'low'
        return routeRisk === riskLevel
      })

  if (filteredRoutes.length === 0) return

  const geojson = {
    type: 'FeatureCollection',
    features: filteredRoutes
  }

  evacRouteLayer = L.geoJSON(geojson, {
    style: (feature) => {
      const risk = feature.properties?.risk_level || 'low'
      return {
        color: riskColors[risk] || riskColors.low,
        weight: 4,
        opacity: 0.8,
        dashArray: risk === 'high' ? '10, 5' : null
      }
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties
      layer.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>${props.name || 'Evacuation Route'}</strong><br/>
          <span>Risk Level: <strong>${props.risk_level || 'low'}</strong></span><br/>
          <span>Barangay: ${props.barangay || 'N/A'}</span>
        </div>
      `)
    }
  }).addTo(map)
}

async function loadFloodZones() {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const { data, error } = await supabase.from('flood_zones').select('*')
      if (!error && data?.length) {
        floodZones.value = data.map(zone => ({
          type: 'Feature',
          properties: { name: zone.zone_name, severity: zone.severity },
          geometry: zone.geojson?.geometry || zone.geojson
        }))
        return
      }
    }
  } catch (err) {
    console.warn('Using bundled flood zone fallback:', err.message)
  }
  floodZones.value = floodZonesData
}

async function loadEvacRoutes() {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const { data, error } = await supabase.from('evac_routes').select('*')
      if (!error && data?.length) {
        evacRoutes.value = data.map(route => ({
          type: 'Feature',
          properties: {
            ...(route.geojson?.properties || {}),
            name: route.name,
            barangay: route.barangay,
            risk_level: route.risk_level
          },
          geometry: route.geojson?.geometry || route.geojson
        }))
        return
      }
    }
  } catch (err) {
    console.warn('Using bundled evacuation route fallback:', err.message)
  }
  evacRoutes.value = evacRoutesData.features || evacRoutesData
}

function onSliderChange(e) {
  const value = parseFloat(e.target.value)
  flowStore.updateThresholds(value)
}

function setRainfall(value) {
  flowStore.updateThresholds(value)
}

async function refreshWeather() {
  isRefreshing.value = true
  try {
    await weatherStore.fetchWeather()
  } finally {
    isRefreshing.value = false
  }
}
</script>

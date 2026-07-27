<template>
  <div class="space-y-4">
    <!-- Header Card -->
    <div class="p-5 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm flex items-center justify-between">
      <div>
        <h2 class="font-expressive font-black text-2xl text-[#0A0A0A] tracking-tight">{{ $t('flowEngine.title') }}</h2>
        <p class="text-xs font-medium text-[#717171]">{{ $t('flowEngine.description') }}</p>
      </div>
      <button
        @click="refreshWeather"
        :disabled="isRefreshing"
        class="px-4 py-2 rounded-full bg-[#902715] hover:bg-[#781f11] text-[#F7FB41] text-xs font-extrabold transition-colors disabled:opacity-50 shadow-m3-sm"
      >
        {{ isRefreshing ? $t('flowEngine.refreshing') : $t('flowEngine.refreshWeather') }}
      </button>
    </div>

    <!-- Status Panel Grid -->
    <div class="grid grid-cols-2 gap-3">
      <div class="p-4 rounded-3xl bg-[#f9ebe8] border border-[#f3d3cd] shadow-m3-sm">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#902715] block">{{ $t('flowEngine.rainfallRate') }}</span>
        <p class="font-expressive text-2xl font-black text-[#902715] mt-1">{{ flowStore.rainfallRate.toFixed(1) }} <span class="text-xs font-bold text-[#717171]">{{ $t('flowEngine.mmhr') }}</span></p>
      </div>

      <div class="p-4 rounded-3xl border shadow-m3-sm" :class="severityCardClass">
        <span class="text-[10px] font-extrabold uppercase tracking-wider block" :class="severityTextClass">{{ $t('flowEngine.zoneSeverity') }}</span>
        <p class="font-expressive text-2xl font-black mt-1 capitalize" :class="severityValueClass">{{ $t('common.' + flowStore.zoneSeverity) }}</p>
      </div>

      <div class="p-4 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#717171] block">{{ $t('flowEngine.activeRouteRisk') }}</span>
        <p class="font-expressive text-2xl font-black text-[#0A0A0A] mt-1 capitalize">{{ $t('common.' + flowStore.mappedRiskLevel) }}</p>
      </div>

      <div class="p-4 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#717171] block">{{ $t('flowEngine.lastUpdated') }}</span>
        <p class="font-expressive text-2xl font-black text-[#0A0A0A] mt-1">{{ secondsAgo }}s <span class="text-xs font-bold text-[#717171]">{{ $t('flowEngine.ago') }}</span></p>
      </div>
    </div>

    <!-- Threshold Reference Chips -->
    <div class="flex items-center space-x-2 text-xs font-bold px-1">
      <span class="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F7FB41]/30 text-[#0A0A0A] border border-[#F7FB41]">
        <span class="w-2.5 h-2.5 rounded-full bg-[#F7FB41]"></span>
        <span>{{ $t('flowEngine.watchThreshold') }}</span>
      </span>
      <span class="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#D14D3E]/15 text-[#D14D3E] border border-[#D14D3E]/30">
        <span class="w-2.5 h-2.5 rounded-full bg-[#D14D3E]"></span>
        <span>{{ $t('flowEngine.warningThreshold') }}</span>
      </span>
      <span class="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#902715]/15 text-[#902715] border border-[#902715]/30">
        <span class="w-2.5 h-2.5 rounded-full bg-[#902715]"></span>
        <span>{{ $t('flowEngine.dangerThreshold') }}</span>
      </span>
    </div>

    <!-- Leaflet Map Container -->
    <div class="rounded-3xl overflow-hidden border border-[#E0E0E0] shadow-m3-md">
      <div ref="mapContainer" class="h-[460px] w-full bg-[#e5e7eb]"></div>
    </div>

    <!-- Demo Simulation Controls -->
    <div class="p-6 rounded-3xl bg-white border border-[#E0E0E0] shadow-m3-sm space-y-4">
      <h3 class="font-expressive font-extrabold text-xs uppercase tracking-wider text-[#902715]">{{ $t('flowEngine.demoTitle') }}</h3>
      <div class="flex items-center space-x-4">
        <input
          type="range"
          :value="flowStore.rainfallRate"
          @input="onSliderChange"
          min="0"
          max="30"
          step="0.5"
          class="flex-1 h-3 bg-[#EBEBEB] rounded-full appearance-none cursor-pointer accent-[#902715]"
        />
        <span class="text-sm font-mono font-bold text-[#0A0A0A] w-20 text-right">{{ flowStore.rainfallRate.toFixed(1) }} mm/hr</span>
      </div>
      <div class="flex space-x-2">
        <button @click="setRainfall(3)" class="px-4 py-2 rounded-full bg-[#F7FB41] text-[#0A0A0A] text-xs font-bold border border-black/10 hover:bg-[#e2e626] transition-colors shadow-m3-sm">{{ $t('flowEngine.watchBtn') }}</button>
        <button @click="setRainfall(10)" class="px-4 py-2 rounded-full bg-[#D14D3E] text-white text-xs font-bold border border-black/10 hover:bg-[#b83b2d] transition-colors shadow-m3-sm">{{ $t('flowEngine.warningBtn') }}</button>
        <button @click="setRainfall(20)" class="px-4 py-2 rounded-full bg-[#902715] text-[#F7FB41] text-xs font-bold border border-black/10 hover:bg-[#781f11] transition-colors shadow-m3-sm">{{ $t('flowEngine.dangerBtn') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFlowStore } from '@/stores/flowStore'
import { useWeatherStore } from '@/stores/weatherStore'
import { supabase } from '@/lib/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import floodZonesData from '@/data/flood_zones.json'
import evacRoutesData from '@/data/evac_routes.json'

const { t } = useI18n()
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

// Severity card styling (Santa Rosa Palette)
const severityCardClass = computed(() => {
  switch (flowStore.zoneSeverity) {
    case 'danger': return 'bg-[#f9ebe8] border-[#f3d3cd]'
    case 'warning': return 'bg-[#f9ecea] border-[#f3d8d4]'
    default: return 'bg-[#fefee8] border-[#fbfd88]'
  }
})
const severityTextClass = computed(() => {
  switch (flowStore.zoneSeverity) {
    case 'danger': return 'text-[#902715]'
    case 'warning': return 'text-[#D14D3E]'
    default: return 'text-[#616400]'
  }
})
const severityValueClass = computed(() => {
  switch (flowStore.zoneSeverity) {
    case 'danger': return 'text-[#902715]'
    case 'warning': return 'text-[#D14D3E]'
    default: return 'text-[#0A0A0A]'
  }
})

const severityColors = {
  danger: '#902715',
  warning: '#D14D3E',
  watch: '#F7FB41'
}

const riskColors = {
  low: '#556B2F',
  moderate: '#D14D3E',
  high: '#902715'
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
            ${t('common.' + activeSeverity)}
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
          <span>${t('flowEngine.riskLevelLabel')} <strong>${t('common.' + (props.risk_level || 'low'))}</strong></span><br/>
          <span>${t('evacMap.barangay')} ${props.barangay || t('flowEngine.notAvailable')}</span>
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

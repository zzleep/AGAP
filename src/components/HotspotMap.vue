<template>
  <div class="space-y-4 flex flex-col h-full">
    <!-- Top Bar Controls -->
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow">
      <div class="flex items-center space-x-3 text-xs font-semibold text-slate-300">
        <span class="text-slate-400">Map Layers:</span>
        <label class="flex items-center space-x-1.5 cursor-pointer">
          <input type="checkbox" v-model="showSOS" class="rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-0" />
          <span class="text-red-400">SOS Alerts</span>
        </label>
        <label class="flex items-center space-x-1.5 cursor-pointer">
          <input type="checkbox" v-model="showReports" class="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0" />
          <span class="text-amber-400">Community Reports</span>
        </label>
        <label class="flex items-center space-x-1.5 cursor-pointer">
          <input type="checkbox" v-model="showBoundary" class="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0" />
          <span class="text-blue-400">City Boundary</span>
        </label>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="recenterMap"
          class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors"
        >
          Recenter City Map
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[480px]">
      <!-- Leaflet Map Canvas -->
      <div class="lg:col-span-3 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 min-h-[480px] shadow-lg">
        <div id="hotspot-density-map" class="w-full h-full min-h-[480px] z-10"></div>

        <!-- Legend Overlay -->
        <div class="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs text-slate-300 z-20 space-y-1.5 shadow-xl">
          <div class="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1">Density Severity</div>
          <div class="flex items-center space-x-2">
            <span class="w-3.5 h-3.5 rounded-full bg-red-500 border border-red-700 shadow-sm"></span>
            <span>High Risk (&gt;4 incidents)</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-700 shadow-sm"></span>
            <span>Moderate Risk (2–4 incidents)</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-700 shadow-sm"></span>
            <span>Low Risk (1 incident)</span>
          </div>
          <div class="border-t border-slate-800 pt-1.5 mt-1.5">
            <div class="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1">Incident Markers</div>
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-red-600 border border-red-800 shadow-sm"></span>
              <span>SOS Alert (exact GPS)</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-amber-500 border border-amber-700 shadow-sm"></span>
              <span>Community Report</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Hotspots Ranking Sidebar -->
      <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col shadow-lg">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Top Barangay Hotspots</h3>
          <span class="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono font-bold">
            LIVE DENSITY
          </span>
        </div>

        <div v-if="hotspotList.length === 0" class="p-6 text-center text-slate-500 text-xs flex-1 flex items-center justify-center">
          No incident density recorded in Santa Rosa barangays.
        </div>

        <div v-else class="space-y-2 overflow-y-auto max-h-[420px] flex-1 pr-1">
          <div
            v-for="(spot, idx) in hotspotList"
            :key="spot.barangay"
            @click="focusBarangay(spot.barangay)"
            class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                  #{{ idx + 1 }}
                </span>
                <span class="font-bold text-xs text-white">{{ spot.barangay }}</span>
              </div>

              <span
                :class="[
                  'px-2 py-0.5 text-[10px] font-extrabold rounded-full border',
                  spot.total >= 5 ? 'bg-red-950 text-red-400 border-red-800' :
                  spot.total >= 2 ? 'bg-amber-950 text-amber-400 border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border-emerald-800'
                ]"
              >
                {{ spot.total }} Incidents
              </span>
            </div>

            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>SOS: <strong class="text-red-400">{{ spot.sosCount }}</strong></span>
              <span>Reports: <strong class="text-amber-400">{{ spot.reportCount }}</strong></span>
              <span class="text-blue-400 hover:underline">Focus Map →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSOSStore } from '@/stores/sosStore'
import { useReportStore } from '@/stores/reportStore'
import santaRosaBoundaries from '@/data/santa_rosa_boundaries.json'
import { BARANGAY_COORDS } from '@/data/barangay_coords'

const sosStore = useSOSStore()
const reportStore = useReportStore()

const showSOS = ref(true)
const showReports = ref(true)
const showBoundary = ref(true)

let map = null
let boundaryLayerGroup = null
let densityMarkerGroup = null
let incidentMarkerGroup = null

const SANTA_ROSA_CENTER = [14.3157, 121.1122]

const barangayDensityMap = computed(() => {
  const mapData = {}

  Object.keys(BARANGAY_COORDS).forEach(bgy => {
    mapData[bgy] = {
      barangay: bgy,
      coords: BARANGAY_COORDS[bgy],
      sosCount: 0,
      reportCount: 0,
      total: 0
    }
  })

  if (showSOS.value) {
    sosStore.activeReports.forEach(sos => {
      if (sos.status === 'resolved') return
      const bgy = sos.barangay || 'Tagapo'
      if (!mapData[bgy]) {
        mapData[bgy] = {
          barangay: bgy,
          coords: BARANGAY_COORDS[bgy] || BARANGAY_COORDS['Tagapo'],
          sosCount: 0,
          reportCount: 0,
          total: 0
        }
      }
      mapData[bgy].sosCount += 1
    })
  }

  if (showReports.value) {
    reportStore.reports.forEach(rep => {
      if (rep.status === 'resolved' || rep.status === 'dismissed') return
      const bgy = rep.barangay || 'Tagapo'
      if (!mapData[bgy]) {
        mapData[bgy] = {
          barangay: bgy,
          coords: BARANGAY_COORDS[bgy] || BARANGAY_COORDS['Tagapo'],
          sosCount: 0,
          reportCount: 0,
          total: 0
        }
      }
      mapData[bgy].reportCount += 1
    })
  }

  Object.keys(mapData).forEach(key => {
    mapData[key].total = mapData[key].sosCount + mapData[key].reportCount
  })

  return mapData
})

const hotspotList = computed(() => {
  return Object.values(barangayDensityMap.value)
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
})

function initMap() {
  const container = document.getElementById('hotspot-density-map')
  if (!container) return

  map = L.map('hotspot-density-map', {
    center: SANTA_ROSA_CENTER,
    zoom: 13,
    zoomControl: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  boundaryLayerGroup = L.layerGroup().addTo(map)
  densityMarkerGroup = L.layerGroup().addTo(map)
  incidentMarkerGroup = L.layerGroup().addTo(map)

  renderBoundary()
  renderDensityMarkers()
  renderIncidentMarkers()

  setTimeout(() => map.invalidateSize(), 100)
}

function renderBoundary() {
  if (!map || !boundaryLayerGroup) return
  boundaryLayerGroup.clearLayers()

  if (showBoundary.value && santaRosaBoundaries) {
    L.geoJSON(santaRosaBoundaries, {
      style: {
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#1e3a8a',
        fillOpacity: 0.15
      }
    }).addTo(boundaryLayerGroup)
  }
}

function renderDensityMarkers() {
  if (!map || !densityMarkerGroup) return
  densityMarkerGroup.clearLayers()

  Object.values(barangayDensityMap.value).forEach(item => {
    if (item.total === 0) return

    const { lat, lng } = item.coords
    const radius = Math.min(45, 14 + item.total * 6)

    let fillColor = '#10b981'
    let strokeColor = '#047857'
    let fillOpacity = 0.4

    if (item.total >= 5 || item.sosCount >= 3) {
      fillColor = '#ef4444'
      strokeColor = '#b91c1c'
      fillOpacity = 0.65
    } else if (item.total >= 2) {
      fillColor = '#f59e0b'
      strokeColor = '#d97706'
      fillOpacity = 0.55
    }

    const circle = L.circleMarker([lat, lng], {
      radius,
      fillColor,
      color: strokeColor,
      weight: 2,
      opacity: 0.9,
      fillOpacity
    })

    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
        <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 14px; color: #1e293b;">${item.barangay}</h4>
        <div style="font-size: 12px; margin-bottom: 4px; font-weight: 700; color: #ef4444;">
          Total Incident Density: ${item.total}
        </div>
        <div style="font-size: 11px; color: #475569;">
          • Active SOS Alerts: <strong>${item.sosCount}</strong><br/>
          • Citizen Reports: <strong>${item.reportCount}</strong>
        </div>
      </div>
    `

    circle.bindPopup(popupContent)
    densityMarkerGroup.addLayer(circle)
  })
}

function renderIncidentMarkers() {
  if (!map || !incidentMarkerGroup) return
  incidentMarkerGroup.clearLayers()

  if (showSOS.value) {
    sosStore.activeReports.forEach(sos => {
      if (sos.status === 'resolved') return
      if (sos.latitude == null || sos.longitude == null) return

      const marker = L.circleMarker([sos.latitude, sos.longitude], {
        radius: 6,
        fillColor: '#ef4444',
        color: '#7f1d1d',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.9
      })

      const popup = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 160px;">
          <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 13px; color: #991b1b;">SOS Alert</h4>
          <div style="font-size: 11px; color: #475569;">
            <strong>Barangay:</strong> ${sos.barangay || 'Unknown'}<br/>
            <strong>Coordinates:</strong> ${Number(sos.latitude).toFixed(5)}, ${Number(sos.longitude).toFixed(5)}<br/>
            <strong>Mode:</strong> ${sos.mode || 'online'}<br/>
            <strong>Status:</strong> ${sos.status}<br/>
            <strong>ID:</strong> <code style="font-size: 10px;">${sos.id ? sos.id.substring(0, 12) + '...' : 'N/A'}</code>
          </div>
        </div>
      `
      marker.bindPopup(popup)
      incidentMarkerGroup.addLayer(marker)
    })
  }

  if (showReports.value) {
    reportStore.reports.forEach(rep => {
      if (rep.status === 'resolved' || rep.status === 'dismissed') return

      const coords = BARANGAY_COORDS[rep.barangay] || BARANGAY_COORDS['Tagapo']

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: 5,
        fillColor: '#f59e0b',
        color: '#92400e',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.9
      })

      const popup = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 160px;">
          <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 13px; color: #92400e;">Community Report</h4>
          <div style="font-size: 11px; color: #475569;">
            <strong>Barangay:</strong> ${rep.barangay || 'Unknown'}<br/>
            <strong>Category:</strong> ${rep.ai_category || 'N/A'}<br/>
            <strong>Priority:</strong> ${rep.ai_priority || 'N/A'}<br/>
            <strong>Status:</strong> ${rep.status}<br/>
            <div style="margin-top: 4px; padding: 4px; background: #fef3c7; border-radius: 4px; font-size: 10px; color: #92400e;">
              "${(rep.raw_description || '').substring(0, 80)}${(rep.raw_description || '').length > 80 ? '...' : ''}"
            </div>
          </div>
        </div>
      `
      marker.bindPopup(popup)
      incidentMarkerGroup.addLayer(marker)
    })
  }
}

function recenterMap() {
  if (map) {
    map.setView(SANTA_ROSA_CENTER, 13)
  }
}

function focusBarangay(barangayName) {
  const spot = barangayDensityMap.value[barangayName]
  if (spot && map) {
    map.setView([spot.coords.lat, spot.coords.lng], 15)
  }
}

watch([showSOS, showReports, showBoundary, barangayDensityMap], () => {
  renderBoundary()
  renderDensityMarkers()
  renderIncidentMarkers()
})

onMounted(async () => {
  if (sosStore.fetchActiveReports) await sosStore.fetchActiveReports()
  if (reportStore.fetchReports) await reportStore.fetchReports()
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="space-y-6 flex flex-col h-full">
    <!-- Top Bar Controls -->
    <div class="p-5 bg-white border border-[#1F3A4B]/15 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm admin-card">
      <div class="flex items-center space-x-5 text-xs font-black text-[#1F3A4B]">
        <span class="text-[#902715] uppercase text-[10px] tracking-wider font-black">Map Layers:</span>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" v-model="showSOS" class="rounded-md accent-[#902715] focus:ring-0 cursor-pointer" />
          <span class="text-[#902715] font-black">SOS Alerts</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" v-model="showReports" class="rounded-md accent-[#8A4B08] focus:ring-0 cursor-pointer" />
          <span class="text-[#8A4B08] font-black">Community Reports</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" v-model="showBoundary" class="rounded-md accent-[#1F3A4B] focus:ring-0 cursor-pointer" />
          <span class="text-[#1F3A4B] font-black">City Boundary</span>
        </label>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="recenterMap"
          class="px-5 py-2.5 rounded-full bg-[#902715] hover:bg-[#a82e1a] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
        >
          Recenter City Map
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
      <!-- Leaflet Map Canvas -->
      <div class="lg:col-span-3 relative rounded-3xl overflow-hidden border border-[#1F3A4B]/15 bg-white min-h-[500px] shadow-sm">
        <div id="hotspot-density-map" class="w-full h-full min-h-[500px] z-10"></div>

        <!-- Legend Overlay -->
        <div class="absolute bottom-5 left-5 bg-white/95 backdrop-blur-xl p-5 rounded-2xl border border-[#1F3A4B]/15 text-xs text-[#0A0A0A] z-20 space-y-3 shadow-xl font-medium">
          <div class="font-black text-[10px] uppercase tracking-wider text-[#902715]">Density Severity</div>
          <div class="flex items-center space-x-2.5">
            <span class="w-4 h-4 rounded-full bg-[#902715] shadow-sm"></span>
            <span class="font-black text-[#902715]">High Risk (&gt;4 incidents)</span>
          </div>
          <div class="flex items-center space-x-2.5">
            <span class="w-4 h-4 rounded-full bg-[#F7FB41] border border-[#8a7e00] shadow-sm"></span>
            <span class="font-black text-[#8A4B08]">Moderate Risk (2–4 incidents)</span>
          </div>
          <div class="flex items-center space-x-2.5">
            <span class="w-4 h-4 rounded-full bg-[#556B2F] shadow-sm"></span>
            <span class="font-black text-[#556B2F]">Low Risk (1 incident)</span>
          </div>
          <div class="border-t border-[#1F3A4B]/15 pt-2.5">
            <div class="font-black text-[10px] uppercase tracking-wider text-[#1F3A4B] mb-1">Incident Markers</div>
            <div class="flex items-center space-x-2.5">
              <span class="w-3.5 h-3.5 rounded-full bg-[#902715] shadow-sm"></span>
              <span class="font-bold">SOS Alert (exact GPS)</span>
            </div>
            <div class="flex items-center space-x-2.5">
              <span class="w-3.5 h-3.5 rounded-full bg-[#8A4B08] shadow-sm"></span>
              <span class="font-bold">Community Report</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Hotspots Ranking Sidebar -->
      <div class="bg-white rounded-3xl border border-[#1F3A4B]/15 p-6 space-y-4 flex flex-col shadow-sm admin-card">
        <div class="flex items-center justify-between border-b border-[#1F3A4B]/15 pb-3.5">
          <h3 class="text-xs font-black uppercase tracking-wider text-[#1F3A4B]">Top Barangay Hotspots</h3>
          <span class="text-[10px] px-3 py-1 rounded-full bg-[#902715] text-white font-black shadow-sm uppercase tracking-wider">
            LIVE DENSITY
          </span>
        </div>

        <div v-if="hotspotList.length === 0" class="p-8 text-center text-[#717171] text-xs flex-1 flex items-center justify-center font-bold">
          No incident density recorded in Santa Rosa barangays.
        </div>

        <div v-else class="space-y-3 overflow-y-auto max-h-[440px] flex-1 pr-1">
          <div
            v-for="(spot, idx) in hotspotList"
            :key="spot.barangay"
            @click="focusBarangay(spot.barangay)"
            class="p-4 rounded-2xl bg-white border border-[#1F3A4B]/15 border-l-4 border-l-[#1F3A4B] hover:border-[#902715] cursor-pointer transition-all space-y-2 hover:translate-x-1 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <span class="w-6 h-6 rounded-full bg-[#1F3A4B] text-[#F7FB41] font-black text-[10px] flex items-center justify-center shadow-sm">
                  #{{ idx + 1 }}
                </span>
                <span class="font-black text-xs text-[#1F3A4B]">{{ spot.barangay }}</span>
              </div>

              <span
                :class="[
                  'px-3 py-1 text-[10px] font-black rounded-full uppercase shadow-sm',
                  spot.total >= 5 ? 'bg-[#902715] text-white' :
                  spot.total >= 2 ? 'bg-[#F7FB41] text-[#0A0A0A] border border-[#8a7e00]' :
                  'bg-[#556B2F] text-white'
                ]"
              >
                {{ spot.total }} Incidents
              </span>
            </div>

            <div class="flex items-center justify-between text-[10px] text-[#717171] font-semibold pt-0.5">
              <span>SOS: <strong class="text-[#902715]">{{ spot.sosCount }}</strong></span>
              <span>Reports: <strong class="text-[#8a7e00]">{{ spot.reportCount }}</strong></span>
              <span class="text-[#1F3A4B] hover:underline font-black">Focus Map →</span>
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

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
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSOSStore } from '@/stores/sosStore'
import { useReportStore } from '@/stores/reportStore'
import santaRosaBoundaries from '@/data/santa_rosa_boundaries.json'
import { BARANGAY_COORDS } from '@/data/barangay_coords'

const router = useRouter()
const sosStore = useSOSStore()
const reportStore = useReportStore()

const showSOS = ref(true)
const showReports = ref(true)
const showBoundary = ref(true)

// Filter out terminal-status items at the source so computed re-evaluation
// reliably excludes them on any status change, not just array replacements.
const activeSOSAlerts = computed(() =>
  sosStore.activeReports.filter(sos => sos.status !== 'resolved')
)

const activeReportsFiltered = computed(() =>
  reportStore.reports.filter(rep => rep.status !== 'resolved' && rep.status !== 'dismissed')
)

let map = null
let boundaryLayerGroup = null
let densityMarkerGroup = null
let incidentMarkerGroup = null

const SANTA_ROSA_CENTER = [14.3157, 121.1122]

// Pre-compute distance (in meters) from each barangay to its nearest neighbor
// so density circles never overlap — each circle is capped to fit its available space.
function degToMeters(dlat, dlng, lat) {
  const latM = 111320
  const lngM = 111320 * Math.cos(lat * Math.PI / 180)
  return Math.sqrt((dlat * latM) ** 2 + (dlng * lngM) ** 2)
}

const nearestNeighborDist = (() => {
  const names = Object.keys(BARANGAY_COORDS)
  const dist = {}
  names.forEach(a => {
    const ca = BARANGAY_COORDS[a]
    let minD = Infinity
    names.forEach(b => {
      if (a === b) return
      const cb = BARANGAY_COORDS[b]
      const d = degToMeters(ca.lat - cb.lat, ca.lng - cb.lng, (ca.lat + cb.lat) / 2)
      if (d < minD) minD = d
    })
    dist[a] = minD
  })
  return dist
})()

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
    activeSOSAlerts.value.forEach(sos => {
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
    activeReportsFiltered.value.forEach(rep => {
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

  // Re-center each density circle at the centroid of its incident coordinates
  // so the circle actually covers where the alerts are, not just the admin center.
  Object.values(mapData).forEach(item => {
    const lats = []
    const lngs = []
    if (showSOS.value) {
      activeSOSAlerts.value.forEach(sos => {
        if ((sos.barangay || 'Tagapo') !== item.barangay) return
        if (sos.latitude != null && sos.longitude != null) {
          lats.push(sos.latitude)
          lngs.push(sos.longitude)
        }
      })
    }
    // Community reports use barangay center coords — add the official center
    // as a weighted anchor so the circle doesn't drift too far from the barangay.
    lats.push(item.coords.lat)
    lngs.push(item.coords.lng)
    if (lats.length > 0) {
      item.coords = {
        lat: lats.reduce((s, v) => s + v, 0) / lats.length,
        lng: lngs.reduce((s, v) => s + v, 0) / lngs.length
      }
    }
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

// Relative time display for popup list items
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - Date.parse(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function renderDensityMarkers() {
  if (!map || !densityMarkerGroup) return
  densityMarkerGroup.clearLayers()

  Object.values(barangayDensityMap.value).forEach(item => {
    if (item.total === 0) return

    const { lat, lng } = item.coords

    // Grow the circle until it touches every related incident marker (SOS GPS
    // coords + community report barangay centers), but don't over-extend
    // beyond the nearest-neighbor gap.
    let farthestM = 0
    if (showSOS.value) {
      activeSOSAlerts.value.forEach(sos => {
        if ((sos.barangay || 'Tagapo') !== item.barangay) return
        if (sos.latitude == null || sos.longitude == null) return
        farthestM = Math.max(farthestM, degToMeters(lat - sos.latitude, lng - sos.longitude, (lat + sos.latitude) / 2))
      })
    }
    if (showReports.value) {
      // Community reports are placed at their barangay center coords
      const reportCoords = BARANGAY_COORDS[item.barangay] || BARANGAY_COORDS['Tagapo']
      farthestM = Math.max(farthestM, degToMeters(lat - reportCoords.lat, lng - reportCoords.lng, (lat + reportCoords.lat) / 2))
    }

    // Size the circle to just cover all related markers (with a small buffer),
    // with a reasonable minimum so a single incident is still visible, and
    // capped at 90 % of the nearest-neighbor gap so circles never overlap.
    const maxRadius = nearestNeighborDist[item.barangay] * 0.9
    const radius = Math.min(maxRadius, Math.max(farthestM * 1.1, 50))

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

    const circle = L.circle([lat, lng], {
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
    // Group SOS alerts by exact coordinates so only signals at the exact same
    // spot cluster together; different locations stay separate.
    const sosByCoord = new Map()
    activeSOSAlerts.value.forEach(sos => {
      if (sos.latitude == null || sos.longitude == null) return
      const key = `${Number(sos.latitude).toFixed(5)},${Number(sos.longitude).toFixed(5)}`
      if (!sosByCoord.has(key)) {
        sosByCoord.set(key, { lat: sos.latitude, lng: sos.longitude, alerts: [] })
      }
      sosByCoord.get(key).alerts.push(sos)
    })

    sosByCoord.forEach((group) => {
      const count = group.alerts.length
      const radius = Math.min(18, 6 + (count - 1) * 2)

      const marker = L.circleMarker([group.lat, group.lng], {
        radius,
        fillColor: '#ef4444',
        color: '#7f1d1d',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.9
      })

      // Show a popup with alert details and a navigation link to the SOS feed.
      // Single SOS shows its individual info; grouped shows a scrollable list.
      const sos = group.alerts[0]
      const popup = count === 1
        ? `
          <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 200px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 13px; color: #991b1b;">SOS Alert</h4>
            <div style="font-size: 11px; color: #475569;">
              <strong>Barangay:</strong> ${sos.barangay || 'Unknown'}<br/>
              <strong>Status:</strong> <span style="color:${sos.status === 'responding' ? '#d97706' : '#64748b'}">${sos.status}</span><br/>
              <strong>Time:</strong> ${timeAgo(sos.created_at)}<br/>
            </div>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <a href="/admin/sos-feed?sos_id=${sos.id}"
               style="display:block;text-align:center;background:#991b1b;color:#fff;padding:6px 12px;border-radius:8px;font-weight:800;font-size:11px;text-decoration:none;">
              View in SOS Feed →
            </a>
          </div>
        `
        : `
          <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 220px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 13px; color: #991b1b;">
              ${group.alerts[0].barangay || 'Unknown'} SOS Alerts <span style="background:#991b1b;color:#fff;padding:0 6px;border-radius:8px;font-size:11px;">${count}</span>
            </h4>
            <div style="font-size: 11px; color: #475569; max-height: 180px; overflow-y: auto;">
              ${group.alerts.map((s, i) => `
                <hr style="margin: 3px 0; border: 0; border-top: 1px solid #e2e8f0;"${i === 0 ? ' hidden' : ''} />
                <a href="/admin/sos-feed?sos_id=${s.id}"
                   style="display:block;margin:2px 0;font-size:10px;color:#1F3A4B;text-decoration:none;padding:3px 6px;border-radius:6px;transition:background 0.15s;"
                   onmouseover="this.style.background='#EEF4FB'" onmouseout="this.style.background=''">
                  <strong>#${i + 1}</strong>
                  · <span style="color:${s.status === 'responding' ? '#d97706' : '#64748b'}">${s.status}</span>
                  · <span style="color:#94a3b8;font-size:9px;">${timeAgo(s.created_at)}</span>
                  <br/><span style="color:#64748b;font-size:8px;">${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}</span>
                </a>
              `).join('')}
            </div>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <a href="/admin/sos-feed?sos_id=${group.alerts.map(s => s.id).join(',')}"
               style="display:block;text-align:center;background:#991b1b;color:#fff;padding:6px 12px;border-radius:8px;font-weight:800;font-size:11px;text-decoration:none;">
              View All in SOS Feed →
            </a>
          </div>
        `
      marker.bindPopup(popup)

      if (count > 1) {
        marker.bindTooltip(String(count), {
          permanent: true,
          direction: 'center',
          className: 'sos-cluster-badge'
        })
      }

      incidentMarkerGroup.addLayer(marker)
    })
  }

  if (showReports.value) {
    // Group community reports by barangay center coordinates so all reports
    // from the same barangay cluster into a single marker (same pattern as SOS).
    const reportsByCoord = new Map()
    activeReportsFiltered.value.forEach(rep => {
      const coords = BARANGAY_COORDS[rep.barangay] || BARANGAY_COORDS['Tagapo']
      const key = `${Number(coords.lat).toFixed(5)},${Number(coords.lng).toFixed(5)}`
      if (!reportsByCoord.has(key)) {
        reportsByCoord.set(key, { lat: coords.lat, lng: coords.lng, reports: [] })
      }
      reportsByCoord.get(key).reports.push(rep)
    })

    reportsByCoord.forEach((group) => {
      const count = group.reports.length
      const radius = Math.min(18, 6 + (count - 1) * 2)

      const marker = L.circleMarker([group.lat, group.lng], {
        radius,
        fillColor: '#f59e0b',
        color: '#92400e',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.9
      })

      // Show a popup with report details and a navigation link.
      // Single report shows its individual info; grouped shows a scrollable list.
      const rep = group.reports[0]
      const popup = count === 1
        ? `
          <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 200px;">
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
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <a href="/admin/community-reports?report_id=${rep.id}"
               style="display:block;text-align:center;background:#92400e;color:#fff;padding:6px 12px;border-radius:8px;font-weight:800;font-size:11px;text-decoration:none;">
              View in Community Reports →
            </a>
          </div>
        `
        : `
          <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 220px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 13px; color: #92400e;">
              ${group.reports[0].barangay || 'Unknown'} Community Reports <span style="background:#92400e;color:#fff;padding:0 6px;border-radius:8px;font-size:11px;">${count}</span>
            </h4>
            <div style="font-size: 11px; color: #475569; max-height: 180px; overflow-y: auto;">
              ${group.reports.map((r, i) => `
                <hr style="margin: 3px 0; border: 0; border-top: 1px solid #e2e8f0;"${i === 0 ? ' hidden' : ''} />
                <a href="/admin/community-reports?report_id=${r.id}"
                   style="display:block;margin:2px 0;font-size:10px;color:#1F3A4B;text-decoration:none;padding:3px 6px;border-radius:6px;transition:background 0.15s;"
                   onmouseover="this.style.background='#FEF3C7'" onmouseout="this.style.background=''">
                  <strong>#${i + 1}</strong>
                  · <span style="color:${r.ai_priority === 'high' || r.ai_priority === 'critical' ? '#dc2626' : '#64748b'}">${r.ai_priority || 'N/A'}</span>
                  · <span style="color:#92400e;font-size:9px;">"${(r.raw_description || '').substring(0, 28)}${(r.raw_description || '').length > 28 ? '...' : ''}"</span>
                  <span style="color:#92400e;font-size:9px;font-weight:700;"> →</span>
                </a>
              `).join('')}
            </div>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <a href="/admin/community-reports?report_id=${group.reports.map(r => r.id).join(',')}"
               style="display:block;text-align:center;background:#92400e;color:#fff;padding:6px 12px;border-radius:8px;font-weight:800;font-size:11px;text-decoration:none;">
              View All in Community Reports →
            </a>
          </div>
        `
      marker.bindPopup(popup)

      if (count > 1) {
        marker.bindTooltip(String(count), {
          permanent: true,
          direction: 'center',
          className: 'report-cluster-badge'
        })
      }

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

<style>
.sos-cluster-badge {
  background: #991b1b !important;
  color: #fff !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  border: 2px solid #fff !important;
  border-radius: 50% !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4) !important;
  padding: 0 !important;
  line-height: 1 !important;
  white-space: nowrap;
}
.leaflet-tooltip-top.sos-cluster-badge::before,
.leaflet-tooltip-bottom.sos-cluster-badge::before,
.sos-cluster-badge::before {
  display: none !important;
}

.report-cluster-badge {
  background: #92400e !important;
  color: #fff !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  border: 2px solid #fff !important;
  border-radius: 50% !important;
  width: 24px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4) !important;
  padding: 0 !important;
  line-height: 1 !important;
  white-space: nowrap;
}
.leaflet-tooltip-top.report-cluster-badge::before,
.leaflet-tooltip-bottom.report-cluster-badge::before,
.report-cluster-badge::before {
  display: none !important;
}
</style>
